/**
 * debouncedOperations.js
 * 
 * Comprehensive debouncing and throttling utilities for frequent updates
 * Optimizes performance by controlling the frequency of expensive operations
 */

/**
 * Generic debounce function
 */
export function debounce(func, delay, options = {}) {
  let lastCallTime;
  let lastInvokeTime = 0;
  const maxWait = options.maxWait;
  let result;
  let timerId;
  let lastArgs;
  let lastThis;
  const leading = options.leading || false;
  const trailing = options.trailing !== false;
  
  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  
  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  }
  
  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;
    
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }
  
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (lastCallTime === undefined || (timeSinceLastCall >= delay) ||
            (timeSinceLastCall < 0) || (maxWait !== undefined && timeSinceLastInvoke >= maxWait));
  }
  
  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }
  
  function trailingEdge(time) {
    timerId = undefined;
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }
  
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timerId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, delay);
    }
    return result;
  }
  
  debounced.cancel = function() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  };
  
  debounced.flush = function() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  };
  
  debounced.pending = function() {
    return timerId !== undefined;
  };
  
  return debounced;
}

/**
 * Generic throttle function
 */
export function throttle(func, delay, options = {}) {
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;
  
  return debounce(func, delay, {
    leading,
    trailing,
    maxWait: delay
  });
}

/**
 * DebouncedOperations class for managing specific operations
 */
class DebouncedOperations {
  constructor() {
    // Storage for active debounced functions
    this.debouncedFunctions = new Map();
    
    // Performance tracking
    this.operationStats = new Map();
    
    // Default configurations for different operation types
    this.defaultConfigs = {
      search: { delay: 300, maxWait: 1000 },
      autoSave: { delay: 2000, maxWait: 10000 },
      progressUpdate: { delay: 100, maxWait: 500 },
      xpGain: { delay: 50, maxWait: 200 },
      settingsUpdate: { delay: 1000, maxWait: 5000 },
      achievementCheck: { delay: 500, maxWait: 2000 },
      levelCalculation: { delay: 200, maxWait: 1000 },
      badgeValidation: { delay: 300, maxWait: 1500 },
      socialUpdate: { delay: 2000, maxWait: 8000 },
      analytics: { delay: 5000, maxWait: 30000 }
    };
  }
  
  /**
   * Create or get a debounced function for a specific operation
   */
  getDebounced(operationType, func, customConfig = {}) {
    const key = `${operationType}_${func.name || 'anonymous'}`;
    
    if (this.debouncedFunctions.has(key)) {
      return this.debouncedFunctions.get(key);
    }
    
    const config = {
      ...this.defaultConfigs[operationType],
      ...customConfig
    };
    
    const debouncedFunc = debounce((...args) => {
      this.trackOperation(operationType, func.name);
      return func.apply(this, args);
    }, config.delay, {
      maxWait: config.maxWait,
      leading: config.leading,
      trailing: config.trailing
    });
    
    this.debouncedFunctions.set(key, debouncedFunc);
    return debouncedFunc;
  }
  
  /**
   * Create or get a throttled function for a specific operation
   */
  getThrottled(operationType, func, customConfig = {}) {
    const key = `throttled_${operationType}_${func.name || 'anonymous'}`;
    
    if (this.debouncedFunctions.has(key)) {
      return this.debouncedFunctions.get(key);
    }
    
    const config = {
      ...this.defaultConfigs[operationType],
      ...customConfig
    };
    
    const throttledFunc = throttle((...args) => {
      this.trackOperation(operationType, func.name);
      return func.apply(this, args);
    }, config.delay, {
      leading: config.leading !== false,
      trailing: config.trailing !== false
    });
    
    this.debouncedFunctions.set(key, throttledFunc);
    return throttledFunc;
  }
  
  /**
   * Track operation statistics
   */
  trackOperation(operationType, functionName) {
    const key = `${operationType}_${functionName}`;
    const stats = this.operationStats.get(key) || {
      count: 0,
      lastExecution: null,
      averageInterval: 0,
      totalTime: 0
    };
    
    const now = Date.now();
    if (stats.lastExecution) {
      const interval = now - stats.lastExecution;
      stats.totalTime += interval;
      stats.averageInterval = stats.totalTime / stats.count;
    }
    
    stats.count++;
    stats.lastExecution = now;
    
    this.operationStats.set(key, stats);
  }
  
  /**
   * Get operation statistics
   */
  getOperationStats(operationType = null) {
    if (operationType) {
      const filtered = new Map();
      this.operationStats.forEach((stats, key) => {
        if (key.startsWith(operationType)) {
          filtered.set(key, stats);
        }
      });
      return Object.fromEntries(filtered);
    }
    
    return Object.fromEntries(this.operationStats);
  }
  
  /**
   * Clear all pending operations
   */
  clearAll() {
    this.debouncedFunctions.forEach(func => {
      if (func.cancel) {
        func.cancel();
      }
    });
    this.debouncedFunctions.clear();
  }
  
  /**
   * Flush all pending operations
   */
  flushAll() {
    this.debouncedFunctions.forEach(func => {
      if (func.flush) {
        func.flush();
      }
    });
  }
  
  /**
   * Clear specific operation type
   */
  clearOperationType(operationType) {
    const keysToDelete = [];
    this.debouncedFunctions.forEach((func, key) => {
      if (key.startsWith(operationType)) {
        if (func.cancel) {
          func.cancel();
        }
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.debouncedFunctions.delete(key);
    });
  }
  
  /**
   * Search operation debouncing
   */
  search = {
    /**
     * Debounce search input
     */
    input: (searchFunction, customDelay = 300) => {
      return this.getDebounced('search', searchFunction, { delay: customDelay });
    },
    
    /**
     * Debounce filter operations
     */
    filter: (filterFunction, customDelay = 200) => {
      return this.getDebounced('search', filterFunction, { delay: customDelay });
    },
    
    /**
     * Throttle scroll-based search
     */
    scroll: (scrollFunction, customDelay = 100) => {
      return this.getThrottled('search', scrollFunction, { delay: customDelay });
    }
  };
  
  /**
   * Progress tracking debouncing
   */
  progress = {
    /**
     * Debounce XP gain updates
     */
    xpGain: (updateFunction) => {
      return this.getDebounced('xpGain', updateFunction);
    },
    
    /**
     * Debounce level calculation
     */
    levelCalculation: (calculateFunction) => {
      return this.getDebounced('levelCalculation', calculateFunction);
    },
    
    /**
     * Throttle progress bar animations
     */
    progressAnimation: (animateFunction) => {
      return this.getThrottled('progressUpdate', animateFunction);
    },
    
    /**
     * Debounce achievement checks
     */
    achievementCheck: (checkFunction) => {
      return this.getDebounced('achievementCheck', checkFunction);
    }
  };
  
  /**
   * Auto-save debouncing
   */
  autoSave = {
    /**
     * Debounce profile auto-save
     */
    profile: (saveFunction) => {
      return this.getDebounced('autoSave', saveFunction, { delay: 3000 });
    },
    
    /**
     * Debounce settings auto-save
     */
    settings: (saveFunction) => {
      return this.getDebounced('settingsUpdate', saveFunction);
    },
    
    /**
     * Debounce game progress auto-save
     */
    gameProgress: (saveFunction) => {
      return this.getDebounced('autoSave', saveFunction, { delay: 1500 });
    }
  };
  
  /**
   * UI update debouncing
   */
  ui = {
    /**
     * Throttle window resize handling
     */
    windowResize: (resizeFunction) => {
      return this.getThrottled('progressUpdate', resizeFunction, { delay: 100 });
    },
    
    /**
     * Debounce form validation
     */
    validation: (validateFunction) => {
      return this.getDebounced('settingsUpdate', validateFunction, { delay: 500 });
    },
    
    /**
     * Throttle scroll animations
     */
    scrollAnimation: (animateFunction) => {
      return this.getThrottled('progressUpdate', animateFunction, { delay: 16 }); // ~60fps
    },
    
    /**
     * Debounce modal operations
     */
    modal: (modalFunction) => {
      return this.getDebounced('progressUpdate', modalFunction, { delay: 200 });
    }
  };
  
  /**
   * Network operations debouncing
   */
  network = {
    /**
     * Debounce API calls
     */
    apiCall: (apiFunction) => {
      return this.getDebounced('autoSave', apiFunction, { delay: 1000 });
    },
    
    /**
     * Throttle social updates
     */
    socialUpdate: (updateFunction) => {
      return this.getThrottled('socialUpdate', updateFunction);
    },
    
    /**
     * Debounce analytics tracking
     */
    analytics: (trackFunction) => {
      return this.getDebounced('analytics', trackFunction);
    }
  };
  
  /**
   * Game-specific debouncing
   */
  game = {
    /**
     * Throttle game input handling
     */
    input: (inputFunction) => {
      return this.getThrottled('progressUpdate', inputFunction, { delay: 16 }); // ~60fps
    },
    
    /**
     * Debounce score updates
     */
    scoreUpdate: (updateFunction) => {
      return this.getDebounced('progressUpdate', updateFunction, { delay: 100 });
    },
    
    /**
     * Debounce game state saves
     */
    stateSave: (saveFunction) => {
      return this.getDebounced('autoSave', saveFunction, { delay: 2000 });
    }
  };
  
  /**
   * Create a batch operation that collects multiple calls and executes them together
   */
  createBatchOperation(operationType, batchFunction, options = {}) {
    const {
      maxBatchSize = 10,
      delay = 1000,
      maxWait = 5000
    } = options;
    
    let batch = [];
    
    const processBatch = () => {
      if (batch.length > 0) {
        const currentBatch = [...batch];
        batch = [];
        this.trackOperation(operationType, 'batch');
        return batchFunction(currentBatch);
      }
    };
    
    const debouncedProcess = debounce(processBatch, delay, { maxWait });
    
    return (...args) => {
      batch.push(args);
      
      if (batch.length >= maxBatchSize) {
        debouncedProcess.flush();
      } else {
        debouncedProcess();
      }
    };
  }
  
  /**
   * Create a rate-limited function that ensures minimum time between executions
   */
  createRateLimited(func, minInterval) {
    let lastExecution = 0;
    let timeoutId;
    let pendingArgs;
    
    return (...args) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecution;
      
      pendingArgs = args;
      
      if (timeSinceLastExecution >= minInterval) {
        lastExecution = now;
        return func.apply(this, args);
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          lastExecution = Date.now();
          func.apply(this, pendingArgs);
          timeoutId = null;
        }, minInterval - timeSinceLastExecution);
      }
    };
  }
  
  /**
   * Cleanup function for when the component/page is unmounted
   */
  cleanup() {
    this.flushAll(); // Execute any pending operations
    this.clearAll(); // Clear all timeouts
    this.operationStats.clear();
  }
}

// Create singleton instance
const debouncedOperations = new DebouncedOperations();

export default debouncedOperations;