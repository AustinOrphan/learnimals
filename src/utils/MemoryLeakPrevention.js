/**
 * Memory Leak Prevention Utilities
 *
 * Provides centralized utilities for preventing memory leaks in JavaScript applications.
 * Includes timer management, event listener cleanup, resource disposal, and reference clearing.
 *
 * Features:
 * - Timer and interval management with automatic cleanup
 * - Event listener removal utilities
 * - Audio context disposal
 * - DOM reference clearing
 * - Component lifecycle management
 */

export default class MemoryLeakPrevention {
  constructor() {
    this.timers = new Set();
    this.intervals = new Set();
    this.eventListeners = new Map();
    this.audioContexts = new Set();
    this.cleanupCallbacks = new Set();
  }

  /**
   * Register a setTimeout with automatic cleanup tracking
   * @param {Function} callback - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timer ID
   */
  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);

    this.timers.add(timerId);
    return timerId;
  }

  /**
   * Register a setInterval with automatic cleanup tracking
   * @param {Function} callback - Function to execute
   * @param {number} interval - Interval in milliseconds
   * @returns {number} Interval ID
   */
  setInterval(callback, interval) {
    const intervalId = setInterval(callback, interval);
    this.intervals.add(intervalId);
    return intervalId;
  }

  /**
   * Clear a specific timer
   * @param {number} timerId - Timer ID to clear
   */
  clearTimeout(timerId) {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  /**
   * Clear a specific interval
   * @param {number} intervalId - Interval ID to clear
   */
  clearInterval(intervalId) {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  /**
   * Clear all registered timers and intervals
   */
  clearAllTimers() {
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * Register an event listener with automatic cleanup tracking
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   */
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    const key = `${element.tagName || 'window'}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, handler, options });
  }

  /**
   * Remove a specific event listener
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   */
  removeEventListener(element, event, handler) {
    element.removeEventListener(event, handler);

    const key = `${element.tagName || 'window'}-${event}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.findIndex(l => l.element === element && l.handler === handler);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Remove all registered event listeners
   */
  removeAllEventListeners() {
    this.eventListeners.forEach((listeners, key) => {
      const [, event] = key.split('-');
      listeners.forEach(({ element, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }

  /**
   * Register an audio context for cleanup tracking
   * @param {AudioContext} audioContext - Audio context to track
   */
  registerAudioContext(audioContext) {
    this.audioContexts.add(audioContext);
  }

  /**
   * Close and cleanup all registered audio contexts
   */
  closeAllAudioContexts() {
    this.audioContexts.forEach(audioContext => {
      if (audioContext.state !== 'closed') {
        try {
          audioContext.close();
        } catch (error) {
          console.warn('Error closing audio context:', error);
        }
      }
    });
    this.audioContexts.clear();
  }

  /**
   * Register a cleanup callback to be called during destroy
   * @param {Function} callback - Cleanup function
   */
  addCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove a cleanup callback
   * @param {Function} callback - Cleanup function to remove
   */
  removeCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Execute all cleanup callbacks
   */
  executeCleanupCallbacks() {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in cleanup callback:', error);
      }
    });
    this.cleanupCallbacks.clear();
  }

  /**
   * Clear all object references to prevent memory leaks
   * @param {Object} obj - Object to clear references from
   * @param {Array<string>} exemptions - Property names to skip
   */
  clearObjectReferences(obj, exemptions = []) {
    const exempt = new Set(exemptions);

    Object.keys(obj).forEach(key => {
      if (!exempt.has(key) && Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj[key] && typeof obj[key] === 'object') {
          // Clear arrays and objects
          if (Array.isArray(obj[key])) {
            obj[key].length = 0;
          } else if (obj[key].constructor === Object) {
            Object.keys(obj[key]).forEach(subKey => {
              obj[key][subKey] = null;
            });
          }
        }
        obj[key] = null;
      }
    });
  }

  /**
   * Replace DOM element to remove all event listeners
   * @param {Element} element - Element to clean
   * @returns {Element} New clean element
   */
  cleanDOMElement(element) {
    if (!element || !element.parentNode) return null;

    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
  }

  /**
   * Clean multiple DOM elements by ID
   * @param {Array<string>} elementIds - Array of element IDs to clean
   */
  cleanDOMElementsByIds(elementIds) {
    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.cleanDOMElement(element);
      }
    });
  }

  /**
   * Complete cleanup of all tracked resources
   */
  destroy() {
    // Execute custom cleanup callbacks first
    this.executeCleanupCallbacks();

    // Clear all timers and intervals
    this.clearAllTimers();

    // Remove all event listeners
    this.removeAllEventListeners();

    // Close all audio contexts
    this.closeAllAudioContexts();

    console.log('MemoryLeakPrevention: All resources cleaned up');
  }

  /**
   * Get current resource counts for debugging
   * @returns {Object} Resource counts
   */
  getResourceCounts() {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce(
        (acc, listeners) => acc + listeners.length,
        0
      ),
      audioContexts: this.audioContexts.size,
      cleanupCallbacks: this.cleanupCallbacks.size,
    };
  }
}

/**
 * Global memory leak prevention instance
 * Use this for application-wide resource tracking
 */
export const globalMemoryManager = new MemoryLeakPrevention();

/**
 * Utility function to create a component-specific memory manager
 * @returns {MemoryLeakPrevention} New memory manager instance
 */
export function createMemoryManager() {
  return new MemoryLeakPrevention();
}

/**
 * Mixin for adding memory leak prevention to classes
 * @param {Class} BaseClass - Class to extend with memory management
 * @returns {Class} Extended class with memory management
 */
export function withMemoryManagement(BaseClass) {
  return class extends BaseClass {
    constructor(...args) {
      super(...args);
      this.memoryManager = new MemoryLeakPrevention();
    }

    destroy() {
      if (this.memoryManager) {
        this.memoryManager.destroy();
        this.memoryManager = null;
      }

      if (super.destroy) {
        super.destroy();
      }
    }
  };
}
