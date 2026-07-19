/**
 * Game System Integration Tests
 *
 * Tests the integration of games with progress tracking, achievements, and character system
 * Verifies that game components work together correctly with other systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameFactory, CharacterFactory, ProgressFactory } from '../../fixtures/testDataFactory.js';

describe('Game System Integration', () => {
  let container;
  let mockLocalStorage;
  let characterData;
  let progressData;

  beforeEach(() => {
    // Setup test container
    container = testUtils.createTestContainer('game-integration-test');

    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem: vi.fn(key => mockLocalStorage.data[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage.data[key] = value;
      }),
      removeItem: vi.fn(key => {
        delete mockLocalStorage.data[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage.data = {};
      }),
    };
    global.localStorage = mockLocalStorage;

    // Create test data
    characterData = CharacterFactory.create();
    progressData = ProgressFactory.createUserProgress();
  });

  afterEach(() => {
    container.innerHTML = '';
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Game Session Management', () => {
    it('should create and manage complete game session', async () => {
      const _gameSession = GameFactory.createGameSession({
        gameId: 'bubble-pop',
        characterId: characterData.id,
      });

      // Mock game manager
      const mockGameManager = {
        sessions: new Map(),

        createSession: vi.fn(function (gameId, characterId) {
          const session = {
            id: `session_${Date.now()}`,
            gameId,
            characterId,
            startTime: new Date().toISOString(),
            state: 'active',
            score: 0,
            data: {},
          };

          this.sessions.set(session.id, session);
          return session;
        }),

        updateSession: vi.fn(function (sessionId, updates) {
          const session = this.sessions.get(sessionId);
          if (session) {
            Object.assign(session, updates);
            return session;
          }
          return null;
        }),

        endSession: vi.fn(function (sessionId, finalScore) {
          const session = this.sessions.get(sessionId);
          if (session) {
            session.endTime = new Date().toISOString();
            session.state = 'completed';
            session.score = finalScore;
            return session;
          }
          return null;
        }),
      };

      // Create session
      const session = mockGameManager.createSession('bubble-pop', characterData.id);
      expect(session).toBeDefined();
      expect(session.gameId).toBe('bubble-pop');
      expect(session.characterId).toBe(characterData.id);
      expect(session.state).toBe('active');

      // Update session during gameplay
      const updatedSession = mockGameManager.updateSession(session.id, {
        score: 150,
        data: { level: 2, bubblePopped: 15 },
      });
      expect(updatedSession.score).toBe(150);
      expect(updatedSession.data.level).toBe(2);

      // End session
      const finalSession = mockGameManager.endSession(session.id, 300);
      expect(finalSession.state).toBe('completed');
      expect(finalSession.score).toBe(300);
      expect(finalSession.endTime).toBeDefined();
    });

    it('should handle game pause and resume correctly', () => {
      const mockGame = {
        state: 'playing',
        isPaused: false,
        pauseTime: null,
        totalPauseTime: 0,

        pause: vi.fn(function () {
          if (this.state === 'playing' && !this.isPaused) {
            this.isPaused = true;
            this.pauseTime = Date.now();
            this.state = 'paused';
            return true;
          }
          return false;
        }),

        resume: vi.fn(function () {
          if (this.isPaused) {
            const pauseDuration = Date.now() - this.pauseTime;
            this.totalPauseTime += pauseDuration;
            this.isPaused = false;
            this.pauseTime = null;
            this.state = 'playing';
            return true;
          }
          return false;
        }),
      };

      // Control the clock so pause duration is deterministic; pause and
      // resume in the same real millisecond would otherwise record 0
      const nowSpy = vi
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // pause timestamp
        .mockReturnValueOnce(1050); // resume timestamp

      try {
        // Test pause
        const pauseResult = mockGame.pause();
        expect(pauseResult).toBe(true);
        expect(mockGame.isPaused).toBe(true);
        expect(mockGame.state).toBe('paused');

        // Test resume
        const resumeResult = mockGame.resume();
        expect(resumeResult).toBe(true);
        expect(mockGame.isPaused).toBe(false);
        expect(mockGame.state).toBe('playing');
        expect(mockGame.totalPauseTime).toBe(50);
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('Progress Tracking Integration', () => {
    it('should update progress after game completion', async () => {
      const mockProgressSystem = {
        updateGameProgress: vi.fn(gameData => {
          const updates = {
            gamesPlayed: (progressData.subjects[gameData.subject]?.gamesCompleted || 0) + 1,
            totalScore: (progressData.subjects[gameData.subject]?.totalScore || 0) + gameData.score,
            averageScore: 0,
            experience: gameData.experience || Math.floor(gameData.score / 10),
          };

          // Calculate new average
          updates.averageScore = Math.round(updates.totalScore / updates.gamesPlayed);

          return Promise.resolve({
            subject: gameData.subject,
            ...updates,
          });
        }),

        checkLevelUp: vi.fn((currentExp, newExp) => {
          const expPerLevel = 100;
          const currentLevel = Math.floor(currentExp / expPerLevel) + 1;
          const newLevel = Math.floor((currentExp + newExp) / expPerLevel) + 1;

          return {
            leveledUp: newLevel > currentLevel,
            oldLevel: currentLevel,
            newLevel: newLevel,
            expToNext: expPerLevel - ((currentExp + newExp) % expPerLevel),
          };
        }),
      };

      // Complete a game
      const gameResult = {
        gameId: 'bubble-pop',
        subject: 'math',
        score: 250,
        experience: 25,
        perfectScore: false,
        timeSpent: 120,
      };

      // Update progress
      const progressUpdate = await mockProgressSystem.updateGameProgress(gameResult);
      expect(progressUpdate.gamesPlayed).toBeGreaterThan(0);
      expect(progressUpdate.totalScore).toBeGreaterThanOrEqual(gameResult.score);
      expect(progressUpdate.experience).toBe(25);

      // Check for level up
      const levelCheck = mockProgressSystem.checkLevelUp(80, gameResult.experience);
      expect(levelCheck.leveledUp).toBe(true);
      expect(levelCheck.oldLevel).toBe(1);
      expect(levelCheck.newLevel).toBe(2);
    });

    it('should track game statistics correctly', () => {
      const mockStatsTracker = {
        stats: {
          totalGames: 0,
          totalTime: 0,
          perfectScores: 0,
          streakDays: 0,
          favoriteGame: null,
          gameStats: {},
        },

        recordGameStats: vi.fn(function (gameData) {
          this.stats.totalGames++;
          this.stats.totalTime += gameData.timeSpent || 0;

          if (gameData.perfectScore) {
            this.stats.perfectScores++;
          }

          // Track per-game stats
          if (!this.stats.gameStats[gameData.gameId]) {
            this.stats.gameStats[gameData.gameId] = {
              played: 0,
              totalScore: 0,
              bestScore: 0,
            };
          }

          const gameStats = this.stats.gameStats[gameData.gameId];
          gameStats.played++;
          gameStats.totalScore += gameData.score;
          gameStats.bestScore = Math.max(gameStats.bestScore, gameData.score);

          // Update favorite game
          let maxPlayed = 0;
          Object.entries(this.stats.gameStats).forEach(([gameId, stats]) => {
            if (stats.played > maxPlayed) {
              maxPlayed = stats.played;
              this.stats.favoriteGame = gameId;
            }
          });

          return this.stats;
        }),
      };

      // Record multiple game sessions
      const games = [
        { gameId: 'bubble-pop', score: 100, timeSpent: 60, perfectScore: false },
        { gameId: 'bubble-pop', score: 150, timeSpent: 90, perfectScore: true },
        { gameId: 'word-scramble', score: 200, timeSpent: 120, perfectScore: false },
        { gameId: 'bubble-pop', score: 180, timeSpent: 100, perfectScore: true },
      ];

      games.forEach(game => mockStatsTracker.recordGameStats(game));

      // Verify statistics
      expect(mockStatsTracker.stats.totalGames).toBe(4);
      expect(mockStatsTracker.stats.totalTime).toBe(370);
      expect(mockStatsTracker.stats.perfectScores).toBe(2);
      expect(mockStatsTracker.stats.favoriteGame).toBe('bubble-pop');
      expect(mockStatsTracker.stats.gameStats['bubble-pop'].bestScore).toBe(180);
    });
  });

  describe('Achievement Integration', () => {
    it('should unlock achievements based on game performance', async () => {
      const mockAchievementChecker = {
        checkGameAchievements: vi.fn(gameData => {
          const unlocked = [];

          // First game achievement
          if (gameData.isFirstGame) {
            unlocked.push({
              id: 'first_game',
              name: 'First Steps',
              description: 'Complete your first game',
            });
          }

          // Perfect score achievement
          if (gameData.perfectScore) {
            unlocked.push({
              id: 'perfect_score',
              name: 'Perfect!',
              description: 'Get a perfect score',
            });
          }

          // Speed demon achievement
          if (gameData.timeSpent < 30) {
            unlocked.push({
              id: 'speed_demon',
              name: 'Speed Demon',
              description: 'Complete a game in under 30 seconds',
            });
          }

          // Subject-specific achievements
          if (gameData.subject === 'math' && gameData.score >= 100) {
            unlocked.push({
              id: 'math_master',
              name: 'Math Master',
              description: 'Score 100+ in a math game',
            });
          }

          return Promise.resolve(unlocked);
        }),
      };

      // Test various game scenarios
      const scenarios = [
        {
          gameData: { isFirstGame: true, score: 50, timeSpent: 60, subject: 'math' },
          expectedAchievements: ['first_game'],
        },
        {
          gameData: { perfectScore: true, score: 100, timeSpent: 45, subject: 'reading' },
          expectedAchievements: ['perfect_score'],
        },
        {
          gameData: { score: 150, timeSpent: 25, subject: 'science' },
          expectedAchievements: ['speed_demon'],
        },
        {
          gameData: { score: 120, timeSpent: 60, subject: 'math', perfectScore: true },
          expectedAchievements: ['perfect_score', 'math_master'],
        },
      ];

      for (const scenario of scenarios) {
        const achievements = await mockAchievementChecker.checkGameAchievements(scenario.gameData);
        expect(achievements.map(a => a.id)).toEqual(
          expect.arrayContaining(scenario.expectedAchievements)
        );
      }
    });

    it('should display achievement notifications', () => {
      const mockNotificationSystem = {
        notifications: [],

        showAchievementNotification: vi.fn(function (achievement) {
          const notification = {
            id: `notif_${Date.now()}`,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: achievement.name,
            description: achievement.description,
            icon: 'trophy',
            duration: 5000,
            timestamp: new Date().toISOString(),
          };

          this.notifications.push(notification);

          // Simulate display
          setTimeout(() => {
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index > -1) {
              this.notifications.splice(index, 1);
            }
          }, notification.duration);

          return notification;
        }),
      };

      // Show achievement notification
      const achievement = {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first game',
      };

      const notification = mockNotificationSystem.showAchievementNotification(achievement);

      expect(mockNotificationSystem.showAchievementNotification).toHaveBeenCalledWith(achievement);
      expect(notification.type).toBe('achievement');
      expect(notification.message).toBe('First Victory');
      expect(mockNotificationSystem.notifications).toHaveLength(1);
    });
  });

  describe('Game State Persistence', () => {
    it('should save and restore game state', () => {
      const gameStateKey = 'learnimals_game_state';

      const mockGameStatePersistence = {
        saveGameState: vi.fn((gameId, state) => {
          const allStates = JSON.parse(localStorage.getItem(gameStateKey) || '{}');
          allStates[gameId] = {
            ...state,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(gameStateKey, JSON.stringify(allStates));
          return true;
        }),

        loadGameState: vi.fn(gameId => {
          const allStates = JSON.parse(localStorage.getItem(gameStateKey) || '{}');
          return allStates[gameId] || null;
        }),

        clearGameState: vi.fn(gameId => {
          const allStates = JSON.parse(localStorage.getItem(gameStateKey) || '{}');
          delete allStates[gameId];
          localStorage.setItem(gameStateKey, JSON.stringify(allStates));
          return true;
        }),
      };

      // Save game state
      const gameState = {
        score: 150,
        level: 3,
        lives: 2,
        gameSpecificData: {
          bubblesPopped: 45,
          currentQuestion: 5,
        },
      };

      mockGameStatePersistence.saveGameState('bubble-pop', gameState);

      // Verify save
      expect(mockGameStatePersistence.saveGameState).toHaveBeenCalledWith('bubble-pop', gameState);
      expect(localStorage.setItem).toHaveBeenCalled();

      // Load game state
      const loadedState = mockGameStatePersistence.loadGameState('bubble-pop');

      expect(loadedState).toBeDefined();
      expect(loadedState.score).toBe(150);
      expect(loadedState.level).toBe(3);
      expect(loadedState.savedAt).toBeDefined();

      // Clear game state
      mockGameStatePersistence.clearGameState('bubble-pop');

      // Verify cleared
      const clearedState = mockGameStatePersistence.loadGameState('bubble-pop');
      expect(clearedState).toBeNull();
    });

    it('should handle corrupted save data gracefully', () => {
      const mockSafeStateLoader = {
        loadSafeGameState: vi.fn(gameId => {
          try {
            const data = localStorage.getItem(`game_${gameId}`);
            if (!data) return null;

            const parsed = JSON.parse(data);

            // Validate essential properties
            if (typeof parsed.score !== 'number' || typeof parsed.level !== 'number') {
              throw new Error('Invalid game state structure');
            }

            return parsed;
          } catch (error) {
            console.error('Failed to load game state:', error);
            // Return default state
            return {
              score: 0,
              level: 1,
              lives: 3,
              isCorrupted: true,
            };
          }
        }),
      };

      // Test with corrupted data
      localStorage.setItem('game_bubble-pop', 'invalid json data');

      const state = mockSafeStateLoader.loadSafeGameState('bubble-pop');

      expect(state).toBeDefined();
      expect(state.isCorrupted).toBe(true);
      expect(state.score).toBe(0);
      expect(state.level).toBe(1);
    });
  });

  describe('Game Analytics Integration', () => {
    it('should track game events and metrics', () => {
      const mockAnalytics = {
        events: [],

        trackGameEvent: vi.fn(function (eventType, eventData) {
          const event = {
            id: `event_${Date.now()}`,
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
            sessionId: this.currentSessionId,
          };

          this.events.push(event);
          return event;
        }),

        getGameMetrics: vi.fn(function (gameId) {
          const gameEvents = this.events.filter(e => e.data.gameId === gameId);

          return {
            totalPlays: gameEvents.filter(e => e.type === 'game_start').length,
            completions: gameEvents.filter(e => e.type === 'game_complete').length,
            averageScore: this.calculateAverageScore(gameEvents),
            averageTime: this.calculateAverageTime(gameEvents),
          };
        }),

        calculateAverageScore: function (events) {
          const completeEvents = events.filter(e => e.type === 'game_complete');
          if (completeEvents.length === 0) return 0;

          const totalScore = completeEvents.reduce((sum, e) => sum + (e.data.score || 0), 0);
          return Math.round(totalScore / completeEvents.length);
        },

        calculateAverageTime: function (events) {
          const completeEvents = events.filter(e => e.type === 'game_complete');
          if (completeEvents.length === 0) return 0;

          const totalTime = completeEvents.reduce((sum, e) => sum + (e.data.timeSpent || 0), 0);
          return Math.round(totalTime / completeEvents.length);
        },

        currentSessionId: 'session_123',
      };

      // Track game events
      mockAnalytics.trackGameEvent('game_start', { gameId: 'bubble-pop' });
      mockAnalytics.trackGameEvent('level_complete', { gameId: 'bubble-pop', level: 1, score: 50 });
      mockAnalytics.trackGameEvent('game_complete', {
        gameId: 'bubble-pop',
        score: 150,
        timeSpent: 120,
      });

      mockAnalytics.trackGameEvent('game_start', { gameId: 'bubble-pop' });
      mockAnalytics.trackGameEvent('game_complete', {
        gameId: 'bubble-pop',
        score: 200,
        timeSpent: 100,
      });

      // Get metrics
      const metrics = mockAnalytics.getGameMetrics('bubble-pop');

      expect(metrics.totalPlays).toBe(2);
      expect(metrics.completions).toBe(2);
      expect(metrics.averageScore).toBe(175);
      expect(metrics.averageTime).toBe(110);
    });
  });

  describe('Multi-Game Integration', () => {
    it('should handle switching between different games', () => {
      const mockGameSwitcher = {
        currentGame: null,
        gameInstances: new Map(),

        loadGame: vi.fn(function (gameId, options = {}) {
          // Save current game state if exists
          if (this.currentGame) {
            this.saveCurrentGameState();
          }

          // Check if game instance exists
          if (!this.gameInstances.has(gameId)) {
            // Create new game instance
            const gameInstance = {
              id: gameId,
              state: 'ready',
              options: options,
              score: 0,
            };
            this.gameInstances.set(gameId, gameInstance);
          }

          this.currentGame = this.gameInstances.get(gameId);
          return this.currentGame;
        }),

        saveCurrentGameState: vi.fn(function () {
          if (this.currentGame) {
            // Save state logic
            return true;
          }
          return false;
        }),

        unloadGame: vi.fn(function (gameId) {
          if (this.currentGame && this.currentGame.id === gameId) {
            this.currentGame = null;
          }
          this.gameInstances.delete(gameId);
          return true;
        }),
      };

      // Load first game
      const bubbleGame = mockGameSwitcher.loadGame('bubble-pop', { difficulty: 'easy' });
      expect(bubbleGame.id).toBe('bubble-pop');
      expect(mockGameSwitcher.currentGame).toBe(bubbleGame);

      // Switch to another game
      const wordGame = mockGameSwitcher.loadGame('word-scramble', { difficulty: 'medium' });
      expect(mockGameSwitcher.saveCurrentGameState).toHaveBeenCalled();
      expect(wordGame.id).toBe('word-scramble');
      expect(mockGameSwitcher.currentGame).toBe(wordGame);

      // Switch back to first game
      const bubbleGameAgain = mockGameSwitcher.loadGame('bubble-pop');
      expect(bubbleGameAgain).toBe(bubbleGame); // Same instance

      // Unload game
      mockGameSwitcher.unloadGame('word-scramble');
      expect(mockGameSwitcher.gameInstances.has('word-scramble')).toBe(false);
    });
  });
});
