// Progress Dashboard Component
// Comprehensive progress tracking dashboard with charts, achievements, and analytics

import BaseComponent from '../../components/BaseComponent.js';
import Modal from '../../components/ui/Modal.js';
import ProgressCharts from './progressCharts.js';
import AchievementSystem from './achievementSystem.js';
import GoalTracker from './goalTracker.js';
import StreakTracker from './streakTracker.js';
import ProgressReports from './progressReports.js';
import authService from '../user/authService.js';
import { getRepository } from '../../config/storage.js';

class ProgressDashboard extends BaseComponent {
  constructor(options = {}) {
    super('progress-dashboard', {
      // Default configuration
      showCharts: true,
      showAchievements: true,
      showGoals: true,
      showStreaks: true,
      showReports: true,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      ...options,
    });

    this.authService = authService;
    this.repository = null;
    this.currentUser = null;
    this.progressData = null;
    this.refreshTimer = null;

    // Child components
    this.progressCharts = null;
    this.achievementSystem = null;
    this.goalTracker = null;
    this.streakTracker = null;
    this.progressReports = null;

    this.isInitialized = false;
  }

  async init() {
    try {
      // Initialize repository
      this.repository = await getRepository();

      // Get current user
      this.currentUser = this.authService.getCurrentUser();
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      // Load user progress data
      await this.loadProgressData();

      // Initialize child components
      await this.initializeComponents();

      this.isInitialized = true;
      return this;
    } catch (error) {
      console.error('Failed to initialize progress dashboard:', error);
      throw error;
    }
  }

  async loadProgressData() {
    try {
      // Load progress using repository
      const progressData = await this.repository.getUserProgress(this.currentUser.id);

      if (progressData) {
        this.progressData = progressData;
      } else {
        // Create new progress data if none exists
        this.progressData = this.createDefaultProgressData();
        await this.repository.updateUserProgress(this.currentUser.id, this.progressData);
      }

      return this.progressData;
    } catch (error) {
      console.error('Failed to load progress data:', error);
      throw error;
    }
  }

  createDefaultProgressData() {
    return {
      userId: this.currentUser.id,
      overallLevel: 1,
      totalXP: 0,
      totalTimeSpent: 0,
      streakDays: 0,
      lastActiveDate: new Date().toISOString(),
      subjects: {
        math: { level: 1, xp: 0, timeSpent: 0, activitiesCompleted: 0 },
        science: { level: 1, xp: 0, timeSpent: 0, activitiesCompleted: 0 },
        reading: { level: 1, xp: 0, timeSpent: 0, activitiesCompleted: 0 },
        art: { level: 1, xp: 0, timeSpent: 0, activitiesCompleted: 0 },
        coding: { level: 1, xp: 0, timeSpent: 0, activitiesCompleted: 0 },
      },
      achievements: [],
      statistics: {
        totalActivities: 0,
        completedActivities: 0,
        averageScore: 0,
      },
      goals: [],
      preferences: {
        difficulty: 'medium',
        timePerSession: 15,
      },
    };
  }

  async initializeComponents() {
    // Initialize charts component
    if (this.options.showCharts) {
      this.progressCharts = new ProgressCharts({
        progressData: this.progressData,
        user: this.currentUser,
      });
      await this.progressCharts.init();
    }

    // Initialize achievement system
    if (this.options.showAchievements) {
      this.achievementSystem = new AchievementSystem({
        progressData: this.progressData,
        user: this.currentUser,
      });
      await this.achievementSystem.init();
    }

    // Initialize goal tracker
    if (this.options.showGoals) {
      this.goalTracker = new GoalTracker({
        progressData: this.progressData,
        user: this.currentUser,
      });
      await this.goalTracker.init();
    }

    // Initialize streak tracker
    if (this.options.showStreaks) {
      this.streakTracker = new StreakTracker({
        progressData: this.progressData,
        user: this.currentUser,
      });
      await this.streakTracker.init();
    }

    // Initialize progress reports
    if (this.options.showReports) {
      this.progressReports = new ProgressReports({
        progressData: this.progressData,
        user: this.currentUser,
      });
      await this.progressReports.init();
    }
  }

  generateHTML() {
    if (!this.isInitialized) {
      return `
        <div class="progress-dashboard loading">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading your progress...</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="progress-dashboard">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <div class="header-content">
            <div class="user-overview">
              <img class="user-avatar" src="/public/images/avatars/${this.currentUser.profile.avatar || 'default'}.png" alt="User avatar">
              <div class="user-info">
                <h1>Welcome back, ${this.currentUser.profile.name}!</h1>
                <div class="level-info">
                  <span class="level-badge">Level ${this.progressData.overallLevel}</span>
                  <span class="xp-info">${this.progressData.totalXP} XP</span>
                </div>
              </div>
            </div>
            <div class="dashboard-actions">
              <button class="btn btn--outline btn--sm" id="refresh-dashboard">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 3V1l4 4-4 4V7c-2.2 0-4 1.8-4 4 0 .8.3 1.5.7 2.1L3.3 14C2.5 12.9 2 11.5 2 10c0-3.3 2.7-6 6-6z" fill="currentColor"/>
                </svg>
                Refresh
              </button>
              <button class="btn btn--outline btn--sm" id="view-reports">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M2 2h4v4H2V2zm6 0h4v4H8V2zM2 8h4v4H2V8zm6 0h4v4H8V8z" fill="currentColor"/>
                </svg>
                Reports
              </button>
              <button class="btn btn--primary btn--sm" id="set-goals">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="currentColor"/>
                </svg>
                Set Goals
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          ${this.generateQuickStatsHTML()}
        </div>

        <!-- Main Dashboard Content -->
        <div class="dashboard-content">
          <!-- Left Column -->
          <div class="dashboard-left">
            <!-- Progress Charts -->
            ${
              this.options.showCharts
                ? `
              <div class="dashboard-section">
                <h2>Progress Overview</h2>
                <div id="progress-charts-container"></div>
              </div>
            `
                : ''
            }

            <!-- Subject Progress -->
            <div class="dashboard-section">
              <h2>Subject Progress</h2>
              <div class="subjects-grid">
                ${this.generateSubjectProgressHTML()}
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="dashboard-right">
            <!-- Streak Tracker -->
            ${
              this.options.showStreaks
                ? `
              <div class="dashboard-section">
                <h2>Learning Streak</h2>
                <div id="streak-tracker-container"></div>
              </div>
            `
                : ''
            }

            <!-- Recent Achievements -->
            ${
              this.options.showAchievements
                ? `
              <div class="dashboard-section">
                <h2>Recent Achievements</h2>
                <div id="achievements-container"></div>
                <button class="btn btn--outline btn--sm" id="view-all-achievements">
                  View All Achievements
                </button>
              </div>
            `
                : ''
            }

            <!-- Current Goals -->
            ${
              this.options.showGoals
                ? `
              <div class="dashboard-section">
                <h2>Current Goals</h2>
                <div id="goals-container"></div>
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-section">
          <h2>Recent Activity</h2>
          <div class="activity-timeline">
            ${this.generateRecentActivityHTML()}
          </div>
        </div>
      </div>
    `;
  }

  generateQuickStatsHTML() {
    const stats = this.calculateQuickStats();

    return `
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <span class="stat-value">${stats.totalActivities}</span>
          <span class="stat-label">Activities Completed</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <span class="stat-value">${this.formatTime(this.progressData.totalTimeSpent)}</span>
          <span class="stat-label">Time Spent Learning</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <span class="stat-value">${this.progressData.streakDays}</span>
          <span class="stat-label">Day Streak</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <span class="stat-value">${stats.achievementsUnlocked}</span>
          <span class="stat-label">Achievements</span>
        </div>
      </div>
    `;
  }

  generateSubjectProgressHTML() {
    const subjects = ['math', 'science', 'reading', 'art', 'coding'];

    return subjects
      .map(subject => {
        const progress = this.progressData.subjects[subject] || {
          level: 1,
          xp: 0,
          activitiesCompleted: 0,
        };
        const nextLevelXP = this.calculateXPForLevel(progress.level + 1);
        const currentLevelXP = this.calculateXPForLevel(progress.level);
        const progressPercent = Math.min(
          ((progress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100,
          100
        );

        return `
        <div class="subject-card" data-subject="${subject}">
          <div class="subject-header">
            <div class="subject-icon">${this.getSubjectIcon(subject)}</div>
            <div class="subject-info">
              <h3>${this.capitalizeFirst(subject)}</h3>
              <span class="subject-level">Level ${progress.level}</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="subject-stats">
            <span>${progress.xp} XP</span>
            <span>${progress.activitiesCompleted} activities</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  generateRecentActivityHTML() {
    // This would typically come from a more detailed activity log
    const activities = [
      { type: 'math', action: 'Completed algebra lesson', time: '2 hours ago', xp: 25 },
      { type: 'reading', action: 'Read "The Magic Garden"', time: '1 day ago', xp: 15 },
      { type: 'science', action: 'Finished chemistry experiment', time: '2 days ago', xp: 30 },
      { type: 'achievement', action: 'Unlocked "Math Explorer" badge', time: '3 days ago', xp: 50 },
    ];

    return activities
      .map(
        activity => `
      <div class="activity-item">
        <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
        <div class="activity-content">
          <p class="activity-action">${activity.action}</p>
          <span class="activity-time">${activity.time}</span>
        </div>
        <div class="activity-xp">+${activity.xp} XP</div>
      </div>
    `
      )
      .join('');
  }

  async attachEventListeners() {
    // Refresh dashboard
    const refreshBtn = this.element.querySelector('#refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshDashboard());
    }

    // View reports
    const reportsBtn = this.element.querySelector('#view-reports');
    if (reportsBtn) {
      reportsBtn.addEventListener('click', () => this.showReports());
    }

    // Set goals
    const goalsBtn = this.element.querySelector('#set-goals');
    if (goalsBtn) {
      goalsBtn.addEventListener('click', () => this.showGoalSetter());
    }

    // View all achievements
    const achievementsBtn = this.element.querySelector('#view-all-achievements');
    if (achievementsBtn) {
      achievementsBtn.addEventListener('click', () => this.showAllAchievements());
    }

    // Subject cards
    const subjectCards = this.element.querySelectorAll('.subject-card');
    subjectCards.forEach(card => {
      card.addEventListener('click', e => {
        const subject = e.currentTarget.getAttribute('data-subject');
        this.showSubjectDetails(subject);
      });
    });

    // Render child components
    await this.renderChildComponents();

    // Set up auto-refresh if enabled
    if (this.options.autoRefresh && this.options.refreshInterval > 0) {
      this.startAutoRefresh();
    }
  }

  async renderChildComponents() {
    // Render progress charts
    if (this.progressCharts) {
      const chartsContainer = this.element.querySelector('#progress-charts-container');
      if (chartsContainer) {
        await this.progressCharts.render(chartsContainer);
      }
    }

    // Render streak tracker
    if (this.streakTracker) {
      const streakContainer = this.element.querySelector('#streak-tracker-container');
      if (streakContainer) {
        await this.streakTracker.render(streakContainer);
      }
    }

    // Render achievements
    if (this.achievementSystem) {
      const achievementsContainer = this.element.querySelector('#achievements-container');
      if (achievementsContainer) {
        await this.achievementSystem.renderRecent(achievementsContainer, 3);
      }
    }

    // Render goals
    if (this.goalTracker) {
      const goalsContainer = this.element.querySelector('#goals-container');
      if (goalsContainer) {
        await this.goalTracker.renderCurrent(goalsContainer);
      }
    }
  }

  async refreshDashboard() {
    try {
      // Show loading state
      this.showLoadingState();

      // Reload progress data
      await this.loadProgressData();

      // Refresh child components
      if (this.progressCharts) {
        await this.progressCharts.updateData(this.progressData);
      }
      if (this.streakTracker) {
        await this.streakTracker.updateData(this.progressData);
      }
      if (this.achievementSystem) {
        await this.achievementSystem.updateData(this.progressData);
      }
      if (this.goalTracker) {
        await this.goalTracker.updateData(this.progressData);
      }

      // Re-render dashboard
      this.render(this.element.parentNode);

      this.showSuccessMessage('Dashboard refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      this.showErrorMessage('Failed to refresh dashboard. Please try again.');
    }
  }

  showReports() {
    if (this.progressReports) {
      this.progressReports.showReportsModal();
    }
  }

  showGoalSetter() {
    if (this.goalTracker) {
      this.goalTracker.showGoalSetter();
    }
  }

  showAllAchievements() {
    if (this.achievementSystem) {
      this.achievementSystem.showAllAchievements();
    }
  }

  showSubjectDetails(subject) {
    // Show detailed view for specific subject
    const modal = new Modal({
      title: `${this.capitalizeFirst(subject)} Progress`,
      content: this.generateSubjectDetailHTML(subject),
      size: 'large',
    });
    modal.create().open();
  }

  generateSubjectDetailHTML(subject) {
    const progress = this.progressData.subjects[subject] || {};

    return `
      <div class="subject-detail">
        <div class="subject-overview">
          <div class="subject-icon-large">${this.getSubjectIcon(subject)}</div>
          <div class="subject-stats-detailed">
            <h3>Level ${progress.level}</h3>
            <p>${progress.xp} XP earned</p>
            <p>${progress.activitiesCompleted} activities completed</p>
            <p>${this.formatTime(progress.timeSpent || 0)} time spent</p>
          </div>
        </div>
        <div class="subject-progress-chart">
          <!-- Subject-specific progress chart would go here -->
        </div>
        <div class="subject-recent-activities">
          <h4>Recent Activities</h4>
          <!-- Recent activities for this subject -->
        </div>
      </div>
    `;
  }

  // Utility methods
  calculateQuickStats() {
    const totalActivities = Object.values(this.progressData.subjects || {}).reduce(
      (sum, subject) => sum + (subject.activitiesCompleted || 0),
      0
    );

    const achievementsUnlocked = (this.progressData.achievements || []).filter(
      achievement => achievement.unlocked
    ).length;

    return {
      totalActivities,
      achievementsUnlocked,
    };
  }

  calculateXPForLevel(level) {
    // XP required for each level (exponential growth)
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  getSubjectIcon(subject) {
    const icons = {
      math: '🔢',
      science: '🔬',
      reading: '📖',
      art: '🎨',
      coding: '💻',
    };
    return icons[subject] || '📚';
  }

  getActivityIcon(type) {
    const icons = {
      math: '🔢',
      science: '🔬',
      reading: '📖',
      art: '🎨',
      coding: '💻',
      achievement: '🏆',
      goal: '🎯',
    };
    return icons[type] || '📝';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshDashboard();
    }, this.options.refreshInterval);
  }

  destroy() {
    // Clear auto-refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Destroy child components
    if (this.progressCharts) {
      this.progressCharts.destroy();
    }
    if (this.achievementSystem) {
      this.achievementSystem.destroy();
    }
    if (this.goalTracker) {
      this.goalTracker.destroy();
    }
    if (this.streakTracker) {
      this.streakTracker.destroy();
    }
    if (this.progressReports) {
      this.progressReports.destroy();
    }

    // Call parent destroy
    super.destroy();
  }

  // Static method for easy instantiation
  static async create(options = {}) {
    const dashboard = new ProgressDashboard(options);
    await dashboard.init();
    return dashboard;
  }
}

export default ProgressDashboard;
