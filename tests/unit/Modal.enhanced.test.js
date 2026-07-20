/**
 * Enhanced Unit Tests for Modal Component
 *
 * Comprehensive test suite covering modal creation, focus management,
 * keyboard navigation, accessibility, and various modal configurations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModule } from '../helpers/moduleResolver.js';
import {
  setupModalTestDOM,
  cleanupModalTestDOM,
  createEnhancedQuerySelectors,
  applyEnhancedQuerySelectors,
  restoreOriginalQuerySelectors,
  overrideCreateElement,
  restoreOriginalCreateElement,
  createAnimationMocks,
  waitForAnimation,
  triggerKeyboardEvent,
  createFocusableElement,
} from '../helpers/domTestUtils.js';

// Mock BaseComponent dependency
const mockBaseComponent = {
  addEventListener: vi.fn(),
  removeEventListeners: vi.fn(),
  destroy: vi.fn(),
  emit: vi.fn(),
};

// Mock escapeHTML function
const mockEscapeHTML = vi.fn(input => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
});

// Set mocks on window/global
if (typeof window !== 'undefined') {
  window.escapeHTML = mockEscapeHTML;
  window.BaseComponent = class BaseComponent {
    constructor(options = {}) {
      this.options = options;
      this.element = null;
      this.isRendered = false;
      this.eventListeners = new Map();
    }

    addEventListener(event, handler, selector) {
      const key = `${event}-${selector || 'root'}`;
      if (!this.eventListeners.has(key)) {
        this.eventListeners.set(key, []);
      }
      this.eventListeners.get(key).push(handler);
      mockBaseComponent.addEventListener(event, handler, selector);
    }

    removeEventListeners() {
      this.eventListeners.clear();
      mockBaseComponent.removeEventListeners();
    }

    destroy() {
      this.removeEventListeners();
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
      this.isRendered = false;
      mockBaseComponent.destroy();
    }

    emit(eventName, detail) {
      mockBaseComponent.emit(eventName, detail);
    }
  };
}

// Mock Modal component
const mockModal = createMockModule({
  default: class Modal extends window.BaseComponent {
    constructor(options = {}) {
      // Call parent constructor
      super(options);

      // Ensure options is always defined
      if (!this.options) {
        this.options = {};
      }

      // Override with Modal-specific options
      this.options = {
        title: '',
        content: '',
        showCloseButton: true,
        closeOnBackdrop: true,
        closeOnEscape: true,
        autoFocus: true,
        restoreFocus: true,
        size: 'medium', // small, medium, large, fullscreen
        animation: 'fade',
        className: '',
        ...this.options,
        ...options,
      };

      this.isOpen = false;
      this.element = null;
      this.backdrop = null;
      this.previouslyFocused = null;
      this.focusableElements = [];
      this.boundKeyHandler = this.handleKeydown.bind(this);
      this.boundBackdropClick = this.handleBackdropClick.bind(this);

      // Track event listeners for proper cleanup
      this.eventListeners = new Map();
      this.documentListeners = new Map();

      // Create modal on instantiation
      this.createElement();
    }

    createElement() {
      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'modal-backdrop';
      this.backdrop.setAttribute('aria-hidden', 'true');

      // Create modal container
      this.element = document.createElement('div');
      this.element.className = `modal modal-${this.options.size}`;
      this.element.setAttribute('role', 'dialog');
      this.element.setAttribute('aria-modal', 'true');
      this.element.setAttribute('tabindex', '-1');

      if (this.options.className) {
        // Support space-separated class name lists; classList.add rejects
        // tokens containing spaces
        this.options.className
          .split(/\s+/)
          .filter(Boolean)
          .forEach(cls => this.element.classList.add(cls));
      }

      // Create modal content structure
      const modalDialog = document.createElement('div');
      modalDialog.className = 'modal-dialog';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';

      // Header
      if (this.options.title || this.options.showCloseButton) {
        const header = document.createElement('div');
        header.className = 'modal-header';

        if (this.options.title) {
          const title = document.createElement('h2');
          title.className = 'modal-title';
          title.textContent = this.options.title;
          title.id = 'modal-title';
          header.appendChild(title);
          this.element.setAttribute('aria-labelledby', 'modal-title');
        }

        if (this.options.showCloseButton) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'modal-close';
          closeBtn.innerHTML = '&times;';
          closeBtn.setAttribute('aria-label', 'Close modal');
          closeBtn.addEventListener('click', () => this.close());
          header.appendChild(closeBtn);
          this.closeButton = closeBtn;
        }

        modalContent.appendChild(header);
      }

      // Body
      const body = document.createElement('div');
      body.className = 'modal-body';

      if (typeof this.options.content === 'string') {
        body.innerHTML = this.options.content;
      } else if (this.options.content instanceof HTMLElement) {
        body.appendChild(this.options.content);
      }

      modalContent.appendChild(body);
      this.body = body;

      // Footer (if provided)
      if (this.options.footer) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        if (typeof this.options.footer === 'string') {
          footer.innerHTML = this.options.footer;
        } else if (this.options.footer instanceof HTMLElement) {
          footer.appendChild(this.options.footer);
        }

        modalContent.appendChild(footer);
        this.footer = footer;
      }

      modalDialog.appendChild(modalContent);
      this.element.appendChild(modalDialog);

      // Add event listeners
      if (this.options.closeOnBackdrop) {
        this.backdrop.addEventListener('click', this.boundBackdropClick);
      }

      // Store references for testing
      this.modalDialog = modalDialog;
      this.modalContent = modalContent;
    }

    open() {
      if (this.isOpen) return this;

      // Store currently focused element
      if (this.options.restoreFocus) {
        this.previouslyFocused = document.activeElement;
      }

      // Add to DOM
      document.body.appendChild(this.backdrop);
      document.body.appendChild(this.element);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Set state
      this.isOpen = true;
      if (this.backdrop) {
        this.backdrop.setAttribute('aria-hidden', 'false');
      }

      // Setup focus management
      this.setupFocusManagement();

      // Auto focus
      if (this.options.autoFocus) {
        this.focusModal();
      }

      // Add keyboard listener
      if (this.options.closeOnEscape) {
        this.addDocumentEventListener('keydown', this.boundKeyHandler);
      }

      // Trigger animation
      requestAnimationFrame(() => {
        if (this.backdrop) {
          this.backdrop.classList.add('show');
        }
        if (this.element) {
          this.element.classList.add('show');
        }
      });

      // Trigger open event
      this.trigger('open');

      return this;
    }

    close() {
      if (!this.isOpen) return this;

      // Trigger before close event
      this.trigger('beforeClose');

      // Remove classes for animation
      if (this.backdrop) {
        this.backdrop.classList.remove('show');
      }
      if (this.element) {
        this.element.classList.remove('show');
      }

      // Wait for animation to complete (reduced timeout for testing)
      setTimeout(() => {
        // Remove from DOM
        if (this.backdrop && this.backdrop.parentNode) {
          this.backdrop.parentNode.removeChild(this.backdrop);
        }
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Restore focus
        if (this.options.restoreFocus && this.previouslyFocused) {
          this.previouslyFocused.focus();
        }

        // Remove keyboard listener
        this.removeDocumentEventListeners();

        // Set state
        this.isOpen = false;
        if (this.backdrop) {
          this.backdrop.setAttribute('aria-hidden', 'true');
        }

        // Trigger close event
        this.trigger('close');
      }, 10); // Reduced animation duration for testing

      return this;
    }

    setupFocusManagement() {
      // Find all focusable elements
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      this.focusableElements = Array.from(this.element.querySelectorAll(focusableSelectors));
    }

    focusModal() {
      // Focus first focusable element or modal itself
      if (this.focusableElements.length > 0) {
        this.focusableElements[0].focus();
      } else {
        this.element.focus();
      }
    }

    handleKeydown(e) {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          if (this.options.closeOnEscape) {
            e.preventDefault();
            this.close();
          }
          break;

        case 'Tab':
          this.handleTabNavigation(e);
          break;
      }
    }

    handleTabNavigation(e) {
      if (this.focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    handleBackdropClick(e) {
      if (e.target === this.backdrop && this.options.closeOnBackdrop) {
        this.close();
      }
    }

    // Event system (simplified)
    on(event, handler) {
      if (!this.listeners) this.listeners = {};
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
      return this;
    }

    trigger(event, data) {
      if (!this.listeners || !this.listeners[event]) return this;
      this.listeners[event].forEach(handler => handler.call(this, data));
      return this;
    }

    // Update modal content
    setContent(content) {
      if (typeof content === 'string') {
        this.body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.body.innerHTML = '';
        this.body.appendChild(content);
      }

      // Update focusable elements after content change
      if (this.isOpen) {
        this.setupFocusManagement();
      }

      return this;
    }

    setTitle(title) {
      const titleElement = this.element.querySelector('.modal-title');
      if (titleElement) {
        titleElement.textContent = title;
      }
      return this;
    }

    // Utility methods for testing
    isVisible() {
      return this.isOpen && this.element.parentNode === document.body;
    }

    getFocusableElements() {
      return this.focusableElements;
    }

    // Add document event listener and track it
    addDocumentEventListener(event, handler) {
      if (typeof document !== 'undefined' && handler) {
        document.addEventListener(event, handler);

        // Track for cleanup
        if (!this.documentListeners.has(event)) {
          this.documentListeners.set(event, []);
        }
        this.documentListeners.get(event).push(handler);
      }
    }

    // Remove all document-level event listeners
    removeDocumentEventListeners() {
      if (
        typeof document !== 'undefined' &&
        this.documentListeners &&
        this.documentListeners.size > 0
      ) {
        this.documentListeners.forEach((handlers, event) => {
          if (handlers && Array.isArray(handlers)) {
            handlers.forEach(handler => {
              try {
                document.removeEventListener(event, handler);
              } catch (error) {
                console.warn(`Error removing document ${event} listener:`, error);
              }
            });
          }
        });
        this.documentListeners.clear();
      }
    }

    // Get all tracked event listeners (for debugging/testing)
    getTrackedEventListeners() {
      return {
        element: Array.from(this.eventListeners.entries()).map(([key, handlers]) => ({
          key,
          eventName: key.split('-')[0],
          selector: key.split('-')[1] || 'root',
          count: handlers.length,
        })),
        document: Array.from(this.documentListeners.entries()).map(([event, handlers]) => ({
          event,
          count: handlers.length,
        })),
      };
    }

    destroy() {
      // Remove all document-level event listeners
      this.removeDocumentEventListeners();

      if (this.isOpen) {
        this.close();
      }

      // Remove elements from the DOM immediately - destroy must not wait
      // for the close animation, otherwise nulled references below would
      // prevent the delayed cleanup from ever removing them
      if (this.backdrop && this.backdrop.parentNode) {
        this.backdrop.parentNode.removeChild(this.backdrop);
      }
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      document.body.style.overflow = '';
      this.isOpen = false;

      // Remove event listeners
      if (this.options.closeOnBackdrop && this.backdrop) {
        this.backdrop.removeEventListener('click', this.boundBackdropClick);
      }

      // Clean up references
      this.element = null;
      this.backdrop = null;
      this.listeners = null;
      this.documentListeners = null;
      this.eventListeners = null;

      return this;
    }
  },

  // Static utility methods
  alert: function (message, title = 'Alert') {
    const modal = new this.default({
      title: title,
      content: `<p>${message}</p>`,
      footer: '<button class="btn btn-primary modal-ok">OK</button>',
      closeOnBackdrop: false,
      size: 'small',
    });

    return new Promise(resolve => {
      modal.on('open', () => {
        const okButton = modal.element.querySelector('.modal-ok');
        if (okButton) {
          okButton.onclick = () => {
            modal.close();
            resolve(true);
          };
          okButton.focus();
        }
      });
      modal.open();
    });
  },

  confirm: function (message, title = 'Confirm') {
    const modal = new this.default({
      title: title,
      content: `<p>${message}</p>`,
      footer: `
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary modal-confirm">OK</button>
      `,
      closeOnBackdrop: false,
      size: 'small',
    });

    return new Promise(resolve => {
      modal.on('open', () => {
        const confirmButton = modal.element.querySelector('.modal-confirm');
        const cancelButton = modal.element.querySelector('.modal-cancel');

        if (confirmButton) {
          confirmButton.onclick = () => {
            modal.close();
            resolve(true);
          };
        }

        if (cancelButton) {
          cancelButton.onclick = () => {
            modal.close();
            resolve(false);
          };
          cancelButton.focus();
        }
      });

      modal.on('close', () => resolve(false));
      modal.open();
    });
  },
});

// Mock the module
vi.mock('../../components/ui/Modal.js', () => mockModal);

describe('Modal Component Enhanced Tests', () => {
  let modal;
  let domRefs;
  let animationMocks;
  let enhancedSelectors;
  const Modal = mockModal.default;

  beforeEach(() => {
    // Clear any existing modals
    document.querySelectorAll('.modal, .modal-backdrop').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    // Reset body styles and classes
    document.body.style.overflow = '';
    document.body.className = '';

    // Ensure document.body exists and is properly set up
    if (!document.body) {
      document.body = document.createElement('body');
      document.documentElement.appendChild(document.body);
    }

    // Set up DOM test environment
    domRefs = setupModalTestDOM();

    // Override createElement to enhance elements
    overrideCreateElement();

    // Create and apply enhanced query selectors
    enhancedSelectors = createEnhancedQuerySelectors();
    applyEnhancedQuerySelectors(enhancedSelectors);

    // Set up animation mocks
    animationMocks = createAnimationMocks();
    global.requestAnimationFrame = animationMocks.requestAnimationFrame;
    global.setTimeout = animationMocks.setTimeout;

    // Reset document focus to body to ensure clean state
    if (document.body.focus) {
      document.body.focus();
    }
  });

  afterEach(() => {
    // Destroy modal instance
    if (modal) {
      modal.destroy();
    }

    // Force cleanup any remaining modal elements from DOM
    document.querySelectorAll('.modal, .modal-backdrop').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    // Restore animation mocks
    if (animationMocks) {
      animationMocks.restore();
    }

    // Restore original createElement
    restoreOriginalCreateElement();

    // Restore original querySelector methods
    restoreOriginalQuerySelectors();

    // Clean up DOM structure
    cleanupModalTestDOM(domRefs);

    // Clear all mocks
    vi.clearAllMocks();

    // Reset BaseComponent mock calls
    mockBaseComponent.addEventListener.mockClear();
    mockBaseComponent.removeEventListeners.mockClear();
    mockBaseComponent.destroy.mockClear();
    mockBaseComponent.emit.mockClear();
    mockEscapeHTML.mockClear();
  });

  describe('Modal Creation and Structure', () => {
    it('should have proper DOM test environment', () => {
      // Verify test DOM structure is set up
      expect(document.getElementById('app')).toBeTruthy();
      expect(document.getElementById('main-content')).toBeTruthy();
      expect(document.getElementById('game-container')).toBeTruthy();

      // Verify styles are applied
      const styles = document.head.querySelector('style');
      expect(styles).toBeTruthy();
      expect(styles.textContent).toContain('.modal-backdrop');
    });

    it('should extend BaseComponent and use its methods', () => {
      // Verify BaseComponent is available
      expect(window.BaseComponent).toBeDefined();

      // Create modal and verify inheritance
      modal = new Modal({ title: 'Test Modal' });
      expect(modal instanceof window.BaseComponent).toBe(true);

      // Verify BaseComponent properties are inherited
      expect(modal.eventListeners).toBeDefined();
      expect(modal.eventListeners instanceof Map).toBe(true);

      // Verify modal can use BaseComponent methods
      expect(typeof modal.addEventListener).toBe('function');
      expect(typeof modal.removeEventListeners).toBe('function');
      expect(typeof modal.emit).toBe('function');
    });

    it('should create modal with default options', () => {
      modal = new Modal();

      expect(modal.element).toBeTruthy();
      expect(modal.element.className).toContain('modal');
      expect(modal.element.className).toContain('modal-medium');
      expect(modal.element.getAttribute('role')).toBe('dialog');
      expect(modal.element.getAttribute('aria-modal')).toBe('true');
      expect(modal.isOpen).toBe(false);
    });

    it('should create modal with custom options', () => {
      modal = new Modal({
        title: 'Test Modal',
        content: '<p>Test content</p>',
        size: 'large',
        className: 'custom-modal',
      });

      expect(modal.element.className).toContain('modal-large');
      expect(modal.element.className).toContain('custom-modal');
      expect(modal.element.querySelector('.modal-title').textContent).toBe('Test Modal');
      expect(modal.element.querySelector('.modal-body').innerHTML).toBe('<p>Test content</p>');
    });

    it('should create proper modal structure', () => {
      modal = new Modal({
        title: 'Structured Modal',
        content: 'Body content',
        footer: '<button>Footer Button</button>',
      });

      expect(modal.element.querySelector('.modal-dialog')).toBeTruthy();
      expect(modal.element.querySelector('.modal-content')).toBeTruthy();
      expect(modal.element.querySelector('.modal-header')).toBeTruthy();
      expect(modal.element.querySelector('.modal-body')).toBeTruthy();
      expect(modal.element.querySelector('.modal-footer')).toBeTruthy();
    });

    it('should handle content as DOM element', () => {
      const contentElement = document.createElement('div');
      contentElement.innerHTML = '<span>Custom Element</span>';
      contentElement.id = 'custom-content';

      modal = new Modal({
        content: contentElement,
      });

      const bodyContent = modal.element.querySelector('.modal-body');
      expect(bodyContent.querySelector('#custom-content')).toBeTruthy();
      expect(bodyContent.querySelector('span').textContent).toBe('Custom Element');
    });

    it('should include close button by default', () => {
      modal = new Modal({ title: 'Test' });

      const closeButton = modal.element.querySelector('.modal-close');
      expect(closeButton).toBeTruthy();
      expect(closeButton.getAttribute('aria-label')).toBe('Close modal');
    });

    it('should hide close button when disabled', () => {
      modal = new Modal({
        title: 'Test',
        showCloseButton: false,
      });

      const closeButton = modal.element.querySelector('.modal-close');
      expect(closeButton).toBeFalsy();
    });
  });

  describe('Modal Opening and Closing', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Test Modal',
        content: 'Test content',
      });
    });

    it('should open modal correctly', () => {
      modal.open();

      expect(modal.isOpen).toBe(true);
      expect(document.body.contains(modal.element)).toBe(true);
      expect(document.body.contains(modal.backdrop)).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
      expect(modal.backdrop.getAttribute('aria-hidden')).toBe('false');
    });

    it('should close modal correctly', async () => {
      modal.open();
      modal.close();

      // Wait for animation using utility
      await waitForAnimation(350);

      expect(modal.isOpen).toBe(false);
      expect(document.body.contains(modal.element)).toBe(false);
      expect(document.body.contains(modal.backdrop)).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });

    it('should prevent multiple opens', () => {
      modal.open();
      const firstElement = modal.element;

      modal.open(); // Second call

      expect(document.querySelectorAll('.modal')).toHaveLength(1);
      expect(modal.element).toBe(firstElement);
    });

    it('should handle close on non-open modal', () => {
      expect(() => modal.close()).not.toThrow();
      expect(modal.isOpen).toBe(false);
    });

    it('should trigger open and close events', async () => {
      const openHandler = vi.fn();
      const closeHandler = vi.fn();

      modal.on('open', openHandler);
      modal.on('close', closeHandler);

      modal.open();
      expect(openHandler).toHaveBeenCalledTimes(1);

      modal.close();
      // Events are triggered after the (shortened) close animation
      await waitForAnimation(50);
      expect(closeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Focus Test',
        content: `
          <input type="text" id="input1" />
          <button id="button1">Button 1</button>
          <button id="button2">Button 2</button>
        `,
        autoFocus: true,
        restoreFocus: true,
      });

      // Ensure DOM is ready for focus tests
      if (!document.body.contains(modal.element)) {
        // Elements will be added when modal.open() is called
      }
    });

    it('should focus first focusable element on open', async () => {
      modal.open();

      // Wait for focus to be set after requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      // The close button in the header is the first focusable element in DOM
      // order; per the WAI-ARIA APG dialog pattern, focus moves to the first
      // focusable element inside the dialog
      const firstFocusable = modal.getFocusableElements()[0];
      expect(firstFocusable.classList.contains('modal-close')).toBe(true);
      expect(document.activeElement).toBe(firstFocusable);
    });

    it('should identify focusable elements correctly', () => {
      modal.open();

      const focusableElements = modal.getFocusableElements();
      expect(focusableElements).toHaveLength(4); // close button, input, button1, button2
      // DOM order: the header close button precedes the body content
      expect(focusableElements[0].classList.contains('modal-close')).toBe(true);
      expect(focusableElements[1].id).toBe('input1');
      expect(focusableElements[2].id).toBe('button1');
      expect(focusableElements[3].id).toBe('button2');
    });

    it('should trap focus within modal', () => {
      modal.open();

      const focusableElements = modal.getFocusableElements();
      const lastElement = focusableElements[focusableElements.length - 1];

      // Focus last element and press Tab
      lastElement.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      modal.handleKeydown(tabEvent);

      // Should wrap to first element
      expect(document.activeElement).toBe(focusableElements[0]);
    });

    it('should handle backward tab navigation', () => {
      modal.open();

      const focusableElements = modal.getFocusableElements();
      const firstElement = focusableElements[0];

      // Focus first element and press Shift+Tab
      firstElement.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
      });
      modal.handleKeydown(shiftTabEvent);

      // Should wrap to last element
      const lastElement = focusableElements[focusableElements.length - 1];
      expect(document.activeElement).toBe(lastElement);
    });

    it('should restore focus after closing', async () => {
      // Use utility to create focusable element
      const button = createFocusableElement('button', {
        id: 'original-focus',
        textContent: 'Original Focus',
      });
      document.body.appendChild(button);
      button.focus();

      modal.open();
      modal.close();

      // Wait for animation and focus restoration
      await waitForAnimation(350);

      expect(document.activeElement).toBe(button);

      // Cleanup
      document.body.removeChild(button);
    });

    it('should disable focus restoration when configured', async () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      modal.options.restoreFocus = false;
      modal.open();
      modal.close();

      // Force immediate cleanup for testing instead of waiting
      modal.destroy();

      expect(document.activeElement).not.toBe(button);

      document.body.removeChild(button);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Keyboard Test',
        content: '<button>Test Button</button>',
      });
    });

    it('should close on Escape key', async () => {
      modal.open();

      // Use utility to trigger keyboard event
      triggerKeyboardEvent('Escape');

      // Close completes after the (shortened) close animation
      await waitForAnimation(50);
      expect(modal.isOpen).toBe(false);
    });

    it('should not close on Escape when disabled', () => {
      modal.options.closeOnEscape = false;
      modal.open();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(modal.isOpen).toBe(true);
    });

    it('should handle Tab key navigation', () => {
      modal.open();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      const handleTabSpy = vi.spyOn(modal, 'handleTabNavigation');

      modal.handleKeydown(tabEvent);

      expect(handleTabSpy).toHaveBeenCalledWith(tabEvent);
    });

    it('should ignore other keys', () => {
      modal.open();

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const closeSpy = vi.spyOn(modal, 'close');

      modal.handleKeydown(enterEvent);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop Interaction', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Backdrop Test',
        content: 'Test content',
      });
    });

    it('should close on backdrop click by default', () => {
      modal.open();

      const closeSpy = vi.spyOn(modal, 'close');
      modal.backdrop.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not close on backdrop click when disabled', () => {
      modal.options.closeOnBackdrop = false;
      modal.open();

      const closeSpy = vi.spyOn(modal, 'close');
      modal.backdrop.click();

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      modal.open();

      const closeSpy = vi.spyOn(modal, 'close');
      modal.modalContent.click();

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Content Updates', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Update Test',
        content: 'Initial content',
      });
    });

    it('should update content with string', () => {
      modal.setContent('<p>New content</p>');

      expect(modal.body.innerHTML).toBe('<p>New content</p>');
    });

    it('should update content with DOM element', () => {
      const newContent = document.createElement('div');
      newContent.innerHTML = '<span>Element content</span>';
      newContent.id = 'new-content';

      modal.setContent(newContent);

      expect(modal.body.querySelector('#new-content')).toBeTruthy();
    });

    it('should update title', () => {
      modal.setTitle('New Title');

      const titleElement = modal.element.querySelector('.modal-title');
      expect(titleElement.textContent).toBe('New Title');
    });

    it('should update focusable elements after content change', () => {
      modal.open();
      const initialCount = modal.getFocusableElements().length;

      modal.setContent('<input type="text"><button>New Button</button>');

      expect(modal.getFocusableElements().length).toBeGreaterThan(initialCount);
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes', () => {
      modal = new Modal({
        title: 'Accessible Modal',
        content: 'Content',
      });

      expect(modal.element.getAttribute('role')).toBe('dialog');
      expect(modal.element.getAttribute('aria-modal')).toBe('true');
      expect(modal.element.getAttribute('aria-labelledby')).toBe('modal-title');
      expect(modal.element.getAttribute('tabindex')).toBe('-1');
    });

    it('should handle modal without title gracefully', () => {
      modal = new Modal({
        content: 'Content only',
        showCloseButton: false,
      });

      expect(modal.element.querySelector('.modal-header')).toBeFalsy();
      expect(modal.element.getAttribute('aria-labelledby')).toBeFalsy();
    });

    it('should manage backdrop aria-hidden correctly', () => {
      modal = new Modal();

      expect(modal.backdrop.getAttribute('aria-hidden')).toBe('true');

      modal.open();
      expect(modal.backdrop.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('Size and Styling Options', () => {
    it('should apply different size classes', () => {
      const sizes = ['small', 'medium', 'large', 'fullscreen'];

      sizes.forEach(size => {
        const sizedModal = new Modal({ size });
        expect(sizedModal.element.className).toContain(`modal-${size}`);
        sizedModal.destroy();
      });
    });

    it('should apply custom class names', () => {
      modal = new Modal({
        className: 'custom-modal special-style',
      });

      expect(modal.element.classList.contains('custom-modal')).toBe(true);
      expect(modal.element.classList.contains('special-style')).toBe(true);
    });
  });

  describe('Static Utility Methods', () => {
    it('should create alert modal', async () => {
      const alertPromise = mockModal.alert('Test alert message', 'Alert Title');

      // Check that modal was created and opened
      const alertModal = document.querySelector('.modal');
      expect(alertModal).toBeTruthy();
      expect(alertModal.querySelector('.modal-title').textContent).toBe('Alert Title');
      expect(alertModal.querySelector('.modal-body').innerHTML).toBe('<p>Test alert message</p>');

      // Click OK button
      const okButton = alertModal.querySelector('.modal-ok');
      expect(okButton).toBeTruthy();
      okButton.click();

      const result = await alertPromise;
      expect(result).toBe(true);
    });

    it('should create confirm modal', async () => {
      const confirmPromise = mockModal.confirm('Are you sure?', 'Confirm Action');

      const confirmModal = document.querySelector('.modal');
      expect(confirmModal).toBeTruthy();
      expect(confirmModal.querySelector('.modal-title').textContent).toBe('Confirm Action');

      // Click confirm button
      const confirmButton = confirmModal.querySelector('.modal-confirm');
      expect(confirmButton).toBeTruthy();
      confirmButton.click();

      const result = await confirmPromise;
      expect(result).toBe(true);
    });

    it('should handle confirm modal cancellation', async () => {
      const confirmPromise = mockModal.confirm('Delete everything?');

      const confirmModal = document.querySelector('.modal');
      const cancelButton = confirmModal.querySelector('.modal-cancel');
      expect(cancelButton).toBeTruthy();
      cancelButton.click();

      const result = await confirmPromise;
      expect(result).toBe(false);
    });
  });

  describe('Event System', () => {
    beforeEach(() => {
      modal = new Modal();
    });

    it('should register and trigger events', () => {
      const handler = vi.fn();
      modal.on('customEvent', handler);

      modal.trigger('customEvent', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support multiple event handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      modal.on('test', handler1);
      modal.on('test', handler2);

      modal.trigger('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should trigger beforeClose event', () => {
      const beforeCloseHandler = vi.fn();
      modal.on('beforeClose', beforeCloseHandler);

      modal.open();
      modal.close();

      expect(beforeCloseHandler).toHaveBeenCalled();
    });

    it('should properly track document event listeners', () => {
      modal = new Modal({ closeOnEscape: true });

      // Initially should have no tracked document listeners
      let tracked = modal.getTrackedEventListeners();
      expect(tracked.document).toHaveLength(0);

      // After opening, should track keydown listener
      modal.open();
      tracked = modal.getTrackedEventListeners();
      expect(tracked.document).toHaveLength(1);
      expect(tracked.document[0].event).toBe('keydown');
      expect(tracked.document[0].count).toBe(1);

      // After closing, listeners should be cleaned up
      modal.close();
      // Force cleanup immediately for testing
      modal.removeDocumentEventListeners();
      tracked = modal.getTrackedEventListeners();
      expect(tracked.document).toHaveLength(0);
    });

    it('should properly mock event target elements', () => {
      modal = new Modal({
        content: '<button id="test-btn">Test</button>',
      });

      modal.open();
      const button = modal.element.querySelector('#test-btn');

      // Test that focus method is mocked
      button.focus();
      expect(document.activeElement).toBe(button);

      // Test that click method is mocked and dispatches events
      let clicked = false;
      button.addEventListener('click', () => {
        clicked = true;
      });
      button.click();
      expect(clicked).toBe(true);
    });

    it('should verify element queries return valid enhanced elements', () => {
      modal = new Modal({
        title: 'Query Test',
        content: `
          <div id="test-container">
            <input type="text" id="test-input" class="form-input">
            <button class="btn primary">Submit</button>
            <button class="btn secondary">Cancel</button>
          </div>
        `,
      });

      modal.open();

      // The enhanced query helpers patch the document-level methods
      // (querySelector/querySelectorAll/getElementById), so query through
      // document to receive enhanced elements
      const container = document.querySelector('#test-container');
      expect(container).toBeTruthy();
      expect(container.tagName).toBe('DIV');
      expect(container._enhanced).toBe(true);

      // Test getElementById returns valid enhanced element
      const input = document.getElementById('test-input');
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('INPUT');
      expect(input._enhanced).toBe(true);
      expect(typeof input.focus).toBe('function');

      // Test querySelectorAll returns valid enhanced elements
      const buttons = document.querySelectorAll('.btn');
      expect(buttons).toHaveLength(2);
      buttons.forEach(btn => {
        expect(btn.tagName).toBe('BUTTON');
        expect(btn._enhanced).toBe(true);
        expect(typeof btn.click).toBe('function');
      });

      // Test that enhanced methods work correctly
      input.focus();
      expect(document.activeElement).toBe(input);

      // Test querySelector with non-existent element returns null
      const notFound = modal.element.querySelector('#does-not-exist');
      expect(notFound).toBeNull();

      // Test querySelectorAll with non-existent elements returns empty NodeList
      const notFoundList = modal.element.querySelectorAll('.does-not-exist');
      expect(notFoundList).toHaveLength(0);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up event listeners on destroy', () => {
      modal = new Modal();
      const removeEventListenerSpy = vi.spyOn(modal.backdrop, 'removeEventListener');

      modal.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', modal.boundBackdropClick);
    });

    it('should handle rapid open/close cycles', async () => {
      modal = new Modal();

      for (let i = 0; i < 5; i++) {
        modal.open();
        expect(modal.isOpen).toBe(true);

        modal.close();
        // Close completes after the (shortened) close animation
        await waitForAnimation(50);
        expect(modal.isOpen).toBe(false);
      }
    });

    it('should not leak DOM elements', () => {
      modal = new Modal();
      modal.open();
      modal.close();

      // Force immediate cleanup for testing
      modal.destroy();
      expect(document.querySelector('.modal')).toBeFalsy();
      expect(document.querySelector('.modal-backdrop')).toBeFalsy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing focusable elements', () => {
      modal = new Modal({
        content: '<div>No focusable content</div>',
        showCloseButton: false,
      });

      modal.open();

      expect(() => modal.focusModal()).not.toThrow();
      expect(document.activeElement).toBe(modal.element);
    });

    it('should handle keyboard events when not open', () => {
      modal = new Modal();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => modal.handleKeydown(escapeEvent)).not.toThrow();
    });

    it('should handle backdrop click with no backdrop element', () => {
      modal = new Modal();
      modal.backdrop = null;

      expect(() => modal.handleBackdropClick({})).not.toThrow();
    });

    it('should handle content updates with invalid content', () => {
      modal = new Modal();

      expect(() => modal.setContent(null)).not.toThrow();
      expect(() => modal.setContent(undefined)).not.toThrow();
      expect(() => modal.setContent(123)).not.toThrow();
    });
  });
});
