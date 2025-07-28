// Achievement System Component
// Manages achievements, badges, and rewards for user progress

import BaseComponent from '../../components/BaseComponent.js';
import Modal from '../../components/ui/Modal.js';
import { getRepository } from '../../config/storage.js';

class AchievementSystem extends BaseComponent {
  constructor(options = {}) {
    super('achievement-system', {
      // Achievement categories
      categories: ['learning', 'streak', 'milestone', 'special', 'game'],
      
      // Display options
      showProgress: true,
      showDescriptions: true,
      animateUnlock: true,
      
      // Notification settings
      showNotifications: true,
      notificationDuration: 3000,
      
      ...options
    });

    this.progressData = options.progressData || {};
    this.user = options.user || {};
    this.repository = null;
    this.achievements = [];
    this.unlockedAchievements = [];
    this.achievementDefinitions = this.getAchievementDefinitions();
  }

  async init() {
    try {
      this.repository = await getRepository();
      await this.loadAchievements();
      this.setupEventListeners();
      return this;
    } catch (error) {
      console.error('Failed to initialize achievement system:', error);
      throw error;
    }
  }

  async loadAchievements() {
    try {
      // Load user achievements from repository
      const userAchievements = await this.repository.getUserAchievements(this.user.id) || [];
      
      // Merge with definitions and calculate progress
      this.achievements = this.achievementDefinitions.map(definition => {
        const userAchievement = userAchievements.find(a => a.id === definition.id);
        
        return {
          ...definition,
          unlocked: userAchievement?.unlocked || false,
          progress: userAchievement?.progress || 0,
          unlockedAt: userAchievement?.unlockedAt || null,
          ...userAchievement
        };
      });

      // Update progress for all achievements
      this.updateAllAchievementProgress();
      
      this.unlockedAchievements = this.achievements.filter(a => a.unlocked);

    } catch (error) {
      console.error('Failed to load achievements:', error);
      this.achievements = [...this.achievementDefinitions];
    }
  }

  getAchievementDefinitions() {
    return [
      // Learning achievements
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first activity',
        category: 'learning',
        icon: '👶',
        requirement: { type: 'activities_completed', value: 1 },
        xpReward: 10,
        rarity: 'common'
      },
      {
        id: 'eager_learner',
        name: 'Eager Learner',
        description: 'Complete 10 activities',
        category: 'learning',
        icon: '📚',
        requirement: { type: 'activities_completed', value: 10 },
        xpReward: 50,
        rarity: 'common'
      },
      {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Complete 50 activities',
        category: 'learning',
        icon: '🔍',
        requirement: { type: 'activities_completed', value: 50 },
        xpReward: 200,
        rarity: 'uncommon'
      },
      {
        id: 'learning_master',
        name: 'Learning Master',
        description: 'Complete 100 activities',
        category: 'learning',
        icon: '🎓',
        requirement: { type: 'activities_completed', value: 100 },
        xpReward: 500,
        rarity: 'rare'
      },

      // Subject-specific achievements
      {
        id: 'math_explorer',
        name: 'Math Explorer',
        description: 'Reach level 5 in Math',
        category: 'learning',
        icon: '🔢',
        requirement: { type: 'subject_level', subject: 'math', value: 5 },
        xpReward: 100,
        rarity: 'uncommon'
      },
      {
        id: 'science_genius',
        name: 'Science Genius',
        description: 'Reach level 5 in Science',
        category: 'learning',
        icon: '🔬',
        requirement: { type: 'subject_level', subject: 'science', value: 5 },
        xpReward: 100,
        rarity: 'uncommon'
      },
      {
        id: 'bookworm',
        name: 'Bookworm',
        description: 'Reach level 5 in Reading',
        category: 'learning',
        icon: '📖',
        requirement: { type: 'subject_level', subject: 'reading', value: 5 },
        xpReward: 100,
        rarity: 'uncommon'
      },
      {
        id: 'artist',
        name: 'Creative Artist',
        description: 'Reach level 5 in Art',
        category: 'learning',
        icon: '🎨',
        requirement: { type: 'subject_level', subject: 'art', value: 5 },
        xpReward: 100,
        rarity: 'uncommon'
      },
      {
        id: 'coder',
        name: 'Future Coder',
        description: 'Reach level 5 in Coding',
        category: 'learning',
        icon: '💻',
        requirement: { type: 'subject_level', subject: 'coding', value: 5 },
        xpReward: 100,
        rarity: 'uncommon'
      },

      // Streak achievements
      {
        id: 'consistent_learner',
        name: 'Consistent Learner',
        description: 'Learn for 3 days in a row',
        category: 'streak',
        icon: '🔥',
        requirement: { type: 'streak_days', value: 3 },
        xpReward: 75,
        rarity: 'common'
      },
      {
        id: 'dedicated_student',
        name: 'Dedicated Student',
        description: 'Learn for 7 days in a row',
        category: 'streak',
        icon: '📅',
        requirement: { type: 'streak_days', value: 7 },
        xpReward: 200,
        rarity: 'uncommon'
      },
      {
        id: 'learning_champion',
        name: 'Learning Champion',
        description: 'Learn for 30 days in a row',
        category: 'streak',
        icon: '🏆',
        requirement: { type: 'streak_days', value: 30 },
        xpReward: 1000,
        rarity: 'legendary'
      },

      // Milestone achievements
      {
        id: 'level_up',
        name: 'Level Up!',
        description: 'Reach overall level 5',
        category: 'milestone',
        icon: '⬆️',
        requirement: { type: 'overall_level', value: 5 },
        xpReward: 150,
        rarity: 'uncommon'
      },
      {
        id: 'experienced_learner',
        name: 'Experienced Learner',
        description: 'Reach overall level 10',
        category: 'milestone',
        icon: '⭐',
        requirement: { type: 'overall_level', value: 10 },
        xpReward: 300,
        rarity: 'rare'
      },
      {
        id: 'xp_collector',
        name: 'XP Collector',
        description: 'Earn 1000 total XP',
        category: 'milestone',
        icon: '💎',
        requirement: { type: 'total_xp', value: 1000 },
        xpReward: 250,
        rarity: 'rare'
      },

      // Time-based achievements
      {
        id: 'time_investment',
        name: 'Time Investment',
        description: 'Spend 60 minutes learning',
        category: 'milestone',
        icon: '⏰',
        requirement: { type: 'time_spent', value: 60 },
        xpReward: 100,
        rarity: 'common'
      },
      {
        id: 'marathon_learner',
        name: 'Marathon Learner',
        description: 'Spend 10 hours learning',
        category: 'milestone',
        icon: '🏃',
        requirement: { type: 'time_spent', value: 600 },
        xpReward: 500,
        rarity: 'epic'
      },

      // Special achievements
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete an activity before 8 AM',
        category: 'special',
        icon: '🌅',
        requirement: { type: 'early_activity', value: 1 },
        xpReward: 50,
        rarity: 'uncommon'
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete an activity after 8 PM',
        category: 'special',
        icon: '🦉',
        requirement: { type: 'late_activity', value: 1 },
        xpReward: 50,
        rarity: 'uncommon'
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Get 100% on 5 activities',
        category: 'special',
        icon: '💯',
        requirement: { type: 'perfect_scores', value: 5 },
        xpReward: 300,
        rarity: 'rare'
      }
    ];
  }

  setupEventListeners() {
    // Listen for progress updates
    document.addEventListener('userProgressUpdated', () => {
      this.updateAllAchievementProgress();
    });

    // Listen for activity completions
    document.addEventListener('activityCompleted', (event) => {
      this.checkActivityAchievements(event.detail);
    });
  }

  updateAllAchievementProgress() {
    this.achievements.forEach(achievement => {
      const oldProgress = achievement.progress;
      const newProgress = this.calculateAchievementProgress(achievement);
      
      if (newProgress > oldProgress) {
        achievement.progress = newProgress;
        
        // Check if achievement should be unlocked
        if (newProgress >= achievement.requirement.value && !achievement.unlocked) {
          this.unlockAchievement(achievement);
        }
      }
    });
  }

  calculateAchievementProgress(achievement) {
    const { type, subject } = achievement.requirement;
    
    switch (type) {
    case 'activities_completed':
      return Object.values(this.progressData.subjects || {})
        .reduce((sum, subjectData) => sum + (subjectData.activitiesCompleted || 0), 0);
        
    case 'subject_level':
      return this.progressData.subjects?.[subject]?.level || 0;
        
    case 'overall_level':
      return this.progressData.overallLevel || 1;
        
    case 'total_xp':
      return this.progressData.totalXP || 0;
        
    case 'time_spent':
      return this.progressData.totalTimeSpent || 0;
        
    case 'streak_days':
      return this.progressData.streakDays || 0;
        
    case 'perfect_scores':
      // This would require additional tracking in progress data
      return achievement.progress || 0;
        
    case 'early_activity':
    case 'late_activity':
      // These would require additional activity time tracking
      return achievement.progress || 0;
        
    default:
      return achievement.progress || 0;
    }
  }

  async unlockAchievement(achievement) {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    
    // Add to unlocked achievements
    this.unlockedAchievements.push(achievement);
    
    // Save to repository
    try {
      await this.repository.addUserAchievement(this.user.id, {
        id: achievement.id,
        unlocked: true,
        unlockedAt: achievement.unlockedAt,
        progress: achievement.progress
      });
    } catch (error) {
      console.error('Failed to save achievement unlock:', error);
    }
    
    // Show notification
    if (this.options.showNotifications) {
      this.showAchievementNotification(achievement);
    }
    
    // Award XP
    if (achievement.xpReward > 0) {
      this.awardXP(achievement.xpReward);
    }
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('achievementUnlocked', {
      detail: { achievement }
    }));
  }

  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = `achievement-notification ${achievement.rarity}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <h4>Achievement Unlocked!</h4>
          <p><strong>${achievement.name}</strong></p>
          <p class="achievement-desc">${achievement.description}</p>
          ${achievement.xpReward > 0 ? `<p class="xp-reward">+${achievement.xpReward} XP</p>` : ''}
        </div>
      </div>
      <button class="close-notification">&times;</button>
    `;

    // Position and show notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-card);
      border: 2px solid var(--accent-primary);
      border-radius: 8px;
      padding: 1rem;
      max-width: 300px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Add click handler for close button
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, this.options.notificationDuration);
  }

  async awardXP(amount) {
    // This would integrate with the progress system to award XP
    document.dispatchEvent(new CustomEvent('xpAwarded', {
      detail: { amount, source: 'achievement' }
    }));
  }

  generateHTML() {
    return `
      <div class="achievement-system">
        <!-- Achievement Categories -->
        <div class="achievement-categories">
          <button class="category-btn active" data-category="all">All</button>
          ${this.options.categories.map(category => `
            <button class="category-btn" data-category="${category}">
              ${this.capitalizeFirst(category)}
            </button>
          `).join('')}
        </div>

        <!-- Achievement Stats -->
        <div class="achievement-stats">
          <div class="stat-item">
            <span class="stat-number">${this.unlockedAchievements.length}</span>
            <span class="stat-label">Unlocked</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${this.achievements.length}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${Math.round((this.unlockedAchievements.length / this.achievements.length) * 100)}%</span>
            <span class="stat-label">Complete</span>
          </div>
        </div>

        <!-- Achievement Grid -->
        <div class="achievements-grid" id="achievements-grid">
          ${this.generateAchievementsGridHTML()}
        </div>
      </div>
    `;
  }

  generateAchievementsGridHTML(filter = 'all') {
    const filteredAchievements = filter === 'all' 
      ? this.achievements 
      : this.achievements.filter(a => a.category === filter);

    return filteredAchievements.map(achievement => `
      <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} ${achievement.rarity}" 
           data-achievement-id="${achievement.id}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-content">
          <h4 class="achievement-name">${achievement.name}</h4>
          <p class="achievement-description">${achievement.description}</p>
          
          ${!achievement.unlocked ? `
            <div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(achievement.progress / achievement.requirement.value) * 100}%"></div>
              </div>
              <span class="progress-text">${achievement.progress}/${achievement.requirement.value}</span>
            </div>
          ` : `
            <div class="achievement-unlocked">
              <span class="unlock-date">Unlocked ${this.formatDate(achievement.unlockedAt)}</span>
              ${achievement.xpReward > 0 ? `<span class="xp-reward">+${achievement.xpReward} XP</span>` : ''}
            </div>
          `}
        </div>
        <div class="achievement-rarity ${achievement.rarity}"></div>
      </div>
    `).join('');
  }

  async attachEventListeners() {
    // Category filtering
    const categoryBtns = this.element.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.getAttribute('data-category');
        this.filterAchievements(category);
        
        // Update active category
        categoryBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Achievement card clicks (show details)
    const achievementCards = this.element.querySelectorAll('.achievement-card');
    achievementCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const achievementId = e.currentTarget.getAttribute('data-achievement-id');
        this.showAchievementDetails(achievementId);
      });
    });
  }

  filterAchievements(category) {
    const grid = this.element.querySelector('#achievements-grid');
    if (grid) {
      grid.innerHTML = this.generateAchievementsGridHTML(category);
      
      // Re-attach event listeners for new cards
      const achievementCards = grid.querySelectorAll('.achievement-card');
      achievementCards.forEach(card => {
        card.addEventListener('click', (e) => {
          const achievementId = e.currentTarget.getAttribute('data-achievement-id');
          this.showAchievementDetails(achievementId);
        });
      });
    }
  }

  showAchievementDetails(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    const modal = new Modal({
      title: achievement.name,
      content: this.generateAchievementDetailHTML(achievement),
      size: 'medium'
    });
    
    modal.create().open();
  }

  generateAchievementDetailHTML(achievement) {
    return `
      <div class="achievement-detail">
        <div class="achievement-header">
          <div class="achievement-icon-large">${achievement.icon}</div>
          <div class="achievement-info">
            <h3>${achievement.name}</h3>
            <p class="achievement-rarity ${achievement.rarity}">${this.capitalizeFirst(achievement.rarity)} Achievement</p>
            <p class="achievement-description">${achievement.description}</p>
          </div>
        </div>
        
        ${achievement.unlocked ? `
          <div class="achievement-unlocked-detail">
            <div class="unlock-info">
              <span class="unlock-status">✅ Unlocked</span>
              <span class="unlock-date">${this.formatDate(achievement.unlockedAt)}</span>
            </div>
            ${achievement.xpReward > 0 ? `
              <div class="xp-reward-detail">
                <span>XP Reward: +${achievement.xpReward}</span>
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="achievement-progress-detail">
            <div class="progress-info">
              <span>Progress: ${achievement.progress}/${achievement.requirement.value}</span>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(achievement.progress / achievement.requirement.value) * 100}%"></div>
              </div>
            </div>
            <div class="requirement-info">
              <p><strong>Requirement:</strong> ${this.getRequirementDescription(achievement.requirement)}</p>
              ${achievement.xpReward > 0 ? `<p><strong>Reward:</strong> ${achievement.xpReward} XP</p>` : ''}
            </div>
          </div>
        `}
      </div>
    `;
  }

  getRequirementDescription(requirement) {
    const { type, subject, value } = requirement;
    
    switch (type) {
    case 'activities_completed':
      return `Complete ${value} activities`;
    case 'subject_level':
      return `Reach level ${value} in ${this.capitalizeFirst(subject)}`;
    case 'overall_level':
      return `Reach overall level ${value}`;
    case 'total_xp':
      return `Earn ${value} total XP`;
    case 'time_spent':
      return `Spend ${value} minutes learning`;
    case 'streak_days':
      return `Learn for ${value} consecutive days`;
    case 'perfect_scores':
      return `Get perfect scores on ${value} activities`;
    default:
      return requirement.description || 'Complete special requirement';
    }
  }

  // Render methods for dashboard integration
  async renderRecent(container, limit = 3) {
    const recent = this.unlockedAchievements
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, limit);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="no-achievements">
          <p>No achievements unlocked yet!</p>
          <p>Complete activities to start earning achievements.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(achievement => `
      <div class="recent-achievement">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <span class="achievement-name">${achievement.name}</span>
          <span class="achievement-time">${this.formatDate(achievement.unlockedAt)}</span>
        </div>
      </div>
    `).join('');
  }

  showAllAchievements() {
    const modal = new Modal({
      title: 'All Achievements',
      content: this.generateHTML(),
      size: 'large'
    });
    
    const modalInstance = modal.create();
    modalInstance.open();
    
    // Initialize event listeners in modal
    setTimeout(() => {
      this.element = modalInstance.element.querySelector('.achievement-system');
      this.attachEventListeners();
    }, 100);
  }

  // Update data method
  async updateData(newProgressData) {
    this.progressData = newProgressData;
    this.updateAllAchievementProgress();
  }

  // Utility methods
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }

  // Static factory method
  static async create(options = {}) {
    const system = new AchievementSystem(options);
    await system.init();
    return system;
  }
}

export default AchievementSystem;