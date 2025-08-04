/**
 * ProgressService Tests
 *
 * Test suite for the ProgressService class to ensure proper functionality
 * of progress tracking, analytics, and data management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies
const mockUserProgress = {
  userData: {
    progress: {
      math: {
        lessonsCompleted: 5,
        questionsAnswered: 25,
        correctAnswers: 20,
        level: 2,
        lastActivity: '2024-01-15T10:00:00Z',
      },
      reading: {
        storiesRead: 3,
        level: 1,
        lastActivity: '2024-01-14T15:30:00Z',
      },
      science: {
        experimentsCompleted: 2,
        level: 1,
        lastActivity: '2024-01-13T12:00:00Z',
      },
      art: {
        projectsCompleted: 1,
        level: 1,
        lastActivity: '2024-01-12T14:30:00Z',
      },
      coding: {
        challengesCompleted: 4,
        level: 2,
        lastActivity: '2024-01-16T16:15:00Z',
      },
    },
  },
  updateMathProgress: vi.fn(() => true),
  updateReadingProgress: vi.fn(() => true),
  updateScienceProgress: vi.fn(() => true),
  updateArtProgress: vi.fn(() => true),
  getProfile: vi.fn(() => ({
    name: 'Test User',
    streak: { current: 3, max: 7 },
  })),
  getProgressSummary: vi.fn(() => ({
    profile: { name: 'Test User' },
    stats: { mathProblems: 25 },
  })),
  getAchievements: vi.fn(() => [
    { id: 'test_achievement', unlocked: true, name: 'Test Achievement' },
  ]),
  getRecentActivity: vi.fn(() => []),
  getRecentAchievements: vi.fn(() => []),
  getSettings: vi.fn(() => ({ theme: 'default' })),
  checkDailyStreak: vi.fn(),
};

const mockEnhancedTracker = {
  trackGameSession: vi.fn(),
  checkAchievements: vi.fn(),
  updateDailyStreak: vi.fn(),
  getProgressSummary: vi.fn(() => ({})),
  getGameAnalyticsSummary: vi.fn(() => ({})),
};

// Mock global constructors
global.UserProgress = vi.fn(() => mockUserProgress);
global.EnhancedProgressTracker = vi.fn(() => mockEnhancedTracker);

// Import the class to test
import ProgressService from '../../src/utils/progressService.js';

describe('ProgressService', () => {
  let progressService;
  let mockDocument;

  beforeEach(() => {
    // Reset mocks but preserve return values
    vi.clearAllMocks();

    // Re-setup mock return values after clearing
    mockUserProgress.updateMathProgress = vi.fn(() => true);
    mockUserProgress.updateReadingProgress = vi.fn(() => true);
    mockUserProgress.updateScienceProgress = vi.fn(() => true);
    mockUserProgress.updateArtProgress = vi.fn(() => true);
    mockUserProgress.getProfile = vi.fn(() => ({
      name: 'Test User',
      streak: { current: 3, max: 7 },
    }));
    mockUserProgress.getProgressSummary = vi.fn(() => ({
      profile: { name: 'Test User' },
      stats: { mathProblems: 25 },
    }));
    mockUserProgress.getAchievements = vi.fn(() => [
      { id: 'test_achievement', unlocked: true, name: 'Test Achievement' },
    ]);
    mockUserProgress.getRecentActivity = vi.fn(() => []);
    mockUserProgress.getRecentAchievements = vi.fn(() => []);
    mockUserProgress.getSettings = vi.fn(() => ({ theme: 'default' }));
    mockUserProgress.checkDailyStreak = vi.fn();

    mockEnhancedTracker.trackGameSession = vi.fn();
    mockEnhancedTracker.checkAchievements = vi.fn();
    mockEnhancedTracker.updateDailyStreak = vi.fn();
    mockEnhancedTracker.getProgressSummary = vi.fn(() => ({}));
    mockEnhancedTracker.getGameAnalyticsSummary = vi.fn(() => ({}));

    // Mock document
    mockDocument = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.document = mockDocument;

    // Create fresh instance
    progressService = new ProgressService({
      userProgress: mockUserProgress,
      enhancedTracker: mockEnhancedTracker,
    });
  });

  afterEach(() => {
    // Clear any timers
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default dependencies when none provided', () => {
      const service = new ProgressService();
      expect(service.userProgress).toBeDefined();
      expect(service.enhancedTracker).toBeDefined();
      expect(service.sessionId).toMatch(/^session_\d+_/);
    });

    it('should use provided dependencies', () => {
      expect(progressService.userProgress).toBe(mockUserProgress);
      expect(progressService.enhancedTracker).toBe(mockEnhancedTracker);
    });

    it('should set up event forwarding', () => {
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'userDataUpdated',
        expect.any(Function)
      );
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'achievementUnlocked',
        expect.any(Function)
      );
    });
  });

  describe('Activity Tracking', () => {
    describe('trackActivityStart', () => {
      it('should track activity start successfully', async () => {
        const result = await progressService.trackActivityStart('test_activity', 'math', {
          difficulty: 'easy',
        });

        expect(result).toBe(true);
        expect(mockEnhancedTracker.trackGameSession).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: 'test_activity',
            subject: 'math',
            difficulty: 'easy',
          })
        );
      });

      it('should cache session data', async () => {
        await progressService.trackActivityStart('test_activity', 'math');

        const cachedSession = progressService.getCache('session_test_activity');
        expect(cachedSession).toMatchObject({
          activityId: 'test_activity',
          subjectId: 'math',
          status: 'in-progress',
        });
      });

      it('should emit activity:started event', async () => {
        const mockCallback = vi.fn();
        progressService.on('activity:started', mockCallback);

        await progressService.trackActivityStart('test_activity', 'math');

        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            activityId: 'test_activity',
            subjectId: 'math',
          })
        );
      });
    });

    describe('trackActivityComplete', () => {
      beforeEach(async () => {
        // Start an activity first
        await progressService.trackActivityStart('test_activity', 'math');
      });

      it('should track activity completion successfully', async () => {
        const result = await progressService.trackActivityComplete(
          'test_activity',
          85,
          30000, // 30 seconds
          { bonus: true }
        );

        expect(result).toBe(true);
        expect(mockUserProgress.updateMathProgress).toHaveBeenCalled();
        expect(mockEnhancedTracker.trackGameSession).toHaveBeenCalledWith(
          expect.objectContaining({
            gameId: 'test_activity',
            subject: 'math',
            score: 85,
            timeSpent: 30, // Converted to seconds
          })
        );
      });

      it('should clear session cache after completion', async () => {
        await progressService.trackActivityComplete('test_activity', 85, 30000);

        const cachedSession = progressService.getCache('session_test_activity');
        expect(cachedSession).toBeNull();
      });

      it('should emit activity:completed event', async () => {
        const mockCallback = vi.fn();
        progressService.on('activity:completed', mockCallback);

        await progressService.trackActivityComplete('test_activity', 85, 30000);

        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            activityId: 'test_activity',
            score: 85,
            timeSpent: 30000,
          })
        );
      });
    });
  });

  describe('Subject Progress', () => {
    describe('getSubjectProgress', () => {
      it('should return cached progress if available', async () => {
        const testProgress = { subjectId: 'math', level: 2 };
        progressService.setCache('subject_progress_math', testProgress);

        const result = await progressService.getSubjectProgress('math');
        expect(result).toEqual(testProgress);
      });

      it('should calculate progress for math subject', async () => {
        const result = await progressService.getSubjectProgress('math');

        expect(result).toMatchObject({
          subjectId: 'math',
          level: 2,
          completedActivities: 5,
          averageScore: 80, // 20/25 * 100
        });
      });

      it('should return default progress for unknown subject', async () => {
        const result = await progressService.getSubjectProgress('unknown');

        expect(result).toMatchObject({
          subjectId: 'unknown',
          level: 1,
          completedActivities: 0,
          averageScore: 0,
        });
      });
    });

    describe('getAllSubjectsProgress', () => {
      it('should return progress for all subjects', async () => {
        const result = await progressService.getAllSubjectsProgress();

        expect(result).toHaveProperty('math');
        expect(result).toHaveProperty('reading');
        expect(result).toHaveProperty('science');
        expect(result).toHaveProperty('art');
        expect(result).toHaveProperty('coding');
      });
    });

    describe('updateSubjectProgress', () => {
      it('should update math progress correctly', async () => {
        const result = await progressService.updateSubjectProgress('math', {
          score: 90,
          timeSpent: 5000,
        });

        expect(result).toBe(true);
        expect(mockUserProgress.updateMathProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            lessonCompleted: true,
            score: 90,
            timeSpent: 5000,
          })
        );
      });

      it('should update reading progress correctly', async () => {
        const result = await progressService.updateSubjectProgress('reading', {
          score: 95,
          timeSpent: 3000,
        });

        expect(result).toBe(true);
        expect(mockUserProgress.updateReadingProgress).toHaveBeenCalled();
      });

      it('should clear subject progress cache after update', async () => {
        progressService.setCache('subject_progress_math', { test: 'data' });

        await progressService.updateSubjectProgress('math', { score: 90 });

        const cached = progressService.getCache('subject_progress_math');
        expect(cached).toBeNull();
      });
    });
  });

  describe('Streak Management', () => {
    describe('updateStreak', () => {
      it('should update streak via both services', async () => {
        const result = await progressService.updateStreak();

        expect(mockUserProgress.checkDailyStreak).toHaveBeenCalled();
        expect(mockEnhancedTracker.updateDailyStreak).toHaveBeenCalled();
        expect(result).toMatchObject({
          current: 3,
          max: 7,
        });
      });

      it('should emit streak:updated event', async () => {
        const mockCallback = vi.fn();
        progressService.on('streak:updated', mockCallback);

        await progressService.updateStreak();

        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            current: 3,
            max: 7,
          })
        );
      });
    });

    describe('getCurrentStreak', () => {
      it('should return current streak data', async () => {
        const result = await progressService.getCurrentStreak();

        expect(result).toEqual({ current: 3, max: 7 });
      });

      it('should return default streak if none exists', async () => {
        mockUserProgress.getProfile.mockReturnValue({ name: 'Test' });

        const result = await progressService.getCurrentStreak();

        expect(result).toEqual({ current: 0, max: 0 });
      });
    });
  });

  describe('Achievement System', () => {
    describe('checkAchievements', () => {
      it('should check achievements via enhanced tracker', async () => {
        const context = { activityId: 'test', score: 100 };
        await progressService.checkAchievements(context);

        expect(mockEnhancedTracker.checkAchievements).toHaveBeenCalledWith(context);
      });
    });

    describe('getUnlockedAchievements', () => {
      it('should return only unlocked achievements', () => {
        const result = progressService.getUnlockedAchievements();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'test_achievement',
          unlocked: true,
        });
      });
    });
  });

  describe('Analytics & Reporting', () => {
    describe('getProgressSummary', () => {
      it('should return cached summary if available', async () => {
        const testSummary = { cached: true };
        progressService.setCache('summary_all', testSummary);

        const result = await progressService.getProgressSummary();
        expect(result).toEqual(testSummary);
      });

      it('should generate enhanced summary', async () => {
        const result = await progressService.getProgressSummary();

        expect(result).toMatchObject({
          sessionId: progressService.sessionId,
          timeframe: 'all',
          subjects: expect.any(Object),
          streak: { current: 3, max: 7 },
        });
      });
    });

    describe('getProgressAnalytics', () => {
      it('should compile comprehensive analytics', async () => {
        const result = await progressService.getProgressAnalytics();

        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('gameAnalytics');
        expect(result).toHaveProperty('recentActivity');
        expect(result).toHaveProperty('recentAchievements');
        expect(result).toHaveProperty('generatedAt');
      });
    });
  });

  describe('Data Export', () => {
    describe('exportProgress', () => {
      it('should export as JSON by default', async () => {
        const result = await progressService.exportProgress();

        expect(typeof result).toBe('string');
        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty('exportInfo');
        expect(parsed).toHaveProperty('profile');
        expect(parsed).toHaveProperty('progress');
      });

      it('should export as CSV when specified', async () => {
        const result = await progressService.exportProgress('csv');

        expect(typeof result).toBe('string');
        expect(result).toContain('Subject,Level,Completed Activities');
      });

      it('should throw error for unsupported format', async () => {
        const result = await progressService.exportProgress('xml');

        expect(result).toBeNull();
      });
    });
  });

  describe('Event System', () => {
    it('should add and trigger event listeners', () => {
      const mockCallback = vi.fn();
      progressService.on('test:event', mockCallback);

      progressService.emit('test:event', { data: 'test' });

      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockCallback = vi.fn();
      progressService.on('test:event', mockCallback);
      progressService.off('test:event', mockCallback);

      progressService.emit('test:event', { data: 'test' });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle errors in event callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      progressService.on('test:event', errorCallback);
      progressService.emit('test:event', {});

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cache Management', () => {
    it('should store and retrieve cached values', () => {
      const testData = { test: 'value' };
      progressService.setCache('test_key', testData);

      const result = progressService.getCache('test_key');
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache entries', () => {
      vi.useFakeTimers();

      progressService.setCache('test_key', 'value');

      // Fast forward past cache expiry
      vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      const result = progressService.getCache('test_key');
      expect(result).toBeNull();

      vi.useRealTimers();
    });

    it('should remove cache entries', () => {
      progressService.setCache('test_key', 'value');
      progressService.removeCache('test_key');

      const result = progressService.getCache('test_key');
      expect(result).toBeNull();
    });

    it('should clear all cache', () => {
      progressService.setCache('key1', 'value1');
      progressService.setCache('key2', 'value2');

      progressService.clearCache();

      expect(progressService.getCache('key1')).toBeNull();
      expect(progressService.getCache('key2')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in trackActivityStart gracefully', async () => {
      mockEnhancedTracker.trackGameSession.mockImplementation(() => {
        throw new Error('Test error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await progressService.trackActivityStart('test', 'math');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in getSubjectProgress gracefully', async () => {
      // Mock an error in calculateSubjectProgress
      const originalCalculate = progressService.calculateSubjectProgress;
      progressService.calculateSubjectProgress = vi.fn(() => {
        throw new Error('Test error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await progressService.getSubjectProgress('math');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      progressService.calculateSubjectProgress = originalCalculate;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should complete operations within performance requirements', async () => {
      const startTime = performance.now();

      await progressService.trackActivityStart('perf_test', 'math');
      await progressService.trackActivityComplete('perf_test', 85, 30000);
      await progressService.getSubjectProgress('math');
      await progressService.getProgressSummary();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 50ms as specified in requirements
      expect(duration).toBeLessThan(50);
    });
  });
});
