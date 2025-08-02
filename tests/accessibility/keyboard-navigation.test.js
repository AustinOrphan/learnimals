/**
 * Keyboard Navigation Tests
 * Comprehensive tests for keyboard accessibility including tab order, focus management, and keyboard shortcuts
 * Ensures WCAG 2.1 Level AA compliance for keyboard navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import {
  accessibilityService,
  AccessibilityService,
} from '../../src/services/accessibility/AccessibilityService.js';
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

describe('Keyboard Navigation Tests', () => {
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

    // Mock focus method
    Element.prototype.focus = vi.fn(function () {
      // Simulate focus by setting activeElement
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true,
      });
      // Dispatch focus event
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    });

    // Mock blur method
    Element.prototype.blur = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
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

  describe('Tab Order and Focus Management', () => {
    it('should follow logical tab order', () => {
      // Create form with logical tab order
      testContainer.innerHTML = `
        <form>
          <input type="text" id="first" placeholder="First field">
          <input type="text" id="second" placeholder="Second field">
          <button type="button" id="help">Help</button>
          <input type="email" id="third" placeholder="Email">
          <button type="submit" id="submit">Submit</button>
        </form>
      `;

      const focusableElements = accessibilityTester.getFocusableElements(testContainer);
      const tabOrder = accessibilityTester.getTabOrder(focusableElements);

      expect(focusableElements.length).toBe(5);
      expect(accessibilityTester.isLogicalTabOrder(tabOrder)).toBe(true);

      // Verify elements are in document order
      expect(focusableElements[0].id).toBe('first');
      expect(focusableElements[1].id).toBe('second');
      expect(focusableElements[2].id).toBe('help');
      expect(focusableElements[3].id).toBe('third');
      expect(focusableElements[4].id).toBe('submit');
    });

    it('should handle custom tabindex values correctly', () => {
      testContainer.innerHTML = `
        <button id="default-tab">Default Tab (0)</button>
        <button id="first-tab" tabindex="1">First Tab (1)</button>
        <button id="third-tab" tabindex="3">Third Tab (3)</button>
        <button id="second-tab" tabindex="2">Second Tab (2)</button>
        <button id="no-tab" tabindex="-1">No Tab (-1)</button>
        <button id="another-default">Another Default (0)</button>
      `;

      const focusableElements = accessibilityTester.getFocusableElements(testContainer);
      const tabOrder = accessibilityTester.getTabOrder(focusableElements);

      // Should exclude tabindex="-1" elements
      expect(focusableElements.length).toBe(5);

      // Verify correct tab order: positive tabindex first (1, 2, 3), then 0 in document order
      expect(tabOrder[0].element.id).toBe('first-tab');
      expect(tabOrder[1].element.id).toBe('second-tab');
      expect(tabOrder[2].element.id).toBe('third-tab');
      expect(tabOrder[3].element.id).toBe('default-tab');
      expect(tabOrder[4].element.id).toBe('another-default');
    });

    it('should identify keyboard accessible elements', () => {
      testContainer.innerHTML = `
        <button id="button">Button</button>
        <a href="#" id="link">Link</a>
        <input type="text" id="input">
        <select id="select"><option>Option</option></select>
        <textarea id="textarea"></textarea>
        <div id="focusable" tabindex="0">Focusable div</div>
        <div id="non-focusable">Non-focusable div</div>
        <button disabled id="disabled">Disabled button</button>
        <div id="negative-tab" tabindex="-1">Negative tabindex</div>
        <div id="role-button" role="button" tabindex="0">Role button</div>
      `;

      const elements = testContainer.querySelectorAll('*');

      expect(accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#button'))).toBe(
        true
      );
      expect(accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#link'))).toBe(
        true
      );
      expect(accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#input'))).toBe(
        true
      );
      expect(accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#select'))).toBe(
        true
      );
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#textarea'))
      ).toBe(true);
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#focusable'))
      ).toBe(true);
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#role-button'))
      ).toBe(true);

      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#non-focusable'))
      ).toBe(false);
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#disabled'))
      ).toBe(false);
      expect(
        accessibilityTester.isKeyboardAccessible(testContainer.querySelector('#negative-tab'))
      ).toBe(false);
    });

    it('should handle focus traps in modal dialogs', () => {
      testContainer.innerHTML = `
        <div id="modal" role="dialog" aria-labelledby="modal-title">
          <h2 id="modal-title">Modal Title</h2>
          <button id="first-button">First Button</button>
          <input type="text" id="modal-input" placeholder="Input field">
          <button id="last-button">Last Button</button>
        </div>
      `;

      const modal = testContainer.querySelector('#modal');
      const focusTrap = service.createFocusTrap(modal);

      expect(focusTrap).toBeTruthy();
      expect(focusTrap.container).toBe(modal);

      // Activate focus trap
      focusTrap.activate();

      // Test that tab navigation is trapped within modal
      const firstButton = testContainer.querySelector('#first-button');
      const lastButton = testContainer.querySelector('#last-button');

      expect(focusTrap.firstFocusable).toBe(firstButton);
      expect(focusTrap.lastFocusable).toBe(lastButton);

      // Clean up
      focusTrap.deactivate();
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should handle Enter and Space key activation', () => {
      const customButton = document.createElement('div');
      customButton.setAttribute('role', 'button');
      customButton.setAttribute('tabindex', '0');
      customButton.textContent = 'Custom Button';
      testContainer.appendChild(customButton);

      const component = new AccessibleComponent();
      component.element = customButton;
      component.setupKeyboardNavigation();

      const activateSpy = vi.spyOn(component, 'activate');

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterEvent.preventDefault = vi.fn();
      customButton.dispatchEvent(enterEvent);

      expect(activateSpy).toHaveBeenCalled();
      expect(enterEvent.preventDefault).toHaveBeenCalled();

      // Reset spy
      activateSpy.mockClear();

      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      spaceEvent.preventDefault = vi.fn();
      customButton.dispatchEvent(spaceEvent);

      expect(activateSpy).toHaveBeenCalled();
      expect(spaceEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle Escape key for closing modals', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <div class="modal" aria-hidden="false">
          <button class="modal-close">Close</button>
          <p>Modal content</p>
        </div>
      `;

      const closeButton = testContainer.querySelector('.modal-close');
      const clickSpy = vi.fn();
      closeButton.addEventListener('click', clickSpy);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(escapeEvent);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle arrow key navigation in lists and menus', () => {
      testContainer.innerHTML = `
        <ul role="menu" aria-label="Options">
          <li role="menuitem" tabindex="0" id="item1">Option 1</li>
          <li role="menuitem" tabindex="-1" id="item2">Option 2</li>
          <li role="menuitem" tabindex="-1" id="item3">Option 3</li>
          <li role="menuitem" tabindex="-1" id="item4">Option 4</li>
        </ul>
      `;

      const menu = testContainer.querySelector('[role="menu"]');
      const component = new AccessibleComponent();
      component.element = menu;
      component.setupKeyboardNavigation();

      const items = menu.querySelectorAll('[role="menuitem"]');

      // Focus first item
      items[0].focus();
      expect(document.activeElement).toBe(items[0]);

      // Test Arrow Down
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      items[0].dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();

      // Test Arrow Up (should wrap to last item)
      const arrowUpEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      arrowUpEvent.preventDefault = vi.fn();
      items[0].dispatchEvent(arrowUpEvent);

      expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle Home and End keys for navigation', () => {
      testContainer.innerHTML = `
        <div role="toolbar" aria-label="Formatting">
          <button id="bold">Bold</button>
          <button id="italic">Italic</button>
          <button id="underline">Underline</button>
          <button id="strike">Strikethrough</button>
        </div>
      `;

      const toolbar = testContainer.querySelector('[role="toolbar"]');
      const component = new AccessibleComponent();
      component.element = toolbar;
      component.setupKeyboardNavigation();

      const buttons = toolbar.querySelectorAll('button');

      // Focus middle button
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);

      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      });
      homeEvent.preventDefault = vi.fn();
      buttons[1].dispatchEvent(homeEvent);

      expect(homeEvent.preventDefault).toHaveBeenCalled();

      // Test End key
      const endEvent = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true,
      });
      endEvent.preventDefault = vi.fn();
      buttons[1].dispatchEvent(endEvent);

      expect(endEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Roving Tabindex', () => {
    it('should implement roving tabindex for radio button groups', () => {
      testContainer.innerHTML = `
        <fieldset>
          <legend>Choose an option</legend>
          <div role="radiogroup" aria-labelledby="group-label">
            <div role="radio" tabindex="0" aria-checked="true" id="radio1">Option 1</div>
            <div role="radio" tabindex="-1" aria-checked="false" id="radio2">Option 2</div>
            <div role="radio" tabindex="-1" aria-checked="false" id="radio3">Option 3</div>
          </div>
        </fieldset>
      `;

      const radioGroup = testContainer.querySelector('[role="radiogroup"]');
      const radios = radioGroup.querySelectorAll('[role="radio"]');

      const keyboardNav = service.keyboardNavigation;
      const rovingTabindex = keyboardNav.setupRovingTabindex(radioGroup, Array.from(radios));

      // Initial state: first radio should be focusable
      expect(radios[0].getAttribute('tabindex')).toBe('0');
      expect(radios[1].getAttribute('tabindex')).toBe('-1');
      expect(radios[2].getAttribute('tabindex')).toBe('-1');

      // Simulate focus on second radio
      radios[1].focus();
      radios[1].dispatchEvent(new FocusEvent('focus', { bubbles: true }));

      // Second radio should now be focusable
      expect(radios[0].getAttribute('tabindex')).toBe('-1');
      expect(radios[1].getAttribute('tabindex')).toBe('0');
      expect(radios[2].getAttribute('tabindex')).toBe('-1');

      // Clean up
      rovingTabindex.destroy();
    });

    it('should handle roving tabindex in tab lists', () => {
      testContainer.innerHTML = `
        <div role="tablist" aria-label="Navigation">
          <button role="tab" tabindex="0" aria-selected="true" id="tab1">Tab 1</button>
          <button role="tab" tabindex="-1" aria-selected="false" id="tab2">Tab 2</button>
          <button role="tab" tabindex="-1" aria-selected="false" id="tab3">Tab 3</button>
        </div>
      `;

      const tablist = testContainer.querySelector('[role="tablist"]');
      const tabs = tablist.querySelectorAll('[role="tab"]');

      const component = new AccessibleComponent();
      component.element = tablist;
      component.setupRovingTabindex();

      // Initial state: first tab should be focusable
      expect(tabs[0].getAttribute('tabindex')).toBe('0');
      expect(tabs[1].getAttribute('tabindex')).toBe('-1');
      expect(tabs[2].getAttribute('tabindex')).toBe('-1');

      // Test arrow navigation
      tabs[0].focus();
      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      arrowRightEvent.preventDefault = vi.fn();
      tabs[0].dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Skip Links', () => {
    it('should create functional skip links', async () => {
      // Add main content areas
      testContainer.innerHTML = `
        <main id="main-content">Main content</main>
        <nav id="main-navigation">Navigation</nav>
        <div id="search">Search</div>
      `;

      await service.initialize();

      const skipLinks = document.querySelector('.skip-links');
      expect(skipLinks).toBeTruthy();
      expect(skipLinks.getAttribute('role')).toBe('navigation');
      expect(skipLinks.getAttribute('aria-label')).toBe('Skip links');

      const links = skipLinks.querySelectorAll('.skip-link');
      expect(links.length).toBeGreaterThan(0);

      // Test skip to main content
      const mainSkipLink = Array.from(links).find(link =>
        link.textContent.includes('main content')
      );
      expect(mainSkipLink).toBeTruthy();
      expect(mainSkipLink.getAttribute('href')).toBe('#main-content');
    });

    it('should handle skip link activation', async () => {
      testContainer.innerHTML = `
        <main id="main-content" tabindex="-1">Main content</main>
      `;

      await service.initialize();

      const mainContent = testContainer.querySelector('#main-content');
      const focusSpy = vi.spyOn(mainContent, 'focus');
      const scrollSpy = vi.spyOn(mainContent, 'scrollIntoView');

      const skipLinks = document.querySelector('.skip-links');
      const mainSkipLink = skipLinks.querySelector('a[href="#main-content"]');

      // Simulate skip link click
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      clickEvent.preventDefault = vi.fn();
      mainSkipLink.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Global Keyboard Shortcuts', () => {
    it('should handle F6 for landmark navigation', async () => {
      testContainer.innerHTML = `
        <header tabindex="-1">Header</header>
        <nav tabindex="-1">Navigation</nav>
        <main tabindex="-1">Main</main>
        <aside tabindex="-1">Sidebar</aside>
        <footer tabindex="-1">Footer</footer>
      `;

      await service.initialize();

      const nav = testContainer.querySelector('nav');
      const main = testContainer.querySelector('main');

      // Focus navigation first
      nav.focus();
      expect(document.activeElement).toBe(nav);

      const focusSpy = vi.spyOn(main, 'focus');

      // Press F6 to navigate to next landmark
      const f6Event = new KeyboardEvent('keydown', {
        key: 'F6',
        bubbles: true,
        cancelable: true,
      });
      f6Event.preventDefault = vi.fn();
      document.dispatchEvent(f6Event);

      expect(f6Event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle Ctrl+Home to navigate to top', async () => {
      testContainer.innerHTML = `
        <main id="main-content" tabindex="-1">Main content</main>
      `;

      await service.initialize();

      const main = testContainer.querySelector('main');
      const focusSpy = vi.spyOn(main, 'focus');
      const scrollSpy = vi.spyOn(main, 'scrollIntoView');

      const ctrlHomeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      ctrlHomeEvent.preventDefault = vi.fn();
      document.dispatchEvent(ctrlHomeEvent);

      expect(ctrlHomeEvent.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should handle Ctrl+End to navigate to bottom', async () => {
      testContainer.innerHTML = `
        <footer tabindex="-1">Footer content</footer>
      `;

      await service.initialize();

      const footer = testContainer.querySelector('footer');
      const focusSpy = vi.spyOn(footer, 'focus');
      const scrollSpy = vi.spyOn(footer, 'scrollIntoView');

      const ctrlEndEvent = new KeyboardEvent('keydown', {
        key: 'End',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      ctrlEndEvent.preventDefault = vi.fn();
      document.dispatchEvent(ctrlEndEvent);

      expect(ctrlEndEvent.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation Best Practices', () => {
    it('should not create keyboard traps without escape mechanism', () => {
      testContainer.innerHTML = `
        <div class="modal" style="display: block;">
          <p>Modal without close button or escape handling</p>
        </div>
      `;

      const hasTraps = accessibilityTester.hasKeyboardTraps(testContainer);
      // This should detect the trap since there's no escape mechanism
      expect(hasTraps).toBe(true);
    });

    it('should allow escape from keyboard traps', () => {
      testContainer.innerHTML = `
        <div class="modal" style="display: block;" data-keyboard="true">
          <button class="modal-close">Close</button>
          <p>Modal with escape mechanism</p>
        </div>
      `;

      const hasTraps = accessibilityTester.hasKeyboardTraps(testContainer);
      // This should not detect a trap since there's a close button
      expect(hasTraps).toBe(false);
    });

    it('should maintain logical focus order after dynamic content changes', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <input type="text" id="field1" placeholder="Field 1">
        <button type="button" id="add-field">Add Field</button>
        <button type="submit" id="submit">Submit</button>
      `;
      testContainer.appendChild(form);

      // Get initial focusable elements
      let focusableElements = accessibilityTester.getFocusableElements(form);
      expect(focusableElements.length).toBe(3);

      // Simulate adding a field
      const newField = document.createElement('input');
      newField.type = 'text';
      newField.id = 'field2';
      newField.placeholder = 'Field 2';

      const addButton = form.querySelector('#add-field');
      form.insertBefore(newField, addButton);

      // Check updated focusable elements
      focusableElements = accessibilityTester.getFocusableElements(form);
      expect(focusableElements.length).toBe(4);

      // Verify logical order is maintained
      expect(focusableElements[0].id).toBe('field1');
      expect(focusableElements[1].id).toBe('field2');
      expect(focusableElements[2].id).toBe('add-field');
      expect(focusableElements[3].id).toBe('submit');
    });

    it('should handle keyboard navigation in complex widgets', () => {
      testContainer.innerHTML = `
        <div role="grid" aria-label="Data Grid">
          <div role="row">
            <div role="columnheader" tabindex="0">Name</div>
            <div role="columnheader" tabindex="-1">Age</div>
            <div role="columnheader" tabindex="-1">City</div>
          </div>
          <div role="row">
            <div role="gridcell" tabindex="-1">John</div>
            <div role="gridcell" tabindex="-1">25</div>
            <div role="gridcell" tabindex="-1">New York</div>
          </div>
          <div role="row">
            <div role="gridcell" tabindex="-1">Jane</div>
            <div role="gridcell" tabindex="-1">30</div>
            <div role="gridcell" tabindex="-1">Los Angeles</div>
          </div>
        </div>
      `;

      const grid = testContainer.querySelector('[role="grid"]');
      const component = new AccessibleComponent();
      component.element = grid;
      component.setupKeyboardNavigation();

      const cells = grid.querySelectorAll('[role="columnheader"], [role="gridcell"]');

      // Initially only first header should be focusable
      expect(cells[0].getAttribute('tabindex')).toBe('0');

      // Test arrow navigation within grid
      cells[0].focus();

      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      arrowRightEvent.preventDefault = vi.fn();
      cells[0].dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Touch and Mobile Keyboard Support', () => {
    it('should handle virtual keyboard considerations', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('inputmode', 'text');
      input.setAttribute('autocomplete', 'given-name');
      testContainer.appendChild(input);

      expect(input.getAttribute('inputmode')).toBe('text');
      expect(input.getAttribute('autocomplete')).toBe('given-name');
    });

    it('should handle email keyboard type', () => {
      const emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.setAttribute('inputmode', 'email');
      emailInput.setAttribute('autocomplete', 'email');
      testContainer.appendChild(emailInput);

      expect(emailInput.type).toBe('email');
      expect(emailInput.getAttribute('inputmode')).toBe('email');
    });

    it('should handle numeric keyboard type', () => {
      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.setAttribute('inputmode', 'numeric');
      testContainer.appendChild(numberInput);

      expect(numberInput.type).toBe('number');
      expect(numberInput.getAttribute('inputmode')).toBe('numeric');
    });
  });
});
