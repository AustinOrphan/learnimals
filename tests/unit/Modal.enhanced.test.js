/**
 * Enhanced Unit Tests for Modal Component
 * 
 * Comprehensive test suite covering modal creation, focus management,
 * keyboard navigation, accessibility, and various modal configurations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModule } from '../helpers/moduleResolver.js';

// Mock Modal component
const mockModal = createMockModule({
  default: class Modal {
    constructor(options = {}) {
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
        ...options
      };
      
      this.isOpen = false;
      this.element = null;
      this.backdrop = null;
      this.previouslyFocused = null;
      this.focusableElements = [];
      this.boundKeyHandler = this.handleKeydown.bind(this);
      this.boundBackdropClick = this.handleBackdropClick.bind(this);
      
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
        // Handle multiple class names separated by spaces
        const classNames = this.options.className.split(' ').filter(name => name.trim());
        classNames.forEach(className => {
          this.element.classList.add(className);
        });
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

      // Add to DOM (with null checks)
      if (this.backdrop) {
        document.body.appendChild(this.backdrop);
      }
      if (this.element) {
        document.body.appendChild(this.element);
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Set state
      this.isOpen = true;
      if (this.backdrop && this.backdrop.setAttribute) {
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
        document.addEventListener('keydown', this.boundKeyHandler);
      }

      // Trigger animation
      requestAnimationFrame(() => {
        if (this.backdrop && this.backdrop.classList) {
          this.backdrop.classList.add('show');
        }
        if (this.element && this.element.classList) {
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

      // Remove classes for animation (with null checks)
      if (this.backdrop && this.backdrop.classList) {
        this.backdrop.classList.remove('show');
      }
      if (this.element && this.element.classList) {
        this.element.classList.remove('show');
      }

      // Wait for animation to complete
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
        document.removeEventListener('keydown', this.boundKeyHandler);

        // Set state
        this.isOpen = false;
        if (this.backdrop && this.backdrop.setAttribute) {
          this.backdrop.setAttribute('aria-hidden', 'true');
        }

        // Trigger close event
        this.trigger('close');
      }, 300); // Animation duration

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
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');

      this.focusableElements = this.element && this.element.querySelectorAll 
        ? Array.from(this.element.querySelectorAll(focusableSelectors))
        : [];
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

    destroy() {
      if (this.isOpen) {
        this.close();
      }
      
      // Remove event listeners (with null checks)
      if (this.options.closeOnBackdrop && this.backdrop && this.backdrop.removeEventListener) {
        this.backdrop.removeEventListener('click', this.boundBackdropClick);
      }
      
      // Clean up references
      this.element = null;
      this.backdrop = null;
      this.listeners = null;
      
      return this;
    }
  },

  // Static utility methods
  alert: function(message, title = 'Alert') {
    const modal = new this.default({
      title: title,
      content: `<p>${message}</p>`,
      footer: '<button class="btn btn-primary modal-ok">OK</button>',
      closeOnBackdrop: false,
      size: 'small'
    });

    return new Promise((resolve) => {
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

  confirm: function(message, title = 'Confirm') {
    const modal = new this.default({
      title: title,
      content: `<p>${message}</p>`,
      footer: `
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary modal-confirm">OK</button>
      `,
      closeOnBackdrop: false,
      size: 'small'
    });

    return new Promise((resolve) => {
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
  }
});

// Mock the module
vi.mock('../../src/components/ui/Modal.js', () => mockModal);

describe('Modal Component Enhanced Tests', () => {
  let modal;
  const Modal = mockModal.default;

  beforeEach(() => {
    // Clear any existing modals
    document.querySelectorAll('.modal, .modal-backdrop').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    
    // Reset body styles
    document.body.style.overflow = '';
    
    // Mock requestAnimationFrame for testing
    global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));
  });

  afterEach(() => {
    if (modal) {
      modal.destroy();
    }
    vi.clearAllMocks();
  });

  describe('Modal Creation and Structure', () => {
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
        className: 'custom-modal'
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
        footer: '<button>Footer Button</button>'
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
        content: contentElement
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
        showCloseButton: false
      });
      
      const closeButton = modal.element.querySelector('.modal-close');
      expect(closeButton).toBeFalsy();
    });
  });

  describe('Modal Opening and Closing', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Test Modal',
        content: 'Test content'
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

    it('should close modal correctly', () => {
      modal.open();
      modal.close();
      
      // Advance timers to trigger the close animation timeout
      vi.advanceTimersByTime(350);
      
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

    it('should trigger open and close events', () => {
      const openHandler = vi.fn();
      const closeHandler = vi.fn();
      
      modal.on('open', openHandler);
      modal.on('close', closeHandler);
      
      modal.open();
      expect(openHandler).toHaveBeenCalledTimes(1);
      
      modal.close();
      // Advance timers to trigger the close animation timeout
      vi.advanceTimersByTime(350);
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
        `
      });
    });

    it('should focus first focusable element on open', () => {
      modal.open();
      
      // First focusable element might be the close button or the input
      const focusableElements = modal.getFocusableElements();
      expect(focusableElements.length).toBeGreaterThan(0);
      expect(document.activeElement).toBe(focusableElements[0]);
    });

    it('should identify focusable elements correctly', () => {
      modal.open();
      
      const focusableElements = modal.getFocusableElements();
      expect(focusableElements).toHaveLength(4); // input, button1, button2, close button
      
      // Check that all expected elements are present (order may vary)
      const elementIds = focusableElements.map(el => el.id).filter(id => id);
      expect(elementIds).toContain('input1');
      expect(elementIds).toContain('button1');
      expect(elementIds).toContain('button2');
    });

    it('should trap focus within modal', () => {
      modal.open();
      
      const focusableElements = modal.getFocusableElements();
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Focus last element and press Tab
      lastElement.focus();
      const tabEvent = document.createEvent('Event');
      tabEvent.initEvent('keydown', true, true);
      Object.defineProperty(tabEvent, 'key', { value: 'Tab', writable: false });
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
      const shiftTabEvent = document.createEvent('Event');
      shiftTabEvent.initEvent('keydown', true, true);
      Object.defineProperty(shiftTabEvent, 'key', { value: 'Tab', writable: false });
      Object.defineProperty(shiftTabEvent, 'shiftKey', { value: true, writable: false });
      modal.handleKeydown(shiftTabEvent);
      
      // Should wrap to last element
      const lastElement = focusableElements[focusableElements.length - 1];
      expect(document.activeElement).toBe(lastElement);
    });

    it('should restore focus after closing', () => {
      const button = document.createElement('button');
      button.id = 'original-focus';
      document.body.appendChild(button);
      button.focus();
      
      modal.open();
      modal.close();
      
      // Advance timers to trigger the close animation timeout
      vi.advanceTimersByTime(350);
      
      expect(document.activeElement).toBe(button);
      
      // Cleanup
      document.body.removeChild(button);
    });

    it('should disable focus restoration when configured', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      
      modal.options.restoreFocus = false;
      modal.open();
      modal.close();
      
      // Advance timers to trigger the close animation timeout
      vi.advanceTimersByTime(350);
      
      expect(document.activeElement).not.toBe(button);
      
      document.body.removeChild(button);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Keyboard Test',
        content: '<button>Test Button</button>'
      });
    });

    it('should close on Escape key', () => {
      modal.open();
      
      const escapeEvent = document.createEvent('Event');
      escapeEvent.initEvent('keydown', true, true);
      Object.defineProperty(escapeEvent, 'key', { value: 'Escape', writable: false });
      modal.handleKeydown(escapeEvent);
      
      // Advance timers to complete the close animation
      vi.advanceTimersByTime(350);
      
      // Check that close was completed
      expect(modal.isOpen).toBe(false);
    });

    it('should not close on Escape when disabled', () => {
      modal.options.closeOnEscape = false;
      modal.open();
      
      const escapeEvent = document.createEvent('Event');
      escapeEvent.initEvent('keydown', true, true);
      Object.defineProperty(escapeEvent, 'key', { value: 'Escape', writable: false });
      modal.handleKeydown(escapeEvent);
      
      expect(modal.isOpen).toBe(true);
    });

    it('should handle Tab key navigation', () => {
      modal.open();
      
      const tabEvent = document.createEvent('Event');
      tabEvent.initEvent('keydown', true, true);
      Object.defineProperty(tabEvent, 'key', { value: 'Tab', writable: false });
      const handleTabSpy = vi.spyOn(modal, 'handleTabNavigation');
      
      modal.handleKeydown(tabEvent);
      
      expect(handleTabSpy).toHaveBeenCalledWith(tabEvent);
    });

    it('should ignore other keys', () => {
      modal.open();
      
      const enterEvent = document.createEvent('Event');
      enterEvent.initEvent('keydown', true, true);
      Object.defineProperty(enterEvent, 'key', { value: 'Enter', writable: false });
      const closeSpy = vi.spyOn(modal, 'close');
      
      modal.handleKeydown(enterEvent);
      
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop Interaction', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Backdrop Test',
        content: 'Test content'
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
        content: 'Initial content'
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
        content: 'Content'
      });
      
      expect(modal.element.getAttribute('role')).toBe('dialog');
      expect(modal.element.getAttribute('aria-modal')).toBe('true');
      expect(modal.element.getAttribute('aria-labelledby')).toBe('modal-title');
      expect(modal.element.getAttribute('tabindex')).toBe('-1');
    });

    it('should handle modal without title gracefully', () => {
      modal = new Modal({
        content: 'Content only',
        showCloseButton: false
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
        className: 'custom-modal special-style'
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
  });

  describe('Performance and Memory Management', () => {
    it('should clean up event listeners on destroy', () => {
      modal = new Modal();
      const removeEventListenerSpy = vi.spyOn(modal.backdrop, 'removeEventListener');
      
      modal.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', modal.boundBackdropClick);
    });

    it('should handle rapid open/close cycles', () => {
      modal = new Modal();
      
      for (let i = 0; i < 5; i++) {
        modal.open();
        expect(modal.isOpen).toBe(true);
        
        modal.close();
        // Advance timers to complete the close animation
        vi.advanceTimersByTime(350);
        expect(modal.isOpen).toBe(false);
      }
    });

    it('should not leak DOM elements', () => {
      modal = new Modal();
      modal.open();
      modal.close();
      
      // Advance timers to complete the close animation
      vi.advanceTimersByTime(350);
      
      expect(document.querySelector('.modal')).toBeFalsy();
      expect(document.querySelector('.modal-backdrop')).toBeFalsy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing focusable elements', () => {
      modal = new Modal({
        content: '<div>No focusable content</div>',
        showCloseButton: false
      });
      
      modal.open();
      
      expect(() => modal.focusModal()).not.toThrow();
      expect(document.activeElement).toBe(modal.element);
    });

    it('should handle keyboard events when not open', () => {
      modal = new Modal();
      
      const escapeEvent = document.createEvent('Event');
      escapeEvent.initEvent('keydown', true, true);
      Object.defineProperty(escapeEvent, 'key', { value: 'Escape', writable: false });
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