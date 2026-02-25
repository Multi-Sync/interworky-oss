const Joi = require('joi');

/**
 * Validation schemas for performance monitoring
 *
 * Provides comprehensive validation for error reports,
 * batch operations, and query parameters.
 */

// Single error report validation
const errorReportSchema = Joi.object({
  error_type: Joi.string()
    .valid(
      'console_error',
      'console_warn',
      'console_log',
      'unhandled_exception',
      'promise_rejection',
      'resource_error',
      'performance_issue',
      'network_error',
    )
    .required(),

  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),

  message: Joi.string().max(2000).required(),
  stack_trace: Joi.string().max(10000).allow(null).optional(),
  source_file: Joi.string().max(500).allow(null).optional(),
  line_number: Joi.number().min(0).allow(null).optional(),
  column_number: Joi.number().min(0).allow(null).optional(),

  // Enhanced stack trace fields
  function_name: Joi.string().max(200).allow(null).optional(),
  component_name: Joi.string().max(200).allow(null).optional(),

  url: Joi.string().max(2000).required(),
  user_agent: Joi.string().max(1000).required(),
  timestamp: Joi.date()
    .iso()
    .default(() => new Date()),

  organization_id: Joi.string().required(),
  assistant_id: Joi.string().required(),
  session_id: Joi.string().required(),

  performance_data: Joi.object({
    load_time: Joi.number().min(0).optional(),
    memory_usage: Joi.number().min(0).allow(null).optional(),
    network_requests: Joi.number().min(0).optional(),
    dom_elements: Joi.number().min(0).optional(),
    js_heap_size: Joi.number().min(0).allow(null).optional(),
    js_heap_used: Joi.number().min(0).allow(null).optional(),
    connection_type: Joi.string().optional(),
    connection_speed: Joi.alternatives().try(Joi.number().min(0), Joi.string()).optional(),
  })
    .allow(null)
    .optional()
    .unknown(true),

  context: Joi.object({
    breadcrumbs: Joi.array().allow(null).optional(),
    consoleHistory: Joi.array().allow(null).optional(),
    pendingRequests: Joi.array().allow(null).optional(),
    environment: Joi.object().allow(null).optional().unknown(true),
  })
    .allow(null)
    .optional()
    .unknown(true),

  metadata: Joi.object({
    browser_info: Joi.object({
      name: Joi.string().optional(),
      version: Joi.string().optional(),
      platform: Joi.string().optional(),
    })
      .allow(null)
      .optional()
      .unknown(true),
    device_info: Joi.object({
      type: Joi.string().optional(),
      screen_resolution: Joi.string().optional(),
      viewport_size: Joi.string().optional(),
    })
      .allow(null)
      .optional()
      .unknown(true),
    custom_data: Joi.object().allow(null).optional().unknown(true).default({}),
    // Enhanced stack trace metadata
    stack_frames: Joi.array()
      .items(
        Joi.object({
          function: Joi.string().allow(null).optional(),
          file: Joi.string().allow(null).optional(),
          line: Joi.number().allow(null).optional(),
          column: Joi.number().allow(null).optional(),
          raw: Joi.string().allow(null).optional(),
        }).unknown(true),
      )
      .allow(null)
      .optional(),
    frame_context: Joi.object({
      component: Joi.string().allow(null).optional(),
      module: Joi.string().allow(null).optional(),
      isUserCode: Joi.boolean().allow(null).optional(),
    })
      .allow(null)
      .optional()
      .unknown(true),
  })
    .allow(null)
    .optional()
    .unknown(true),

  // Error source detection
  error_source: Joi.object({
    origin: Joi.string().valid('interworky_plugin', 'client_website').default('client_website'),
    detected_at: Joi.string().max(100).allow(null).optional(),
    detection_method: Joi.string().max(100).allow(null).optional(),
  })
    .allow(null)
    .optional()
    .unknown(true),

  batch_id: Joi.string().optional(),
});

// Batch error report validation
const batchReportSchema = Joi.object({
  errors: Joi.array().items(errorReportSchema).min(1).max(50).required(),
  timestamp: Joi.date()
    .iso()
    .default(() => new Date()),
  batch_id: Joi.string().optional(),
});

// Query parameters validation
const queryParamsSchema = Joi.object({
  organization_id: Joi.string().optional(),
  assistant_id: Joi.string().optional(),
  error_type: Joi.string()
    .valid(
      'console_error',
      'console_warn',
      'console_log',
      'unhandled_exception',
      'promise_rejection',
      'resource_error',
      'performance_issue',
      'network_error',
    )
    .optional(),

  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  status: Joi.string().valid('new', 'processing', 'resolved', 'ignored', 'duplicate').optional(),

  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),

  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort_by: Joi.string().valid('timestamp', 'severity', 'status').default('timestamp'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),

  // Filter for including/excluding plugin errors
  include_plugin_errors: Joi.string().valid('true', 'false').optional(),
});

// Error resolution validation
const errorResolutionSchema = Joi.object({
  status: Joi.string().valid('resolved', 'ignored', 'duplicate').required(),
  resolution_notes: Joi.string().max(1000).optional(),
  resolved_by: Joi.string().max(100).optional(),
});

/**
 * Validate error report data
 * @param {Object} data - Error report data
 * @returns {Object} Validation result
 */
function validateErrorReport(data) {
  const { error, value } = errorReportSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    isValid: !error,
    data: value,
    errors: error
      ? error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }))
      : [],
  };
}

/**
 * Validate batch error report data
 * @param {Object} data - Batch error report data
 * @returns {Object} Validation result
 */
function validateBatchReport(data) {
  const { error, value } = batchReportSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    isValid: !error,
    data: value,
    errors: error
      ? error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }))
      : [],
  };
}

/**
 * Validate query parameters
 * @param {Object} params - Query parameters
 * @returns {Object} Validation result
 */
function validateQueryParams(params) {
  const { error, value } = queryParamsSchema.validate(params, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    isValid: !error,
    data: value,
    errors: error
      ? error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }))
      : [],
  };
}

/**
 * Validate error resolution data
 * @param {Object} data - Error resolution data
 * @returns {Object} Validation result
 */
function validateErrorResolution(data) {
  const { error, value } = errorResolutionSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  return {
    isValid: !error,
    data: value,
    errors: error
      ? error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }))
      : [],
  };
}

module.exports = {
  validateErrorReport,
  validateBatchReport,
  validateQueryParams,
  validateErrorResolution,
  errorReportSchema,
  batchReportSchema,
  queryParamsSchema,
  errorResolutionSchema,
};
