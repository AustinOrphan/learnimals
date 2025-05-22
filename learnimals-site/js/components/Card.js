// Card Component
// Reusable card component for consistent UI across the site

class Card {
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
    this.options = {
      title: options.title || '',
      content: options.content || '',
      imageUrl: options.imageUrl || null,
      imageAlt: options.imageAlt || '',
      linkUrl: options.linkUrl || null,
      linkText: options.linkText || 'Learn More',
      cssClasses: options.cssClasses || [],
      theme: options.theme || 'default',
      id: options.id || `card-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Render the card to a container element
   * @param {HTMLElement|string} container - Container element or selector
   */
  render(container) {
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!containerEl) {
      console.error('Container not found:', container);
      return;
    }

    const cardHTML = this.generateHTML();
    containerEl.innerHTML += cardHTML;
    
    // Add any event listeners after rendering
    this.attachEventListeners();
    
    return this;
  }

  /**
   * Generate card HTML
   * @returns {string} - Card HTML
   */
  generateHTML() {
    const { title, content, imageUrl, imageAlt, linkUrl, linkText, cssClasses, theme, id } = this.options;
    
    // Build CSS classes
    const cardClasses = ['feature-card'];
    if (theme === 'alt') cardClasses.push('alt');
    if (cssClasses.length) cardClasses.push(...cssClasses);
    
    let html = `<div id="${id}" class="${cardClasses.join(' ')}">`;
    
    // Add image if provided
    if (imageUrl) {
      html += `<div class="card-image">
        <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
      </div>`;
    }
    
    // Add title
    if (title) {
      html += `<h3>${title}</h3>`;
    }
    
    // Add content
    html += `<div class="card-content">${content}</div>`;
    
    // Add link if provided
    if (linkUrl) {
      html += `<a href="${linkUrl}" class="card-link">${linkText}</a>`;
    }
    
    html += '</div>';
    
    return html;
  }

  /**
   * Attach event listeners to the card
   */
  attachEventListeners() {
    // Find the card element
    const cardElement = document.getElementById(this.options.id);
    if (!cardElement) return;
    
    // You can add event listeners here if needed
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
