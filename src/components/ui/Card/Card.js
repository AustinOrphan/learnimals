/**
 * Card Component V2 - Restructured with Co-located CSS Pattern
 * Implements FR-1.1 (CSS co-location), FR-1.2 (naming convention), FR-4.1 (backward compatibility)
 * Migrated to use BaseComponentV2 with enhanced CSS architecture
 */

import BaseComponent from '../../BaseComponentV2.js';

class Card extends BaseComponent {
  // Static component metadata (FR-1.3: Component manifests MUST reference their CSS files)
  static version = '2.0.0';
  static description = 'Reusable card component for consistent UI across the site';
  static dependencies = [];
  static css = ['Card.css']; // FR-1.2: CSS files MUST follow naming convention ComponentName.css
  static themes = ['default', 'alt', 'ocean', 'forest', 'space'];

  /**
   * Create a card component
   * @param {Object} options - Card options
   * @param {string} options.title - Card title
   * @param {string} options.content - Card content (can be HTML)
   * @param {string} [options.imageUrl] - Optional image URL
   * @param {string} [options.imageAlt] - Image alt text
   * @param {string} [options.linkUrl] - Optional link URL
   * @param {string} [options.linkText] - Link text
   * @param {string} [options.theme] - Card theme (default, alt)
   * @param {boolean} [options.elevated] - Whether card should have elevation shadow
   * @param {string} [options.size] - Card size (small, medium, large)
   */
  constructor(options = {}) {
    // Merge component-specific options with base options
    const cardOptions = {
      title: options.title || '',
      content: options.content || '',
      imageUrl: options.imageUrl || null,
      imageAlt: options.imageAlt || '',
      linkUrl: options.linkUrl || null,
      linkText: options.linkText || 'Learn More',
      theme: options.theme || 'default',
      elevated: options.elevated || false,
      size: options.size || 'medium',
      ...options,
    };

    super(cardOptions);
  }

  /**
   * Get component path for manifest loading (FR-1.1: CSS file co-location)
   * @private
   * @returns {string} - Component directory path for CSS resolution
   */
  getComponentPath() {
    // Return the component directory path for proper CSS file resolution
    return '/src/components/ui/Card';
  }

  /**
   * Called after component initialization
   */
  onInitialized() {
    // Component is ready, dependencies loaded, CSS automatically injected via BaseComponentV2
    console.debug(`Card component '${this.options.title}' initialized with co-located CSS`);
  }

  /**
   * Generate card HTML using theme-aware colors
   * @returns {string} - Card HTML
   */
  generateHTML() {
    const { title, content, imageUrl, imageAlt, linkUrl, linkText, cssClasses, theme, elevated, size, id } = this.options;

    // Build CSS classes with theme awareness and BEM naming pattern
    const cardClasses = ['component', 'card'];
    
    // Add theme classes
    cardClasses.push(`card--${theme}`);
    
    // Add size modifier
    if (size !== 'medium') {
      cardClasses.push(`card--${size}`);
    }
    
    // Add elevation
    if (elevated) {
      cardClasses.push('card--elevated');
    }
    
    // Add user-defined classes
    if (cssClasses && cssClasses.length) {
      cardClasses.push(...cssClasses);
    }

    let html = `<div id="${id}" class="${cardClasses.join(' ')}" role="article">`;

    // Add image if provided
    if (imageUrl) {
      html += `
        <div class="card__image">
          <img src="${imageUrl}" alt="${imageAlt}" loading="lazy" class="card__img">
        </div>`;
    }

    // Card body content
    html += '<div class="card__body">';

    // Add title
    if (title) {
      html += `<h3 class="card__title">${title}</h3>`;
    }

    // Add content
    if (content) {
      html += `<div class="card__content">${content}</div>`;
    }

    html += '</div>'; // End card body

    // Add footer with link if provided
    if (linkUrl) {
      html += `
        <div class="card__footer">
          <a href="${linkUrl}" class="card__link btn btn--primary">${linkText}</a>
        </div>`;
    }

    html += '</div>';

    return html;
  }

  /**
   * Attach event listeners to the card
   */
  attachEventListeners() {
    if (!this.element) return;

    // Add click event for card links
    this.addEventListener('click', this.handleCardClick, '.card__link');

    // Add hover events for interaction feedback
    this.addEventListener('mouseenter', this.handleCardHover);
    this.addEventListener('mouseleave', this.handleCardLeave);

    // Add keyboard navigation support
    this.addEventListener('keydown', this.handleCardKeydown);
  }

  /**
   * Handle card link clicks
   * @param {Event} event - Click event
   */
  handleCardClick(event) {
    // Emit card click event for analytics or other tracking
    this.emit('card:click', {
      title: this.options.title,
      linkUrl: this.options.linkUrl,
      timestamp: Date.now(),
      event,
    });

    // Log for debugging
    console.debug(`Card clicked: ${this.options.title}`);
  }

  /**
   * Handle card hover
   * @param {Event} event - Mouse enter event
   */
  handleCardHover(event) {
    this.addClass('card--hover');
    
    this.emit('card:hover', {
      title: this.options.title,
      action: 'enter',
      event,
    });
  }

  /**
   * Handle card hover leave
   * @param {Event} event - Mouse leave event
   */
  handleCardLeave(event) {
    this.removeClass('card--hover');
    
    this.emit('card:hover', {
      title: this.options.title,
      action: 'leave',
      event,
    });
  }

  /**
   * Handle keyboard navigation
   * @param {Event} event - Keydown event
   */
  handleCardKeydown(event) {
    // Handle Enter and Space for accessibility
    if ((event.key === 'Enter' || event.key === ' ') && this.options.linkUrl) {
      event.preventDefault();
      const link = this.element.querySelector('.card__link');
      if (link) {
        link.click();
      }
    }
  }

  /**
   * Called when theme changes - update theme-specific styling
   */
  onThemeChange() {
    super.onThemeChange(); // Apply base theme changes
    
    // Apply card-specific theme updates
    const currentTheme = this.getCurrentTheme();
    const semanticColors = this.getSemanticColors();
    
    // Update any dynamic theme-dependent content
    if (this.element) {
      // Example: Update card theme class
      const themeClasses = Array.from(this.element.classList).filter(cls => cls.startsWith('card--theme-'));
      themeClasses.forEach(cls => this.removeClass(cls));
      this.addClass(`card--theme-${currentTheme}`);
    }

    this.emit('card:themeChanged', {
      theme: currentTheme,
      colors: semanticColors,
    });
  }

  /**
   * Update card content dynamically
   * @param {Object} newContent - New content options
   * @param {boolean} [rerender=true] - Whether to re-render
   */
  updateContent(newContent, rerender = true) {
    const oldContent = { ...this.options };
    
    // Update options
    Object.assign(this.options, newContent);
    
    // Re-render if requested
    if (rerender && this.isRendered) {
      this.rerender();
    }

    this.emit('card:contentUpdated', {
      oldContent,
      newContent: this.options,
    });

    return this;
  }

  /**
   * Get card data for external use
   * @returns {Object} - Card data
   */
  getCardData() {
    return {
      id: this.options.id,
      title: this.options.title,
      content: this.options.content,
      imageUrl: this.options.imageUrl,
      linkUrl: this.options.linkUrl,
      theme: this.options.theme,
      isRendered: this.isRendered,
    };
  }

  /**
   * Create a linked card wrapper (static method)
   * @param {Object} options - Card options
   * @param {string} linkUrl - URL for the link
   * @returns {string} - HTML for linked card
   */
  static createLinkedCard(options, linkUrl) {
    const cardOptions = { ...options, linkUrl };
    const card = new Card(cardOptions);
    return card.generateHTML();
  }

  /**
   * Create multiple cards from data array (static method)
   * @param {Array} cardsData - Array of card options
   * @param {HTMLElement|string} container - Container to render into
   * @returns {Card[]} - Array of created card instances
   */
  static createCards(cardsData, container) {
    const cards = [];
    
    for (const cardData of cardsData) {
      const card = new Card(cardData);
      cards.push(card);
      card.render(container);
    }

    return cards;
  }
}

// Export ES module
export default Card;

// Also make available globally for backward compatibility (FR-4.1)
if (typeof window !== 'undefined') {
  window.Card = Card;
  // Maintain backward compatibility with CardV2 name
  window.CardV2 = Card;
}