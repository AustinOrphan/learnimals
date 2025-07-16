/**
 * Event Delegation Utility
 * 
 * Provides CSP-compliant event delegation infrastructure for components.
 * Based on modern JavaScript patterns and security best practices.
 * 
 * Features:
 * - Type-safe event delegation with data attributes
 * - Automatic cleanup and memory leak prevention
 * - Support for nested elements and event bubbling
 * - CSP-compliant (no inline handlers required)
 * - Reusable across components
 */

export default class EventDelegation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      stopPropagation: options.stopPropagation || false,
      preventDefault: options.preventDefault || false,
      ...options
    };
    
    // Event handler registry
    this.handlers = new Map();
    
    // Bound methods for cleanup
    this.boundHandlers = new Map();
    
    this.isInitialized = false;
  }

  /**
   * Initialize event delegation for specified event types
   * @param {string[]} eventTypes - Array of event types to delegate (e.g., ['click', 'input', 'change'])
   */
  init(eventTypes = ['click']) {
    if (this.isInitialized) {
      console.warn('EventDelegation already initialized');
      return;
    }

    eventTypes.forEach(eventType => {
      const boundHandler = this.createDelegatedHandler(eventType).bind(this);
      this.boundHandlers.set(eventType, boundHandler);
      this.container.addEventListener(eventType, boundHandler);
    });

    this.isInitialized = true;
  }

  /**
   * Register a handler for elements with specific data attributes
   * @param {string} selector - CSS selector or data attribute pattern
   * @param {Function} handler - Handler function
   * @param {Object} options - Handler options
   */
  on(selector, handler, options = {}) {
    if (!this.handlers.has(selector)) {
      this.handlers.set(selector, []);
    }
    
    const handlerConfig = {
      handler,
      once: options.once || false,
      stopPropagation: options.stopPropagation || this.options.stopPropagation,
      preventDefault: options.preventDefault || this.options.preventDefault,
      condition: options.condition || null
    };
    
    this.handlers.get(selector).push(handlerConfig);
  }

  /**
   * Remove a specific handler
   * @param {string} selector - CSS selector or data attribute pattern
   * @param {Function} handler - Handler function to remove
   */
  off(selector, handler) {
    if (!this.handlers.has(selector)) return;
    
    const handlers = this.handlers.get(selector);
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      
      // Clean up empty handler arrays
      if (handlers.length === 0) {
        this.handlers.delete(selector);
      }
    }
  }

  /**
   * Register action-based handlers using data-action attributes
   * @param {string} action - Action name (data-action value)
   * @param {Function} handler - Handler function
   * @param {Object} options - Handler options
   */
  onAction(action, handler, options = {}) {
    this.on(`[data-action="${action}"]`, handler, options);
  }

  /**
   * Register handlers for form elements by type
   * @param {string} inputType - Input type or form element type
   * @param {Function} handler - Handler function
   * @param {Object} options - Handler options
   */
  onInput(inputType, handler, options = {}) {
    this.on(`input[type="${inputType}"], ${inputType}`, handler, options);
  }

  /**
   * Register handlers for elements with specific CSS classes
   * @param {string} className - CSS class name
   * @param {Function} handler - Handler function
   * @param {Object} options - Handler options
   */
  onClass(className, handler, options = {}) {
    this.on(`.${className}`, handler, options);
  }

  /**
   * Create delegated event handler for a specific event type
   * @param {string} eventType - Event type (click, input, change, etc.)
   * @returns {Function} Delegated event handler
   */
  createDelegatedHandler(_eventType) {
    return (event) => {
      const target = event.target;
      
      // Find matching handlers by iterating through registered selectors
      for (const [selector, handlerConfigs] of this.handlers) {
        const matchingElement = this.findMatchingElement(target, selector);
        
        if (matchingElement && this.container.contains(matchingElement)) {
          // Execute all matching handlers
          handlerConfigs.forEach((config, index) => {
            // Check condition if provided
            if (config.condition && !config.condition(event, matchingElement)) {
              return;
            }

            // Apply handler options
            if (config.preventDefault) {
              event.preventDefault();
            }
            
            if (config.stopPropagation) {
              event.stopPropagation();
            }

            // Create enhanced event object
            const enhancedEvent = this.enhanceEvent(event, matchingElement);

            try {
              // Execute handler
              config.handler(enhancedEvent, matchingElement);
              
              // Remove if once: true
              if (config.once) {
                handlerConfigs.splice(index, 1);
              }
            } catch (error) {
              console.error(`Event handler error for selector "${selector}":`, error);
            }
          });

          // Clean up empty handler arrays
          if (handlerConfigs.length === 0) {
            this.handlers.delete(selector);
          }
        }
      }
    };
  }

  /**
   * Find element matching selector, walking up the DOM tree
   * @param {Element} target - Starting element
   * @param {string} selector - CSS selector or data attribute pattern
   * @returns {Element|null} Matching element or null
   */
  findMatchingElement(target, selector) {
    let current = target;
    
    while (current && current !== this.container) {
      if (current.matches && current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }

  /**
   * Enhance event object with additional data and utilities
   * @param {Event} event - Original event
   * @param {Element} matchingElement - Element that matched the selector
   * @returns {Object} Enhanced event object
   */
  enhanceEvent(event, matchingElement) {
    return {
      ...event,
      originalEvent: event,
      delegateTarget: matchingElement,
      data: this.extractElementData(matchingElement),
      getValue: () => this.getElementValue(matchingElement),
      getFormData: () => this.getFormData(matchingElement)
    };
  }

  /**
   * Extract data attributes from element
   * @param {Element} element - Target element
   * @returns {Object} Data attributes as object
   */
  extractElementData(element) {
    const data = {};
    
    if (element.dataset) {
      for (const [key, value] of Object.entries(element.dataset)) {
        // Convert data attributes to camelCase and parse JSON if possible
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    }
    
    return data;
  }

  /**
   * Get value from form element
   * @param {Element} element - Form element
   * @returns {any} Element value
   */
  getElementValue(element) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked;
    }
    
    if (element.type === 'number' || element.type === 'range') {
      return parseFloat(element.value) || 0;
    }
    
    return element.value || element.textContent || '';
  }

  /**
   * Get form data from form or form element
   * @param {Element} element - Form element or element within a form
   * @returns {Object} Form data as object
   */
  getFormData(element) {
    const form = element.closest('form');
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  /**
   * Clean up all event listeners and handlers
   */
  destroy() {
    // Remove all event listeners
    for (const [eventType, boundHandler] of this.boundHandlers) {
      this.container.removeEventListener(eventType, boundHandler);
    }
    
    // Clear all references
    this.handlers.clear();
    this.boundHandlers.clear();
    this.isInitialized = false;
  }

  /**
   * Static factory method for quick setup
   * @param {Element} container - Container element
   * @param {Object} config - Configuration object
   * @returns {EventDelegation} Configured EventDelegation instance
   */
  static create(container, config = {}) {
    const { eventTypes = ['click'], handlers = {}, ...options } = config;
    
    const delegation = new EventDelegation(container, options);
    delegation.init(eventTypes);
    
    // Register provided handlers
    for (const [selector, handler] of Object.entries(handlers)) {
      delegation.on(selector, handler);
    }
    
    return delegation;
  }
}

/**
 * Convenience function for creating simple event delegation
 * @param {Element} container - Container element
 * @param {Object} handlers - Handler configuration
 * @param {Object} options - Options
 * @returns {EventDelegation} EventDelegation instance
 */
export function createEventDelegation(container, handlers = {}, options = {}) {
  return EventDelegation.create(container, { handlers, ...options });
}

/**
 * Action-based event delegation helper
 * @param {Element} container - Container element
 * @param {Object} actions - Action handlers (key: action name, value: handler)
 * @param {Object} options - Options
 * @returns {EventDelegation} EventDelegation instance
 */
export function createActionDelegation(container, actions = {}, options = {}) {
  const delegation = new EventDelegation(container, options);
  delegation.init(['click']);
  
  for (const [action, handler] of Object.entries(actions)) {
    delegation.onAction(action, handler);
  }
  
  return delegation;
}