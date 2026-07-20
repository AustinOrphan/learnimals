/**
 * Music Subject JavaScript
 * Interactive features for Melody the Songbird
 */
import Modal from '../../../components/ui/Modal.js';
import { escapeHTML } from '../../../utils/common.js';

class MusicSubject {
  constructor() {
    this.subjectName = 'Music';
    this.character = {
      name: 'Melody',
      type: 'Songbird',
      role: 'Music Teacher',
    };
    this.features = ['Music Theory', 'Virtual Instruments', 'Rhythm Games', 'Song Composition'];

    this.init();
  }

  init() {
    console.log(
      `🎓 Initializing ${this.subjectName} with ${this.character.name} the ${this.character.type}`
    );

    // Set up event listeners when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Add interactive features here
    this.setupFeatureCards();
    this.watchForFeatureCards();
    this.setupCharacterInteraction();
    this.setupThemeIntegration();
  }

  watchForFeatureCards() {
    // SubjectTemplateLoader rewrites the whole document and renders the feature
    // cards via Card.js asynchronously, which can finish AFTER this deferred ES
    // module runs. It can even render them twice (once on `componentsLoaded`, once
    // on a DOMContentLoaded timeout), replacing #feature-cards-container each time.
    // A one-shot readyState/componentsLoaded check races that render and loses, and
    // disconnecting after the first wire loses the cards the second render creates.
    // So keep a lightweight observer live and (re)wire cards whenever they appear.
    // (setupFeatureCards only sets an attribute + click handler, which does not add
    // DOM nodes, so it never retriggers this childList observer.)
    if (this.cardObserver) {
      return;
    }
    this.cardObserver = new MutationObserver(() => this.setupFeatureCards());
    this.cardObserver.observe(document.body, { childList: true, subtree: true });
  }

  setupFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach((card, index) => {
      // Idempotent: setup can run more than once (initial call + observer callbacks),
      // so skip any card already wired. Index stays aligned with `this.features`
      // because we iterate the full card list every time.
      if (card.hasAttribute('data-feature')) {
        return;
      }
      const feature = this.features[index];
      if (feature) {
        card.addEventListener('click', () => this.handleFeatureClick(feature));
        card.setAttribute('data-feature', feature.toLowerCase().replace(/\s+/g, '-'));
      }
    });
  }

  setupCharacterInteraction() {
    const characterImage = document.querySelector('.hero-image img');
    if (characterImage) {
      characterImage.addEventListener('click', () => {
        this.showCharacterMessage();
      });

      // Add hover effect
      characterImage.style.cursor = 'pointer';
      characterImage.title = `Click to interact with ${this.character.name}!`;
    }
  }

  setupThemeIntegration() {
    // Listen for theme changes and update character accordingly
    document.addEventListener('themeChanged', event => {
      this.onThemeChange(event.detail.theme);
    });
  }

  handleFeatureClick(feature) {
    console.log(`🎯 User clicked on: ${feature}`);

    // Show character encouragement
    this.showCharacterMessage(`Great choice! Let's explore ${feature} together!`);

    // Here you can add specific functionality for each feature
    switch (feature.toLowerCase()) {
      case 'music theory':
        this.startFirstFeature();
        break;
      case 'virtual instruments':
        this.startSecondFeature();
        break;
      default:
        this.showComingSoon(feature);
    }
  }

  startFirstFeature() {
    // Implement first feature functionality
    console.log(`🚀 Starting ${this.features[0]}`);
    // Add your interactive content here
  }

  startSecondFeature() {
    // Implement second feature functionality
    console.log(`🚀 Starting ${this.features[1]}`);
    // Add your interactive content here
  }

  showComingSoon(feature) {
    const message = `${feature} is coming soon! ${this.character.name} is working hard to prepare exciting activities for you.`;
    this.showCharacterMessage(message);
  }

  showCharacterMessage(message = null) {
    const defaultMessages = [
      `Hi! I'm ${this.character.name} the ${this.character.type}!`,
      `Ready to learn some amazing ${this.subjectName.toLowerCase()}?`,
      "Let's explore and have fun together!",
      'Click on any activity to get started!',
    ];

    const displayMessage =
      message || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];

    // Create and show message modal or toast
    this.displayMessage(displayMessage);
  }

  displayMessage(message) {
    // Use custom modal component with character theming
    // SECURITY: Escape HTML to prevent XSS attacks
    const modal = new Modal({
      id: 'music-message-modal',
      title: `${escapeHTML(this.character.name)} the ${escapeHTML(this.character.type)}`,
      content: `<div class="character-message">
                <div class="character-icon">🎵</div>
                <p>${escapeHTML(message)}</p>
            </div>`,
      confirmButtonText: 'Got it!',
      showClose: true,
      size: 'medium',
      onConfirm: () => modal.close(),
    });
    // Modal (ui/Modal.js) displays via open()/close(); the inherited show()/hide()
    // are no-ops until the element is created, so a card click showed nothing.
    modal.open();
  }

  onThemeChange(theme) {
    console.log(`🎨 Theme changed to: ${theme}`);
    // Update character appearance or animations based on theme
    // This can be used to change character expressions, colors, etc.
  }

  // Utility methods for future enhancements
  getProgress() {
    // Return user progress for this subject
    return {
      subject: this.subjectName,
      completedFeatures: [],
      totalFeatures: this.features.length,
      level: 1,
    };
  }

  saveProgress(featureCompleted) {
    // Save user progress
    console.log(`💾 Saving progress: ${featureCompleted}`);
    // Implement progress saving logic
  }
}

// Initialize the subject when script loads
new MusicSubject();

// Export for potential use by other modules
export default MusicSubject;
