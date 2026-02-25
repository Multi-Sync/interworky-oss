/**
 * Browser and Device Detection Utilities
 *
 * Provides utilities for detecting browser, device, and performance information.
 * Used by performance monitoring to provide context for error reports.
 */

/**
 * Parse browser information from user agent string
 * @param {string} userAgent - User agent string
 * @returns {Object} Browser information
 */
export function parseBrowserInfo(userAgent = navigator.userAgent) {
  const browserInfo = {
    name: 'Unknown',
    version: 'Unknown',
    platform: 'Unknown',
    engine: 'Unknown',
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
    // Opera detection
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browserInfo.name = 'Opera';
      const match = userAgent.match(/(?:Opera|OPR)\/(\d+\.\d+)/);
      if (match) browserInfo.version = match[1];
    }

    // Platform detection
    if (userAgent.includes('Windows NT')) {
      browserInfo.platform = 'Windows';
      const versionMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
      if (versionMatch) {
        browserInfo.platform += ` ${versionMatch[1]}`;
      }
    } else if (userAgent.includes('Mac OS X')) {
      browserInfo.platform = 'macOS';
      const versionMatch = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      if (versionMatch) {
        browserInfo.platform += ` ${versionMatch[1].replace('_', '.')}`;
      }
    } else if (userAgent.includes('Linux')) {
      browserInfo.platform = 'Linux';
    } else if (userAgent.includes('Android')) {
      browserInfo.platform = 'Android';
      const versionMatch = userAgent.match(/Android (\d+\.\d+)/);
      if (versionMatch) {
        browserInfo.platform += ` ${versionMatch[1]}`;
      }
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      browserInfo.platform = 'iOS';
      const versionMatch = userAgent.match(/OS (\d+[._]\d+)/);
      if (versionMatch) {
        browserInfo.platform += ` ${versionMatch[1].replace('_', '.')}`;
      }
    }

    // Engine detection
    if (userAgent.includes('WebKit')) {
      browserInfo.engine = 'WebKit';
    } else if (userAgent.includes('Gecko')) {
      browserInfo.engine = 'Gecko';
    } else if (userAgent.includes('Trident')) {
      browserInfo.engine = 'Trident';
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
export function parseDeviceInfo(
  userAgent = navigator.userAgent,
  screenData = {}
) {
  const deviceInfo = {
    type: 'desktop',
    screen_resolution: 'Unknown',
    viewport_size: 'Unknown',
    pixel_ratio: window.devicePixelRatio || 1,
    orientation: 'unknown',
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
    } else if (screen.width && screen.height) {
      deviceInfo.screen_resolution = `${screen.width}x${screen.height}`;
    }

    // Viewport size
    if (screenData.viewportWidth && screenData.viewportHeight) {
      deviceInfo.viewport_size = `${screenData.viewportWidth}x${screenData.viewportHeight}`;
    } else {
      deviceInfo.viewport_size = `${window.innerWidth}x${window.innerHeight}`;
    }

    // Orientation
    if (screen.orientation) {
      deviceInfo.orientation = screen.orientation.type;
    } else if (window.orientation !== undefined) {
      deviceInfo.orientation =
        window.orientation === 0 ? 'portrait' : 'landscape';
    }
  } catch (error) {
    console.error('Failed to parse device info:', error);
  }

  return deviceInfo;
}

/**
 * Get current performance metrics
 * @returns {Object} Performance metrics
 */
export function getPerformanceMetrics() {
  const metrics = {
    load_time: null,
    memory_usage: null,
    network_requests: 0,
    dom_elements: 0,
    js_heap_size: null,
    js_heap_used: null,
    connection_type: 'unknown',
    connection_speed: 'unknown',
  };

  try {
    // Load time calculation
    if (performance.timing) {
      const timing = performance.timing;
      metrics.load_time = timing.loadEventEnd - timing.navigationStart;
    }

    // Memory usage
    if (performance.memory) {
      metrics.js_heap_size = performance.memory.jsHeapSizeLimit;
      metrics.js_heap_used = performance.memory.usedJSHeapSize;
      metrics.memory_usage = performance.memory.totalJSHeapSize;
    }

    // Network requests count
    if (performance.getEntriesByType) {
      metrics.network_requests =
        performance.getEntriesByType('resource').length;
    }

    // DOM elements count
    metrics.dom_elements = document.querySelectorAll('*').length;

    // Connection information
    if (navigator.connection) {
      metrics.connection_type = navigator.connection.effectiveType || 'unknown';
      metrics.connection_speed = navigator.connection.downlink || 'unknown';
    }
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
  }

  return metrics;
}

/**
 * Get current page information
 * @returns {Object} Page information
 */
export function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get session information
 * @returns {Object} Session information
 */
export function getSessionInfo() {
  return {
    session_id: getSessionId(),
    session_start: getSessionStartTime(),
    page_views: getPageViewCount(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate or retrieve session ID
 * @returns {string} Session ID
 */
function getSessionId() {
  const storageKey = 'interworky_session_id';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * Get session start time
 * @returns {Date} Session start time
 */
function getSessionStartTime() {
  const storageKey = 'interworky_session_start';
  let sessionStart = sessionStorage.getItem(storageKey);

  if (!sessionStart) {
    sessionStart = new Date().toISOString();
    sessionStorage.setItem(storageKey, sessionStart);
  }

  return new Date(sessionStart);
}

/**
 * Get page view count for current session
 * @returns {number} Page view count
 */
function getPageViewCount() {
  const storageKey = 'interworky_page_views';
  let pageViews = parseInt(sessionStorage.getItem(storageKey) || '0');

  pageViews++;
  sessionStorage.setItem(storageKey, pageViews.toString());

  return pageViews;
}

/**
 * Get comprehensive context information
 * @returns {Object} Complete context information
 */
export function getContextInfo() {
  return {
    browser: parseBrowserInfo(),
    device: parseDeviceInfo(),
    performance: getPerformanceMetrics(),
    page: getPageInfo(),
    session: getSessionInfo(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if browser supports required APIs
 * @returns {Object} API support information
 */
export function checkAPISupport() {
  return {
    performance: 'performance' in window,
    performanceObserver: 'PerformanceObserver' in window,
    memory: 'memory' in performance,
    connection: 'connection' in navigator,
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    webWorkers: 'Worker' in window,
    serviceWorkers: 'serviceWorker' in navigator,
  };
}
