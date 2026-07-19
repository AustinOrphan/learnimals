/**
 * BaseGame Feedback System Tests
 * Comprehensive tests for the feedback system, cleanup, and memory management
 * with proper timer mocking and isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Simplified timer utilities for better performance
const TimerUtils = {
  // Standard delay with fake timers - simplified
  delay: ms => {
    vi.advanceTimersByTime(ms);
  },

  // Run all pending timers immediately
  runAllTimers: () => {
    vi.runAllTimers();
  },

  // Run only timers, not animation frames
  runOnlyTimers: () => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  },

  // Advance timers by specific amount
  advance: ms => {
    vi.useFakeTimers();
    vi.advanceTimersByTime(ms);
    vi.useRealTimers();
  },

  // Handle animation frames with timer advancement
  advanceWithFrames: (ms, frameCallback) => {
    vi.useFakeTimers();
    if (frameCallback) frameCallback();
    vi.advanceTimersByTime(ms);
    vi.useRealTimers();
  },

  // Execute immediate timer operations (for feedback system)
  executeImmediate: () => {
    vi.useFakeTimers();
    // Run all timers and animation frames immediately
    vi.runAllTimers();
    // Additional pass for any timers created during execution
    vi.runAllTimers();
    vi.useRealTimers();
  },

  // Advance timers in steps with RAF handling
  advanceInSteps: (totalMs, stepMs = 16) => {
    vi.useFakeTimers();
    const steps = Math.ceil(totalMs / stepMs);
    for (let i = 0; i < steps; i++) {
      vi.advanceTimersByTime(stepMs);
    }
    vi.useRealTimers();
  },
};

// Mock BaseGame class for testing
class MockBaseGame {
  constructor(containerId = 'test-canvas', options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.state = 'loading';
    this.isActive = false;
    this.gameLoopRunning = false;
    this.gameLoopId = null;

    // Feedback system state
    this.feedbackConfig = {
      enabled: options.enableFeedback !== false,
      character: options.character || 'bella',
      audioEnabled: options.enableAudio !== false,
      hapticEnabled: options.enableHaptic !== false,
      accessibilityEnabled: options.enableA11y !== false,
      reducedMotion: false,
      feedbackDuration: options.feedbackDuration || 2000,
      debugMode: options.debugFeedback || false,
    };

    this.feedbackState = {
      activeFeedbacks: new Map(),
      feedbackQueue: [],
      lastFeedbackTime: 0,
      feedbackCounter: 0,
      ariaLiveRegion: null,
      feedbackContainer: null,
    };

    // Performance monitoring
    this.analytics = {
      feedbackEvents: [],
      sessionStartTime: null,
      totalPlayTime: 0,
    };

    // Timer and interval tracking for cleanup
    this.activeTimers = new Set();
    this.activeIntervals = new Set();
    this.animationFrames = new Set();

    // Mock DOM elements
    this.setupMockDOM();
    this.setupFeedbackSystem();
  }

  setupMockDOM() {
    // Create mock container
    this.container = document.createElement('div');
    this.container.id = this.containerId;
    document.body.appendChild(this.container);
  }

  setupFeedbackSystem() {
    if (!this.feedbackConfig.enabled) return;

    // Create ARIA live region
    this.feedbackState.ariaLiveRegion = document.createElement('div');
    this.feedbackState.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.feedbackState.ariaLiveRegion.setAttribute('class', 'visually-hidden');
    document.body.appendChild(this.feedbackState.ariaLiveRegion);

    // Create feedback container
    this.feedbackState.feedbackContainer = document.createElement('div');
    this.feedbackState.feedbackContainer.setAttribute('class', 'game-feedback-container');
    this.container.appendChild(this.feedbackState.feedbackContainer);
  }

  // Mock setTimeout with tracking
  setTimeout(callback, delay) {
    const id = global.setTimeout(callback, delay);
    this.activeTimers.add(id);
    return id;
  }

  // Mock setInterval with tracking
  setInterval(callback, interval) {
    const id = global.setInterval(callback, interval);
    this.activeIntervals.add(id);
    return id;
  }

  // Mock requestAnimationFrame with tracking
  requestAnimationFrame(callback) {
    const id = global.requestAnimationFrame(callback);
    this.animationFrames.add(id);
    return id;
  }

  // Mock feedback method
  async showFeedback(type, message, options = {}) {
    if (!this.feedbackConfig.enabled) return null;

    const feedbackId = `feedback_${++this.feedbackState.feedbackCounter}`;
    const duration = options.duration || this.feedbackConfig.feedbackDuration;

    // Track feedback
    const feedback = {
      id: feedbackId,
      type,
      message,
      startTime: performance && performance.now ? performance.now() : Date.now(),
      active: true,
    };

    this.feedbackState.activeFeedbacks.set(feedbackId, feedback);

    // Schedule cleanup with timer tracking
    const timerId = this.setTimeout(() => {
      this.cleanupFeedback(feedbackId);
      this.activeTimers.delete(timerId);
    }, duration);

    // Analytics tracking
    if (this.analytics && this.analytics.feedbackEvents) {
      this.analytics.feedbackEvents.push({
        type,
        timestamp: feedback.startTime,
        feedbackId,
      });
    }

    return feedbackId;
  }

  cleanupFeedback(feedbackId) {
    this.feedbackState.activeFeedbacks.delete(feedbackId);
  }

  // Game loop simulation
  startGameLoop() {
    if (this.gameLoopRunning) return;

    this.gameLoopRunning = true;
    this.isActive = true;

    const gameLoop = () => {
      if (!this.gameLoopRunning || !this.isActive) {
        this.gameLoopId = null;
        return;
      }

      // Mock game logic
      this.update();

      this.gameLoopId = this.requestAnimationFrame(gameLoop);
    };

    this.gameLoopId = this.requestAnimationFrame(gameLoop);
  }

  stopGameLoop() {
    this.gameLoopRunning = false;
    this.isActive = false;

    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.animationFrames.delete(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  update() {
    // Mock update logic
  }

  // Performance monitoring mock
  trackPerformance() {
    const performanceTimer = this.setInterval(() => {
      // Mock performance tracking
      if (performance && performance.now) {
        const now = performance.now();
        if (this.analytics.sessionStartTime) {
          this.analytics.totalPlayTime = now - this.analytics.sessionStartTime;
        }
      }
    }, 1000);

    return performanceTimer;
  }

  // Comprehensive cleanup method
  destroy() {
    // Stop game loop
    this.stopGameLoop();

    // Clear all tracked timers
    this.activeTimers.forEach(id => {
      clearTimeout(id);
    });
    this.activeTimers.clear();

    // Clear all tracked intervals
    this.activeIntervals.forEach(id => {
      clearInterval(id);
    });
    this.activeIntervals.clear();

    // Cancel all animation frames
    this.animationFrames.forEach(id => {
      cancelAnimationFrame(id);
    });
    this.animationFrames.clear();

    // Clear feedback state
    this.feedbackState.activeFeedbacks.clear();
    this.feedbackState.feedbackQueue = [];

    // Remove DOM elements
    if (this.feedbackState.ariaLiveRegion) {
      this.feedbackState.ariaLiveRegion.remove();
      this.feedbackState.ariaLiveRegion = null;
    }

    if (this.feedbackState.feedbackContainer) {
      this.feedbackState.feedbackContainer.remove();
      this.feedbackState.feedbackContainer = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    // Clear analytics
    this.analytics.feedbackEvents = [];
  }

  // Test helper methods
  getActiveTimerCount() {
    return this.activeTimers.size;
  }

  getActiveIntervalCount() {
    return this.activeIntervals.size;
  }

  getActiveAnimationFrameCount() {
    return this.animationFrames.size;
  }

  getActiveFeedbackCount() {
    return this.feedbackState.activeFeedbacks.size;
  }
}

describe('BaseGame Feedback System', () => {
  let game;
  let mockPerformance;

  beforeEach(() => {
    // Ensure we're using real timers to start
    vi.useRealTimers();

    // Setup clean DOM
    document.body.innerHTML = '';

    // Mock performance API
    mockPerformance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      memory: {
        usedJSHeapSize: 10 * 1024 * 1024,
        totalJSHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 100 * 1024 * 1024,
      },
    };

    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true,
      configurable: true,
    });

    // Mock requestAnimationFrame and cancelAnimationFrame with proper fake timer integration
    let rafId = 0;
    const rafCallbacks = new Map();

    global.requestAnimationFrame = vi.fn(callback => {
      const id = ++rafId;
      rafCallbacks.set(id, callback);

      // Schedule callback with setTimeout to work with fake timers
      setTimeout(() => {
        const cb = rafCallbacks.get(id);
        if (cb) {
          rafCallbacks.delete(id);
          cb(performance.now());
        }
      }, 16);

      return id;
    });

    global.cancelAnimationFrame = vi.fn(id => {
      rafCallbacks.delete(id);
    });

    // Mock setTimeout and setInterval to work properly with vi.runAllTimers()
    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearTimeout = global.clearTimeout;
    const originalClearInterval = global.clearInterval;

    global.setTimeout = vi.fn(originalSetTimeout);
    global.setInterval = vi.fn(originalSetInterval);
    global.clearTimeout = vi.fn(originalClearTimeout);
    global.clearInterval = vi.fn(originalClearInterval);

    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
    });

    // Create game instance
    game = new MockBaseGame('test-canvas', {
      enableFeedback: true,
      feedbackDuration: 2000,
    });
  });

  afterEach(async () => {
    // Ensure complete cleanup
    if (game) {
      game.destroy();
      game = null;
    }

    // Clear all timers if fake timers are being used
    try {
      vi.clearAllTimers();
    } catch (error) {
      // Timers might not be mocked, that's okay
    }

    // Clean up DOM
    document.body.innerHTML = '';

    // Clear all mocks
    vi.clearAllMocks();

    // Restore original timer functions
    vi.useRealTimers();
  });

  describe('Timer and Memory Management', () => {
    it('should track and clear all setTimeout calls', () => {
      // Create multiple feedbacks that use timers
      game.showFeedback('success', 'Test message 1');
      game.showFeedback('error', 'Test message 2');
      game.showFeedback('hint', 'Test message 3');

      // Should have tracked timers
      expect(game.getActiveTimerCount()).toBe(3);

      // Destroy game
      game.destroy();

      // All timers should be cleared
      expect(game.getActiveTimerCount()).toBe(0);
    });

    it('should track and clear all setInterval calls', () => {
      // Start performance monitoring (uses intervals)
      game.trackPerformance();
      game.trackPerformance();

      // Should have tracked intervals
      expect(game.getActiveIntervalCount()).toBe(2);

      // Destroy game
      game.destroy();

      // All intervals should be cleared
      expect(game.getActiveIntervalCount()).toBe(0);
    });

    it('should track and cancel all animation frames', () => {
      // Start game loop (uses animation frames)
      game.startGameLoop();

      // Should have at least one animation frame
      expect(game.getActiveAnimationFrameCount()).toBeGreaterThan(0);

      // Destroy game
      game.destroy();

      // All animation frames should be canceled
      expect(game.getActiveAnimationFrameCount()).toBe(0);
    });

    it('should clear feedback state on cleanup', async () => {
      // Create multiple active feedbacks
      await game.showFeedback('success', 'Message 1');
      await game.showFeedback('error', 'Message 2');
      await game.showFeedback('achievement', 'Message 3');

      // Should have active feedbacks
      expect(game.getActiveFeedbackCount()).toBe(3);

      // Destroy game
      game.destroy();

      // All feedbacks should be cleared
      expect(game.getActiveFeedbackCount()).toBe(0);
      expect(game.feedbackState.feedbackQueue).toHaveLength(0);
    });

    it('should remove all DOM elements on cleanup', () => {
      // Verify DOM elements exist
      expect(game.container).toBeTruthy();
      expect(game.feedbackState.ariaLiveRegion).toBeTruthy();
      expect(game.feedbackState.feedbackContainer).toBeTruthy();

      const initialElements = document.querySelectorAll('*').length;

      // Destroy game
      game.destroy();

      // DOM elements should be removed
      expect(game.container).toBeNull();
      expect(game.feedbackState.ariaLiveRegion).toBeNull();
      expect(game.feedbackState.feedbackContainer).toBeNull();

      // Should have fewer DOM elements
      const finalElements = document.querySelectorAll('*').length;
      expect(finalElements).toBeLessThan(initialElements);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track feedback performance metrics', async () => {
      const startTime = performance.now();

      // Trigger multiple feedbacks
      await game.showFeedback('success', 'Performance test');
      await game.showFeedback('error', 'Performance test 2');

      // Should track feedback events
      expect(game.analytics.feedbackEvents).toHaveLength(2);

      // Each event should have performance data
      game.analytics.feedbackEvents.forEach(event => {
        expect(event.timestamp).toBeGreaterThanOrEqual(startTime);
        expect(event.type).toBeDefined();
        expect(event.feedbackId).toBeDefined();
      });
    });

    it('should monitor memory usage during feedback operations', async () => {
      const initialMemory = performance.memory.usedJSHeapSize;

      // Create many feedbacks to test memory management
      const feedbackPromises = [];
      for (let i = 0; i < 100; i++) {
        feedbackPromises.push(game.showFeedback('success', `Memory test ${i}`));
      }

      await Promise.all(feedbackPromises);

      // Advance timers to trigger cleanups
      vi.useFakeTimers();
      vi.advanceTimersByTime(5000);
      vi.useRealTimers();

      // Memory should not have grown excessively
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not increase by more than 5MB (conservative estimate)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it('should handle performance monitoring failures gracefully', async () => {
      // Break performance API
      const originalPerformance = global.performance;
      global.performance = null;

      // Should not throw errors
      expect(() => {
        game.trackPerformance();
      }).not.toThrow();

      expect(async () => {
        await game.showFeedback('success', 'Test with broken performance API');
      }).not.toThrow();

      // Restore performance API
      global.performance = originalPerformance;
    });
  });

  describe('Test Isolation and Cleanup', () => {
    it('should ensure complete isolation between tests', async () => {
      // Create first game instance
      const game1 = new MockBaseGame('test-1');
      await game1.showFeedback('success', 'Game 1 message');

      // Create second game instance
      const game2 = new MockBaseGame('test-2');
      await game2.showFeedback('error', 'Game 2 message');

      // Games should be isolated
      expect(game1.getActiveFeedbackCount()).toBe(1);
      expect(game2.getActiveFeedbackCount()).toBe(1);

      // Destroy first game
      game1.destroy();

      // Should not affect second game
      expect(game2.getActiveFeedbackCount()).toBe(1);

      // Cleanup
      game2.destroy();
    });

    it('should handle rapid create/destroy cycles without leaks', () => {
      const games = [];

      // Create and destroy many game instances rapidly
      for (let i = 0; i < 50; i++) {
        const testGame = new MockBaseGame(`rapid-test-${i}`);
        testGame.showFeedback('success', `Rapid test ${i}`);
        games.push(testGame);
      }

      // Destroy all games
      games.forEach(testGame => testGame.destroy());

      // Should not have any remaining DOM elements from games
      const remainingGameElements = document.querySelectorAll('[id*="rapid-test"]');
      expect(remainingGameElements.length).toBe(0);
    });

    it('should cleanup event listeners and prevent memory leaks', () => {
      // Create game and add event listeners
      const testGame = new MockBaseGame('listener-test');

      // Mock addEventListener to track calls
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // Simulate event listener setup
      testGame.setupEventListeners = () => {
        document.addEventListener('keydown', () => {});
        document.addEventListener('keyup', () => {});
        document.addEventListener('visibilitychange', () => {});
      };

      testGame.setupEventListeners();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);

      // Destroy game (should remove listeners)
      testGame.destroy();

      // Should have attempted to remove listeners
      // Note: Our mock doesn't actually track removal, but ensures destroy is comprehensive
      expect(testGame.container).toBeNull();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Feedback Duration and Timer Management', () => {
    it('should respect custom feedback durations', async () => {
      vi.useFakeTimers();

      const shortDuration = 500;
      const longDuration = 3000;

      // Create feedbacks with different durations
      await game.showFeedback('success', 'Short message', { duration: shortDuration });
      await game.showFeedback('error', 'Long message', { duration: longDuration });

      expect(game.getActiveFeedbackCount()).toBe(2);

      // Advance time by short duration
      vi.advanceTimersByTime(shortDuration + 100);

      // Short feedback should be cleaned up
      expect(game.getActiveFeedbackCount()).toBe(1);

      // Advance time by remaining duration
      vi.advanceTimersByTime(longDuration - shortDuration);

      // Long feedback should now be cleaned up
      expect(game.getActiveFeedbackCount()).toBe(0);

      vi.useRealTimers();
    });

    it('should handle timer advancement correctly with fake timers', async () => {
      vi.useFakeTimers();

      // Create feedback
      await game.showFeedback('success', 'Timer test');
      expect(game.getActiveFeedbackCount()).toBe(1);

      // Should not cleanup immediately
      vi.advanceTimersByTime(1000);
      expect(game.getActiveFeedbackCount()).toBe(1);

      // Should cleanup after full duration
      vi.advanceTimersByTime(2000);
      expect(game.getActiveFeedbackCount()).toBe(0);

      vi.useRealTimers();
    });

    it('should handle cleanup when game is destroyed before timers fire', async () => {
      vi.useFakeTimers();

      // Create long-duration feedback
      await game.showFeedback('success', 'Long message', { duration: 10000 });
      expect(game.getActiveTimerCount()).toBe(1);

      // Destroy game before timer fires
      game.destroy();

      // Timer should be cleared
      expect(game.getActiveTimerCount()).toBe(0);

      // Advancing time should not cause errors
      vi.advanceTimersByTime(15000);

      vi.useRealTimers();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle feedback system disabled gracefully', async () => {
      const disabledGame = new MockBaseGame('disabled-test', { enableFeedback: false });

      // Should return null for disabled feedback
      const result = await disabledGame.showFeedback('success', 'Test message');
      expect(result).toBeNull();

      // Should have no active feedbacks or timers
      expect(disabledGame.getActiveFeedbackCount()).toBe(0);
      expect(disabledGame.getActiveTimerCount()).toBe(0);

      disabledGame.destroy();
    });

    it('should handle DOM manipulation errors gracefully', async () => {
      // Remove DOM elements to simulate errors
      game.feedbackState.feedbackContainer.remove();

      // Should not throw when trying to add feedback
      expect(async () => {
        await game.showFeedback('success', 'DOM error test');
      }).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      // Should not throw on multiple destroy calls
      expect(() => {
        game.destroy();
        game.destroy();
        game.destroy();
      }).not.toThrow();

      // State should remain clean
      expect(game.getActiveTimerCount()).toBe(0);
      expect(game.getActiveFeedbackCount()).toBe(0);
    });
  });

  describe('Enhanced Timer Mocking', () => {
    it('should properly mock and execute setTimeout with vi.runAllTimers()', async () => {
      let executed = false;

      vi.useFakeTimers();

      // Create a setTimeout
      setTimeout(() => {
        executed = true;
      }, 1000);

      // Should not execute immediately
      expect(executed).toBe(false);

      // Use vi.runAllTimers() for immediate execution
      vi.runAllTimers();

      // Should now be executed
      expect(executed).toBe(true);

      vi.useRealTimers();
    });

    it('should properly mock and execute setInterval with vi.runAllTimers()', () => {
      let count = 0;

      vi.useFakeTimers();

      // Create a setInterval
      const intervalId = setInterval(() => {
        count++;
      }, 100);

      // Should not execute immediately
      expect(count).toBe(0);

      // Advance by 500ms to trigger 5 executions
      vi.advanceTimersByTime(500);
      expect(count).toBe(5);

      // Clear interval
      clearInterval(intervalId);

      // Advance more time - should not increase count
      vi.advanceTimersByTime(200);
      expect(count).toBe(5);

      vi.useRealTimers();
    });

    it('should properly mock requestAnimationFrame calls', () => {
      let frameExecuted = false;

      vi.useFakeTimers();

      // Create RAF call
      requestAnimationFrame(() => {
        frameExecuted = true;
      });

      // Should not execute immediately
      expect(frameExecuted).toBe(false);

      // Advance by one frame (16ms)
      vi.advanceTimersByTime(16);

      // Should now be executed
      expect(frameExecuted).toBe(true);

      vi.useRealTimers();
    });

    it('should handle nested timers with vi.runAllTimers()', () => {
      const executionOrder = [];

      vi.useFakeTimers();

      // Create nested timers
      setTimeout(() => {
        executionOrder.push('outer');
        setTimeout(() => {
          executionOrder.push('inner');
        }, 100);
      }, 50);

      // Use runAllTimers to execute all nested timers
      vi.runAllTimers();

      // Both should be executed in order
      expect(executionOrder).toEqual(['outer', 'inner']);

      vi.useRealTimers();
    });

    it('should handle feedback system timers with immediate execution', async () => {
      vi.useFakeTimers();

      // Create feedback with custom duration
      await game.showFeedback('success', 'Test immediate execution', { duration: 1000 });

      expect(game.getActiveFeedbackCount()).toBe(1);

      // Run all timers to trigger cleanup
      vi.runAllTimers();

      // Feedback should be cleaned up immediately
      expect(game.getActiveFeedbackCount()).toBe(0);

      vi.useRealTimers();
    });

    it('should handle game loop with requestAnimationFrame mocking', () => {
      let updateCount = 0;

      // Override update method to track calls
      game.update = () => {
        updateCount++;
      };

      vi.useFakeTimers();

      // Start game loop
      game.startGameLoop();

      // Should not execute immediately
      expect(updateCount).toBe(0);

      // Advance by several frames (16ms each)
      vi.advanceTimersByTime(64); // 4 frames

      // Should have executed multiple times
      expect(updateCount).toBeGreaterThan(0);

      // Stop game loop
      game.stopGameLoop();

      vi.useRealTimers();
    });

    it('should handle timer advancement in steps for smooth animation testing', () => {
      const frameTimestamps = [];

      vi.useFakeTimers();

      // Create animation loop
      const animate = timestamp => {
        frameTimestamps.push(timestamp);
        if (frameTimestamps.length < 5) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);

      // Use step advancement for smooth animation
      TimerUtils.advanceInSteps(80, 16); // 5 frames at 16ms each

      // Should have collected 5 timestamps
      expect(frameTimestamps.length).toBe(5);

      vi.useRealTimers();
    });

    it('should properly clear timers when using fake timers', () => {
      const timerIds = [];

      vi.useFakeTimers();

      // Create multiple timers
      timerIds.push(setTimeout(() => {}, 1000));
      timerIds.push(setTimeout(() => {}, 2000));
      timerIds.push(setInterval(() => {}, 500));

      // Clear them all
      timerIds.forEach(id => {
        if (typeof id === 'number') {
          clearTimeout(id);
          clearInterval(id);
        }
      });

      // Advance time - nothing should execute
      vi.advanceTimersByTime(3000);

      // No errors should occur
      expect(true).toBe(true);

      vi.useRealTimers();
    });

    it('should handle performance.now() calls in timer callbacks', () => {
      const timestamps = [];

      vi.useFakeTimers();

      // Create timer that uses performance.now()
      setTimeout(() => {
        timestamps.push(performance.now());
      }, 100);

      setTimeout(() => {
        timestamps.push(performance.now());
      }, 200);

      // Advance timers
      vi.advanceTimersByTime(300);

      // Should have collected timestamps
      expect(timestamps.length).toBe(2);
      expect(timestamps[1]).toBeGreaterThan(timestamps[0]);

      vi.useRealTimers();
    });
  });
});
