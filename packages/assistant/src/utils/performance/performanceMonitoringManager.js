import errorCollector from './errorCollector';
import {
  processRetryQueue,
  checkPerformanceMonitoringHealth,
} from '../api/performanceMonitoringApi';
import logger from '../logger';
import { ERROR_CODES } from '../errorCodes';
import { analyzeResources, getIssueSummary } from './resourceAnalyzer';

/**
 * Performance Monitoring Manager
 *
 * Centralized manager for performance monitoring functionality.
 * Provides high-level API for error collection, reporting, and management.
 *
 * Features:
 * - Error collection management
 * - Health monitoring
 * - Retry queue processing
 * - Configuration management
 * - Status reporting
 */

class PerformanceMonitoringManager {
  constructor() {
    this.isEnabled = true;
    this.config = {
      enableConsoleCapture: true,
      enableUnhandledErrors: true,
      enablePromiseRejections: true,
      enableResourceErrors: true,
      enablePerformanceMonitoring: true,
      batchSize: 10,
      flushInterval: 5000,
      maxQueueSize: 50,
      retryAttempts: 3,
      retryDelay: 1000,
      enableNetworkCapture: true,
      statusThreshold: 400,
      captureRequestBody: false,
      captureResponseBody: false,
      responseBodyLimit: 2048,
    };
    this.status = {
      initialized: false,
      lastHealthCheck: null,
      healthStatus: 'unknown',
      errorCount: 0,
      lastErrorTime: null,
    };
    this.retryTimer = null;

    // Performance metrics storage
    this.performanceMetrics = {
      coreWebVitals: {},
      loadingPerformance: {},
      nextjsSpecific: {},
      resources: {},
      runtime: {},
      network: {},
      images: {},
      mobile: {},
      accessibility: {},
      // Context metadata
      device: {},
      browser: {},
      networkInfo: {},
      location: {},
    };

    this.metricsCollected = false;

    // Performance observers for continuous metric collection
    this.performanceObservers = {
      lcp: null,
      cls: null,
      fid: null,
      inp: null,
    };
  }

  /**
   * Initialize performance monitoring
   * @param {Object} options - Configuration options
   * @param {string} options.organizationId - Organization ID
   * @param {string} options.assistantId - Assistant ID
   */
  async initialize(options = {}) {
    try {
      // Merge configuration
      this.config = { ...this.config, ...options };

      // Get or create session ID
      if (!this.config.sessionId) {
        this.config.sessionId = this._getOrCreateSessionId();
      }

      // Check if monitoring is enabled
      if (!this.isEnabled) {
        logger.info('IW-PERF-015', 'Performance monitoring is disabled');
        return;
      }

      // Check if already initialized in this session to prevent duplicates
      const persistentInit = sessionStorage.getItem('iw_perf_initialized');
      const lastInitTime = sessionStorage.getItem('iw_perf_init_time');
      const ONE_HOUR = 60 * 60 * 1000;

      if (
        persistentInit &&
        lastInitTime &&
        Date.now() - parseInt(lastInitTime) < ONE_HOUR &&
        this.status.initialized
      ) {
        logger.info(
          'IW-PERF-016',
          'Performance monitoring already active in this session',
          {
            lastInitTime,
            initialized: this.status.initialized,
          }
        );
        return;
      }

      // Initialize error collector with org/assistant IDs
      errorCollector.initialize({
        organizationId: options.organizationId,
        assistantId: options.assistantId,
      });

      // Install network monitoring
      this.installNetworkInterceptors();
      this.installResourceErrorListeners();
      this.installNetworkStatusListeners();

      // Set up retry queue processing
      this.startRetryProcessor();

      // Perform initial health check
      await this.performHealthCheck();

      this.status.initialized = true;

      // Set persistent initialization flags
      sessionStorage.setItem('iw_perf_initialized', 'true');
      sessionStorage.setItem('iw_perf_init_time', Date.now().toString());

      logger.info('IW-PERF-017', 'Performance monitoring manager initialized', {
        organizationId: options.organizationId,
        assistantId: options.assistantId,
      });

      // Set up early performance observers for Core Web Vitals
      this.setupEarlyPerformanceObservers();

      // Start performance metrics collection
      this.startMetricsCollection();
    } catch (error) {
      logger.error(
        ERROR_CODES.PERF_MONITORING_INIT_FAILED,
        'Failed to initialize performance monitoring manager',
        { error: error.message }
      );
    }
  }

  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;

    if (enabled && !this.status.initialized) {
      this.initialize();
    } else if (!enabled && this.status.initialized) {
      this.destroy();
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Apply configuration changes if already initialized
    if (this.status.initialized) {
      this.applyConfiguration();
    }
  }

  /**
   * Apply current configuration to error collector
   */
  applyConfiguration() {
    if (errorCollector.isInitialized) {
      // Update error collector settings
      errorCollector.batchSize = this.config.batchSize;
      errorCollector.flushInterval = this.config.flushInterval;
      errorCollector.maxQueueSize = this.config.maxQueueSize;
    }
  }

  /**
   * Manually report an error
   * @param {string} type - Error type
   * @param {Object} data - Error data
   * @param {Object} context - Additional context
   */
  reportError(type, data, context = {}) {
    if (!this.isEnabled || !this.status.initialized) {
      return;
    }

    try {
      const errorData = {
        type,
        data: {
          ...data,
          ...context,
          manuallyReported: true,
          timestamp: new Date().toISOString(),
        },
      };

      errorCollector.collectError(type, errorData.data);
      this.status.errorCount++;
      this.status.lastErrorTime = new Date();
    } catch (error) {
      logger.error(
        ERROR_CODES.PERF_REPORT_FAILED,
        'Failed to manually report error',
        {
          error: error.message,
          type,
        }
      );
    }
  }

  /**
   * Get current status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      ...this.status,
      config: this.config,
      isEnabled: this.isEnabled,
      queueStatus: errorCollector.getQueueStatus(),
      healthStatus: this.status.healthStatus,
      lastHealthCheck: this.status.lastHealthCheck,
    };
  }

  /**
   * Perform health check
   * @returns {Promise<boolean>} True if healthy
   */
  async performHealthCheck() {
    try {
      const isHealthy = await checkPerformanceMonitoringHealth();
      this.status.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      this.status.lastHealthCheck = new Date();
      return isHealthy;
    } catch (error) {
      this.status.healthStatus = 'error';
      this.status.lastHealthCheck = new Date();
      logger.error(
        ERROR_CODES.PERF_HEALTH_CHECK_FAILED,
        'Health check failed',
        {
          error: error.message,
        }
      );
      return false;
    }
  }

  /**
   * Start retry queue processor
   */
  startRetryProcessor() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }

    this.retryTimer = setInterval(async () => {
      try {
        const retryCount = await processRetryQueue();
        if (retryCount > 0) {
          logger.info('IW-PERF-018', `Processed ${retryCount} retry errors`, {
            count: retryCount,
          });
        }
      } catch (error) {
        logger.error(
          ERROR_CODES.PERF_RETRY_QUEUE_FAILED,
          'Failed to process retry queue',
          {
            error: error.message,
          }
        );
      }
    }, 30000); // Process retries every 30 seconds
  }

  /**
   * Force flush error queue
   * @returns {Promise<number>} Number of errors flushed
   */
  async forceFlush() {
    if (!this.status.initialized) {
      return 0;
    }

    try {
      await errorCollector.forceFlush();
      return errorCollector.errorQueue.length;
    } catch (error) {
      logger.error(ERROR_CODES.PERF_FLUSH_FAILED, 'Failed to force flush', {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get error statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Error statistics
   */
  async getErrorStats(filters = {}) {
    try {
      const { getPerformanceStats } = await import(
        '../api/performanceMonitoringApi'
      );
      return await getPerformanceStats(filters);
    } catch (error) {
      logger.error(ERROR_CODES.PERF_STATS_FAILED, 'Failed to get error stats', {
        error: error.message,
        filters,
      });
      return null;
    }
  }

  /**
   * Get recent errors
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Recent errors
   */
  async getRecentErrors(options = {}) {
    try {
      const { getRecentErrors } = await import(
        '../api/performanceMonitoringApi'
      );
      return await getRecentErrors(options);
    } catch (error) {
      logger.error(
        ERROR_CODES.PERF_REPORT_FAILED,
        'Failed to get recent errors',
        {
          error: error.message,
          options,
        }
      );
      return null;
    }
  }

  /**
   * Clear error queue
   */
  clearQueue() {
    if (this.status.initialized) {
      errorCollector.clearQueue();
    }
  }

  /**
   * Reset status and counters
   */
  reset() {
    this.status.errorCount = 0;
    this.status.lastErrorTime = null;
    this.clearQueue();
  }

  /**
   * Destroy performance monitoring manager
   */
  destroy() {
    try {
      // Stop retry processor
      if (this.retryTimer) {
        clearInterval(this.retryTimer);
        this.retryTimer = null;
      }

      // Disconnect performance observers
      if (this.performanceObservers.lcp) {
        this.performanceObservers.lcp.disconnect();
        this.performanceObservers.lcp = null;
      }
      if (this.performanceObservers.cls) {
        this.performanceObservers.cls.disconnect();
        this.performanceObservers.cls = null;
      }
      if (this.performanceObservers.fid) {
        this.performanceObservers.fid.disconnect();
        this.performanceObservers.fid = null;
      }
      if (this.performanceObservers.inp) {
        this.performanceObservers.inp.disconnect();
        this.performanceObservers.inp = null;
      }

      // Teardown network monitoring
      this.teardownNetworkInterceptors();
      this.removeResourceErrorListeners();
      this.removeNetworkStatusListeners();

      // Destroy error collector
      if (errorCollector.isInitialized) {
        errorCollector.destroy();
      }

      // Clear persistent initialization flags
      sessionStorage.removeItem('iw_perf_initialized');
      sessionStorage.removeItem('iw_perf_init_time');

      this.status.initialized = false;
      this.status.healthStatus = 'unknown';
      logger.info('IW-PERF-019', 'Performance monitoring manager destroyed');
    } catch (error) {
      logger.error(
        ERROR_CODES.PERF_MONITORING_INIT_FAILED,
        'Failed to destroy performance monitoring manager',
        {
          error: error.message,
        }
      );
    }
  }

  /**
   * Get configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Set specific configuration option
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   */
  setConfigOption(key, value) {
    if (key in this.config) {
      this.config[key] = value;
      this.applyConfiguration();
    } else {
      logger.warn(
        ERROR_CODES.COMMON_VALIDATION_ERROR,
        `Unknown configuration option: ${key}`,
        {
          key,
          value,
        }
      );
    }
  }

  /**
   * Install network interceptors (fetch + XHR)
   */
  installNetworkInterceptors() {
    if (!this.config.enableNetworkCapture || this._networkPatched) return;
    this._networkPatched = true;

    // ---- fetch wrapper ----
    const originalFetch = window.fetch;
    this._originalFetch = originalFetch;

    const scrubUrl = (url) => {
      try {
        const u = new URL(url, location.href);
        // keep utm_* only
        [...u.searchParams.keys()].forEach((k) => {
          if (!/^utm_/.test(k)) u.searchParams.delete(k);
        });
        return u.toString();
      } catch {
        return String(url);
      }
    };

    const maybeText = async (res, limit) => {
      try {
        const ct = res.headers.get('content-type') || '';
        if (!/json|text|xml/.test(ct)) return undefined;
        const txt = await res.clone().text();
        return txt.slice(0, limit);
      } catch {
        return undefined;
      }
    };

    window.fetch = async (...args) => {
      const startedAt = performance.now();
      const startedTs = new Date().toISOString();

      // parse request
      let input = args[0],
        init = args[1] || {};
      let url = typeof input === 'string' ? input : input.url;
      let method = (
        init.method ||
        (typeof input !== 'string' && input.method) ||
        'GET'
      ).toUpperCase();

      const reqBody =
        this.config.captureRequestBody &&
        init.body &&
        typeof init.body === 'string'
          ? init.body.slice(0, this.config.responseBodyLimit)
          : undefined;

      try {
        const res = await originalFetch(...args);
        const durationMs = Math.max(
          0,
          Math.round(performance.now() - startedAt)
        );

        if (!res.ok || res.status >= this.config.statusThreshold) {
          const body = this.config.captureResponseBody
            ? await maybeText(res, this.config.responseBodyLimit)
            : undefined;

          errorCollector.collectError('network', {
            kind: 'fetch',
            phase: 'response',
            method,
            url: scrubUrl(url),
            status: res.status,
            statusText: res.statusText,
            durationMs,
            startedTs,
            endedTs: new Date().toISOString(),
            request: { body: reqBody },
            response: { bodyPreview: body },
            nav: {
              online: navigator.onLine,
              effectiveType: navigator.connection?.effectiveType,
            },
          });
          this.status.errorCount++;
          this.status.lastErrorTime = new Date();
        }
        return res;
      } catch (err) {
        const durationMs = Math.max(
          0,
          Math.round(performance.now() - startedAt)
        );
        errorCollector.collectError('network', {
          kind: 'fetch',
          phase: 'exception',
          method,
          url: scrubUrl(url),
          errorName: err?.name || 'Error',
          errorMessage: err?.message || String(err),
          durationMs,
          startedTs,
          endedTs: new Date().toISOString(),
          nav: {
            online: navigator.onLine,
            effectiveType: navigator.connection?.effectiveType,
          },
        });
        this.status.errorCount++;
        this.status.lastErrorTime = new Date();
        throw err; // preserve behavior
      }
    };

    // ---- XHR wrapper ----
    const OriginalXHR = window.XMLHttpRequest;
    this._OriginalXHR = OriginalXHR;

    const self = this; // retain this
    function WrappedXHR() {
      const xhr = new OriginalXHR();
      let _method = 'GET';
      let _url = '';
      let startedAt = 0;
      let startedTs = '';

      const sendError = (phase, extra = {}) => {
        const durationMs = startedAt
          ? Math.max(0, Math.round(performance.now() - startedAt))
          : undefined;
        errorCollector.collectError('network', {
          kind: 'xhr',
          phase,
          method: _method,
          url: scrubUrl(_url),
          status: xhr.status || extra.status,
          statusText: xhr.statusText || extra.statusText,
          durationMs,
          startedTs,
          endedTs: new Date().toISOString(),
          errorName: extra.errorName,
          errorMessage: extra.errorMessage,
          nav: {
            online: navigator.onLine,
            effectiveType: navigator.connection?.effectiveType,
          },
        });
        self.status.errorCount++;
        self.status.lastErrorTime = new Date();
      };

      const _open = xhr.open;
      xhr.open = function (method, url, ...rest) {
        _method = (method || 'GET').toUpperCase();
        _url = url;
        return _open.call(xhr, method, url, ...rest);
      };

      const _send = xhr.send;
      xhr.send = function (body) {
        startedAt = performance.now();
        startedTs = new Date().toISOString();

        xhr.addEventListener('load', () => {
          if (xhr.status >= self.config.statusThreshold) {
            sendError('response');
          }
        });

        xhr.addEventListener('error', () => {
          sendError('error', {
            errorName: 'NetworkError',
            errorMessage: 'XHR network error',
          });
        });

        xhr.addEventListener('timeout', () => {
          sendError('timeout', {
            errorName: 'TimeoutError',
            errorMessage: 'XHR timed out',
          });
        });

        xhr.addEventListener('abort', () => {
          sendError('abort', {
            errorName: 'AbortError',
            errorMessage: 'XHR aborted',
          });
        });

        return _send.call(xhr, body);
      };

      return xhr;
    }
    WrappedXHR.prototype = this._OriginalXHR?.prototype;
    window.XMLHttpRequest = WrappedXHR;
  }

  /**
   * Teardown network interceptors
   */
  teardownNetworkInterceptors() {
    if (!this._networkPatched) return;
    if (this._originalFetch) window.fetch = this._originalFetch;
    if (this._OriginalXHR) window.XMLHttpRequest = this._OriginalXHR;
    this._originalFetch = null;
    this._OriginalXHR = null;
    this._networkPatched = false;
  }

  /**
   * Install resource error listeners (img/script/link)
   */
  installResourceErrorListeners() {
    if (this._resourceListenersInstalled) return;
    this._resourceListenersInstalled = true;

    this._onResourceError = (e) => {
      const t = e.target;
      if (!t || !(t instanceof Element)) return;
      const tag = t.tagName;
      if (!['IMG', 'SCRIPT', 'LINK'].includes(tag)) return;

      const url = (
        t.getAttribute('src') ||
        t.getAttribute('href') ||
        ''
      ).trim();
      errorCollector.collectError('network', {
        kind: 'resource',
        tag,
        url,
        phase: 'error',
        startedTs: null,
        endedTs: new Date().toISOString(),
        nav: {
          online: navigator.onLine,
          effectiveType: navigator.connection?.effectiveType,
        },
      });
      this.status.errorCount++;
      this.status.lastErrorTime = new Date();
    };

    window.addEventListener('error', this._onResourceError, true);
  }

  /**
   * Remove resource error listeners
   */
  removeResourceErrorListeners() {
    if (!this._resourceListenersInstalled) return;
    window.removeEventListener('error', this._onResourceError, true);
    this._resourceListenersInstalled = false;
  }

  /**
   * Install network status listeners (online/offline)
   */
  installNetworkStatusListeners() {
    if (this._netStatusInstalled) return;
    this._netStatusInstalled = true;

    this._onOffline = () =>
      errorCollector.collectError('network', {
        kind: 'status',
        phase: 'offline',
        ts: new Date().toISOString(),
      });
    this._onOnline = () =>
      errorCollector.collectError('network', {
        kind: 'status',
        phase: 'online',
        ts: new Date().toISOString(),
        effectiveType: navigator.connection?.effectiveType,
      });

    window.addEventListener('offline', this._onOffline);
    window.addEventListener('online', this._onOnline);
  }

  /**
   * Remove network status listeners
   */
  removeNetworkStatusListeners() {
    if (!this._netStatusInstalled) return;
    window.removeEventListener('offline', this._onOffline);
    window.removeEventListener('online', this._onOnline);
    this._netStatusInstalled = false;
  }

  /**
   * ========================================
   * PERFORMANCE METRICS COLLECTION METHODS
   * ========================================
   */

  /**
   * Parse Operating System from user agent
   */
  parseOS(userAgent) {
    const os = userAgent.toLowerCase();
    if (os.includes('windows nt 10.0'))
      return { name: 'Windows', version: '10' };
    if (os.includes('windows nt 6.3'))
      return { name: 'Windows', version: '8.1' };
    if (os.includes('windows nt 6.2')) return { name: 'Windows', version: '8' };
    if (os.includes('windows nt 6.1')) return { name: 'Windows', version: '7' };
    if (os.includes('mac os x')) {
      const match = os.match(/mac os x (\d+)[._](\d+)/);
      return {
        name: 'macOS',
        version: match ? `${match[1]}.${match[2]}` : 'unknown',
      };
    }
    if (os.includes('android')) {
      const match = os.match(/android (\d+\.?\d*)/);
      return { name: 'Android', version: match ? match[1] : 'unknown' };
    }
    if (os.includes('iphone') || os.includes('ipad')) {
      const match = os.match(/os (\d+)[._](\d+)/);
      return {
        name: 'iOS',
        version: match ? `${match[1]}.${match[2]}` : 'unknown',
      };
    }
    if (os.includes('linux')) return { name: 'Linux', version: 'unknown' };
    return { name: 'Unknown', version: 'unknown' };
  }

  /**
   * Parse Device from user agent
   */
  parseDevice(userAgent) {
    const ua = userAgent.toLowerCase();
    const isMobile =
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isTablet = /ipad|tablet|kindle|playbook|silk/i.test(ua);

    let type = 'desktop';
    if (isTablet) type = 'tablet';
    else if (isMobile) type = 'mobile';

    // Try to extract device model
    let model = 'Unknown';
    if (ua.includes('iphone')) model = 'iPhone';
    else if (ua.includes('ipad')) model = 'iPad';
    else if (ua.includes('pixel')) model = 'Pixel';
    else if (ua.includes('samsung')) model = 'Samsung';

    return { type, model };
  }

  /**
   * Parse Browser from user agent
   */
  parseBrowser(userAgent) {
    const ua = userAgent;

    // Edge
    if (ua.includes('Edg/')) {
      const match = ua.match(/Edg\/(\d+\.\d+)/);
      return { name: 'Edge', version: match ? match[1] : 'unknown' };
    }

    // Chrome
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      const match = ua.match(/Chrome\/(\d+\.\d+)/);
      return { name: 'Chrome', version: match ? match[1] : 'unknown' };
    }

    // Firefox
    if (ua.includes('Firefox/')) {
      const match = ua.match(/Firefox\/(\d+\.\d+)/);
      return { name: 'Firefox', version: match ? match[1] : 'unknown' };
    }

    // Safari (must be after Chrome check)
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      const match = ua.match(/Version\/(\d+\.\d+)/);
      return { name: 'Safari', version: match ? match[1] : 'unknown' };
    }

    return { name: 'Unknown', version: 'unknown' };
  }

  /**
   * Detect device information
   */
  detectDevice() {
    const userAgent = navigator.userAgent;
    const os = this.parseOS(userAgent);
    const device = this.parseDevice(userAgent);

    return {
      os_name: os.name,
      os_version: os.version,
      device_type: device.type,
      device_model: device.model,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      pixel_ratio: window.devicePixelRatio || 1,
      touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  }

  /**
   * Detect browser information
   */
  detectBrowser() {
    const browser = this.parseBrowser(navigator.userAgent);

    return {
      name: browser.name,
      version: browser.version,
      user_agent: navigator.userAgent,
      language: navigator.language,
      cookies_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack === '1',
      platform: navigator.platform,
    };
  }

  /**
   * Detect network information
   */
  detectNetwork() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      return {
        type: 'unknown',
        effective_type: 'unknown',
        downlink: null,
        rtt: null,
        save_data: false,
      };
    }

    return {
      type: connection.type || 'unknown',
      effective_type: connection.effectiveType || 'unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      save_data: connection.saveData || false,
    };
  }

  /**
   * Detect geolocation (IP-based)
   */
  async detectLocation() {
    try {
      // Try ipapi.co first
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name || 'Unknown',
          country_code: data.country_code || 'Unknown',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          timezone: data.timezone || 'Unknown',
          ip: data.ip || 'Unknown',
        };
      }
    } catch (error) {
      logger.debug('IW_PERF_METRICS_001', 'Failed to detect location', {
        error: error.message,
      });
    }

    // Fallback to basic timezone detection
    return {
      country: 'Unknown',
      country_code: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      ip: 'Unknown',
    };
  }

  /**
   * Set up early PerformanceObservers for Core Web Vitals
   * This runs immediately on initialization to capture metrics as they happen
   */
  setupEarlyPerformanceObservers() {
    try {
      // LCP Observer
      this.performanceObservers.lcp = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.performanceMetrics.coreWebVitals.lcp = Math.round(
            lastEntry.renderTime || lastEntry.loadTime
          );
        }
      });
      this.performanceObservers.lcp.observe({
        type: 'largest-contentful-paint',
        buffered: true,
      });
    } catch (e) {
      logger.debug('IW_PERF_OBS_001', 'LCP observer not supported');
    }

    try {
      // CLS Observer
      let clsValue = 0;
      this.performanceObservers.cls = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.performanceMetrics.coreWebVitals.cls = clsValue;
      });
      this.performanceObservers.cls.observe({
        type: 'layout-shift',
        buffered: true,
      });
    } catch (e) {
      logger.debug('IW_PERF_OBS_002', 'CLS observer not supported');
    }

    try {
      // FID Observer
      this.performanceObservers.fid = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        if (firstInput) {
          this.performanceMetrics.coreWebVitals.fid = Math.round(
            firstInput.processingStart - firstInput.startTime
          );
        }
      });
      this.performanceObservers.fid.observe({
        type: 'first-input',
        buffered: true,
      });
    } catch (e) {
      logger.debug('IW_PERF_OBS_003', 'FID observer not supported');
    }

    try {
      // INP Observer
      let worstInp = 0;
      this.performanceObservers.inp = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const interactionLatency = entry.processingStart
            ? entry.processingEnd - entry.startTime
            : entry.duration;
          if (interactionLatency > worstInp && interactionLatency >= 40) {
            worstInp = Math.round(interactionLatency);
            this.performanceMetrics.coreWebVitals.inp = worstInp;
          }
        }
      });
      this.performanceObservers.inp.observe({
        type: 'event',
        buffered: true,
        durationThreshold: 40,
      });
    } catch (e) {
      logger.debug('IW_PERF_OBS_004', 'INP observer not supported');
    }

    logger.debug('IW_PERF_OBS_005', 'Early performance observers set up');
  }

  /**
   * Collect Core Web Vitals
   * This method reads from observer-collected metrics and falls back to synchronous collection
   */
  collectCoreWebVitals() {
    const metrics = {};

    // Try to get paint timings (FCP) - synchronous only
    try {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = Math.round(entry.startTime);
        }
      });
    } catch (e) {
      logger.debug('IW_PERF_METRICS_001', 'FCP collection failed');
    }

    // Get navigation timing for TTFB - synchronous only
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        metrics.ttfb = Math.round(
          navigation.responseStart - navigation.requestStart
        );
        metrics.dom_content_loaded = Math.round(
          navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart
        );
        metrics.load_complete = Math.round(
          navigation.loadEventEnd - navigation.loadEventStart
        );
      }
    } catch (e) {
      logger.debug(
        'IW_PERF_METRICS_002',
        'Navigation timing collection failed'
      );
    }

    // LCP - Prefer observer-collected value, fall back to synchronous
    if (this.performanceMetrics.coreWebVitals.lcp) {
      metrics.lcp = this.performanceMetrics.coreWebVitals.lcp;
    } else {
      try {
        const lcpEntries = performance.getEntriesByType(
          'largest-contentful-paint'
        );
        if (lcpEntries && lcpEntries.length > 0) {
          const lastEntry = lcpEntries[lcpEntries.length - 1];
          metrics.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
        }
      } catch (e) {
        logger.debug('IW_PERF_METRICS_003', 'LCP collection not supported');
      }
    }

    // CLS - Prefer observer-collected value, fall back to synchronous
    if (this.performanceMetrics.coreWebVitals.cls !== undefined) {
      metrics.cls = this.performanceMetrics.coreWebVitals.cls;
    } else {
      try {
        let clsValue = 0;
        const clsEntries = performance.getEntriesByType('layout-shift');
        for (const entry of clsEntries) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.cls = clsValue;
      } catch (e) {
        logger.debug('IW_PERF_METRICS_004', 'CLS collection not supported');
      }
    }

    // FID - Prefer observer-collected value, fall back to synchronous
    if (this.performanceMetrics.coreWebVitals.fid) {
      metrics.fid = this.performanceMetrics.coreWebVitals.fid;
    } else {
      try {
        const fidEntries = performance.getEntriesByType('first-input');
        if (fidEntries && fidEntries.length > 0) {
          const firstInput = fidEntries[0];
          metrics.fid = Math.round(
            firstInput.processingStart - firstInput.startTime
          );
        }
      } catch (e) {
        logger.debug('IW_PERF_METRICS_005', 'FID collection not supported');
      }
    }

    // INP - Prefer observer-collected value, fall back to synchronous
    if (this.performanceMetrics.coreWebVitals.inp) {
      metrics.inp = this.performanceMetrics.coreWebVitals.inp;
    } else {
      try {
        let worstInp = 0;
        const eventEntries = performance.getEntriesByType('event');
        for (const entry of eventEntries) {
          const interactionLatency = entry.processingStart
            ? entry.processingEnd - entry.startTime
            : entry.duration;
          if (interactionLatency > worstInp && interactionLatency >= 40) {
            worstInp = Math.round(interactionLatency);
          }
        }
        if (worstInp > 0) {
          metrics.inp = worstInp;
        }
      } catch (e) {
        logger.debug('IW_PERF_METRICS_006', 'INP collection not supported');
      }
    }

    return metrics;
  }

  /**
   * Collect loading performance metrics
   */
  collectLoadingPerformance() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return {};

    // Calculate DNS lookup time (0 if using existing connection or cached)
    const dnsLookup = Math.round(
      navigation.domainLookupEnd - navigation.domainLookupStart
    );

    // Calculate TCP connection time (0 if reusing existing connection)
    const tcpConnection = Math.round(
      navigation.connectEnd - navigation.connectStart
    );

    // Calculate SSL negotiation time (0 if not HTTPS or reusing connection)
    const sslNegotiation =
      navigation.secureConnectionStart > 0
        ? Math.round(navigation.connectEnd - navigation.secureConnectionStart)
        : 0;

    return {
      dns_lookup: dnsLookup > 0 ? dnsLookup : undefined, // Don't show 0ms
      tcp_connection: tcpConnection > 0 ? tcpConnection : undefined, // Don't show 0ms
      ssl_negotiation: sslNegotiation > 0 ? sslNegotiation : undefined, // Don't show 0ms
      server_response: Math.round(
        navigation.responseEnd - navigation.requestStart
      ),
      dom_processing: Math.round(
        navigation.domComplete - navigation.domInteractive
      ),
      total_load_time: Math.round(
        navigation.loadEventEnd - navigation.fetchStart
      ),
    };
  }

  /**
   * Collect Next.js specific metrics
   */
  collectNextJSMetrics() {
    const metrics = {};

    // Check for Next.js hydration markers
    const hydrationStart = performance.getEntriesByName('Next.js-hydration');
    if (hydrationStart && hydrationStart.length > 0) {
      metrics.hydration_time = Math.round(hydrationStart[0].duration);
    }

    // Check for route change markers
    const routeChange = performance.getEntriesByName(
      'Next.js-route-change-to-render'
    );
    if (routeChange && routeChange.length > 0) {
      metrics.route_change_time = Math.round(routeChange[0].duration);
    }

    return metrics;
  }

  /**
   * Collect resource metrics
   */
  collectResourceMetrics() {
    const resources = performance.getEntriesByType('resource');

    const metrics = {
      total_resources: resources.length,
      scripts: 0,
      stylesheets: 0,
      images: 0,
      fonts: 0,
      xhr: 0,
      fetch: 0,
      total_size: 0,
      cached_resources: 0,
    };

    resources.forEach((resource) => {
      // Count by type
      if (resource.initiatorType === 'script') metrics.scripts++;
      else if (resource.initiatorType === 'css') metrics.stylesheets++;
      else if (resource.initiatorType === 'img') metrics.images++;
      else if (resource.initiatorType === 'font') metrics.fonts++;
      else if (resource.initiatorType === 'xmlhttprequest') metrics.xhr++;
      else if (resource.initiatorType === 'fetch') metrics.fetch++;

      // Sum transfer size
      if (resource.transferSize !== undefined) {
        metrics.total_size += resource.transferSize;
        if (resource.transferSize === 0) metrics.cached_resources++;
      }
    });

    return metrics;
  }

  /**
   * Collect runtime metrics
   */
  collectRuntimeMetrics() {
    const metrics = {};

    // Memory usage (if available)
    if (performance.memory) {
      metrics.used_js_heap_size = performance.memory.usedJSHeapSize;
      metrics.total_js_heap_size = performance.memory.totalJSHeapSize;
      metrics.js_heap_size_limit = performance.memory.jsHeapSizeLimit;
    }

    // Count long tasks (if available)
    try {
      const longTasks = performance.getEntriesByType('longtask');
      metrics.long_tasks_count = longTasks.length;
      metrics.long_tasks_duration = longTasks.reduce(
        (sum, task) => sum + task.duration,
        0
      );
    } catch (e) {
      // Long Tasks API not supported
    }

    return metrics;
  }

  /**
   * Collect network metrics
   */
  collectNetworkMetrics() {
    const resources = performance.getEntriesByType('resource');

    const metrics = {
      total_requests: resources.length,
      failed_requests: 0,
      average_latency: 0,
      total_transfer_size: 0,
    };

    let totalLatency = 0;
    resources.forEach((resource) => {
      totalLatency += resource.duration;
      if (resource.transferSize !== undefined) {
        metrics.total_transfer_size += resource.transferSize;
      }
    });

    if (resources.length > 0) {
      metrics.average_latency = Math.round(totalLatency / resources.length);
    }

    return metrics;
  }

  /**
   * Collect image metrics
   */
  collectImageMetrics() {
    const images = performance
      .getEntriesByType('resource')
      .filter((r) => r.initiatorType === 'img');

    const metrics = {
      total_images: images.length,
      total_image_size: 0,
      largest_image_size: 0,
      average_image_load_time: 0,
    };

    let totalLoadTime = 0;
    images.forEach((img) => {
      if (img.transferSize !== undefined) {
        metrics.total_image_size += img.transferSize;
        if (img.transferSize > metrics.largest_image_size) {
          metrics.largest_image_size = img.transferSize;
        }
      }
      totalLoadTime += img.duration;
    });

    if (images.length > 0) {
      metrics.average_image_load_time = Math.round(
        totalLoadTime / images.length
      );
    }

    return metrics;
  }

  /**
   * Collect mobile-specific metrics
   */
  collectMobileMetrics() {
    const device = this.detectDevice();

    return {
      is_mobile: device.device_type === 'mobile',
      is_tablet: device.device_type === 'tablet',
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      orientation: window.screen.orientation?.type || 'unknown',
      touch_points: navigator.maxTouchPoints || 0,
    };
  }

  /**
   * Collect accessibility metrics
   */
  collectAccessibilityMetrics() {
    const metrics = {
      reduced_motion: window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches,
      high_contrast: window.matchMedia('(prefers-contrast: high)').matches,
      dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      font_scale: 1, // Default, can be enhanced
    };

    return metrics;
  }

  /**
   * Calculate performance score (0-100)
   */
  calculatePerformanceScore() {
    const metrics = this.performanceMetrics;
    let score = 100;

    // Deduct points for slow FCP
    if (metrics.coreWebVitals.fcp > 3000) score -= 15;
    else if (metrics.coreWebVitals.fcp > 1800) score -= 8;

    // Deduct points for slow LCP (most important metric)
    if (metrics.coreWebVitals.lcp > 4000) score -= 25;
    else if (metrics.coreWebVitals.lcp > 2500) score -= 12;

    // Deduct points for slow TTFB
    if (metrics.coreWebVitals.ttfb > 800) score -= 10;
    else if (metrics.coreWebVitals.ttfb > 600) score -= 5;

    // Deduct points for high CLS
    if (metrics.coreWebVitals.cls > 0.25) score -= 15;
    else if (metrics.coreWebVitals.cls > 0.1) score -= 8;

    // Deduct points for slow INP
    if (metrics.coreWebVitals.inp > 500) score -= 15;
    else if (metrics.coreWebVitals.inp > 200) score -= 8;

    // Deduct points for slow load time
    if (metrics.loadingPerformance.total_load_time > 5000) score -= 10;
    else if (metrics.loadingPerformance.total_load_time > 3000) score -= 5;

    // Deduct points for large resource count
    if (metrics.resources.total_resources > 100) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Identify performance issues
   */
  identifyIssues() {
    const issues = [];
    const metrics = this.performanceMetrics;

    if (metrics.coreWebVitals.fcp > 3000) {
      issues.push({
        type: 'fcp',
        severity: 'high',
        message: 'First Contentful Paint is too slow',
      });
    }

    if (metrics.coreWebVitals.lcp > 4000) {
      issues.push({
        type: 'lcp',
        severity: 'high',
        message: 'Largest Contentful Paint is too slow',
      });
    } else if (metrics.coreWebVitals.lcp > 2500) {
      issues.push({
        type: 'lcp',
        severity: 'medium',
        message: 'Largest Contentful Paint needs improvement',
      });
    }

    if (metrics.coreWebVitals.ttfb > 800) {
      issues.push({
        type: 'ttfb',
        severity: 'high',
        message: 'Time to First Byte is too slow',
      });
    }

    if (metrics.coreWebVitals.cls > 0.25) {
      issues.push({
        type: 'cls',
        severity: 'high',
        message: 'Cumulative Layout Shift is too high',
      });
    }

    if (metrics.coreWebVitals.inp > 500) {
      issues.push({
        type: 'inp',
        severity: 'high',
        message: 'Interaction to Next Paint is too slow',
      });
    } else if (metrics.coreWebVitals.inp > 200) {
      issues.push({
        type: 'inp',
        severity: 'medium',
        message: 'Interaction to Next Paint needs improvement',
      });
    }

    if (metrics.loadingPerformance.total_load_time > 5000) {
      issues.push({
        type: 'load_time',
        severity: 'medium',
        message: 'Total load time is too slow',
      });
    }

    if (metrics.resources.total_resources > 100) {
      issues.push({
        type: 'resources',
        severity: 'medium',
        message: 'Too many resources loaded',
      });
    }

    if (metrics.runtime.long_tasks_count > 5) {
      issues.push({
        type: 'long_tasks',
        severity: 'high',
        message: 'Too many long tasks blocking main thread',
      });
    }

    return issues;
  }

  /**
   * Collect all performance metrics
   */
  async collectAllMetrics() {
    if (this.metricsCollected) return;

    logger.info('IW_PERF_METRICS_003', 'Collecting performance metrics');

    // Collect context
    this.performanceMetrics.device = this.detectDevice();
    this.performanceMetrics.browser = this.detectBrowser();
    this.performanceMetrics.networkInfo = this.detectNetwork();
    this.performanceMetrics.location = await this.detectLocation();

    // Collect performance metrics
    this.performanceMetrics.coreWebVitals = this.collectCoreWebVitals();
    this.performanceMetrics.loadingPerformance =
      this.collectLoadingPerformance();
    this.performanceMetrics.nextjsSpecific = this.collectNextJSMetrics();
    this.performanceMetrics.resources = this.collectResourceMetrics();
    this.performanceMetrics.runtime = this.collectRuntimeMetrics();
    this.performanceMetrics.network = this.collectNetworkMetrics();
    this.performanceMetrics.images = this.collectImageMetrics();
    this.performanceMetrics.mobile = this.collectMobileMetrics();
    this.performanceMetrics.accessibility = this.collectAccessibilityMetrics();

    // Calculate score and identify issues
    this.performanceMetrics.score = this.calculatePerformanceScore();
    this.performanceMetrics.issues = this.identifyIssues();

    // Analyze resources for optimization opportunities
    this.performanceMetrics.resourceIssues = analyzeResources();
    this.performanceMetrics.resourceSummary = getIssueSummary(
      this.performanceMetrics.resourceIssues
    );

    this.metricsCollected = true;

    logger.info('IW_PERF_METRICS_004', 'Performance metrics collected', {
      score: this.performanceMetrics.score,
      issues: this.performanceMetrics.issues.length,
      resourceIssues: this.performanceMetrics.resourceIssues.length,
      wastedBytes: this.performanceMetrics.resourceSummary.totalWastedBytes,
    });

    // Report metrics
    await this.reportPerformanceMetrics();
  }

  /**
   * Report performance metrics to backend
   */
  async reportPerformanceMetrics() {
    try {
      // Validate required fields
      if (!this.config.organizationId) {
        logger.error(
          'IW_PERF_METRICS_008',
          'Cannot report metrics: missing organization_id'
        );
        return;
      }

      if (!this.config.assistantId) {
        logger.error(
          'IW_PERF_METRICS_009',
          'Cannot report metrics: missing assistant_id'
        );
        return;
      }

      if (!this.config.sessionId) {
        logger.error(
          'IW_PERF_METRICS_010',
          'Cannot report metrics: missing session_id'
        );
        return;
      }

      const payload = {
        metrics: this.performanceMetrics,
        timestamp: new Date().toISOString(),
        organization_id: this.config.organizationId,
        assistant_id: this.config.assistantId,
        session_id: this.config.sessionId,
        url: window.location.href,
      };

      logger.info('IW_PERF_METRICS_011', 'Reporting performance metrics', {
        organization_id: this.config.organizationId,
        assistant_id: this.config.assistantId,
        session_id: this.config.sessionId?.substring(0, 15) + '...',
        score: this.performanceMetrics.score,
      });

      const response = await fetch(
        `${process.env.NODE_PUBLIC_API_URL}/api/performance-monitoring/metrics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        logger.info(
          'IW_PERF_METRICS_005',
          'Performance metrics reported successfully'
        );
      } else {
        const errorData = await response.json().catch(() => null);
        logger.warn(
          'IW_PERF_METRICS_006',
          'Failed to report performance metrics',
          {
            status: response.status,
            error: errorData?.error || errorData?.message,
          }
        );
      }
    } catch (error) {
      logger.error(
        'IW_PERF_METRICS_007',
        'Error reporting performance metrics',
        {
          error: error.message,
        }
      );
    }
  }

  /**
   * Start performance metrics collection after page load
   */
  startMetricsCollection() {
    // Wait for page load to collect accurate metrics
    // Using 3 seconds to allow LCP to stabilize (it updates until page is fully loaded)
    if (document.readyState === 'complete') {
      setTimeout(() => this.collectAllMetrics(), 3000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectAllMetrics(), 3000);
      });
    }
  }

  /**
   * Get or create session ID (same logic as VisitorJourneyAnalytics)
   */
  _getOrCreateSessionId() {
    try {
      // Try sessionStorage first (cleared on tab close)
      let sessionId = sessionStorage.getItem('iw_session_id');

      if (sessionId) {
        return sessionId;
      }

      // Fallback to localStorage with expiration (persists across pages)
      const stored = localStorage.getItem('iw_session_data');
      if (stored) {
        try {
          const { id, timestamp } = JSON.parse(stored);
          const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
          const age = Date.now() - timestamp;

          // Reuse session if within timeout window
          if (age < SESSION_TIMEOUT) {
            sessionId = id;
            sessionStorage.setItem('iw_session_id', sessionId);
            // Update timestamp to extend session
            localStorage.setItem(
              'iw_session_data',
              JSON.stringify({
                id: sessionId,
                timestamp: Date.now(),
              })
            );
            return sessionId;
          }
        } catch (e) {
          logger.debug(
            'IW_PERF_SESSION_001',
            'Failed to parse stored session data'
          );
        }
      }

      // Generate new session ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('iw_session_id', sessionId);
      localStorage.setItem(
        'iw_session_data',
        JSON.stringify({
          id: sessionId,
          timestamp: Date.now(),
        })
      );

      logger.info('IW_PERF_SESSION_002', 'Created new session ID', {
        sessionId: sessionId.substring(0, 15) + '...',
      });

      return sessionId;
    } catch (error) {
      logger.error('IW_PERF_SESSION_003', 'Failed to get/create session ID', {
        error: error.message,
      });
      // Fallback to timestamp-based ID
      return `session_${Date.now()}_fallback`;
    }
  }
}

// Create singleton instance
const performanceMonitoringManager = new PerformanceMonitoringManager();

export { PerformanceMonitoringManager, performanceMonitoringManager };
export default performanceMonitoringManager;
