/**
 * Stack Trace Parser Utility
 *
 * Provides cross-browser stack trace parsing and manipulation utilities.
 * Handles Chrome/V8, Firefox, and Safari stack trace formats.
 *
 * @module stackTraceParser
 */

/**
 * Regex patterns for different browser stack trace formats
 */
const STACK_PATTERNS = {
  // Chrome/V8 format: "    at functionName (http://localhost:3000/file.js:123:45)"
  // or "    at http://localhost:3000/file.js:123:45"
  chrome: /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/,

  // Firefox/Safari format: "functionName@http://localhost:3000/file.js:123:45"
  // or "@http://localhost:3000/file.js:123:45"
  firefox: /^(?:(.+?)@)?(.+?):(\d+):(\d+)$/,
};

/**
 * Parse a raw stack trace string into an array of frame objects
 *
 * @param {string} stackString - Raw stack trace string
 * @returns {Object} Parsed stack trace with frames array and raw stack
 * @returns {Array} returns.frames - Array of frame objects
 * @returns {string} returns.rawStack - Original stack trace
 *
 * @example
 * const result = parseStackTrace(error.stack);
 * // returns: {
 * //   frames: [
 * //     { function: 'handleClick', file: 'src/App.js', line: 45, column: 12 },
 * //     ...
 * //   ],
 * //   rawStack: '...'
 * // }
 */
export function parseStackTrace(stackString) {
  if (!stackString || typeof stackString !== 'string') {
    return { frames: [], rawStack: '' };
  }

  const lines = stackString.split('\n');
  const frames = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and error messages
    if (!trimmedLine || trimmedLine.startsWith('Error:')) {
      continue;
    }

    const frame = parseStackFrame(trimmedLine);
    if (frame) {
      frames.push(frame);
    }
  }

  return {
    frames,
    rawStack: stackString,
  };
}

/**
 * Parse a single stack frame line
 *
 * @param {string} line - Single line from stack trace
 * @returns {Object|null} Parsed frame object or null if parsing failed
 * @private
 */
function parseStackFrame(line) {
  // Try Chrome/V8 format first
  let match = line.match(STACK_PATTERNS.chrome);

  if (match) {
    return {
      function: match[1] || '(anonymous)',
      file: normalizeFilePath(match[2]),
      line: parseInt(match[3], 10),
      column: parseInt(match[4], 10),
      raw: line,
    };
  }

  // Try Firefox/Safari format
  match = line.match(STACK_PATTERNS.firefox);

  if (match) {
    return {
      function: match[1] || '(anonymous)',
      file: normalizeFilePath(match[2]),
      line: parseInt(match[3], 10),
      column: parseInt(match[4], 10),
      raw: line,
    };
  }

  // Couldn't parse this line
  return null;
}

/**
 * Extract the top-level frame from a stack trace
 *
 * @param {string} stackString - Raw stack trace string
 * @param {number} skipFrames - Number of frames to skip from the top (default: 0)
 * @returns {Object|null} Top frame object or null if not available
 *
 * @example
 * const topFrame = extractTopFrame(error.stack, 1); // Skip first frame
 * // returns: { function: 'handleClick', file: 'src/App.js', line: 45, column: 12 }
 */
export function extractTopFrame(stackString, skipFrames = 0) {
  const parsed = parseStackTrace(stackString);

  if (parsed.frames.length === 0) {
    return null;
  }

  const index = Math.min(skipFrames, parsed.frames.length - 1);
  return parsed.frames[index] || null;
}

/**
 * Clean a stack trace by removing internal/library frames
 *
 * @param {string} stackString - Raw stack trace string
 * @param {Array<string>} filesToSkip - Array of file patterns to remove
 * @returns {string} Cleaned stack trace string
 *
 * @example
 * const cleaned = cleanStackTrace(stack, ['errorCollector.js', 'react-dom']);
 * // Returns stack trace without frames from errorCollector.js or react-dom
 */
export function cleanStackTrace(stackString, filesToSkip = []) {
  if (!stackString || typeof stackString !== 'string') {
    return '';
  }

  const defaultSkipPatterns = [
    'errorCollector.js',
    'stackTraceParser.js',
    'performanceMonitoringManager.js',
    '/node_modules/',
    'webpack',
    'bootstrap',
  ];

  const skipPatterns = [...defaultSkipPatterns, ...filesToSkip];
  const lines = stackString.split('\n');
  const cleanedLines = [];

  for (const line of lines) {
    const shouldSkip = skipPatterns.some((pattern) =>
      line.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!shouldSkip) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

/**
 * Normalize a file path from a stack trace
 *
 * @param {string} path - File path from stack trace
 * @returns {string} Normalized file path
 *
 * @example
 * normalizeFilePath('webpack:///.src/components/Button.js')
 * // returns: 'src/components/Button.js'
 */
export function normalizeFilePath(path) {
  if (!path || typeof path !== 'string') {
    return '';
  }

  let normalized = path;

  // Remove webpack prefixes
  normalized = normalized.replace(/^webpack:\/\/\/\./, '');
  normalized = normalized.replace(/^webpack:\/\//, '');

  // Remove protocol and domain for localhost/development URLs
  normalized = normalized.replace(/^https?:\/\/[^/]+\//, '');

  // Remove leading ./
  normalized = normalized.replace(/^\.\//, '');

  // Remove query parameters and hash
  normalized = normalized.replace(/[?#].*$/, '');

  // Remove webpack loaders syntax (e.g., "!./node_modules/...")
  if (normalized.includes('!')) {
    const parts = normalized.split('!');
    normalized = parts[parts.length - 1];
  }

  return normalized;
}

/**
 * Extract context information from a stack frame
 *
 * @param {Object} frame - Stack frame object
 * @returns {Object} Context information
 *
 * @example
 * const context = getStackFrameContext(frame);
 * // returns: { component: 'Button', module: 'components', isUserCode: true }
 */
export function getStackFrameContext(frame) {
  if (!frame || !frame.file) {
    return {
      component: null,
      module: null,
      isUserCode: false,
    };
  }

  const context = {
    component: extractComponentName(frame),
    module: extractModuleName(frame.file),
    isUserCode: isUserCode(frame.file),
  };

  return context;
}

/**
 * Extract component name from stack frame
 *
 * @param {Object} frame - Stack frame object
 * @returns {string|null} Component name or null
 * @private
 */
function extractComponentName(frame) {
  if (!frame.function) {
    return null;
  }

  // Try to extract React component name (usually starts with uppercase)
  const match = frame.function.match(/([A-Z][a-zA-Z0-9]*)/);
  return match ? match[1] : null;
}

/**
 * Extract module name from file path
 *
 * @param {string} filePath - File path
 * @returns {string|null} Module name or null
 * @private
 */
function extractModuleName(filePath) {
  if (!filePath) {
    return null;
  }

  // Extract directory name before the file
  const parts = filePath.split('/');
  if (parts.length > 1) {
    return parts[parts.length - 2];
  }

  return null;
}

/**
 * Check if a file path is user code (not library/framework code)
 *
 * @param {string} filePath - File path
 * @returns {boolean} True if user code
 * @private
 */
function isUserCode(filePath) {
  if (!filePath) {
    return false;
  }

  const libraryPatterns = [
    '/node_modules/',
    'webpack',
    'react-dom',
    'react-refresh',
    'bootstrap',
    'chunk.js',
    'bundle.js',
    'vendor',
  ];

  return !libraryPatterns.some((pattern) =>
    filePath.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Format a stack trace for display in UI
 *
 * @param {string} stackString - Raw stack trace string
 * @param {number} maxFrames - Maximum number of frames to include (default: 10)
 * @returns {string} Formatted stack trace
 *
 * @example
 * const formatted = formatStackForDisplay(error.stack);
 * // Returns a cleaned, formatted stack trace suitable for display
 */
export function formatStackForDisplay(stackString, maxFrames = 10) {
  if (!stackString || typeof stackString !== 'string') {
    return 'No stack trace available';
  }

  const parsed = parseStackTrace(stackString);

  if (parsed.frames.length === 0) {
    return stackString; // Return original if parsing failed
  }

  const framesToShow = parsed.frames.slice(0, maxFrames);
  const formatted = framesToShow
    .map((frame, index) => {
      const functionName = frame.function || '(anonymous)';
      const location = `${frame.file}:${frame.line}:${frame.column}`;
      return `  ${index + 1}. ${functionName}\n     at ${location}`;
    })
    .join('\n');

  const remainingFrames = parsed.frames.length - maxFrames;
  const suffix =
    remainingFrames > 0 ? `\n  ... ${remainingFrames} more frames` : '';

  return formatted + suffix;
}

/**
 * Generate a stack trace from the current execution point
 *
 * @param {number} skipFrames - Number of frames to skip (default: 1, skips this function)
 * @returns {string} Stack trace string
 *
 * @example
 * const stack = captureStackTrace(2); // Skip captureStackTrace and caller
 */
export function captureStackTrace(skipFrames = 1) {
  try {
    const error = new Error();
    const stack = error.stack || '';

    if (!stack) {
      return '';
    }

    // Split stack into lines and skip the specified number of frames
    const lines = stack.split('\n');

    // First line is usually "Error" message, keep it
    const errorLine = lines[0] || '';
    const stackLines = lines.slice(1);

    // Skip the specified frames
    const filteredLines = stackLines.slice(skipFrames);

    return [errorLine, ...filteredLines].join('\n');
  } catch {
    return '';
  }
}

/**
 * Extract file, line, and column from a stack trace for error reporting
 *
 * @param {string} stackString - Raw stack trace string
 * @param {number} skipFrames - Number of frames to skip (default: 0)
 * @returns {Object} Location object
 *
 * @example
 * const location = extractErrorLocation(error.stack);
 * // returns: { filename: 'src/App.js', lineno: 45, colno: 12 }
 */
export function extractErrorLocation(stackString, skipFrames = 0) {
  const topFrame = extractTopFrame(stackString, skipFrames);

  if (!topFrame) {
    return {
      filename: null,
      lineno: null,
      colno: null,
    };
  }

  return {
    filename: topFrame.file,
    lineno: topFrame.line,
    colno: topFrame.column,
  };
}

/**
 * Check if a stack trace looks valid
 *
 * @param {string} stackString - Stack trace string to validate
 * @returns {boolean} True if stack trace appears valid
 */
export function isValidStackTrace(stackString) {
  if (!stackString || typeof stackString !== 'string') {
    return false;
  }

  const parsed = parseStackTrace(stackString);
  return parsed.frames.length > 0;
}

/**
 * Create a hash from a stack trace for error deduplication
 *
 * @param {string} stackString - Raw stack trace string
 * @param {number} framesToHash - Number of frames to include in hash (default: 3)
 * @returns {string} Hash string for deduplication
 */
export function createStackHash(stackString, framesToHash = 3) {
  const parsed = parseStackTrace(stackString);

  if (parsed.frames.length === 0) {
    return '';
  }

  // Take top N frames for hashing
  const frames = parsed.frames.slice(0, framesToHash);

  // Create a signature from file:line combinations
  const signature = frames
    .map((frame) => `${frame.file}:${frame.line}`)
    .join('|');

  return signature;
}

// Export all functions as default object
export default {
  parseStackTrace,
  extractTopFrame,
  cleanStackTrace,
  normalizeFilePath,
  getStackFrameContext,
  formatStackForDisplay,
  captureStackTrace,
  extractErrorLocation,
  isValidStackTrace,
  createStackHash,
};
