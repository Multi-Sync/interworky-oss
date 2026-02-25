/**
 * Interworky Assistant Error Code Registry
 *
 * Centralized error codes for consistent logging and tracking.
 * All error codes follow the format: IW-[CATEGORY]-[NUMBER]
 *
 * Categories:
 * - INIT: Initialization errors
 * - AUTH: Authentication errors
 * - API: API request errors
 * - WS: WebSocket errors
 * - PERF: Performance monitoring errors
 * - UI: UI/Rendering errors
 * - RT: Realtime/Voice errors
 * - ANALYTICS: Analytics tracking errors
 * - FUNC: Function call handler errors
 * - KB: Knowledge base errors
 * - SESSION: Session management errors
 */

export const ERROR_CODES = {
  // ============================================
  // Initialization (IW-INIT-xxx)
  // ============================================
  INIT_NO_API_KEY: 'IW-INIT-001',
  INIT_ALREADY_INITIALIZED: 'IW-INIT-002',
  INIT_INVALID_CONFIG: 'IW-INIT-003',
  INIT_STALE_FLAGS: 'IW-INIT-004',
  INIT_MISSING_ELEMENT: 'IW-INIT-005',
  INIT_UI_REMOVED: 'IW-INIT-006',
  INIT_WINDOW_LOAD: 'IW-INIT-007',
  INIT_PAGE_VIEW: 'IW-INIT-008',

  // ============================================
  // Authentication (IW-AUTH-xxx)
  // ============================================
  AUTH_INVALID_API_KEY: 'IW-AUTH-001',
  AUTH_EXPIRED_TOKEN: 'IW-AUTH-002',
  AUTH_VERIFICATION_FAILED: 'IW-AUTH-003',
  AUTH_WRONG_FORMAT: 'IW-AUTH-004',
  AUTH_UNAUTHORIZED: 'IW-AUTH-005',

  // ============================================
  // API Requests (IW-API-xxx)
  // ============================================
  API_FETCH_FAILED: 'IW-API-001',
  API_TIMEOUT: 'IW-API-002',
  API_INVALID_RESPONSE: 'IW-API-003',
  API_NETWORK_ERROR: 'IW-API-004',
  API_SERVER_ERROR: 'IW-API-005',
  API_CONVERSATION_FAILED: 'IW-API-006',
  API_PLUGIN_STATUS_FAILED: 'IW-API-007',

  // ============================================
  // WebSocket (IW-WS-xxx)
  // ============================================
  WS_CONNECTION_FAILED: 'IW-WS-001',
  WS_CONNECTION_CLOSED: 'IW-WS-002',
  WS_MESSAGE_ERROR: 'IW-WS-003',
  WS_RECONNECT_FAILED: 'IW-WS-004',
  WS_SEND_FAILED: 'IW-WS-005',

  // ============================================
  // Performance Monitoring (IW-PERF-xxx)
  // ============================================
  PERF_MONITORING_INIT_FAILED: 'IW-PERF-001',
  PERF_ERROR_COLLECTOR_FAILED: 'IW-PERF-002',
  PERF_HEALTH_CHECK_FAILED: 'IW-PERF-003',
  PERF_REPORT_FAILED: 'IW-PERF-004',
  PERF_RETRY_QUEUE_FAILED: 'IW-PERF-005',
  PERF_FLUSH_FAILED: 'IW-PERF-006',
  PERF_STATS_FAILED: 'IW-PERF-007',
  PERF_BATCH_SEND_FAILED: 'IW-PERF-008',
  PERF_QUEUE_FULL: 'IW-PERF-009',
  PERF_NETWORK_CAPTURE_FAILED: 'IW-PERF-010',

  // ============================================
  // UI/Rendering (IW-UI-xxx)
  // ============================================
  UI_RENDER_ERROR: 'IW-UI-001',
  UI_ELEMENT_NOT_FOUND: 'IW-UI-002',
  UI_MOUNT_FAILED: 'IW-UI-003',
  UI_MESSAGE_RENDER_FAILED: 'IW-UI-004',
  UI_VOICE_RENDER_FAILED: 'IW-UI-005',
  UI_FLOW_ERROR: 'IW-UI-006',

  // ============================================
  // Realtime/Voice (IW-RT-xxx)
  // ============================================
  RT_AGENT_ERROR: 'IW-RT-001',
  RT_AUDIO_ERROR: 'IW-RT-002',
  RT_MIC_ACCESS_DENIED: 'IW-RT-003',
  RT_SESSION_FAILED: 'IW-RT-004',
  RT_CONNECTION_ERROR: 'IW-RT-005',
  RT_VOICE_ASSISTANT_ERROR: 'IW-RT-006',
  RT_RTC_SESSION_ERROR: 'IW-RT-007',

  // ============================================
  // Analytics (IW-ANALYTICS-xxx)
  // ============================================
  ANALYTICS_TRACK_FAILED: 'IW-ANALYTICS-001',
  ANALYTICS_JOURNEY_FAILED: 'IW-ANALYTICS-002',
  ANALYTICS_INIT_FAILED: 'IW-ANALYTICS-003',
  ANALYTICS_SEND_FAILED: 'IW-ANALYTICS-004',

  // ============================================
  // Function Calls (IW-FUNC-xxx)
  // ============================================
  FUNC_HANDLER_ERROR: 'IW-FUNC-001',
  FUNC_INVALID_ARGS: 'IW-FUNC-002',
  FUNC_EXECUTION_FAILED: 'IW-FUNC-003',

  // ============================================
  // Knowledge Base (IW-KB-xxx)
  // ============================================
  KB_FETCH_FAILED: 'IW-KB-001',
  KB_INVALID_DATA: 'IW-KB-002',
  KB_PARSE_ERROR: 'IW-KB-003',

  // ============================================
  // Session Management (IW-SESSION-xxx)
  // ============================================
  SESSION_CACHE_ERROR: 'IW-SESSION-001',
  SESSION_EXPIRED: 'IW-SESSION-002',
  SESSION_INVALID: 'IW-SESSION-003',

  // ============================================
  // Browser/Utils (IW-BROWSER-xxx)
  // ============================================
  BROWSER_UTIL_ERROR: 'IW-BROWSER-001',
  BROWSER_COMPATIBILITY: 'IW-BROWSER-002',

  // ============================================
  // Theme/Styling (IW-THEME-xxx)
  // ============================================
  THEME_MANAGER_ERROR: 'IW-THEME-001',
  THEME_LOAD_FAILED: 'IW-THEME-002',

  // ============================================
  // Email/Notifications (IW-EMAIL-xxx)
  // ============================================
  EMAIL_SEND_FAILED: 'IW-EMAIL-001',
  EMAIL_INVALID_RECIPIENT: 'IW-EMAIL-002',

  // ============================================
  // Common/Utils (IW-COMMON-xxx)
  // ============================================
  COMMON_UTIL_ERROR: 'IW-COMMON-001',
  COMMON_VALIDATION_ERROR: 'IW-COMMON-002',
};

/**
 * Get human-readable description for an error code
 * @param {string} errorCode - The error code
 * @returns {string} Human-readable description
 */
export function getErrorDescription(errorCode) {
  const descriptions = {
    // Initialization
    [ERROR_CODES.INIT_NO_API_KEY]: 'API key not provided during initialization',
    [ERROR_CODES.INIT_ALREADY_INITIALIZED]: 'Interworky is already initialized',
    [ERROR_CODES.INIT_INVALID_CONFIG]: 'Invalid configuration provided',
    [ERROR_CODES.INIT_STALE_FLAGS]: 'Stale initialization flags detected',
    [ERROR_CODES.INIT_MISSING_ELEMENT]: 'Required DOM element not found',
    [ERROR_CODES.INIT_UI_REMOVED]: 'UI was removed from DOM',
    [ERROR_CODES.INIT_WINDOW_LOAD]: 'Initialization during window load',
    [ERROR_CODES.INIT_PAGE_VIEW]: 'Page view tracking event',

    // Authentication
    [ERROR_CODES.AUTH_INVALID_API_KEY]: 'Invalid or malformed API key',
    [ERROR_CODES.AUTH_EXPIRED_TOKEN]: 'Authentication token has expired',
    [ERROR_CODES.AUTH_VERIFICATION_FAILED]: 'API key verification failed',
    [ERROR_CODES.AUTH_WRONG_FORMAT]: 'API key format is incorrect',
    [ERROR_CODES.AUTH_UNAUTHORIZED]: 'Unauthorized access attempt',

    // API
    [ERROR_CODES.API_FETCH_FAILED]: 'API request failed',
    [ERROR_CODES.API_TIMEOUT]: 'API request timed out',
    [ERROR_CODES.API_INVALID_RESPONSE]: 'Invalid response from API',
    [ERROR_CODES.API_NETWORK_ERROR]: 'Network error during API request',
    [ERROR_CODES.API_SERVER_ERROR]: 'Server error response',
    [ERROR_CODES.API_CONVERSATION_FAILED]: 'Conversation API request failed',
    [ERROR_CODES.API_PLUGIN_STATUS_FAILED]: 'Plugin status check failed',

    // Performance
    [ERROR_CODES.PERF_MONITORING_INIT_FAILED]:
      'Failed to initialize performance monitoring',
    [ERROR_CODES.PERF_ERROR_COLLECTOR_FAILED]:
      'Error collector operation failed',
    [ERROR_CODES.PERF_HEALTH_CHECK_FAILED]: 'Health check failed',
    [ERROR_CODES.PERF_REPORT_FAILED]: 'Performance report submission failed',

    // Add more descriptions as needed...
  };

  return descriptions[errorCode] || 'Unknown error';
}

export default ERROR_CODES;
