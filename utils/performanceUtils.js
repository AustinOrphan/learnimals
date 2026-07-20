/**
 * Performance Utilities
 * Provides debouncing, throttling, and performance monitoring tools
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function - limits execution to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Request Animation Frame throttle - limits to 60fps
 * @param {Function} func - Function to throttle
 * @returns {Function} RAF-throttled function
 */
export function rafThrottle(func) {
  let rafId = null;
  return function executedFunction(...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Performance monitor for measuring execution time
 */
export class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
    this.isEnabled = true;
  }

  /**
   * Start measuring performance for a named operation
   * @param {string} name - Name of the operation
   */
  start(name) {
    if (!this.isEnabled) return;
    this.measurements.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    });
  }

  /**
   * End measuring and calculate duration
   * @param {string} name - Name of the operation
   * @returns {number} Duration in milliseconds
   */
  end(name) {
    if (!this.isEnabled) return 0;

    const measurement = this.measurements.get(name);
    if (!measurement) {
      console.warn(`No measurement started for: ${name}`);
      return 0;
    }

    measurement.endTime = performance.now();
    measurement.duration = measurement.endTime - measurement.startTime;

    return measurement.duration;
  }

  /**
   * Get measurement results
   * @param {string} name - Name of the operation
   * @returns {Object} Measurement data
   */
  getMeasurement(name) {
    return this.measurements.get(name);
  }

  /**
   * Get all measurements
   * @returns {Map} All measurements
   */
  getAllMeasurements() {
    return new Map(this.measurements);
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.measurements.clear();
  }

  /**
   * Enable or disable monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Log performance summary
   */
  logSummary() {
    if (!this.isEnabled) return;

    console.group('Performance Summary');
    for (const [name, measurement] of this.measurements) {
      if (measurement.duration !== null) {
        console.log(`${name}: ${measurement.duration.toFixed(2)}ms`);
      }
    }
    console.groupEnd();
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.isSupported = 'memory' in performance;
  }

  /**
   * Take a memory snapshot
   * @param {string} label - Label for the snapshot
   */
  snapshot(label = 'unnamed') {
    if (!this.isSupported) {
      console.warn('Memory monitoring not supported in this browser');
      return null;
    }

    const memory = performance.memory;
    const snapshot = {
      label,
      timestamp: Date.now(),
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Get memory usage difference between snapshots
   * @param {string} startLabel - Start snapshot label
   * @param {string} endLabel - End snapshot label
   * @returns {Object} Memory difference
   */
  getDifference(startLabel, endLabel) {
    const start = this.snapshots.find(s => s.label === startLabel);
    const end = this.snapshots.find(s => s.label === endLabel);

    if (!start || !end) {
      console.warn('Snapshot not found for comparison');
      return null;
    }

    return {
      usedDiff: end.used - start.used,
      totalDiff: end.total - start.total,
      timeDiff: end.timestamp - start.timestamp,
    };
  }

  /**
   * Get all snapshots
   * @returns {Array} All memory snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }

  /**
   * Clear all snapshots
   */
  clear() {
    this.snapshots = [];
  }

  /**
   * Log memory usage summary
   */
  logSummary() {
    if (!this.isSupported) {
      console.warn('Memory monitoring not supported');
      return;
    }

    console.group('Memory Usage Summary');
    this.snapshots.forEach(snapshot => {
      console.log(`${snapshot.label}: ${(snapshot.used / 1024 / 1024).toFixed(2)}MB used`);
    });
    console.groupEnd();
  }
}

/**
 * Frame rate monitor
 */
export class FPSMonitor {
  constructor() {
    this.frames = [];
    this.isRunning = false;
    this.rafId = null;
  }

  /**
   * Start monitoring frame rate
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.frames = [];

    const tick = () => {
      this.frames.push(performance.now());

      // Keep only last 60 frames for calculation
      if (this.frames.length > 60) {
        this.frames.shift();
      }

      if (this.isRunning) {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }

  /**
   * Stop monitoring frame rate
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    if (this.frames.length < 2) return 0;

    const now = performance.now();
    const firstFrame = this.frames[0];
    const frameCount = this.frames.length;
    const duration = now - firstFrame;

    return Math.round((frameCount / duration) * 1000);
  }

  /**
   * Get average FPS over the monitoring period
   * @returns {number} Average FPS
   */
  getAverageFPS() {
    if (this.frames.length < 2) return 0;

    const totalTime = this.frames[this.frames.length - 1] - this.frames[0];
    const frameCount = this.frames.length - 1;

    return Math.round((frameCount / totalTime) * 1000);
  }
}

/**
 * Batch DOM updates to improve performance
 */
export class DOMBatcher {
  constructor() {
    this.updates = [];
    this.rafId = null;
  }

  /**
   * Add DOM update to batch
   * @param {Function} updateFn - Function to execute
   */
  add(updateFn) {
    this.updates.push(updateFn);
    this.scheduleFlush();
  }

  /**
   * Schedule batch flush
   */
  scheduleFlush() {
    if (this.rafId) return;

    this.rafId = requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Execute all batched updates
   */
  flush() {
    const updates = this.updates.splice(0);
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('Error in batched DOM update:', error);
      }
    });

    this.rafId = null;
  }

  /**
   * Clear all pending updates
   */
  clear() {
    this.updates = [];
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Create global instances for easy use
export const performanceMonitor = new PerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();
export const fpsMonitor = new FPSMonitor();
export const domBatcher = new DOMBatcher();

/**
 * Utility to wrap expensive functions with performance monitoring
 * @param {Function} func - Function to wrap
 * @param {string} name - Name for monitoring
 * @returns {Function} Wrapped function
 */
export function withPerformanceMonitoring(func, name) {
  return function (...args) {
    performanceMonitor.start(name);
    const result = func.apply(this, args);
    const duration = performanceMonitor.end(name);

    // Log slow operations (> 16ms could affect 60fps)
    if (duration > 16) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  };
}

/**
 * Performance-aware function executor
 * Automatically throttles based on current performance
 */
export class AdaptiveThrottler {
  constructor() {
    this.baseThrottleTime = 100; // ms
    this.maxThrottleTime = 1000; // ms
    this.currentThrottleTime = this.baseThrottleTime;
    this.performanceHistory = [];
  }

  /**
   * Execute function with adaptive throttling
   * @param {Function} func - Function to execute
   * @param {string} context - Context for performance tracking
   * @returns {Function} Adaptively throttled function
   */
  throttle(func, _context = 'adaptive') {
    return throttle((...args) => {
      const start = performance.now();
      const result = func.apply(this, args);
      const duration = performance.now() - start;

      this.updateThrottleTime(duration);

      return result;
    }, this.currentThrottleTime);
  }

  /**
   * Update throttle time based on execution performance
   * @param {number} executionTime - Time taken for last execution
   */
  updateThrottleTime(executionTime) {
    this.performanceHistory.push(executionTime);

    // Keep only last 10 measurements
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }

    // Calculate average execution time
    const avgTime =
      this.performanceHistory.reduce((a, b) => a + b) / this.performanceHistory.length;

    // Adjust throttle time based on performance
    if (avgTime > 16) {
      // Slower than 60fps
      this.currentThrottleTime = Math.min(this.currentThrottleTime * 1.2, this.maxThrottleTime);
    } else if (avgTime < 8) {
      // Faster than 120fps
      this.currentThrottleTime = Math.max(this.currentThrottleTime * 0.9, this.baseThrottleTime);
    }
  }

  /**
   * Get current throttle time
   * @returns {number} Current throttle time in ms
   */
  getCurrentThrottleTime() {
    return this.currentThrottleTime;
  }

  /**
   * Reset to base throttle time
   */
  reset() {
    this.currentThrottleTime = this.baseThrottleTime;
    this.performanceHistory = [];
  }
}
