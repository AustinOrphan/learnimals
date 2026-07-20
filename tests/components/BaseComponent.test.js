import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import BaseComponent from '../../components/BaseComponent.js';

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;

// Test implementation of BaseComponent since it's abstract
class TestComponent extends BaseComponent {
  generateHTML() {
    return `<div id="${this.options.id}" class="test-component">Test Content</div>`;
  }
}

describe('BaseComponent', () => {
  let container;
  let component;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (component) {
      component.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      component = new TestComponent();

      expect(component.options.id).toBeDefined();
      expect(component.options.cssClasses).toEqual([]);
      expect(component.options.container).toBeNull();
      expect(component.options.attributes).toEqual({});
      expect(component.element).toBeNull();
      expect(component.isRendered).toBe(false);
    });

    it('should initialize with custom options', () => {
      const options = {
        id: 'custom-id',
        cssClasses: ['custom-class'],
        container: '#test-container',
        attributes: { 'data-test': 'value' },
      };

      component = new TestComponent(options);

      expect(component.options.id).toBe('custom-id');
      expect(component.options.cssClasses).toEqual(['custom-class']);
      expect(component.options.container).toBe('#test-container');
      expect(component.options.attributes).toEqual({ 'data-test': 'value' });
    });

    it('should merge additional options', () => {
      const options = {
        id: 'test-id',
        customProp: 'custom-value',
        nested: { prop: 'value' },
      };

      component = new TestComponent(options);

      expect(component.options.customProp).toBe('custom-value');
      expect(component.options.nested).toEqual({ prop: 'value' });
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const component1 = new TestComponent();
      const component2 = new TestComponent();

      expect(component1.options.id).toBeDefined();
      expect(component2.options.id).toBeDefined();
      expect(component1.options.id).not.toBe(component2.options.id);

      component1.destroy();
      component2.destroy();
    });

    it('should generate ID based on class name', () => {
      component = new TestComponent();

      expect(component.options.id).toMatch(/^testcomponent-/);
    });

    it('should use provided ID instead of generating one', () => {
      component = new TestComponent({ id: 'custom-id' });

      expect(component.options.id).toBe('custom-id');
    });
  });

  describe('Rendering', () => {
    it('should render component to container', () => {
      component = new TestComponent();
      component.render(container);

      expect(component.isRendered).toBe(true);
      expect(component.element).toBeDefined();
      expect(component.element.id).toBe(component.options.id);
      expect(component.element.className).toBe('test-component');
      expect(component.element.textContent).toBe('Test Content');
    });

    it('should render to container selector', () => {
      component = new TestComponent();
      component.render('#test-container');

      expect(component.isRendered).toBe(true);
      expect(container.querySelector(`#${component.options.id}`)).toBeDefined();
    });

    it('should render to options container', () => {
      component = new TestComponent({ container: container });
      component.render();

      expect(component.isRendered).toBe(true);
      expect(container.querySelector(`#${component.options.id}`)).toBeDefined();
    });

    it('should handle missing container gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component = new TestComponent();
      component.render('#non-existent');

      expect(component.isRendered).toBe(false);
      expect(component.element).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Container not found:', '#non-existent');

      consoleSpy.mockRestore();
    });
  });

  describe('Attributes', () => {
    it('should apply attributes to element', () => {
      component = new TestComponent({
        attributes: {
          'data-test': 'value',
          'aria-label': 'Test Component',
          role: 'button',
        },
      });

      component.render(container);

      expect(component.element.getAttribute('data-test')).toBe('value');
      expect(component.element.getAttribute('aria-label')).toBe('Test Component');
      expect(component.element.getAttribute('role')).toBe('button');
    });
  });

  describe('Event Handling', () => {
    it('should add event listeners', () => {
      component = new TestComponent();
      component.render(container);

      const handler = vi.fn();
      component.addEventListener('click', handler);

      component.element.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should add event listeners with delegation', () => {
      component = new TestComponent();
      component.render(container);

      // Add a child element
      const child = document.createElement('button');
      child.className = 'child-button';
      component.element.appendChild(child);

      const handler = vi.fn();
      component.addEventListener('click', handler, '.child-button');

      child.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      component = new TestComponent();
      component.render(container);

      const handler = vi.fn();
      component.addEventListener('click', handler);

      component.removeEventListeners();
      component.element.click();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    it('should add CSS classes', () => {
      component = new TestComponent();
      component.render(container);

      component.addClass('new-class', 'another-class');

      expect(component.element.classList.contains('new-class')).toBe(true);
      expect(component.element.classList.contains('another-class')).toBe(true);
    });

    it('should remove CSS classes', () => {
      component = new TestComponent();
      component.render(container);

      component.element.classList.add('test-class');
      component.removeClass('test-class');

      expect(component.element.classList.contains('test-class')).toBe(false);
    });

    it('should toggle CSS classes', () => {
      component = new TestComponent();
      component.render(container);

      const result1 = component.toggleClass('toggle-class');
      expect(result1).toBe(true);
      expect(component.element.classList.contains('toggle-class')).toBe(true);

      const result2 = component.toggleClass('toggle-class');
      expect(result2).toBe(false);
      expect(component.element.classList.contains('toggle-class')).toBe(false);
    });

    it('should check if class exists', () => {
      component = new TestComponent();
      component.render(container);

      component.element.classList.add('existing-class');

      expect(component.hasClass('existing-class')).toBe(true);
      expect(component.hasClass('non-existent-class')).toBe(false);
    });
  });

  describe('Visibility', () => {
    it('should show/hide component', () => {
      component = new TestComponent();
      component.render(container);

      component.hide();
      expect(component.element.style.display).toBe('none');

      component.show();
      expect(component.element.style.display).toBe('');
      expect(component.element.hasAttribute('hidden')).toBe(false);
    });

    it('should toggle visibility', () => {
      component = new TestComponent();
      component.render(container);

      component.toggle();
      expect(component.element.style.display).toBe('none');

      component.toggle();
      expect(component.element.style.display).toBe('');
    });
  });

  describe('Options Management', () => {
    it('should get option value', () => {
      component = new TestComponent({ testOption: 'test-value' });

      expect(component.getOption('testOption')).toBe('test-value');
      expect(component.getOption('id')).toBe(component.options.id);
    });

    it('should set option value', () => {
      component = new TestComponent();

      component.setOption('newOption', 'new-value');
      expect(component.getOption('newOption')).toBe('new-value');
    });

    it('should update options', () => {
      component = new TestComponent({ option1: 'value1' });

      component.update({ option1: 'updated-value', option2: 'value2' });

      expect(component.getOption('option1')).toBe('updated-value');
      expect(component.getOption('option2')).toBe('value2');
    });
  });

  describe('Custom Events', () => {
    it('should emit custom events', () => {
      component = new TestComponent();
      component.render(container);

      const handler = vi.fn();
      component.element.addEventListener('customEvent', handler);

      component.emit('customEvent', { data: 'test' });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual({ data: 'test' });
    });
  });

  describe('Static Methods', () => {
    it('should create element with createElement', () => {
      const element = BaseComponent.createElement('div', {
        className: 'test-class',
        innerHTML: 'Test Content',
        attributes: { 'data-test': 'value' },
      });

      expect(element.tagName).toBe('DIV');
      expect(element.className).toBe('test-class');
      expect(element.innerHTML).toBe('Test Content');
      expect(element.getAttribute('data-test')).toBe('value');
    });
  });

  describe('Destruction', () => {
    it('should destroy component and clean up', () => {
      component = new TestComponent();
      component.render(container);

      const elementId = component.options.id;

      component.destroy();

      expect(component.element).toBeNull();
      expect(component.isRendered).toBe(false);
      expect(document.getElementById(elementId)).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations on non-rendered component', () => {
      component = new TestComponent();

      // These should not throw errors
      expect(() => component.addClass('test')).not.toThrow();
      expect(() => component.removeClass('test')).not.toThrow();
      expect(() => component.show()).not.toThrow();
      expect(() => component.hide()).not.toThrow();
      expect(() => component.emit('test')).not.toThrow();

      expect(component.hasClass('test')).toBe(false);
      expect(component.toggleClass('test')).toBe(false);
    });

    it('should handle re-rendering', () => {
      component = new TestComponent({ container });
      component.render();

      const firstElement = component.element;
      component.update({}, true);

      expect(component.element).not.toBe(firstElement);
      expect(component.isRendered).toBe(true);
    });
  });
});
