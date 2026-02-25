/**
 * Performance Monitoring Utilities
 *
 * Utility functions for performance monitoring operations:
 * - Data transformation and formatting
 * - Error classification helpers
 * - Performance metrics calculation
 * - Browser/device detection
 */

const crypto = require('crypto');

/**
 * Normalize error message for deduplication
 * Removes variable parts (numbers, timestamps) to group similar errors
 * @param {string} message - Error message
 * @param {string} errorType - Error type
 * @returns {string} Normalized message
 */
function normalizeErrorMessage(message, errorType) {
  if (!message) return '';

  let normalized = message;

  // Performance issues: Remove specific milliseconds
  if (errorType === 'performance_issue') {
    // "Long task detected: 73ms" → "Long task detected: Xms"
    normalized = normalized.replace(/:\s*\d+(\.\d+)?(ms|s|bytes|MB|KB)/gi, ': X$2');
    // "Memory usage: 150MB" → "Memory usage: XMB"
    // "Load time: 2.5s" → "Load time: Xs"
  }

  // Network errors: Remove specific URLs/ports
  if (errorType === 'network_error') {
    // Keep domain but remove query params
    normalized = normalized.replace(/https?:\/\/[^\s]+/g, url => {
      try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch {
        return url;
      }
    });
  }

  // Remove timestamps
  normalized = normalized.replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP');

  // Remove UUID/session IDs
  normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID');

  return normalized;
}

/**
 * Generate error hash for deduplication
 * @param {Object} errorData - Error data object
 * @returns {string} MD5 hash for deduplication
 */
function generateErrorHash(errorData) {
  try {
    // Normalize message to group similar errors
    const normalizedMessage = normalizeErrorMessage(errorData.message, errorData.error_type);

    // Include error type for better grouping
    const hashString = `${errorData.error_type}-${normalizedMessage}-${errorData.source_file || ''}-${errorData.line_number || ''}-${errorData.organization_id}`;
    return crypto.createHash('md5').update(hashString).digest('hex');
  } catch (error) {
    console.error('Failed to generate error hash:', error);
    return 'unknown';
  }
}

/**
 * Determine severity based on error data
 * @param {Object} errorData - Error data object
 * @returns {string} Severity level (low, medium, high, critical)
 */
function determineSeverity(errorData) {
  const message = (errorData.message || '').toLowerCase();
  const errorType = errorData.error_type || '';

  // Critical patterns in message
  const criticalPatterns = ['security', 'vulnerability', 'critical', 'fatal', 'crash', 'memory leak', 'out of memory'];
  if (criticalPatterns.some(pattern => message.includes(pattern))) {
    return 'critical';
  }

  // High severity error types (unhandled exceptions, promise rejections)
  if (errorType === 'unhandled_exception' || errorType === 'promise_rejection') {
    return 'high';
  }

  // High severity patterns in message
  const highPatterns = ['unhandled', 'exception', 'uncaught', 'failed', 'timeout', 'network error'];
  if (highPatterns.some(pattern => message.includes(pattern))) {
    return 'high';
  }

  // Medium severity error types (console errors, resource errors, performance issues)
  if (errorType === 'console_error' || errorType === 'resource_error' || errorType === 'performance_issue') {
    return 'medium';
  }

  // Low severity error types (warnings)
  if (errorType === 'console_warn') {
    return 'low';
  }

  // Low severity patterns in message
  const lowPatterns = ['warning', 'deprecated', 'info', 'debug'];
  if (lowPatterns.some(pattern => message.includes(pattern))) {
    return 'low';
  }

  // Default to medium for unknown cases
  return 'medium';
}

/**
 * Process a single error with deduplication
 * @param {Object} errorData - Error data object
 * @param {Object} PerformanceMonitoring - Mongoose model
 * @param {string} batchId - Optional batch ID
 * @returns {Promise<Object>} Processed error result
 */
async function processErrorWithDeduplication(errorData, PerformanceMonitoring, batchId = null) {
  const errorHash = generateErrorHash(errorData);

  // Check for existing similar errors
  const existingError = await PerformanceMonitoring.findOne({
    error_hash: errorHash,
    organization_id: errorData.organization_id,
    status: { $ne: 'resolved' },
  });

  if (existingError) {
    // Update existing error count
    existingError.timestamp = new Date();
    existingError.updated_at = new Date();
    if (!existingError.metadata) {
      existingError.metadata = {};
    }
    if (!existingError.metadata.custom_data) {
      existingError.metadata.custom_data = {};
    }
    existingError.metadata.custom_data.occurrence_count =
      (existingError.metadata.custom_data.occurrence_count || 1) + 1;

    await existingError.save();

    return {
      id: existingError.id,
      status: existingError.status,
      severity: existingError.severity,
      timestamp: existingError.timestamp,
      isDuplicate: true,
    };
  }

  // Determine severity if not provided
  const severity = errorData.severity || determineSeverity(errorData);

  // Sanitize error data before creating
  const sanitizedData = sanitizeErrorData(errorData);

  // Create new error record
  const errorRecord = new PerformanceMonitoring({
    ...sanitizedData,
    severity,
    error_hash: errorHash,
    batch_id: batchId || errorData.batch_id,
  });

  const savedRecord = await errorRecord.save();

  return {
    id: savedRecord.id,
    status: savedRecord.status,
    severity: savedRecord.severity,
    timestamp: savedRecord.timestamp,
    isDuplicate: false,
  };
}

/**
 * Bulk process errors with deduplication (optimized to avoid N+1 queries)
 * @param {Array} errors - Array of error data objects
 * @param {Object} PerformanceMonitoring - Mongoose model
 * @param {string} batchId - Batch ID for grouping
 * @returns {Promise<Object>} Processing results
 */
async function bulkProcessErrors(errors, PerformanceMonitoring, batchId) {
  // Generate hashes for all errors
  const errorHashes = errors.map(errorData => ({
    hash: generateErrorHash(errorData),
    orgId: errorData.organization_id,
    data: errorData,
  }));

  // Fetch all existing errors in one query
  const existingErrors = await PerformanceMonitoring.find({
    error_hash: { $in: errorHashes.map(e => e.hash) },
    status: { $ne: 'resolved' },
  }).lean();

  // Create a map for quick lookup
  const existingErrorMap = new Map();
  existingErrors.forEach(err => {
    const key = `${err.error_hash}-${err.organization_id}`;
    existingErrorMap.set(key, err);
  });

  // Process errors in parallel
  const results = await Promise.allSettled(
    errorHashes.map(async ({ hash, orgId, data }) => {
      const key = `${hash}-${orgId}`;
      const existing = existingErrorMap.get(key);

      if (existing) {
        // Update existing error
        const updated = await PerformanceMonitoring.findByIdAndUpdate(
          existing._id,
          {
            timestamp: new Date(),
            updated_at: new Date(),
            $inc: { 'metadata.custom_data.occurrence_count': 1 },
          },
          { new: true },
        );

        return {
          id: updated.id,
          status: updated.status,
          severity: updated.severity,
          timestamp: updated.timestamp,
          isDuplicate: true,
        };
      } else {
        // Create new error
        const severity = data.severity || determineSeverity(data);
        const sanitizedData = sanitizeErrorData(data);

        const errorRecord = new PerformanceMonitoring({
          ...sanitizedData,
          severity,
          error_hash: hash,
          batch_id: batchId,
        });

        const savedRecord = await errorRecord.save();

        return {
          id: savedRecord.id,
          status: savedRecord.status,
          severity: savedRecord.severity,
          timestamp: savedRecord.timestamp,
          isDuplicate: false,
        };
      }
    }),
  );

  // Separate successful and failed results
  const processed = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const failed = results.filter(r => r.status === 'rejected');

  return {
    processed,
    failed: failed.length,
    total: errors.length,
  };
}

/**
 * Parse browser information from user agent string
 * @param {string} userAgent - User agent string
 * @returns {Object} Browser information
 */
function parseBrowserInfo(userAgent) {
  const browserInfo = {
    name: 'Unknown',
    version: 'Unknown',
    platform: 'Unknown',
  };

  try {
    // Chrome detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      browserInfo.name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }
    // Firefox detection
    else if (userAgent.includes('Firefox')) {
      browserInfo.name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }
    // Safari detection
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo.name = 'Safari';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }
    // Edge detection
    else if (userAgent.includes('Edge')) {
      browserInfo.name = 'Edge';
      const match = userAgent.match(/Edge\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }

    // Platform detection
    if (userAgent.includes('Windows')) {
      browserInfo.platform = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      browserInfo.platform = 'macOS';
    } else if (userAgent.includes('Linux')) {
      browserInfo.platform = 'Linux';
    } else if (userAgent.includes('Android')) {
      browserInfo.platform = 'Android';
    } else if (userAgent.includes('iOS')) {
      browserInfo.platform = 'iOS';
    }
  } catch (error) {
    console.error('Failed to parse browser info:', error);
  }

  return browserInfo;
}

/**
 * Parse device information from user agent and screen data
 * @param {string} userAgent - User agent string
 * @param {Object} screenData - Screen dimensions and other data
 * @returns {Object} Device information
 */
function parseDeviceInfo(userAgent, screenData = {}) {
  const deviceInfo = {
    type: 'desktop',
    screen_resolution: 'Unknown',
    viewport_size: 'Unknown',
  };

  try {
    // Device type detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      deviceInfo.type = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceInfo.type = 'tablet';
    }

    // Screen resolution
    if (screenData.width && screenData.height) {
      deviceInfo.screen_resolution = `${screenData.width}x${screenData.height}`;
    }

    // Viewport size
    if (screenData.viewportWidth && screenData.viewportHeight) {
      deviceInfo.viewport_size = `${screenData.viewportWidth}x${screenData.viewportHeight}`;
    }
  } catch (error) {
    console.error('Failed to parse device info:', error);
  }

  return deviceInfo;
}

/**
 * Calculate performance metrics from browser performance API
 * @param {Object} performanceData - Raw performance data
 * @returns {Object} Calculated performance metrics
 */
function calculatePerformanceMetrics(performanceData) {
  const metrics = {
    load_time: null,
    memory_usage: null,
    network_requests: null,
    dom_elements: null,
    js_heap_size: null,
    js_heap_used: null,
  };

  try {
    // Load time calculation
    if (performanceData.timing) {
      const timing = performanceData.timing;
      metrics.load_time = timing.loadEventEnd - timing.navigationStart;
    }

    // Memory usage
    if (performanceData.memory) {
      metrics.js_heap_size = performanceData.memory.jsHeapSizeLimit;
      metrics.js_heap_used = performanceData.memory.usedJSHeapSize;
      metrics.memory_usage = performanceData.memory.totalJSHeapSize;
    }

    // Network requests count
    if (performanceData.resources) {
      metrics.network_requests = performanceData.resources.length;
    }

    // DOM elements count
    if (performanceData.domElements) {
      metrics.dom_elements = performanceData.domElements;
    }
  } catch (error) {
    console.error('Failed to calculate performance metrics:', error);
  }

  return metrics;
}

/**
 * Sanitize error data to remove sensitive information
 * @param {Object} errorData - Raw error data
 * @returns {Object} Sanitized error data
 */
function sanitizeErrorData(errorData) {
  const sanitized = { ...errorData };

  try {
    // Remove potential sensitive data from URLs
    if (sanitized.url) {
      sanitized.url = sanitized.url.replace(/[?&](token|key|password|secret)=[^&]*/gi, '');
    }

    // Truncate long messages
    if (sanitized.message && sanitized.message.length > 2000) {
      sanitized.message = sanitized.message.substring(0, 2000) + '...';
    }

    // Truncate long stack traces
    if (sanitized.stack_trace && sanitized.stack_trace.length > 10000) {
      sanitized.stack_trace = sanitized.stack_trace.substring(0, 10000) + '...';
    }

    // Remove sensitive data from custom_data
    if (sanitized.metadata && sanitized.metadata.custom_data) {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
      sensitiveKeys.forEach(key => {
        if (sanitized.metadata.custom_data[key]) {
          delete sanitized.metadata.custom_data[key];
        }
      });
    }
  } catch (error) {
    console.error('Failed to sanitize error data:', error);
  }

  return sanitized;
}

/**
 * Generate error fingerprint for grouping similar errors
 * @param {Object} errorData - Error data
 * @returns {string} Error fingerprint
 */
function generateErrorFingerprint(errorData) {
  try {
    const fingerprint = {
      message: errorData.message,
      source_file: errorData.source_file,
      line_number: errorData.line_number,
      error_type: errorData.error_type,
    };

    return JSON.stringify(fingerprint);
  } catch (error) {
    console.error('Failed to generate error fingerprint:', error);
    return errorData?.message || 'unknown';
  }
}

/**
 * Format error for display in UI
 * @param {Object} errorRecord - Error record from database
 * @returns {Object} Formatted error for display
 */
function formatErrorForDisplay(errorRecord) {
  try {
    return {
      id: errorRecord.id,
      type: errorRecord.error_type,
      severity: errorRecord.severity,
      message: errorRecord.message,
      source: errorRecord.source_file,
      line: errorRecord.line_number,
      timestamp: errorRecord.timestamp,
      status: errorRecord.status,
      url: errorRecord.url,
      browser: errorRecord.metadata?.browser_info?.name || 'Unknown',
      device: errorRecord.metadata?.device_info?.type || 'Unknown',
      organization_id: errorRecord.organization_id,
      assistant_id: errorRecord.assistant_id,
    };
  } catch (error) {
    console.error('Failed to format error for display:', error);
    return errorRecord;
  }
}

/**
 * Calculate error rate for time period
 * @param {Array} errors - Array of error records
 * @param {number} timeWindowMs - Time window in milliseconds
 * @returns {number} Error rate per minute
 */
function calculateErrorRate(errors, timeWindowMs = 60000) {
  try {
    if (!errors || errors.length === 0) return 0;

    const now = new Date();
    const timeWindowStart = new Date(now.getTime() - timeWindowMs);

    const recentErrors = errors.filter(error => new Date(error.timestamp) >= timeWindowStart);

    return (recentErrors.length / (timeWindowMs / 60000)).toFixed(2);
  } catch (error) {
    console.error('Failed to calculate error rate:', error);
    return 0;
  }
}

/**
 * Group errors by time period for trend analysis
 * @param {Array} errors - Array of error records
 * @param {string} period - Time period ('hour', 'day', 'week')
 * @returns {Array} Grouped error data
 */
function groupErrorsByTimePeriod(errors, period = 'hour') {
  try {
    const groups = {};

    errors.forEach(error => {
      const timestamp = new Date(error.timestamp);
      let key;

      switch (period) {
        case 'hour':
          key = timestamp.toISOString().substring(0, 13) + ':00:00.000Z';
          break;
        case 'day':
          key = timestamp.toISOString().substring(0, 10) + 'T00:00:00.000Z';
          break;
        case 'week': {
          const weekStart = new Date(timestamp);
          weekStart.setDate(timestamp.getDate() - timestamp.getDay());
          key = weekStart.toISOString().substring(0, 10) + 'T00:00:00.000Z';
          break;
        }
        default:
          key = timestamp.toISOString().substring(0, 13) + ':00:00.000Z';
      }

      if (!groups[key]) {
        groups[key] = {
          timestamp: key,
          count: 0,
          errors: [],
        };
      }

      groups[key].count++;
      groups[key].errors.push(error);
    });

    return Object.values(groups).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (error) {
    console.error('Failed to group errors by time period:', error);
    return [];
  }
}

module.exports = {
  generateErrorHash,
  determineSeverity,
  processErrorWithDeduplication,
  bulkProcessErrors,
  parseBrowserInfo,
  parseDeviceInfo,
  calculatePerformanceMetrics,
  sanitizeErrorData,
  generateErrorFingerprint,
  formatErrorForDisplay,
  calculateErrorRate,
  groupErrorsByTimePeriod,
};
