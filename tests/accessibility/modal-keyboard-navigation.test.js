/**
 * Modal Dialog Keyboard Navigation Tests
 * 
 * Specialized tests for modal dialog keyboard accessibility including:
 * - Focus trapping and restoration
 * - Escape key handling
 * - Initial focus management
 * - Modal stacking scenarios
 * - Complex modal content navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Modal from '../../src/components/ui/Modal.js';
import { accessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../src/utils/accessibilityTester.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    level: 2,
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

describe('Modal Dialog Keyboard Navigation Tests', () => {
  let testContainer;
  let modal;
  let triggerButton;

  beforeEach(() => {
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock focus methods
    Element.prototype.focus = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    });

    Element.prototype.blur = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });

    // Create trigger button
    testContainer.innerHTML = '<button id="modal-trigger">Open Modal</button>';
    triggerButton = testContainer.querySelector('#modal-trigger');
  });

  afterEach(() => {
    if (modal) {
      modal.destroy();
      modal = null;
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Basic Modal Focus Management', () => {
    it('should focus first focusable element when modal opens', () => {
      modal = new Modal({
        id: 'focus-test-modal',
        title: 'Focus Test',
        content: `
          <p>Modal content</p>
          <input type="text" id="first-input" placeholder="First field">
          <input type="text" id="second-input" placeholder="Second field">
        `,
        showConfirmButton: true,
        showCancelButton: true
      });

      modal.create();
      modal.open();

      const modalElement = document.getElementById('focus-test-modal');
      const firstFocusable = modalElement.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
      
      expect(firstFocusable).toBeTruthy();
      expect(firstFocusable.focus).toHaveBeenCalled();
    });

    it('should restore focus to trigger element when modal closes', () => {
      triggerButton.focus();
      const focusSpy = vi.spyOn(triggerButton, 'focus');

      modal = new Modal({
        id: 'restore-focus-modal',
        title: 'Focus Restore Test',
        content: '<p>Test content</p>',
        showConfirmButton: true
      });

      modal.create();
      modal.open();
      modal.close();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should trap focus within modal boundaries', () => {
      modal = new Modal({
        id: 'focus-trap-modal',
        title: 'Focus Trap Test',
        content: `
          <input type="text" id="input1" placeholder="Input 1">
          <button id="action-btn">Action</button>
          <input type="text" id="input2" placeholder="Input 2">
        `,
        showConfirmButton: true,
        showCancelButton: true
      });

      modal.create();
      modal.open();

      const modalElement = document.getElementById('focus-trap-modal');
      const focusableElements = accessibilityTester.getFocusableElements(modalElement);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Simulate Tab on last element - should wrap to first
      lastElement.focus();
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true, 
        cancelable: true 
      });
      tabEvent.preventDefault = vi.fn();
      lastElement.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      // Simulate Shift+Tab on first element - should wrap to last
      firstElement.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab',
        shiftKey: true,
        bubbles: true, 
        cancelable: true 
      });
      shiftTabEvent.preventDefault = vi.fn();
      firstElement.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Escape Key Functionality', () => {
    it('should close modal when Escape key is pressed', () => {
      modal = new Modal({
        id: 'escape-modal',
        title: 'Escape Test',
        content: '<p>Press Escape to close</p>',
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      expect(modal.isOpen).toBe(true);

      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });

      document.dispatchEvent(escapeEvent);

      expect(modal.isOpen).toBe(false);
    });

    it('should handle Escape key in nested focusable elements', () => {
      modal = new Modal({
        id: 'nested-escape-modal',
        title: 'Nested Escape Test',
        content: `
          <div>
            <input type="text" id="nested-input" placeholder="Type here">
            <select id="nested-select">
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        `,
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      const nestedInput = document.getElementById('nested-input');
      nestedInput.focus();

      expect(modal.isOpen).toBe(true);

      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });

      nestedInput.dispatchEvent(escapeEvent);

      expect(modal.isOpen).toBe(false);
    });

    it('should not close modal if escape is handled by child element', () => {
      modal = new Modal({
        id: 'escape-handled-modal',
        title: 'Escape Handled Test',
        content: `
          <div>
            <input type="text" id="escape-handler" placeholder="Handles its own escape">
          </div>
        `,
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      const escapeHandler = document.getElementById('escape-handler');
      
      // Add event listener that prevents default
      escapeHandler.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          e.preventDefault();
        }
      });

      escapeHandler.focus();

      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });
      escapeEvent.stopPropagation = vi.fn();
      escapeEvent.preventDefault = vi.fn();

      escapeHandler.dispatchEvent(escapeEvent);

      expect(escapeEvent.stopPropagation).toHaveBeenCalled();
      expect(modal.isOpen).toBe(true);
    });
  });

  describe('Complex Modal Content Navigation', () => {
    it('should handle forms within modals with proper tab order', () => {
      modal = new Modal({
        id: 'form-modal',
        title: 'Form Modal',
        content: `
          <form id="modal-form">
            <div>
              <label for="name">Name:</label>
              <input type="text" id="name" name="name" required>
            </div>
            <div>
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div>
              <label for="category">Category:</label>
              <select id="category" name="category">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div>
              <fieldset>
                <legend>Notifications:</legend>
                <label>
                  <input type="checkbox" name="notifications" value="email"> Email
                </label>
                <label>
                  <input type="checkbox" name="notifications" value="sms"> SMS
                </label>
              </fieldset>
            </div>
            <button type="submit" id="form-submit">Submit Form</button>
          </form>
        `,
        showConfirmButton: false,
        showCancelButton: true
      });

      modal.create();
      modal.open();

      const modalElement = document.getElementById('form-modal');
      const focusableElements = accessibilityTester.getFocusableElements(modalElement);

      // Should include all form elements plus cancel button
      expect(focusableElements.length).toBeGreaterThan(7);

      // Test tab order through form elements
      const expectedOrder = ['name', 'email', 'category'];
      const actualElements = focusableElements.slice(0, 3);
      
      actualElements.forEach((element, index) => {
        expect(element.id || element.name).toBe(expectedOrder[index]);
      });
    });

    it('should handle tab panels within modals', () => {
      modal = new Modal({
        id: 'tabpanel-modal',
        title: 'Tab Panel Modal',
        content: `
          <div role="tablist" aria-label="Modal Tabs">
            <button role="tab" tabindex="0" aria-selected="true" aria-controls="panel1" id="tab1">Tab 1</button>
            <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel2" id="tab2">Tab 2</button>
            <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel3" id="tab3">Tab 3</button>
          </div>
          <div role="tabpanel" id="panel1" aria-labelledby="tab1">
            <p>Panel 1 content</p>
            <button id="panel1-btn">Panel 1 Button</button>
          </div>
          <div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
            <p>Panel 2 content</p>
            <input type="text" id="panel2-input" placeholder="Panel 2 input">
          </div>
          <div role="tabpanel" id="panel3" aria-labelledby="tab3" hidden>
            <p>Panel 3 content</p>
          </div>
        `,
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      const tab1 = document.getElementById('tab1');
      const tab2 = document.getElementById('tab2');
      const panel1Btn = document.getElementById('panel1-btn');

      // Test arrow navigation within tabs
      tab1.focus();
      
      const arrowRightEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true, 
        cancelable: true 
      });
      arrowRightEvent.preventDefault = vi.fn();
      tab1.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();

      // Test Tab key to move from tablist to tabpanel content
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true, 
        cancelable: true 
      });
      tab1.dispatchEvent(tabEvent);

      // Should move to first focusable element in active panel
      expect(panel1Btn.focus).toHaveBeenCalled();
    });

    it('should handle lists and grids within modals', () => {
      modal = new Modal({
        id: 'list-modal',
        title: 'List Modal',
        content: `
          <div>
            <h3>Options List</h3>
            <ul role="listbox" aria-label="Options" tabindex="0">
              <li role="option" tabindex="-1" aria-selected="false" id="option1">Option 1</li>
              <li role="option" tabindex="-1" aria-selected="false" id="option2">Option 2</li>
              <li role="option" tabindex="-1" aria-selected="true" id="option3">Option 3</li>
              <li role="option" tabindex="-1" aria-selected="false" id="option4">Option 4</li>
            </ul>
          </div>
          <div>
            <h3>Data Grid</h3>
            <div role="grid" tabindex="0">
              <div role="row">
                <div role="columnheader" tabindex="-1">Name</div>
                <div role="columnheader" tabindex="-1">Value</div>
              </div>
              <div role="row">
                <div role="gridcell" tabindex="-1">Item 1</div>
                <div role="gridcell" tabindex="-1">Value 1</div>
              </div>
            </div>
          </div>
        `,
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      const listbox = document.querySelector('[role="listbox"]');
      const grid = document.querySelector('[role="grid"]');

      // Test arrow navigation in listbox
      listbox.focus();
      
      const arrowDownEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowDown', 
        bubbles: true, 
        cancelable: true 
      });
      arrowDownEvent.preventDefault = vi.fn();
      listbox.dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();

      // Test arrow navigation in grid
      grid.focus();
      
      const arrowRightEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true, 
        cancelable: true 
      });
      arrowRightEvent.preventDefault = vi.fn();
      grid.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Modal Stacking and Multiple Modals', () => {
    it('should handle focus trapping with stacked modals', () => {
      // Create first modal
      const modal1 = new Modal({
        id: 'modal1',
        title: 'First Modal',
        content: '<button id="open-modal2">Open Second Modal</button>',
        showConfirmButton: true
      });

      modal1.create();
      modal1.open();

      // Create second modal
      const modal2 = new Modal({
        id: 'modal2',
        title: 'Second Modal',
        content: '<p>Second modal content</p>',
        showConfirmButton: true
      });

      modal2.create();
      modal2.open();

      // Focus should be trapped in the topmost modal (modal2)
      const modal2Element = document.getElementById('modal2');
      const modal2FocusableElements = accessibilityTester.getFocusableElements(modal2Element);

      expect(modal2FocusableElements.length).toBeGreaterThan(0);

      // Test escape closes topmost modal first
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });

      document.dispatchEvent(escapeEvent);

      expect(modal2.isOpen).toBe(false);
      expect(modal1.isOpen).toBe(true);

      // Clean up
      modal1.destroy();
      modal2.destroy();
    });

    it('should properly restore focus when closing stacked modals', () => {
      triggerButton.focus();

      // Create and open first modal
      const modal1 = new Modal({
        id: 'stacked-modal1',
        title: 'First Modal',
        content: '<button id="modal1-btn">Modal 1 Button</button>',
        showConfirmButton: true
      });

      modal1.create();
      modal1.open();

      const modal1Btn = document.getElementById('modal1-btn');
      modal1Btn.focus();

      // Create and open second modal
      const modal2 = new Modal({
        id: 'stacked-modal2',
        title: 'Second Modal',
        content: '<button id="modal2-btn">Modal 2 Button</button>',
        showConfirmButton: true
      });

      modal2.create();
      modal2.open();

      // Close second modal - focus should restore to modal1 button
      const modal1BtnFocusSpy = vi.spyOn(modal1Btn, 'focus');
      modal2.close();

      expect(modal1BtnFocusSpy).toHaveBeenCalled();

      // Close first modal - focus should restore to trigger button
      const triggerFocusSpy = vi.spyOn(triggerButton, 'focus');
      modal1.close();

      expect(triggerFocusSpy).toHaveBeenCalled();

      // Clean up
      modal1.destroy();
      modal2.destroy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle modal with no focusable elements gracefully', () => {
      modal = new Modal({
        id: 'no-focus-modal',
        title: 'No Focus Modal',
        content: '<p>This modal has no focusable elements</p>',
        showConfirmButton: false,
        showCancelButton: false,
        showClose: false
      });

      modal.create();
      
      // Should not throw error when opening
      expect(() => modal.open()).not.toThrow();

      // Modal itself should receive focus
      const modalElement = document.getElementById('no-focus-modal').querySelector('.modal');
      expect(modalElement.getAttribute('tabindex')).toBe('0');
    });

    it('should handle focus restoration when trigger element is removed', () => {
      triggerButton.focus();

      modal = new Modal({
        id: 'removed-trigger-modal',
        title: 'Removed Trigger Test',
        content: '<p>Trigger will be removed</p>',
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      // Remove trigger button
      triggerButton.remove();

      // Should not throw error when closing
      expect(() => modal.close()).not.toThrow();

      // Focus should fallback to document.body or appropriate element
      expect(document.activeElement).toBeTruthy();
    });

    it('should handle rapid modal open/close operations', () => {
      modal = new Modal({
        id: 'rapid-modal',
        title: 'Rapid Test',
        content: '<p>Rapid open/close test</p>',
        showConfirmButton: true
      });

      modal.create();

      // Rapid open/close operations
      for (let i = 0; i < 5; i++) {
        expect(() => {
          modal.open();
          modal.close();
        }).not.toThrow();
      }

      expect(modal.isOpen).toBe(false);
    });

    it('should handle modal opening before previous modal animation completes', async () => {
      const modal1 = new Modal({
        id: 'animation-modal1',
        title: 'Animation Test 1',
        content: '<p>First modal</p>',
        showConfirmButton: true
      });

      const modal2 = new Modal({
        id: 'animation-modal2',
        title: 'Animation Test 2',
        content: '<p>Second modal</p>',
        showConfirmButton: true
      });

      modal1.create();
      modal2.create();

      // Open first modal
      modal1.open();
      
      // Immediately open second modal before first animation completes
      modal2.open();

      expect(modal1.isOpen).toBe(true);
      expect(modal2.isOpen).toBe(true);

      // Clean up
      modal1.destroy();
      modal2.destroy();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA attributes for screen readers', () => {
      modal = new Modal({
        id: 'aria-modal',
        title: 'ARIA Test Modal',
        content: '<p>Testing ARIA attributes</p>',
        showConfirmButton: true
      });

      modal.create();

      const modalElement = document.getElementById('aria-modal');
      const dialogElement = modalElement.querySelector('[role="dialog"]');

      expect(dialogElement.getAttribute('role')).toBe('dialog');
      expect(dialogElement.getAttribute('aria-modal')).toBe('true');
      expect(dialogElement.getAttribute('aria-labelledby')).toBe('aria-modal-title');
      expect(modalElement.getAttribute('aria-hidden')).toBe('true');

      modal.open();

      expect(modalElement.getAttribute('aria-hidden')).toBe('false');
    });

    it('should announce modal state changes to screen readers', () => {
      const announceSpy = vi.spyOn(accessibilityService, 'announce');

      modal = new Modal({
        id: 'announce-modal',
        title: 'Announcement Test',
        content: '<p>Testing announcements</p>',
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('modal opened'),
        'polite'
      );

      modal.close();

      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('modal closed'),
        'polite'
      );
    });

    it('should pass automated accessibility audit', () => {
      modal = new Modal({
        id: 'audit-modal',
        title: 'Accessibility Audit Modal',
        content: `
          <div>
            <h3>Modal Content</h3>
            <p>This modal should pass accessibility audits.</p>
            <label for="audit-input">Input field:</label>
            <input type="text" id="audit-input" name="audit-input">
          </div>
        `,
        showConfirmButton: true,
        showCancelButton: true
      });

      modal.create();
      modal.open();

      const modalElement = document.getElementById('audit-modal');
      const auditResults = accessibilityTester.runAudit(modalElement);

      expect(auditResults.passed).toBe(true);
      expect(auditResults.errors.length).toBe(0);
    });
  });
});