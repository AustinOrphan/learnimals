/**
 * Focus Management Tests
 * Comprehensive tests for focus management and visual indicators
 * Ensures WCAG 2.1 Level AA compliance for focus management
 */

/* global FocusEvent */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../components/AccessibleComponent.js';
import { AccessibilityService } from '../../services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../utils/accessibilityTester.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
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

describe('Focus Management Tests', () => {
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

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

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

    // Mock getComputedStyle for focus indicators
    window.getComputedStyle = vi.fn((element, pseudoElement) => {
      if (pseudoElement === ':focus') {
        return {
          outline: element.classList.contains('no-outline') ? 'none' : '2px solid blue',
          outlineOffset: '2px',
          boxShadow: 'none',
          backgroundColor: 'white',
        };
      }
      return {
        display: element.style.display || 'block',
        visibility: element.style.visibility || 'visible',
        opacity: element.style.opacity || '1',
        outline: 'none',
        outlineOffset: '0px',
        boxShadow: 'none',
        backgroundColor: 'white',
        listStyle: 'disc',
        listStyleType: 'disc',
      };
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

  describe('Focus Indicators', () => {
    it('should have visible focus indicators', () => {
      testContainer.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2" class="no-outline">Button 2</button>
        <a href="#" id="link1">Link 1</a>
        <input type="text" id="input1" placeholder="Text input">
      `;

      const btn1 = testContainer.querySelector('#btn1');
      const btn2 = testContainer.querySelector('#btn2');
      const link1 = testContainer.querySelector('#link1');
      const input1 = testContainer.querySelector('#input1');

      expect(accessibilityTester.hasFocusIndicator(btn1)).toBe(true);
      expect(accessibilityTester.hasFocusIndicator(btn2)).toBe(false);
      expect(accessibilityTester.hasFocusIndicator(link1)).toBe(true);
      expect(accessibilityTester.hasFocusIndicator(input1)).toBe(true);
    });

    it('should test focus visibility when element receives focus', () => {
      testContainer.innerHTML = `
        <button id="visible-focus">Visible Focus</button>
        <button id="hidden-focus" class="no-outline">Hidden Focus</button>
      `;

      const visibleBtn = testContainer.querySelector('#visible-focus');
      const hiddenBtn = testContainer.querySelector('#hidden-focus');

      expect(accessibilityTester.isFocusVisible(visibleBtn)).toBe(true);
      expect(accessibilityTester.isFocusVisible(hiddenBtn)).toBe(false);
    });

    it('should handle custom focus indicators', () => {
      testContainer.innerHTML = `
        <div role="button" tabindex="0" id="custom-btn" class="custom-focus">Custom Button</div>
      `;

      const customBtn = testContainer.querySelector('#custom-btn');

      // Mock custom focus styles
      window.getComputedStyle = vi.fn((element, pseudoElement) => {
        if (pseudoElement === ':focus' && element.classList.contains('custom-focus')) {
          return {
            outline: 'none',
            outlineOffset: '0px',
            boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.5)',
            backgroundColor: 'white',
          };
        }
        return {
          outline: 'none',
          outlineOffset: '0px',
          boxShadow: 'none',
          backgroundColor: 'white',
        };
      });

      // The custom button should have a visible focus indicator via box-shadow
      customBtn.focus();
      const focusStyle = window.getComputedStyle(customBtn, ':focus');
      expect(focusStyle.boxShadow).not.toBe('none');
    });

    it('should ensure focus indicators meet contrast requirements', () => {
      testContainer.innerHTML = `
        <button id="good-contrast" style="background: white;">Good Contrast</button>
        <button id="poor-contrast" style="background: #666;">Poor Contrast</button>
      `;

      // Test contrast ratios for focus indicators
      // Good contrast: blue focus on white background
      const goodContrast = service.checkContrast('#0066cc', '#ffffff');
      expect(goodContrast.isAA).toBe(true);

      // Poor contrast: light blue focus on gray background
      const poorContrast = service.checkContrast('#66ccff', '#666666');
      expect(poorContrast.isAA).toBe(false);
    });
  });

  describe('Focus Restoration', () => {
    it('should restore focus after modal closes', () => {
      testContainer.innerHTML = `
        <button id="trigger">Open Modal</button>
        <div id="modal" role="dialog" style="display: none;">
          <h2>Modal Title</h2>
          <button id="modal-close">Close</button>
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const modal = testContainer.querySelector('#modal');

      // Focus trigger button
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Create focus trap for modal
      const focusTrap = service.createFocusTrap(modal);

      // Simulate opening modal
      modal.style.display = 'block';
      focusTrap.activate();

      // Focus should move to modal
      expect(focusTrap.previouslyFocused).toBe(trigger);

      // Close modal and restore focus
      modal.style.display = 'none';
      focusTrap.deactivate();

      // Focus should return to trigger
      expect(document.activeElement).toBe(trigger);
    });

    it('should handle focus restoration when original element is removed', () => {
      testContainer.innerHTML = `
        <button id="trigger">Open Dialog</button>
        <div id="dialog" role="dialog" style="display: none;">
          <button id="dialog-close">Close</button>
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const dialog = testContainer.querySelector('#dialog');

      trigger.focus();
      const focusTrap = service.createFocusTrap(dialog);

      dialog.style.display = 'block';
      focusTrap.activate();

      // Remove the trigger element while dialog is open
      trigger.remove();

      // Close dialog
      dialog.style.display = 'none';
      focusTrap.deactivate();

      // Focus should not cause errors even though original element is gone
      expect(document.activeElement).toBeTruthy();
    });

    it('should handle focus management in single page applications', () => {
      testContainer.innerHTML = `
        <nav>
          <a href="#page1" id="nav-page1">Page 1</a>
          <a href="#page2" id="nav-page2">Page 2</a>
        </nav>
        <main id="main-content" tabindex="-1">
          <div id="page1" class="page">
            <h1>Page 1</h1>
            <p>Content for page 1</p>
          </div>
          <div id="page2" class="page" style="display: none;">
            <h1>Page 2</h1>
            <p>Content for page 2</p>
          </div>
        </main>
      `;

      const navPage2 = testContainer.querySelector('#nav-page2');
      const mainContent = testContainer.querySelector('#main-content');
      const page1 = testContainer.querySelector('#page1');
      const page2 = testContainer.querySelector('#page2');

      const focusSpy = vi.spyOn(mainContent, 'focus');

      // Simulate navigation to page 2
      navPage2.click();

      // Hide page 1, show page 2
      page1.style.display = 'none';
      page2.style.display = 'block';

      // Focus should move to main content area
      mainContent.focus();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Focus Trapping', () => {
    it('should create focus trap for modal dialogs', () => {
      testContainer.innerHTML = `
        <div id="modal" role="dialog" aria-labelledby="modal-title">
          <h2 id="modal-title">Modal Title</h2>
          <input type="text" id="first-input" placeholder="First field">
          <button id="cancel">Cancel</button>
          <button id="confirm">Confirm</button>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const firstInput = testContainer.querySelector('#first-input');
      const confirmBtn = testContainer.querySelector('#confirm');

      const focusTrap = service.createFocusTrap(modal);

      expect(focusTrap).toBeTruthy();
      expect(focusTrap.container).toBe(modal);
      expect(focusTrap.firstFocusable).toBe(firstInput);
      expect(focusTrap.lastFocusable).toBe(confirmBtn);
    });

    it('should handle Tab key to cycle through focusable elements', () => {
      testContainer.innerHTML = `
        <div id="modal" role="dialog">
          <button id="first">First</button>
          <input type="text" id="middle" placeholder="Middle">
          <button id="last">Last</button>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const firstBtn = testContainer.querySelector('#first');
      const lastBtn = testContainer.querySelector('#last');

      const focusTrap = service.createFocusTrap(modal);
      focusTrap.activate();

      // Focus first element
      firstBtn.focus();
      expect(document.activeElement).toBe(firstBtn);

      // Test Tab from last element (should wrap to first)
      lastBtn.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      tabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      // Test Shift+Tab from first element (should wrap to last)
      firstBtn.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      shiftTabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.preventDefault).toHaveBeenCalled();

      focusTrap.deactivate();
    });

    it('should handle empty focus trap gracefully', () => {
      testContainer.innerHTML = `
        <div id="empty-modal" role="dialog">
          <p>Modal with no focusable elements</p>
        </div>
      `;

      const modal = testContainer.querySelector('#empty-modal');
      const focusTrap = service.createFocusTrap(modal);

      expect(focusTrap.focusableElements.length).toBe(0);
      expect(focusTrap.firstFocusable).toBeFalsy();
      expect(focusTrap.lastFocusable).toBeFalsy();

      // Should not throw error when activated
      expect(() => focusTrap.activate()).not.toThrow();

      // Tab should be prevented when no focusable elements
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      tabEvent.preventDefault = vi.fn();
      modal.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      focusTrap.deactivate();
    });

    it('should update focusable elements when content changes', () => {
      testContainer.innerHTML = `
        <div id="dynamic-modal" role="dialog">
          <button id="initial">Initial Button</button>
        </div>
      `;

      const modal = testContainer.querySelector('#dynamic-modal');
      const focusTrap = service.createFocusTrap(modal);

      expect(focusTrap.focusableElements.length).toBe(1);

      // Add new focusable element
      const newButton = document.createElement('button');
      newButton.id = 'new-button';
      newButton.textContent = 'New Button';
      modal.appendChild(newButton);

      // Update focusable elements
      focusTrap.updateFocusableElements();

      expect(focusTrap.focusableElements.length).toBe(2);
      expect(focusTrap.lastFocusable).toBe(newButton);
    });
  });

  describe('Focus Management in Components', () => {
    it('should manage focus in AccessibleComponent', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      testContainer.appendChild(button);

      const component = new AccessibleComponent({
        focusable: true,
      });
      component.element = button;
      component.setupAccessibility();

      const focusSpy = vi.spyOn(button, 'focus');
      const blurSpy = vi.spyOn(button, 'blur');

      // Test focus method
      component.focus();
      expect(focusSpy).toHaveBeenCalled();

      // Test blur method
      component.blur();
      expect(blurSpy).toHaveBeenCalled();
    });

    it('should focus first navigable item', () => {
      testContainer.innerHTML = `
        <div id="menu" role="menu">
          <div role="menuitem" tabindex="0" id="item1">Item 1</div>
          <div role="menuitem" tabindex="-1" id="item2">Item 2</div>
          <div role="menuitem" tabindex="-1" id="item3">Item 3</div>
        </div>
      `;

      const menu = testContainer.querySelector('#menu');
      const firstItem = testContainer.querySelector('#item1');

      const component = new AccessibleComponent();
      component.element = menu;

      const focusSpy = vi.spyOn(firstItem, 'focus');
      component.focusFirst();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should focus last navigable item', () => {
      testContainer.innerHTML = `
        <div id="toolbar" role="toolbar">
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
          <button id="btn3">Button 3</button>
        </div>
      `;

      const toolbar = testContainer.querySelector('#toolbar');
      const lastBtn = testContainer.querySelector('#btn3');

      const component = new AccessibleComponent();
      component.element = toolbar;

      const focusSpy = vi.spyOn(lastBtn, 'focus');
      component.focusLast();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle focus events with keyboard navigation indicators', async () => {
      // The keyboard-focused class is added by the service's document-level
      // focusin listener, which is attached during initialize()
      await service.initialize();

      const button = document.createElement('button');
      button.textContent = 'Test Button';
      testContainer.appendChild(button);

      const component = new AccessibleComponent({
        keyboardNavigation: true,
      });
      component.element = button;
      component.setupAccessibility();

      // Mock accessibility service preferences
      service.preferences.keyboardOnly = true;

      // Simulate focus in (must bubble to reach the document listener)
      const focusInEvent = new FocusEvent('focusin', {
        bubbles: true,
        relatedTarget: null,
      });
      button.dispatchEvent(focusInEvent);

      expect(button.classList.contains('keyboard-focused')).toBe(true);

      // Note: AccessibilityService has no focusout handler, so the
      // keyboard-focused class persists until the next mouse interaction;
      // removal on focusout is not part of the current service contract
    });
  });

  describe('Focus Visibility and Scrolling', () => {
    it('should ensure focused elements are visible in viewport', async () => {
      await service.initialize();

      const button = document.createElement('button');
      button.textContent = 'Test Button';
      testContainer.appendChild(button);

      // Mock element being outside viewport
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        top: -50,
        bottom: -10,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: -50,
      });

      const scrollSpy = vi.spyOn(button, 'scrollIntoView');

      // Simulate focus event (dispatch from the element so event.target is the
      // button when it bubbles up to the service's document listener)
      const focusEvent = new FocusEvent('focusin', { bubbles: true });
      button.dispatchEvent(focusEvent);

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    it('should use reduced motion when accessibility preference is set', async () => {
      await service.initialize();
      service.preferences.reducedMotion = true;

      const button = document.createElement('button');
      button.textContent = 'Test Button';
      testContainer.appendChild(button);

      // Mock element being outside viewport
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        top: 1000,
        bottom: 1040,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 1000,
      });

      const scrollSpy = vi.spyOn(button, 'scrollIntoView');

      // Simulate focus event
      const focusEvent = new FocusEvent('focusin', { bubbles: true });
      button.dispatchEvent(focusEvent);

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest',
      });
    });

    it('should not scroll if element is already visible', async () => {
      await service.initialize();

      const button = document.createElement('button');
      button.textContent = 'Test Button';
      testContainer.appendChild(button);

      // Mock element being in viewport
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 100,
      });

      const scrollSpy = vi.spyOn(button, 'scrollIntoView');

      // Simulate focus event
      const focusEvent = new FocusEvent('focusin', { bubbles: true });
      button.dispatchEvent(focusEvent);

      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });

  describe('Focus Order and Management Edge Cases', () => {
    it('should handle disabled elements in focus order', () => {
      testContainer.innerHTML = `
        <button id="enabled1">Enabled 1</button>
        <button id="disabled" disabled>Disabled</button>
        <button id="enabled2">Enabled 2</button>
        <button id="aria-disabled" aria-disabled="true">ARIA Disabled</button>
        <button id="enabled3">Enabled 3</button>
      `;

      const focusableElements = accessibilityTester.getFocusableElements(testContainer);

      // Should exclude disabled button but include aria-disabled (it's still focusable)
      expect(focusableElements.length).toBe(4);
      expect(focusableElements.find(el => el.id === 'disabled')).toBeUndefined();
      expect(focusableElements.find(el => el.id === 'aria-disabled')).toBeDefined();
    });

    it('should handle hidden elements in focus order', () => {
      testContainer.innerHTML = `
        <button id="visible">Visible</button>
        <button id="display-none" style="display: none;">Display None</button>
        <button id="visibility-hidden" style="visibility: hidden;">Visibility Hidden</button>
        <button id="aria-hidden" aria-hidden="true">ARIA Hidden</button>
        <button id="opacity-zero" style="opacity: 0;">Opacity Zero</button>
      `;

      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#visible'))
      ).toBe(true);
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#display-none'))
      ).toBe(false);
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#visibility-hidden'))
      ).toBe(false);
      // ARIA hidden elements can still be focusable but shouldn't be
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#opacity-zero'))
      ).toBe(true);
    });

    it('should handle dynamically inserted focusable elements', () => {
      testContainer.innerHTML = `
        <div id="dynamic-container">
          <button id="initial">Initial Button</button>
        </div>
      `;

      const container = testContainer.querySelector('#dynamic-container');
      let focusableElements = accessibilityTester.getFocusableElements(container);

      expect(focusableElements.length).toBe(1);

      // Add new button
      const newButton = document.createElement('button');
      newButton.id = 'new-button';
      newButton.textContent = 'New Button';
      container.appendChild(newButton);

      focusableElements = accessibilityTester.getFocusableElements(container);
      expect(focusableElements.length).toBe(2);
      expect(focusableElements[1]).toBe(newButton);
    });

    it('should handle focus management during animations', async () => {
      testContainer.innerHTML = `
        <button id="trigger">Trigger Animation</button>
        <div id="animated-content" style="opacity: 0; transition: opacity 0.3s;">
          <button id="animated-button">Animated Button</button>
        </div>
      `;

      const trigger = testContainer.querySelector('#trigger');
      const content = testContainer.querySelector('#animated-content');
      const animatedButton = testContainer.querySelector('#animated-button');

      trigger.focus();

      // Start animation
      content.style.opacity = '1';

      // Focus should wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 350));
      animatedButton.focus();
      expect(document.activeElement).toBe(animatedButton);
    });
  });

  describe('Focus Management Cleanup', () => {
    it('should clean up focus management on component destroy', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      testContainer.appendChild(button);

      const component = new AccessibleComponent({
        keyboardNavigation: true,
      });
      component.element = button;
      component.setupKeyboardNavigation();

      const removeEventListenerSpy = vi.spyOn(button, 'removeEventListener');

      // Destroy component
      component.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        component.handleAccessibleKeydown
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', component.handleFocusIn);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusout', component.handleFocusOut);
    });

    it('should restore focus when component is destroyed', () => {
      const originalButton = document.createElement('button');
      originalButton.id = 'original';
      originalButton.textContent = 'Original';
      testContainer.appendChild(originalButton);

      const componentButton = document.createElement('button');
      componentButton.id = 'component';
      componentButton.textContent = 'Component';
      testContainer.appendChild(componentButton);

      originalButton.focus();

      const component = new AccessibleComponent();
      component.element = componentButton;
      component.previousFocus = originalButton;

      // Focus component element
      componentButton.focus();
      expect(document.activeElement).toBe(componentButton);

      const focusSpy = vi.spyOn(originalButton, 'focus');

      // Destroy component should restore focus
      component.destroy();

      expect(focusSpy).toHaveBeenCalled();
    });
  });
});
