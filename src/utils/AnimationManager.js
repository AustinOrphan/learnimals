/**
 * Animation Performance Manager
 *
 * Provides efficient, CSP-compliant animation utilities that use requestAnimationFrame
 * instead of setTimeout for better performance and smoother animations.
 *
 * Features:
 * - Frame-based timing using requestAnimationFrame
 * - Automatic cleanup and memory leak prevention
 * - Pause/resume support for performance optimization
 * - Sequential animation support for UI feedback
 * - Browser tab visibility optimization
 */

export default class AnimationManager {
  constructor() {
    this.activeAnimations = new Map();
    this.animationId = 0;
    this.isPaused = false;

    // Optimize for browser tab visibility
    this.setupVisibilityOptimization();
  }

  /**
   * Schedule a function to run after a specified delay using requestAnimationFrame
   * More performant than setTimeout for animation-related timing
   * @param {Function} callback - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @param {Object} options - Additional options
   * @returns {number} Animation ID for cancellation
   */
  delay(callback, delay, options = {}) {
    const id = ++this.animationId;
    const startTime = performance.now();

    const animation = {
      id,
      callback,
      startTime,
      delay,
      options,
      cancelled: false,
    };

    this.activeAnimations.set(id, animation);

    const frame = currentTime => {
      if (animation.cancelled || this.isPaused) {
        this.activeAnimations.delete(id);
        return;
      }

      const elapsed = currentTime - startTime;

      if (elapsed >= delay) {
        // Execute callback
        try {
          callback();
        } catch (error) {
          console.error('Animation callback error:', error);
        }

        this.activeAnimations.delete(id);
      } else {
        // Continue waiting
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
    return id;
  }

  /**
   * Create a sequential animation sequence
   * Replaces multiple setTimeout calls with frame-based timing
   * @param {Array} sequence - Array of {callback, delay} objects
   * @param {Object} options - Animation options
   * @returns {number} Sequence ID for cancellation
   */
  sequence(sequence, options = {}) {
    const id = ++this.animationId;
    let currentIndex = 0;
    let _accumulatedTime = 0;

    const executeNext = () => {
      if (currentIndex >= sequence.length) {
        this.activeAnimations.delete(id);
        if (options.onComplete) {
          options.onComplete();
        }
        return;
      }

      const step = sequence[currentIndex];
      _accumulatedTime += step.delay || 0;

      this.delay(() => {
        if (this.activeAnimations.has(id)) {
          try {
            step.callback();
          } catch (error) {
            console.error('Sequence step error:', error);
          }
          currentIndex++;
          executeNext();
        }
      }, step.delay || 0);
    };

    this.activeAnimations.set(id, { id, type: 'sequence', cancelled: false });
    executeNext();

    return id;
  }

  /**
   * Animate a value over time using requestAnimationFrame
   * More efficient than CSS transitions for complex animations
   * @param {Object} config - Animation configuration
   * @returns {number} Animation ID for cancellation
   */
  animate(config) {
    const {
      duration = 1000,
      from = 0,
      to = 1,
      easing = this.easeInOutCubic,
      onUpdate,
      onComplete,
    } = config;

    const id = ++this.animationId;
    const startTime = performance.now();

    const animation = {
      id,
      startTime,
      duration,
      from,
      to,
      easing,
      onUpdate,
      onComplete,
      cancelled: false,
    };

    this.activeAnimations.set(id, animation);

    const frame = currentTime => {
      if (animation.cancelled || this.isPaused) {
        this.activeAnimations.delete(id);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = from + (to - from) * easedProgress;

      try {
        onUpdate(currentValue, progress);
      } catch (error) {
        console.error('Animation update error:', error);
      }

      if (progress >= 1) {
        this.activeAnimations.delete(id);
        if (onComplete) {
          try {
            onComplete();
          } catch (error) {
            console.error('Animation complete error:', error);
          }
        }
      } else {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
    return id;
  }

  /**
   * Cancel a specific animation
   * @param {number} id - Animation ID to cancel
   */
  cancel(id) {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.cancelled = true;
      this.activeAnimations.delete(id);
    }
  }

  /**
   * Cancel all active animations
   * Useful for cleanup when component is destroyed
   */
  cancelAll() {
    this.activeAnimations.forEach(animation => {
      animation.cancelled = true;
    });
    this.activeAnimations.clear();
  }

  /**
   * Pause all animations
   * Useful for performance optimization when game/component is not visible
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume all animations
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Get count of active animations for debugging
   * @returns {number} Number of active animations
   */
  getActiveCount() {
    return this.activeAnimations.size;
  }

  /**
   * Setup automatic pause/resume based on page visibility
   * Improves performance when tab is not active
   */
  setupVisibilityOptimization() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pause();
        } else {
          this.resume();
        }
      });
    }
  }

  // Easing functions for smooth animations
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  easeOutElastic(t) {
    return Math.sin((-13 * (t + 1) * Math.PI) / 2) * Math.pow(2, -10 * t) + 1;
  }

  easeInOutBack(t) {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }
}

/**
 * Global animation manager instance
 * Provides singleton access for performance optimization
 */
export const animationManager = new AnimationManager();

/**
 * Convenience function for delayed execution using requestAnimationFrame
 * Replaces setTimeout for animation-related timing
 * @param {Function} callback - Function to execute
 * @param {number} delay - Delay in milliseconds
 * @returns {number} Animation ID for cancellation
 */
export function animationDelay(callback, delay) {
  return animationManager.delay(callback, delay);
}

/**
 * Convenience function for animation sequences
 * Replaces multiple setTimeout calls
 * @param {Array} sequence - Array of {callback, delay} objects
 * @returns {number} Sequence ID for cancellation
 */
export function animationSequence(sequence) {
  return animationManager.sequence(sequence);
}
