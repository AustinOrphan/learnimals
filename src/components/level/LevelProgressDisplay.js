/**
 * LevelProgressDisplay.js
 * 
 * Component for displaying enhanced level and XP progress bars with smooth animations
 */

import xpCalculator from '../../utils/xpCalculator.js';

class LevelProgressDisplay {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      showLevel: options.showLevel !== false,
      showXP: options.showXP !== false,
      showTitle: options.showTitle !== false,
      showEstimate: options.showEstimate !== false,
      size: options.size || 'normal', // mini, normal, large
      theme: options.theme || 'default', // default, gaming, minimal
      animated: options.animated !== false,
      onClick: options.onClick || null,
      ...options
    };
    
    this.currentProgress = {
      level: 1,
      xpIntoLevel: 0,
      xpForLevel: 100,
      totalXP: 0,
      progress: 0
    };
    
    this.animationInProgress = false;
    this.createStyles();
    
    if (this.container) {
      this.render();
    }
  }
  
  /**
   * Update progress with animation
   * @param {Object} progressData - Progress data from xpCalculator
   * @param {Object} options - Update options
   */
  updateProgress(progressData, options = {}) {
    const oldProgress = { ...this.currentProgress };
    this.currentProgress = progressData;
    
    if (options.animate !== false && this.options.animated) {
      this.animateProgress(oldProgress, progressData, options);
    } else {
      this.render();
    }
  }
  
  /**
   * Set progress from total XP
   * @param {number} totalXP - Total XP amount
   * @param {Object} options - Update options
   */
  setXP(totalXP, options = {}) {
    const progressData = xpCalculator.calculateLevelProgress(totalXP);
    this.updateProgress(progressData, options);
  }
  
  /**
   * Animate progress change
   * @param {Object} oldProgress - Previous progress state
   * @param {Object} newProgress - New progress state
   * @param {Object} options - Animation options
   */
  animateProgress(oldProgress, newProgress, options = {}) {
    if (this.animationInProgress) return;
    
    this.animationInProgress = true;
    const duration = options.duration || 1000;
    const easing = options.easing || 'easeOutCubic';
    
    // If level increased, animate level-up
    if (newProgress.level > oldProgress.level) {
      this.animateLevelUp(oldProgress, newProgress, { duration, easing });
    } else {
      this.animateXPGain(oldProgress, newProgress, { duration, easing });
    }
  }
  
  /**
   * Animate level-up sequence
   * @param {Object} oldProgress - Previous progress
   * @param {Object} newProgress - New progress
   * @param {Object} options - Animation options
   */
  animateLevelUp(oldProgress, newProgress, options) {
    const steps = [];
    
    // Step 1: Fill current level bar to 100%
    steps.push({
      level: oldProgress.level,
      progress: 1,
      xpIntoLevel: oldProgress.xpForLevel,
      xpForLevel: oldProgress.xpForLevel,
      totalXP: oldProgress.totalXP
    });
    
    // Step 2: Show new level with empty bar
    steps.push({
      level: newProgress.level,
      progress: 0,
      xpIntoLevel: 0,
      xpForLevel: newProgress.xpForLevel,
      totalXP: newProgress.totalXP
    });
    
    // Step 3: Fill to current progress
    steps.push(newProgress);
    
    this.animateSteps(steps, options);
  }
  
  /**
   * Animate XP gain within same level
   * @param {Object} oldProgress - Previous progress
   * @param {Object} newProgress - New progress
   * @param {Object} options - Animation options
   */
  animateXPGain(oldProgress, newProgress, options) {
    this.animateSteps([newProgress], options);
  }
  
  /**
   * Animate through multiple progress steps
   * @param {Array} steps - Array of progress states
   * @param {Object} options - Animation options
   */
  animateSteps(steps, options) {
    let currentStep = 0;
    const stepDuration = options.duration / steps.length;
    
    const animateStep = () => {
      if (currentStep >= steps.length) {
        this.animationInProgress = false;
        return;
      }
      
      const targetProgress = steps[currentStep];
      this.animateToProgress(targetProgress, stepDuration, () => {
        currentStep++;
        if (currentStep < steps.length) {
          setTimeout(animateStep, 100);
        } else {
          this.animationInProgress = false;
        }
      });
    };
    
    animateStep();
  }
  
  /**
   * Animate to specific progress state
   * @param {Object} targetProgress - Target progress state
   * @param {number} duration - Animation duration
   * @param {Function} callback - Completion callback
   */
  animateToProgress(targetProgress, duration, callback) {
    const startTime = Date.now();
    const startProgress = { ...this.currentProgress };
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);
      
      // Interpolate values
      this.currentProgress = {
        level: targetProgress.level, // Level jumps immediately
        xpIntoLevel: this.interpolate(startProgress.xpIntoLevel, targetProgress.xpIntoLevel, eased),
        xpForLevel: targetProgress.xpForLevel,
        totalXP: this.interpolate(startProgress.totalXP, targetProgress.totalXP, eased),
        progress: this.interpolate(startProgress.progress, targetProgress.progress, eased)
      };
      
      this.render();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.currentProgress = targetProgress;
        this.render();
        if (callback) callback();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Interpolate between two values
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} progress - Progress (0-1)
   * @returns {number} Interpolated value
   */
  interpolate(start, end, progress) {
    return start + (end - start) * progress;
  }
  
  /**
   * Ease out cubic function
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased value
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  /**
   * Render the progress display
   */
  render() {
    if (!this.container) return;
    
    const { progress } = this.currentProgress;
    
    this.container.className = `level-progress-display ${this.options.size} ${this.options.theme}`;
    this.container.innerHTML = this.getHTML();
    
    // Update progress bar
    const progressBar = this.container.querySelector('.progress-fill');
    if (progressBar) {
      progressBar.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
    }
    
    // Setup event listeners
    if (this.options.onClick) {
      this.container.addEventListener('click', () => {
        this.options.onClick(this.currentProgress);
      });
      this.container.style.cursor = 'pointer';
    }
  }
  
  /**
   * Get HTML content
   * @returns {string} HTML string
   */
  getHTML() {
    
    return `
      <div class="level-display-content">
        ${this.options.showLevel ? this.getLevelHTML() : ''}
        ${this.options.showXP ? this.getXPBarHTML() : ''}
        ${this.options.showTitle ? this.getTitleHTML() : ''}
        ${this.options.showEstimate ? this.getEstimateHTML() : ''}
      </div>
    `;
  }
  
  /**
   * Get level display HTML
   * @returns {string} Level HTML
   */
  getLevelHTML() {
    const { level } = this.currentProgress;
    const prestigeInfo = xpCalculator.getPrestigeInfo(level);
    
    return `
      <div class="level-info">
        <div class="level-number">${level}</div>
        <div class="level-label">Level</div>
        ${prestigeInfo.stars > 0 ? `<div class="prestige-stars">${'★'.repeat(Math.min(prestigeInfo.stars, 3))}</div>` : ''}
      </div>
    `;
  }
  
  /**
   * Get XP progress bar HTML
   * @returns {string} XP bar HTML
   */
  getXPBarHTML() {
    const { progress, xpIntoLevel, xpForLevel } = this.currentProgress;
    
    return `
      <div class="xp-progress">
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.max(0, Math.min(100, progress * 100))}%">
              <div class="progress-glow"></div>
            </div>
          </div>
          <div class="progress-text">
            <span class="current-xp">${Math.floor(xpIntoLevel)}</span>
            <span class="separator">/</span>
            <span class="target-xp">${Math.floor(xpForLevel)}</span>
            <span class="xp-label">XP</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get title HTML
   * @returns {string} Title HTML
   */
  getTitleHTML() {
    const { level } = this.currentProgress;
    const title = xpCalculator.getLevelTitle(level);
    const prestigeInfo = xpCalculator.getPrestigeInfo(level);
    
    return `
      <div class="level-title">
        ${prestigeInfo.title || title}
      </div>
    `;
  }
  
  /**
   * Get estimate HTML
   * @returns {string} Estimate HTML
   */
  getEstimateHTML() {
    const estimate = xpCalculator.estimateTimeToLevel(this.currentProgress);
    
    return `
      <div class="level-estimate">
        <span class="estimate-text">${estimate.description}</span>
        <span class="estimate-detail">${estimate.xpNeeded} XP to go</span>
      </div>
    `;
  }
  
  /**
   * Create CSS styles
   */
  createStyles() {
    if (document.getElementById('level-progress-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'level-progress-styles';
    style.textContent = `
      .level-progress-display {
        background-color: var(--bg-card);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      .level-progress-display:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }
      
      .level-progress-display.mini {
        padding: 12px;
        border-radius: 8px;
      }
      
      .level-progress-display.large {
        padding: 24px;
        border-radius: 16px;
      }
      
      .level-display-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .level-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .level-number {
        font-size: 2.5rem;
        font-weight: bold;
        color: var(--accent-primary);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .level-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .prestige-stars {
        color: #FFD700;
        font-size: 1.2rem;
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
        animation: star-shimmer 2s ease-in-out infinite;
      }
      
      .xp-progress {
        flex: 1;
      }
      
      .progress-container {
        position: relative;
      }
      
      .progress-bar {
        background-color: var(--bg-secondary);
        border-radius: 20px;
        height: 12px;
        overflow: hidden;
        position: relative;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .progress-fill {
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        height: 100%;
        border-radius: 20px;
        position: relative;
        transition: width 0.3s ease;
        min-width: 4px;
      }
      
      .progress-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        border-radius: 20px;
        animation: progress-shine 2s ease-in-out infinite;
      }
      
      .progress-text {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      
      .current-xp {
        font-weight: bold;
        color: var(--text-primary);
      }
      
      .level-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: center;
      }
      
      .level-estimate {
        text-align: center;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
      
      .estimate-text {
        display: block;
        font-weight: 500;
        color: var(--accent-primary);
      }
      
      .estimate-detail {
        display: block;
        margin-top: 2px;
        opacity: 0.8;
      }
      
      /* Gaming theme */
      .level-progress-display.gaming {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #0f3460;
        color: #e94560;
      }
      
      .level-progress-display.gaming .level-number {
        color: #e94560;
        text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
      }
      
      .level-progress-display.gaming .progress-fill {
        background: linear-gradient(90deg, #e94560, #f39c12);
        box-shadow: 0 0 10px rgba(233, 69, 96, 0.3);
      }
      
      /* Minimal theme */
      .level-progress-display.minimal {
        background: transparent;
        box-shadow: none;
        border: 1px solid var(--border-color);
      }
      
      .level-progress-display.minimal .progress-bar {
        height: 8px;
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      /* Size variations */
      .level-progress-display.mini .level-number {
        font-size: 1.5rem;
      }
      
      .level-progress-display.mini .progress-bar {
        height: 8px;
      }
      
      .level-progress-display.mini .level-display-content {
        gap: 8px;
      }
      
      .level-progress-display.large .level-number {
        font-size: 3.5rem;
      }
      
      .level-progress-display.large .progress-bar {
        height: 16px;
      }
      
      .level-progress-display.large .level-display-content {
        gap: 16px;
      }
      
      @keyframes progress-shine {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes star-shimmer {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .level-info {
          gap: 8px;
        }
        
        .level-number {
          font-size: 2rem !important;
        }
        
        .progress-text {
          font-size: 0.8rem;
        }
        
        .level-display-content {
          gap: 10px;
        }
      }
      
      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        .progress-fill,
        .progress-glow,
        .prestige-stars {
          animation: none;
        }
        
        .level-progress-display {
          transition: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Get current progress data
   * @returns {Object} Current progress
   */
  getProgress() {
    return { ...this.currentProgress };
  }
  
  /**
   * Set theme
   * @param {string} theme - Theme name
   */
  setTheme(theme) {
    this.options.theme = theme;
    this.render();
  }
  
  /**
   * Set size
   * @param {string} size - Size (mini, normal, large)
   */
  setSize(size) {
    this.options.size = size;
    this.render();
  }
  
  /**
   * Show/hide components
   * @param {Object} visibility - Visibility options
   */
  setVisibility(visibility) {
    Object.assign(this.options, visibility);
    this.render();
  }
  
  /**
   * Static method to create instance
   * @param {string} containerId - Container element ID
   * @param {Object} options - Configuration options
   * @returns {LevelProgressDisplay} New instance
   */
  static create(containerId, options = {}) {
    return new LevelProgressDisplay(containerId, options);
  }
}

export default LevelProgressDisplay;