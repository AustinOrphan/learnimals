/**
 * FeedbackToast Component
 * Non-intrusive notification system with stack management and character integration
 */

import BaseComponent from '../BaseComponent.js';

class FeedbackToast extends BaseComponent {
  /**
   * Create a feedback toast component
   * @param {Object} options - FeedbackToast options
   * @param {string} options.type - Feedback type (success, error, hint, progress, achievement)
   * @param {string} options.message - Feedback message content
   * @param {string} [options.character] - Character name (bella, max, zara, aria, codecat)
   * @param {string} [options.position] - Toast position (top-right, top-left, bottom-right, bottom-left, top-center, bottom-center)
   * @param {number} [options.duration] - Auto-dismiss duration in ms (0 for manual dismiss)
   * @param {boolean} [options.showIcon] - Whether to show type icon
   * @param {boolean} [options.showCloseButton] - Whether to show close button
   * @param {boolean} [options.showProgress] - Whether to show progress bar for auto-dismiss
   * @param {Function} [options.onDismiss] - Callback when toast is dismissed
   * @param {Function} [options.onClick] - Callback when toast is clicked
   * @param {number} [options.stackIndex] - Index in toast stack (managed by ToastManager)
   */
  constructor(options) {
    super({
      type: options.type || 'success',
      message: options.message || '',
      character: options.character || 'max',
      position: options.position || 'top-right',
      duration: options.duration !== undefined ? options.duration : 4000,
      showIcon: options.showIcon !== false,
      showCloseButton: options.showCloseButton !== false,
      showProgress: options.showProgress !== false,
      onDismiss: options.onDismiss || null,
      onClick: options.onClick || null,
      stackIndex: options.stackIndex || 0,
      cssClasses: ['feedback-toast', `feedback-toast--${options.type || 'success'}`, `feedback-toast--${options.character || 'max'}`],
      ...options
    });
    
    this.isVisible = false;
    this.dismissTimer = null;
    this.progressInterval = null;
    this.startTime = null;
  }

  /**
   * Generate feedback toast HTML
   * @returns {string} - Toast HTML
   */
  generateHTML() {
    const { 
      id, type, message, character, position, duration, showIcon, showCloseButton, showProgress 
    } = this.options;
    
    const positionClass = `feedback-toast--${position}`;
    const typeIcon = this.getTypeIcon(type);
    const characterColor = this.getCharacterColor(character);
    
    return `
      <div id="${id}" class="component feedback-toast ${positionClass}" 
           role="alert" aria-live="polite" aria-atomic="true"
           data-feedback-type="${type}" data-character="${character}"
           style="--character-color: ${characterColor};">
        
        <div class="feedback-toast-content">
          ${showIcon ? `
            <div class="feedback-toast-icon">
              ${typeIcon}
            </div>
          ` : ''}
          
          <div class="feedback-toast-main">
            <div class="feedback-toast-message">${message}</div>
            ${this.getCharacterBadge(character, type)}
          </div>
          
          ${showCloseButton ? `
            <button class="feedback-toast-close component-button component-button--ghost" 
                    aria-label="Dismiss notification" type="button">
              <span aria-hidden="true">&times;</span>
            </button>
          ` : ''}
        </div>
        
        ${showProgress && duration > 0 ? `
          <div class="feedback-toast-progress">
            <div class="feedback-toast-progress-bar" data-duration="${duration}"></div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Get type-specific icon
   * @param {string} type - Feedback type
   * @returns {string} - Icon HTML
   */
  getTypeIcon(type) {
    const icons = {
      success: '<span class="feedback-icon feedback-icon--success" aria-label="Success">✅</span>',
      error: '<span class="feedback-icon feedback-icon--error" aria-label="Error">❌</span>',
      hint: '<span class="feedback-icon feedback-icon--hint" aria-label="Hint">💡</span>',
      progress: '<span class="feedback-icon feedback-icon--progress" aria-label="Progress">📈</span>',
      achievement: '<span class="feedback-icon feedback-icon--achievement" aria-label="Achievement">🏆</span>'
    };
    
    return icons[type] || icons.success;
  }

  /**
   * Get character-specific color
   * @param {string} character - Character name
   * @returns {string} - Color value
   */
  getCharacterColor(character) {
    const colors = {
      bella: '#ff6b6b',    // Reading - warm red
      max: '#4ecdc4',      // Math - teal
      zara: '#45b7d1',     // Science - blue
      aria: '#f9ca24',     // Art - yellow
      codecat: '#6c5ce7'   // Coding - purple
    };
    
    return colors[character] || colors.max;
  }

  /**
   * Get character badge with mini reaction
   * @param {string} character - Character name
   * @param {string} type - Feedback type
   * @returns {string} - Character badge HTML
   */
  getCharacterBadge(character, type) {
    const characterInfo = this.getCharacterInfo(character);
    const reaction = this.getCharacterReaction(character, type);
    
    return `
      <div class="feedback-toast-character-badge" title="${reaction}">
        <img src="${characterInfo.avatar}" alt="${characterInfo.name}" 
             class="character-mini-avatar" loading="lazy">
        <span class="character-reaction-emoji">${this.getReactionEmoji(type)}</span>
      </div>
    `;
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
        avatar: '/public/images/characters/bella-mini.png'
      },
      max: {
        name: 'Max',
        avatar: '/public/images/characters/max-mini.png'
      },
      zara: {
        name: 'Zara',
        avatar: '/public/images/characters/zara-mini.png'
      },
      aria: {
        name: 'Aria',
        avatar: '/public/images/characters/aria-mini.png'
      },
      codecat: {
        name: 'CodeCat',
        avatar: '/public/images/characters/codecat-mini.png'
      }
    };
    
    return characters[character] || characters.max;
  }

  /**
   * Get character-specific reaction for tooltip
   * @param {string} character - Character name
   * @param {string} type - Feedback type
   * @returns {string} - Short reaction text
   */
  getCharacterReaction(character, type) {
    const _reactions = {
      bella: {
        success: 'Great reading!',
        error: 'Keep trying!',
        hint: 'Think it through...',
        progress: 'You\'re improving!',
        achievement: 'Reading star!'
      },
      max: {
        success: 'Math magic!',
        error: 'Let\'s solve this!',
        hint: 'Count carefully...',
        progress: 'Numbers growing!',
        achievement: 'Math wizard!'
      },
      zara: {
        success: 'Science success!',
        error: 'Experiment more!',
        hint: 'Observe closely...',
        progress: 'Discovery time!',
        achievement: 'Science star!'
      },
      aria: {
        success: 'Artistic genius!',
        error: 'Keep creating!',
        hint: 'Feel the art...',
        progress: 'Creativity flowing!',
        achievement: 'Art master!'
      },
      codecat: {
        success: 'Code perfect!',
        error: 'Debug time!',
        hint: 'Check the logic...',
        progress: 'Programming up!',
        achievement: 'Code ninja!'
      }
    };
    
    const characterReactions = reactions[character] || reactions.max;
    return characterReactions[type] || characterReactions.success;
  }

  /**
   * Get reaction emoji for type
   * @param {string} type - Feedback type
   * @returns {string} - Emoji
   */
  getReactionEmoji(type) {
    const emojis = {
      success: '😊',
      error: '🤔',
      hint: '💭',
      progress: '📈',
      achievement: '🎉'
    };
    
    return emojis[type] || emojis.success;
  }

  /**
   * Show the feedback toast
   * @param {HTMLElement|string} [container] - Container element
   * @returns {Promise} - Promise that resolves when shown
   */
  async show(container) {
    if (this.isVisible) return;
    
    // Render component
    this.render(container || document.body);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Position in stack
    this.updateStackPosition();
    
    // Show with animation
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        this.element.classList.add('feedback-toast--visible');
        this.isVisible = true;
        
        // Start progress animation
        if (this.options.showProgress && this.options.duration > 0) {
          this.startProgressAnimation();
        }
        
        // Set up auto-dismiss timer
        if (this.options.duration > 0) {
          this.startTime = Date.now();
          this.dismissTimer = setTimeout(() => {
            this.dismiss();
          }, this.options.duration);
        }
        
        resolve();
      });
    });
  }

  /**
   * Dismiss the feedback toast
   * @returns {Promise} - Promise that resolves when dismissed
   */
  async dismiss() {
    if (!this.isVisible) return;
    
    // Clear timers
    this.clearTimers();
    
    return new Promise((resolve) => {
      this.element.classList.add('feedback-toast--dismissing');
      
      // Wait for animation
      setTimeout(() => {
        this.isVisible = false;
        
        // Call dismiss callback
        if (this.options.onDismiss) {
          this.options.onDismiss();
        }
        
        // Remove from DOM
        this.destroy();
        
        resolve();
      }, 300); // Animation duration
    });
  }

  /**
   * Update position in toast stack
   */
  updateStackPosition() {
    if (!this.element) return;
    
    const stackIndex = this.options.stackIndex || 0;
    const offset = stackIndex * 80; // 80px spacing between toasts
    
    // Apply stack offset based on position
    const position = this.options.position;
    
    if (position.includes('top')) {
      this.element.style.transform = `translateY(${offset}px)`;
    } else if (position.includes('bottom')) {
      this.element.style.transform = `translateY(-${offset}px)`;
    }
  }

  /**
   * Start progress bar animation
   */
  startProgressAnimation() {
    const progressBar = this.element?.querySelector('.feedback-toast-progress-bar');
    if (!progressBar) return;
    
    const duration = this.options.duration;
    
    // Set initial state
    progressBar.style.width = '100%';
    progressBar.style.transition = `width ${duration}ms linear`;
    
    // Start animation
    requestAnimationFrame(() => {
      progressBar.style.width = '0%';
    });
  }

  /**
   * Pause auto-dismiss (for hover interactions)
   */
  pauseAutoDismiss() {
    if (!this.dismissTimer) return;
    
    clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
    
    // Pause progress bar
    const progressBar = this.element?.querySelector('.feedback-toast-progress-bar');
    if (progressBar) {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.options.duration - elapsed);
      const percentageRemaining = (remaining / this.options.duration) * 100;
      
      progressBar.style.transition = 'none';
      progressBar.style.width = `${percentageRemaining}%`;
    }
  }

  /**
   * Resume auto-dismiss (after hover ends)
   */
  resumeAutoDismiss() {
    if (this.dismissTimer || this.options.duration <= 0) return;
    
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.options.duration - elapsed);
    
    if (remaining > 0) {
      // Resume progress bar
      const progressBar = this.element?.querySelector('.feedback-toast-progress-bar');
      if (progressBar) {
        progressBar.style.transition = `width ${remaining}ms linear`;
        progressBar.style.width = '0%';
      }
      
      // Resume timer
      this.dismissTimer = setTimeout(() => {
        this.dismiss();
      }, remaining);
    } else {
      this.dismiss();
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    if (!this.element) return;
    
    // Close button
    const closeButton = this.element.querySelector('.feedback-toast-close');
    if (closeButton) {
      this.addEventListener(closeButton, 'click', (e) => {
        e.stopPropagation();
        this.dismiss();
      });
    }
    
    // Click handler
    if (this.options.onClick) {
      this.addEventListener(this.element, 'click', this.options.onClick);
    }
    
    // Hover pause/resume
    this.addEventListener(this.element, 'mouseenter', () => {
      this.pauseAutoDismiss();
    });
    
    this.addEventListener(this.element, 'mouseleave', () => {
      this.resumeAutoDismiss();
    });
    
    // Focus pause/resume (for keyboard navigation)
    this.addEventListener(this.element, 'focusin', () => {
      this.pauseAutoDismiss();
    });
    
    this.addEventListener(this.element, 'focusout', () => {
      this.resumeAutoDismiss();
    });
    
    // Swipe gesture for mobile dismiss
    this.setupSwipeGestures();
  }

  /**
   * Set up swipe gestures for mobile
   */
  setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    const threshold = 50;
    
    this.addEventListener(this.element, 'touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    this.addEventListener(this.element, 'touchend', (e) => {
      if (!e.changedTouches) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Check for horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        // Swipe to dismiss
        this.element.style.transform += ` translateX(${deltaX > 0 ? '100%' : '-100%'})`;
        this.element.style.opacity = '0';
        
        setTimeout(() => {
          this.dismiss();
        }, 200);
      }
    }, { passive: true });
  }

  /**
   * Update toast content
   * @param {Object} newOptions - New options to update
   */
  update(newOptions) {
    // Update options
    Object.assign(this.options, newOptions);
    
    // Update message
    if (newOptions.message) {
      const messageElement = this.element?.querySelector('.feedback-toast-message');
      if (messageElement) {
        messageElement.textContent = newOptions.message;
      }
    }
    
    // Update character badge tooltip
    if (newOptions.character || newOptions.type) {
      const badge = this.element?.querySelector('.feedback-toast-character-badge');
      if (badge) {
        badge.title = this.getCharacterReaction(
          newOptions.character || this.options.character,
          newOptions.type || this.options.type
        );
      }
    }
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Clean up component
   */
  destroy() {
    this.clearTimers();
    super.destroy();
  }
}

export default FeedbackToast;