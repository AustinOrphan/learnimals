// Card Component
// Reusable card component for consistent UI across the site

import BaseComponent from '../BaseComponent.js';
import animationManager from '../../utils/AnimationManager.js';

class Card extends BaseComponent {
  /**
   * Create a card component
   * @param {Object} options - Card options
   * @param {string} options.title - Card title
   * @param {string} options.content - Card content (can be HTML)
   * @param {string} [options.imageUrl] - Optional image URL
   * @param {string} [options.imageAlt] - Image alt text
   * @param {string} [options.linkUrl] - Optional link URL
   * @param {string} [options.linkText] - Link text
   * @param {string[]} [options.cssClasses] - Additional CSS classes
   * @param {string} [options.theme] - Card theme (default, alt)
   */
  constructor(options) {
    super({
      title: options.title || '',
      content: options.content || '',
      imageUrl: options.imageUrl || null,
      imageAlt: options.imageAlt || '',
      linkUrl: options.linkUrl || null,
      linkText: options.linkText || 'Learn More',
      theme: options.theme || 'default',
      ...options
    });
  }


  /**
   * Generate card HTML
   * @returns {string} - Card HTML
   */
  generateHTML() {
    const { title, content, imageUrl, imageAlt, linkUrl, linkText, cssClasses, theme, id, enableAnimations = true } = this.options;
    
    // Build CSS classes
    const cardClasses = ['component', 'feature-card'];
    if (theme === 'alt') cardClasses.push('feature-card--alt');
    if (cssClasses && cssClasses.length) cardClasses.push(...cssClasses);
    
    // Add animation classes if enabled
    if (enableAnimations) {
      cardClasses.push('animate-card-entrance', 'hover-lift');
    }
    
    let html = `<div id="${id}" class="${cardClasses.join(' ')}" role="article" data-animate="true">`;
    
    // Add image if provided
    if (imageUrl) {
      html += `<div class="card-image">
        <img src="${imageUrl}" alt="${imageAlt}" loading="lazy" class="animate-fade-in">
      </div>`;
    }
    
    // Add title
    if (title) {
      html += `<h3 class="card-title animate-slide-up">${title}</h3>`;
    }
    
    // Add content
    html += `<div class="card-content animate-fade-in">${content}</div>`;
    
    // Add link if provided
    if (linkUrl) {
      html += `<a href="${linkUrl}" class="card-link component-button component-button--primary btn-ripple">${linkText}</a>`;
    }
    
    html += '</div>';
    
    return html;
  }

  /**
   * Attach event listeners to the card
   */
  attachEventListeners() {
    // Add click event for card interactions
    this.addEventListener('click', this.handleCardClick, '.card-link');
    
    // Enhanced card interactions with animations
    this.addEventListener('mouseenter', () => {
      if (this.options.enableAnimations !== false) {
        animationManager.addInteractionEffects(this.element, {
          hover: 'lift',
          click: 'shrink'
        });
      }
      this.emit('cardHover', { card: this.options });
    });
    
    // Add loading state animation on link click
    this.addEventListener('click', (e) => {
      if (e.target.matches('.card-link') && this.options.enableAnimations !== false) {
        const button = e.target;
        const originalText = button.textContent;
        
        // Show loading state
        animationManager.showLoadingState(button, 'spinner', {
          text: 'Loading...'
        });
        
        // Hide loading after navigation (fallback)
        setTimeout(() => {
          animationManager.hideLoadingState(button);
          button.textContent = originalText;
        }, 2000);
      }
    }, '.card-link');
  }
  
  /**
   * Handle card link clicks
   */
  handleCardClick(event) {
    // Emit card click event for analytics or other tracking
    this.emit('cardClick', { 
      card: this.options,
      linkUrl: this.options.linkUrl,
      event 
    });
  }
  
  /**
   * Trigger entrance animation
   * @param {Object} options - Animation options
   */
  async animateIn(options = {}) {
    if (!this.element || this.options.enableAnimations === false) {
      return Promise.resolve();
    }
    
    try {
      // Use AnimationManager for entrance animation
      await animationManager.fadeIn(this.element, {
        duration: options.duration || 400,
        delay: options.delay || 0,
        easing: 'easeOut',
        priority: 'normal'
      });
      
      this.emit('animationComplete', { type: 'entrance', card: this.options });
    } catch (error) {
      console.error('Card entrance animation failed:', error);
    }
  }
  
  /**
   * Override render to include entrance animation
   */
  async render(container) {
    // Call parent render
    super.render(container);
    
    // Trigger entrance animation
    if (this.options.enableAnimations !== false) {
      await this.animateIn(this.options.animationOptions);
    }
    
    return this;
  }
  
  /**
   * Create a card wrapper that can be used as a link
   * @param {Object} options - Card options
   * @param {string} linkUrl - URL for the link
   * @returns {string} - HTML for linked card
   */
  static createLinkedCard(options, linkUrl) {
    const card = new Card(options);
    return `
      <a href="${linkUrl}" class="feature-card-link">
        ${card.generateHTML()}
      </a>
    `;
  }
  
  /**
   * Create multiple cards with staggered entrance animations
   * @param {Array} cardsData - Array of card configuration objects
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Animation options
   * @returns {Promise<Array>} - Array of Card instances
   */
  static async createStaggeredCards(cardsData, container, options = {}) {
    if (!cardsData || !cardsData.length) {
      return [];
    }
    
    const {
      staggerDelay = 100,
      animationType = 'fadeInUp',
      enableAnimations = true
    } = options;
    
    // Create card instances
    const cards = cardsData.map((cardData) => {
      const card = new Card({
        ...cardData,
        enableAnimations: false // We'll handle animations manually
      });
      
      // Render without animation first
      card.render(container);
      
      return card;
    });
    
    // Apply staggered entrance animations
    if (enableAnimations && animationManager.shouldAnimate()) {
      try {
        const cardElements = cards.map(card => card.element);
        await animationManager.staggerIn(cardElements, animationType, {
          staggerDelay,
          duration: 400,
          easing: 'easeOut'
        });
      } catch (error) {
        console.error('Staggered card animation failed:', error);
      }
    }
    
    return cards;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Card;
} else {
  window.Card = Card;
}

// ES module export
export default Card;
