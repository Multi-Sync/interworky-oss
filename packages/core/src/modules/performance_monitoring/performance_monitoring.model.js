const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

/**
 * Performance Monitoring Model
 *
 * Stores error reports, performance metrics, and monitoring data
 * from interworky-assistant instances across different organizations.
 *
 * Key Features:
 * - Error tracking with severity levels
 * - Performance metrics collection
 * - Organization and assistant context
 * - Batch processing support
 * - Status tracking for error resolution
 */

const performanceMonitoringSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },

    // Context Information
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    assistant_id: {
      type: String,
      required: true,
      index: true,
    },
    session_id: {
      type: String,
      required: true,
      index: true,
    },

    // Error Classification
    error_type: {
      type: String,
      enum: [
        'console_error',
        'console_warn',
        'console_log',
        'unhandled_exception',
        'promise_rejection',
        'resource_error',
        'performance_issue',
        'network_error',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },

    // Error Details
    message: {
      type: String,
      required: true,
      maxlength: 2000, // Prevent extremely long messages
    },
    stack_trace: {
      type: String,
      maxlength: 10000, // Limit stack trace size
    },
    source_file: {
      type: String,
      maxlength: 500,
    },
    line_number: {
      type: Number,
      min: 0,
    },
    column_number: {
      type: Number,
      min: 0,
    },

    // Enhanced stack trace fields
    function_name: {
      type: String,
      maxlength: 200,
    },
    component_name: {
      type: String,
      maxlength: 200,
    },

    // Environment Context
    url: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    user_agent: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Performance Metrics
    performance_data: {
      load_time: { type: Number },
      memory_usage: { type: Number },
      network_requests: { type: Number },
      dom_elements: { type: Number },
      js_heap_size: { type: Number },
      js_heap_used: { type: Number },
    },

    // User Context (breadcrumbs, console history, etc.)
    context: {
      breadcrumbs: { type: Array },
      consoleHistory: { type: Array },
      pendingRequests: { type: Array },
      environment: { type: Object },
    },

    // Error Source Detection
    error_source: {
      origin: {
        type: String,
        enum: ['interworky_plugin', 'client_website'],
        default: 'client_website',
        index: true,
      },
      detected_at: {
        type: String,
        maxlength: 100,
      },
      detection_method: {
        type: String,
        maxlength: 100,
      },
    },

    // Additional Context
    metadata: {
      browser_info: {
        name: { type: String },
        version: { type: String },
        platform: { type: String },
      },
      device_info: {
        type: { type: String },
        screen_resolution: { type: String },
        viewport_size: { type: String },
      },
      custom_data: {
        type: Object,
        default: {},
      },
      // Enhanced stack trace metadata
      stack_frames: {
        type: Array,
        default: [],
      },
      frame_context: {
        component: { type: String },
        module: { type: String },
        isUserCode: { type: Boolean },
      },
      // Phase 2: Source map resolved data
      resolved_stack_frames: {
        type: Array,
        default: [],
      },
      source_map_resolved: {
        type: Boolean,
        default: false,
      },
    },

    // Processing Status
    status: {
      type: String,
      enum: [
        'new',
        'processing',
        'resolved',
        'ignored',
        'duplicate',
        'carla_fixing', // Carla is analyzing the error
        'pr_created', // Carla created a PR with fix
        'issue_created', // Carla created an issue (couldn't auto-fix)
        'fix_failed', // Carla attempted but failed
      ],
      default: 'new',
      index: true,
    },
    resolved_at: { type: Date },
    resolved_by: { type: String },
    resolution_notes: { type: String },

    // Carla Auto-Fix Analysis
    carla_analysis: {
      attempted_at: { type: Date },
      can_fix: { type: Boolean },
      confidence: {
        type: String,
        enum: ['high', 'medium', 'low'],
      },
      analysis: { type: String, maxlength: 5000 },
      pr_url: { type: String, maxlength: 500 },
      issue_url: { type: String, maxlength: 500 },
      error_message: { type: String, maxlength: 1000 }, // If fix failed
    },

    // Batch Processing
    batch_id: {
      type: String,
      index: true,
    },

    // Deduplication
    error_hash: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'performance_monitoring',
  },
);

// Compound indexes for efficient querying
performanceMonitoringSchema.index({ organization_id: 1, timestamp: -1 });
performanceMonitoringSchema.index({ assistant_id: 1, error_type: 1, timestamp: -1 });
performanceMonitoringSchema.index({ severity: 1, status: 1, timestamp: -1 });
performanceMonitoringSchema.index({ error_hash: 1, organization_id: 1 });

// TTL index for automatic cleanup (90 days retention)
performanceMonitoringSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * Generate error hash for deduplication
 * Creates a hash based on error message, file, line, function, and organization
 * Enhanced to use stack frames for better deduplication
 */
performanceMonitoringSchema.methods.generateErrorHash = function () {
  const crypto = require('crypto');

  // Build hash string with available data
  let hashComponents = [
    this.message,
    this.source_file || '',
    this.line_number || '',
    this.function_name || '',
    this.organization_id,
  ];

  // If we have stack frames, include top 2 frames for better deduplication
  if (this.metadata?.stack_frames?.length > 0) {
    const topFrames = this.metadata.stack_frames.slice(0, 2);
    const stackSignature = topFrames.map(frame => `${frame.file}:${frame.line}`).join('|');
    hashComponents.push(stackSignature);
  }

  const hashString = hashComponents.join('-');
  return crypto.createHash('md5').update(hashString).digest('hex');
};

/**
 * Check if error is critical based on type and message content
 */
performanceMonitoringSchema.methods.isCritical = function () {
  const criticalPatterns = [/unhandled/i, /critical/i, /fatal/i, /memory leak/i, /out of memory/i];

  return this.severity === 'critical' || criticalPatterns.some(pattern => pattern.test(this.message));
};

/**
 * Get error summary for reporting
 */
performanceMonitoringSchema.methods.getSummary = function () {
  return {
    id: this.id,
    type: this.error_type,
    severity: this.severity,
    message: this.message.substring(0, 100),
    timestamp: this.timestamp,
    status: this.status,
  };
};

/**
 * Performance Metrics Model
 *
 * Stores comprehensive performance metrics collected from user websites
 * Includes Core Web Vitals, loading performance, and device/browser context
 */

const performanceMetricsSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },

    // Context Information
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    assistant_id: {
      type: String,
      required: true,
      index: true,
    },
    session_id: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // 1. Core Web Vitals
    core_web_vitals: {
      fcp: { type: Number }, // First Contentful Paint (ms)
      lcp: { type: Number }, // Largest Contentful Paint (ms)
      fid: { type: Number }, // First Input Delay (ms)
      cls: { type: Number }, // Cumulative Layout Shift (score)
      inp: { type: Number }, // Interaction to Next Paint (ms)
      ttfb: { type: Number }, // Time to First Byte (ms)
      dom_content_loaded: { type: Number }, // DOMContentLoaded (ms)
      load_complete: { type: Number }, // Load event (ms)
    },

    // 2. Loading Performance
    loading_performance: {
      dns_lookup: { type: Number }, // DNS lookup time (ms)
      tcp_connection: { type: Number }, // TCP connection time (ms)
      ssl_negotiation: { type: Number }, // SSL/TLS handshake (ms)
      server_response: { type: Number }, // Server response time (ms)
      dom_processing: { type: Number }, // DOM processing time (ms)
      total_load_time: { type: Number }, // Total page load (ms)
    },

    // 3. Next.js Specific Metrics
    nextjs_specific: {
      hydration_time: { type: Number }, // Hydration duration (ms)
      route_change_time: { type: Number }, // Route change duration (ms)
    },

    // 4. Resource Metrics
    resources: {
      total_resources: { type: Number },
      scripts: { type: Number },
      stylesheets: { type: Number },
      images: { type: Number },
      fonts: { type: Number },
      xhr: { type: Number },
      fetch: { type: Number },
      total_size: { type: Number }, // bytes
      cached_resources: { type: Number },
    },

    // 5. Runtime Metrics
    runtime: {
      used_js_heap_size: { type: Number }, // bytes
      total_js_heap_size: { type: Number }, // bytes
      js_heap_size_limit: { type: Number }, // bytes
      long_tasks_count: { type: Number },
      long_tasks_duration: { type: Number }, // ms
    },

    // 6. Network Metrics
    network: {
      total_requests: { type: Number },
      failed_requests: { type: Number },
      average_latency: { type: Number }, // ms
      total_transfer_size: { type: Number }, // bytes
    },

    // 7. Image Metrics
    images: {
      total_images: { type: Number },
      total_image_size: { type: Number }, // bytes
      largest_image_size: { type: Number }, // bytes
      average_image_load_time: { type: Number }, // ms
    },

    // 8. Mobile Metrics
    mobile: {
      is_mobile: { type: Boolean },
      is_tablet: { type: Boolean },
      viewport_width: { type: Number },
      viewport_height: { type: Number },
      orientation: { type: String },
      touch_points: { type: Number },
    },

    // 9. Accessibility Metrics
    accessibility: {
      reduced_motion: { type: Boolean },
      high_contrast: { type: Boolean },
      dark_mode: { type: Boolean },
      font_scale: { type: Number },
    },

    // Device Context
    device: {
      os_name: { type: String },
      os_version: { type: String },
      device_type: { type: String }, // mobile, tablet, desktop
      device_model: { type: String },
      screen_resolution: { type: String },
      viewport_size: { type: String },
      pixel_ratio: { type: Number },
      touch_support: { type: Boolean },
    },

    // Browser Context
    browser: {
      name: { type: String },
      version: { type: String },
      user_agent: { type: String, maxlength: 1000 },
      language: { type: String },
      cookies_enabled: { type: Boolean },
      do_not_track: { type: Boolean },
      platform: { type: String },
    },

    // Network Context
    network_info: {
      type: { type: String }, // wifi, cellular, ethernet, etc.
      effective_type: { type: String }, // 4g, 3g, 2g, slow-2g
      downlink: { type: Number }, // Mbps
      rtt: { type: Number }, // ms
      save_data: { type: Boolean },
    },

    // Location Context
    location: {
      country: { type: String },
      country_code: { type: String },
      region: { type: String },
      city: { type: String },
      timezone: { type: String },
      ip: { type: String },
    },

    // Performance Score & Issues
    score: {
      type: Number,
      min: 0,
      max: 100,
      index: true,
    },
    issues: [
      {
        type: { type: String },
        severity: { type: String, enum: ['low', 'medium', 'high'] },
        message: { type: String },
      },
    ],

    // Resource Optimization Issues
    resource_issues: [
      {
        type: { type: String }, // unused_image, oversized_image, large_script, etc.
        severity: { type: String, enum: ['low', 'medium', 'high'] },
        title: { type: String },
        description: { type: String },
        url: { type: String },
        size: { type: Number },
        duration: { type: Number },
        impact: { type: String },
        recommendation: { type: String },
        code: { type: String }, // Example code to fix the issue
      },
    ],

    resource_summary: {
      total: { type: Number },
      by_severity: {
        high: { type: Number },
        medium: { type: Number },
        low: { type: Number },
      },
      total_wasted_bytes: { type: Number },
      top_recommendations: [{ type: String }],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'performance_metrics',
  },
);

// Compound indexes for efficient querying
performanceMetricsSchema.index({ organization_id: 1, timestamp: -1 });
performanceMetricsSchema.index({ assistant_id: 1, timestamp: -1 });
performanceMetricsSchema.index({ score: 1, timestamp: -1 });
performanceMetricsSchema.index({ 'device.device_type': 1, timestamp: -1 });
performanceMetricsSchema.index({ 'browser.name': 1, timestamp: -1 });
performanceMetricsSchema.index({ 'network_info.effective_type': 1, timestamp: -1 });
performanceMetricsSchema.index({ 'location.country_code': 1, timestamp: -1 });

// TTL index for automatic cleanup (90 days retention)
performanceMetricsSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * Calculate performance grade (A, B, C, D, F)
 */
performanceMetricsSchema.methods.getGrade = function () {
  if (this.score >= 90) return 'A';
  if (this.score >= 75) return 'B';
  if (this.score >= 60) return 'C';
  if (this.score >= 40) return 'D';
  return 'F';
};

/**
 * Get metrics summary
 */
performanceMetricsSchema.methods.getSummary = function () {
  return {
    id: this.id,
    score: this.score,
    grade: this.getGrade(),
    fcp: this.core_web_vitals?.fcp,
    lcp: this.core_web_vitals?.lcp,
    cls: this.core_web_vitals?.cls,
    ttfb: this.core_web_vitals?.ttfb,
    total_load_time: this.loading_performance?.total_load_time,
    device_type: this.device?.device_type,
    browser: this.browser?.name,
    timestamp: this.timestamp,
  };
};

module.exports = {
  PerformanceMonitoring: mongoose.model('PerformanceMonitoring', performanceMonitoringSchema),
  PerformanceMetrics: mongoose.model('PerformanceMetrics', performanceMetricsSchema),
};
