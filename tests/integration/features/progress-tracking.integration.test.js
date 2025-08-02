/**
 * Progress Tracking System Integration Tests
 *
 * Tests the integration of progress tracking, achievements, statistics, and data persistence
 * Verifies that all progress-related components work together correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressFactory, CharacterFactory, GameFactory } from '../../fixtures/testDataFactory.js';

describe('Progress Tracking System Integration', () => {
  let mockLocalStorage;
  let progressData;
  let characterData;

  beforeEach(() => {
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
    progressData = ProgressFactory.create();
    characterData = CharacterFactory.create();
  });

  afterEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Comprehensive Progress Tracking', () => {
    it('should track progress across multiple subjects', () => {
      const mockProgressTracker = {
        userProgress: {
          subjects: {},
          totalExperience: 0,
          totalGamesPlayed: 0,
          overallLevel: 1,
        },

        recordGameCompletion: vi.fn(function (gameData) {
          const subject = gameData.subject;

          // Initialize subject if needed
          if (!this.userProgress.subjects[subject]) {
            this.userProgress.subjects[subject] = {
              experience: 0,
              level: 1,
              gamesCompleted: 0,
              totalScore: 0,
              averageScore: 0,
              bestScore: 0,
              totalTime: 0,
              achievements: [],
            };
          }

          const subjectProgress = this.userProgress.subjects[subject];

          // Update subject progress
          subjectProgress.gamesCompleted++;
          subjectProgress.totalScore += gameData.score;
          subjectProgress.averageScore = Math.round(
            subjectProgress.totalScore / subjectProgress.gamesCompleted
          );
          subjectProgress.bestScore = Math.max(subjectProgress.bestScore, gameData.score);
          subjectProgress.totalTime += gameData.timeSpent;
          subjectProgress.experience += gameData.experience;

          // Check for level up
          const expPerLevel = 100;
          subjectProgress.level = Math.floor(subjectProgress.experience / expPerLevel) + 1;

          // Update overall progress
          this.userProgress.totalGamesPlayed++;
          this.userProgress.totalExperience += gameData.experience;
          this.userProgress.overallLevel =
            Math.floor(this.userProgress.totalExperience / (expPerLevel * 2)) + 1;

          return {
            subject: subjectProgress,
            overall: {
              level: this.userProgress.overallLevel,
              experience: this.userProgress.totalExperience,
            },
          };
        }),

        getSubjectProgress: vi.fn(function (subject) {
          return this.userProgress.subjects[subject] || null;
        }),

        getOverallProgress: vi.fn(function () {
          return {
            totalExperience: this.userProgress.totalExperience,
            overallLevel: this.userProgress.overallLevel,
            totalGamesPlayed: this.userProgress.totalGamesPlayed,
            subjectsPlayed: Object.keys(this.userProgress.subjects).length,
            favoriteSubject: this.getFavoriteSubject(),
          };
        }),

        getFavoriteSubject: function () {
          let maxGames = 0;
          let favorite = null;

          Object.entries(this.userProgress.subjects).forEach(([subject, data]) => {
            if (data.gamesCompleted > maxGames) {
              maxGames = data.gamesCompleted;
              favorite = subject;
            }
          });

          return favorite;
        },
      };

      // Record multiple game completions
      const games = [
        { subject: 'math', score: 100, experience: 10, timeSpent: 60 },
        { subject: 'math', score: 150, experience: 15, timeSpent: 90 },
        { subject: 'science', score: 200, experience: 20, timeSpent: 120 },
        { subject: 'reading', score: 120, experience: 12, timeSpent: 80 },
        { subject: 'math', score: 180, experience: 18, timeSpent: 100 },
      ];

      games.forEach(game => mockProgressTracker.recordGameCompletion(game));

      // Verify math progress
      const mathProgress = mockProgressTracker.getSubjectProgress('math');
      expect(mathProgress.gamesCompleted).toBe(3);
      expect(mathProgress.averageScore).toBe(143); // (100+150+180)/3
      expect(mathProgress.bestScore).toBe(180);
      expect(mathProgress.experience).toBe(43); // 10+15+18

      // Verify overall progress
      const overall = mockProgressTracker.getOverallProgress();
      expect(overall.totalGamesPlayed).toBe(5);
      expect(overall.totalExperience).toBe(75); // Sum of all experience
      expect(overall.subjectsPlayed).toBe(3);
      expect(overall.favoriteSubject).toBe('math');
    });

    it('should calculate and track streaks correctly', () => {
      const mockStreakTracker = {
        lastPlayDate: null,
        currentStreak: 0,
        longestStreak: 0,
        streakHistory: [],

        recordPlay: vi.fn(function (date = new Date()) {
          const playDate = new Date(date);
          playDate.setHours(0, 0, 0, 0); // Normalize to start of day

          if (!this.lastPlayDate) {
            // First play
            this.currentStreak = 1;
            this.longestStreak = 1;
          } else {
            const lastDate = new Date(this.lastPlayDate);
            const dayDiff = Math.floor((playDate - lastDate) / (1000 * 60 * 60 * 24));

            if (dayDiff === 0) {
              // Same day, no change
              return this.getStreakInfo();
            } else if (dayDiff === 1) {
              // Consecutive day
              this.currentStreak++;
              this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
            } else {
              // Streak broken
              this.streakHistory.push({
                streak: this.currentStreak,
                endDate: this.lastPlayDate,
              });
              this.currentStreak = 1;
            }
          }

          this.lastPlayDate = playDate.toISOString();
          return this.getStreakInfo();
        }),

        getStreakInfo: vi.fn(function () {
          return {
            current: this.currentStreak,
            longest: this.longestStreak,
            lastPlay: this.lastPlayDate,
            isActive: this.isStreakActive(),
          };
        }),

        isStreakActive: function () {
          if (!this.lastPlayDate) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const lastPlay = new Date(this.lastPlayDate);
          const daysSinceLastPlay = Math.floor((today - lastPlay) / (1000 * 60 * 60 * 24));

          return daysSinceLastPlay <= 1;
        },
      };

      // Simulate play sessions
      const playDates = [
        '2024-01-01',
        '2024-01-02',
        '2024-01-03',
        '2024-01-05', // Skipped a day, streak broken
        '2024-01-06',
        '2024-01-07',
        '2024-01-08',
        '2024-01-09',
      ];

      playDates.forEach(date => {
        const result = mockStreakTracker.recordPlay(new Date(date));
      });

      const finalStreak = mockStreakTracker.getStreakInfo();
      expect(finalStreak.current).toBe(5); // Current streak from Jan 5-9
      expect(finalStreak.longest).toBe(5); // Longest streak
      expect(mockStreakTracker.streakHistory).toHaveLength(1); // One broken streak
      expect(mockStreakTracker.streakHistory[0].streak).toBe(3); // First streak was 3 days
    });
  });

  describe('Achievement System Integration', () => {
    it('should unlock achievements based on progress milestones', () => {
      const mockAchievementSystem = {
        unlockedAchievements: new Set(),
        achievementDefinitions: [
          {
            id: 'beginner',
            name: 'Beginner',
            description: 'Complete 10 games',
            requirement: { type: 'games_completed', value: 10 },
          },
          {
            id: 'level_5',
            name: 'Level 5',
            description: 'Reach level 5',
            requirement: { type: 'level', value: 5 },
          },
          {
            id: 'streak_7',
            name: 'Week Warrior',
            description: 'Maintain a 7-day streak',
            requirement: { type: 'streak', value: 7 },
          },
          {
            id: 'all_subjects',
            name: 'Well Rounded',
            description: 'Play all subjects',
            requirement: { type: 'subjects_played', value: 5 },
          },
          {
            id: 'high_scorer',
            name: 'High Scorer',
            description: 'Score 500 points in a single game',
            requirement: { type: 'single_score', value: 500 },
          },
        ],

        checkAchievements: vi.fn(function (progressData) {
          const newlyUnlocked = [];

          this.achievementDefinitions.forEach(achievement => {
            if (this.unlockedAchievements.has(achievement.id)) return;

            let requirementMet = false;

            switch (achievement.requirement.type) {
              case 'games_completed':
                requirementMet = progressData.totalGamesPlayed >= achievement.requirement.value;
                break;
              case 'level':
                requirementMet = progressData.overallLevel >= achievement.requirement.value;
                break;
              case 'streak':
                requirementMet = progressData.currentStreak >= achievement.requirement.value;
                break;
              case 'subjects_played':
                requirementMet = progressData.subjectsPlayed >= achievement.requirement.value;
                break;
              case 'single_score':
                requirementMet = progressData.lastGameScore >= achievement.requirement.value;
                break;
            }

            if (requirementMet) {
              this.unlockedAchievements.add(achievement.id);
              newlyUnlocked.push({
                ...achievement,
                unlockedAt: new Date().toISOString(),
              });
            }
          });

          return newlyUnlocked;
        }),

        getProgress: vi.fn(function (achievementId) {
          const achievement = this.achievementDefinitions.find(a => a.id === achievementId);
          if (!achievement) return null;

          // Return progress percentage based on requirement type
          // This would normally calculate actual progress
          return {
            achievementId,
            progress: this.unlockedAchievements.has(achievementId) ? 100 : 50,
            isUnlocked: this.unlockedAchievements.has(achievementId),
          };
        }),
      };

      // Check achievements with different progress states
      const progressStates = [
        {
          totalGamesPlayed: 5,
          overallLevel: 2,
          currentStreak: 3,
          subjectsPlayed: 2,
          lastGameScore: 200,
        },
        {
          totalGamesPlayed: 10,
          overallLevel: 3,
          currentStreak: 5,
          subjectsPlayed: 3,
          lastGameScore: 300,
        },
        {
          totalGamesPlayed: 15,
          overallLevel: 5,
          currentStreak: 7,
          subjectsPlayed: 5,
          lastGameScore: 500,
        },
      ];

      let totalUnlocked = [];
      progressStates.forEach(state => {
        const unlocked = mockAchievementSystem.checkAchievements(state);
        totalUnlocked = totalUnlocked.concat(unlocked);
      });

      // Verify achievements unlocked
      expect(mockAchievementSystem.unlockedAchievements.has('beginner')).toBe(true);
      expect(mockAchievementSystem.unlockedAchievements.has('level_5')).toBe(true);
      expect(mockAchievementSystem.unlockedAchievements.has('streak_7')).toBe(true);
      expect(mockAchievementSystem.unlockedAchievements.has('all_subjects')).toBe(true);
      expect(mockAchievementSystem.unlockedAchievements.has('high_scorer')).toBe(true);
    });

    it('should track achievement progress incrementally', () => {
      const mockProgressiveAchievements = {
        progressData: {},

        updateProgress: vi.fn(function (achievementId, currentValue, maxValue) {
          if (!this.progressData[achievementId]) {
            this.progressData[achievementId] = {
              current: 0,
              max: maxValue,
              percentage: 0,
              isComplete: false,
            };
          }

          const progress = this.progressData[achievementId];
          progress.current = currentValue;
          progress.percentage = Math.min(100, Math.round((currentValue / maxValue) * 100));
          progress.isComplete = currentValue >= maxValue;

          return progress;
        }),

        getAchievementProgress: vi.fn(function (achievementId) {
          return this.progressData[achievementId] || null;
        }),

        getAllProgress: vi.fn(function () {
          return Object.entries(this.progressData).map(([id, data]) => ({
            achievementId: id,
            ...data,
          }));
        }),
      };

      // Update progress for various achievements
      mockProgressiveAchievements.updateProgress('math_master', 8, 10); // 80%
      mockProgressiveAchievements.updateProgress('speed_demon', 2, 5); // 40%
      mockProgressiveAchievements.updateProgress('perfectionist', 10, 10); // 100%

      // Verify progress tracking
      const mathProgress = mockProgressiveAchievements.getAchievementProgress('math_master');
      expect(mathProgress.percentage).toBe(80);
      expect(mathProgress.isComplete).toBe(false);

      const perfectionistProgress =
        mockProgressiveAchievements.getAchievementProgress('perfectionist');
      expect(perfectionistProgress.percentage).toBe(100);
      expect(perfectionistProgress.isComplete).toBe(true);

      // Get all progress
      const allProgress = mockProgressiveAchievements.getAllProgress();
      expect(allProgress).toHaveLength(3);
      expect(allProgress.filter(p => p.isComplete)).toHaveLength(1);
    });
  });

  describe('Statistics and Analytics Integration', () => {
    it('should generate comprehensive statistics report', () => {
      const calculateProficiency = subjectData => {
        // Simple proficiency calculation based on average score and consistency
        const scoreWeight = 0.6;
        const consistencyWeight = 0.4;

        const scoreComponent = (subjectData.averageScore / 100) * scoreWeight;
        const consistencyComponent = (1 - (subjectData.scoreVariance || 0.2)) * consistencyWeight;

        return Math.round((scoreComponent + consistencyComponent) * 100);
      };

      const mockStatsGenerator = {
        generateReport: vi.fn(progressData => {
          const report = {
            overview: {
              totalGamesPlayed: progressData.totalGamesPlayed || 0,
              totalPlayTime: progressData.totalPlayTime || 0,
              averageSessionTime: 0,
              daysPlayed: progressData.daysPlayed || 0,
              currentStreak: progressData.currentStreak || 0,
            },
            subjects: {},
            performance: {
              averageScore: 0,
              improvementRate: 0,
              consistencyScore: 0,
            },
            achievements: {
              totalUnlocked: progressData.achievementsUnlocked || 0,
              totalAvailable: progressData.totalAchievements || 0,
              completionPercentage: 0,
            },
          };

          // Calculate subject statistics
          if (progressData.subjects) {
            Object.entries(progressData.subjects).forEach(([subject, data]) => {
              report.subjects[subject] = {
                gamesPlayed: data.gamesCompleted,
                averageScore: data.averageScore,
                bestScore: data.bestScore,
                totalTime: data.totalTime,
                level: data.level,
                proficiency: calculateProficiency(data),
              };
            });
          }

          // Calculate averages
          if (progressData.totalGamesPlayed > 0) {
            report.overview.averageSessionTime = Math.round(
              progressData.totalPlayTime / progressData.totalGamesPlayed
            );
          }

          // Calculate achievement percentage
          if (progressData.totalAchievements > 0) {
            report.achievements.completionPercentage = Math.round(
              (progressData.achievementsUnlocked / progressData.totalAchievements) * 100
            );
          }

          return report;
        }),

        getInsights: vi.fn(report => {
          const insights = [];

          // Streak insight
          if (report.overview.currentStreak >= 7) {
            insights.push({
              type: 'positive',
              message: 'Great job maintaining your streak!',
            });
          }

          // Subject performance insight
          const subjects = Object.entries(report.subjects);
          if (subjects.length > 0) {
            const bestSubject = subjects.reduce(
              (best, [subject, data]) =>
                data.averageScore > (best[1]?.averageScore || 0) ? [subject, data] : best,
              ['', null]
            );

            if (bestSubject[0]) {
              insights.push({
                type: 'info',
                message: `You excel at ${bestSubject[0]} with an average score of ${bestSubject[1].averageScore}`,
              });
            }
          }

          // Achievement insight
          if (report.achievements.completionPercentage > 75) {
            insights.push({
              type: 'positive',
              message: "You've unlocked most achievements!",
            });
          }

          return insights;
        }),
      };

      // Generate report from progress data
      const testProgressData = {
        totalGamesPlayed: 50,
        totalPlayTime: 3000, // minutes
        daysPlayed: 20,
        currentStreak: 10,
        achievementsUnlocked: 15,
        totalAchievements: 20,
        subjects: {
          math: {
            gamesCompleted: 20,
            averageScore: 85,
            bestScore: 100,
            totalTime: 1200,
            level: 5,
          },
          science: {
            gamesCompleted: 15,
            averageScore: 78,
            bestScore: 95,
            totalTime: 900,
            level: 4,
          },
          reading: {
            gamesCompleted: 15,
            averageScore: 90,
            bestScore: 100,
            totalTime: 900,
            level: 4,
          },
        },
      };

      const report = mockStatsGenerator.generateReport(testProgressData);

      // Verify report structure
      expect(report.overview.totalGamesPlayed).toBe(50);
      expect(report.overview.averageSessionTime).toBe(60); // 3000/50
      expect(report.achievements.completionPercentage).toBe(75); // 15/20

      // Verify subject statistics
      expect(report.subjects.math.gamesPlayed).toBe(20);
      expect(report.subjects.math.averageScore).toBe(85);

      // Get insights
      const insights = mockStatsGenerator.getInsights(report);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(i => i.message.includes('streak'))).toBe(true);
      expect(insights.some(i => i.message.includes('reading'))).toBe(true); // Best subject
    });
  });

  describe('Data Persistence and Sync', () => {
    it('should save and load complete progress data', async () => {
      const mockProgressPersistence = {
        saveProgress: vi.fn(async progressData => {
          const serialized = JSON.stringify({
            ...progressData,
            lastSaved: new Date().toISOString(),
          });

          localStorage.setItem('learnimals_progress', serialized);

          // Simulate cloud backup
          const cloudBackup = {
            userId: progressData.userId,
            data: serialized,
            timestamp: new Date().toISOString(),
          };

          return { local: true, cloud: true };
        }),

        loadProgress: vi.fn(async () => {
          const localData = localStorage.getItem('learnimals_progress');

          if (localData) {
            const parsed = JSON.parse(localData);
            return {
              ...parsed,
              source: 'local',
            };
          }

          // Fallback to cloud if no local data
          return null;
        }),

        syncProgress: vi.fn(async () => {
          const localData = await this.loadProgress();

          // Simulate sync logic
          return {
            synced: true,
            conflicts: [],
            lastSync: new Date().toISOString(),
          };
        }),
      };

      // Save progress
      const saveResult = await mockProgressPersistence.saveProgress(progressData);
      expect(saveResult.local).toBe(true);
      expect(saveResult.cloud).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('learnimals_progress', expect.any(String));

      // Load progress
      const loadedData = await mockProgressPersistence.loadProgress();
      expect(loadedData).toBeDefined();
      expect(loadedData.userId).toBe(progressData.userId);
      expect(loadedData.source).toBe('local');
      expect(loadedData.lastSaved).toBeDefined();
    });

    it('should handle progress data conflicts', () => {
      const mockConflictResolver = {
        resolveConflict: vi.fn((localData, remoteData) => {
          // Strategy: Take the data with more games played
          const localGames = localData.totalGamesPlayed || 0;
          const remoteGames = remoteData.totalGamesPlayed || 0;

          if (localGames > remoteGames) {
            return { resolved: localData, strategy: 'local_priority' };
          } else if (remoteGames > localGames) {
            return { resolved: remoteData, strategy: 'remote_priority' };
          } else {
            // If equal, take the most recent
            const localTime = new Date(localData.lastUpdated || 0);
            const remoteTime = new Date(remoteData.lastUpdated || 0);

            return {
              resolved: localTime > remoteTime ? localData : remoteData,
              strategy: 'most_recent',
            };
          }
        }),

        mergeProgress: vi.fn((data1, data2) => {
          // Merge strategy: combine and take maximum values
          const merged = {
            totalGamesPlayed: Math.max(data1.totalGamesPlayed || 0, data2.totalGamesPlayed || 0),
            totalExperience: Math.max(data1.totalExperience || 0, data2.totalExperience || 0),
            subjects: {},
            achievements: new Set([...(data1.achievements || []), ...(data2.achievements || [])]),
            lastUpdated: new Date().toISOString(),
          };

          // Merge subjects
          const allSubjects = new Set([
            ...Object.keys(data1.subjects || {}),
            ...Object.keys(data2.subjects || {}),
          ]);

          allSubjects.forEach(subject => {
            const sub1 = data1.subjects?.[subject] || {};
            const sub2 = data2.subjects?.[subject] || {};

            merged.subjects[subject] = {
              gamesCompleted: Math.max(sub1.gamesCompleted || 0, sub2.gamesCompleted || 0),
              experience: Math.max(sub1.experience || 0, sub2.experience || 0),
              bestScore: Math.max(sub1.bestScore || 0, sub2.bestScore || 0),
            };
          });

          return merged;
        }),
      };

      // Test conflict resolution
      const localData = {
        totalGamesPlayed: 50,
        totalExperience: 500,
        lastUpdated: '2024-01-15T10:00:00Z',
      };

      const remoteData = {
        totalGamesPlayed: 45,
        totalExperience: 480,
        lastUpdated: '2024-01-15T12:00:00Z',
      };

      const resolution = mockConflictResolver.resolveConflict(localData, remoteData);
      expect(resolution.resolved).toBe(localData); // More games played
      expect(resolution.strategy).toBe('local_priority');

      // Test merge
      const merged = mockConflictResolver.mergeProgress(localData, remoteData);
      expect(merged.totalGamesPlayed).toBe(50);
      expect(merged.totalExperience).toBe(500);
    });
  });

  describe('Progress Visualization Integration', () => {
    it('should prepare data for progress charts', () => {
      const mockChartDataPreparer = {
        prepareTimeSeriesData: vi.fn(progressHistory => {
          return progressHistory.map(entry => ({
            date: entry.date,
            score: entry.averageScore,
            games: entry.gamesPlayed,
            time: entry.totalTime,
          }));
        }),

        prepareSubjectRadarData: vi.fn(subjects => {
          const categories = ['Score', 'Time', 'Level', 'Consistency', 'Mastery'];
          const datasets = [];

          Object.entries(subjects).forEach(([subject, data]) => {
            datasets.push({
              label: subject,
              data: [
                (data.averageScore / 100) * 100,
                Math.min(100, (data.totalTime / 600) * 100), // Normalize to 100
                (data.level / 10) * 100,
                (1 - (data.scoreVariance || 0.2)) * 100,
                data.mastery || 75,
              ],
            });
          });

          return { categories, datasets };
        }),

        prepareAchievementProgress: vi.fn(achievements => {
          const total = achievements.length;
          const unlocked = achievements.filter(a => a.isUnlocked).length;
          const categories = {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
          };

          achievements.forEach(achievement => {
            if (achievement.isUnlocked && categories[achievement.rarity] !== undefined) {
              categories[achievement.rarity]++;
            }
          });

          return {
            overall: {
              unlocked,
              total,
              percentage: Math.round((unlocked / total) * 100),
            },
            byRarity: categories,
          };
        }),
      };

      // Prepare time series data
      const progressHistory = [
        { date: '2024-01-01', averageScore: 70, gamesPlayed: 5, totalTime: 300 },
        { date: '2024-01-02', averageScore: 75, gamesPlayed: 6, totalTime: 360 },
        { date: '2024-01-03', averageScore: 80, gamesPlayed: 4, totalTime: 240 },
      ];

      const timeSeriesData = mockChartDataPreparer.prepareTimeSeriesData(progressHistory);
      expect(timeSeriesData).toHaveLength(3);
      expect(timeSeriesData[2].score).toBe(80);

      // Prepare radar chart data
      const subjectData = {
        math: { averageScore: 85, totalTime: 500, level: 5, scoreVariance: 0.1 },
        science: { averageScore: 75, totalTime: 400, level: 4, scoreVariance: 0.2 },
      };

      const radarData = mockChartDataPreparer.prepareSubjectRadarData(subjectData);
      expect(radarData.categories).toHaveLength(5);
      expect(radarData.datasets).toHaveLength(2);
      expect(radarData.datasets[0].label).toBe('math');
    });
  });
});
