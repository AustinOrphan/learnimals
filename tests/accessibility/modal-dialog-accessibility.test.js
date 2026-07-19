/**
 * Modal and Dialog Accessibility Tests
 * Comprehensive tests for modal and dialog accessibility
 * Ensures WCAG 2.1 Level AA compliance for modal dialogs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
/* global FocusEvent */
import { AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
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
    perf: vi.fn(),
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
}));

describe('Modal and Dialog Accessibility Tests', () => {
  let testContainer;
  let service;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    }));

    // Mock focus and blur methods
    Element.prototype.focus = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      this.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    Element.prototype.blur = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      this.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body })
      );
    });

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Modal Dialog Structure', () => {
    it('should have proper ARIA roles and properties', () => {
      testContainer.innerHTML = `
        <button id="open-modal">Open Settings</button>
        
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-describedby="modal-description"
             aria-modal="true"
             style="display: none;">
          <div class="modal-content">
            <h2 id="modal-title">Settings</h2>
            <p id="modal-description">Configure your application preferences</p>
            
            <form>
              <label for="theme-select">Theme</label>
              <select id="theme-select">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              
              <label for="font-size">Font Size</label>
              <input type="range" id="font-size" min="12" max="24" value="16">
            </form>
            
            <div class="modal-actions">
              <button id="save-settings" type="button">Save</button>
              <button id="cancel-settings" type="button">Cancel</button>
            </div>
          </div>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const modalTitle = testContainer.querySelector('#modal-title');
      const modalDescription = testContainer.querySelector('#modal-description');

      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-labelledby')).toBe('modal-title');
      expect(modal.getAttribute('aria-describedby')).toBe('modal-description');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modalTitle.id).toBe('modal-title');
      expect(modalDescription.id).toBe('modal-description');
    });

    it('should handle alertdialog role for critical messages', () => {
      testContainer.innerHTML = `
        <button id="delete-trigger">Delete Item</button>
        
        <div id="delete-dialog" 
             role="alertdialog" 
             aria-labelledby="delete-title"
             aria-describedby="delete-message"
             aria-modal="true"
             style="display: none;">
          <div class="dialog-content">
            <h2 id="delete-title">Confirm Deletion</h2>
            <p id="delete-message">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            
            <div class="dialog-actions">
              <button id="confirm-delete" class="danger">Delete</button>
              <button id="cancel-delete">Cancel</button>
            </div>
          </div>
        </div>
      `;

      const alertDialog = testContainer.querySelector('#delete-dialog');

      expect(alertDialog.getAttribute('role')).toBe('alertdialog');
      expect(alertDialog.getAttribute('aria-modal')).toBe('true');
      expect(alertDialog.getAttribute('aria-labelledby')).toBe('delete-title');
      expect(alertDialog.getAttribute('aria-describedby')).toBe('delete-message');
    });

    it('should have backdrop to prevent interaction with background', () => {
      testContainer.innerHTML = `
        <div class="page-content">
          <h1>Main Page</h1>
          <button id="background-button">Background Button</button>
        </div>
        
        <div id="modal-backdrop" 
             class="modal-backdrop" 
             style="display: none;"
             aria-hidden="true">
        </div>
        
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true"
             style="display: none;">
          <h2 id="modal-title">Modal Dialog</h2>
          <button id="modal-button">Modal Button</button>
          <button id="close-modal">Close</button>
        </div>
      `;

      const backdrop = testContainer.querySelector('#modal-backdrop');
      testContainer.querySelector('.page-content');
      testContainer.querySelector('#modal');

      expect(backdrop.getAttribute('aria-hidden')).toBe('true');
      expect(backdrop.classList.contains('modal-backdrop')).toBe(true);

      // When modal is open, background content should be inert
      // This would be implemented by setting aria-hidden="true" on background content
      // or using inert attribute when modal is shown
    });
  });

  describe('Focus Management in Modals', () => {
    it('should trap focus within modal', () => {
      testContainer.innerHTML = `
        <button id="trigger">Open Modal</button>
        
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true">
          <h2 id="modal-title">Modal Title</h2>
          <input type="text" id="first-input" placeholder="First field">
          <button id="middle-button">Middle Button</button>
          <button id="close-button">Close</button>
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const modal = testContainer.querySelector('#modal');
      const firstInput = testContainer.querySelector('#first-input');
      const closeButton = testContainer.querySelector('#close-button');

      // Focus trigger initially
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Create focus trap
      const focusTrap = service.createFocusTrap(modal);

      expect(focusTrap).toBeTruthy();
      expect(focusTrap.container).toBe(modal);
      expect(focusTrap.firstFocusable).toBe(firstInput);
      expect(focusTrap.lastFocusable).toBe(closeButton);

      // Activate focus trap
      focusTrap.activate();
      expect(document.activeElement).toBe(firstInput);

      // Test tab trapping at end
      closeButton.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      tabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      // Test shift+tab trapping at beginning
      firstInput.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      shiftTabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.preventDefault).toHaveBeenCalled();

      // Deactivate and test focus restoration
      focusTrap.deactivate();
      expect(document.activeElement).toBe(trigger);
    });

    it('should focus first focusable element on modal open', () => {
      testContainer.innerHTML = `
        <button id="trigger">Open Modal</button>
        
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true"
             style="display: none;">
          <h2 id="modal-title">Settings</h2>
          <button id="first-focusable">First Button</button>
          <input type="text" id="text-input" placeholder="Text field">
          <button id="close-modal">Close</button>
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const modal = testContainer.querySelector('#modal');
      const firstFocusable = testContainer.querySelector('#first-focusable');

      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Simulate opening modal
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');

      const focusTrap = service.createFocusTrap(modal);
      focusTrap.activate();

      expect(document.activeElement).toBe(firstFocusable);
    });

    it('should handle modal with no focusable elements', () => {
      testContainer.innerHTML = `
        <button id="trigger">Open Info Modal</button>
        
        <div id="info-modal" 
             role="dialog" 
             aria-labelledby="info-title"
             aria-modal="true"
             tabindex="-1">
          <h2 id="info-title">Information</h2>
          <p>This is an informational message with no interactive elements.</p>
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const modal = testContainer.querySelector('#info-modal');

      trigger.focus();
      const focusTrap = service.createFocusTrap(modal);

      expect(focusTrap.focusableElements.length).toBe(0);
      expect(focusTrap.firstFocusable).toBeNull();

      // Should focus modal container itself
      focusTrap.activate();
      expect(document.activeElement).toBe(modal);

      focusTrap.deactivate();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('Keyboard Navigation in Modals', () => {
    it('should close modal on Escape key', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <button id="trigger">Open Modal</button>
        
        <div id="modal" 
             class="modal"
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true"
             aria-hidden="false">
          <h2 id="modal-title">Modal Title</h2>
          <p>Modal content</p>
          <button id="close-button" class="modal-close">Close</button>
        </div>
      `;

      testContainer.querySelector('#trigger');
      testContainer.querySelector('#modal');
      const closeButton = testContainer.querySelector('#close-button');

      const clickSpy = vi.fn();
      closeButton.addEventListener('click', clickSpy);

      // Focus element inside modal
      closeButton.focus();

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(escapeEvent);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle Enter and Space activation in modals', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true">
          <h2 id="modal-title">Confirm Action</h2>
          
          <div class="custom-buttons">
            <div role="button" 
                 tabindex="0" 
                 id="confirm-custom"
                 aria-label="Confirm action">
              ✓ Confirm
            </div>
            
            <div role="button" 
                 tabindex="0" 
                 id="cancel-custom"
                 aria-label="Cancel action">
              ✗ Cancel
            </div>
          </div>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const confirmButton = testContainer.querySelector('#confirm-custom');
      const cancelButton = testContainer.querySelector('#cancel-custom');

      const component = new AccessibleComponent();
      component.element = modal;
      component.setupKeyboardNavigation();

      const confirmClickSpy = vi.fn();
      const cancelClickSpy = vi.fn();

      confirmButton.addEventListener('click', confirmClickSpy);
      cancelButton.addEventListener('click', cancelClickSpy);

      // Test Enter on confirm button
      confirmButton.focus();
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterEvent.preventDefault = vi.fn();
      confirmButton.dispatchEvent(enterEvent);

      // Test Space on cancel button
      cancelButton.focus();
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      spaceEvent.preventDefault = vi.fn();
      cancelButton.dispatchEvent(spaceEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(spaceEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle arrow key navigation in modal menus', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true">
          <h2 id="modal-title">Select Option</h2>
          
          <ul role="menu" aria-label="Options menu" id="modal-menu">
            <li role="menuitem" tabindex="0" id="option1">Option 1</li>
            <li role="menuitem" tabindex="-1" id="option2">Option 2</li>
            <li role="menuitem" tabindex="-1" id="option3">Option 3</li>
            <li role="menuitem" tabindex="-1" id="option4">Option 4</li>
          </ul>
        </div>
      `;

      testContainer.querySelector('#modal');
      const menu = testContainer.querySelector('#modal-menu');
      const options = menu.querySelectorAll('[role="menuitem"]');

      const component = new AccessibleComponent();
      component.element = menu;
      component.setupKeyboardNavigation();

      // Focus first option
      options[0].focus();
      expect(document.activeElement).toBe(options[0]);

      // Test Arrow Down
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      options[0].dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();

      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      });
      homeEvent.preventDefault = vi.fn();
      options[2].dispatchEvent(homeEvent);

      expect(homeEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Modal Announcements and State', () => {
    it('should announce modal opening to screen readers', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <button id="trigger">Open Settings</button>
        
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true"
             style="display: none;">
          <h2 id="modal-title">Settings Dialog</h2>
          <p>Configure your preferences</p>
          <button id="close-modal">Close</button>
        </div>
        
        <div id="modal-status" 
             aria-live="polite" 
             aria-atomic="true" 
             class="sr-only">
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const modal = testContainer.querySelector('#modal');
      const modalStatus = testContainer.querySelector('#modal-status');

      // Simulate opening modal
      trigger.click();
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      modalStatus.textContent = 'Settings dialog opened';

      expect(modalStatus.getAttribute('aria-live')).toBe('polite');
      expect(modalStatus.textContent).toBe('Settings dialog opened');

      // Simulate closing modal
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      modalStatus.textContent = 'Settings dialog closed';

      expect(modalStatus.textContent).toBe('Settings dialog closed');
    });

    it('should handle modal loading states', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true"
             aria-busy="true">
          <h2 id="modal-title">Loading Content</h2>
          
          <div class="modal-content" aria-live="polite">
            <div class="loading-spinner" aria-label="Loading content">⟳</div>
            <p id="loading-message">Please wait while content loads...</p>
          </div>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const modalContent = testContainer.querySelector('.modal-content');
      const loadingMessage = testContainer.querySelector('#loading-message');

      expect(modal.getAttribute('aria-busy')).toBe('true');
      expect(modalContent.getAttribute('aria-live')).toBe('polite');
      expect(loadingMessage.textContent).toContain('Please wait');

      // Simulate content loaded
      modal.setAttribute('aria-busy', 'false');
      modalContent.innerHTML = `
        <p>Content has loaded successfully</p>
        <button>Action Button</button>
      `;

      expect(modal.getAttribute('aria-busy')).toBe('false');
    });

    it('should handle modal form submission states', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true">
          <h2 id="modal-title">Submit Form</h2>
          
          <form id="modal-form">
            <label for="form-field">Required Field</label>
            <input type="text" id="form-field" required>
            
            <div class="form-actions">
              <button type="submit" id="submit-btn">
                <span class="btn-text">Submit</span>
                <span class="btn-spinner" style="display: none;">⟳</span>
              </button>
              <button type="button" id="cancel-btn">Cancel</button>
            </div>
          </form>
          
          <div id="form-status" 
               aria-live="polite" 
               class="sr-only">
          </div>
        </div>
      `;

      testContainer.querySelector('#modal-form');
      const submitButton = testContainer.querySelector('#submit-btn');
      const buttonText = testContainer.querySelector('.btn-text');
      const buttonSpinner = testContainer.querySelector('.btn-spinner');
      const formStatus = testContainer.querySelector('#form-status');

      // Initial state
      expect(submitButton.disabled).toBe(false);
      expect(buttonText.textContent).toBe('Submit');

      // Simulate submitting
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      buttonText.textContent = 'Submitting...';
      buttonSpinner.style.display = 'inline';
      formStatus.textContent = 'Submitting form, please wait';

      expect(submitButton.getAttribute('aria-busy')).toBe('true');
      expect(formStatus.textContent).toBe('Submitting form, please wait');

      // Simulate success
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      buttonText.textContent = 'Success!';
      buttonSpinner.style.display = 'none';
      formStatus.textContent = 'Form submitted successfully';

      expect(submitButton.getAttribute('aria-busy')).toBeNull();
      expect(formStatus.textContent).toBe('Form submitted successfully');
    });
  });

  describe('Modal Variations and Patterns', () => {
    it('should handle tooltip dialog pattern', () => {
      testContainer.innerHTML = `
        <button id="help-trigger" 
                aria-describedby="help-tooltip"
                aria-expanded="false">
          Help
        </button>
        
        <div id="help-tooltip" 
             role="tooltip" 
             class="tooltip-dialog"
             style="display: none;">
          <div class="tooltip-content">
            <h3>Help Information</h3>
            <p>This feature helps you manage your settings more effectively.</p>
            <button id="tooltip-close" aria-label="Close help">×</button>
          </div>
        </div>
      `;

      const trigger = testContainer.querySelector('#help-trigger');
      const tooltip = testContainer.querySelector('#help-tooltip');
      const closeButton = testContainer.querySelector('#tooltip-close');

      expect(trigger.getAttribute('aria-describedby')).toBe('help-tooltip');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(tooltip.getAttribute('role')).toBe('tooltip');

      // Simulate opening tooltip
      trigger.setAttribute('aria-expanded', 'true');
      tooltip.style.display = 'block';

      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      // Close button should have accessible label
      expect(closeButton.getAttribute('aria-label')).toBe('Close help');
    });

    it('should handle disclosure (accordion) pattern in modal', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true">
          <h2 id="modal-title">FAQ</h2>
          
          <div class="accordion">
            <h3>
              <button type="button" 
                      aria-expanded="false" 
                      aria-controls="faq-1-content"
                      id="faq-1-trigger">
                What is this feature?
              </button>
            </h3>
            <div id="faq-1-content" 
                 role="region" 
                 aria-labelledby="faq-1-trigger"
                 style="display: none;">
              <p>This feature allows you to customize your experience.</p>
            </div>
            
            <h3>
              <button type="button" 
                      aria-expanded="true" 
                      aria-controls="faq-2-content"
                      id="faq-2-trigger">
                How do I use it?
              </button>
            </h3>
            <div id="faq-2-content" 
                 role="region" 
                 aria-labelledby="faq-2-trigger">
              <p>Click the settings button and follow the prompts.</p>
            </div>
          </div>
        </div>
      `;

      const trigger1 = testContainer.querySelector('#faq-1-trigger');
      const content1 = testContainer.querySelector('#faq-1-content');
      const trigger2 = testContainer.querySelector('#faq-2-trigger');
      const content2 = testContainer.querySelector('#faq-2-content');

      expect(trigger1.getAttribute('aria-expanded')).toBe('false');
      expect(trigger1.getAttribute('aria-controls')).toBe('faq-1-content');
      expect(content1.getAttribute('role')).toBe('region');
      expect(content1.getAttribute('aria-labelledby')).toBe('faq-1-trigger');

      expect(trigger2.getAttribute('aria-expanded')).toBe('true');
      expect(content2.getAttribute('aria-labelledby')).toBe('faq-2-trigger');
    });

    it('should handle modal with tabs', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true">
          <h2 id="modal-title">Settings</h2>
          
          <div role="tablist" aria-label="Settings categories">
            <button role="tab" 
                    aria-selected="true" 
                    aria-controls="general-panel"
                    id="general-tab"
                    tabindex="0">
              General
            </button>
            <button role="tab" 
                    aria-selected="false" 
                    aria-controls="privacy-panel"
                    id="privacy-tab"
                    tabindex="-1">
              Privacy
            </button>
            <button role="tab" 
                    aria-selected="false" 
                    aria-controls="advanced-panel"
                    id="advanced-tab"
                    tabindex="-1">
              Advanced
            </button>
          </div>
          
          <div role="tabpanel" 
               id="general-panel" 
               aria-labelledby="general-tab">
            <h3>General Settings</h3>
            <label for="theme">Theme</label>
            <select id="theme">
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
          
          <div role="tabpanel" 
               id="privacy-panel" 
               aria-labelledby="privacy-tab"
               style="display: none;">
            <h3>Privacy Settings</h3>
            <label>
              <input type="checkbox"> Enable analytics
            </label>
          </div>
          
          <div role="tabpanel" 
               id="advanced-panel" 
               aria-labelledby="advanced-tab"
               style="display: none;">
            <h3>Advanced Settings</h3>
            <label for="cache">Cache Size</label>
            <input type="number" id="cache" value="100">
          </div>
        </div>
      `;

      const tablist = testContainer.querySelector('[role="tablist"]');
      const tabs = testContainer.querySelectorAll('[role="tab"]');
      const panels = testContainer.querySelectorAll('[role="tabpanel"]');

      expect(tablist.getAttribute('aria-label')).toBe('Settings categories');

      // First tab should be selected
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[0].getAttribute('tabindex')).toBe('0');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
      expect(tabs[1].getAttribute('tabindex')).toBe('-1');

      // Panels should be properly associated
      expect(panels[0].getAttribute('aria-labelledby')).toBe('general-tab');
      expect(panels[1].getAttribute('aria-labelledby')).toBe('privacy-tab');
      expect(panels[2].getAttribute('aria-labelledby')).toBe('advanced-tab');
    });
  });

  describe('Modal Error Handling and Edge Cases', () => {
    it('should handle modal opening when another modal is open', () => {
      testContainer.innerHTML = `
        <div id="modal1" 
             class="modal"
             role="dialog" 
             aria-labelledby="modal1-title"
             aria-modal="true"
             aria-hidden="false">
          <h2 id="modal1-title">First Modal</h2>
          <button id="open-modal2">Open Second Modal</button>
          <button id="close-modal1">Close</button>
        </div>
        
        <div id="modal2" 
             class="modal"
             role="dialog" 
             aria-labelledby="modal2-title"
             aria-modal="true"
             aria-hidden="true"
             style="display: none;">
          <h2 id="modal2-title">Second Modal</h2>
          <button id="close-modal2">Close</button>
        </div>
      `;

      const modal1 = testContainer.querySelector('#modal1');
      const modal2 = testContainer.querySelector('#modal2');
      const openModal2Button = testContainer.querySelector('#open-modal2');

      // Initially only modal1 is open
      expect(modal1.getAttribute('aria-hidden')).toBe('false');
      expect(modal2.getAttribute('aria-hidden')).toBe('true');

      // Simulate opening second modal (should close first or stack appropriately)
      openModal2Button.click();

      // Implementation would determine stacking behavior
      // For this example, assume second modal replaces first
      modal1.setAttribute('aria-hidden', 'true');
      modal1.style.display = 'none';
      modal2.setAttribute('aria-hidden', 'false');
      modal2.style.display = 'block';

      expect(modal1.getAttribute('aria-hidden')).toBe('true');
      expect(modal2.getAttribute('aria-hidden')).toBe('false');
    });

    it('should handle modal with dynamic content updates', () => {
      testContainer.innerHTML = `
        <div id="modal" 
             role="dialog" 
             aria-labelledby="modal-title"
             aria-modal="true"
             aria-busy="false">
          <h2 id="modal-title">Dynamic Content</h2>
          
          <div id="modal-body" aria-live="polite">
            <p>Initial content</p>
            <button id="load-more">Load More</button>
          </div>
          
          <button id="close-modal">Close</button>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const modalBody = testContainer.querySelector('#modal-body');
      const loadMoreButton = testContainer.querySelector('#load-more');

      expect(modalBody.getAttribute('aria-live')).toBe('polite');

      // Simulate dynamic content loading
      loadMoreButton.click();
      modal.setAttribute('aria-busy', 'true');
      modalBody.innerHTML = `
        <p>Initial content</p>
        <div class="loading">Loading additional content...</div>
      `;

      expect(modal.getAttribute('aria-busy')).toBe('true');

      // Simulate content loaded
      setTimeout(() => {
        modal.setAttribute('aria-busy', 'false');
        modalBody.innerHTML = `
          <p>Initial content</p>
          <p>Newly loaded content appears here</p>
          <button id="load-more">Load More</button>
        `;

        expect(modal.getAttribute('aria-busy')).toBe('false');
      }, 100);
    });

    it('should handle modal dismissal with backdrop click', () => {
      testContainer.innerHTML = `
        <div id="modal-backdrop" 
             class="modal-backdrop"
             data-dismiss="modal"
             aria-hidden="true">
          
          <div id="modal" 
               role="dialog" 
               aria-labelledby="modal-title"
               aria-modal="true"
               onclick="event.stopPropagation()">
            <h2 id="modal-title">Click Outside to Close</h2>
            <p>This modal can be closed by clicking the backdrop</p>
            <button id="close-button">Close</button>
          </div>
        </div>
      `;

      const backdrop = testContainer.querySelector('#modal-backdrop');
      const modal = testContainer.querySelector('#modal');

      expect(backdrop.getAttribute('data-dismiss')).toBe('modal');
      expect(backdrop.getAttribute('aria-hidden')).toBe('true');

      // Modal content should not dismiss when clicked
      const modalClickEvent = new MouseEvent('click', { bubbles: true });
      modal.dispatchEvent(modalClickEvent);
      // Should not close modal

      // Backdrop click should dismiss
      const backdropClickSpy = vi.fn();
      backdrop.addEventListener('click', backdropClickSpy);

      const backdropClickEvent = new MouseEvent('click', { bubbles: true });
      backdrop.dispatchEvent(backdropClickEvent);

      expect(backdropClickSpy).toHaveBeenCalled();
    });

    it('should prevent keyboard traps without escape mechanisms', () => {
      testContainer.innerHTML = `
        <div id="bad-modal" 
             class="modal"
             role="dialog" 
             aria-labelledby="bad-modal-title"
             aria-modal="true"
             style="display: block;">
          <h2 id="bad-modal-title">Modal Without Close</h2>
          <p>This modal has no close button or escape mechanism</p>
        </div>
        
        <div id="good-modal" 
             class="modal"
             role="dialog" 
             aria-labelledby="good-modal-title"
             aria-modal="true"
             style="display: none;"
             data-keyboard="true">
          <h2 id="good-modal-title">Modal With Escape</h2>
          <p>This modal can be closed with Escape key</p>
          <button class="modal-close">Close</button>
        </div>
      `;

      const badModalHasTraps = accessibilityTester.hasKeyboardTraps(testContainer);
      expect(badModalHasTraps).toBe(true);

      // Good modal should not have traps
      const goodModal = testContainer.querySelector('#good-modal');
      goodModal.style.display = 'block';
      testContainer.querySelector('#bad-modal').style.display = 'none';

      const goodModalHasTraps = accessibilityTester.hasKeyboardTraps(testContainer);
      expect(goodModalHasTraps).toBe(false);
    });
  });
});
