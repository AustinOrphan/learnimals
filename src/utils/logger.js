/**
 * Configurable logging system for Learnimals
 * Replaces direct console.log usage with environment-aware logging
 */

// Log levels in order of severity
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor() {
    // Default to INFO level in production, DEBUG in development
    this.level = this.getLogLevel();
    this.enabled = true;
  }

  /**
   * Determine log level based on environment
   */
  getLogLevel() {
    // Check for explicit log level setting
    if (typeof window !== 'undefined' && window.LEARNIMALS_LOG_LEVEL) {
      return LOG_LEVELS[window.LEARNIMALS_LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO;
    }

    // Check if we're in development mode
    // SECURITY: Use exact hostname matching only to prevent malicious domain bypass
    // Malicious domains like "evil-localhost.com" or "not-localhost.malicious.com"
    // could trigger development mode if substring matching was used
    const isDevelopmentHostname = () => {
      const DEVELOPMENT_HOSTNAMES = ['localhost', '127.0.0.1'];
      return (
        typeof window !== 'undefined' && DEVELOPMENT_HOSTNAMES.includes(window.location.hostname)
      );
    };
    const isDevelopment = isDevelopmentHostname();

    return isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  }

  /**
   * Set the logging level
   * @param {string|number} level - 'ERROR', 'WARN', 'INFO', 'DEBUG' or numeric level
   */
  setLevel(level) {
    if (typeof level === 'number') {
      if (level >= 0 && level <= 3) {
        this.level = level;
      }
    } else {
      const upperLevel = level.toUpperCase();
      if (upperLevel in LOG_LEVELS) {
        this.level = LOG_LEVELS[upperLevel];
      }
    }
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Enable logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Check if a log level should be output
   * @param {number} level
   */
  shouldLog(level) {
    return this.enabled && level <= this.level;
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level
   * @param {string} message
   * @param {Array} args
   */
  formatMessage(level, message, args) {
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] ${level}:`;

    if (args.length > 0) {
      return [prefix, message, ...args];
    }
    return [prefix, message];
  }

  /**
   * Log an error message
   * @param {string} message
   * @param {...any} args
   */
  error(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(...this.formatMessage('ERROR', message, args));
    }
  }

  /**
   * Log a warning message
   * @param {string} message
   * @param {...any} args
   */
  warn(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(...this.formatMessage('WARN', message, args));
    }
  }

  /**
   * Log an info message
   * @param {string} message
   * @param {...any} args
   */
  info(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(...this.formatMessage('INFO', message, args));
    }
  }

  /**
   * Log a debug message
   * @param {string} message
   * @param {...any} args
   */
  debug(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('DEBUG', message, args));
    }
  }

  /**
   * Log game-specific events (always shows in development)
   * @param {string} message
   * @param {...any} args
   */
  game(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('GAME', message, args));
    }
  }

  /**
   * Log user interaction events
   * @param {string} message
   * @param {...any} args
   */
  user(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('USER', message, args));
    }
  }

  /**
   * Log performance metrics
   * @param {string} message
   * @param {...any} args
   */
  perf(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('PERF', message, args));
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the class and instance
export { Logger, LOG_LEVELS };
export default logger;

// Make logger available globally for debugging
if (typeof window !== 'undefined') {
  window.logger = logger;
}
