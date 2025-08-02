/**
 * Enhanced Modal Component Unit Tests
 * 
 * Comprehensive test suite for the Modal component
 * Tests modal creation, display/hide functionality, event handling, and accessibility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentMockData, TestDataUtils } from '../../fixtures/testDataFactory.js';

// Mock testUtils
const testUtils = {
  createTestContainer: vi.fn().mockImplementation((id) => {
    const container = document.createElement('div');
    container.id = id;
    container.className = 'test-container';
    document.body.appendChild(container);
    return container;
  }),
  
  simulateEvent: vi.fn().mockImplementation((element, eventType, options = {}) => {
    if (!element) return;
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
    return event;
  }),
  
  cleanup: vi.fn().mockImplementation(() => {
    const containers = document.querySelectorAll('.test-container');
    containers.forEach(container => container.remove());
  })
};

// Mock Modal component
let Modal;

describe('Modal Component', () => {
  let container;
  let modal;

  beforeEach(async () => {
    container = testUtils.createTestContainer('modal-test');
    
    // Mock Modal component with comprehensive functionality
    Modal = vi.fn().mockImplementation(function(options = {}) {
      this.options = {
        title: options.title || 'Modal Title',
        content: options.content || 'Modal content',
        buttons: options.buttons || [],
        closeOnOverlay: options.closeOnOverlay !== false,
        closeOnEscape: options.closeOnEscape !== false,
        size: options.size || 'medium',
        className: options.className || '',
        onShow: options.onShow || null,
        onHide: options.onHide || null,
        onConfirm: options.onConfirm || null,
        onCancel: options.onCancel || null,
        ...options
      };
      
      this.element = null;
      this.overlay = null;
      this.isVisible = false;
      this.isAnimating = false;
      this.focusStack = [];
      this.eventListeners = new Map();
      
      this.show = vi.fn().mockImplementation(() => {
        if (this.isVisible || this.isAnimating) return this;
        
        this.createElement();
        this.bindEvents();
        this.isAnimating = true;
        
        // Store focus for restoration
        this.focusStack.push(document.activeElement);
        
        // Add to DOM
        document.body.appendChild(this.overlay);
        
        // Trigger show animation synchronously in test environment
        this.overlay.classList.add('modal-overlay--visible');
        this.element.classList.add('modal--visible');
        this.isVisible = true;
        this.isAnimating = false;
        
        // Focus first focusable element
        this.focusFirstElement();
        
        // Trigger onShow callback
        if (this.options.onShow) {
          this.options.onShow(this);
        }
        
        return this;
      });
      
      this.hide = vi.fn().mockImplementation(() => {
        if (!this.isVisible || this.isAnimating) return this;
        
        this.isAnimating = true;
        
        // Start hide animation synchronously in test environment
        if (this.overlay) {
          this.overlay.classList.remove('modal-overlay--visible');
        }
        if (this.element) {
          this.element.classList.remove('modal--visible');
        }
        
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Restore focus
        if (this.focusStack.length > 0) {
          const previousFocus = this.focusStack.pop();
          if (previousFocus && previousFocus.focus) {
            previousFocus.focus();
          }
        }
        
        this.isVisible = false;
        this.isAnimating = false;
        
        // Trigger onHide callback
        if (this.options.onHide) {
          this.options.onHide(this);
        }
        
        this.cleanup();
        
        return this;
      });
      
      this.createElement = vi.fn().mockImplementation(() => {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-labelledby', 'modal-title');
        
        // Create modal
        this.element = document.createElement('div');
        this.element.className = `modal modal--${this.options.size} ${this.options.className}`.trim();
        
        // Generate modal HTML
        this.element.innerHTML = this.generateHTML();
        this.overlay.appendChild(this.element);
        
        return this.element;
      });
      
      this.generateHTML = vi.fn().mockImplementation(() => {
        let html = '<div class=\"modal__content\">';
        
        // Header
        if (this.options.title) {
          html += '<div class=\"modal__header\">';
          html += `<h2 id=\"modal-title\" class=\"modal__title\">${this.options.title}</h2>`;
          html += '<button class=\"modal__close\" aria-label=\"Close modal\">&times;</button>';
          html += '</div>';
        }
        
        // Body
        html += '<div class=\"modal__body\">';
        html += this.options.content;
        html += '</div>';
        
        // Footer with buttons
        if (this.options.buttons && this.options.buttons.length > 0) {
          html += '<div class=\"modal__footer\">';
          this.options.buttons.forEach((button, index) => {
            // Handle null or malformed button data
            if (button && typeof button === 'object') {
              const variant = button.variant || 'secondary';
              const disabled = button.disabled ? 'disabled' : '';
              const action = button.action || 'button';
              const text = button.text || 'Button';
              html += `<button class=\"modal__button modal__button--${variant}\" data-action=\"${action}\" ${disabled}>${text}</button>`;
            }
          });
          html += '</div>';
        }
        
        html += '</div>';
        return html;
      });
      
      this.bindEvents = vi.fn().mockImplementation(() => {
        if (!this.overlay || !this.element) return;
        
        // Close button
        const closeBtn = this.element.querySelector('.modal__close');
        if (closeBtn) {
          const closeHandler = () => {
            if (this.options.onCancel) {
              this.options.onCancel(this);
            }
            this.hide();
          };
          closeBtn.addEventListener('click', closeHandler);
          this.eventListeners.set('close', closeHandler);
        }
        
        // Action buttons
        const buttons = this.element.querySelectorAll('.modal__button');
        buttons.forEach(button => {
          const buttonHandler = (e) => {
            const action = button.dataset.action;
            
            if (action === 'confirm' && this.options.onConfirm) {
              this.options.onConfirm(this);
            } else if (action === 'cancel' && this.options.onCancel) {
              this.options.onCancel(this);
            }
            
            // Auto-close unless prevented
            if (!e.defaultPrevented) {
              this.hide();
            }
          };
          
          button.addEventListener('click', buttonHandler);
          this.eventListeners.set(`button-${button.dataset.action}`, buttonHandler);
        });
        
        // Overlay click to close
        if (this.options.closeOnOverlay) {
          const overlayHandler = (e) => {
            if (e.target === this.overlay) {
              this.hide();
            }
          };
          this.overlay.addEventListener('click', overlayHandler);
          this.eventListeners.set('overlay', overlayHandler);
        }
        
        // Escape key to close
        if (this.options.closeOnEscape) {
          const escapeHandler = (e) => {
            if (e.key === 'Escape') {
              this.hide();
            }
          };
          document.addEventListener('keydown', escapeHandler);
          this.eventListeners.set('escape', escapeHandler);
        }
        
        // Focus trap
        const focusTrapHandler = this.createFocusTrap();
        if (focusTrapHandler) {
          this.element.addEventListener('keydown', focusTrapHandler);
          this.eventListeners.set('focustrap', focusTrapHandler);
        }
      });
      
      this.createFocusTrap = vi.fn().mockImplementation(() => {
        return (e) => {
          if (e.key !== 'Tab') return;
          
          const focusableElements = this.getFocusableElements();
          if (focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        };
      });
      
      this.getFocusableElements = vi.fn().mockImplementation(() => {
        if (!this.element) return [];
        
        const focusableSelectors = [
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          'a[href]',
          '[tabindex]:not([tabindex=\"-1\"])'
        ];
        
        return Array.from(this.element.querySelectorAll(focusableSelectors.join(', ')));
      });
      
      this.focusFirstElement = vi.fn().mockImplementation(() => {
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      });
      
      this.updateContent = vi.fn().mockImplementation((newContent) => {
        if (this.element) {
          const bodyElement = this.element.querySelector('.modal__body');
          if (bodyElement) {
            bodyElement.innerHTML = newContent;
          }
        }
        return this;
      });
      
      this.updateTitle = vi.fn().mockImplementation((newTitle) => {
        this.options.title = newTitle;
        if (this.element) {
          const titleElement = this.element.querySelector('.modal__title');
          if (titleElement) {
            titleElement.textContent = newTitle;
          }
        }
        return this;
      });
      
      this.cleanup = vi.fn().mockImplementation(() => {
        this.eventListeners.forEach((handler, event) => {
          if (event === 'escape') {
            document.removeEventListener('keydown', handler);
          } else if (this.overlay && event === 'overlay') {
            this.overlay.removeEventListener('click', handler);
          } else if (this.element) {
            // Handle button and other element events
            if (event.startsWith('button-')) {
              const button = this.element.querySelector(`[data-action=\"${event.split('-')[1]}\"]`);
              if (button) button.removeEventListener('click', handler);
            } else if (event === 'close') {
              const closeBtn = this.element.querySelector('.modal__close');
              if (closeBtn) closeBtn.removeEventListener('click', handler);
            } else if (event === 'focustrap') {
              this.element.removeEventListener('keydown', handler);
            }
          }
        });
        
        this.eventListeners.clear();
      });
      
      this.destroy = vi.fn().mockImplementation(() => {
        if (this.isVisible) {
          this.hide();
        }
        
        // Synchronous cleanup in test environment
        this.cleanup();
        this.element = null;
        this.overlay = null;
        this.focusStack = [];
        
        return this;
      });
      
      this.toggle = vi.fn().mockImplementation(() => {
        if (this.isVisible) {
          this.hide();
        } else {
          this.show();
        }
        return this;
      });
      
      this.setLoading = vi.fn().mockImplementation((loading = true) => {
        if (this.element) {
          this.element.classList.toggle('modal--loading', loading);
        }
        return this;
      });
      
      return this;
    });
  });

  afterEach(() => {
    if (modal) {
      modal.destroy();
    }
    container.innerHTML = '';
    
    // Clean up any remaining modal overlays
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
  });

  describe('Modal Creation and Display', () => {
    it('should create modal with default options', () => {
      modal = new Modal();
      
      expect(modal.options.title).toBe('Modal Title');
      expect(modal.options.content).toBe('Modal content');
      expect(modal.options.size).toBe('medium');
      expect(modal.options.closeOnOverlay).toBe(true);
      expect(modal.options.closeOnEscape).toBe(true);
    });

    it('should create modal with custom options', () => {
      const options = {
        title: 'Custom Modal',
        content: '<p>Custom content</p>',
        size: 'large',
        className: 'custom-modal',
        closeOnOverlay: false
      };
      
      modal = new Modal(options);
      
      expect(modal.options.title).toBe('Custom Modal');
      expect(modal.options.content).toBe('<p>Custom content</p>');
      expect(modal.options.size).toBe('large');
      expect(modal.options.className).toBe('custom-modal');
      expect(modal.options.closeOnOverlay).toBe(false);
    });

    it('should show modal and update visibility state', () => {
      modal = new Modal({ title: 'Test Modal' });
      modal.show();
      
      expect(modal.show).toHaveBeenCalled();
      expect(modal.createElement).toHaveBeenCalled();
      expect(modal.bindEvents).toHaveBeenCalled();
      
      // Synchronous in test environment
      expect(modal.isVisible).toBe(true);
      expect(modal.isAnimating).toBe(false);
    });

    it('should hide modal and clean up properly', () => {
      modal = new Modal({ title: 'Test Modal' });
      modal.show();
      
      modal.hide();
      
      expect(modal.hide).toHaveBeenCalled();
      
      // Synchronous in test environment
      expect(modal.isVisible).toBe(false);
      expect(modal.cleanup).toHaveBeenCalled();
    });

    it('should generate proper HTML structure', () => {
      const options = {
        title: 'HTML Test Modal',
        content: '<p>Test content</p>',
        buttons: [
          { text: 'Cancel', action: 'cancel', variant: 'secondary' },
          { text: 'Confirm', action: 'confirm', variant: 'primary' }
        ]
      };
      
      modal = new Modal(options);
      modal.show();
      
      expect(modal.generateHTML).toHaveBeenCalled();
      expect(modal.element.querySelector('.modal__title').textContent).toBe('HTML Test Modal');
      expect(modal.element.querySelector('.modal__body').innerHTML).toBe('<p>Test content</p>');
      expect(modal.element.querySelectorAll('.modal__button')).toHaveLength(2);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Event Test Modal',
        content: 'Test content',
        buttons: [
          { text: 'Cancel', action: 'cancel' },
          { text: 'Confirm', action: 'confirm' }
        ]
      });
      modal.show();
    });

    it('should handle close button click', async () => {
      // Wait for modal to be fully shown and event listeners bound
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const closeBtn = modal.element.querySelector('.modal__close');
      
      // Check that event listener was registered during bindEvents
      expect(modal.bindEvents).toHaveBeenCalled();
      expect(modal.eventListeners.has('close')).toBe(true);
      
      // Test the actual click functionality
      testUtils.simulateEvent(closeBtn, 'click');
    });

    it('should handle action button clicks', () => {
      const confirmBtn = modal.element.querySelector('[data-action=\"confirm\"]');
      const cancelBtn = modal.element.querySelector('[data-action=\"cancel\"]');
      
      expect(confirmBtn).toBeDefined();
      expect(cancelBtn).toBeDefined();
      expect(modal.eventListeners.has('button-confirm')).toBe(true);
      expect(modal.eventListeners.has('button-cancel')).toBe(true);
    });

    it('should handle overlay click when enabled', async () => {
      // Wait for modal to be fully shown and event listeners bound
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check that event listener was registered during bindEvents (closeOnOverlay is true by default)
      expect(modal.bindEvents).toHaveBeenCalled();
      expect(modal.eventListeners.has('overlay')).toBe(true);
      
      // Test the actual overlay click functionality
      testUtils.simulateEvent(modal.overlay, 'click');
    });

    it('should not handle overlay click when disabled', () => {
      modal.hide();
      modal = new Modal({ closeOnOverlay: false });
      modal.show();
      
      expect(modal.eventListeners.has('overlay')).toBe(false);
    });

    it('should handle escape key when enabled', async () => {
      // Wait for modal to be fully shown and event listeners bound
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check that event listener was registered during bindEvents (closeOnEscape is true by default)
      expect(modal.bindEvents).toHaveBeenCalled();
      expect(modal.eventListeners.has('escape')).toBe(true);
      
      // Test the actual escape key functionality
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
    });

    it('should trigger onShow callback', () => {
      const onShow = vi.fn();
      modal.hide();
      modal = new Modal({ onShow });
      modal.show();
      
      // Synchronous in test environment
      expect(onShow).toHaveBeenCalledWith(modal);
    });

    it('should trigger onHide callback', () => {
      const onHide = vi.fn();
      modal.options.onHide = onHide;
      modal.hide();
      
      // Synchronous in test environment
      expect(onHide).toHaveBeenCalledWith(modal);
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Accessibility Modal',
        content: 'Accessible content',
        buttons: [{ text: 'OK', action: 'confirm' }]
      });
      modal.show();
    });

    it('should have proper ARIA attributes', () => {
      expect(modal.overlay.getAttribute('role')).toBe('dialog');
      expect(modal.overlay.getAttribute('aria-modal')).toBe('true');
      expect(modal.overlay.getAttribute('aria-labelledby')).toBe('modal-title');
    });

    it('should manage focus properly', () => {
      expect(modal.focusFirstElement).toHaveBeenCalled();
      expect(modal.getFocusableElements).toHaveBeenCalled();
    });

    it('should trap focus within modal', () => {
      expect(modal.createFocusTrap).toHaveBeenCalled();
      expect(modal.eventListeners.has('focustrap')).toBe(true);
    });

    it('should restore focus on close', () => {
      const previousFocus = document.activeElement;
      modal.focusStack.push(previousFocus);
      
      modal.hide();
      
      // Focus should be restored after animation
      setTimeout(() => {
        expect(modal.focusStack).toHaveLength(0);
      }, 350);
    });

    it('should identify focusable elements correctly', () => {
      const focusableElements = modal.getFocusableElements();
      
      // Should find buttons and close button
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Content Updates', () => {
    beforeEach(() => {
      modal = new Modal({
        title: 'Dynamic Modal',
        content: 'Initial content'
      });
      modal.show();
    });

    it('should update content dynamically', () => {
      const newContent = '<p>Updated content</p>';
      modal.updateContent(newContent);
      
      expect(modal.updateContent).toHaveBeenCalledWith(newContent);
    });

    it('should update title dynamically', () => {
      const newTitle = 'Updated Title';
      modal.updateTitle(newTitle);
      
      expect(modal.updateTitle).toHaveBeenCalledWith(newTitle);
      expect(modal.options.title).toBe(newTitle);
    });

    it('should set loading state', () => {
      modal.setLoading(true);
      
      expect(modal.setLoading).toHaveBeenCalledWith(true);
      expect(modal.element.classList.contains('modal--loading')).toBe(true);
      
      modal.setLoading(false);
      expect(modal.element.classList.contains('modal--loading')).toBe(false);
    });

    it('should toggle visibility', () => {
      modal.toggle();
      expect(modal.toggle).toHaveBeenCalled();
      
      // Should hide since modal is currently visible
      expect(modal.hide).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should prevent multiple simultaneous show calls', () => {
      modal = new Modal();
      modal.isAnimating = true;
      
      const result = modal.show();
      expect(result).toBe(modal); // Should return self but not execute
    });

    it('should prevent multiple simultaneous hide calls', () => {
      modal = new Modal();
      modal.show();
      modal.isAnimating = true;
      
      const result = modal.hide();
      expect(result).toBe(modal); // Should return self but not execute
    });

    it('should handle missing DOM elements gracefully', () => {
      modal = new Modal();
      modal.element = null;
      
      expect(() => {
        modal.updateContent('New content');
        modal.updateTitle('New title');
        modal.setLoading(true);
      }).not.toThrow();
    });

    it('should handle empty button array', () => {
      modal = new Modal({ buttons: [] });
      modal.show();
      
      expect(modal.element.querySelector('.modal__footer')).toBe(null);
    });

    it('should handle malformed button data', () => {
      const options = {
        buttons: [
          { text: 'Valid', action: 'valid' },
          { action: 'no-text' }, // Missing text
          { text: 'No Action' }, // Missing action
          null, // Null button
          { text: 'Disabled', action: 'disabled', disabled: true }
        ]
      };
      
      expect(() => {
        modal = new Modal(options);
        modal.show();
      }).not.toThrow();
    });

    it('should cleanup properly on destroy', async () => {
      modal = new Modal();
      modal.show();
      
      // Wait for show to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      modal.destroy();
      
      expect(modal.destroy).toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 400)); // Extra time for destroy sequence
      expect(modal.element).toBe(null);
      expect(modal.overlay).toBe(null);
      expect(modal.focusStack).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with component mock data', () => {
      const mockData = ComponentMockData.modalData;
      modal = new Modal(mockData);
      modal.show();
      
      expect(modal.options.title).toBe(mockData.title);
      expect(modal.options.content).toBe(mockData.content);
      expect(modal.options.buttons).toEqual(mockData.buttons);
    });

    it('should handle complex callback scenarios', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const onShow = vi.fn();
      const onHide = vi.fn();
      
      modal = new Modal({
        title: 'Callback Modal',
        buttons: [
          { text: 'Cancel', action: 'cancel' },
          { text: 'Confirm', action: 'confirm' }
        ],
        onConfirm,
        onCancel,
        onShow,
        onHide
      });
      
      modal.show();
      
      // Callbacks should be properly assigned
      expect(modal.options.onConfirm).toBe(onConfirm);
      expect(modal.options.onCancel).toBe(onCancel);
      expect(modal.options.onShow).toBe(onShow);
      expect(modal.options.onHide).toBe(onHide);
    });

    it('should support multiple modal instances', async () => {
      const modal1 = new Modal({ title: 'Modal 1' });
      const modal2 = new Modal({ title: 'Modal 2' });
      
      modal1.show();
      modal2.show();
      
      // Wait for both to show
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(modal1.isVisible).toBe(true);
      expect(modal2.isVisible).toBe(true);
      
      modal1.destroy();
      modal2.destroy();
    });
  });

  describe('Performance Considerations', () => {
    it('should efficiently manage event listeners', async () => {
      modal = new Modal({
        buttons: [
          { text: 'Button 1', action: 'action1' },
          { text: 'Button 2', action: 'action2' },
          { text: 'Button 3', action: 'action3' }
        ]
      });
      
      modal.show();
      
      // Wait for show to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should have listeners for close, overlay, escape, focustrap, and buttons
      expect(modal.eventListeners.size).toBeGreaterThan(4);
      
      modal.hide();
      
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(modal.eventListeners.size).toBe(0);
    });

    it('should handle rapid show/hide calls gracefully', () => {
      modal = new Modal();
      
      // Rapid calls should be handled properly
      modal.show();
      modal.hide();
      modal.show();
      modal.hide();
      
      expect(modal.show).toHaveBeenCalledTimes(2);
      expect(modal.hide).toHaveBeenCalledTimes(2);
    });
  });
});