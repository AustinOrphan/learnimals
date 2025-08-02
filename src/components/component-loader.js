// Component Loader
// Loads all components in the correct order for non-module environments

(function () {
  'use strict';

  // Base Component - simplified version for non-module environments
  class BaseComponent {
    constructor(options = {}) {
      this.options = {
        id: options.id || this.generateId(),
        cssClasses: options.cssClasses || [],
        container: options.container || null,
        attributes: options.attributes || {},
        ...options,
      };

      this.element = null;
      this.isRendered = false;
      this.eventListeners = new Map();
    }

    generateId() {
      const className = this.constructor.name.toLowerCase();
      return `${className}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateHTML() {
      throw new Error('generateHTML method must be implemented by subclass');
    }

    render(container) {
      const targetContainer = container || this.options.container;
      const containerEl =
        typeof targetContainer === 'string'
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
        this.applyAttributes();
        this.attachEventListeners();
        this.isRendered = true;
        this.onRender();
      }

      return this;
    }

    applyAttributes() {
      if (!this.element) return;

      Object.entries(this.options.attributes).forEach(([key, value]) => {
        this.element.setAttribute(key, value);
      });
    }

    attachEventListeners() {
      // Default implementation - override in subclasses
    }

    onRender() {
      // Default implementation - override in subclasses
    }

    addEventListener(event, handler, selector) {
      if (!this.element) return;

      const wrappedHandler = selector
        ? e => {
          if (e.target.matches(selector)) {
            handler.call(this, e);
          }
        }
        : handler.bind(this);

      this.element.addEventListener(event, wrappedHandler);

      // Store for cleanup
      const key = `${event}-${selector || 'root'}`;
      if (!this.eventListeners.has(key)) {
        this.eventListeners.set(key, []);
      }
      this.eventListeners.get(key).push(wrappedHandler);
    }

    removeEventListeners(event) {
      if (!this.element) return;

      if (event) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
          listeners.forEach(handler => {
            this.element.removeEventListener(event.split('-')[0], handler);
          });
          this.eventListeners.delete(event);
        }
      } else {
        this.eventListeners.forEach((handlers, key) => {
          const eventName = key.split('-')[0];
          handlers.forEach(handler => {
            this.element.removeEventListener(eventName, handler);
          });
        });
        this.eventListeners.clear();
      }
    }

    show() {
      if (this.element) {
        this.element.style.display = '';
        this.element.removeAttribute('hidden');
      }
      return this;
    }

    hide() {
      if (this.element) {
        this.element.style.display = 'none';
      }
      return this;
    }

    addClass(...classes) {
      if (this.element) {
        this.element.classList.add(...classes);
      }
      return this;
    }

    removeClass(...classes) {
      if (this.element) {
        this.element.classList.remove(...classes);
      }
      return this;
    }

    emit(eventName, detail) {
      if (this.element) {
        const event = new CustomEvent(eventName, {
          detail,
          bubbles: true,
          cancelable: true,
        });
        this.element.dispatchEvent(event);
      }

      return this;
    }

    destroy() {
      if (this.element) {
        this.removeEventListeners();
        this.element.remove();
        this.element = null;
        this.isRendered = false;
      }

      return this;
    }
  }

  // Card Component
  class Card extends BaseComponent {
    constructor(options) {
      super({
        title: options.title || '',
        content: options.content || '',
        imageUrl: options.imageUrl || null,
        imageAlt: options.imageAlt || '',
        linkUrl: options.linkUrl || null,
        linkText: options.linkText || 'Learn More',
        theme: options.theme || 'default',
        ...options,
      });
    }

    generateHTML() {
      const { title, content, imageUrl, imageAlt, linkUrl, linkText, cssClasses, theme, id } =
        this.options;

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

    attachEventListeners() {
      // Add click event for card interactions
      this.addEventListener('click', this.handleCardClick, '.card-link');

      // Emit card events for external handling
      this.addEventListener('mouseenter', () => {
        this.emit('cardHover', { card: this.options });
      });
    }

    handleCardClick(event) {
      // Emit card click event for analytics or other tracking
      this.emit('cardClick', {
        card: this.options,
        linkUrl: this.options.linkUrl,
        event,
      });
    }

    static createLinkedCard(options, linkUrl) {
      const card = new Card(options);
      return `
        <a href="${linkUrl}" class="feature-card-link">
          ${card.generateHTML()}
        </a>
      `;
    }
  }

  // Modal Component
  class Modal extends BaseComponent {
    constructor(options) {
      super({
        title: options.title || '',
        content: options.content || '',
        confirmButtonText: options.confirmButtonText || 'OK',
        cancelButtonText: options.cancelButtonText || 'Cancel',
        onConfirm: options.onConfirm || null,
        onCancel: options.onCancel || null,
        onClose: options.onClose || null,
        showClose: options.showClose !== undefined ? options.showClose : true,
        size: options.size || 'medium',
        showConfirmButton:
          options.showConfirmButton !== undefined ? options.showConfirmButton : true,
        showCancelButton: options.showCancelButton !== undefined ? options.showCancelButton : false,
        ...options,
      });

      this.isOpen = false;
    }

    generateHTML() {
      const {
        id,
        title,
        content,
        confirmButtonText,
        cancelButtonText,
        showClose,
        size,
        showConfirmButton,
        showCancelButton,
      } = this.options;

      const sizeClass = `modal--${size}`;

      let html = `
        <div id="${id}" class="component modal-overlay" aria-hidden="true">
          <div class="modal ${sizeClass}" role="dialog" aria-labelledby="${id}-title" aria-modal="true">
            <div class="modal-header">
              <h3 id="${id}-title" class="modal-title">${title}</h3>
              ${showClose ? '<button class="modal-close component-button component-button--ghost" aria-label="Close">&times;</button>' : ''}
            </div>
            <div class="modal-content">
              ${content}
            </div>
      `;

      if (showConfirmButton || showCancelButton) {
        html += `
          <div class="modal-footer component-flex component-flex--between">
        `;

        if (showCancelButton) {
          html += `
            <button class="modal-cancel component-button component-button--outline">${cancelButtonText}</button>
          `;
        }

        if (showConfirmButton) {
          html += `
            <button class="modal-confirm component-button component-button--primary">${confirmButtonText}</button>
          `;
        }

        html += `
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;

      return html;
    }

    create() {
      if (!document.getElementById(this.options.id)) {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = this.generateHTML();

        document.body.appendChild(modalContainer.firstElementChild);

        this.element = document.getElementById(this.options.id);
        this.attachEventListeners();
      }

      return this;
    }

    attachEventListeners() {
      this.addEventListener('click', () => this.close(), '.modal-close');

      if (this.options.onConfirm) {
        this.addEventListener(
          'click',
          () => {
            this.options.onConfirm();
            this.close();
          },
          '.modal-confirm'
        );
      }

      if (this.options.onCancel) {
        this.addEventListener(
          'click',
          () => {
            this.options.onCancel();
            this.close();
          },
          '.modal-cancel'
        );
      }

      this.addEventListener('click', e => {
        if (e.target === this.element) {
          this.close();
        }
      });

      this.escapeHandler = e => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }

    open() {
      if (!this.element) {
        this.create();
      }

      this.element.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      this.isOpen = true;

      return this;
    }

    close() {
      if (this.element) {
        this.element.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        this.isOpen = false;

        if (this.options.onClose) {
          this.options.onClose();
        }
      }

      return this;
    }

    destroy() {
      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
      }

      if (this.isOpen) {
        document.body.classList.remove('modal-open');
      }

      this.isOpen = false;
      super.destroy();
    }
  }

  // Make components globally available
  window.BaseComponent = BaseComponent;
  window.Card = Card;
  window.Modal = Modal;

  // Also make them available under Learnimals namespace
  window.Learnimals = window.Learnimals || {};
  window.Learnimals.Components = {
    BaseComponent,
    Card,
    Modal,
  };

  // Dispatch event to indicate components are loaded
  document.dispatchEvent(
    new CustomEvent('componentsLoaded', {
      detail: { BaseComponent, Card, Modal },
    })
  );
})();
