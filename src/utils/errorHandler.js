/**
 * Centralized Error Handler for Profile System
 * Provides consistent error handling, logging, and user feedback
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogEntries = 100;
    this.userFeedbackEnabled = true;
    
    // Bind global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Setup global error handlers for unhandled errors
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason
      });
    });
  }

  /**
   * Log error with context information
   * @param {string} type - Error type/category
   * @param {Object} details - Error details
   * @param {string} severity - Error severity level
   */
  logError(type, details, severity = 'error') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      type,
      details,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      id: this.generateErrorId()
    };

    this.errorLog.push(errorEntry);

    // Maintain max log size
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.shift();
    }

    // Console logging based on severity
    const logMethod = severity === 'warning' ? 'warn' : severity === 'info' ? 'info' : 'error';
    console[logMethod](`[${type}]`, details);

    // Send to analytics if available (would be implemented with real analytics)
    this.sendToAnalytics(errorEntry);

    return errorEntry.id;
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error identifier
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send error to analytics service (placeholder)
   * @param {Object} errorEntry - Error entry to send
   */
  sendToAnalytics(errorEntry) {
    // In a real application, this would send to analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const analyticsErrors = JSON.parse(localStorage.getItem('learnimals_error_analytics') || '[]');
      analyticsErrors.push(errorEntry);
      
      // Keep only last 50 entries for analytics
      if (analyticsErrors.length > 50) {
        analyticsErrors.splice(0, analyticsErrors.length - 50);
      }
      
      localStorage.setItem('learnimals_error_analytics', JSON.stringify(analyticsErrors));
    } catch (e) {
      // Silent fail for analytics logging
      console.warn('Failed to store error analytics:', e);
    }
  }

  /**
   * Handle profile-related errors
   * @param {Error} error - The error object
   * @param {string} operation - The operation that failed
   * @param {Object} context - Additional context
   * @returns {Object} Standardized error response
   */
  handleProfileError(error, operation, context = {}) {
    const errorId = this.logError('Profile Error', {
      operation,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    });

    const userMessage = this.getUserFriendlyMessage(operation, error);
    
    if (this.userFeedbackEnabled) {
      this.showUserError(userMessage, errorId);
    }

    return {
      success: false,
      error: {
        id: errorId,
        type: 'profile_error',
        operation,
        message: userMessage,
        originalError: error
      }
    };
  }

  /**
   * Handle validation errors
   * @param {Object} validationErrors - Validation error details
   * @param {string} field - Field that failed validation
   * @returns {Object} Validation error response
   */
  handleValidationError(validationErrors, field) {
    const errorId = this.logError('Validation Error', {
      field,
      errors: validationErrors
    }, 'warning');

    return {
      success: false,
      error: {
        id: errorId,
        type: 'validation_error',
        field,
        errors: validationErrors
      }
    };
  }

  /**
   * Handle storage errors (localStorage issues)
   * @param {Error} error - Storage error
   * @param {string} operation - Storage operation that failed
   * @returns {Object} Storage error response
   */
  handleStorageError(error, operation) {
    const errorId = this.logError('Storage Error', {
      operation,
      error: {
        message: error.message,
        name: error.name
      },
      storageAvailable: this.isStorageAvailable()
    });

    const userMessage = 'Unable to save your changes. Please check your browser settings and try again.';
    
    if (this.userFeedbackEnabled) {
      this.showUserError(userMessage, errorId);
    }

    return {
      success: false,
      error: {
        id: errorId,
        type: 'storage_error',
        operation,
        message: userMessage,
        originalError: error
      }
    };
  }

  /**
   * Handle component errors (for error boundaries)
   * @param {Error} error - Component error
   * @param {Object} errorInfo - React error info
   * @param {string} componentName - Name of component that failed
   * @returns {Object} Component error response
   */
  handleComponentError(error, errorInfo, componentName) {
    const errorId = this.logError('Component Error', {
      componentName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo
    });

    return {
      success: false,
      error: {
        id: errorId,
        type: 'component_error',
        componentName,
        message: 'Something went wrong loading this section. Please refresh the page.',
        originalError: error
      }
    };
  }

  /**
   * Get user-friendly error message
   * @param {string} operation - The operation that failed
   * @param {Error} error - The original error
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(operation, error) {
    const messages = {
      'profile_load': 'Unable to load your profile. Please refresh the page and try again.',
      'profile_save': 'Unable to save profile changes. Please try again in a moment.',
      'avatar_update': 'Unable to update your avatar. Please try again.',
      'settings_save': 'Unable to save settings. Please check your connection and try again.',
      'xp_calculation': 'There was an issue calculating your XP. Your progress is safe.',
      'level_update': 'Unable to update your level. Please refresh the page.',
      'achievement_unlock': 'Achievement unlocked but there was a display issue. Check your achievements tab.',
      'badge_load': 'Unable to load badges. Please refresh the page.',
      'friends_load': 'Unable to load friends list. Please try again later.',
      'data_export': 'Unable to export your data. Please try again.',
      'data_import': 'Unable to import data. Please check the file format and try again.'
    };

    // Check for specific error types
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      return 'Your browser storage is full. Please clear some space and try again.';
    }

    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    return messages[operation] || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Show error message to user
   * @param {string} message - Error message
   * @param {string} errorId - Error ID for reference
   */
  showUserError(message, errorId) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-text">
          <div class="error-message">${message}</div>
          <div class="error-id">Error ID: ${errorId}</div>
        </div>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #e74c3c;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10002;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.3s ease;
    `;

    // Error content styles
    const style = document.createElement('style');
    style.textContent = `
      .error-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .error-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      .error-text {
        flex: 1;
      }
      .error-message {
        font-weight: 500;
        margin-bottom: 4px;
      }
      .error-id {
        font-size: 0.8rem;
        opacity: 0.8;
      }
      .error-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }
      .error-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 8000);
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if storage is available
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Validate input data
   * @param {*} value - Value to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  validateInput(value, rules) {
    const errors = [];

    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push('This field is required');
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters`);
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters`);
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.patternMessage || 'Invalid format');
    }

    if (value && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push('Must be a valid email address');
    }

    if (value && rules.numeric && isNaN(Number(value))) {
      errors.push('Must be a number');
    }

    if (value && rules.min && Number(value) < rules.min) {
      errors.push(`Must be at least ${rules.min}`);
    }

    if (value && rules.max && Number(value) > rules.max) {
      errors.push(`Must be no more than ${rules.max}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - User input
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Get error statistics for debugging
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10),
      oldestError: this.errorLog.length > 0 ? this.errorLog[0].timestamp : null,
      newestError: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1].timestamp : null
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error log (for debugging/testing)
   */
  clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('learnimals_error_analytics');
  }

  /**
   * Export error log for debugging
   * @returns {string} JSON string of error log
   */
  exportErrorLog() {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: this.errorLog,
      stats: this.getErrorStats()
    }, null, 2);
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export for use in modules
export default errorHandler;

// Also make available globally for debugging
window.errorHandler = errorHandler;