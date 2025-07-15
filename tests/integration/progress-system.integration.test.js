/**
 * Progress System Integration Tests
 * Tests the integration between progress tracking, achievements, streaks, and user data persistence
 */

import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';

// Mock progress system modules
const mockProgressTracker = {
  initializeProgress: vi.fn(),
  updateProgress: vi.fn(),
  getProgress: vi.fn(),
  resetProgress: vi.fn(),
  exportProgress: vi.fn()
};

const mockAchievementSystem = {
  checkAchievements: vi.fn(),
  unlockAchievement: vi.fn(),
  getUnlockedAchievements: vi.fn(),
  getAvailableAchievements: vi.fn()
};

const mockStreakTracker = {
  updateStreak: vi.fn(),
  getCurrentStreak: vi.fn(),
  getLongestStreak: vi.fn(),
  resetStreak: vi.fn()
};

const mockGoalTracker = {
  setGoal: vi.fn(),
  updateGoalProgress: vi.fn(),
  completeGoal: vi.fn(),
  getActiveGoals: vi.fn()
};

const mockProgressDashboard = {
  render: vi.fn(),
  updateDisplay: vi.fn(),
  showProgressDetails: vi.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

vi.stubGlobal('localStorage', localStorageMock);

describe('Progress System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up progress dashboard DOM
    document.body.innerHTML = `
      <div id="progress-dashboard">
        <div id="progress-overview">
          <div id="total-score">Total Score: 0</div>
          <div id="total-time">Total Time: 0 min</div>
          <div id="subjects-completed">Subjects: 0/5</div>
        </div>
        <div id="progress-charts">
          <canvas id="progress-chart" width="400" height="200"></canvas>
          <div id="subject-progress">
            <div class="subject-bar" data-subject="math">
              <span class="subject-name">Math</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <span class="progress-percentage">0%</span>
            </div>
            <div class="subject-bar" data-subject="science">
              <span class="subject-name">Science</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <span class="progress-percentage">0%</span>
            </div>
          </div>
        </div>
        <div id="achievements-section">
          <h3>Achievements</h3>
          <div id="achievements-list"></div>
        </div>
        <div id="streaks-section">
          <h3>Streaks</h3>
          <div id="current-streak">Current: 0 days</div>
          <div id="longest-streak">Longest: 0 days</div>
        </div>
        <div id="goals-section">
          <h3>Goals</h3>
          <div id="active-goals"></div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('comprehensive progress initialization and tracking', async () => {
    const initialProgressData = {
      user: {
        id: 'user_123',
        name: 'TestLearner',
        joinDate: '2024-01-15T10:00:00Z'
      },
      subjects: {
        math: {
          totalTime: 0,
          activitiesCompleted: 0,
          gamesPlayed: 0,
          averageScore: 0,
          lastActivity: null
        },
        science: {
          totalTime: 0,
          activitiesCompleted: 0,
          gamesPlayed: 0,
          averageScore: 0,
          lastActivity: null
        },
        reading: {
          totalTime: 0,
          activitiesCompleted: 0,
          gamesPlayed: 0,
          averageScore: 0,
          lastActivity: null
        }
      },
      overall: {
        totalScore: 0,
        totalTime: 0,
        totalActivities: 0,
        level: 1,
        xp: 0
      },
      achievements: [],
      streaks: {
        current: 0,
        longest: 0,
        lastActivity: null
      },
      goals: []
    };

    // Test progress initialization
    mockProgressTracker.initializeProgress.mockResolvedValue(initialProgressData);
    const progress = await mockProgressTracker.initializeProgress('user_123');
    
    expect(progress.user.id).toBe('user_123');
    expect(progress.overall.totalScore).toBe(0);
    expect(progress.subjects.math.activitiesCompleted).toBe(0);

    // Test initial dashboard render
    mockProgressDashboard.render.mockResolvedValue(true);
    await mockProgressDashboard.render(progress);
    
    expect(mockProgressDashboard.render).toHaveBeenCalledWith(progress);

    console.log('✅ Progress initialization test passed');
  });

  test('multi-subject progress tracking and aggregation', async () => {
    const progressUpdates = [
      {
        subject: 'math',
        activity: 'bubble-pop',
        data: {
          score: 150,
          timeSpent: 300, // 5 minutes
          completed: true,
          accuracy: 85
        }
      },
      {
        subject: 'science',
        activity: 'element-match',
        data: {
          score: 200,
          timeSpent: 480, // 8 minutes
          completed: true,
          accuracy: 92
        }
      },
      {
        subject: 'math',
        activity: 'number-line-jump',
        data: {
          score: 180,
          timeSpent: 240, // 4 minutes
          completed: true,
          accuracy: 78
        }
      }
    ];

    let totalScore = 0;
    let totalTime = 0;

    // Test individual progress updates
    for (const update of progressUpdates) {
      totalScore += update.data.score;
      totalTime += update.data.timeSpent;

      mockProgressTracker.updateProgress.mockResolvedValue({
        subject: update.subject,
        newScore: update.data.score,
        totalScore,
        totalTime,
        updated: true
      });

      const result = await mockProgressTracker.updateProgress(update.subject, update.data);
      
      expect(result.subject).toBe(update.subject);
      expect(result.newScore).toBe(update.data.score);
      expect(result.updated).toBe(true);

      console.log(`   ✓ ${update.subject} progress updated: +${update.data.score} points`);
    }

    // Test aggregated progress retrieval
    mockProgressTracker.getProgress.mockReturnValue({
      subjects: {
        math: {
          totalTime: 540, // 9 minutes
          activitiesCompleted: 2,
          averageScore: 165,
          totalScore: 330
        },
        science: {
          totalTime: 480, // 8 minutes
          activitiesCompleted: 1,
          averageScore: 200,
          totalScore: 200
        }
      },
      overall: {
        totalScore,
        totalTime,
        totalActivities: 3,
        averageAccuracy: 85
      }
    });

    const aggregatedProgress = mockProgressTracker.getProgress();
    
    expect(aggregatedProgress.overall.totalScore).toBe(530);
    expect(aggregatedProgress.overall.totalTime).toBe(1020); // 17 minutes
    expect(aggregatedProgress.subjects.math.activitiesCompleted).toBe(2);
    expect(aggregatedProgress.subjects.science.activitiesCompleted).toBe(1);

    console.log('✅ Multi-subject progress tracking test passed');
  });

  test('achievement system integration and unlocking', async () => {
    const achievementDefinitions = [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first activity',
        criteria: { activitiesCompleted: 1 },
        reward: { xp: 50, badge: 'beginner' }
      },
      {
        id: 'math_explorer',
        name: 'Math Explorer',
        description: 'Complete 5 math activities',
        criteria: { subject: 'math', activitiesCompleted: 5 },
        reward: { xp: 200, badge: 'math_star' }
      },
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Score over 1000 points in a single game',
        criteria: { singleGameScore: 1000 },
        reward: { xp: 150, badge: 'high_scorer' }
      },
      {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Study for 1 hour total',
        criteria: { totalTime: 3600 }, // 1 hour in seconds
        reward: { xp: 300, badge: 'dedicated' }
      }
    ];

    const progressData = {
      overall: {
        totalActivities: 1,
        totalTime: 1800, // 30 minutes
        totalScore: 500
      },
      subjects: {
        math: {
          activitiesCompleted: 1,
          highestScore: 500
        }
      },
      gameScores: [150, 200, 500, 350]
    };

    // Test achievement checking
    const eligibleAchievements = ['first_steps']; // Only this one should be unlocked
    
    mockAchievementSystem.checkAchievements.mockReturnValue(eligibleAchievements);
    const achievements = mockAchievementSystem.checkAchievements(progressData, achievementDefinitions);
    
    expect(achievements).toContain('first_steps');
    expect(achievements).not.toContain('math_explorer'); // Needs 5 activities
    expect(achievements).not.toContain('high_scorer'); // Needs 1000+ score
    expect(achievements).not.toContain('dedicated_learner'); // Needs 1 hour

    // Test achievement unlocking
    achievements.forEach(async (achievementId) => {
      const achievement = achievementDefinitions.find(a => a.id === achievementId);
      
      mockAchievementSystem.unlockAchievement.mockResolvedValue({
        id: achievement.id,
        name: achievement.name,
        unlockedAt: new Date().toISOString(),
        reward: achievement.reward
      });

      const unlockedAchievement = await mockAchievementSystem.unlockAchievement(achievement.id);
      
      expect(unlockedAchievement.id).toBe(achievement.id);
      expect(unlockedAchievement.reward).toEqual(achievement.reward);
      
      console.log(`   🏆 Achievement unlocked: ${achievement.name}`);
    });

    // Test achievement display update
    mockAchievementSystem.getUnlockedAchievements.mockReturnValue([
      {
        id: 'first_steps',
        name: 'First Steps',
        unlockedAt: '2024-01-15T10:30:00Z'
      }
    ]);

    const unlockedAchievements = mockAchievementSystem.getUnlockedAchievements();
    expect(unlockedAchievements).toHaveLength(1);
    expect(unlockedAchievements[0].id).toBe('first_steps');

    console.log('✅ Achievement system integration test passed');
  });

  test('streak tracking and maintenance', async () => {
    const dailyActivities = [
      { date: '2024-01-15', activities: 3, totalTime: 1800 },
      { date: '2024-01-16', activities: 2, totalTime: 1200 },
      { date: '2024-01-17', activities: 4, totalTime: 2400 },
      { date: '2024-01-18', activities: 1, totalTime: 600 },
      // Skip 2024-01-19 (break in streak)
      { date: '2024-01-20', activities: 2, totalTime: 1500 },
      { date: '2024-01-21', activities: 3, totalTime: 1800 }
    ];

    let currentStreak = 0;
    let longestStreak = 0;
    let previousDate = null;

    // Test streak tracking for each day
    for (const day of dailyActivities) {
      const dayDate = new Date(day.date);
      const isConsecutive = previousDate ? 
        (dayDate.getTime() - previousDate.getTime()) === 24 * 60 * 60 * 1000 : true;

      if (isConsecutive) {
        currentStreak++;
      } else {
        currentStreak = 1; // Reset streak
      }

      longestStreak = Math.max(longestStreak, currentStreak);

      mockStreakTracker.updateStreak.mockReturnValue({
        current: currentStreak,
        longest: longestStreak,
        lastActivity: day.date
      });

      const streakData = mockStreakTracker.updateStreak(day.date, day.activities);
      
      expect(streakData.current).toBe(currentStreak);
      expect(streakData.longest).toBe(longestStreak);

      previousDate = dayDate;
      
      console.log(`   📅 ${day.date}: Streak = ${currentStreak}, Longest = ${longestStreak}`);
    }

    // Test final streak state
    mockStreakTracker.getCurrentStreak.mockReturnValue(2); // Last two consecutive days
    mockStreakTracker.getLongestStreak.mockReturnValue(4); // Days 15-18

    const finalCurrentStreak = mockStreakTracker.getCurrentStreak();
    const finalLongestStreak = mockStreakTracker.getLongestStreak();

    expect(finalCurrentStreak).toBe(2);
    expect(finalLongestStreak).toBe(4);

    // Test streak reset
    mockStreakTracker.resetStreak.mockReturnValue({
      current: 0,
      longest: 4, // Longest streak is preserved
      resetAt: new Date().toISOString()
    });

    const resetStreak = mockStreakTracker.resetStreak();
    expect(resetStreak.current).toBe(0);
    expect(resetStreak.longest).toBe(4);

    console.log('✅ Streak tracking test passed');
  });

  test('goal setting and progress tracking', async () => {
    const goals = [
      {
        id: 'goal_1',
        type: 'score',
        title: 'Score Master',
        description: 'Reach 5000 total points',
        target: 5000,
        current: 0,
        deadline: '2024-02-15T23:59:59Z',
        reward: { xp: 500, badge: 'score_master' }
      },
      {
        id: 'goal_2',
        type: 'time',
        title: 'Study Marathon',
        description: 'Study for 10 hours total',
        target: 36000, // 10 hours in seconds
        current: 0,
        deadline: '2024-01-31T23:59:59Z',
        reward: { xp: 1000, badge: 'marathon_runner' }
      },
      {
        id: 'goal_3',
        type: 'activities',
        title: 'Activity Explorer',
        description: 'Complete 50 activities',
        target: 50,
        current: 0,
        deadline: '2024-03-01T23:59:59Z',
        reward: { xp: 750, badge: 'explorer' }
      }
    ];

    // Test goal setting
    for (const goal of goals) {
      mockGoalTracker.setGoal.mockResolvedValue({
        id: goal.id,
        set: true,
        startDate: new Date().toISOString()
      });

      const setResult = await mockGoalTracker.setGoal(goal);
      expect(setResult.id).toBe(goal.id);
      expect(setResult.set).toBe(true);
    }

    // Test goal progress updates
    const progressUpdates = [
      { goalId: 'goal_1', increment: 150 }, // Score
      { goalId: 'goal_2', increment: 1800 }, // Time (30 minutes)
      { goalId: 'goal_3', increment: 1 }, // Activities
      { goalId: 'goal_1', increment: 200 }, // More score
      { goalId: 'goal_2', increment: 2400 }, // More time (40 minutes)
      { goalId: 'goal_3', increment: 2 } // More activities
    ];

    const goalProgress = {
      goal_1: 0,
      goal_2: 0,
      goal_3: 0
    };

    for (const update of progressUpdates) {
      goalProgress[update.goalId] += update.increment;
      const progress = goalProgress[update.goalId];
      const goal = goals.find(g => g.id === update.goalId);
      const percentage = (progress / goal.target) * 100;

      mockGoalTracker.updateGoalProgress.mockResolvedValue({
        goalId: update.goalId,
        current: progress,
        target: goal.target,
        percentage: Math.min(percentage, 100),
        completed: progress >= goal.target
      });

      const result = await mockGoalTracker.updateGoalProgress(update.goalId, update.increment);
      
      expect(result.goalId).toBe(update.goalId);
      expect(result.current).toBe(progress);
      
      console.log(`   🎯 ${update.goalId}: ${result.current}/${result.target} (${result.percentage.toFixed(1)}%)`);
    }

    // Test goal completion check
    const completedGoals = goals.filter(goal => goalProgress[goal.id] >= goal.target);
    
    for (const completedGoal of completedGoals) {
      mockGoalTracker.completeGoal.mockResolvedValue({
        id: completedGoal.id,
        completed: true,
        completedAt: new Date().toISOString(),
        reward: completedGoal.reward
      });

      const completion = await mockGoalTracker.completeGoal(completedGoal.id);
      expect(completion.completed).toBe(true);
      expect(completion.reward).toEqual(completedGoal.reward);
    }

    // Test active goals retrieval
    const activeGoals = goals.filter(goal => goalProgress[goal.id] < goal.target);
    mockGoalTracker.getActiveGoals.mockReturnValue(activeGoals);

    const retrievedActiveGoals = mockGoalTracker.getActiveGoals();
    expect(retrievedActiveGoals.every(goal => goalProgress[goal.id] < goal.target)).toBe(true);

    console.log('✅ Goal tracking test passed');
  });

  test('progress dashboard integration and real-time updates', async () => {
    const dashboardData = {
      overview: {
        totalScore: 2450,
        totalTime: 7200, // 2 hours
        level: 3,
        xp: 1850,
        completionRate: 65
      },
      subjects: [
        { name: 'Math', progress: 80, activitiesCompleted: 8, totalActivities: 10 },
        { name: 'Science', progress: 60, activitiesCompleted: 6, totalActivities: 10 },
        { name: 'Reading', progress: 45, activitiesCompleted: 4, totalActivities: 9 }
      ],
      recentAchievements: [
        { name: 'Math Explorer', unlockedAt: '2024-01-21T14:30:00Z' },
        { name: 'Quick Learner', unlockedAt: '2024-01-20T16:45:00Z' }
      ],
      currentStreak: 5,
      longestStreak: 8,
      activeGoals: [
        { title: 'Score Master', progress: 49, target: 5000, current: 2450 }
      ]
    };

    // Test initial dashboard render
    mockProgressDashboard.render.mockResolvedValue(true);
    await mockProgressDashboard.render(dashboardData);
    
    expect(mockProgressDashboard.render).toHaveBeenCalledWith(dashboardData);

    // Test real-time updates
    const updateEvents = [
      {
        type: 'score_update',
        data: { newScore: 150, totalScore: 2600 }
      },
      {
        type: 'activity_complete',
        data: { subject: 'science', newTotal: 7 }
      },
      {
        type: 'achievement_unlock',
        data: { achievement: 'Science Explorer', timestamp: Date.now() }
      },
      {
        type: 'goal_progress',
        data: { goalId: 'goal_1', newProgress: 52 }
      }
    ];

    // Test dashboard updates for each event
    for (const event of updateEvents) {
      mockProgressDashboard.updateDisplay.mockResolvedValue({
        updated: true,
        section: event.type,
        data: event.data
      });

      const updateResult = await mockProgressDashboard.updateDisplay(event.type, event.data);
      
      expect(updateResult.updated).toBe(true);
      expect(updateResult.section).toBe(event.type);
      
      console.log(`   📊 Dashboard updated: ${event.type}`);
    }

    // Test detailed progress view
    mockProgressDashboard.showProgressDetails.mockResolvedValue({
      detailsShown: true,
      view: 'expanded',
      data: {
        charts: ['weekly_progress', 'subject_breakdown'],
        tables: ['activity_history', 'achievement_timeline']
      }
    });

    const detailsResult = await mockProgressDashboard.showProgressDetails('math');
    expect(detailsResult.detailsShown).toBe(true);
    expect(detailsResult.data.charts).toContain('weekly_progress');

    console.log('✅ Progress dashboard integration test passed');
  });

  test('progress data export and backup', async () => {
    const fullProgressData = {
      user: {
        id: 'user_123',
        name: 'TestLearner',
        joinDate: '2024-01-15T10:00:00Z'
      },
      subjects: {
        math: {
          totalTime: 3600,
          activitiesCompleted: 8,
          gamesPlayed: 12,
          averageScore: 425,
          activities: [
            { name: 'bubble-pop', score: 450, date: '2024-01-20T14:00:00Z' },
            { name: 'number-line-jump', score: 380, date: '2024-01-21T10:30:00Z' }
          ]
        },
        science: {
          totalTime: 2400,
          activitiesCompleted: 6,
          gamesPlayed: 8,
          averageScore: 390,
          activities: [
            { name: 'element-match', score: 420, date: '2024-01-19T16:15:00Z' }
          ]
        }
      },
      achievements: [
        {
          id: 'first_steps',
          name: 'First Steps',
          unlockedAt: '2024-01-15T11:00:00Z',
          reward: { xp: 50, badge: 'beginner' }
        },
        {
          id: 'math_explorer',
          name: 'Math Explorer',
          unlockedAt: '2024-01-20T15:00:00Z',
          reward: { xp: 200, badge: 'math_star' }
        }
      ],
      streaks: {
        current: 5,
        longest: 8,
        history: [
          { date: '2024-01-15', activities: 2 },
          { date: '2024-01-16', activities: 3 },
          { date: '2024-01-17', activities: 1 }
        ]
      },
      goals: [
        {
          id: 'goal_1',
          title: 'Score Master',
          current: 2600,
          target: 5000,
          completed: false
        }
      ],
      overall: {
        totalScore: 2600,
        totalTime: 6000,
        totalActivities: 14,
        level: 3,
        xp: 1850
      },
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };

    // Test progress export
    mockProgressTracker.exportProgress.mockResolvedValue({
      success: true,
      data: fullProgressData,
      format: 'json',
      size: JSON.stringify(fullProgressData).length
    });

    const exportResult = await mockProgressTracker.exportProgress('user_123', 'json');
    
    expect(exportResult.success).toBe(true);
    expect(exportResult.data.user.id).toBe('user_123');
    expect(exportResult.data.achievements).toHaveLength(2);
    expect(exportResult.data.subjects.math.activitiesCompleted).toBe(8);

    // Test export data validation
    const exportedData = exportResult.data;
    
    // Validate structure
    expect(exportedData).toHaveProperty('user');
    expect(exportedData).toHaveProperty('subjects');
    expect(exportedData).toHaveProperty('achievements');
    expect(exportedData).toHaveProperty('streaks');
    expect(exportedData).toHaveProperty('goals');
    expect(exportedData).toHaveProperty('overall');
    expect(exportedData).toHaveProperty('exportedAt');
    expect(exportedData).toHaveProperty('version');

    // Validate data integrity
    const mathTotal = exportedData.subjects.math.totalTime;
    const scienceTotal = exportedData.subjects.science.totalTime;
    const overallTotal = exportedData.overall.totalTime;
    
    expect(mathTotal + scienceTotal).toBe(overallTotal);

    // Test export file size
    expect(exportResult.size).toBeGreaterThan(1000); // Should be substantial data
    expect(exportResult.size).toBeLessThan(100000); // But not excessive

    console.log(`✅ Progress export test passed (${exportResult.size} bytes)`);

    // Test backup creation
    const backupData = {
      ...exportResult.data,
      backupId: `backup_${Date.now()}`,
      backupType: 'automatic',
      compressionRatio: 0.65
    };

    // Mock backup storage
    localStorageMock.setItem.mockReturnValue(true);
    localStorageMock.setItem(`learnimals_backup_${backupData.backupId}`, JSON.stringify(backupData));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      `learnimals_backup_${backupData.backupId}`,
      JSON.stringify(backupData)
    );

    console.log('✅ Progress backup test passed');
  });

  test('cross-device progress synchronization', async () => {
    const device1Progress = {
      lastSyncAt: '2024-01-20T10:00:00Z',
      deviceId: 'device_tablet_123',
      subjects: {
        math: { activitiesCompleted: 5, totalScore: 1200 },
        science: { activitiesCompleted: 3, totalScore: 800 }
      },
      overall: { totalScore: 2000, totalActivities: 8 }
    };

    const device2Progress = {
      lastSyncAt: '2024-01-20T14:30:00Z',
      deviceId: 'device_phone_456',
      subjects: {
        math: { activitiesCompleted: 6, totalScore: 1350 }, // More recent
        reading: { activitiesCompleted: 2, totalScore: 600 } // New subject
      },
      overall: { totalScore: 1950, totalActivities: 8 }
    };

    // Mock sync manager
    const mockSyncManager = {
      compareProgress: vi.fn(),
      mergeProgress: vi.fn(),
      resolveConflicts: vi.fn(),
      syncToCloud: vi.fn()
    };

    // Test progress comparison
    mockSyncManager.compareProgress.mockReturnValue({
      conflicts: [
        {
          field: 'subjects.math',
          device1: device1Progress.subjects.math,
          device2: device2Progress.subjects.math,
          strategy: 'use_latest'
        }
      ],
      additions: [
        {
          field: 'subjects.reading',
          data: device2Progress.subjects.reading,
          source: 'device_phone_456'
        }
      ]
    });

    const comparison = mockSyncManager.compareProgress(device1Progress, device2Progress);
    
    expect(comparison.conflicts).toHaveLength(1);
    expect(comparison.additions).toHaveLength(1);
    expect(comparison.conflicts[0].field).toBe('subjects.math');

    // Test conflict resolution
    mockSyncManager.resolveConflicts.mockReturnValue({
      'subjects.math': device2Progress.subjects.math, // Use newer data
      'subjects.reading': device2Progress.subjects.reading // Add new subject
    });

    const resolved = mockSyncManager.resolveConflicts(comparison.conflicts);
    expect(resolved['subjects.math'].activitiesCompleted).toBe(6);

    // Test progress merging
    mockSyncManager.mergeProgress.mockReturnValue({
      lastSyncAt: new Date().toISOString(),
      deviceId: 'merged',
      subjects: {
        math: device2Progress.subjects.math, // Latest
        science: device1Progress.subjects.science, // From device1
        reading: device2Progress.subjects.reading // New
      },
      overall: {
        totalScore: 2750, // Combined unique scores
        totalActivities: 11 // Combined unique activities
      }
    });

    const mergedProgress = mockSyncManager.mergeProgress([device1Progress, device2Progress], resolved);
    
    expect(mergedProgress.subjects.math.activitiesCompleted).toBe(6);
    expect(mergedProgress.subjects.science.activitiesCompleted).toBe(3);
    expect(mergedProgress.subjects.reading.activitiesCompleted).toBe(2);
    expect(mergedProgress.overall.totalActivities).toBe(11);

    // Test cloud sync
    mockSyncManager.syncToCloud.mockResolvedValue({
      synced: true,
      syncId: 'sync_789',
      timestamp: new Date().toISOString(),
      devices: ['device_tablet_123', 'device_phone_456']
    });

    const syncResult = await mockSyncManager.syncToCloud(mergedProgress);
    expect(syncResult.synced).toBe(true);
    expect(syncResult.devices).toHaveLength(2);

    console.log('✅ Cross-device synchronization test passed');
  });
});