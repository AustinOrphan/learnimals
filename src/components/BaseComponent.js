// Base Component Class
// Provides common functionality and patterns for all Learnimals components

class BaseComponent {
  /**
   * Create a base component
   * @param {Object} options - Component options
   * @param {string} [options.id] - Component ID (auto-generated if not provided)
   * @param {string[]} [options.cssClasses] - Additional CSS classes
   * @param {HTMLElement|string} [options.container] - Container element or selector
   * @param {Object} [options.attributes] - HTML attributes to set on the component
   */
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

  /**
   * Generate a unique ID for the component
   * @returns {string} - Generated ID
   */
  generateId() {
    const className = this.constructor.name.toLowerCase();
    return `${className}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate component HTML - to be implemented by subclasses
   * @returns {string} - Component HTML
   */
  generateHTML() {
    throw new Error('generateHTML method must be implemented by subclass');
  }

  /**
   * Render the component to a container
   * @param {HTMLElement|string} [container] - Container element or selector
   * @returns {BaseComponent} - Returns this for chaining
   */
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

    // Generate and insert HTML
    const html = this.generateHTML();
    containerEl.innerHTML += html;

    // Store reference to the element
    this.element = document.getElementById(this.options.id);

    if (this.element) {
      this.applyAttributes();
      this.attachEventListeners();
      this.isRendered = true;
      this.onRender();
    }

    return this;
  }

  /**
   * Apply attributes to the component element
   */
  applyAttributes() {
    if (!this.element) return;

    Object.entries(this.options.attributes).forEach(([key, value]) => {
      this.element.setAttribute(key, value);
    });
  }

  /**
   * Attach event listeners to the component - to be implemented by subclasses
   */
  attachEventListeners() {
    // Default implementation - override in subclasses
  }

  /**
   * Called after component is rendered - can be overridden by subclasses
   */
  onRender() {
    // Default implementation - override in subclasses
  }

  /**
   * Add an event listener to the component (alias for addEventListener)
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {string} [selector] - Optional selector for event delegation
   */
  on(event, handler, selector) {
    return this.addEventListener(event, handler, selector);
  }

  /**
   * Remove event listeners (alias for removeEventListeners)
   * @param {string} event - Event name
   * @param {Function} [handler] - Specific handler to remove
   */
  off(event, handler) {
    if (handler && this.element) {
      // Remove specific handler - need to find the wrapped handler
      const key = `${event}-root`;
      const listeners = this.eventListeners.get(key);
      if (listeners && Array.isArray(listeners)) {
        // Find and remove the specific handler
        const index = listeners.findIndex(
          wrappedHandler => wrappedHandler === handler || wrappedHandler.originalHandler === handler
        );
        if (index !== -1) {
          const wrappedHandler = listeners[index];
          this.element.removeEventListener(event, wrappedHandler);
          listeners.splice(index, 1);
          if (listeners.length === 0) {
            this.eventListeners.delete(key);
          }
        }
      }
    } else {
      // Remove all handlers for this event
      this.removeEventListeners(event);
    }
    return this;
  }

  /**
   * Add an event listener to the component
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {string} [selector] - Optional selector for event delegation
   */
  addEventListener(event, handler, selector) {
    if (!this.element) return;

    const wrappedHandler = selector
      ? e => {
        if (e.target.matches(selector)) {
          handler.call(this, e);
        }
      }
      : handler.bind(this);

    // Store reference to original handler for removal
    wrappedHandler.originalHandler = handler;

    this.element.addEventListener(event, wrappedHandler);

    // Store for cleanup
    const key = `${event}-${selector || 'root'}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push(wrappedHandler);
  }

  /**
   * Remove event listeners
   * @param {string} [event] - Specific event to remove (removes all if not specified)
   */
  removeEventListeners(event) {
    if (!this.element) return;

    if (event) {
      // Remove specific event
      const listeners = this.eventListeners.get(event);
      if (listeners && Array.isArray(listeners)) {
        listeners.forEach(handler => {
          try {
            if (this.element && typeof this.element.removeEventListener === 'function') {
              this.element.removeEventListener(event.split('-')[0], handler);
            }
          } catch (error) {
            console.warn(`Error removing event listener for ${event}:`, error);
          }
        });
        this.eventListeners.delete(event);
      }
    } else {
      // Remove all events
      this.eventListeners.forEach((handlers, key) => {
        if (handlers && Array.isArray(handlers)) {
          const eventName = key.split('-')[0];
          handlers.forEach(handler => {
            try {
              if (this.element && typeof this.element.removeEventListener === 'function') {
                this.element.removeEventListener(eventName, handler);
              }
            } catch (error) {
              console.warn(`Error removing event listener for ${eventName}:`, error);
            }
          });
        }
      });
      this.eventListeners.clear();
    }
  }

  /**
   * Update component options and re-render if necessary
   * @param {Object} newOptions - New options to merge
   * @param {boolean} [rerender=false] - Whether to re-render the component
   */
  update(newOptions, rerender = false) {
    Object.assign(this.options, newOptions);

    if (rerender && this.isRendered) {
      this.destroy();
      this.render();
    }

    return this;
  }

  /**
   * Show the component
   */
  show() {
    if (this.element) {
      this.element.style.display = '';
      this.element.removeAttribute('hidden');
    }
    return this;
  }

  /**
   * Hide the component
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
    return this;
  }

  /**
   * Toggle component visibility
   */
  toggle() {
    if (this.element) {
      const isHidden = this.element.style.display === 'none' || this.element.hasAttribute('hidden');
      return isHidden ? this.show() : this.hide();
    }
    return this;
  }

  /**
   * Add CSS classes to the component
   * @param {...string} classes - Classes to add
   */
  addClass(...classes) {
    if (this.element) {
      this.element.classList.add(...classes);
    }
    return this;
  }

  /**
   * Remove CSS classes from the component
   * @param {...string} classes - Classes to remove
   */
  removeClass(...classes) {
    if (this.element) {
      this.element.classList.remove(...classes);
    }
    return this;
  }

  /**
   * Toggle CSS class on the component
   * @param {string} className - Class to toggle
   * @param {boolean} [force] - Force add/remove
   */
  toggleClass(className, force) {
    if (this.element) {
      return this.element.classList.toggle(className, force);
    }
    return false;
  }

  /**
   * Check if component has a CSS class
   * @param {string} className - Class to check
   * @returns {boolean} - Whether the class exists
   */
  hasClass(className) {
    return this.element ? this.element.classList.contains(className) : false;
  }

  /**
   * Get the component element
   * @returns {HTMLElement|null} - The component element
   */
  getElement() {
    return this.element;
  }

  /**
   * Get component option value
   * @param {string} key - Option key
   * @returns {*} - Option value
   */
  getOption(key) {
    return this.options[key];
  }

  /**
   * Set component option value
   * @param {string} key - Option key
   * @param {*} value - Option value
   */
  setOption(key, value) {
    this.options[key] = value;
    return this;
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (this.element) {
      // Remove event listeners with error handling
      try {
        this.removeEventListeners();
      } catch (error) {
        console.warn('Error removing event listeners during destroy:', error);
      }

      // Remove element from DOM with defensive check
      try {
        if (this.element && typeof this.element.remove === 'function') {
          this.element.remove();
        } else if (this.element && this.element.parentNode) {
          // Fallback for older browsers
          this.element.parentNode.removeChild(this.element);
        }
      } catch (error) {
        console.warn('Error removing element from DOM:', error);
      }

      this.element = null;
      this.isRendered = false;
    }

    return this;
  }

  /**
   * Emit a custom event from the component
   * @param {string} eventName - Event name
   * @param {*} [detail] - Event detail data
   */
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

  /**
   * Create element with common patterns
   * @param {string} tag - HTML tag
   * @param {Object} [options] - Element options
   * @param {string} [options.className] - CSS class
   * @param {string} [options.innerHTML] - Inner HTML
   * @param {Object} [options.attributes] - HTML attributes
   * @returns {HTMLElement} - Created element
   */
  static createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
      element.className = options.className;
    }

    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    return element;
  }
}

// Export for ES modules
export default BaseComponent;

// Also make available globally for non-module script tags
if (typeof window !== 'undefined') {
  window.BaseComponent = BaseComponent;
}

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseComponent;
}
