/**
 * FeedbackOverlay Component
 * Modal-style feedback for important messages with character integration
 */

import BaseComponent from '../BaseComponent.js';

class FeedbackOverlay extends BaseComponent {
  /**
   * Create a feedback overlay component
   * @param {Object} options - FeedbackOverlay options
   * @param {string} options.type - Feedback type (success, error, hint, progress, achievement)
   * @param {string} options.message - Feedback message content
   * @param {string} [options.character] - Character name (bella, max, zara, aria, codecat)
   * @param {string} [options.animation] - Animation type (celebrate, encourage, think, etc.)
   * @param {number} [options.duration] - Auto-dismiss duration in ms (0 for manual dismiss)
   * @param {boolean} [options.showCharacter] - Whether to show character avatar
   * @param {boolean} [options.showCloseButton] - Whether to show close button
   * @param {Function} [options.onDismiss] - Callback when overlay is dismissed
   * @param {boolean} [options.blockInteraction] - Whether to block background interaction
   */
  constructor(options) {
    super({
      type: options.type || 'success',
      message: options.message || '',
      character: options.character || 'max',
      animation: options.animation || 'default',
      duration: options.duration || 3000,
      showCharacter: options.showCharacter !== false,
      showCloseButton: options.showCloseButton !== false,
      onDismiss: options.onDismiss || null,
      blockInteraction: options.blockInteraction !== false,
      cssClasses: [
        'feedback-overlay',
        `feedback-overlay--${options.type || 'success'}`,
        `feedback-overlay--${options.character || 'max'}`,
      ],
      ...options,
    });

    this.isVisible = false;
    this.dismissTimer = null;
    this.animationClass = '';
  }

  /**
   * Generate feedback overlay HTML
   * @returns {string} - Overlay HTML
   */
  generateHTML() {
    const {
      id,
      type,
      message,
      character,
      animation,
      showCharacter,
      showCloseButton,
      blockInteraction,
    } = this.options;

    const overlayClass = blockInteraction
      ? 'feedback-overlay-backdrop'
      : 'feedback-overlay-backdrop feedback-overlay-backdrop--no-block';
    const characterInfo = this.getCharacterInfo(character);
    const typeIcon = this.getTypeIcon(type);
    const animationClass = `feedback-overlay--animation-${animation}`;

    return `
      <div id="${id}" class="component feedback-overlay ${animationClass}" 
           role="dialog" aria-modal="${blockInteraction}" aria-live="assertive" 
           aria-labelledby="${id}-message" data-feedback-type="${type}" 
           data-character="${character}" aria-hidden="true">
        <div class="${overlayClass}"></div>
        <div class="feedback-overlay-content">
          ${
            showCharacter
              ? `
            <div class="feedback-overlay-character" data-character="${character}">
              <div class="character-avatar character-avatar--${character}">
                <img src="${characterInfo.avatar}" alt="${characterInfo.name}" 
                     class="character-image" loading="lazy">
                <div class="character-expression character-expression--${type}"></div>
              </div>
              <div class="character-speech-bubble">
                <div class="speech-bubble-content">
                  ${this.getCharacterReaction(character, type)}
                </div>
              </div>
            </div>
          `
              : ''
          }
          
          <div class="feedback-overlay-main">
            <div class="feedback-overlay-icon">
              ${typeIcon}
            </div>
            
            <div class="feedback-overlay-message" id="${id}-message">
              ${message}
            </div>
            
            ${
              type === 'achievement'
                ? `
              <div class="feedback-overlay-achievement">
                <div class="achievement-badge"></div>
                <div class="achievement-sparkles"></div>
              </div>
            `
                : ''
            }
            
            ${
              showCloseButton
                ? `
              <button class="feedback-overlay-close component-button component-button--ghost" 
                      aria-label="Dismiss feedback" type="button">
                <span aria-hidden="true">&times;</span>
              </button>
            `
                : ''
            }
          </div>
        </div>
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
        name: 'Bella the Reading Bunny',
        avatar: '/public/images/characters/bella-avatar.png',
        subject: 'reading',
      },
      max: {
        name: 'Max the Math Bear',
        avatar: '/public/images/characters/max-avatar.png',
        subject: 'math',
      },
      zara: {
        name: 'Zara the Science Zebra',
        avatar: '/public/images/characters/zara-avatar.png',
        subject: 'science',
      },
      aria: {
        name: 'Aria the Art Owl',
        avatar: '/public/images/characters/aria-avatar.png',
        subject: 'art',
      },
      codecat: {
        name: 'CodeCat the Coding Cat',
        avatar: '/public/images/characters/codecat-avatar.png',
        subject: 'coding',
      },
    };

    return characters[character] || characters.max;
  }

  /**
   * Get type-specific icon
   * @param {string} type - Feedback type
   * @returns {string} - Icon HTML
   */
  getTypeIcon(type) {
    const icons = {
      success: '<span class="feedback-icon feedback-icon--success">✅</span>',
      error: '<span class="feedback-icon feedback-icon--error">❌</span>',
      hint: '<span class="feedback-icon feedback-icon--hint">💡</span>',
      progress: '<span class="feedback-icon feedback-icon--progress">📈</span>',
      achievement: '<span class="feedback-icon feedback-icon--achievement">🏆</span>',
    };

    return icons[type] || icons.success;
  }

  /**
   * Get character-specific reaction
   * @param {string} character - Character name
   * @param {string} type - Feedback type
   * @returns {string} - Reaction message
   */
  getCharacterReaction(character, type) {
    const _reactions = {
      bella: {
        success: [
          'Wonderful reading! 📚',
          "You're becoming a great reader! 🌟",
          'Perfect pronunciation! 🎭',
        ],
        error: [
          "Let's try that again together! 💪",
          'Reading takes practice! 📖',
          "We'll get it next time! 🤗",
        ],
        hint: [
          'Think about the sound... 🔤',
          'Look at the first letter! 👀',
          'Sound it out slowly! 🗣️',
        ],
        progress: [
          "You're improving so much! 📈",
          'Great progress, reader! 🚀',
          'Keep up the reading! 📚',
        ],
        achievement: [
          'Amazing reading milestone! 🎉',
          "You're a reading star! ⭐",
          'Outstanding achievement! 🏆',
        ],
      },
      max: {
        success: ['Math magic! 🎩', 'Numbers are your friend! 🔢', 'Calculating success! 📊'],
        error: [
          "Let's solve this together! 🤔",
          'Math needs patience! ⏱️',
          'Try a different approach! 🔄',
        ],
        hint: ['Think step by step... 🪜', 'What operation do we need? ➕', 'Count carefully! 🔢'],
        progress: [
          'Your math skills are growing! 📈',
          'Number sense improving! 🧮',
          'Mathematical progress! 📊',
        ],
        achievement: ['Mathematical genius! 🧠', 'Number wizard achieved! 🪄', 'Math champion! 🏆'],
      },
      zara: {
        success: [
          'Scientific discovery! 🔬',
          'Hypothesis confirmed! ✅',
          'Experiment successful! 🧪',
        ],
        error: [
          'Science means trying again! 🔬',
          'Every mistake teaches us! 📚',
          "Let's investigate more! 🕵️",
        ],
        hint: ['Observe carefully... 👁️', 'What do you notice? 🤔', 'Form a hypothesis! 💭'],
        progress: [
          'Scientific thinking growing! 🌱',
          'Discovery skills improving! 🔍',
          'Research progressing! 📋',
        ],
        achievement: ['Science superstar! ⭐', 'Discovery champion! 🏆', 'Research excellence! 🥇'],
      },
      aria: {
        success: ['Artistic brilliance! 🎨', 'Creative genius! ✨', 'Beautiful expression! 🖼️'],
        error: [
          'Art is about experimenting! 🎭',
          'Every artist makes mistakes! 🖌️',
          "Let's try another way! 🎨",
        ],
        hint: ['Feel the creativity... 💫', 'What colors speak to you? 🌈', 'Express yourself! 🎨'],
        progress: [
          'Your creativity is blooming! 🌸',
          'Artistic skills developing! 🎭',
          'Creative growth! 🌱',
        ],
        achievement: ['Master artist! 🎨', 'Creative champion! 🏆', 'Artistic excellence! ⭐'],
      },
      codecat: {
        success: ['Code compiled! 💻', 'Logic perfect! 🤖', 'Program successful! ⚡'],
        error: ['Debugging time! 🐛', 'Code needs tweaking! 🔧', "Let's fix this bug! 🛠️"],
        hint: ['Check your syntax... 📝', "What's the logic? 🤔", 'Step through the code! 👣'],
        progress: [
          'Coding skills leveling up! 📈',
          'Programming progress! 💾',
          'Logic improving! 🧠',
        ],
        achievement: ['Coding wizard! 🧙‍♂️', 'Program master! 🏆', 'Code champion! 👑'],
      },
    };

    const characterReactions = _reactions[character] || _reactions.max;
    const typeReactions = characterReactions[type] || characterReactions.success;
    const randomReaction = typeReactions[Math.floor(Math.random() * typeReactions.length)];

    return randomReaction;
  }

  /**
   * Show the feedback overlay
   * @param {HTMLElement|string} [container] - Container element
   * @returns {Promise} - Promise that resolves when shown
   */
  async show(container) {
    if (this.isVisible) return;

    // Render component
    this.render(container || document.body);

    // Set up event listeners
    this.setupEventListeners();

    // Show with animation
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        this.element.setAttribute('aria-hidden', 'false');
        this.element.classList.add('feedback-overlay--visible');
        this.isVisible = true;

        // Set up auto-dismiss timer
        if (this.options.duration > 0) {
          this.dismissTimer = setTimeout(() => {
            this.dismiss();
          }, this.options.duration);
        }

        // Trigger character animation
        this.triggerCharacterAnimation();

        resolve();
      });
    });
  }

  /**
   * Dismiss the feedback overlay
   * @returns {Promise} - Promise that resolves when dismissed
   */
  async dismiss() {
    if (!this.isVisible) return;

    // Clear auto-dismiss timer
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    return new Promise(resolve => {
      this.element.classList.add('feedback-overlay--dismissing');

      // Wait for animation
      setTimeout(() => {
        this.element.setAttribute('aria-hidden', 'true');
        this.element.classList.remove('feedback-overlay--visible', 'feedback-overlay--dismissing');
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
   * Set up event listeners
   */
  setupEventListeners() {
    if (!this.element) return;

    // Close button
    const closeButton = this.element.querySelector('.feedback-overlay-close');
    if (closeButton) {
      this.addEventListener(closeButton, 'click', () => this.dismiss());
    }

    // Background click (if not blocking)
    if (!this.options.blockInteraction) {
      const backdrop = this.element.querySelector('.feedback-overlay-backdrop');
      if (backdrop) {
        this.addEventListener(backdrop, 'click', () => this.dismiss());
      }
    }

    // Keyboard navigation
    this.addEventListener(document, 'keydown', e => {
      if (e.key === 'Escape' && this.isVisible) {
        this.dismiss();
      }
    });
  }

  /**
   * Trigger character animation
   */
  triggerCharacterAnimation() {
    const character = this.element?.querySelector('.feedback-overlay-character');
    if (!character) return;

    const { type, animation } = this.options;

    // Add animation class
    character.classList.add(`character-animation--${animation}`);
    character.classList.add(`character-animation--${type}`);

    // Trigger speech bubble animation
    const speechBubble = character.querySelector('.character-speech-bubble');
    if (speechBubble) {
      setTimeout(() => {
        speechBubble.classList.add('speech-bubble--active');
      }, 500);
    }
  }

  /**
   * Update feedback content
   * @param {Object} newOptions - New options to update
   */
  update(newOptions) {
    // Update options
    Object.assign(this.options, newOptions);

    // Update message
    if (newOptions.message) {
      const messageElement = this.element?.querySelector('.feedback-overlay-message');
      if (messageElement) {
        messageElement.textContent = newOptions.message;
      }
    }

    // Update character reaction
    if (newOptions.character || newOptions.type) {
      const speechContent = this.element?.querySelector('.speech-bubble-content');
      if (speechContent) {
        speechContent.innerHTML = this.getCharacterReaction(
          newOptions.character || this.options.character,
          newOptions.type || this.options.type
        );
      }
    }
  }

  /**
   * Clean up component
   */
  destroy() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    super.destroy();
  }
}

export default FeedbackOverlay;
