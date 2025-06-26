/**
 * @fileoverview Card Component - Reusable card component for consistent UI across the site
 * @module Card
 * @requires BaseComponent
 * @version 1.0.0
 * @author Learnimals Development Team
 * @since 1.0.0
 */

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

  /**
   * Card component for creating consistent, reusable card layouts across the application.
   * Supports various configurations including images, links, and different themes.
   * Automatically handles accessibility features and event emission.
   * 
   * @class Card
   * @extends BaseComponent
   * @example
   * // Basic card with title and content
   * const basicCard = new Card({
   *   title: 'Learning Math',
   *   content: '<p>Explore numbers and equations with fun activities!</p>'
   * });
   * basicCard.render('#cards-container');
   * 
   * @example
   * // Card with image and link
   * const linkedCard = new Card({
   *   title: 'Science Adventures',
   *   content: '<p>Discover the wonders of science through experiments.</p>',
   *   imageUrl: '/images/science-lab.jpg',
   *   imageAlt: 'Science laboratory with beakers and equipment',
   *   linkUrl: '/subjects/science.html',
   *   linkText: 'Start Learning',
   *   theme: 'alt'
   * });
   * linkedCard.render(document.querySelector('.features-grid'));
   * 
   * @example
   * // Static linked card (no JS instance needed)
   * const cardHTML = Card.createLinkedCard({
   *   title: 'Quick Link',
   *   content: 'Simple card content'
   * }, '/destination.html');
   * container.innerHTML = cardHTML;
   */
  class Card extends BaseComponent {
    /**
     * Creates a new Card instance with the specified configuration.
     * The card is not automatically rendered - call render() to display it.
     * 
     * @param {Object} options - Configuration options for the card
     * @param {string} options.title - Title text displayed in the card header
     * @param {string} options.content - HTML content for the card body (supports any valid HTML)
     * @param {string} [options.imageUrl] - URL for optional card image
     * @param {string} [options.imageAlt=''] - Alt text for the card image (required for accessibility)
     * @param {string} [options.linkUrl] - URL for optional card link button
     * @param {string} [options.linkText='Learn More'] - Text for the link button
     * @param {string[]} [options.cssClasses=[]] - Additional CSS classes to apply to the card
     * @param {('default'|'alt')} [options.theme='default'] - Visual theme variant for the card
     * @param {string} [options.id] - Custom ID for the card element (auto-generated if not provided)
     * 
     * @example
     * const educationalCard = new Card({
     *   title: 'Mathematics with Max',
     *   content: '<p>Join Max the Monkey for exciting math adventures!</p>',
     *   imageUrl: '/images/max-monkey.png',
     *   imageAlt: 'Max the Monkey character',
     *   linkUrl: '/subjects/math.html',
     *   linkText: 'Explore Math',
     *   theme: 'default',
     *   cssClasses: ['featured-card', 'math-theme']
     * });
     */
    constructor(options) {
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
     * Generates the complete HTML structure for the card.
     * Creates a semantically correct article element with optional image,
     * title, content, and link components.
     * 
     * @returns {string} Complete HTML string for the card element
     * 
     * @example
     * const card = new Card({
     *   title: 'Test Card',
     *   content: '<p>Test content</p>',
     *   linkUrl: '/test'
     * });
     * const html = card.generateHTML();
     * // Returns: '<div id="card-xxx" class="component feature-card" role="article">...'
     * 
     * @private
     */
    generateHTML() {
      const { title, content, imageUrl, imageAlt, linkUrl, linkText, cssClasses, theme, id } = this.options;

      // Build CSS classes
      const cardClasses = ['component', 'feature-card'];
      if (theme === 'alt') {cardClasses.push('feature-card--alt');}
      if (cssClasses && cssClasses.length) {cardClasses.push(...cssClasses);}

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
     * Attaches event listeners to the card for user interactions.
     * Sets up click handlers for links and hover events for analytics.
     * Automatically emits custom events for external handling.
     * 
     * @example
     * // Event listeners are automatically attached during render()
     * card.render('#container');
     * 
     * // Listen for card events
     * document.addEventListener('cardClick', (event) => {
     *   console.log('Card clicked:', event.detail.card.title);
     * });
     * 
     * @private
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
     * Handles click events on card links.
     * Emits a 'cardClick' custom event with card data for analytics
     * and external event handling.
     * 
     * @param {Event} event - The click event object
     * 
     * @example
     * // Listen for card click events
     * document.addEventListener('cardClick', (event) => {
     *   const { card, linkUrl } = event.detail;
     *   analytics.track('card_clicked', {
     *     title: card.title,
     *     url: linkUrl
     *   });
     * });
     * 
     * @private
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
     * Static method to create a linked card without instantiating the class.
     * Wraps the entire card in a link element for full-card clickability.
     * Useful for simple cards that don't need event handling or lifecycle management.
     * 
     * @static
     * @param {Object} options - Card configuration options (same as constructor)
     * @param {string} options.title - Card title
     * @param {string} options.content - Card content HTML
     * @param {string} [options.imageUrl] - Optional image URL
     * @param {string} [options.imageAlt] - Image alt text
     * @param {string} [options.theme] - Card theme variant
     * @param {string[]} [options.cssClasses] - Additional CSS classes
     * @param {string} linkUrl - URL that the entire card should link to
     * @returns {string} Complete HTML string for the linked card
     * 
     * @example
     * // Create a simple linked card
     * const cardHTML = Card.createLinkedCard({
     *   title: 'Quick Navigation',
     *   content: '<p>Click anywhere on this card to navigate.</p>',
     *   theme: 'alt'
     * }, '/destination.html');
     * 
     * container.innerHTML += cardHTML;
     * 
     * @example
     * // Generate multiple navigation cards
     * const navigationCards = subjects.map(subject =>
     *   Card.createLinkedCard({
     *     title: subject.name,
     *     content: `<p>${subject.description}</p>`,
     *     imageUrl: subject.image
     *   }, subject.url)
     * ).join('');
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

  /**
   * Export Card component for both CommonJS and browser environments.
   * In browser environments, Card is attached to the global window object.
   * In Node.js/CommonJS environments, Card is exported as a module.
   */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Card;
  } else {
    window.Card = Card;
  }

})();
