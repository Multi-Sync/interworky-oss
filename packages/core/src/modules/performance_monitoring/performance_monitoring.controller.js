const { PerformanceMonitoring, PerformanceMetrics } = require('./performance_monitoring.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const {
  validateErrorReport,
  validateBatchReport,
  validateQueryParams,
  validateErrorResolution,
} = require('./performance_monitoring.validators');
const { processErrorWithDeduplication, bulkProcessErrors } = require('./performance_monitoring.utils');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const OrganizationVersionControl = require('../organization_version_control/organization_version_control.model');

/**
 * Performance Monitoring Controller
 *
 * Handles HTTP requests for performance monitoring operations.
 * Provides clean API endpoints with proper validation and error handling.
 */

/**
 * Report a single error
 * POST /api/performance-monitoring/errors
 */
exports.reportError = asyncHandler(async (req, res) => {
  // Validate request data
  const validation = validateErrorReport(req.body);
  if (!validation.isValid) {
    // throw new HttpError('Validation failed').BadRequest(validation.errors);
    // return success false with 200 status code
    return res.status(200).json({
      success: false,
      errors: validation.errors,
    });
  }

  const errorData = validation.data;
  const batchId = errorData.batch_id || uuidv4();

  // Process error with deduplication (includes sanitization)
  const result = await processErrorWithDeduplication(errorData, PerformanceMonitoring, batchId);

  // Auto-fix: Trigger AI analysis and PR/issue creation if enabled
  console.log('[AutoFix] === AUTO-FIX DECISION TREE START ===');
  console.log('[AutoFix] Checking conditions:', {
    isDuplicate: result.isDuplicate,
    hasOrganizationId: !!errorData.organization_id,
    organizationId: errorData.organization_id,
    errorType: errorData.error_type,
    hasStackTrace: !!errorData.stack_trace,
    hasSourceFile: !!errorData.source_file,
    errorId: result.id,
  });

  // Quality check: Skip auto-fix for low-quality errors
  const hasMinimumQuality =
    errorData.stack_trace || // Has stack trace OR
    errorData.source_file || // Has source file OR
    errorData.error_type !== 'performance_issue'; // Not a performance issue

  // Error source check: Only auto-fix client website errors (not plugin errors)
  const isClientError = errorData.error_source?.origin === 'client_website';

  if (!isClientError) {
    console.log('[AutoFix] ⏭️  Skipping auto-fix - error source is plugin, not client website:', {
      errorSource: errorData.error_source?.origin,
      detectedAt: errorData.error_source?.detected_at,
      detectionMethod: errorData.error_source?.detection_method,
    });
  } else if (!hasMinimumQuality) {
    console.log(
      '[AutoFix] ⏭️  Skipping auto-fix - insufficient quality (no stack trace, no source file, performance issue)',
    );
  }

  if (!result.isDuplicate && errorData.organization_id && hasMinimumQuality && isClientError) {
    console.log('[AutoFix] ✅ Passed all checks (quality + client error) - checking GitHub configuration...');
    try {
      const githubInstallation = await OrganizationVersionControl.findOne({
        organization_id: errorData.organization_id,
      });

      console.log('[AutoFix] GitHub Installation query result:', {
        found: !!githubInstallation,
        organizationId: errorData.organization_id,
        autoFixEnabled: githubInstallation?.auto_fix_enabled,
        hasInstallationId: !!githubInstallation?.github_app_installation_id,
        installationId: githubInstallation?.github_app_installation_id,
        repoFullName: githubInstallation?.github_repo_full_name,
      });

      // Check if auto-fix is enabled AND GitHub is configured
      if (
        githubInstallation?.auto_fix_enabled &&
        githubInstallation?.github_app_installation_id &&
        githubInstallation?.github_repo_full_name
      ) {
        console.log('[AutoFix] ✅ Auto-fix enabled and GitHub configured');
        // Check if error is already being processed or resolved
        if (['carla_fixing', 'pr_created', 'issue_created', 'resolved'].includes(result.status)) {
          console.log(`[AutoFix] ⏭️  Skipping error ${result.id} - already ${result.status}`);
        } else {
          console.log(`[AutoFix] 🚀 Starting auto-fix for error ${result.id}`);
          // Update status to 'carla_fixing' before calling ws-assistant
          await PerformanceMonitoring.findOneAndUpdate(
            { id: result.id },
            { status: 'carla_fixing', updated_at: new Date() },
          );
          console.log(`[AutoFix] ✅ Updated error status to 'carla_fixing'`);

          // Call ws-assistant to analyze error and create PR/issue (don't block response)
          const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;
          console.log(`[AutoFix] 📡 Calling WS-Assistant at ${wsAssistantUrl}/fix-error`);
          console.log(`[AutoFix] Request payload:`, {
            errorId: result.id,
            organizationId: errorData.organization_id,
          });

          axios
            .post(`${wsAssistantUrl}/fix-error`, {
              errorId: result.id,
              organizationId: errorData.organization_id,
            })
            .then(() => {
              console.log(`[AutoFix] ✅ Successfully sent request to WS-Assistant for error ${result.id}`);
            })
            .catch(async err => {
              // Log error and reset status to 'open' on failure
              console.error('[AutoFix] ❌ Failed to trigger auto-fix:', {
                errorMessage: err.message,
                errorCode: err.code,
                errorResponse: err.response?.data,
                errorStatus: err.response?.status,
              });
              await PerformanceMonitoring.findOneAndUpdate(
                { id: result.id },
                { status: 'open', updated_at: new Date() },
              );
              console.log(`[AutoFix] ⚠️  Reset error ${result.id} status to 'open' due to WS-Assistant failure`);
            });

          console.log(`[AutoFix] ✅ Triggered auto-fix for error ${result.id} (async call initiated)`);
        }
      } else {
        // More detailed logging for why auto-fix was skipped
        if (!githubInstallation) {
          console.log(
            `[AutoFix] ❌ Skipping error ${result.id} - No GitHub installation found for organization ${errorData.organization_id}`,
          );
        } else if (!githubInstallation.auto_fix_enabled) {
          console.log(
            `[AutoFix] ❌ Skipping error ${result.id} - Auto-fix disabled (auto_fix_enabled: ${githubInstallation.auto_fix_enabled})`,
          );
        } else if (!githubInstallation.github_app_installation_id) {
          console.log(
            `[AutoFix] ❌ Skipping error ${result.id} - Missing GitHub installation ID (found: ${githubInstallation.github_app_installation_id})`,
          );
        } else if (!githubInstallation.github_repo_full_name) {
          console.log(
            `[AutoFix] ❌ Skipping error ${result.id} - Missing GitHub repo name (found: ${githubInstallation.github_repo_full_name})`,
          );
        }
      }
    } catch (err) {
      // Log error but don't fail the request
      console.error('[AutoFix] ❌ Error in auto-fix process:', {
        errorMessage: err.message,
        errorStack: err.stack,
      });
    }
  } else {
    console.log('[AutoFix] ❌ Failed initial conditions:', {
      reason: result.isDuplicate
        ? 'Error is duplicate'
        : !errorData.organization_id
          ? 'No organization_id'
          : !hasMinimumQuality
            ? 'Low quality error (no stack trace, no source file, or performance issue)'
            : 'Unknown reason',
    });
  }
  console.log('[AutoFix] === AUTO-FIX DECISION TREE END ===\n');

  const statusCode = result.isDuplicate ? 200 : 201;

  res.status(statusCode).json({
    success: true,
    data: {
      id: result.id,
      status: result.status,
      severity: result.severity,
      timestamp: result.timestamp,
    },
  });
});

/**
 * Report multiple errors in batch
 * POST /api/performance-monitoring/errors/batch
 */
exports.reportBatch = asyncHandler(async (req, res) => {
  // Validate batch data
  const validation = validateBatchReport(req.body);
  if (!validation.isValid) {
    throw new HttpError('Validation failed').BadRequest(validation.errors);
  }

  const batchId = validation.data.batch_id || uuidv4();

  // Use optimized bulk processing (fixes N+1 query, parallel execution, and sanitization)
  const result = await bulkProcessErrors(validation.data.errors, PerformanceMonitoring, batchId);

  if (process.env.NODE_ENV === 'test') {
    res.status(201).json({
      success: true,
      data: {
        processed: result.processed.length,
        failed: result.failed,
        batch_id: batchId,
        timestamp: validation.data.timestamp,
        results: result.processed, // Include individual results for debugging
      },
    });
  }
  // Auto-fix: Check each processed error for auto-fix eligibility
  for (let i = 0; i < result.processed.length; i++) {
    const processedError = result.processed[i];
    const originalError = validation.data.errors[i];

    console.log('[AutoFix-Batch] === AUTO-FIX DECISION TREE START ===');
    console.log('[AutoFix-Batch] Checking conditions:', {
      isDuplicate: processedError.isDuplicate,
      hasOrganizationId: !!originalError.organization_id,
      organizationId: originalError.organization_id,
      errorType: originalError.error_type,
      hasStackTrace: !!originalError.stack_trace,
      hasSourceFile: !!originalError.source_file,
      errorId: processedError.id,
    });

    // Quality check: Skip auto-fix for low-quality errors
    const hasMinimumQuality =
      originalError.stack_trace || // Has stack trace OR
      originalError.source_file || // Has source file OR
      originalError.error_type !== 'performance_issue'; // Not a performance issue

    // Error source check: Only auto-fix client website errors (not plugin errors)
    const isClientError = originalError.error_source?.origin === 'client_website';

    if (!isClientError) {
      console.log('[AutoFix-Batch] ⏭️  Skipping auto-fix - error source is plugin, not client website:', {
        errorSource: originalError.error_source?.origin,
        detectedAt: originalError.error_source?.detected_at,
        detectionMethod: originalError.error_source?.detection_method,
      });
    } else if (!hasMinimumQuality) {
      console.log(
        '[AutoFix-Batch] ⏭️  Skipping auto-fix - insufficient quality (no stack trace, no source file, performance issue)',
      );
    }

    // Check auto-fix conditions
    if (!processedError.isDuplicate && originalError.organization_id && hasMinimumQuality && isClientError) {
      console.log('[AutoFix-Batch] ✅ Passed all checks (quality + client error) - checking GitHub configuration...');

      const githubInstallation = await OrganizationVersionControl.findOne({
        organization_id: originalError.organization_id,
      });

      console.log('[AutoFix-Batch] GitHub Installation query result:', {
        found: !!githubInstallation,
        organizationId: originalError.organization_id,
        autoFixEnabled: githubInstallation?.auto_fix_enabled,
        hasInstallationId: !!githubInstallation?.github_app_installation_id,
        repoFullName: githubInstallation?.github_repo_full_name,
      });

      if (
        githubInstallation?.auto_fix_enabled &&
        githubInstallation?.github_app_installation_id &&
        githubInstallation?.github_repo_full_name
      ) {
        console.log('[AutoFix-Batch] ✅ Auto-fix enabled and GitHub configured');

        // Check if error is already being processed
        if (!['carla_fixing', 'pr_created', 'issue_created', 'resolved'].includes(processedError.status)) {
          console.log(`[AutoFix-Batch] 🚀 Starting auto-fix for error ${processedError.id}`);

          // Update status to 'carla_fixing'
          await PerformanceMonitoring.findOneAndUpdate(
            { id: processedError.id },
            { status: 'carla_fixing', updated_at: new Date() },
          );
          console.log(`[AutoFix-Batch] ✅ Updated error status to 'carla_fixing'`);

          // Call WS-Assistant
          const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;
          console.log(`[AutoFix-Batch] 📡 Calling WS-Assistant at ${wsAssistantUrl}/fix-error`);

          axios
            .post(`${wsAssistantUrl}/fix-error`, {
              errorId: processedError.id,
              organizationId: originalError.organization_id,
            })
            .then(() => {
              console.log(
                `[AutoFix-Batch] ✅ Successfully sent request to WS-Assistant for error ${processedError.id}`,
              );
            })
            .catch(async err => {
              console.error('[AutoFix-Batch] ❌ Failed to trigger auto-fix:', {
                errorMessage: err.message,
                errorCode: err.code,
              });
              await PerformanceMonitoring.findOneAndUpdate(
                { id: processedError.id },
                { status: 'open', updated_at: new Date() },
              );
            });

          console.log(`[AutoFix-Batch] ✅ Triggered auto-fix for error ${processedError.id}`);
        } else {
          console.log(`[AutoFix-Batch] ⏭️  Skipping error ${processedError.id} - already ${processedError.status}`);
        }
      } else {
        if (!githubInstallation) {
          console.log(`[AutoFix-Batch] ❌ Skipping - No GitHub installation for org ${originalError.organization_id}`);
        } else if (!githubInstallation.auto_fix_enabled) {
          console.log(`[AutoFix-Batch] ❌ Skipping - Auto-fix disabled`);
        }
      }
    } else {
      console.log('[AutoFix-Batch] ❌ Failed initial conditions:', {
        reason: processedError.isDuplicate
          ? 'Error is duplicate'
          : !originalError.organization_id
            ? 'No organization_id'
            : !hasMinimumQuality
              ? 'Low quality error (no stack trace, no source file, or performance issue)'
              : 'Unknown reason',
      });
    }
    console.log('[AutoFix-Batch] === AUTO-FIX DECISION TREE END ===\n');
  }

  res.status(201).json({
    success: true,
    data: {
      processed: result.processed.length,
      failed: result.failed,
      batch_id: batchId,
      timestamp: validation.data.timestamp,
      results: result.processed, // Include individual results for debugging
    },
  });
});

/**
 * Get errors with filtering and pagination
 * GET /api/performance-monitoring/errors
 */
exports.getErrors = asyncHandler(async (req, res) => {
  // Validate query parameters
  const validation = validateQueryParams(req.query);
  if (!validation.isValid) {
    throw new HttpError('Invalid query parameters').BadRequest(validation.errors);
  }

  const filters = validation.data;

  // Build query
  const query = {};
  if (filters.organization_id) {
    query.organization_id = filters.organization_id;
  }
  if (filters.assistant_id) {
    query.assistant_id = filters.assistant_id;
  }
  if (filters.error_type) {
    query.error_type = filters.error_type;
  }
  if (filters.severity) {
    query.severity = filters.severity;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.start_date && filters.end_date) {
    query.timestamp = {
      $gte: new Date(filters.start_date),
      $lte: new Date(filters.end_date),
    };
  }

  // Always exclude plugin errors (users should never see them)
  query['error_source.origin'] = 'client_website';

  // Get total count
  const total = await PerformanceMonitoring.countDocuments(query);

  // Calculate pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const pages = Math.ceil(total / limit);

  // Get errors
  const errors = await PerformanceMonitoring.find(query)
    .sort({ [filters.sort_by || 'timestamp']: filters.sort_order === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.status(200).json({
    success: true,
    data: errors,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  });
});

/**
 * Get error statistics
 * GET /api/performance-monitoring/errors/stats
 */
exports.getErrorStats = asyncHandler(async (req, res) => {
  const filters = req.query;

  // Require date range for performance reasons (prevent unbounded queries)
  if (!filters.start_date || !filters.end_date) {
    throw new HttpError('start_date and end_date are required for stats queries').BadRequest();
  }

  // Validate date range is not too large (max 90 days)
  const startDate = new Date(filters.start_date);
  const endDate = new Date(filters.end_date);
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

  if (daysDiff > 90) {
    throw new HttpError('Date range cannot exceed 90 days').BadRequest();
  }

  // Build base query
  const baseQuery = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (filters.organization_id) {
    baseQuery.organization_id = filters.organization_id;
  }

  // Always exclude plugin errors (users should never see them)
  baseQuery['error_source.origin'] = 'client_website';

  // Limit for recent errors
  const recentLimit = Math.min(parseInt(filters.recent_limit) || 5, 20);

  // Use aggregation pipeline with limits for better performance
  const [stats] = await PerformanceMonitoring.aggregate([
    { $match: baseQuery },
    {
      $facet: {
        total: [{ $count: 'count' }],
        by_type: [
          { $group: { _id: '$error_type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }, // Limit to top 10 error types
        ],
        by_severity: [{ $group: { _id: '$severity', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        by_status: [{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        recent: [
          { $sort: { timestamp: -1 } },
          { $limit: recentLimit },
          {
            $project: {
              id: 1,
              error_type: 1,
              severity: 1,
              message: 1,
              timestamp: 1,
              status: 1,
            },
          },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      total_errors: stats.total[0]?.count || 0,
      errors_by_type: stats.by_type,
      errors_by_severity: stats.by_severity,
      errors_by_status: stats.by_status,
      recent_errors: stats.recent,
      date_range: {
        start: startDate,
        end: endDate,
      },
      generated_at: new Date(),
    },
  });
});

/**
 * Resolve an error
 * PUT /api/performance-monitoring/errors/:id/resolve
 */
exports.resolveError = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate resolution data
  const validation = validateErrorResolution(req.body);
  if (!validation.isValid) {
    throw new HttpError('Validation failed').BadRequest(validation.errors);
  }

  const resolutionData = validation.data;
  // Find and update error record
  const errorRecord = await PerformanceMonitoring.where({ id: id }).findOne();
  if (!errorRecord) {
    throw new HttpError('Error record not found').NotFound();
  }

  errorRecord.status = resolutionData.status;
  errorRecord.resolved_at = new Date();
  errorRecord.resolved_by = resolutionData.resolved_by;
  errorRecord.resolution_notes = resolutionData.resolution_notes;
  console.log('Updated error record:', errorRecord);
  await errorRecord.save();

  res.status(200).json({
    success: true,
    data: {
      id: errorRecord.id,
      status: errorRecord.status,
      resolved_at: errorRecord.resolved_at,
      resolved_by: errorRecord.resolved_by,
    },
  });
});

/**
 * Get error by ID
 * GET /api/performance-monitoring/errors/:id
 */
exports.getErrorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const errorRecord = await PerformanceMonitoring.findOne({ id }).lean();

  if (!errorRecord) {
    throw new HttpError('Error record not found').NotFound();
  }

  res.status(200).json({
    success: true,
    data: errorRecord,
  });
});

/**
 * Get recent errors
 * GET /api/performance-monitoring/errors/recent
 */
exports.getRecentErrors = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const organization_id = req.query.organization_id;

  const query = {};
  if (organization_id) {
    query.organization_id = organization_id;
  }

  // Always exclude plugin errors (users should never see them)
  query['error_source.origin'] = 'client_website';

  const recentErrors = await PerformanceMonitoring.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('id error_type severity message timestamp status organization_id assistant_id')
    .lean();

  res.status(200).json({
    success: true,
    data: recentErrors,
  });
});

/**
 * Fix error with Carla
 * POST /api/performance-monitoring/errors/:id/fix-with-carla
 */
exports.fixWithCarla = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find error
  const errorRecord = await PerformanceMonitoring.findOne({ id });
  if (!errorRecord) {
    throw new HttpError('Error record not found').NotFound();
  }

  // Check if error is already being processed or resolved
  if (['carla_fixing', 'pr_created', 'issue_created', 'resolved'].includes(errorRecord.status)) {
    return res.status(400).json({
      success: false,
      error: `Error is already ${errorRecord.status}`,
      data: {
        status: errorRecord.status,
        carla_analysis: errorRecord.carla_analysis,
      },
    });
  }

  // Start async fix process (don't wait for it)
  const WS_ASSISTANT_URL = process.env.WS_ASSISTANT_HTTP_URL;
  axios
    .post(`${WS_ASSISTANT_URL}/fix-error`, {
      errorId: id,
      organizationId: errorRecord.organization_id,
      errorData: {
        message: errorRecord.message,
        stack: errorRecord.stack_trace,
        type: errorRecord.error_type,
        severity: errorRecord.severity,
        file_path: errorRecord.source_file,
        line_number: errorRecord.line_number,
        column_number: errorRecord.column_number,
      },
    })
    .catch(err => console.error('[FixWithCarla] Error calling ws-assistant:', err));

  // Return immediately
  res.status(202).json({
    success: true,
    message: 'Carla is analyzing the error and will create a PR or issue',
    data: {
      id: errorRecord.id,
      status: 'carla_fixing',
    },
  });
});

/**
 * Update error status
 * PUT /api/performance-monitoring/errors/:id/status
 */
exports.updateErrorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, carla_analysis } = req.body;

  // Find error record
  const errorRecord = await PerformanceMonitoring.findOne({ id });
  if (!errorRecord) {
    throw new HttpError('Error record not found').NotFound();
  }

  // Update status if provided
  if (status) {
    // Validate status enum
    const validStatuses = [
      'new',
      'processing',
      'resolved',
      'ignored',
      'duplicate',
      'carla_fixing',
      'pr_created',
      'issue_created',
      'fix_failed',
    ];

    if (!validStatuses.includes(status)) {
      throw new HttpError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`).BadRequest();
    }

    errorRecord.status = status;
  }

  // Update carla_analysis if provided
  if (carla_analysis) {
    errorRecord.carla_analysis = {
      ...errorRecord.carla_analysis,
      ...carla_analysis,
    };
  }

  await errorRecord.save();

  res.status(200).json({
    success: true,
    data: {
      id: errorRecord.id,
      status: errorRecord.status,
      carla_analysis: errorRecord.carla_analysis,
    },
  });
});

/**
 * Delete an error and all its occurrences
 * DELETE /api/performance-monitoring/errors/:id
 */
exports.deleteError = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find error record
  const errorRecord = await PerformanceMonitoring.findOne({ id });
  if (!errorRecord) {
    throw new HttpError('Error record not found').NotFound();
  }

  // Get error hash to find all occurrences
  const errorHash = errorRecord.error_hash;

  // Delete all errors with the same hash (all occurrences)
  const deleteResult = await PerformanceMonitoring.deleteMany({
    error_hash: errorHash,
    organization_id: errorRecord.organization_id,
  });

  res.status(200).json({
    success: true,
    message: 'Error and all its occurrences deleted successfully',
    data: {
      id,
      deleted_count: deleteResult.deletedCount,
    },
  });
});

/**
 * Get fix progress for an error
 * GET /api/performance-monitoring/errors/:id/fix-progress
 */
// exports.getFixProgress = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const progress = progressStore.getProgress(id);

//   if (!progress) {
//     return res.status(404).json({
//       success: false,
//       error: 'No active fix process found for this error',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: progress,
//   });
// });

/**
 * ========================================
 * PERFORMANCE METRICS ENDPOINTS
 * ========================================
 */

/**
 * Report performance metrics
 * POST /api/performance-monitoring/metrics
 */
exports.reportMetrics = asyncHandler(async (req, res) => {
  const { metrics, timestamp, organization_id, assistant_id, session_id, url } = req.body;

  // Validate required fields
  if (!organization_id || !assistant_id || !session_id || !url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: organization_id, assistant_id, session_id, url',
    });
  }

  // Create new performance metrics record
  const metricsRecord = new PerformanceMetrics({
    organization_id,
    assistant_id,
    session_id,
    url,
    timestamp: timestamp || new Date(),

    // Core Web Vitals
    core_web_vitals: metrics.coreWebVitals || {},

    // Loading Performance
    loading_performance: metrics.loadingPerformance || {},

    // Next.js Specific
    nextjs_specific: metrics.nextjsSpecific || {},

    // Resource Metrics
    resources: metrics.resources || {},

    // Runtime Metrics
    runtime: metrics.runtime || {},

    // Network Metrics
    network: metrics.network || {},

    // Image Metrics
    images: metrics.images || {},

    // Mobile Metrics
    mobile: metrics.mobile || {},

    // Accessibility Metrics
    accessibility: metrics.accessibility || {},

    // Context
    device: metrics.device || {},
    browser: metrics.browser || {},
    network_info: metrics.networkInfo || {},
    location: metrics.location || {},

    // Score and Issues
    score: metrics.score || 0,
    issues: metrics.issues || [],

    // Resource Issues
    resource_issues: metrics.resourceIssues || [],
    resource_summary: metrics.resourceSummary || {
      total: 0,
      by_severity: { high: 0, medium: 0, low: 0 },
      total_wasted_bytes: 0,
      top_recommendations: [],
    },
  });

  await metricsRecord.save();

  res.status(201).json({
    success: true,
    message: 'Performance metrics reported successfully',
    data: {
      id: metricsRecord.id,
      score: metricsRecord.score,
      grade: metricsRecord.getGrade(),
    },
  });
});

/**
 * Get performance metrics with filtering
 * GET /api/performance-monitoring/metrics
 */
exports.getMetrics = asyncHandler(async (req, res) => {
  const {
    organization_id,
    assistant_id,
    session_id,
    device_type,
    browser,
    network_type,
    country_code,
    start_date,
    end_date,
    min_score,
    max_score,
    limit = 100,
    offset = 0,
  } = req.query;

  // Build query
  const query = {};

  if (organization_id) query.organization_id = organization_id;
  if (assistant_id) query.assistant_id = assistant_id;
  if (session_id) query.session_id = session_id;
  if (device_type) query['device.device_type'] = device_type;
  if (browser) query['browser.name'] = browser;
  if (network_type) query['network_info.effective_type'] = network_type;
  if (country_code) query['location.country_code'] = country_code;

  // Date range
  if (start_date || end_date) {
    query.timestamp = {};
    if (start_date) query.timestamp.$gte = new Date(start_date);
    if (end_date) query.timestamp.$lte = new Date(end_date);
  }

  // Score range
  if (min_score || max_score) {
    query.score = {};
    if (min_score) query.score.$gte = parseInt(min_score);
    if (max_score) query.score.$lte = parseInt(max_score);
  }

  // Execute query with pagination
  const [metrics, total] = await Promise.all([
    PerformanceMetrics.find(query).sort({ timestamp: -1 }).limit(parseInt(limit)).skip(parseInt(offset)),
    PerformanceMetrics.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      metrics: metrics, // Return full metrics instead of summary for frontend components
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    },
  });
});

/**
 * Get performance metrics summary/statistics
 * GET /api/performance-monitoring/metrics/summary
 */
exports.getMetricsSummary = asyncHandler(async (req, res) => {
  const { organization_id, assistant_id, start_date, end_date } = req.query;

  // Build base query
  const query = {};
  if (organization_id) query.organization_id = organization_id;
  if (assistant_id) query.assistant_id = assistant_id;

  // Date range
  if (start_date || end_date) {
    query.timestamp = {};
    if (start_date) query.timestamp.$gte = new Date(start_date);
    if (end_date) query.timestamp.$lte = new Date(end_date);
  }

  // Get summary statistics
  const [metrics, deviceBreakdown, browserBreakdown, countryBreakdown] = await Promise.all([
    // Overall metrics
    PerformanceMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avg_score: { $avg: '$score' },
          avg_fcp: { $avg: '$core_web_vitals.fcp' },
          avg_lcp: { $avg: '$core_web_vitals.lcp' },
          avg_cls: { $avg: '$core_web_vitals.cls' },
          avg_ttfb: { $avg: '$core_web_vitals.ttfb' },
          avg_load_time: { $avg: '$loading_performance.total_load_time' },
          total_samples: { $sum: 1 },
        },
      },
    ]),

    // Device breakdown
    PerformanceMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$device.device_type',
          count: { $sum: 1 },
          avg_score: { $avg: '$score' },
        },
      },
    ]),

    // Browser breakdown
    PerformanceMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$browser.name',
          count: { $sum: 1 },
          avg_score: { $avg: '$score' },
        },
      },
    ]),

    // Country breakdown
    PerformanceMetrics.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$location.country_code',
          count: { $sum: 1 },
          avg_score: { $avg: '$score' },
        },
      },
      { $limit: 10 },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: metrics[0] || {},
      by_device: deviceBreakdown,
      by_browser: browserBreakdown,
      by_country: countryBreakdown,
    },
  });
});

/**
 * Get performance metrics by ID
 * GET /api/performance-monitoring/metrics/:id
 */
exports.getMetricsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const metrics = await PerformanceMetrics.findOne({ id });

  if (!metrics) {
    throw new HttpError('Performance metrics not found').NotFound();
  }

  res.status(200).json({
    success: true,
    data: metrics,
  });
});
