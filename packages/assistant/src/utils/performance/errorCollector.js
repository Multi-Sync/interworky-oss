import { v4 as uuidv4 } from 'uuid';
import { getContextInfo } from './browserUtils';
import {
  captureStackTrace,
  parseStackTrace,
  cleanStackTrace,
  extractTopFrame,
  extractErrorLocation,
} from './stackTraceParser';
import logger from '../logger';
import { ERROR_CODES } from '../errorCodes';
import { SourceMapConsumer } from 'source-map-js';

/**
 * Helper: Capture full error chain (error.cause)
 * @param {Error} error - Error object
 * @returns {Array|null} Chain of errors or null
 */
function captureErrorChain(error) {
  if (!error || !(error instanceof Error)) return null;

  const chain = [];
  let current = error;

  while (current && chain.length < 5) {
    // Max 5 levels to prevent infinite loops
    chain.push({
      message: current.message,
      name: current.name,
      stack: current.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines only
    });
    current = current.cause;
  }

  return chain.length > 1 ? chain : null; // Only return if there's actually a chain
}

/**
 * Helper: Get execution context metadata
 * @returns {Object} Execution context information
 */
function getExecutionContext() {
  try {
    return {
      stack_depth: new Error().stack.split('\n').length,
      is_iframe: window !== window.top,
      memory_pressure: performance.memory
        ? performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
        : null,
    };
  } catch {
    return null;
  }
}

/**
 * Helper: Check if a stack frame is from interworky plugin (should be ignored)
 * @param {Object} frame - Stack frame object
 * @returns {boolean} True if frame is from interworky plugin
 */
function isInterworkyPluginFrame(frame) {
  if (!frame || !frame.file) return false;

  const pluginIndicators = [
    'bundle.js',
    '.bundle.js',
    '/interworky-assistant/',
    'vendors-node_modules',
    'src_assistant_',
    'src_utils_',
    'src_styles_',
    'interworky.js',
    'interworky-plugin',
    'node_modules/openai',
    'node_modules/awesome-phonenumber',
    'node_modules/marked',
  ];

  return pluginIndicators.some((indicator) => frame.file.includes(indicator));
}

/**
 * Helper: Find first user code frame (not plugin, not node_modules)
 * @param {Array} frames - Array of stack frames
 * @returns {Object|null} First user code frame or null
 */
function findUserCodeFrame(frames) {
  if (!frames || !Array.isArray(frames)) return null;

  return (
    frames.find((frame) => {
      if (!frame || !frame.file) return false;

      // Exclude interworky plugin
      if (isInterworkyPluginFrame(frame)) return false;

      // Exclude node_modules
      if (frame.file.includes('node_modules')) return false;

      // Exclude webpack internals
      if (frame.file.includes('webpack')) return false;

      return true;
    }) || null
  );
}

/**
 * PHASE 2: Source Map Support
 * Cache for loaded source maps (URL -> SourceMapConsumer)
 */
const sourceMapCache = new Map();
const sourceMapFetchAttempts = new Map(); // Track failed attempts to avoid refetching

/**
 * Helper: Check if file is minified and needs source map resolution
 * @param {string} file - File path/URL
 * @returns {boolean} True if file appears minified
 */
function isMinifiedFile(file) {
  if (!file) return false;
  return (
    file.includes('.min.') ||
    file.includes('bundle.js') ||
    file.includes('.bundle.js') ||
    /\.\w+\.js$/.test(file)
  ); // Webpack-style: app.a1b2c3d4.js
}

/**
 * Helper: Fetch and parse source map
 * @param {string} fileUrl - URL of the JavaScript file (absolute or relative)
 * @param {string} baseUrl - Base URL for resolving relative paths (e.g., window.location.origin)
 * @returns {Promise<SourceMapConsumer|null>} Source map consumer or null
 */
async function fetchSourceMap(fileUrl, baseUrl) {
  // Convert relative URL to absolute
  let absoluteFileUrl = fileUrl;
  if (!fileUrl.startsWith('http')) {
    // Relative path - make absolute using baseUrl
    const cleanPath = fileUrl.replace(/^\//, ''); // Remove leading slash
    absoluteFileUrl = `${baseUrl}/${cleanPath}`;
  }

  // Check if already cached
  if (sourceMapCache.has(absoluteFileUrl)) {
    return sourceMapCache.get(absoluteFileUrl);
  }

  // Check if we already failed to fetch this
  if (sourceMapFetchAttempts.has(absoluteFileUrl)) {
    return null;
  }

  try {
    // Try fetching source map (convention: file.js.map)
    const mapUrl = `${absoluteFileUrl}.map`;
    const response = await fetch(mapUrl, {
      method: 'GET',
      cache: 'force-cache', // Use browser cache
    });

    if (!response.ok) {
      sourceMapFetchAttempts.set(absoluteFileUrl, true);
      return null;
    }

    const mapData = await response.json();
    const consumer = await new SourceMapConsumer(mapData);

    // Cache the consumer
    sourceMapCache.set(absoluteFileUrl, consumer);
    return consumer;
  } catch (error) {
    // Failed to fetch or parse - mark as attempted
    sourceMapFetchAttempts.set(absoluteFileUrl, true);
    return null;
  }
}

/**
 * Helper: Resolve a single stack frame using source maps
 * @param {Object} frame - Stack frame object {file, line, column, function}
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {Promise<Object>} Enhanced frame with original source info
 */
async function resolveStackFrame(frame, baseUrl) {
  if (!frame || !frame.file) return frame;

  // Skip if not minified
  if (!isMinifiedFile(frame.file)) {
    return frame;
  }

  // Skip interworky plugin frames (no need to resolve)
  if (isInterworkyPluginFrame(frame)) {
    return frame;
  }

  try {
    const consumer = await fetchSourceMap(frame.file, baseUrl);
    if (!consumer) {
      return frame; // No source map available
    }

    const original = consumer.originalPositionFor({
      line: frame.line,
      column: frame.column,
    });

    // If we got valid original position, enhance the frame
    if (original.source) {
      return {
        ...frame,
        // Keep minified info
        minified_file: frame.file,
        minified_line: frame.line,
        minified_column: frame.column,
        minified_function: frame.function,
        // Add original info
        file: original.source,
        line: original.line,
        column: original.column,
        function: original.name || frame.function,
        // Mark as resolved
        source_map_resolved: true,
      };
    }

    return frame;
  } catch (error) {
    // Resolution failed - return original frame
    return frame;
  }
}

/**
 * Helper: Resolve all stack frames using source maps
 * @param {Array} frames - Array of stack frames
 * @param {string} baseUrl - Base URL for resolving relative paths
 * @returns {Promise<Array>} Array of resolved frames
 */
async function resolveStackFrames(frames, baseUrl) {
  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return frames;
  }

  try {
    // Resolve all frames in parallel (max 10 to avoid overwhelming)
    const framesToResolve = frames.slice(0, 10);
    const resolved = await Promise.all(
      framesToResolve.map((frame) => resolveStackFrame(frame, baseUrl))
    );
    return resolved;
  } catch (error) {
    // If resolution fails entirely, return original frames
    return frames;
  }
}

/**
 * Error Collector Service
 *
 * Collects and manages error data from browser environment.
 * Handles console errors, unhandled exceptions, and performance issues.
 *
 * Features:
 * - Console error/warning interception
 * - Unhandled exception capture
 * - Promise rejection handling
 * - Resource loading error tracking
 * - Batch processing and queuing
 * - Deduplication
 */

class ErrorCollector {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
    this.flushTimer = null;
    this.performanceObserver = null;
    this.memoryCheckInterval = null;
    this.organizationId = null;
    this.assistantId = null;
    this.recentErrors = new Map(); // For deduplication
    // Store original console methods before interception

    this.originalConsole = {
      error: console.error,

      warn: console.warn,

      log: console.log,
    };

    // Enhanced context tracking
    this.breadcrumbs = []; // User action history (max 10)
    this.consoleHistory = []; // Recent console calls (max 5)
    this.pendingRequests = []; // In-flight network requests
  }

  /**
   * Initialize error collection
   * Sets up all error interception mechanisms
   * @param {Object} options - Configuration options
   * @param {string} options.organizationId - Organization ID
   * @param {string} options.assistantId - Assistant ID
   */
  initialize(options = {}) {
    if (this.isInitialized) {
      logger.warn(
        ERROR_CODES.PERF_ERROR_COLLECTOR_FAILED,
        'ErrorCollector already initialized'
      );
      return;
    }

    // Set organization and assistant IDs
    this.organizationId = options.organizationId || null;
    this.assistantId = options.assistantId || null;

    try {
      // Set up console interception
      this.interceptConsole();

      // Set up global error handlers
      this.interceptUnhandledErrors();

      // Set up promise rejection handling
      this.interceptPromiseRejections();

      // Set up resource loading error handling
      this.interceptResourceErrors();

      // Set up performance monitoring
      this.interceptPerformanceIssues();

      // Start batch processing
      this.startBatchProcessor();

      // Set up user action tracking
      this.interceptUserActions();

      // Set up network request tracking
      this.interceptNetworkRequests();

      this.isInitialized = true;
      logger.info('IW-PERF-011', 'ErrorCollector initialized successfully', {
        organizationId: this.organizationId,
        assistantId: this.assistantId,
      });
    } catch (error) {
      logger.error(
        ERROR_CODES.PERF_ERROR_COLLECTOR_FAILED,
        'Failed to initialize ErrorCollector',
        {
          error: error.message,
        }
      );
    }
  }

  /**
   * Intercept console methods to capture errors and warnings
   */
  interceptConsole() {
    // Override console.error

    console.error = (...args) => {
      this.addConsoleHistory('error', args);

      // Capture stack trace at the point of console.error call
      const rawStack = captureStackTrace(2); // Skip captureStackTrace and console.error wrapper
      const cleanedStack = cleanStackTrace(rawStack);
      const parsed = parseStackTrace(cleanedStack);
      const topFrame = extractTopFrame(cleanedStack);
      const location = extractErrorLocation(cleanedStack);

      // PHASE 1: Enhanced stack trace collection
      const userCodeFrame = findUserCodeFrame(parsed.frames);
      const errorChain =
        args[0] instanceof Error ? captureErrorChain(args[0]) : null;
      const executionContext = getExecutionContext();

      this.collectError('console_error', {
        message: args
          .map((arg) =>
            typeof arg === 'object' && arg !== null
              ? JSON.stringify(arg)
              : String(arg)
          )
          .join(' '),
        args: args,
        timestamp: new Date().toISOString(),
        // Enhanced stack trace information
        stack: cleanedStack,
        rawStack: rawStack,
        stackFrames: parsed.frames, // Full stack (all frames)
        topFrame: topFrame,
        userCodeFrame: userCodeFrame, // First non-plugin, non-library frame
        filename: location.filename,
        lineno: location.lineno,
        colno: location.colno,
        // Error chain (error.cause)
        errorChain: errorChain,
        // Execution context
        executionContext: executionContext,
      });
      // Always show errors in console (errors are always level 0)
      this.originalConsole.error.apply(console, args);
    };

    // Override console.warn

    console.warn = (...args) => {
      this.addConsoleHistory('warn', args);

      // Capture stack trace at the point of console.warn call
      const rawStack = captureStackTrace(2);
      const cleanedStack = cleanStackTrace(rawStack);
      const parsed = parseStackTrace(cleanedStack);
      const topFrame = extractTopFrame(cleanedStack);
      const location = extractErrorLocation(cleanedStack);

      // PHASE 1: Enhanced stack trace collection
      const userCodeFrame = findUserCodeFrame(parsed.frames);
      const errorChain =
        args[0] instanceof Error ? captureErrorChain(args[0]) : null;
      const executionContext = getExecutionContext();

      this.collectError('console_warn', {
        message: args
          .map((arg) =>
            typeof arg === 'object' && arg !== null
              ? JSON.stringify(arg)
              : String(arg)
          )
          .join(' '),
        args: args,
        timestamp: new Date().toISOString(),
        // Enhanced stack trace information
        stack: cleanedStack,
        rawStack: rawStack,
        stackFrames: parsed.frames, // Full stack (all frames)
        topFrame: topFrame,
        userCodeFrame: userCodeFrame, // First non-plugin, non-library frame
        filename: location.filename,
        lineno: location.lineno,
        colno: location.colno,
        // Error chain (error.cause)
        errorChain: errorChain,
        // Execution context
        executionContext: executionContext,
      });
      // Only show warnings if log level allows
      if (logger.shouldLog('warn')) {
        this.originalConsole.warn.apply(console, args);
      }
    };

    // Override console.log for debugging (optional)

    console.log = (...args) => {
      this.addConsoleHistory('log', args);
      // Only capture logs in development or if explicitly enabled
      if (this.shouldCaptureLogs()) {
        // Capture stack trace at the point of console.log call
        const rawStack = captureStackTrace(2);
        const cleanedStack = cleanStackTrace(rawStack);
        const parsed = parseStackTrace(cleanedStack);
        const topFrame = extractTopFrame(cleanedStack);
        const location = extractErrorLocation(cleanedStack);

        // PHASE 1: Enhanced stack trace collection
        const userCodeFrame = findUserCodeFrame(parsed.frames);
        const errorChain =
          args[0] instanceof Error ? captureErrorChain(args[0]) : null;
        const executionContext = getExecutionContext();

        this.collectError('console_log', {
          message: args
            .map((arg) =>
              typeof arg === 'object' && arg !== null
                ? JSON.stringify(arg)
                : String(arg)
            )
            .join(' '),
          args: args,
          timestamp: new Date().toISOString(),
          // Enhanced stack trace information
          stack: cleanedStack,
          rawStack: rawStack,
          stackFrames: parsed.frames, // Full stack (all frames)
          topFrame: topFrame,
          userCodeFrame: userCodeFrame, // First non-plugin, non-library frame
          filename: location.filename,
          lineno: location.lineno,
          colno: location.colno,
          // Error chain (error.cause)
          errorChain: errorChain,
          // Execution context
          executionContext: executionContext,
        });
      }
      // Only show logs if log level allows
      if (logger.shouldLog('info')) {
        this.originalConsole.log.apply(console, args);
      }
    };
  }

  /**
   * Intercept unhandled JavaScript errors
   */
  interceptUnhandledErrors() {
    window.addEventListener('error', (event) => {
      // Parse stack trace if available
      const rawStack = event.error?.stack || '';
      const cleanedStack = cleanStackTrace(rawStack);
      const parsed = parseStackTrace(cleanedStack);
      const topFrame = extractTopFrame(cleanedStack);
      const location = extractErrorLocation(cleanedStack);

      // PHASE 1: Enhanced stack trace collection
      const userCodeFrame = findUserCodeFrame(parsed.frames);
      const errorChain = event.error ? captureErrorChain(event.error) : null;
      const executionContext = getExecutionContext();

      this.collectError('unhandled_exception', {
        message: event.message,
        // Use event properties as primary source, parsed stack as fallback
        filename: event.filename || location.filename,
        lineno: event.lineno || location.lineno,
        colno: event.colno || location.colno,
        // Enhanced stack trace information
        stack: cleanedStack || rawStack,
        rawStack: rawStack,
        stackFrames: parsed.frames, // Full stack (all frames)
        topFrame: topFrame,
        userCodeFrame: userCodeFrame, // First non-plugin, non-library frame
        timestamp: new Date().toISOString(),
        // Error chain (error.cause)
        errorChain: errorChain,
        // Execution context
        executionContext: executionContext,
      });
    });
  }

  /**
   * Intercept unhandled promise rejections
   */
  interceptPromiseRejections() {
    window.addEventListener('unhandledrejection', (event) => {
      // Parse stack trace if available
      const rawStack = event.reason?.stack || '';
      const cleanedStack = cleanStackTrace(rawStack);
      const parsed = parseStackTrace(cleanedStack);
      const topFrame = extractTopFrame(cleanedStack);
      const location = extractErrorLocation(cleanedStack);

      // PHASE 1: Enhanced stack trace collection
      const userCodeFrame = findUserCodeFrame(parsed.frames);
      const errorChain =
        event.reason instanceof Error ? captureErrorChain(event.reason) : null;
      const executionContext = getExecutionContext();

      this.collectError('promise_rejection', {
        message: event.reason?.message || String(event.reason),
        // Enhanced stack trace information
        stack: cleanedStack || rawStack,
        rawStack: rawStack,
        stackFrames: parsed.frames, // Full stack (all frames)
        topFrame: topFrame,
        userCodeFrame: userCodeFrame, // First non-plugin, non-library frame
        filename: location.filename,
        lineno: location.lineno,
        colno: location.colno,
        timestamp: new Date().toISOString(),
        // Error chain (error.cause)
        errorChain: errorChain,
        // Execution context
        executionContext: executionContext,
      });
    });
  }

  /**
   * Intercept resource loading errors
   */
  interceptResourceErrors() {
    window.addEventListener(
      'error',
      (event) => {
        // Check if it's a resource loading error
        if (event.target !== window && event.target.tagName) {
          // Capture stack trace at the point where resource error was detected
          const rawStack = captureStackTrace(1);
          const cleanedStack = cleanStackTrace(rawStack);
          const parsed = parseStackTrace(cleanedStack);
          const topFrame = extractTopFrame(cleanedStack);
          const location = extractErrorLocation(cleanedStack);

          // PHASE 1: Enhanced stack trace collection
          const userCodeFrame = findUserCodeFrame(parsed.frames);
          const executionContext = getExecutionContext();

          this.collectError('resource_error', {
            message: `Failed to load ${event.target.tagName.toLowerCase()}`,
            element: event.target.tagName,
            src: event.target.src || event.target.href,
            // Enhanced stack trace information (shows where resource was referenced)
            stack: cleanedStack,
            rawStack: rawStack,
            stackFrames: parsed.frames, // Full stack (all frames)
            topFrame: topFrame,
            userCodeFrame: userCodeFrame, // First non-plugin, non-library frame
            filename: location.filename,
            lineno: location.lineno,
            colno: location.colno,
            timestamp: new Date().toISOString(),
            // Error chain (N/A for resource errors)
            errorChain: null,
            // Execution context
            executionContext: executionContext,
          });
        }
      },
      true
    ); // Use capture phase
  }

  /**
   * Intercept performance issues
   */
  interceptPerformanceIssues() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              // NOTE: Stack trace is not useful for long tasks (captured after task completes)
              // Better to rely on breadcrumbs and execution context

              // PHASE 1: Enhanced context collection (no stack trace - it's meaningless here)
              const executionContext = getExecutionContext();

              this.collectError('performance_issue', {
                message: `Long task detected: ${entry.duration}ms`,
                duration: entry.duration,
                startTime: entry.startTime,
                // No stack trace (meaningless for PerformanceObserver)
                stack: null,
                rawStack: null,
                stackFrames: [],
                topFrame: null,
                userCodeFrame: null,
                filename: null,
                lineno: null,
                colno: null,
                timestamp: new Date().toISOString(),
                // Error chain (N/A for performance issues)
                errorChain: null,
                // Execution context (useful!)
                executionContext: executionContext,
              });
            }
          }
        });
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        // Keep using originalConsole here to avoid recursion in error collection
        if (this.originalConsole?.warn && logger.shouldLog('warn')) {
          this.originalConsole.warn(
            'PerformanceObserver not supported:',
            error
          );
        }
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      this.memoryCheckInterval = setInterval(() => {
        const memory = performance.memory;
        const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (usedRatio > 0.9) {
          // More than 90% memory used
          // Capture stack trace to identify where memory is being consumed
          const rawStack = captureStackTrace(1);
          const cleanedStack = cleanStackTrace(rawStack);
          const parsed = parseStackTrace(cleanedStack);
          const topFrame = extractTopFrame(cleanedStack);
          const location = extractErrorLocation(cleanedStack);

          this.collectError('performance_issue', {
            message: `High memory usage: ${(usedRatio * 100).toFixed(1)}%`,
            memoryUsage: {
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit,
              ratio: usedRatio,
            },
            // Enhanced stack trace information
            stack: cleanedStack,
            rawStack: rawStack,
            stackFrames: parsed.frames,
            topFrame: topFrame,
            filename: location.filename,
            lineno: location.lineno,
            colno: location.colno,
            timestamp: new Date().toISOString(),
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Intercept user actions for breadcrumb tracking
   */
  interceptUserActions() {
    // Track clicks
    window.addEventListener(
      'click',
      (event) => {
        this.trackUserAction('click', {
          element: event.target.tagName,
          id: event.target.id,
          className: event.target.className,
          text: event.target.innerText?.substring(0, 50),
        });
      },
      true
    );

    // Track navigation
    window.addEventListener('popstate', () => {
      this.trackUserAction('navigation', {
        url: window.location.href,
      });
    });

    // Track hash changes
    window.addEventListener('hashchange', () => {
      this.trackUserAction('hash_change', {
        hash: window.location.hash,
      });
    });
  }

  /**
   * Intercept network requests for tracking
   */
  interceptNetworkRequests() {
    // Store original methods for cleanup
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    // Intercept fetch
    const self = this;
    window.fetch = (...args) => {
      const url = args[0];
      const requestId = `fetch_${Date.now()}_${Math.random()}`;

      self.pendingRequests.push({
        id: requestId,
        type: 'fetch',
        url: String(url),
        startTime: Date.now(),
      });

      return self.originalFetch
        .apply(window, args)
        .then((response) => {
          self.removePendingRequest(requestId);
          return response;
        })
        .catch((error) => {
          self.removePendingRequest(requestId);
          throw error;
        });
    };

    // Intercept XMLHttpRequest
    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      this._method = method;
      return self.originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      const requestId = `xhr_${Date.now()}_${Math.random()}`;

      if (self) {
        self.pendingRequests.push({
          id: requestId,
          type: 'xhr',
          method: this._method,
          url: this._url,
          startTime: Date.now(),
        });

        this.addEventListener('loadend', () => {
          self.removePendingRequest(requestId);
        });
      }

      return self.originalXHRSend.apply(this, arguments);
    };

    // Store reference for global access
    window.errorCollectorInstance = this;
  }

  /**
   * Add console call to history buffer
   * @param {string} level - Console level (error, warn, log)
   * @param {Array} args - Console arguments
   */
  addConsoleHistory(level, args) {
    this.consoleHistory.push({
      level,
      message: args.join(' '),
      timestamp: Date.now(),
    });

    // Keep only last 5 console calls
    if (this.consoleHistory.length > 5) {
      this.consoleHistory.shift();
    }
  }

  /**
   * Track user action as breadcrumb
   * @param {string} type - Action type
   * @param {Object} data - Action data
   */
  trackUserAction(type, data) {
    this.breadcrumbs.push({
      type,
      data,
      timestamp: Date.now(),
    });

    // Keep only last 10 breadcrumbs
    if (this.breadcrumbs.length > 10) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Remove pending request from tracking
   * @param {string} requestId - Request ID
   */
  removePendingRequest(requestId) {
    this.pendingRequests = this.pendingRequests.filter(
      (req) => req.id !== requestId
    );
  }

  /**
   * Generate hash for error deduplication
   * @param {string} type - Error type
   * @param {Object} data - Error data
   * @returns {string} Error hash
   */
  hashError(type, data) {
    const message = data?.message || String(data);
    const file = data?.filename || '';
    const line = data?.lineno || '';
    return `${type}-${message.substring(0, 100)}-${file}-${line}`;
  }

  /**
   * Collect error data and add to queue
   * @param {string} type - Error type
   * @param {Object} data - Error data
   */
  async collectError(type, data) {
    try {
      // PREVENT INFINITE LOOP: Don't collect errors about performance monitoring itself
      const message = data?.message || String(data || '');
      if (message.includes('performance-monitoring/errors')) {
        return; // Skip to prevent infinite loop
      }

      // VALIDATION: Skip errors with [object Object] or missing critical data
      // Only save errors that have both stack trace and proper context
      const hasValidMessage =
        message && message !== '[object Object]' && message.trim() !== '';
      const hasStackTrace =
        data?.stack || data?.rawStack || data?.stackFrames?.length > 0;
      const hasUserJourney = this.breadcrumbs.length > 0 || data?.userCodeFrame;

      if (!hasValidMessage || !hasStackTrace) {
        // Skip errors without valid message or stack trace
        if (this.originalConsole?.warn && logger.shouldLog('debug')) {
          this.originalConsole.warn(
            '[ErrorCollector] Skipping error with invalid message or missing stack:',
            {
              hasValidMessage,
              hasStackTrace,
              message: message.substring(0, 100),
            }
          );
        }
        return;
      }

      // Deduplication - skip if same error occurred within last second
      const errorHash = this.hashError(type, data);
      const now = Date.now();

      if (this.recentErrors.has(errorHash)) {
        const lastSeen = this.recentErrors.get(errorHash);
        if (now - lastSeen < 1000) {
          // Same error within 1 second, skip to prevent spam
          return;
        }
      }

      this.recentErrors.set(errorHash, now);

      // Clean up old entries (keep only last 100)
      if (this.recentErrors.size > 100) {
        const firstKey = this.recentErrors.keys().next().value;
        this.recentErrors.delete(firstKey);
      }

      const errorData = {
        id: uuidv4(),
        type,
        severity: this.determineSeverity(type, data),
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        organizationId: this.getOrganizationId(),
        assistantId: this.getAssistantId(),
        performanceData: this.getPerformanceData(),
        context: {
          breadcrumbs: [...this.breadcrumbs],
          consoleHistory: [...this.consoleHistory],
          pendingRequests: [...this.pendingRequests],
          environment: this.getEnvironmentInfo(),
        },
        error_source: this.detectErrorSource(data),
      };

      // PHASE 2: Resolve source maps with timeout (don't block for too long)
      if (data?.stackFrames && Array.isArray(data.stackFrames)) {
        try {
          // Get base URL for resolving relative paths
          const baseUrl = window.location.origin;

          // Race between source map resolution and 500ms timeout
          const resolvedFrames = await Promise.race([
            resolveStackFrames(data.stackFrames, baseUrl),
            new Promise((resolve) => setTimeout(() => resolve(null), 500)),
          ]);

          if (resolvedFrames) {
            errorData.data.resolvedStackFrames = resolvedFrames;
            errorData.data.sourceMapResolved = true;
          } else {
            errorData.data.sourceMapResolved = false;
          }
        } catch {
          errorData.data.sourceMapResolved = false;
        }
      }

      // Add to queue (after source map resolution completes or times out)
      this.errorQueue.push(errorData);

      // Prevent queue from growing too large
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue.shift(); // Remove oldest error
      }

      // Flush immediately for critical errors
      if (this.isCriticalError(type, data)) {
        this.flushQueue();
      }
    } catch (error) {
      // Use original console to avoid infinite recursion
      if (this.originalConsole && this.originalConsole.error) {
        this.originalConsole.error('Failed to collect error:', error);
      }
    }
  }

  /**
   * Start batch processor for periodic flushing
   */
  startBatchProcessor() {
    this.flushTimer = setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flushQueue();
      }
    }, this.flushInterval);
  }

  /**
   * Flush error queue to backend
   */
  async flushQueue() {
    if (this.errorQueue.length === 0) return;

    try {
      const batch = this.errorQueue.splice(0, this.batchSize);

      // Import API function dynamically to avoid circular dependencies
      const { reportPerformanceBatch } = await import(
        '../api/performanceMonitoringApi'
      );

      await reportPerformanceBatch(batch);

      // Use originalConsole to avoid recursion during error reporting
      if (this.originalConsole?.log && logger.shouldLog('debug')) {
        this.originalConsole.log(
          `[DEBUG] Flushed ${batch.length} errors to backend`
        );
      }
    } catch (error) {
      // Use originalConsole to avoid recursion during error reporting
      if (this.originalConsole?.error) {
        this.originalConsole.error('Failed to flush error queue:', error);
      }

      // Re-add errors to queue for retry (but limit retries)
      this.errorQueue.unshift(...this.errorQueue.splice(0, this.batchSize));

      // Prevent infinite retry loops
      if (this.errorQueue.length > this.maxQueueSize * 2) {
        this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
      }
    }
  }

  /**
   * Detect whether the error originated from the Interworky plugin or the client website
   * @param {Object} data - Error data
   * @returns {Object} Error source information
   */
  detectErrorSource(data) {
    const filename = data?.filename || '';
    const stack = data?.stack || data?.rawStack || '';

    // PRIORITY 1: Check CDN URL (most reliable indicator)
    const cdnIndicators = ['storage.googleapis.com/multisync/interworky/'];

    if (
      cdnIndicators.some((cdn) => filename.includes(cdn) || stack.includes(cdn))
    ) {
      return {
        origin: 'interworky_plugin',
        detected_at: 'collection',
        detection_method: 'cdn',
      };
    }

    // PRIORITY 2: Check specific plugin identifiers
    const pluginIndicators = [
      '/interworky-assistant/',
      'interworky-plugin',
      'interworky.js',
      'src_assistant_',
    ];

    // Check filename
    if (pluginIndicators.some((indicator) => filename.includes(indicator))) {
      return {
        origin: 'interworky_plugin',
        detected_at: 'collection',
        detection_method: 'filename',
      };
    }

    // Check stack trace
    if (pluginIndicators.some((indicator) => stack.includes(indicator))) {
      return {
        origin: 'interworky_plugin',
        detected_at: 'collection',
        detection_method: 'stack_trace',
      };
    }

    // Check stack frames
    if (data?.stackFrames && Array.isArray(data.stackFrames)) {
      const topFrame = data.stackFrames[0];
      if (
        topFrame?.file &&
        (cdnIndicators.some((cdn) => topFrame.file.includes(cdn)) ||
          pluginIndicators.some((indicator) =>
            topFrame.file.includes(indicator)
          ))
      ) {
        return {
          origin: 'interworky_plugin',
          detected_at: 'collection',
          detection_method: 'stack_frames',
        };
      }
    }

    // Default: assume it's from the client website
    return {
      origin: 'client_website',
      detected_at: 'collection',
      detection_method: 'default',
    };
  }

  /**
   * Determine error severity based on type and content
   * @param {string} type - Error type
   * @param {Object} data - Error data
   * @returns {string} Severity level: 'low', 'medium', 'high', or 'critical'
   */
  determineSeverity(type, data) {
    const message = (data?.message || String(data || '')).toLowerCase();

    // Critical: Security issues, fatal errors, crashes
    const criticalPatterns = [
      /security/i,
      /vulnerability/i,
      /critical/i,
      /fatal/i,
      /crash/i,
      /memory leak/i,
      /out of memory/i,
    ];

    if (criticalPatterns.some((pattern) => pattern.test(message))) {
      return 'critical';
    }

    // High: Unhandled exceptions, promise rejections, resource errors
    if (type === 'unhandled_exception' || type === 'promise_rejection') {
      return 'high';
    }

    const highPatterns = [
      /unhandled/i,
      /exception/i,
      /uncaught/i,
      /failed/i,
      /timeout/i,
      /network error/i,
    ];

    if (highPatterns.some((pattern) => pattern.test(message))) {
      return 'high';
    }

    // Medium: Console errors, resource errors, performance issues
    if (
      type === 'console_error' ||
      type === 'resource_error' ||
      type === 'performance_issue'
    ) {
      return 'medium';
    }

    // Low: Warnings, deprecations
    if (type === 'console_warn') {
      return 'low';
    }

    const lowPatterns = [/warning/i, /deprecated/i, /info/i, /debug/i];

    if (lowPatterns.some((pattern) => pattern.test(message))) {
      return 'low';
    }

    // Default: medium
    return 'medium';
  }

  /**
   * Check if error is critical and should be sent immediately
   * @param {string} type - Error type
   * @param {Object} data - Error data
   * @returns {boolean} True if critical
   */
  isCriticalError(type, data) {
    const criticalTypes = ['unhandled_exception', 'promise_rejection'];
    const criticalPatterns = [
      /unhandled/i,
      /critical/i,
      /fatal/i,
      /memory leak/i,
      /out of memory/i,
      /security/i,
    ];

    return (
      criticalTypes.includes(type) ||
      criticalPatterns.some((pattern) => pattern.test(data.message || ''))
    );
  }

  /**
   * Check if console logs should be captured
   * @returns {boolean} True if should capture logs
   */
  shouldCaptureLogs() {
    // Check if process is defined (not available in all browser environments)
    const isDevelopment =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    const captureEnabled =
      typeof window !== 'undefined' &&
      window.INTERWORKY_CAPTURE_LOGS === 'true';
    return isDevelopment || captureEnabled;
  }

  /**
   * Get current performance data
   * @returns {Object} Performance metrics
   */
  getPerformanceData() {
    try {
      const contextInfo = getContextInfo();
      return contextInfo.performance;
    } catch (error) {
      // Use originalConsole to avoid recursion in error collection
      if (this.originalConsole?.warn && logger.shouldLog('warn')) {
        this.originalConsole.warn('Failed to get performance data:', error);
      }
      return {};
    }
  }

  /**
   * Get detailed environment information
   * @returns {Object} Environment context
   */
  getEnvironmentInfo() {
    try {
      return {
        // Network status
        network: {
          online: navigator.onLine,
          connectionType: navigator.connection?.effectiveType || 'unknown',
          downlink: navigator.connection?.downlink || null,
          rtt: navigator.connection?.rtt || null,
          saveData: navigator.connection?.saveData || false,
        },
        // Viewport and screen
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          devicePixelRatio: window.devicePixelRatio || 1,
          orientation: screen.orientation?.type || 'unknown',
        },
        // Browser capabilities
        capabilities: {
          cookiesEnabled: navigator.cookieEnabled,
          localStorageAvailable: this.isStorageAvailable('localStorage'),
          sessionStorageAvailable: this.isStorageAvailable('sessionStorage'),
          serviceWorkerActive: this.getServiceWorkerStatus(),
          notificationsPermission: Notification?.permission || 'default',
          maxTouchPoints: navigator.maxTouchPoints || 0,
        },
        // Document state
        document: {
          readyState: document.readyState,
          hidden: document.hidden,
          hasFocus: document.hasFocus(),
          visibilityState: document.visibilityState,
          referrer: document.referrer,
          characterSet: document.characterSet,
        },
        // Timing information
        timing: this.getTimingInfo(),
      };
    } catch (error) {
      if (this.originalConsole?.warn && logger.shouldLog('warn')) {
        this.originalConsole.warn('Failed to get environment info:', error);
      }
      return {};
    }
  }

  /**
   * Check if storage is available
   * @param {string} type - Storage type (localStorage or sessionStorage)
   * @returns {boolean} True if available
   */
  isStorageAvailable(type) {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get service worker status
   * @returns {string} Service worker status
   */
  getServiceWorkerStatus() {
    try {
      if (!('serviceWorker' in navigator)) {
        return 'not_supported';
      }
      if (navigator.serviceWorker.controller) {
        return 'active';
      }
      return 'inactive';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get timing information
   * @returns {Object} Timing data
   */
  getTimingInfo() {
    try {
      if (!performance.timing) return {};

      const timing = performance.timing;
      const now = Date.now();

      return {
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded:
          timing.domContentLoadedEventEnd - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        timeOnPage: now - timing.navigationStart,
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcpConnection: timing.connectEnd - timing.connectStart,
        serverResponse: timing.responseEnd - timing.requestStart,
        domProcessing: timing.domComplete - timing.domLoading,
      };
    } catch {
      return {};
    }
  }

  /**
   * Get organization ID from current context
   * @returns {string|null} Organization ID
   */
  getOrganizationId() {
    try {
      // Use stored ID from initialization
      if (this.organizationId) {
        return this.organizationId;
      }

      // Try to get from global state
      if (window.interworkyState?.organization?.id) {
        return window.interworkyState.organization.id;
      }

      // Try to get from window global
      if (window.INTERWORKY_ORG_ID) {
        return window.INTERWORKY_ORG_ID;
      }

      return null;
    } catch (error) {
      if (this.originalConsole?.warn && logger.shouldLog('warn')) {
        this.originalConsole.warn('Failed to get organization ID:', error);
      }
      return null;
    }
  }

  /**
   * Get assistant ID from current context
   * @returns {string|null} Assistant ID
   */
  getAssistantId() {
    try {
      // Use stored ID from initialization
      if (this.assistantId) {
        return this.assistantId;
      }

      // Try to get from global state
      if (window.interworkyState?.assistant?.id) {
        return window.interworkyState.assistant.id;
      }

      // Try to get from window global
      if (window.INTERWORKY_ASSISTANT_ID) {
        return window.INTERWORKY_ASSISTANT_ID;
      }

      return null;
    } catch (error) {
      if (this.originalConsole?.warn && logger.shouldLog('warn')) {
        this.originalConsole.warn('Failed to get assistant ID:', error);
      }
      return null;
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current queue status
   * @returns {Object} Queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.errorQueue.length,
      maxQueueSize: this.maxQueueSize,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval,
      isInitialized: this.isInitialized,
      sessionId: this.sessionId,
    };
  }

  /**
   * Manually flush queue (for testing or immediate sending)
   */
  async forceFlush() {
    await this.flushQueue();
  }

  /**
   * Clear error queue
   */
  clearQueue() {
    this.errorQueue = [];
  }

  /**
   * Destroy error collector and cleanup
   */
  destroy() {
    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    // Clear memory check interval
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // Restore original console methods

    console.error = this.originalConsole.error;

    console.warn = this.originalConsole.warn;

    console.log = this.originalConsole.log;

    // Clear queue and deduplication map
    this.clearQueue();
    this.recentErrors.clear();

    this.isInitialized = false;
    logger.info('IW-PERF-012', 'ErrorCollector destroyed');
  }
}

// Create singleton instance
const errorCollector = new ErrorCollector();

export { ErrorCollector, errorCollector };
export default errorCollector;
