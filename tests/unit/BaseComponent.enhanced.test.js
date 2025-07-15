/**
 * Enhanced Unit Tests for BaseComponent
 * 
 * Comprehensive test suite following the Testing Pyramid approach (70% unit tests)
 * Tests component lifecycle, event handling, DOM management, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BaseComponent from '../../src/components/BaseComponent.js';

describe('BaseComponent Enhanced Tests', () => {
  let element;
  let component;

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
    it('should create component with default options', () => {
      component = new BaseComponent();
      
      expect(component.options.id).toBeDefined();
      expect(component.options.cssClasses).toEqual([]);
      expect(component.element).toBeNull();
      expect(component.isRendered).toBe(false);
    });

    it('should merge custom options', () => {
      const customOptions = {
        id: 'custom-id',
        cssClasses: ['custom-class'],
        customProp: 'value'
      };
      
      component = new BaseComponent(customOptions);
      
      expect(component.options.id).toBe('custom-id');
      expect(component.options.cssClasses).toEqual(['custom-class']);
      expect(component.options.customProp).toBe('value');
    });

    it('should generate unique IDs when not provided', () => {
      const component1 = new BaseComponent();
      const component2 = new BaseComponent();
      
      expect(component1.options.id).not.toBe(component2.options.id);
      expect(component1.options.id).toContain('basecomponent-');
    });

    it('should implement generateHTML method requirement', () => {
      component = new BaseComponent();
      
      expect(() => component.generateHTML()).toThrow('generateHTML method must be implemented by subclass');
    });
  });

  describe('Rendering and Element Management', () => {
    beforeEach(() => {
      // Create a test component that implements generateHTML
      class TestComponent extends BaseComponent {
        generateHTML() {
          return `<div id="${this.options.id}" class="${this.options.cssClasses.join(' ')}">Test Content</div>`;
        }
      }
      component = new TestComponent({ container: element });
    });

    it('should render component to container', () => {
      component.render();
      
      expect(component.isRendered).toBe(true);
      expect(component.element).toBeDefined();
      expect(element.innerHTML).toContain('Test Content');
    });

    it('should add and remove CSS classes', () => {
      component.render();
      
      component.addClass('test-class');
      expect(component.element.classList.contains('test-class')).toBe(true);
      
      component.removeClass('test-class');
      expect(component.element.classList.contains('test-class')).toBe(false);
      
      component.toggleClass('toggle-class');
      expect(component.element.classList.contains('toggle-class')).toBe(true);
      
      component.toggleClass('toggle-class');
      expect(component.element.classList.contains('toggle-class')).toBe(false);
    });

    it('should check class existence correctly', () => {
      component.render();
      component.element.classList.add('existing-class');
      
      expect(component.hasClass('existing-class')).toBe(true);
      expect(component.hasClass('non-existing-class')).toBe(false);
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      // Create a test component that implements generateHTML
      class TestComponent extends BaseComponent {
        generateHTML() {
          return `<div id="${this.options.id}">Test Content</div>`;
        }
      }
      component = new TestComponent({ container: element });
      component.render();
    });

    it('should emit custom events', () => {
      const handler = vi.fn();
      component.element.addEventListener('customEvent', handler);
      
      component.emit('customEvent', { data: 'test' });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ data: 'test' });
    });

    it('should add and remove event listeners', () => {
      const handler = vi.fn();
      
      // Use the actual BaseComponent's on/off methods
      component.on('click', handler);
      component.element.click();
      expect(handler).toHaveBeenCalledTimes(1);
      
      component.off('click', handler);
      component.element.click();
      expect(handler).toHaveBeenCalledTimes(1); // Still just 1
    });

    it('should support method chaining', () => {
      const result = component
        .addClass('test')
        .removeClass('test')
        .show()
        .hide();
      
      expect(result).toBe(component);
    });
  });

  describe('Component Lifecycle', () => {
    beforeEach(() => {
      // Create a test component that implements generateHTML
      class TestComponent extends BaseComponent {
        generateHTML() {
          return `<div id="${this.options.id}">Test Content</div>`;
        }
      }
      component = new TestComponent({ container: element });
    });

    it('should handle show/hide operations', () => {
      component.render();
      
      component.hide();
      expect(component.element.style.display).toBe('none');
      
      component.show();
      expect(component.element.style.display).toBe('');
      
      const toggleResult1 = component.toggle();
      expect(component.element.style.display).toBe('none');
      expect(toggleResult1).toBe(component);
      
      const toggleResult2 = component.toggle();
      expect(component.element.style.display).toBe('');
      expect(toggleResult2).toBe(component);
    });

    it('should handle destroy operation', () => {
      component.render();
      expect(component.isRendered).toBe(true);
      expect(component.element).not.toBeNull();
      
      component.destroy();
      expect(component.isRendered).toBe(false);
      expect(component.element).toBeNull();
    });

    it('should support options management', () => {
      expect(component.getOption('container')).toBe(element);
      
      component.setOption('newOption', 'testValue');
      expect(component.getOption('newOption')).toBe('testValue');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing container gracefully', () => {
      component = new BaseComponent();
      
      // Should not throw when container is missing
      expect(() => component.render('nonexistent-selector')).not.toThrow();
      expect(component.isRendered).toBe(false);
    });

    it('should handle method chaining when element is null', () => {
      component = new BaseComponent();
      
      const result = component
        .addClass('test')
        .removeClass('test')
        .show()
        .hide();
      
      expect(result).toBe(component);
    });

    it('should support static createElement utility', () => {
      const testElement = BaseComponent.createElement('div', {
        className: 'test-class',
        innerHTML: 'Test Content',
        attributes: { 'data-test': 'value' }
      });
      
      expect(testElement.tagName).toBe('DIV');
      expect(testElement.className).toBe('test-class');
      expect(testElement.innerHTML).toBe('Test Content');
      expect(testElement.getAttribute('data-test')).toBe('value');
    });
  });

  describe('Component Integration', () => {
    it('should work with custom component implementations', () => {
      class CustomComponent extends BaseComponent {
        generateHTML() {
          return `<div id="${this.options.id}" class="custom-component">
            <h1>${this.options.title || 'Default Title'}</h1>
          </div>`;
        }

        onRender() {
          super.onRender();
          this.bindCustomEvents();
        }

        bindCustomEvents() {
          if (this.element) {
            this.element.addEventListener('click', () => {
              this.emit('custom:click', { componentId: this.options.id });
            });
          }
        }
      }
      
      const customComponent = new CustomComponent({
        title: 'Test Component',
        container: element
      });
      
      customComponent.render();
      
      expect(customComponent.isRendered).toBe(true);
      expect(customComponent.element.querySelector('h1').textContent).toBe('Test Component');
      expect(customComponent.element.classList.contains('custom-component')).toBe(true);
      
      // Test custom event
      const eventHandler = vi.fn();
      customComponent.element.addEventListener('custom:click', eventHandler);
      customComponent.element.click();
      
      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler.mock.calls[0][0].detail.componentId).toBe(customComponent.options.id);
      
      customComponent.destroy();
    });
  });
});