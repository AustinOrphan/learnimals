/**
 * Modal Component Tests
 * Unit tests for the Modal UI component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockDOM, createMockModalOptions, triggerEvent, waitForDOM } from '../utils/testHelpers.js';

// We need to mock the BaseComponent since it's imported
vi.mock('../../src/components/BaseComponent.js', () => ({
  default: class MockBaseComponent {
    constructor(options) {
      this.options = options;
      this.element = null;
      this.eventListeners = [];
    }

    addEventListener(event, handler, selector) {
      this.eventListeners.push({ event, handler, selector });
    }

    destroy() {
      // Mock destroy
    }
  }
}));

describe('Modal Component', () => {
  let mockDOM;
  let Modal;

  beforeEach(async () => {
    mockDOM = createMockDOM();

    // Dynamic import after mocking
    const module = await import('../../src/components/ui/Modal.js');
    Modal = module.default;
  });

  describe('Constructor', () => {
    it('should create modal with default options', () => {
      const modal = new Modal({ id: 'test-modal' });

      expect(modal.options.id).toBe('test-modal');
      expect(modal.options.confirmButtonText).toBe('OK');
      expect(modal.options.showClose).toBe(true);
      expect(modal.options.size).toBe('medium');
      expect(modal.isOpen).toBe(false);
    });

    it('should merge provided options with defaults', () => {
      const options = createMockModalOptions({
        confirmButtonText: 'Save',
        size: 'large',
        showClose: false
      });

      const modal = new Modal(options);

      expect(modal.options.confirmButtonText).toBe('Save');
      expect(modal.options.size).toBe('large');
      expect(modal.options.showClose).toBe(false);
    });
  });

  describe('HTML Generation', () => {
    it('should generate correct modal HTML structure', () => {
      const options = createMockModalOptions({
        title: 'Test Title',
        content: '<p>Test Content</p>'
      });

      const modal = new Modal(options);
      const html = modal.generateHTML();

      expect(html).toContain('modal-overlay');
      expect(html).toContain('Test Title');
      expect(html).toContain('<p>Test Content</p>');
      expect(html).toContain('modal--medium');
    });

    it('should include close button when showClose is true', () => {
      const modal = new Modal(createMockModalOptions({ showClose: true }));
      const html = modal.generateHTML();

      expect(html).toContain('modal-close');
      expect(html).toContain('&times;');
    });

    it('should not include close button when showClose is false', () => {
      const modal = new Modal(createMockModalOptions({ showClose: false }));
      const html = modal.generateHTML();

      expect(html).not.toContain('modal-close');
    });

    it('should include footer with buttons when specified', () => {
      const modal = new Modal(createMockModalOptions({
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel'
      }));

      const html = modal.generateHTML();

      expect(html).toContain('modal-footer');
      expect(html).toContain('modal-confirm');
      expect(html).toContain('modal-cancel');
      expect(html).toContain('Confirm');
      expect(html).toContain('Cancel');
    });

    it('should not include footer when no buttons are shown', () => {
      const modal = new Modal(createMockModalOptions({
        showConfirmButton: false,
        showCancelButton: false
      }));

      const html = modal.generateHTML();

      expect(html).not.toContain('modal-footer');
    });
  });

  describe('Modal Creation', () => {
    it('should create modal in DOM when create() is called', () => {
      const modal = new Modal(createMockModalOptions());
      modal.create();

      const modalElement = document.getElementById('test-modal');
      expect(modalElement).toBeTruthy();
      expect(modalElement.classList.contains('modal-overlay')).toBe(true);
    });

    it('should not create duplicate modals', () => {
      const modal = new Modal(createMockModalOptions());
      modal.create();
      modal.create(); // Call again

      const modalElements = document.querySelectorAll('#test-modal');
      expect(modalElements.length).toBe(1);
    });
  });

  describe('Modal State Management', () => {
    it('should open modal correctly', () => {
      const modal = new Modal(createMockModalOptions());
      modal.open();

      const modalElement = document.getElementById('test-modal');
      expect(modalElement).toBeTruthy();
      expect(modalElement.getAttribute('aria-hidden')).toBe('false');
      expect(document.body.classList.contains('modal-open')).toBe(true);
      expect(modal.isOpen).toBe(true);
    });

    it('should close modal correctly', () => {
      const modal = new Modal(createMockModalOptions());
      modal.open();
      modal.close();

      const modalElement = document.getElementById('test-modal');
      expect(modalElement.getAttribute('aria-hidden')).toBe('true');
      expect(document.body.classList.contains('modal-open')).toBe(false);
      expect(modal.isOpen).toBe(false);
    });

    it('should call onClose callback when closing', () => {
      const onClose = vi.fn();
      const modal = new Modal(createMockModalOptions({ onClose }));

      modal.open();
      modal.close();

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('Modal Updates', () => {
    it('should update modal content', () => {
      const modal = new Modal(createMockModalOptions());
      modal.create();

      modal.update({
        title: 'Updated Title',
        content: '<p>Updated Content</p>'
      });

      const modalElement = document.getElementById('test-modal');
      expect(modalElement.innerHTML).toContain('Updated Title');
      expect(modalElement.innerHTML).toContain('<p>Updated Content</p>');
    });

    it('should maintain open state after update', () => {
      const modal = new Modal(createMockModalOptions());
      modal.open();

      modal.update({ title: 'New Title' });

      expect(modal.isOpen).toBe(true);
    });
  });

  describe('Modal Destruction', () => {
    it('should clean up resources when destroyed', () => {
      const modal = new Modal(createMockModalOptions());
      modal.open();

      // Mock the escape handler
      modal.escapeHandler = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      modal.destroy();

      expect(document.body.classList.contains('modal-open')).toBe(false);
      expect(modal.isOpen).toBe(false);
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const modal = new Modal(createMockModalOptions());
      const html = modal.generateHTML();

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="test-modal-title"');
    });

    it('should start with aria-hidden="true"', () => {
      const modal = new Modal(createMockModalOptions());
      const html = modal.generateHTML();

      expect(html).toContain('aria-hidden="true"');
    });
  });

  describe('Size Variants', () => {
    it('should apply correct size class', () => {
      const smallModal = new Modal(createMockModalOptions({ size: 'small' }));
      const mediumModal = new Modal(createMockModalOptions({ size: 'medium' }));
      const largeModal = new Modal(createMockModalOptions({ size: 'large' }));

      expect(smallModal.generateHTML()).toContain('modal--small');
      expect(mediumModal.generateHTML()).toContain('modal--medium');
      expect(largeModal.generateHTML()).toContain('modal--large');
    });
  });
});