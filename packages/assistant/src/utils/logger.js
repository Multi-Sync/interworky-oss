/**
 * Interworky Logger - Centralized logging system with verbosity control
 *
 * Environment Variables:
 * - INTERWORKY_LOG_LEVEL: Controls verbosity (error, warn, info, debug)
 * - INTERWORKY_LOG_FORMAT: Controls format (json, pretty, minimal)
 *
 * Usage:
 * import { logger } from '../utils/logger';
 * logger.error('IW001', 'Error message', { context: 'data' });
 * logger.warn('IW002', 'Warning message');
 * logger.info('IW003', 'Info message');
 * logger.debug('IW004', 'Debug message');
 */

class InterworkyLogger {
  constructor() {
    this.logLevel = this.getLogLevel();
    this.logFormat = this.getLogFormat();
    this.errorCodes = new Set();
  }

  /**
   * Get log level from environment variable
   */
  getLogLevel() {
    const envLevel = process.env.INTERWORKY_LOG_LEVEL ?? 'error';
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const level = levels[envLevel.toLowerCase()];
    return level !== undefined ? level : levels.info;
  }

  /**
   * Get log format from environment variable
   */
  getLogFormat() {
    const envFormat = process.env.INTERWORKY_LOG_FORMAT || 'pretty';
    return ['json', 'pretty', 'minimal'].includes(envFormat)
      ? envFormat
      : 'pretty';
  }

  /**
   * Check if a log level should be output
   */
  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= this.logLevel;
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Sanitize data to remove sensitive/large content
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Remove audio data and other large content
    if (sanitized.message && typeof sanitized.message === 'object') {
      const message = { ...sanitized.message };

      // Remove audio content
      if (message.content && Array.isArray(message.content)) {
        message.content = message.content.map((item) => {
          if (item.audio) {
            return { ...item, audio: '[AUDIO_DATA_REMOVED]' };
          }
          if (item.text && item.text.length > 200) {
            return { ...item, text: item.text.substring(0, 200) + '...' };
          }
          return item;
        });
      }

      // Keep only essential fields
      sanitized.message = {
        id: message.id,
        type: message.type,
        role: message.role,
        content: message.content,
        status: message.status,
      };
    }

    // Remove other large fields
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '...';
      }
    });

    return sanitized;
  }

  /**
   * Format log message based on format type
   */
  formatMessage(level, errorCode, message, data = null) {
    const timestamp = this.getTimestamp();
    const baseInfo = {
      timestamp,
      level: level.toUpperCase(),
      errorCode,
      message,
      service: 'interworky-assistant',
    };

    if (data) {
      baseInfo.data = this.sanitizeData(data);
    }

    switch (this.logFormat) {
      case 'json':
        return JSON.stringify(baseInfo);

      case 'minimal':
        return `[${level.toUpperCase()}] ${errorCode}: ${message}`;

      case 'pretty':
      default:
        const dataStr = data
          ? `\n  Data: ${JSON.stringify(this.sanitizeData(data), null, 2)}`
          : '';
        // Only show error reporting for ERROR and WARN levels
        const reportStr =
          (level === 'error' || level === 'warn') && errorCode
            ? `\n  Report: hello@interworky.com (Error: ${errorCode})`
            : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${errorCode}: ${message}${dataStr}${reportStr}`;
    }
  }

  /**
   * Log error message
   */
  error(errorCode, message, data = null) {
    if (!this.shouldLog('error')) return;

    if (errorCode) {
      this.errorCodes.add(errorCode);
    }

    const formattedMessage = this.formatMessage(
      'error',
      errorCode,
      message,
      data
    );
    console.error(formattedMessage);
  }

  /**
   * Log warning message
   */
  warn(errorCode, message, data = null) {
    if (!this.shouldLog('warn')) return;

    if (errorCode) {
      this.errorCodes.add(errorCode);
    }

    const formattedMessage = this.formatMessage(
      'warn',
      errorCode,
      message,
      data
    );
    console.warn(formattedMessage);
  }

  /**
   * Log info message
   */
  info(errorCode, message, data = null) {
    if (!this.shouldLog('info')) return;

    const formattedMessage = this.formatMessage(
      'info',
      errorCode,
      message,
      data
    );
    console.log(formattedMessage);
  }

  /**
   * Log debug message
   */
  debug(errorCode, message, data = null) {
    if (!this.shouldLog('debug')) return;

    const formattedMessage = this.formatMessage(
      'debug',
      errorCode,
      message,
      data
    );
    console.log(formattedMessage);
  }

  /**
   * Get all error codes encountered
   */
  getErrorCodes() {
    return Array.from(this.errorCodes);
  }

  /**
   * Clear error codes (useful for testing)
   */
  clearErrorCodes() {
    this.errorCodes.clear();
  }
}

// Create singleton instance
const logger = new InterworkyLogger();

// Export both class and instance
export { InterworkyLogger, logger };
export default logger;
