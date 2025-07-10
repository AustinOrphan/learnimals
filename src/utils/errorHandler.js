// Centralized Error Handling Utilities
// Provides consistent error handling across storage operations and user interactions

// Error types for categorization
export const ERROR_TYPES = {
  STORAGE: 'storage',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  NETWORK: 'network',
  USER_INPUT: 'user_input',
  SYSTEM: 'system'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Custom error classes
export class LearnimalsError extends Error {
  constructor(message, type = ERROR_TYPES.SYSTEM, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
    super(message);
    this.name = 'LearnimalsError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = this.generateUserMessage();
  }
  
  generateUserMessage() {
    // Generate user-friendly message based on error type
    switch (this.type) {
    case ERROR_TYPES.STORAGE:
      return 'There was a problem saving your data. Please try again.';
    case ERROR_TYPES.VALIDATION:
      return this.message; // Validation messages are usually user-friendly
    case ERROR_TYPES.AUTHENTICATION:
      return 'Please check your login credentials and try again.';
    case ERROR_TYPES.PERMISSION:
      return 'You don\'t have permission to perform this action.';
    case ERROR_TYPES.NETWORK:
      return 'Please check your internet connection and try again.';
    case ERROR_TYPES.USER_INPUT:
      return this.message; // User input errors should be clear
    default:
      return 'Something went wrong. Please try again.';
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class StorageError extends LearnimalsError {
  constructor(message, operation = null, details = {}) {
    super(message, ERROR_TYPES.STORAGE, ERROR_SEVERITY.MEDIUM, {
      operation,
      ...details
    });
    this.name = 'StorageError';
  }
}

export class ValidationError extends LearnimalsError {
  constructor(message, field = null, value = null) {
    super(message, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.LOW, {
      field,
      value
    });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends LearnimalsError {
  constructor(message, details = {}) {
    super(message, ERROR_TYPES.AUTHENTICATION, ERROR_SEVERITY.HIGH, details);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends LearnimalsError {
  constructor(message, requiredPermission = null, userRole = null) {
    super(message, ERROR_TYPES.PERMISSION, ERROR_SEVERITY.MEDIUM, {
      requiredPermission,
      userRole
    });
    this.name = 'PermissionError';
  }
}

// Central error handler class
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.listeners = [];
    this.reportingEnabled = false;
    this.debugMode = process.env.NODE_ENV === 'development';
  }
  
  // Handle any error and return standardized format
  handle(error, context = {}) {
    let handledError;
    
    if (error instanceof LearnimalsError) {
      handledError = error;
    } else {
      // Convert generic errors to LearnimalsError
      handledError = new LearnimalsError(
        error.message || 'Unknown error occurred',
        this.detectErrorType(error),
        this.detectErrorSeverity(error),
        { originalError: error.name, context }
      );
    }
    
    // Log the error
    this.logError(handledError, context);
    
    // Notify listeners
    this.notifyListeners(handledError, context);
    
    // Console logging in debug mode
    if (this.debugMode) {
      console.error('Error handled:', handledError);
      if (context && Object.keys(context).length > 0) {
        console.error('Context:', context);
      }
    }
    
    return handledError;
  }
  
  // Detect error type from generic error
  detectErrorType(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('localstorage') || message.includes('storage') || message.includes('quota')) {
      return ERROR_TYPES.STORAGE;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ERROR_TYPES.NETWORK;
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ERROR_TYPES.PERMISSION;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ERROR_TYPES.VALIDATION;
    }
    if (message.includes('auth') || message.includes('login') || message.includes('password')) {
      return ERROR_TYPES.AUTHENTICATION;
    }
    
    return ERROR_TYPES.SYSTEM;
  }
  
  // Detect error severity from generic error
  detectErrorSeverity(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('corrupt')) {
      return ERROR_SEVERITY.CRITICAL;
    }
    if (message.includes('auth') || message.includes('security') || message.includes('unauthorized')) {
      return ERROR_SEVERITY.HIGH;
    }
    if (message.includes('validation') || message.includes('input') || message.includes('format')) {
      return ERROR_SEVERITY.LOW;
    }
    
    return ERROR_SEVERITY.MEDIUM;
  }
  
  // Log error to internal log
  logError(error, context) {
    const logEntry = {
      id: this.generateId(),
      error: error.toJSON(),
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errorLog.unshift(logEntry);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Store recent errors in localStorage for debugging
    try {
      const recentErrors = this.errorLog.slice(0, 10);
      localStorage.setItem('learnimals_recent_errors', JSON.stringify(recentErrors));
    } catch (storageError) {
      // Ignore storage errors in error handler
    }
  }
  
  // Add error listener
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  // Remove error listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  // Notify all listeners
  notifyListeners(error, context) {
    this.listeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }
  
  // Retry mechanism for operations
  async retry(operation, maxRetries = 3, delay = 1000, backoff = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw this.handle(error, { 
            operation: 'retry', 
            attempts: attempt, 
            maxRetries 
          });
        }
        
        // Wait before retry with exponential backoff
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await this.wait(waitTime);
      }
    }
    
    throw lastError;
  }
  
  // Utility method for waiting
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(0, 5)
    };
    
    this.errorLog.forEach(entry => {
      const type = entry.error.type;
      const severity = entry.error.severity;
      
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    });
    
    return stats;
  }
  
  // Clear error log
  clearLog() {
    this.errorLog = [];
    try {
      localStorage.removeItem('learnimals_recent_errors');
    } catch (error) {
      // Ignore storage errors
    }
  }
  
  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Create user-friendly error message for UI
  createUserErrorMessage(error, showDetails = false) {
    let message = error.userMessage || 'Something went wrong. Please try again.';
    
    if (showDetails && this.debugMode) {
      message += `\n\nDetails: ${error.message}`;
      if (error.details && Object.keys(error.details).length > 0) {
        message += `\nAdditional info: ${JSON.stringify(error.details)}`;
      }
    }
    
    return message;
  }
  
  // Recovery suggestions based on error type
  getRecoverySuggestions(error) {
    const suggestions = {
      [ERROR_TYPES.STORAGE]: [
        'Try refreshing the page',
        'Clear browser cache and cookies',
        'Free up storage space on your device'
      ],
      [ERROR_TYPES.NETWORK]: [
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the problem persists'
      ],
      [ERROR_TYPES.AUTHENTICATION]: [
        'Check your username and password',
        'Try resetting your password',
        'Clear browser cookies and try again'
      ],
      [ERROR_TYPES.PERMISSION]: [
        'Contact your parent or administrator',
        'Switch to a different user account',
        'Check your account permissions'
      ],
      [ERROR_TYPES.VALIDATION]: [
        'Check the highlighted fields',
        'Make sure all required information is provided',
        'Follow the format requirements'
      ]
    };
    
    return suggestions[error.type] || [
      'Try refreshing the page',
      'Contact support if the problem continues'
    ];
  }
}

// Global error handler instance
const globalErrorHandler = new ErrorHandler();

// Convenience functions
export function handleError(error, context = {}) {
  return globalErrorHandler.handle(error, context);
}

export function retryOperation(operation, maxRetries = 3, delay = 1000) {
  return globalErrorHandler.retry(operation, maxRetries, delay);
}

export function addErrorListener(callback) {
  globalErrorHandler.addListener(callback);
}

export function removeErrorListener(callback) {
  globalErrorHandler.removeListener(callback);
}

export function getErrorStats() {
  return globalErrorHandler.getErrorStats();
}

export function clearErrorLog() {
  globalErrorHandler.clearLog();
}

// Global error handlers for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    handleError(new Error(event.message), {
      type: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, {
      type: 'unhandled_promise_rejection'
    });
  });
}

export { ErrorHandler };
export default globalErrorHandler;