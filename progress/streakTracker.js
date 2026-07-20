// Streak Tracker Component
// Visual tracking of learning streaks and daily activity

import BaseComponent from '../components/BaseComponent.js';

class StreakTracker extends BaseComponent {
  constructor(options = {}) {
    super('streak-tracker', {
      // Display configuration
      showCalendar: true,
      showStats: true,
      showMotivation: true,
      daysToShow: 30,

      // Streak configuration
      streakGoal: 7,
      maxStreakDisplay: 100,

      // Visual options
      emojis: {
        fire: '🔥',
        calendar: '📅',
        target: '🎯',
        trophy: '🏆',
        celebration: '🎉',
      },

      ...options,
    });

    this.progressData = options.progressData || {};
    this.user = options.user || {};
    this.currentStreak = 0;
    this.longestStreak = 0;
    this.lastActiveDate = null;
    this.activityCalendar = new Map();
  }

  async init() {
    try {
      this.loadStreakData();
      this.generateActivityCalendar();
      return this;
    } catch (error) {
      console.error('Failed to initialize streak tracker:', error);
      throw error;
    }
  }

  loadStreakData() {
    // Extract streak information from progress data
    this.currentStreak = this.progressData.streakDays || 0;
    this.longestStreak = this.progressData.longestStreak || this.currentStreak;
    this.lastActiveDate = this.progressData.lastActiveDate;

    // Load activity history (in a full implementation, this would come from detailed logs)
    this.loadActivityHistory();
  }

  loadActivityHistory() {
    // Generate sample activity history for the last 30 days
    // In a real implementation, this would come from stored activity logs
    const today = new Date();

    for (let i = 0; i < this.options.daysToShow; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDateKey(date);

      // Simulate activity data based on current streak
      let hasActivity = false;
      let activityCount = 0;
      let timeSpent = 0;

      if (i < this.currentStreak) {
        hasActivity = true;
        activityCount = Math.floor(Math.random() * 5) + 1;
        timeSpent = Math.floor(Math.random() * 60) + 15;
      } else if (Math.random() > 0.3) {
        // Random past activity
        hasActivity = true;
        activityCount = Math.floor(Math.random() * 3) + 1;
        timeSpent = Math.floor(Math.random() * 45) + 10;
      }

      this.activityCalendar.set(dateKey, {
        date: new Date(date),
        hasActivity,
        activityCount,
        timeSpent,
        dateKey,
      });
    }
  }

  generateActivityCalendar() {
    // Sort calendar entries by date
    const sortedEntries = Array.from(this.activityCalendar.values()).sort(
      (a, b) => a.date - b.date
    );

    this.activityCalendar.clear();
    sortedEntries.forEach(entry => {
      this.activityCalendar.set(entry.dateKey, entry);
    });
  }

  generateHTML() {
    return `
      <div class="streak-tracker">
        ${this.options.showStats ? this.generateStatsHTML() : ''}
        ${this.options.showCalendar ? this.generateCalendarHTML() : ''}
        ${this.options.showMotivation ? this.generateMotivationHTML() : ''}
      </div>
    `;
  }

  generateStatsHTML() {
    const streakPercentage = Math.min((this.currentStreak / this.options.streakGoal) * 100, 100);
    const isOnStreak = this.currentStreak > 0;
    const nearGoal = this.currentStreak >= this.options.streakGoal * 0.8;

    return `
      <div class="streak-stats">
        <!-- Current Streak Display -->
        <div class="current-streak ${isOnStreak ? 'active' : ''}">
          <div class="streak-icon">${this.options.emojis.fire}</div>
          <div class="streak-info">
            <span class="streak-number">${this.currentStreak}</span>
            <span class="streak-label">Day${this.currentStreak !== 1 ? 's' : ''}</span>
          </div>
          <div class="streak-status">
            ${isOnStreak ? 'Current Streak' : 'No Active Streak'}
          </div>
        </div>

        <!-- Streak Progress Bar -->
        <div class="streak-progress">
          <div class="progress-header">
            <span>Goal: ${this.options.streakGoal} days</span>
            <span>${Math.min(this.currentStreak, this.options.streakGoal)}/${this.options.streakGoal}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${nearGoal ? 'near-goal' : ''}" 
                 style="width: ${streakPercentage}%"></div>
          </div>
        </div>

        <!-- Streak Statistics -->
        <div class="streak-statistics">
          <div class="stat-item">
            <span class="stat-icon">${this.options.emojis.trophy}</span>
            <div class="stat-content">
              <span class="stat-value">${this.longestStreak}</span>
              <span class="stat-label">Longest Streak</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">${this.options.emojis.calendar}</span>
            <div class="stat-content">
              <span class="stat-value">${this.getActiveDaysCount()}</span>
              <span class="stat-label">Active Days</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">${this.options.emojis.target}</span>
            <div class="stat-content">
              <span class="stat-value">${this.getConsistencyPercentage()}%</span>
              <span class="stat-label">Consistency</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  generateCalendarHTML() {
    const calendarEntries = Array.from(this.activityCalendar.values()).slice(
      -this.options.daysToShow
    );

    return `
      <div class="activity-calendar">
        <h4>Activity Calendar</h4>
        <div class="calendar-grid">
          ${calendarEntries.map(entry => this.generateCalendarDayHTML(entry)).join('')}
        </div>
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="calendar-day no-activity"></div>
            <span>No activity</span>
          </div>
          <div class="legend-item">
            <div class="calendar-day light-activity"></div>
            <span>Light activity</span>
          </div>
          <div class="legend-item">
            <div class="calendar-day moderate-activity"></div>
            <span>Moderate activity</span>
          </div>
          <div class="legend-item">
            <div class="calendar-day high-activity"></div>
            <span>High activity</span>
          </div>
        </div>
      </div>
    `;
  }

  generateCalendarDayHTML(entry) {
    const activityLevel = this.getActivityLevel(entry);
    const isToday = this.isToday(entry.date);
    const dayOfMonth = entry.date.getDate();

    return `
      <div class="calendar-day ${activityLevel} ${isToday ? 'today' : ''}" 
           data-date="${entry.dateKey}"
           title="${this.generateDayTooltip(entry)}">
        <span class="day-number">${dayOfMonth}</span>
        ${entry.hasActivity ? '<div class="activity-indicator"></div>' : ''}
      </div>
    `;
  }

  generateMotivationHTML() {
    const motivationMessage = this.getMotivationMessage();
    const nextMilestone = this.getNextMilestone();

    return `
      <div class="streak-motivation">
        <div class="motivation-message">
          <div class="motivation-icon">${motivationMessage.icon}</div>
          <div class="motivation-content">
            <p class="motivation-text">${motivationMessage.text}</p>
            ${
              nextMilestone
                ? `
              <p class="next-milestone">
                ${nextMilestone.daysToGo} more day${nextMilestone.daysToGo !== 1 ? 's' : ''} to reach ${nextMilestone.name}!
              </p>
            `
                : ''
            }
          </div>
        </div>
        
        ${
          this.currentStreak > 0
            ? `
          <div class="streak-actions">
            <button class="btn btn--primary btn--sm" id="continue-streak">
              Keep the streak going! ${this.options.emojis.fire}
            </button>
          </div>
        `
            : `
          <div class="streak-actions">
            <button class="btn btn--primary btn--sm" id="start-streak">
              Start your learning streak today!
            </button>
          </div>
        `
        }
      </div>
    `;
  }

  getActivityLevel(entry) {
    if (!entry.hasActivity) return 'no-activity';

    if (entry.timeSpent >= 45) return 'high-activity';
    if (entry.timeSpent >= 20) return 'moderate-activity';
    return 'light-activity';
  }

  getActiveDaysCount() {
    return Array.from(this.activityCalendar.values()).filter(entry => entry.hasActivity).length;
  }

  getConsistencyPercentage() {
    const totalDays = this.activityCalendar.size;
    const activeDays = this.getActiveDaysCount();
    return Math.round((activeDays / totalDays) * 100);
  }

  getMotivationMessage() {
    if (this.currentStreak === 0) {
      return {
        icon: '💪',
        text: 'Ready to start a new learning streak? Every expert was once a beginner!',
      };
    }

    if (this.currentStreak === 1) {
      return {
        icon: '🌱',
        text: 'Great start! One day down, keep building that learning habit!',
      };
    }

    if (this.currentStreak < 7) {
      return {
        icon: '🔥',
        text: `${this.currentStreak} days strong! You're building an amazing habit!`,
      };
    }

    if (this.currentStreak < 30) {
      return {
        icon: '⭐',
        text: `Incredible! ${this.currentStreak} days of consistent learning. You're on fire!`,
      };
    }

    return {
      icon: '🏆',
      text: `Outstanding! ${this.currentStreak} days streak - you're a true learning champion!`,
    };
  }

  getNextMilestone() {
    const milestones = [3, 7, 14, 30, 50, 100];

    for (const milestone of milestones) {
      if (this.currentStreak < milestone) {
        return {
          name: `${milestone}-day streak`,
          daysToGo: milestone - this.currentStreak,
        };
      }
    }

    return null; // Already past all milestones
  }

  generateDayTooltip(entry) {
    if (!entry.hasActivity) {
      return `${this.formatDate(entry.date)} - No activity`;
    }

    return `${this.formatDate(entry.date)} - ${entry.activityCount} activities, ${entry.timeSpent} minutes`;
  }

  async attachEventListeners() {
    // Calendar day hover effects
    const calendarDays = this.element.querySelectorAll('.calendar-day');
    calendarDays.forEach(day => {
      day.addEventListener('mouseenter', e => {
        const dateKey = e.target.getAttribute('data-date');
        this.showDayDetails(dateKey);
      });

      day.addEventListener('mouseleave', () => {
        this.hideDayDetails();
      });
    });

    // Action buttons
    const continueStreakBtn = this.element.querySelector('#continue-streak');
    if (continueStreakBtn) {
      continueStreakBtn.addEventListener('click', () => {
        this.handleContinueStreak();
      });
    }

    const startStreakBtn = this.element.querySelector('#start-streak');
    if (startStreakBtn) {
      startStreakBtn.addEventListener('click', () => {
        this.handleStartStreak();
      });
    }
  }

  showDayDetails(dateKey) {
    const entry = this.activityCalendar.get(dateKey);
    if (!entry) return;

    // Create or update day details tooltip
    let tooltip = document.querySelector('.day-details-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'day-details-tooltip';
      document.body.appendChild(tooltip);
    }

    tooltip.innerHTML = `
      <div class="tooltip-content">
        <h5>${this.formatDate(entry.date)}</h5>
        ${
          entry.hasActivity
            ? `
          <p>${entry.activityCount} activities completed</p>
          <p>${entry.timeSpent} minutes spent learning</p>
        `
            : `
          <p>No learning activity</p>
        `
        }
      </div>
    `;

    tooltip.style.display = 'block';
  }

  hideDayDetails() {
    const tooltip = document.querySelector('.day-details-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  handleContinueStreak() {
    // Navigate to learning activities
    window.location.href = '/pages/math.html';
  }

  handleStartStreak() {
    // Navigate to learning activities or show suggestions
    window.location.href = '/pages/subjects.html';
  }

  // Update streak data
  async updateData(newProgressData) {
    this.progressData = newProgressData;
    this.loadStreakData();
    this.generateActivityCalendar();

    // Re-render if component is already rendered
    if (this.element) {
      const container = this.element.parentNode;
      this.render(container);
    }
  }

  // Streak management methods
  recordActivity(timeSpent = 15, activityCount = 1) {
    const today = new Date();
    const todayKey = this.formatDateKey(today);

    // Update today's activity
    const todayEntry = this.activityCalendar.get(todayKey) || {
      date: today,
      hasActivity: false,
      activityCount: 0,
      timeSpent: 0,
      dateKey: todayKey,
    };

    todayEntry.hasActivity = true;
    todayEntry.activityCount += activityCount;
    todayEntry.timeSpent += timeSpent;

    this.activityCalendar.set(todayKey, todayEntry);

    // Update streak
    this.updateStreak();
  }

  updateStreak() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayKey = this.formatDateKey(today);
    const yesterdayKey = this.formatDateKey(yesterday);

    const todayActivity = this.activityCalendar.get(todayKey);
    const yesterdayActivity = this.activityCalendar.get(yesterdayKey);

    if (todayActivity?.hasActivity) {
      if (yesterdayActivity?.hasActivity || this.currentStreak === 0) {
        this.currentStreak++;
        if (this.currentStreak > this.longestStreak) {
          this.longestStreak = this.currentStreak;
        }
      }
    } else {
      // If no activity today and it's past a reasonable time, reset streak
      const currentHour = new Date().getHours();
      if (currentHour >= 22) {
        // After 10 PM
        this.currentStreak = 0;
      }
    }

    this.lastActiveDate = today.toISOString();
  }

  // Utility methods
  formatDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }

  isToday(date) {
    const today = new Date();
    return this.formatDateKey(date) === this.formatDateKey(today);
  }

  // Render method for dashboard integration
  async renderSimple(container) {
    // Simple version for dashboard sidebar
    container.innerHTML = `
      <div class="streak-display">
        <div class="streak-icon">${this.options.emojis.fire}</div>
        <div class="streak-info">
          <span class="streak-number">${this.currentStreak}</span>
          <span class="streak-label">day streak</span>
        </div>
      </div>
      <div class="streak-mini-calendar">
        ${Array.from(this.activityCalendar.values())
          .slice(-7)
          .map(
            entry => `
            <div class="mini-day ${this.getActivityLevel(entry)}"></div>
          `
          )
          .join('')}
      </div>
    `;
  }

  // Static factory method
  static async create(options = {}) {
    const tracker = new StreakTracker(options);
    await tracker.init();
    return tracker;
  }
}

export default StreakTracker;
