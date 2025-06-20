// Card Component
// Reusable card component for consistent UI across the site

(function() {
  'use strict';

  // Use BaseComponent if available, otherwise create a minimal version
  const BaseComponent = window.BaseComponent || class {
    constructor(options = {}) {
      this.options = {
        id: options.id || this.generateId(),
        cssClasses: options.cssClasses || [],
        ...options
      };
      this.element = null;
      this.isRendered = false;
    }
    
    generateId() {
      const className = this.constructor.name.toLowerCase();
      return `${className}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    render(container) {
      const targetContainer = container || this.options.container;
      const containerEl = typeof targetContainer === 'string' 
        ? document.querySelector(targetContainer) 
        : targetContainer;
      
      if (!containerEl) {
        console.error('Container not found:', targetContainer);
        return this;
      }

      const html = this.generateHTML();
      containerEl.innerHTML += html;
      
      this.element = document.getElementById(this.options.id);
      
      if (this.element) {
        this.attachEventListeners();
        this.isRendered = true;
      }
      
      return this;
    }
    
    attachEventListeners() {}
    
    emit(eventName, detail) {
      if (this.element) {
        const event = new CustomEvent(eventName, {
          detail,
          bubbles: true,
          cancelable: true
        });
        this.element.dispatchEvent(event);
      }
      return this;
    }
  };

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
    const { title, content, imageUrl, imageAlt, linkUrl, linkText, cssClasses, theme, id } = this.options;
    
    // Build CSS classes
    const cardClasses = ['component', 'feature-card'];
    if (theme === 'alt') cardClasses.push('feature-card--alt');
    if (cssClasses && cssClasses.length) cardClasses.push(...cssClasses);
    
    let html = `<div id="${id}" class="${cardClasses.join(' ')}" role="article">`;
    
    // Add image if provided
    if (imageUrl) {
      html += `<div class="card-image">
        <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
      </div>`;
    }
    
    // Add title
    if (title) {
      html += `<h3 class="card-title">${title}</h3>`;
    }
    
    // Add content
    html += `<div class="card-content">${content}</div>`;
    
    // Add link if provided
    if (linkUrl) {
      html += `<a href="${linkUrl}" class="card-link component-button component-button--primary">${linkText}</a>`;
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
    
    // Emit card events for external handling
    this.addEventListener('mouseenter', () => {
      this.emit('cardHover', { card: this.options });
    });
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
}

  // Export for module usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Card;
  } else {
    window.Card = Card;
  }

})();
