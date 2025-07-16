import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import Modal from '../../src/components/ui/Modal.js';

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;

describe('Modal Component', () => {
  let modal;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.body.className = '';
  });

  afterEach(() => {
    if (modal) {
      modal.destroy();
    }
    document.body.innerHTML = '';
    document.body.className = '';
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      expect(modal.options.title).toBe('Test Modal');
      expect(modal.options.content).toBe('Test content');
      expect(modal.options.confirmButtonText).toBe('OK');
      expect(modal.options.cancelButtonText).toBe('Cancel');
      expect(modal.options.showClose).toBe(true);
      expect(modal.options.size).toBe('medium');
      expect(modal.options.showConfirmButton).toBe(true);
      expect(modal.options.showCancelButton).toBe(false);
      expect(modal.isOpen).toBe(false);
    });

    it('should initialize with custom options', () => {
      const options = {
        id: 'custom-modal',
        title: 'Custom Modal',
        content: 'Custom content',
        confirmButtonText: 'Save',
        cancelButtonText: 'Discard',
        showClose: false,
        size: 'large',
        showConfirmButton: false,
        showCancelButton: true
      };
      
      modal = new Modal(options);
      
      expect(modal.options.title).toBe('Custom Modal');
      expect(modal.options.content).toBe('Custom content');
      expect(modal.options.confirmButtonText).toBe('Save');
      expect(modal.options.cancelButtonText).toBe('Discard');
      expect(modal.options.showClose).toBe(false);
      expect(modal.options.size).toBe('large');
      expect(modal.options.showConfirmButton).toBe(false);
      expect(modal.options.showCancelButton).toBe(true);
    });

    it('should handle callback functions', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const onClose = vi.fn();
      
      modal = new Modal({
        id: 'callback-modal',
        title: 'Callback Modal',
        content: 'Test content',
        onConfirm,
        onCancel,
        onClose
      });
      
      expect(modal.options.onConfirm).toBe(onConfirm);
      expect(modal.options.onCancel).toBe(onCancel);
      expect(modal.options.onClose).toBe(onClose);
    });
  });

  describe('HTML Generation', () => {
    it('should generate basic modal HTML', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('id="test-modal"');
      expect(html).toContain('class="component modal-overlay"');
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="test-modal-title"');
      expect(html).toContain('id="test-modal-title"');
      expect(html).toContain('Test Modal');
      expect(html).toContain('Test content');
    });

    it('should generate modal with close button', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showClose: true
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('class="modal-close component-button component-button--ghost"');
      expect(html).toContain('aria-label="Close"');
      expect(html).toContain('&times;');
    });

    it('should generate modal without close button', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showClose: false
      });
      
      const html = modal.generateHTML();
      
      expect(html).not.toContain('modal-close');
    });

    it('should generate modal with confirm button', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showConfirmButton: true,
        confirmButtonText: 'Confirm'
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('class="modal-confirm component-button component-button--primary"');
      expect(html).toContain('Confirm');
    });

    it('should generate modal with cancel button', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('class="modal-cancel component-button component-button--outline"');
      expect(html).toContain('Cancel');
    });

    it('should generate modal with both buttons', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showConfirmButton: true,
        showCancelButton: true
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('modal-footer');
      expect(html).toContain('modal-confirm');
      expect(html).toContain('modal-cancel');
    });

    it('should generate modal without footer when no buttons', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showConfirmButton: false,
        showCancelButton: false
      });
      
      const html = modal.generateHTML();
      
      expect(html).not.toContain('modal-footer');
    });

    it('should apply size classes', () => {
      const sizes = ['small', 'medium', 'large'];
      
      sizes.forEach(size => {
        modal = new Modal({
          id: 'test-modal',
          title: 'Test Modal',
          content: 'Test content',
          size
        });
        
        const html = modal.generateHTML();
        expect(html).toContain(`modal--${size}`);
        
        modal.destroy();
      });
    });

    it('should handle HTML content', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'HTML Modal',
        content: '<p>HTML <strong>content</strong></p>'
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('<p>HTML <strong>content</strong></p>');
    });
  });

  describe('Modal Creation', () => {
    it('should create modal in DOM', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.create();
      
      expect(document.getElementById('test-modal')).toBeTruthy();
      expect(document.querySelector('.modal-overlay')).toBeTruthy();
      expect(document.querySelector('.modal-title').textContent).toBe('Test Modal');
    });

    it('should not duplicate modal if already exists', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.create();
      modal.create();
      
      const modals = document.querySelectorAll('#test-modal');
      expect(modals.length).toBe(1);
    });
  });

  describe('Modal Opening and Closing', () => {
    it('should open modal', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      expect(modal.isOpen).toBe(true);
      expect(document.getElementById('test-modal')).toBeTruthy();
      expect(document.getElementById('test-modal').getAttribute('aria-hidden')).toBe('false');
      expect(document.body.classList.contains('modal-open')).toBe(true);
    });

    it('should close modal', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      modal.close();
      
      expect(modal.isOpen).toBe(false);
      expect(document.getElementById('test-modal').getAttribute('aria-hidden')).toBe('true');
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    it('should call onClose callback when closing', () => {
      const onClose = vi.fn();
      
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        onClose
      });
      
      modal.open();
      modal.close();
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Button Interactions', () => {
    it('should handle confirm button click', () => {
      const onConfirm = vi.fn();
      
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        onConfirm,
        showConfirmButton: true
      });
      
      modal.open();
      
      const confirmButton = document.querySelector('.modal-confirm');
      confirmButton.click();
      
      expect(onConfirm).toHaveBeenCalled();
      expect(modal.isOpen).toBe(false);
    });

    it('should handle cancel button click', () => {
      const onCancel = vi.fn();
      
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        onCancel,
        showCancelButton: true
      });
      
      modal.open();
      
      const cancelButton = document.querySelector('.modal-cancel');
      cancelButton.click();
      
      expect(onCancel).toHaveBeenCalled();
      expect(modal.isOpen).toBe(false);
    });

    it('should handle close button click', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showClose: true
      });
      
      modal.open();
      
      const closeButton = document.querySelector('.modal-close');
      closeButton.click();
      
      expect(modal.isOpen).toBe(false);
    });

    it('should close when clicking outside modal', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      const overlay = document.querySelector('.modal-overlay');
      overlay.click();
      
      expect(modal.isOpen).toBe(false);
    });

    it('should not close when clicking inside modal', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      const modalContent = document.querySelector('.modal');
      modalContent.click();
      
      expect(modal.isOpen).toBe(true);
    });
  });

  describe('Keyboard Interactions', () => {
    it('should close modal on Escape key', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      // Simulate Escape key press
      const escapeEvent = document.createEvent('Event');
      escapeEvent.initEvent('keydown', true, true);
      escapeEvent.key = 'Escape';
      document.dispatchEvent(escapeEvent);
      
      expect(modal.isOpen).toBe(false);
    });

    it('should not close modal on other keys', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      // Simulate other key press
      const enterEvent = document.createEvent('Event');
      enterEvent.initEvent('keydown', true, true);
      enterEvent.key = 'Enter';
      document.dispatchEvent(enterEvent);
      
      expect(modal.isOpen).toBe(true);
    });

    it('should not close modal on Escape when closed', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.create();
      
      // Simulate Escape key press when modal is closed
      const escapeEvent = document.createEvent('Event');
      escapeEvent.initEvent('keydown', true, true);
      escapeEvent.key = 'Escape';
      document.dispatchEvent(escapeEvent);
      
      expect(modal.isOpen).toBe(false);
    });
  });

  describe('Modal Updates', () => {
    it('should update modal content', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Original Title',
        content: 'Original content'
      });
      
      modal.open();
      
      modal.update({
        title: 'Updated Title',
        content: 'Updated content'
      });
      
      expect(document.querySelector('.modal-title').textContent).toBe('Updated Title');
      expect(document.querySelector('.modal-content').textContent.trim()).toBe('Updated content');
    });

    it('should preserve open state after update', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      modal.update({
        title: 'Updated Title'
      });
      
      expect(modal.isOpen).toBe(true);
      expect(document.getElementById('test-modal').getAttribute('aria-hidden')).toBe('false');
    });

    it('should update closed modal without opening', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.create();
      
      modal.update({
        title: 'Updated Title'
      });
      
      expect(modal.isOpen).toBe(false);
      expect(document.querySelector('.modal-title').textContent).toBe('Updated Title');
    });
  });

  describe('Modal Destruction', () => {
    it('should destroy modal and clean up', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      modal.destroy();
      
      expect(document.getElementById('test-modal')).toBeNull();
      expect(document.body.classList.contains('modal-open')).toBe(false);
      expect(modal.isOpen).toBe(false);
    });

    it('should remove escape key listener on destroy', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      
      const escapeHandler = modal.escapeHandler;
      modal.destroy();
      
      // Create new modal to test that old handler is removed
      const newModal = new Modal({
        id: 'new-modal',
        title: 'New Modal',
        content: 'New content'
      });
      
      newModal.open();
      
      // Simulate Escape key press
      const escapeEvent = document.createEvent('Event');
      escapeEvent.initEvent('keydown', true, true);
      escapeEvent.key = 'Escape';
      document.dispatchEvent(escapeEvent);
      
      // Only the new modal should close
      expect(newModal.isOpen).toBe(false);
      
      newModal.destroy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Accessible Modal',
        content: 'Accessible content'
      });
      
      modal.open();
      
      const modalElement = document.querySelector('.modal');
      expect(modalElement.getAttribute('role')).toBe('dialog');
      expect(modalElement.getAttribute('aria-modal')).toBe('true');
      expect(modalElement.getAttribute('aria-labelledby')).toBe('test-modal-title');
      
      const overlay = document.querySelector('.modal-overlay');
      expect(overlay.getAttribute('aria-hidden')).toBe('false');
    });

    it('should update aria-hidden when opening/closing', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      expect(document.getElementById('test-modal').getAttribute('aria-hidden')).toBe('false');
      
      modal.close();
      expect(document.getElementById('test-modal').getAttribute('aria-hidden')).toBe('true');
    });

    it('should have proper close button accessibility', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content',
        showClose: true
      });
      
      modal.open();
      
      const closeButton = document.querySelector('.modal-close');
      expect(closeButton.getAttribute('aria-label')).toBe('Close');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing DOM elements gracefully', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      // Try to close without creating/opening
      expect(() => modal.close()).not.toThrow();
      expect(modal.isOpen).toBe(false);
    });

    it('should handle multiple opens gracefully', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      modal.open();
      
      expect(modal.isOpen).toBe(true);
      expect(document.querySelectorAll('#test-modal').length).toBe(1);
    });

    it('should handle multiple closes gracefully', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: 'Test content'
      });
      
      modal.open();
      modal.close();
      modal.close();
      
      expect(modal.isOpen).toBe(false);
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    it('should handle empty content', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Empty Modal',
        content: ''
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('class="modal-content"');
    });

    it('should handle special characters in content', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Special Characters',
        content: 'Content with "quotes" & <tags>'
      });
      
      const html = modal.generateHTML();
      
      expect(html).toContain('Content with "quotes" & <tags>');
    });
  });

  describe('Integration', () => {
    it('should work with BaseComponent methods', () => {
      modal = new Modal({
        id: 'test-modal',
        title: 'Integration Modal',
        content: 'Integration content'
      });
      
      modal.open();
      
      // Test BaseComponent methods
      expect(modal.getOption('title')).toBe('Integration Modal');
      
      modal.setOption('title', 'Updated Title');
      expect(modal.getOption('title')).toBe('Updated Title');
      
      const customEventHandler = vi.fn();
      modal.element.addEventListener('customEvent', customEventHandler);
      
      modal.emit('customEvent', { test: 'data' });
      expect(customEventHandler).toHaveBeenCalled();
    });
  });
});