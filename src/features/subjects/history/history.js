/**
 * History Subject JavaScript
 * Interactive features for Chrono the Turtle
 */
import Modal from '../../../components/ui/Modal.js';
import { escapeHTML } from '../../../utils/common.js';

class HistorySubject {
  constructor() {
    this.subjectName = 'History';
    this.character = {
      name: 'Chrono',
      type: 'Turtle',
      role: 'History Keeper'
    };
    this.features = [
      'Timeline Explorer',
      'Historical Figures',
      'Ancient Civilizations',
      'Time Machine'
    ];
        
    this.init();
  }

  init() {
    console.log(`🎓 Initializing ${this.subjectName} with ${this.character.name} the ${this.character.type}`);
        
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
    this.setupCharacterInteraction();
    this.setupThemeIntegration();
  }

  setupFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
        
    featureCards.forEach((card, index) => {
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
    document.addEventListener('themeChanged', (event) => {
      this.onThemeChange(event.detail.theme);
    });
  }

  handleFeatureClick(feature) {
    console.log(`🎯 User clicked on: ${feature}`);
        
    // Show character encouragement
    this.showCharacterMessage(`Great choice! Let's explore ${feature} together!`);
        
    // Here you can add specific functionality for each feature
    switch (feature.toLowerCase()) {
    case 'timeline explorer':
      this.startFirstFeature();
      break;
    case 'historical figures':
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
      'Let\'s explore and have fun together!',
      'Click on any activity to get started!'
    ];
        
    const displayMessage = message || defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
        
    // Create and show message modal or toast
    this.displayMessage(displayMessage);
  }

  displayMessage(message) {
    // SECURITY: Escape HTML to prevent XSS attacks
    // Use custom modal component with character theming
    const modal = new Modal({
      id: 'history-message-modal',
      title: `${escapeHTML(this.character.name)} the ${escapeHTML(this.character.type)}`,
      content: `<div class="character-message">
                <div class="character-icon">🎓</div>
                <p>${escapeHTML(message)}</p>
            </div>`,
      confirmButtonText: 'Got it!',
      showClose: true,
      size: 'medium',
      onConfirm: () => modal.hide()
    });
    modal.show();
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
      level: 1
    };
  }

  saveProgress(featureCompleted) {
    // Save user progress
    console.log(`💾 Saving progress: ${featureCompleted}`);
    // Implement progress saving logic
  }
}

// Initialize the subject when script loads
const historySubject = new HistorySubject();

// Export for potential use by other modules
export default HistorySubject;