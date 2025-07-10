/**
 * BadgeDisplay.js
 * 
 * Component for displaying individual achievement badges with rarity-based styling
 */

import { getBadgeByAchievementId, BADGE_RARITY } from '../../utils/badgeDefinitions.js';

class BadgeDisplay {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.achievement = options.achievement || null;
    this.size = options.size || 'normal'; // mini, normal, large
    this.showTooltip = options.showTooltip !== false;
    this.showProgress = options.showProgress !== false;
    this.interactive = options.interactive !== false;
    this.onClick = options.onClick || null;
    
    if (this.achievement) {
      this.render();
    }
  }
  
  /**
   * Render the badge
   */
  render() {
    if (!this.container || !this.achievement) return;
    
    const badge = getBadgeByAchievementId(this.achievement.id);
    if (!badge) {
      console.warn(`No badge found for achievement: ${this.achievement.id}`);
      return;
    }
    
    this.container.className = this.getBadgeClasses(badge);
    this.container.innerHTML = this.getBadgeHTML(badge);
    
    if (this.interactive) {
      this.setupEventListeners();
    }
    
    if (this.achievement.unlocked && !this.achievement.celebrationShown) {
      this.playUnlockAnimation();
    }
  }
  
  /**
   * Get CSS classes for the badge
   */
  getBadgeClasses(badge) {
    const classes = ['badge'];
    
    // Size class
    classes.push(`badge-${this.size}`);
    
    // Rarity class
    classes.push(badge.rarity);
    
    // State classes
    if (!this.achievement.unlocked) {
      classes.push('locked');
    } else {
      classes.push('unlocked');
    }
    
    // Special effects for legendary badges
    if (badge.rarity === BADGE_RARITY.LEGENDARY && this.achievement.unlocked) {
      classes.push('legendary-effects');
    }
    
    // Interactive class
    if (this.interactive) {
      classes.push('interactive');
    }
    
    return classes.join(' ');
  }
  
  /**
   * Get HTML content for the badge
   */
  getBadgeHTML(badge) {
    const progress = this.getProgressHTML();
    const tooltip = this.showTooltip ? this.getTooltipHTML(badge) : '';
    
    return `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-content">
        <div class="badge-name">${badge.name}</div>
        ${this.size !== 'mini' ? `<div class="badge-description">${badge.description}</div>` : ''}
        ${progress}
        ${this.achievement.unlocked && this.achievement.dateUnlocked ? 
    `<div class="badge-date">Unlocked ${this.formatDate(this.achievement.dateUnlocked)}</div>` : ''
}
      </div>
      ${tooltip}
    `;
  }
  
  /**
   * Get progress HTML for partially completed achievements
   */
  getProgressHTML() {
    if (!this.showProgress || this.achievement.unlocked || this.size === 'mini') {
      return '';
    }
    
    const current = this.achievement.progress?.current || 0;
    const target = this.achievement.progress?.target || 1;
    
    if (current === 0 || target === 1) {
      return '';
    }
    
    const percentage = Math.min((current / target) * 100, 100);
    
    return `
      <div class="badge-progress">
        <div class="badge-progress-text">${current}/${target}</div>
        <div class="badge-progress-bar">
          <div class="badge-progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get tooltip HTML
   */
  getTooltipHTML(badge) {
    const points = badge.points || 0;
    const rarity = badge.rarity;
    
    let content = `
      <div class="badge-tooltip">
        <div class="tooltip-header">
          <span class="tooltip-name">${badge.name}</span>
          <span class="tooltip-rarity ${rarity}">${rarity.toUpperCase()}</span>
        </div>
        <div class="tooltip-description">${badge.description}</div>
    `;
    
    if (points > 0) {
      content += `<div class="tooltip-points">${points} points</div>`;
    }
    
    if (!this.achievement.unlocked) {
      const requirement = this.getRequirementText();
      if (requirement) {
        content += `<div class="tooltip-requirement">${requirement}</div>`;
      }
    }
    
    content += '</div>';
    return content;
  }
  
  /**
   * Get requirement text for locked achievements
   */
  getRequirementText() {
    const condition = this.achievement.condition;
    if (!condition) return '';
    
    switch (condition.type) {
    case 'score':
      return `Score ${condition.target} points in a single game`;
    case 'streak':
      return `Get ${condition.target} correct answers in a row`;
    case 'games_played':
      return `Play ${condition.target} games`;
    case 'accuracy':
      return `Achieve ${condition.target}% accuracy`;
    case 'speed':
      return `Complete a game in under ${condition.target} seconds`;
    case 'level_reached':
      return `Reach level ${condition.target}`;
    case 'achievements_earned':
      return `Earn ${condition.target} achievements`;
    default:
      return 'Complete the requirements to unlock';
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.onClick) {
      this.container.addEventListener('click', () => {
        this.onClick(this.achievement);
      });
    }
    
    // Show tooltip on hover for desktop
    if (this.showTooltip && window.innerWidth > 768) {
      this.container.addEventListener('mouseenter', () => {
        this.showTooltipPopup();
      });
      
      this.container.addEventListener('mouseleave', () => {
        this.hideTooltipPopup();
      });
    }
    
    // Show tooltip on tap for mobile
    if (this.showTooltip && window.innerWidth <= 768) {
      this.container.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTooltipPopup();
      });
    }
  }
  
  /**
   * Show tooltip popup
   */
  showTooltipPopup() {
    const tooltip = this.container.querySelector('.badge-tooltip');
    if (tooltip) {
      tooltip.classList.add('show');
    }
  }
  
  /**
   * Hide tooltip popup
   */
  hideTooltipPopup() {
    const tooltip = this.container.querySelector('.badge-tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
    }
  }
  
  /**
   * Toggle tooltip popup (for mobile)
   */
  toggleTooltipPopup() {
    const tooltip = this.container.querySelector('.badge-tooltip');
    if (tooltip) {
      tooltip.classList.toggle('show');
      
      // Hide after delay on mobile
      if (tooltip.classList.contains('show')) {
        setTimeout(() => {
          tooltip.classList.remove('show');
        }, 3000);
      }
    }
  }
  
  /**
   * Play unlock animation
   */
  playUnlockAnimation() {
    this.container.classList.add('unlocked');
    
    // Add celebration particles for rare badges
    const badge = getBadgeByAchievementId(this.achievement.id);
    if (badge.rarity === BADGE_RARITY.EPIC || badge.rarity === BADGE_RARITY.LEGENDARY) {
      this.createCelebrationParticles();
    }
    
    // Mark as celebration shown
    this.achievement.celebrationShown = true;
  }
  
  /**
   * Create celebration particles
   */
  createCelebrationParticles() {
    const particles = document.createElement('div');
    particles.className = 'celebration-particles';
    
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background-color: #FFD700;
        border-radius: 50%;
        pointer-events: none;
        animation: particle-burst 1s ease-out forwards;
        animation-delay: ${i * 0.1}s;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      `;
      particles.appendChild(particle);
    }
    
    this.container.appendChild(particles);
    
    setTimeout(() => {
      particles.remove();
    }, 2000);
  }
  
  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
  
  /**
   * Update achievement data and re-render
   */
  updateAchievement(achievement) {
    this.achievement = achievement;
    this.render();
  }
  
  /**
   * Static method to create a badge element
   */
  static createElement(achievement, options = {}) {
    const element = document.createElement('div');
    new BadgeDisplay(element, { achievement, ...options });
    return element;
  }
  
  /**
   * Static method to create multiple badge elements
   */
  static createElements(achievements, options = {}) {
    return achievements.map(achievement => 
      BadgeDisplay.createElement(achievement, options)
    );
  }
}

export default BadgeDisplay;