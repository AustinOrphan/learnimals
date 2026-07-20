// Goal Tracker Component
// Allows users to set and track learning goals

import BaseComponent from '../components/BaseComponent.js';
import Modal from '../components/ui/Modal.js';
import FormComponent from '../components/forms/FormComponent.js';
import { getRepository } from '../config/storage.js';

class GoalTracker extends BaseComponent {
  constructor(options = {}) {
    super('goal-tracker', {
      // Goal types
      goalTypes: ['daily', 'weekly', 'monthly', 'custom'],

      // Default goals
      defaultGoals: {
        dailyXP: 50,
        weeklyActivities: 10,
        monthlyStreak: 20,
      },

      // Display options
      showProgress: true,
      showRecommendations: true,
      maxActiveGoals: 5,

      ...options,
    });

    this.progressData = options.progressData || {};
    this.user = options.user || {};
    this.repository = null;
    this.goals = [];
    this.activeGoals = [];
    this.completedGoals = [];
  }

  async init() {
    try {
      this.repository = await getRepository();
      await this.loadGoals();
      this.updateGoalProgress();
      return this;
    } catch (error) {
      console.error('Failed to initialize goal tracker:', error);
      throw error;
    }
  }

  async loadGoals() {
    try {
      // In a full implementation, goals would be stored in the repository
      // For now, we'll use localStorage with a fallback to default goals
      const storedGoals = localStorage.getItem(`learnimals_goals_${this.user.id}`);

      if (storedGoals) {
        this.goals = JSON.parse(storedGoals);
      } else {
        this.goals = this.createDefaultGoals();
        await this.saveGoals();
      }

      this.categorizeGoals();
    } catch (error) {
      console.error('Failed to load goals:', error);
      this.goals = this.createDefaultGoals();
    }
  }

  createDefaultGoals() {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return [
      {
        id: this.generateId(),
        title: 'Daily XP Goal',
        description: 'Earn 50 XP points today',
        type: 'daily',
        category: 'xp',
        target: 50,
        current: 0,
        unit: 'XP',
        startDate: now.toISOString(),
        endDate: this.getEndOfDay(now).toISOString(),
        isActive: true,
        isCompleted: false,
        priority: 'high',
        icon: '⭐',
      },
      {
        id: this.generateId(),
        title: 'Weekly Learning',
        description: 'Complete 10 activities this week',
        type: 'weekly',
        category: 'activities',
        target: 10,
        current: 0,
        unit: 'activities',
        startDate: now.toISOString(),
        endDate: endOfWeek.toISOString(),
        isActive: true,
        isCompleted: false,
        priority: 'medium',
        icon: '📚',
      },
      {
        id: this.generateId(),
        title: 'Learning Streak',
        description: 'Maintain a 7-day learning streak',
        type: 'custom',
        category: 'streak',
        target: 7,
        current: this.progressData.streakDays || 0,
        unit: 'days',
        startDate: now.toISOString(),
        endDate: endOfMonth.toISOString(),
        isActive: true,
        isCompleted: false,
        priority: 'high',
        icon: '🔥',
      },
    ];
  }

  categorizeGoals() {
    const now = new Date();

    this.activeGoals = this.goals.filter(
      goal => goal.isActive && !goal.isCompleted && new Date(goal.endDate) > now
    );

    this.completedGoals = this.goals.filter(goal => goal.isCompleted);

    // Check for expired goals
    this.goals.forEach(goal => {
      if (goal.isActive && !goal.isCompleted && new Date(goal.endDate) <= now) {
        goal.isActive = false;
        goal.isExpired = true;
      }
    });
  }

  updateGoalProgress() {
    this.goals.forEach(goal => {
      const newProgress = this.calculateGoalProgress(goal);

      if (newProgress !== goal.current) {
        goal.current = newProgress;

        // Check if goal is completed
        if (newProgress >= goal.target && !goal.isCompleted) {
          this.completeGoal(goal);
        }
      }
    });

    this.categorizeGoals();
    this.saveGoals();
  }

  calculateGoalProgress(goal) {
    const startDate = new Date(goal.startDate);

    switch (goal.category) {
      case 'xp':
        if (goal.type === 'daily') {
          // Calculate XP earned today
          return this.calculateDailyXP();
        } else if (goal.type === 'weekly') {
          return this.calculateWeeklyXP(startDate);
        } else if (goal.type === 'monthly') {
          return this.calculateMonthlyXP(startDate);
        }
        return this.progressData.totalXP || 0;

      case 'activities':
        if (goal.type === 'daily') {
          return this.calculateDailyActivities();
        } else if (goal.type === 'weekly') {
          return this.calculateWeeklyActivities(startDate);
        } else if (goal.type === 'monthly') {
          return this.calculateMonthlyActivities(startDate);
        }
        return this.getTotalActivities();

      case 'streak':
        return this.progressData.streakDays || 0;

      case 'time':
        if (goal.type === 'daily') {
          return this.calculateDailyTime();
        } else if (goal.type === 'weekly') {
          return this.calculateWeeklyTime(startDate);
        }
        return this.progressData.totalTimeSpent || 0;

      case 'subject':
        return this.progressData.subjects?.[goal.subject]?.level || 0;

      default:
        return goal.current || 0;
    }
  }

  // Progress calculation helpers
  calculateDailyXP() {
    // In a real implementation, this would track XP earned today
    // For now, we'll simulate based on overall progress
    return Math.min(this.progressData.totalXP || 0, 100);
  }

  calculateWeeklyXP(_startDate) {
    // Simulate weekly XP calculation
    const daysSinceStart = Math.floor((Date.now() - _startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(daysSinceStart * 25, this.progressData.totalXP || 0);
  }

  calculateMonthlyXP(_startDate) {
    return this.progressData.totalXP || 0;
  }

  calculateDailyActivities() {
    // Simulate daily activities calculation
    return Math.floor(Math.random() * 3) + 1;
  }

  calculateWeeklyActivities(startDate) {
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(daysSinceStart * 2, this.getTotalActivities());
  }

  calculateMonthlyActivities(_startDate) {
    return this.getTotalActivities();
  }

  getTotalActivities() {
    return Object.values(this.progressData.subjects || {}).reduce(
      (sum, subject) => sum + (subject.activitiesCompleted || 0),
      0
    );
  }

  calculateDailyTime() {
    // Simulate daily time calculation
    return Math.floor(Math.random() * 30) + 15;
  }

  calculateWeeklyTime(startDate) {
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(daysSinceStart * 20, this.progressData.totalTimeSpent || 0);
  }

  async completeGoal(goal) {
    goal.isCompleted = true;
    goal.completedAt = new Date().toISOString();
    goal.isActive = false;

    // Award bonus XP for completing goal
    const bonusXP = this.calculateGoalBonusXP(goal);
    if (bonusXP > 0) {
      this.awardBonusXP(bonusXP, goal);
    }

    // Show completion notification
    this.showGoalCompletionNotification(goal);

    // Dispatch completion event
    document.dispatchEvent(
      new CustomEvent('goalCompleted', {
        detail: { goal, bonusXP },
      })
    );

    await this.saveGoals();
  }

  calculateGoalBonusXP(goal) {
    const baseBonusMap = {
      daily: 25,
      weekly: 100,
      monthly: 300,
      custom: 150,
    };

    const priorityMultiplier = {
      low: 0.5,
      medium: 1,
      high: 1.5,
    };

    const baseBonus = baseBonusMap[goal.type] || 50;
    const multiplier = priorityMultiplier[goal.priority] || 1;

    return Math.floor(baseBonus * multiplier);
  }

  showGoalCompletionNotification(goal) {
    const notification = document.createElement('div');
    notification.className = 'goal-completion-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="goal-icon">${goal.icon}</div>
        <div class="goal-info">
          <h4>Goal Completed! 🎉</h4>
          <p><strong>${goal.title}</strong></p>
          <p class="goal-reward">Bonus XP awarded!</p>
        </div>
      </div>
      <button class="close-notification">&times;</button>
    `;

    // Style and position notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-card);
      border: 2px solid var(--success-color, #27ae60);
      border-radius: 8px;
      padding: 1rem;
      max-width: 300px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto-remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  awardBonusXP(amount, goal) {
    document.dispatchEvent(
      new CustomEvent('xpAwarded', {
        detail: { amount, source: 'goal_completion', goal },
      })
    );
  }

  generateHTML() {
    return `
      <div class="goal-tracker">
        <!-- Goals Header -->
        <div class="goals-header">
          <div class="goals-stats">
            <div class="stat-item">
              <span class="stat-number">${this.activeGoals.length}</span>
              <span class="stat-label">Active Goals</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.completedGoals.length}</span>
              <span class="stat-label">Completed</span>
            </div>
          </div>
          <button class="btn btn--primary btn--sm" id="add-goal-btn">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 1v6m0 0v6m0-6h6m-6 0H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Goal
          </button>
        </div>

        <!-- Active Goals -->
        <div class="active-goals">
          <h4>Current Goals</h4>
          ${
            this.activeGoals.length > 0
              ? `
            <div class="goals-list">
              ${this.activeGoals.map(goal => this.generateGoalCardHTML(goal)).join('')}
            </div>
          `
              : `
            <div class="no-goals">
              <p>No active goals yet!</p>
              <p>Set your first learning goal to get started.</p>
            </div>
          `
          }
        </div>

        <!-- Goal Recommendations -->
        ${
          this.options.showRecommendations
            ? `
          <div class="goal-recommendations">
            <h4>Recommended Goals</h4>
            <div class="recommendations-list">
              ${this.generateRecommendationsHTML()}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  generateGoalCardHTML(goal) {
    const progressPercentage = Math.min((goal.current / goal.target) * 100, 100);
    const timeRemaining = this.calculateTimeRemaining(goal);
    const isNearDeadline = timeRemaining.hours <= 24 && timeRemaining.hours > 0;

    return `
      <div class="goal-card ${goal.priority}" data-goal-id="${goal.id}">
        <div class="goal-header">
          <div class="goal-icon">${goal.icon}</div>
          <div class="goal-info">
            <h5 class="goal-title">${goal.title}</h5>
            <p class="goal-description">${goal.description}</p>
          </div>
          <div class="goal-priority ${goal.priority}">
            ${goal.priority}
          </div>
        </div>

        <div class="goal-progress">
          <div class="progress-stats">
            <span class="progress-current">${goal.current}</span>
            <span class="progress-separator">/</span>
            <span class="progress-target">${goal.target}</span>
            <span class="progress-unit">${goal.unit}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
          </div>
          <div class="progress-percentage">${Math.round(progressPercentage)}%</div>
        </div>

        <div class="goal-footer">
          <div class="goal-deadline ${isNearDeadline ? 'urgent' : ''}">
            ${timeRemaining.text}
          </div>
          <div class="goal-actions">
            <button class="btn btn--outline btn--sm edit-goal" data-goal-id="${goal.id}">
              Edit
            </button>
            <button class="btn btn--outline btn--sm delete-goal" data-goal-id="${goal.id}">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  generateRecommendationsHTML() {
    const recommendations = this.getGoalRecommendations();

    return recommendations
      .map(
        rec => `
      <div class="recommendation-card" data-recommendation="${rec.id}">
        <div class="rec-icon">${rec.icon}</div>
        <div class="rec-content">
          <h6>${rec.title}</h6>
          <p>${rec.description}</p>
          <span class="rec-difficulty">${rec.difficulty}</span>
        </div>
        <button class="btn btn--outline btn--sm add-recommended-goal" 
                data-recommendation="${rec.id}">
          Add Goal
        </button>
      </div>
    `
      )
      .join('');
  }

  getGoalRecommendations() {
    const recommendations = [];
    const totalActivities = this.getTotalActivities();
    const currentStreak = this.progressData.streakDays || 0;

    // Recommend based on current progress
    if (totalActivities < 5) {
      recommendations.push({
        id: 'first_milestone',
        title: 'First Milestone',
        description: 'Complete 5 learning activities',
        difficulty: 'Easy',
        icon: '🎯',
        type: 'custom',
        category: 'activities',
        target: 5,
        priority: 'medium',
      });
    }

    if (currentStreak < 3) {
      recommendations.push({
        id: 'streak_starter',
        title: 'Streak Starter',
        description: 'Build a 3-day learning streak',
        difficulty: 'Easy',
        icon: '🔥',
        type: 'custom',
        category: 'streak',
        target: 3,
        priority: 'high',
      });
    }

    // Subject-specific recommendations
    Object.entries(this.progressData.subjects || {}).forEach(([subject, data]) => {
      if ((data.level || 1) < 3) {
        recommendations.push({
          id: `${subject}_level_up`,
          title: `${this.capitalizeFirst(subject)} Progress`,
          description: `Reach level 3 in ${this.capitalizeFirst(subject)}`,
          difficulty: 'Medium',
          icon: this.getSubjectIcon(subject),
          type: 'custom',
          category: 'subject',
          subject: subject,
          target: 3,
          priority: 'medium',
        });
      }
    });

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  calculateTimeRemaining(goal) {
    const now = new Date();
    const endDate = new Date(goal.endDate);
    const diffMs = endDate - now;

    if (diffMs <= 0) {
      return { text: 'Expired', hours: 0 };
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return {
        text: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`,
        hours: diffDays * 24 + diffHours,
      };
    } else if (diffHours > 0) {
      return {
        text: `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`,
        hours: diffHours,
      };
    } else {
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        text: `${diffMins} minute${diffMins !== 1 ? 's' : ''} left`,
        hours: 0,
      };
    }
  }

  async attachEventListeners() {
    // Add goal button
    const addGoalBtn = this.element.querySelector('#add-goal-btn');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => this.showGoalSetter());
    }

    // Edit goal buttons
    const editButtons = this.element.querySelectorAll('.edit-goal');
    editButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const goalId = e.target.getAttribute('data-goal-id');
        this.editGoal(goalId);
      });
    });

    // Delete goal buttons
    const deleteButtons = this.element.querySelectorAll('.delete-goal');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const goalId = e.target.getAttribute('data-goal-id');
        this.deleteGoal(goalId);
      });
    });

    // Add recommended goal buttons
    const addRecButtons = this.element.querySelectorAll('.add-recommended-goal');
    addRecButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const recId = e.target.getAttribute('data-recommendation');
        this.addRecommendedGoal(recId);
      });
    });
  }

  showGoalSetter() {
    const form = new FormComponent({
      id: 'goal-setter-form',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Goal Title',
          placeholder: 'Enter your goal title',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Describe your goal...',
          rows: 3,
        },
        {
          name: 'type',
          type: 'select',
          label: 'Goal Type',
          options: [
            { value: 'daily', label: 'Daily Goal' },
            { value: 'weekly', label: 'Weekly Goal' },
            { value: 'monthly', label: 'Monthly Goal' },
            { value: 'custom', label: 'Custom Goal' },
          ],
          required: true,
        },
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          options: [
            { value: 'xp', label: 'XP Points' },
            { value: 'activities', label: 'Activities' },
            { value: 'time', label: 'Time Spent' },
            { value: 'streak', label: 'Learning Streak' },
            { value: 'subject', label: 'Subject Level' },
          ],
          required: true,
        },
        {
          name: 'target',
          type: 'number',
          label: 'Target Amount',
          placeholder: 'Enter target number',
          min: 1,
          required: true,
        },
        {
          name: 'priority',
          type: 'select',
          label: 'Priority',
          options: [
            { value: 'low', label: 'Low Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'high', label: 'High Priority' },
          ],
          value: 'medium',
        },
      ],
      submitButtonText: 'Create Goal',
      onSubmit: data => this.handleCreateGoal(data),
    });

    const modal = new Modal({
      title: 'Set New Goal',
      content: '',
      size: 'medium',
      showConfirmButton: false,
      showCancelButton: false,
    });

    const modalInstance = modal.create();
    modalInstance.open();

    // Render form in modal
    const modalContent = modalInstance.element.querySelector('.modal-content');
    form.render(modalContent);
  }

  async handleCreateGoal(data) {
    try {
      const goal = this.createGoalFromData(data);
      this.goals.push(goal);
      this.categorizeGoals();
      await this.saveGoals();

      // Re-render
      if (this.element) {
        const container = this.element.parentNode;
        this.render(container);
      }

      this.showSuccessMessage('Goal created successfully!');
    } catch (error) {
      console.error('Failed to create goal:', error);
      this.showErrorMessage('Failed to create goal. Please try again.');
    }
  }

  createGoalFromData(data) {
    const now = new Date();
    let endDate;

    switch (data.type) {
      case 'daily':
        endDate = this.getEndOfDay(now);
        break;
      case 'weekly':
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 30); // Default to 30 days
    }

    return {
      id: this.generateId(),
      title: data.title,
      description: data.description || '',
      type: data.type,
      category: data.category,
      target: parseInt(data.target),
      current: 0,
      unit: this.getUnitForCategory(data.category),
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      isCompleted: false,
      priority: data.priority || 'medium',
      icon: this.getIconForCategory(data.category),
    };
  }

  addRecommendedGoal(recId) {
    const recommendations = this.getGoalRecommendations();
    const rec = recommendations.find(r => r.id === recId);

    if (rec) {
      const goalData = {
        title: rec.title,
        description: rec.description,
        type: rec.type,
        category: rec.category,
        target: rec.target,
        priority: rec.priority,
        subject: rec.subject,
      };

      this.handleCreateGoal(goalData);
    }
  }

  async deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.goals = this.goals.filter(goal => goal.id !== goalId);
      this.categorizeGoals();
      await this.saveGoals();

      // Re-render
      if (this.element) {
        const container = this.element.parentNode;
        this.render(container);
      }
    }
  }

  // Render method for dashboard integration
  async renderCurrent(container, limit = 3) {
    const currentGoals = this.activeGoals.slice(0, limit);

    if (currentGoals.length === 0) {
      container.innerHTML = `
        <div class="no-current-goals">
          <p>No active goals</p>
          <button class="btn btn--primary btn--sm" id="set-first-goal">
            Set Your First Goal
          </button>
        </div>
      `;

      // Add event listener
      const setGoalBtn = container.querySelector('#set-first-goal');
      if (setGoalBtn) {
        setGoalBtn.addEventListener('click', () => this.showGoalSetter());
      }
      return;
    }

    container.innerHTML = currentGoals
      .map(goal => {
        const progressPercentage = Math.min((goal.current / goal.target) * 100, 100);

        return `
        <div class="current-goal-item">
          <div class="goal-header">
            <span class="goal-icon">${goal.icon}</span>
            <span class="goal-title">${goal.title}</span>
          </div>
          <div class="goal-progress-mini">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <span class="progress-text">${goal.current}/${goal.target}</span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // Utility methods
  async saveGoals() {
    try {
      localStorage.setItem(`learnimals_goals_${this.user.id}`, JSON.stringify(this.goals));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }

  async updateData(newProgressData) {
    this.progressData = newProgressData;
    this.updateGoalProgress();

    // Re-render if component is already rendered
    if (this.element) {
      const container = this.element.parentNode;
      this.render(container);
    }
  }

  getEndOfDay(date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  getUnitForCategory(category) {
    const units = {
      xp: 'XP',
      activities: 'activities',
      time: 'minutes',
      streak: 'days',
      subject: 'level',
    };
    return units[category] || 'points';
  }

  getIconForCategory(category) {
    const icons = {
      xp: '⭐',
      activities: '📚',
      time: '⏰',
      streak: '🔥',
      subject: '🎯',
    };
    return icons[category] || '🎯';
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

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Static factory method
  static async create(options = {}) {
    const tracker = new GoalTracker(options);
    await tracker.init();
    return tracker;
  }
}

export default GoalTracker;
