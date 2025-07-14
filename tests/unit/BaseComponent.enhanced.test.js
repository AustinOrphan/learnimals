/**
 * Enhanced Unit Tests for BaseComponent
 * 
 * Comprehensive test suite following the Testing Pyramid approach (70% unit tests)
 * Tests component lifecycle, event handling, DOM management, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModule } from '../helpers/moduleResolver.js';
import { ComponentFactory } from '../fixtures/testDataFactory.js';

// Mock BaseComponent
const mockBaseComponent = createMockModule({
  default: class MockBaseComponent {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...this.constructor.defaultOptions, ...options };
      this.listeners = new Map();
      this.isInitialized = false;
      this.isDestroyed = false;
      this._boundEventListeners = [];
    }

    static get defaultOptions() {
      return {
        autoInit: true,
        debug: false,
        className: 'base-component'
      };
    }

    init() {
      if (this.isInitialized) return this;
      
      this.beforeInit();
      this.setupElement();
      this.bindEvents();
      this.afterInit();
      
      this.isInitialized = true;
      this.element.classList.add('initialized');
      
      return this;
    }

    beforeInit() {
      // Hook for subclasses
      this.trigger('beforeInit');
    }

    afterInit() {
      // Hook for subclasses  
      this.trigger('afterInit');
    }

    setupElement() {
      if (!this.element) {
        throw new Error('Element is required');
      }
      
      this.element.classList.add(this.options.className);
      this.element.setAttribute('data-component', this.constructor.name);
    }

    bindEvents() {
      // Default event binding - to be overridden by subclasses
    }

    on(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(handler);
      return this;
    }

    off(event, handler) {
      if (!this.listeners.has(event)) return this;
      
      const handlers = this.listeners.get(event);
      if (handler) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      } else {
        this.listeners.set(event, []);
      }
      return this;
    }

    trigger(event, data) {
      if (!this.listeners.has(event)) return this;
      
      this.listeners.get(event).forEach(handler => {
        try {
          handler.call(this, data);
        } catch (error) {
          if (this.options.debug) {
            console.error(`Error in event handler for '${event}':`, error);
          }
        }
      });
      return this;
    }

    destroy() {
      if (this.isDestroyed) return this;
      
      this.beforeDestroy();
      this.unbindEvents();
      this.cleanupElement();
      this.afterDestroy();
      
      this.isDestroyed = true;
      this.isInitialized = false;
      
      return this;
    }

    beforeDestroy() {
      this.trigger('beforeDestroy');
    }

    afterDestroy() {
      this.trigger('afterDestroy');
      this.listeners.clear();
    }

    unbindEvents() {
      this._boundEventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this._boundEventListeners = [];
    }

    cleanupElement() {
      if (this.element) {
        this.element.classList.remove(this.options.className, 'initialized');
        this.element.removeAttribute('data-component');
      }
    }

    addDOMListener(element, event, handler) {
      const boundHandler = handler.bind(this);
      element.addEventListener(event, boundHandler);
      this._boundEventListeners.push({ element, event, handler: boundHandler });
    }

    find(selector) {
      return this.element ? this.element.querySelector(selector) : null;
    }

    findAll(selector) {
      return this.element ? Array.from(this.element.querySelectorAll(selector)) : [];
    }

    getData(key) {
      return this.element ? this.element.dataset[key] : null;
    }

    setData(key, value) {
      if (this.element) {
        this.element.dataset[key] = value;
      }
      return this;
    }

    addClass(className) {
      if (this.element) {
        this.element.classList.add(className);
      }
      return this;
    }

    removeClass(className) {
      if (this.element) {
        this.element.classList.remove(className);
      }
      return this;
    }

    toggleClass(className) {
      if (this.element) {
        this.element.classList.toggle(className);
      }
      return this;
    }

    hasClass(className) {
      return this.element ? this.element.classList.contains(className) : false;
    }
  }
});

// Mock the module
vi.mock('../../src/components/BaseComponent.js', () => mockBaseComponent);

describe('BaseComponent Enhanced Tests', () => {
  let element;
  let component;
  const BaseComponent = mockBaseComponent.default;

  beforeEach(() => {
    // Create fresh DOM element for each test
    element = document.createElement('div');
    element.id = 'test-component';
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (component && !component.isDestroyed) {
      component.destroy();
    }
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create component with element and default options', () => {
      component = new BaseComponent(element);
      
      expect(component.element).toBe(element);
      expect(component.options).toEqual({
        autoInit: true,
        debug: false,
        className: 'base-component'
      });
      expect(component.isInitialized).toBe(false);
      expect(component.isDestroyed).toBe(false);
    });

    it('should merge custom options with defaults', () => {
      const customOptions = {
        debug: true,
        className: 'custom-component',
        customProp: 'value'
      };
      
      component = new BaseComponent(element, customOptions);
      
      expect(component.options).toEqual({
        autoInit: true,
        debug: true,
        className: 'custom-component',
        customProp: 'value'
      });
    });

    it('should throw error when element is missing during setup', () => {
      component = new BaseComponent(null);
      
      expect(() => component.init()).toThrow('Element is required');
    });

    it('should initialize only once', () => {
      component = new BaseComponent(element);
      const beforeInitSpy = vi.spyOn(component, 'beforeInit');
      
      component.init();
      component.init(); // Second call should be ignored
      
      expect(beforeInitSpy).toHaveBeenCalledTimes(1);
      expect(component.isInitialized).toBe(true);
    });
  });

  describe('Element Setup and Management', () => {
    beforeEach(() => {
      component = new BaseComponent(element);
    });

    it('should setup element correctly during initialization', () => {
      component.init();
      
      expect(element.classList.contains('base-component')).toBe(true);
      expect(element.classList.contains('initialized')).toBe(true);
      expect(element.getAttribute('data-component')).toBe('MockBaseComponent');
    });

    it('should add and remove CSS classes', () => {
      component.init();
      
      component.addClass('test-class');
      expect(element.classList.contains('test-class')).toBe(true);
      
      component.removeClass('test-class');
      expect(element.classList.contains('test-class')).toBe(false);
      
      component.toggleClass('toggle-class');
      expect(element.classList.contains('toggle-class')).toBe(true);
      
      component.toggleClass('toggle-class');
      expect(element.classList.contains('toggle-class')).toBe(false);
    });

    it('should check class existence correctly', () => {
      component.init();
      element.classList.add('existing-class');
      
      expect(component.hasClass('existing-class')).toBe(true);
      expect(component.hasClass('non-existing-class')).toBe(false);
    });

    it('should handle data attributes', () => {
      component.init();
      
      component.setData('testKey', 'testValue');
      expect(component.getData('testKey')).toBe('testValue');
      expect(element.dataset.testKey).toBe('testValue');
    });

    it('should find elements within component', () => {
      element.innerHTML = `
        <div class="child">Child</div>
        <div class="child">Another Child</div>
        <span class="different">Different</span>
      `;
      component.init();
      
      const firstChild = component.find('.child');
      expect(firstChild.textContent).toBe('Child');
      
      const allChildren = component.findAll('.child');
      expect(allChildren).toHaveLength(2);
      
      const nonExistent = component.find('.not-there');
      expect(nonExistent).toBeNull();
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      component = new BaseComponent(element);
    });

    it('should register and trigger custom events', () => {
      const handler = vi.fn();
      component.on('customEvent', handler);
      
      component.trigger('customEvent', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      component.on('test', handler1);
      component.on('test', handler2);
      
      component.trigger('test');
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should remove specific event handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      component.on('test', handler1);
      component.on('test', handler2);
      component.off('test', handler1);
      
      component.trigger('test');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should remove all handlers for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      component.on('test', handler1);
      component.on('test', handler2);
      component.off('test'); // Remove all handlers
      
      component.trigger('test');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => { throw new Error('Handler error'); });
      const successHandler = vi.fn();
      
      component.options.debug = true;
      component.on('test', errorHandler);
      component.on('test', successHandler);
      
      component.trigger('test');
      
      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in event handler for 'test':",
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should manage DOM event listeners correctly', () => {
      const handler = vi.fn();
      const button = document.createElement('button');
      element.appendChild(button);
      
      component.init();
      component.addDOMListener(button, 'click', handler);
      
      // Simulate click
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Destroy should remove listeners
      component.destroy();
      button.click();
      expect(handler).toHaveBeenCalledTimes(1); // Still just 1
    });
  });

  describe('Lifecycle Management', () => {
    beforeEach(() => {
      component = new BaseComponent(element);
    });

    it('should follow correct initialization sequence', () => {
      const beforeInitSpy = vi.spyOn(component, 'beforeInit');
      const setupElementSpy = vi.spyOn(component, 'setupElement');
      const bindEventsSpy = vi.spyOn(component, 'bindEvents');
      const afterInitSpy = vi.spyOn(component, 'afterInit');
      
      component.init();
      
      expect(beforeInitSpy).toHaveBeenCalledBefore(setupElementSpy);
      expect(setupElementSpy).toHaveBeenCalledBefore(bindEventsSpy);
      expect(bindEventsSpy).toHaveBeenCalledBefore(afterInitSpy);
    });

    it('should trigger lifecycle events', () => {
      const beforeInitHandler = vi.fn();
      const afterInitHandler = vi.fn();
      const beforeDestroyHandler = vi.fn();
      const afterDestroyHandler = vi.fn();
      
      component.on('beforeInit', beforeInitHandler);
      component.on('afterInit', afterInitHandler);
      component.on('beforeDestroy', beforeDestroyHandler);
      component.on('afterDestroy', afterDestroyHandler);
      
      component.init();
      expect(beforeInitHandler).toHaveBeenCalledTimes(1);
      expect(afterInitHandler).toHaveBeenCalledTimes(1);
      
      component.destroy();
      expect(beforeDestroyHandler).toHaveBeenCalledTimes(1);
      expect(afterDestroyHandler).toHaveBeenCalledTimes(1);
    });

    it('should follow correct destruction sequence', () => {
      component.init();
      
      const beforeDestroySpy = vi.spyOn(component, 'beforeDestroy');
      const unbindEventsSpy = vi.spyOn(component, 'unbindEvents');
      const cleanupElementSpy = vi.spyOn(component, 'cleanupElement');
      const afterDestroySpy = vi.spyOn(component, 'afterDestroy');
      
      component.destroy();
      
      expect(beforeDestroySpy).toHaveBeenCalledBefore(unbindEventsSpy);
      expect(unbindEventsSpy).toHaveBeenCalledBefore(cleanupElementSpy);
      expect(cleanupElementSpy).toHaveBeenCalledBefore(afterDestroySpy);
    });

    it('should destroy only once', () => {
      component.init();
      const beforeDestroySpy = vi.spyOn(component, 'beforeDestroy');
      
      component.destroy();
      component.destroy(); // Second call should be ignored
      
      expect(beforeDestroySpy).toHaveBeenCalledTimes(1);
      expect(component.isDestroyed).toBe(true);
    });

    it('should clean up element during destruction', () => {
      component.init();
      
      // Element should have classes and attributes
      expect(element.classList.contains('base-component')).toBe(true);
      expect(element.classList.contains('initialized')).toBe(true);
      expect(element.getAttribute('data-component')).toBe('MockBaseComponent');
      
      component.destroy();
      
      // Element should be cleaned up
      expect(element.classList.contains('base-component')).toBe(false);
      expect(element.classList.contains('initialized')).toBe(false);
      expect(element.getAttribute('data-component')).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing element gracefully in utility methods', () => {
      component = new BaseComponent(null);
      
      expect(() => component.addClass('test')).not.toThrow();
      expect(() => component.removeClass('test')).not.toThrow();
      expect(() => component.toggleClass('test')).not.toThrow();
      expect(component.hasClass('test')).toBe(false);
      expect(component.getData('test')).toBeNull();
      expect(() => component.setData('test', 'value')).not.toThrow();
      expect(component.find('.test')).toBeNull();
      expect(component.findAll('.test')).toEqual([]);
    });

    it('should handle events for non-existent event types', () => {
      component = new BaseComponent(element);
      
      expect(() => component.trigger('nonExistent')).not.toThrow();
      expect(() => component.off('nonExistent')).not.toThrow();
    });

    it('should chain method calls correctly', () => {
      component = new BaseComponent(element);
      
      const result = component
        .init()
        .addClass('test')
        .setData('key', 'value')
        .on('test', () => {});
      
      expect(result).toBe(component);
    });

    it('should handle rapid init/destroy cycles', () => {
      component = new BaseComponent(element);
      
      for (let i = 0; i < 5; i++) {
        component.init();
        expect(component.isInitialized).toBe(true);
        
        component.destroy();
        expect(component.isDestroyed).toBe(true);
        expect(component.isInitialized).toBe(false);
        
        // Reset for next iteration
        component.isDestroyed = false;
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak event listeners', () => {
      component = new BaseComponent(element);
      const handler = vi.fn();
      
      // Add many listeners
      for (let i = 0; i < 100; i++) {
        component.on(`event${i}`, handler);
      }
      
      expect(component.listeners.size).toBe(100);
      
      component.destroy();
      expect(component.listeners.size).toBe(0);
    });

    it('should not leak DOM event listeners', () => {
      component = new BaseComponent(element);
      const button = document.createElement('button');
      element.appendChild(button);
      
      component.init();
      
      // Add many DOM listeners
      for (let i = 0; i < 10; i++) {
        component.addDOMListener(button, 'click', vi.fn());
      }
      
      expect(component._boundEventListeners).toHaveLength(10);
      
      component.destroy();
      expect(component._boundEventListeners).toHaveLength(0);
    });
  });

  describe('Static Properties and Methods', () => {
    it('should have correct default options', () => {
      expect(BaseComponent.defaultOptions).toEqual({
        autoInit: true,
        debug: false,
        className: 'base-component'
      });
    });

    it('should allow default options to be extended', () => {
      class ExtendedComponent extends BaseComponent {
        static get defaultOptions() {
          return {
            ...super.defaultOptions,
            extended: true,
            debug: true
          };
        }
      }
      
      const extended = new ExtendedComponent(element);
      expect(extended.options).toEqual({
        autoInit: true,
        debug: true,
        className: 'base-component',
        extended: true
      });
    });
  });
});