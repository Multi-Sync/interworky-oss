import {
  sendPostRequest,
  sendGetRequest,
  sendPutRequest,
} from '../api/baseMethods';
import {
  parseStackTrace,
  extractTopFrame,
  getStackFrameContext,
} from '../performance/stackTraceParser';
import logger from '../logger';
import { ERROR_CODES } from '../errorCodes';

/**
 * Performance Monitoring API
 *
 * Handles communication with interworky-core performance monitoring endpoints.
 * Provides methods for reporting errors and performance data.
 */

/**
 * Transform frontend error format to backend format
 * @param {Object} errorData - Frontend error data
 * @returns {Object|null} Backend-compatible error data or null if invalid
 */
function transformErrorData(errorData) {
  // VALIDATION: Extract and validate message
  let message = errorData.data?.message || '';

  // Handle objects that were stringified incorrectly
  if (typeof message === 'object') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }

  // Skip errors with [object Object] or empty messages
  if (!message || message === '[object Object]' || message.trim() === '') {
    logger.warn(
      ERROR_CODES.PERF_REPORT_FAILED,
      'Skipping error with invalid message',
      {
        message,
        errorType: errorData.type,
      }
    );
    return null;
  }

  // Handle multiple stack sources with fallback
  const stackTrace =
    errorData.data?.stack ||
    errorData.data?.stack_trace ||
    errorData.data?.rawStack ||
    errorData.stack ||
    null;

  // VALIDATION: Require stack trace
  if (!stackTrace) {
    logger.warn(
      ERROR_CODES.PERF_REPORT_FAILED,
      'Skipping error without stack trace',
      {
        message: message.substring(0, 100),
        errorType: errorData.type,
      }
    );
    return null;
  }

  // Parse stack if not already parsed
  let parsedStack = errorData.data?.topFrame || null;
  let stackFrames = errorData.data?.stackFrames || null;

  // If we have a stack but no parsed data, parse it now
  if (stackTrace && !parsedStack) {
    try {
      const parsed = parseStackTrace(stackTrace);
      stackFrames = parsed.frames;
      parsedStack = extractTopFrame(stackTrace);
    } catch (error) {
      logger.warn(
        ERROR_CODES.PERF_REPORT_FAILED,
        'Failed to parse stack trace',
        {
          error: error.message,
        }
      );
    }
  }

  // Extract context information from the top frame
  let frameContext = null;
  if (parsedStack) {
    try {
      frameContext = getStackFrameContext(parsedStack);
    } catch (error) {
      logger.warn(
        ERROR_CODES.PERF_REPORT_FAILED,
        'Failed to extract frame context',
        {
          error: error.message,
        }
      );
    }
  }

  // Extract location from multiple sources with priority:
  // 1. Direct properties (from unhandled errors)
  // 2. Parsed stack frame
  // 3. null
  const sourceFile = errorData.data?.filename || parsedStack?.file || null;

  const lineNumber = errorData.data?.lineno || parsedStack?.line || null;

  const columnNumber = errorData.data?.colno || parsedStack?.column || null;

  const functionName = parsedStack?.function || null;
  const componentName = frameContext?.component || null;

  // Map 'network' to 'network_error' for backwards compatibility
  let errorType = errorData.type || 'console_error';
  if (errorType === 'network') {
    errorType = 'network_error';
  }

  return {
    error_type: errorType,
    severity: errorData.severity || 'medium',
    message: message,

    // Stack trace handling
    stack_trace: stackTrace,

    // Location information with multiple fallback sources
    source_file: sourceFile,
    line_number: lineNumber,
    column_number: columnNumber,

    // Additional context from stack trace
    function_name: functionName,
    component_name: componentName,
    // Standard fields
    url: errorData.url || window.location.href,
    user_agent: errorData.userAgent || navigator.userAgent,
    timestamp: errorData.timestamp || new Date().toISOString(),
    organization_id: errorData.organizationId,
    assistant_id: errorData.assistantId,
    session_id: errorData.sessionId,
    performance_data: errorData.performanceData,
    context: errorData.context || {
      breadcrumbs: [],
      consoleHistory: [],
      pendingRequests: [],
    },

    // Error source detection (interworky_plugin vs client_website)
    error_source: errorData.error_source || {
      origin: 'client_website',
      detected_at: 'transform',
      detection_method: 'fallback',
    },

    metadata: {
      browser_info: {},
      device_info: {},
      custom_data: errorData.data?.custom_data || {},
      stack_frames: stackFrames, // Include full stack frames for analysis
      frame_context: frameContext, // Include frame context
      // PHASE 1: Enhanced stack trace data
      user_code_frame: errorData.data?.userCodeFrame || null, // First non-plugin frame
      error_chain: errorData.data?.errorChain || null, // Error cause chain
      execution_context: errorData.data?.executionContext || null, // Stack depth, iframe, memory
      // PHASE 2: Source map resolved data
      resolved_stack_frames: errorData.data?.resolvedStackFrames || [],
      source_map_resolved: errorData.data?.sourceMapResolved || false,
    },
  };
}

/**
 * Report a single performance error
 * @param {Object} errorData - Error data to report
 * @returns {Promise<Object>} API response
 */
export async function reportPerformanceError(errorData) {
  try {
    const transformedData = transformErrorData(errorData);

    // Skip if error is invalid
    if (!transformedData) {
      logger.warn(
        ERROR_CODES.PERF_REPORT_FAILED,
        'Skipping invalid error - no message or stack trace',
        {
          errorType: errorData.type,
        }
      );
      return { success: true, message: 'Invalid error skipped' };
    }

    const response = await sendPostRequest(
      'api/performance-monitoring/errors',
      transformedData
    );
    return response;
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_REPORT_FAILED,
      'Failed to report performance error',
      {
        error: error.message,
      }
    );
  }
}

/**
 * Report multiple errors in batch
 * @param {Array} errorBatch - Array of error data
 * @returns {Promise<Object>} API response
 */
export async function reportPerformanceBatch(errorBatch) {
  try {
    // Transform all errors to backend format and filter out invalid ones
    const transformedErrors = errorBatch
      .map((error) => transformErrorData(error))
      .filter((error) => error !== null); // Remove invalid errors

    // If no valid errors, skip sending
    if (transformedErrors.length === 0) {
      logger.warn(
        ERROR_CODES.PERF_BATCH_SEND_FAILED,
        'No valid errors to send in batch',
        {
          originalBatchSize: errorBatch.length,
        }
      );
      return { success: true, message: 'No valid errors to send' };
    }

    const response = await sendPostRequest(
      'api/performance-monitoring/errors/batch',
      {
        errors: transformedErrors,
        timestamp: new Date().toISOString(),
        batch_id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
    );
    return response;
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_BATCH_SEND_FAILED,
      'Failed to report performance batch',
      {
        error: error.message,
        batchSize: errorBatch.length,
      }
    );
  }
}

/**
 * Get performance monitoring statistics
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Statistics data
 */
export async function getPerformanceStats(filters = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (filters.organization_id)
      queryParams.append('organization_id', filters.organization_id);
    if (filters.assistant_id)
      queryParams.append('assistant_id', filters.assistant_id);
    if (filters.start_date)
      queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);

    const queryString = queryParams.toString();
    const path = `api/performance-monitoring/stats${queryString ? `?${queryString}` : ''}`;

    const response = await sendGetRequest(path);
    return response;
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_STATS_FAILED,
      'Failed to get performance stats',
      {
        error: error.message,
        filters,
      }
    );
  }
}

/**
 * Get recent errors
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Recent errors data
 */
export async function getRecentErrors(options = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (options.organization_id)
      queryParams.append('organization_id', options.organization_id);
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const queryString = queryParams.toString();
    const path = `api/performance-monitoring/recent${queryString ? `?${queryString}` : ''}`;

    const response = await sendGetRequest(path);
    return response;
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_REPORT_FAILED,
      'Failed to get recent errors',
      {
        error: error.message,
        options,
      }
    );
  }
}

/**
 * Resolve an error
 * @param {string} errorId - Error ID to resolve
 * @param {Object} resolutionData - Resolution data
 * @returns {Promise<Object>} API response
 */
export async function resolveError(errorId, resolutionData) {
  try {
    const response = await sendPutRequest(
      `api/performance-monitoring/errors/${errorId}/resolve`,
      resolutionData
    );
    return response;
  } catch (error) {
    logger.error(ERROR_CODES.PERF_REPORT_FAILED, 'Failed to resolve error', {
      error: error.message,
      errorId,
    });
  }
}

/**
 * Get error by ID
 * @param {string} errorId - Error ID
 * @returns {Promise<Object>} Error data
 */
export async function getErrorById(errorId) {
  try {
    const response = await sendGetRequest(
      `api/performance-monitoring/errors/${errorId}`
    );
    return response;
  } catch (error) {
    logger.error(ERROR_CODES.PERF_REPORT_FAILED, 'Failed to get error by ID', {
      error: error.message,
      errorId,
    });
  }
}

/**
 * Get errors with filtering and pagination
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Paginated errors data
 */
export async function getErrors(filters = {}) {
  try {
    const queryParams = new URLSearchParams();

    // Add filter parameters
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key].toString());
      }
    });

    const queryString = queryParams.toString();
    const path = `api/performance-monitoring/errors${queryString ? `?${queryString}` : ''}`;

    const response = await sendGetRequest(path);
    return response;
  } catch (error) {
    logger.error(ERROR_CODES.PERF_REPORT_FAILED, 'Failed to get errors', {
      error: error.message,
      filters,
    });
  }
}

/**
 * Health check for performance monitoring API
 * @returns {Promise<boolean>} True if API is accessible
 */
export async function checkPerformanceMonitoringHealth() {
  try {
    // Use recent endpoint instead of stats (no date range required)
    const response = await sendGetRequest(
      'api/performance-monitoring/recent?limit=1'
    );
    return response && response.success;
  } catch (error) {
    logger.warn(
      ERROR_CODES.PERF_HEALTH_CHECK_FAILED,
      'Performance monitoring API health check failed',
      {
        error: error.message,
      }
    );
    return false;
  }
}

/**
 * Store error data locally for retry (fallback mechanism)
 * @param {Object} errorData - Error data to store
 */
export function storeErrorForRetry(errorData) {
  try {
    const storageKey = 'interworky_error_retry_queue';
    const existingData = localStorage.getItem(storageKey);
    const retryQueue = existingData ? JSON.parse(existingData) : [];

    // Add error with retry metadata
    retryQueue.push({
      ...errorData,
      retry_count: 0,
      last_retry: new Date().toISOString(),
      stored_at: new Date().toISOString(),
    });

    // Limit queue size
    if (retryQueue.length > 100) {
      retryQueue.splice(0, retryQueue.length - 100);
    }

    localStorage.setItem(storageKey, JSON.stringify(retryQueue));
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_RETRY_QUEUE_FAILED,
      'Failed to store error for retry',
      {
        error: error.message,
      }
    );
  }
}

/**
 * Process retry queue (attempt to send stored errors)
 * @returns {Promise<number>} Number of errors successfully sent
 */
export async function processRetryQueue() {
  try {
    const storageKey = 'interworky_error_retry_queue';
    const existingData = localStorage.getItem(storageKey);

    if (!existingData) return 0;

    const retryQueue = JSON.parse(existingData);

    // Filter errors that haven't exceeded retry limit
    const errorsToRetry = retryQueue.filter((e) => (e.retry_count || 0) < 5);

    if (errorsToRetry.length === 0) {
      // Clean up if all errors exceeded retry limit
      const permanentFailures = retryQueue.filter(
        (e) => (e.retry_count || 0) >= 5
      );
      if (permanentFailures.length > 0) {
        logger.warn(
          ERROR_CODES.PERF_RETRY_QUEUE_FAILED,
          `Discarding ${permanentFailures.length} errors that exceeded retry limit`
        );
      }
      localStorage.removeItem(storageKey);
      return 0;
    }

    try {
      // Use batch endpoint for efficiency
      await reportPerformanceBatch(errorsToRetry);

      // Success - remove successfully sent errors
      const remaining = retryQueue.filter((e) => (e.retry_count || 0) >= 5);
      if (remaining.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(storageKey);
      }

      logger.info(
        'IW-PERF-013',
        `Successfully retried ${errorsToRetry.length} errors`,
        {
          count: errorsToRetry.length,
        }
      );
      return errorsToRetry.length;
    } catch {
      // Failed - increment retry counts
      errorsToRetry.forEach((e) => {
        e.retry_count = (e.retry_count || 0) + 1;
        e.last_retry = new Date().toISOString();
      });

      localStorage.setItem(storageKey, JSON.stringify(retryQueue));
      logger.info('IW-PERF-014', 'Retry batch failed, will retry later', {
        count: errorsToRetry.length,
      });
      return 0;
    }
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_RETRY_QUEUE_FAILED,
      'Failed to process retry queue',
      {
        error: error.message,
      }
    );
    return 0;
  }
}

/**
 * Clear retry queue
 */
export function clearRetryQueue() {
  try {
    localStorage.removeItem('interworky_error_retry_queue');
  } catch (error) {
    logger.error(
      ERROR_CODES.PERF_RETRY_QUEUE_FAILED,
      'Failed to clear retry queue',
      {
        error: error.message,
      }
    );
  }
}

/**
 * Report performance metrics
 * @param {Object} metricsData - Performance metrics data
 * @returns {Promise<Object>} API response
 */
export async function reportPerformanceMetrics(metricsData) {
  try {
    const response = await sendPostRequest(
      'api/performance-monitoring/metrics',
      metricsData
    );
    return response;
  } catch (error) {
    logger.error(
      'IW_PERF_METRICS_API_001',
      'Failed to report performance metrics',
      {
        error: error.message,
      }
    );
  }
}

/**
 * Get performance metrics with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Metrics data
 */
export async function getPerformanceMetrics(filters = {}) {
  try {
    const queryParams = new URLSearchParams();

    // Add filter parameters
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        queryParams.append(key, filters[key].toString());
      }
    });

    const queryString = queryParams.toString();
    const path = `api/performance-monitoring/metrics${queryString ? `?${queryString}` : ''}`;

    const response = await sendGetRequest(path);
    return response;
  } catch (error) {
    logger.error(
      'IW_PERF_METRICS_API_002',
      'Failed to get performance metrics',
      {
        error: error.message,
        filters,
      }
    );
  }
}

/**
 * Get performance metrics summary
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Summary data
 */
export async function getPerformanceMetricsSummary(filters = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (filters.organization_id)
      queryParams.append('organization_id', filters.organization_id);
    if (filters.assistant_id)
      queryParams.append('assistant_id', filters.assistant_id);
    if (filters.start_date)
      queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);

    const queryString = queryParams.toString();
    const path = `api/performance-monitoring/metrics/summary${queryString ? `?${queryString}` : ''}`;

    const response = await sendGetRequest(path);
    return response;
  } catch (error) {
    logger.error(
      'IW_PERF_METRICS_API_003',
      'Failed to get performance metrics summary',
      {
        error: error.message,
        filters,
      }
    );
  }
}

/**
 * Get performance metrics by ID
 * @param {string} metricsId - Metrics ID
 * @returns {Promise<Object>} Metrics data
 */
export async function getPerformanceMetricsById(metricsId) {
  try {
    const response = await sendGetRequest(
      `api/performance-monitoring/metrics/${metricsId}`
    );
    return response;
  } catch (error) {
    logger.error(
      'IW_PERF_METRICS_API_004',
      'Failed to get performance metrics by ID',
      {
        error: error.message,
        metricsId,
      }
    );
  }
}
