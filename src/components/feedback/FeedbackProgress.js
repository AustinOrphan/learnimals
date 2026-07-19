/**
 * FeedbackProgress Component
 * Visual progress indicators with character integration for achievements and progress tracking
 */

import BaseComponent from '../BaseComponent.js';

class FeedbackProgress extends BaseComponent {
  /**
   * Create a feedback progress component
   * @param {Object} options - FeedbackProgress options
   * @param {string} options.type - Progress type (level-up, streak, progress, achievement, skill)
   * @param {number} options.value - Current progress value
   * @param {number} options.max - Maximum progress value
   * @param {string} options.label - Progress label text
   * @param {string} [options.character] - Character name (bella, max, zara, aria, codecat)
   * @param {boolean} [options.animated] - Whether to animate progress changes
   * @param {boolean} [options.showValue] - Whether to show numerical values
   * @param {boolean} [options.showCharacter] - Whether to show character celebration
   * @param {string} [options.size] - Size variant (small, medium, large)
   * @param {Function} [options.onComplete] - Callback when progress reaches max
   * @param {Function} [options.onMilestone] - Callback when hitting milestones
   */
  constructor(options) {
    super({
      type: options.type || 'progress',
      value: options.value || 0,
      max: options.max || 100,
      label: options.label || 'Progress',
      character: options.character || 'max',
      animated: options.animated !== false,
      showValue: options.showValue !== false,
      showCharacter: options.showCharacter !== false,
      size: options.size || 'medium',
      onComplete: options.onComplete || null,
      onMilestone: options.onMilestone || null,
      cssClasses: [
        'feedback-progress',
        `feedback-progress--${options.type || 'progress'}`,
        `feedback-progress--${options.character || 'max'}`,
        `feedback-progress--${options.size || 'medium'}`,
      ],
      ...options,
    });

    this.previousValue = 0;
    this.animationId = null;
    this.milestones = [25, 50, 75, 100]; // Percentage milestones
  }

  /**
   * Generate feedback progress HTML
   * @returns {string} - Progress HTML
   */
  generateHTML() {
    const { id, type, value, max, label, character, showValue, showCharacter } = this.options;

    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const characterInfo = this.getCharacterInfo(character);

    return `
      <div id="${id}" class="component feedback-progress" 
           role="progressbar" aria-valuemin="0" aria-valuemax="${max}" 
           aria-valuenow="${value}" aria-label="${label}"
           data-progress-type="${type}" data-character="${character}">
        
        ${
          showCharacter
            ? `
          <div class="progress-character">
            <img src="${characterInfo.avatar}" alt="${characterInfo.name}" 
                 class="progress-character-avatar" loading="lazy">
            <div class="progress-character-celebration" data-celebration="hidden">
              <span class="celebration-emoji">🎉</span>
              <span class="celebration-text">${this.getCelebrationText(character, type)}</span>
            </div>
          </div>
        `
            : ''
        }
        
        <div class="progress-content">
          <div class="progress-header">
            <span class="progress-label">${label}</span>
            ${
              showValue
                ? `
              <span class="progress-value">
                <span class="progress-current">${value}</span>
                <span class="progress-separator">/</span>
                <span class="progress-max">${max}</span>
              </span>
            `
                : ''
            }
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" 
                   style="width: ${percentage}%;" 
                   data-percentage="${percentage}">
                <div class="progress-bar-shine"></div>
              </div>
              
              <!-- Milestone markers -->
              ${this.generateMilestoneMarkers()}
              
              <!-- Progress sparkles for animations -->
              <div class="progress-sparkles" data-active="false">
                <span class="sparkle sparkle-1">✨</span>
                <span class="sparkle sparkle-2">⭐</span>
                <span class="sparkle sparkle-3">💫</span>
              </div>
            </div>
            
            <div class="progress-percentage" aria-hidden="true">${Math.round(percentage)}%</div>
          </div>
          
          ${
            type === 'level-up'
              ? `
            <div class="progress-level-indicator">
              <span class="level-badge">Level ${Math.floor(value / (max / 10)) + 1}</span>
            </div>
          `
              : ''
          }
          
          ${
            type === 'streak'
              ? `
            <div class="progress-streak-indicator">
              <span class="streak-flame">🔥</span>
              <span class="streak-count">${value} day streak!</span>
            </div>
          `
              : ''
          }
          
          ${
            type === 'achievement'
              ? `
            <div class="progress-achievement-badge">
              <span class="achievement-icon">🏆</span>
              <span class="achievement-text">Achievement Progress</span>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  /**
   * Generate milestone markers
   * @returns {string} - Milestone markers HTML
   */
  generateMilestoneMarkers() {
    return this.milestones
      .map(
        milestone => `
      <div class="progress-milestone" 
           style="left: ${milestone}%;" 
           data-milestone="${milestone}"
           title="${milestone}% milestone">
        <div class="milestone-marker"></div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Get character information
   * @param {string} character - Character name
   * @returns {Object} - Character info
   */
  getCharacterInfo(character) {
    const characters = {
      bella: {
        name: 'Bella',
        avatar: '/public/images/characters/bella-progress.png',
      },
      max: {
        name: 'Max',
        avatar: '/public/images/characters/max-progress.png',
      },
      zara: {
        name: 'Zara',
        avatar: '/public/images/characters/zara-progress.png',
      },
      aria: {
        name: 'Aria',
        avatar: '/public/images/characters/aria-progress.png',
      },
      codecat: {
        name: 'CodeCat',
        avatar: '/public/images/characters/codecat-progress.png',
      },
    };

    return characters[character] || characters.max;
  }

  /**
   * Get character-specific celebration text
   * @param {string} character - Character name
   * @param {string} type - Progress type
   * @returns {string} - Celebration text
   */
  getCelebrationText(character, type) {
    const celebrations = {
      bella: {
        'level-up': 'Reading level up!',
        streak: 'Reading streak!',
        progress: 'Great reading!',
        achievement: 'Reading star!',
        skill: 'Word power!',
      },
      max: {
        'level-up': 'Math level up!',
        streak: 'Number streak!',
        progress: 'Math mastery!',
        achievement: 'Math champion!',
        skill: 'Number sense!',
      },
      zara: {
        'level-up': 'Science level up!',
        streak: 'Discovery streak!',
        progress: 'Science progress!',
        achievement: 'Science star!',
        skill: 'Research skills!',
      },
      aria: {
        'level-up': 'Art level up!',
        streak: 'Creative streak!',
        progress: 'Artistic growth!',
        achievement: 'Art master!',
        skill: 'Creative skills!',
      },
      codecat: {
        'level-up': 'Code level up!',
        streak: 'Coding streak!',
        progress: 'Programming up!',
        achievement: 'Code ninja!',
        skill: 'Logic skills!',
      },
    };

    const characterCelebrations = celebrations[character] || celebrations.max;
    return characterCelebrations[type] || characterCelebrations.progress;
  }

  /**
   * Update progress value with animation
   * @param {number} newValue - New progress value
   * @param {boolean} [animate=true] - Whether to animate the change
   * @returns {Promise} - Promise that resolves when animation completes
   */
  async updateProgress(newValue, animate = true) {
    const clampedValue = Math.min(this.options.max, Math.max(0, newValue));
    const oldValue = this.options.value;

    // Update options
    this.options.value = clampedValue;

    // Update ARIA attributes
    if (this.element) {
      this.element.setAttribute('aria-valuenow', clampedValue);
    }

    if (!animate || !this.element) {
      this.setProgressDisplay(clampedValue);
      this.checkMilestones(oldValue, clampedValue);
      return;
    }

    return new Promise(resolve => {
      this.animateProgressChange(oldValue, clampedValue, resolve);
    });
  }

  /**
   * Animate progress change
   * @param {number} from - Starting value
   * @param {number} to - Ending value
   * @param {Function} onComplete - Completion callback
   */
  animateProgressChange(from, to, onComplete) {
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    const animate = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = from + (to - from) * easeOut;

      this.setProgressDisplay(currentValue);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.setProgressDisplay(to);
        this.checkMilestones(from, to);
        this.triggerCompletionEffects(to);
        onComplete();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Set progress display values
   * @param {number} value - Progress value to display
   */
  setProgressDisplay(value) {
    if (!this.element) return;

    const percentage = Math.min(100, Math.max(0, (value / this.options.max) * 100));

    // Update progress bar
    const progressFill = this.element.querySelector('.progress-bar-fill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
      progressFill.setAttribute('data-percentage', percentage);
    }

    // Update current value display
    const currentValueElement = this.element.querySelector('.progress-current');
    if (currentValueElement) {
      currentValueElement.textContent = Math.round(value);
    }

    // Update percentage display
    const percentageElement = this.element.querySelector('.progress-percentage');
    if (percentageElement) {
      percentageElement.textContent = `${Math.round(percentage)}%`;
    }
  }

  /**
   * Check for milestone achievements
   * @param {number} oldValue - Previous value
   * @param {number} newValue - New value
   */
  checkMilestones(oldValue, newValue) {
    const oldPercentage = (oldValue / this.options.max) * 100;
    const newPercentage = (newValue / this.options.max) * 100;

    for (const milestone of this.milestones) {
      if (oldPercentage < milestone && newPercentage >= milestone) {
        this.triggerMilestone(milestone);

        if (this.options.onMilestone) {
          this.options.onMilestone(milestone, newValue);
        }
      }
    }
  }

  /**
   * Trigger milestone celebration
   * @param {number} milestone - Milestone percentage
   */
  triggerMilestone(milestone) {
    if (!this.element) return;

    // Find milestone marker
    const milestoneMarker = this.element.querySelector(`[data-milestone="${milestone}"]`);
    if (milestoneMarker) {
      milestoneMarker.classList.add('milestone-achieved');

      // Trigger sparkle effect
      this.triggerSparkleEffect();

      // Character celebration
      if (this.options.showCharacter) {
        this.triggerCharacterCelebration();
      }
    }
  }

  /**
   * Trigger completion effects
   * @param {number} value - Final value
   */
  triggerCompletionEffects(value) {
    if (value >= this.options.max) {
      this.triggerSparkleEffect();

      if (this.options.showCharacter) {
        this.triggerCharacterCelebration();
      }

      if (this.options.onComplete) {
        this.options.onComplete(value);
      }
    }
  }

  /**
   * Trigger sparkle animation effect
   */
  triggerSparkleEffect() {
    const sparkles = this.element?.querySelector('.progress-sparkles');
    if (!sparkles) return;

    sparkles.setAttribute('data-active', 'true');

    // Reset after animation
    setTimeout(() => {
      sparkles.setAttribute('data-active', 'false');
    }, 2000);
  }

  /**
   * Trigger character celebration
   */
  triggerCharacterCelebration() {
    const celebration = this.element?.querySelector('.progress-character-celebration');
    if (!celebration) return;

    celebration.setAttribute('data-celebration', 'active');

    // Reset after animation
    setTimeout(() => {
      celebration.setAttribute('data-celebration', 'hidden');
    }, 3000);
  }

  /**
   * Reset progress to zero
   * @param {boolean} [animate=true] - Whether to animate the reset
   */
  async reset(animate = true) {
    // Reset milestone states
    if (this.element) {
      const milestones = this.element.querySelectorAll('.progress-milestone');
      milestones.forEach(milestone => {
        milestone.classList.remove('milestone-achieved');
      });
    }

    return this.updateProgress(0, animate);
  }

  /**
   * Increment progress by a specific amount
   * @param {number} amount - Amount to increment by
   * @param {boolean} [animate=true] - Whether to animate the change
   */
  async increment(amount = 1, animate = true) {
    return this.updateProgress(this.options.value + amount, animate);
  }

  /**
   * Set progress to a specific percentage
   * @param {number} percentage - Percentage (0-100)
   * @param {boolean} [animate=true] - Whether to animate the change
   */
  async setPercentage(percentage, animate = true) {
    const value = (percentage / 100) * this.options.max;
    return this.updateProgress(value, animate);
  }

  /**
   * Get current progress percentage
   * @returns {number} - Current percentage (0-100)
   */
  getPercentage() {
    return (this.options.value / this.options.max) * 100;
  }

  /**
   * Check if progress is complete
   * @returns {boolean} - Whether progress is at maximum
   */
  isComplete() {
    return this.options.value >= this.options.max;
  }

  /**
   * Update progress configuration
   * @param {Object} newOptions - New options to update
   */
  update(newOptions) {
    const oldMax = this.options.max;

    // Update options
    Object.assign(this.options, newOptions);

    // Update label
    if (newOptions.label) {
      const labelElement = this.element?.querySelector('.progress-label');
      if (labelElement) {
        labelElement.textContent = newOptions.label;
      }
    }

    // Update max value display
    if (newOptions.max) {
      const maxElement = this.element?.querySelector('.progress-max');
      if (maxElement) {
        maxElement.textContent = newOptions.max;
      }

      // Update ARIA
      if (this.element) {
        this.element.setAttribute('aria-valuemax', newOptions.max);
      }
    }

    // Recalculate progress if max changed
    if (newOptions.max && newOptions.max !== oldMax) {
      this.setProgressDisplay(this.options.value);
    }
  }

  /**
   * Clean up component
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    super.destroy();
  }
}

export default FeedbackProgress;
