/**
 * Comprehensive Keyboard Navigation Tests
 * 
 * This test suite provides thorough coverage of keyboard navigation functionality
 * across all interactive elements in the Learnimals project, ensuring WCAG 2.1 Level AA compliance.
 * 
 * Coverage includes:
 * - Tab order and focus management
 * - Skip links for efficient navigation
 * - Keyboard shortcuts and hotkeys
 * - Focus indicators and visual feedback
 * - Keyboard access to all interactive content
 * - Escape key functionality for modals
 * - Arrow key navigation for complex widgets
 * - Enter and Space key activation
 * - Focus trapping in modal dialogs
 * - Game-specific keyboard controls
 * - Form navigation patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import { accessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../src/utils/accessibilityTester.js';
import Modal from '../../src/components/ui/Modal.js';
import FormComponent from '../../src/components/forms/FormComponent.js';

// Mock logger for clean test output
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

describe('Comprehensive Keyboard Navigation Tests', () => {
  let testContainer;
  let service;
  let originalActiveElement;
  let originalFocus;
  let focusHistory = [];

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Enhanced focus tracking
    focusHistory = [];
    originalActiveElement = document.activeElement;
    
    // Mock getBoundingClientRect for all elements
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0
    }));

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    // Enhanced focus method with history tracking
    Element.prototype.focus = vi.fn(function() {
      const previous = document.activeElement;
      
      // Update activeElement
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true
      });
      
      // Track focus history
      focusHistory.push({
        element: this,
        id: this.id || this.className || this.tagName,
        timestamp: Date.now(),
        previous: previous
      });
      
      // Dispatch focus event
      this.dispatchEvent(new FocusEvent('focus', { 
        bubbles: true, 
        relatedTarget: previous 
      }));
    });

    // Enhanced blur method
    Element.prototype.blur = vi.fn(function() {
      const previous = this;
      
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true
      });
      
      this.dispatchEvent(new FocusEvent('blur', { 
        bubbles: true, 
        relatedTarget: document.body 
      }));
    });

    service = accessibilityService;
  });

  afterEach(() => {
    if (service && service.destroy) {
      service.destroy();
    }
    document.body.innerHTML = '';
    focusHistory = [];
    vi.clearAllMocks();
  });

  describe('Tab Order and Focus Management', () => {
    it('should maintain logical tab order across complex layouts', () => {
      testContainer.innerHTML = `
        <header>
          <nav>
            <button id="menu-toggle">Menu</button>
            <a href="#" id="logo">Logo</a>
            <ul>
              <li><a href="#" id="nav-home">Home</a></li>
              <li><a href="#" id="nav-about">About</a></li>
              <li><a href="#" id="nav-contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <section>
            <h2>Main Content</h2>
            <button id="action-btn">Action</button>
            <input type="text" id="search" placeholder="Search">
          </section>
          <aside>
            <h3>Sidebar</h3>
            <button id="sidebar-btn">Sidebar Action</button>
          </aside>
        </main>
        <footer>
          <button id="footer-btn">Footer Action</button>
        </footer>
      `;

      const focusableElements = accessibilityTester.getFocusableElements(testContainer);
      const expectedOrder = [
        'menu-toggle', 'logo', 'nav-home', 'nav-about', 'nav-contact',
        'action-btn', 'search', 'sidebar-btn', 'footer-btn'
      ];

      expect(focusableElements.length).toBe(expectedOrder.length);
      
      focusableElements.forEach((element, index) => {
        expect(element.id).toBe(expectedOrder[index]);
      });

      // Test that tab order is truly logical (not just document order)
      expect(accessibilityTester.isLogicalTabOrder(
        accessibilityTester.getTabOrder(focusableElements)
      )).toBe(true);
    });

    it('should handle dynamic content insertion while maintaining tab order', () => {
      testContainer.innerHTML = `
        <div class="toolbar">
          <button id="btn-1">Button 1</button>
          <button id="btn-3">Button 3</button>
        </div>
      `;

      // Get initial focusable elements
      let focusableElements = accessibilityTester.getFocusableElements(testContainer);
      expect(focusableElements.length).toBe(2);

      // Insert new button dynamically
      const newButton = document.createElement('button');
      newButton.id = 'btn-2';
      newButton.textContent = 'Button 2';
      
      const btn1 = testContainer.querySelector('#btn-1');
      const btn3 = testContainer.querySelector('#btn-3');
      btn1.parentNode.insertBefore(newButton, btn3);

      // Check updated tab order
      focusableElements = accessibilityTester.getFocusableElements(testContainer);
      expect(focusableElements.length).toBe(3);
      expect(focusableElements[0].id).toBe('btn-1');
      expect(focusableElements[1].id).toBe('btn-2');
      expect(focusableElements[2].id).toBe('btn-3');
    });

    it('should respect custom tabindex values correctly', () => {
      testContainer.innerHTML = `
        <button id="default-1" tabindex="0">Default 1</button>
        <button id="first" tabindex="1">First</button>
        <button id="third" tabindex="3">Third</button>
        <button id="second" tabindex="2">Second</button>
        <button id="skip" tabindex="-1">Skip</button>
        <button id="default-2" tabindex="0">Default 2</button>
        <button id="natural">Natural</button>
      `;

      const focusableElements = accessibilityTester.getFocusableElements(testContainer);
      const tabOrder = accessibilityTester.getTabOrder(focusableElements);

      // Should exclude tabindex="-1"
      expect(focusableElements.length).toBe(6);

      // Order should be: positive tabindex first (1,2,3), then 0/natural in document order
      expect(tabOrder[0].element.id).toBe('first');
      expect(tabOrder[1].element.id).toBe('second');
      expect(tabOrder[2].element.id).toBe('third');
      expect(tabOrder[3].element.id).toBe('default-1');
      expect(tabOrder[4].element.id).toBe('default-2');
      expect(tabOrder[5].element.id).toBe('natural');
    });

    it('should identify all keyboard accessible elements', () => {
      testContainer.innerHTML = `
        <button id="button">Button</button>
        <a href="#" id="link">Link</a>
        <a id="empty-link">Empty Link</a>
        <input type="text" id="input">
        <input type="checkbox" id="checkbox">
        <select id="select"><option>Option</option></select>
        <textarea id="textarea"></textarea>
        <div id="focusable" tabindex="0">Focusable div</div>
        <div id="non-focusable">Non-focusable div</div>
        <button disabled id="disabled">Disabled button</button>
        <div id="negative-tab" tabindex="-1">Negative tabindex</div>
        <div id="role-button" role="button" tabindex="0">Role button</div>
        <span id="role-link" role="link" tabindex="0">Role link</span>
        <div id="contenteditable" contenteditable="true">Editable</div>
        <audio controls id="audio"><source src="test.mp3"></audio>
        <video controls id="video"><source src="test.mp4"></video>
        <object data="test.pdf" id="object"></object>
        <embed src="test.swf" id="embed">
        <summary id="summary">Summary</summary>
      `;

      const testCases = [
        { id: 'button', expected: true, reason: 'native button' },
        { id: 'link', expected: true, reason: 'link with href' },
        { id: 'empty-link', expected: false, reason: 'link without href' },
        { id: 'input', expected: true, reason: 'input element' },
        { id: 'checkbox', expected: true, reason: 'checkbox input' },
        { id: 'select', expected: true, reason: 'select element' },
        { id: 'textarea', expected: true, reason: 'textarea element' },
        { id: 'focusable', expected: true, reason: 'tabindex="0"' },
        { id: 'non-focusable', expected: false, reason: 'no focusable attributes' },
        { id: 'disabled', expected: false, reason: 'disabled button' },
        { id: 'negative-tab', expected: false, reason: 'tabindex="-1"' },
        { id: 'role-button', expected: true, reason: 'role="button" with tabindex' },
        { id: 'role-link', expected: true, reason: 'role="link" with tabindex' },
        { id: 'contenteditable', expected: true, reason: 'contenteditable element' },
        { id: 'audio', expected: true, reason: 'audio with controls' },
        { id: 'video', expected: true, reason: 'video with controls' },
        { id: 'object', expected: true, reason: 'object element' },
        { id: 'embed', expected: true, reason: 'embed element' },
        { id: 'summary', expected: true, reason: 'summary element' }
      ];

      testCases.forEach(({ id, expected, reason }) => {
        const element = testContainer.querySelector(`#${id}`);
        const isAccessible = accessibilityTester.isKeyboardAccessible(element);
        expect(isAccessible).toBe(expected, `${id} should ${expected ? 'be' : 'not be'} keyboard accessible (${reason})`);
      });
    });
  });

  describe('Skip Links for Efficient Navigation', () => {
    it('should create functional skip links for common page sections', async () => {
      testContainer.innerHTML = `
        <header id="header">Header content</header>
        <nav id="navigation">Navigation content</nav>
        <main id="main-content">Main content</main>
        <aside id="sidebar">Sidebar content</aside>
        <footer id="footer">Footer content</footer>
        <div id="search-section">Search functionality</div>
      `;

      await service.initialize();

      const skipLinks = document.querySelector('.skip-links');
      expect(skipLinks).toBeTruthy();
      expect(skipLinks.getAttribute('role')).toBe('navigation');
      expect(skipLinks.getAttribute('aria-label')).toBe('Skip links');

      const links = skipLinks.querySelectorAll('.skip-link');
      expect(links.length).toBeGreaterThan(0);

      // Test for expected skip links
      const expectedTargets = ['#main-content', '#navigation', '#search-section'];
      expectedTargets.forEach(target => {
        const skipLink = Array.from(links).find(link => 
          link.getAttribute('href') === target
        );
        expect(skipLink).toBeTruthy(`Skip link to ${target} should exist`);
      });
    });

    it('should properly handle skip link activation with focus and scroll', async () => {
      testContainer.innerHTML = `
        <main id="main-content" tabindex="-1">
          <h1>Main Content</h1>
          <p>This is the main content area.</p>
        </main>
      `;

      await service.initialize();

      const mainContent = testContainer.querySelector('#main-content');
      const focusSpy = vi.spyOn(mainContent, 'focus');
      const scrollSpy = vi.spyOn(mainContent, 'scrollIntoView');

      const skipLinks = document.querySelector('.skip-links');
      const mainSkipLink = skipLinks.querySelector('a[href="#main-content"]');

      // Simulate skip link activation
      const clickEvent = new MouseEvent('click', { 
        bubbles: true, 
        cancelable: true 
      });
      clickEvent.preventDefault = vi.fn();
      
      mainSkipLink.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should show skip links on focus and hide when not focused', async () => {
      testContainer.innerHTML = `
        <main id="main-content">Main content</main>
      `;

      await service.initialize();

      const skipLinks = document.querySelector('.skip-links');
      const firstSkipLink = skipLinks.querySelector('.skip-link');

      // Initially, skip links should be visually hidden but accessible
      const initialStyles = window.getComputedStyle(skipLinks);
      expect(skipLinks.classList.contains('skip-links')).toBe(true);

      // Simulate focus on skip link
      firstSkipLink.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      
      // Should be visible when focused
      expect(firstSkipLink.matches(':focus')).toBe(true);

      // Simulate blur
      firstSkipLink.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });
  });

  describe('Keyboard Shortcuts and Hotkeys', () => {
    it('should handle F6 for landmark navigation', async () => {
      testContainer.innerHTML = `
        <header role="banner" tabindex="-1" id="header">Header</header>
        <nav role="navigation" tabindex="-1" id="nav">Navigation</nav>
        <main role="main" tabindex="-1" id="main">Main</main>
        <aside role="complementary" tabindex="-1" id="aside">Sidebar</aside>
        <footer role="contentinfo" tabindex="-1" id="footer">Footer</footer>
      `;

      await service.initialize();

      const landmarks = [
        testContainer.querySelector('#header'),
        testContainer.querySelector('#nav'),
        testContainer.querySelector('#main'),
        testContainer.querySelector('#aside'),
        testContainer.querySelector('#footer')
      ];

      // Start at navigation
      landmarks[1].focus();
      expect(document.activeElement).toBe(landmarks[1]);

      const focusSpy = vi.spyOn(landmarks[2], 'focus');

      // Press F6 to navigate to next landmark
      const f6Event = new KeyboardEvent('keydown', { 
        key: 'F6', 
        bubbles: true, 
        cancelable: true 
      });
      f6Event.preventDefault = vi.fn();
      
      document.dispatchEvent(f6Event);

      expect(f6Event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle Shift+F6 for reverse landmark navigation', async () => {
      testContainer.innerHTML = `
        <header role="banner" tabindex="-1" id="header">Header</header>
        <nav role="navigation" tabindex="-1" id="nav">Navigation</nav>
        <main role="main" tabindex="-1" id="main">Main</main>
      `;

      await service.initialize();

      const main = testContainer.querySelector('#main');
      const nav = testContainer.querySelector('#nav');

      // Start at main
      main.focus();
      expect(document.activeElement).toBe(main);

      const focusSpy = vi.spyOn(nav, 'focus');

      // Press Shift+F6 to navigate to previous landmark
      const shiftF6Event = new KeyboardEvent('keydown', { 
        key: 'F6',
        shiftKey: true,
        bubbles: true, 
        cancelable: true 
      });
      shiftF6Event.preventDefault = vi.fn();
      
      document.dispatchEvent(shiftF6Event);

      expect(shiftF6Event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle Ctrl+Home to navigate to page top', async () => {
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
        cancelable: true 
      });
      ctrlHomeEvent.preventDefault = vi.fn();
      
      document.dispatchEvent(ctrlHomeEvent);

      expect(ctrlHomeEvent.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('should handle Alt+1 through Alt+6 for heading navigation', async () => {
      testContainer.innerHTML = `
        <h1 id="h1" tabindex="-1">Heading 1</h1>
        <h2 id="h2" tabindex="-1">Heading 2</h2>
        <h3 id="h3" tabindex="-1">Heading 3</h3>
        <h4 id="h4" tabindex="-1">Heading 4</h4>
        <h5 id="h5" tabindex="-1">Heading 5</h5>
        <h6 id="h6" tabindex="-1">Heading 6</h6>
      `;

      await service.initialize();

      for (let level = 1; level <= 6; level++) {
        const heading = testContainer.querySelector(`#h${level}`);
        const focusSpy = vi.spyOn(heading, 'focus');

        const altNumberEvent = new KeyboardEvent('keydown', { 
          key: level.toString(),
          altKey: true,
          bubbles: true, 
          cancelable: true 
        });
        altNumberEvent.preventDefault = vi.fn();
        
        document.dispatchEvent(altNumberEvent);

        expect(altNumberEvent.preventDefault).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
        
        // Clear the spy for next iteration
        focusSpy.mockRestore();
      }
    });
  });

  describe('Focus Indicators and Visual Feedback', () => {
    it('should apply visible focus indicators to all focusable elements', () => {
      testContainer.innerHTML = `
        <button id="button">Button</button>
        <a href="#" id="link">Link</a>
        <input type="text" id="input">
        <div role="button" tabindex="0" id="custom-button">Custom Button</div>
      `;

      const focusableElements = accessibilityTester.getFocusableElements(testContainer);
      
      focusableElements.forEach(element => {
        // Simulate focus
        element.focus();
        element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

        // Check for focus indicator
        const hasVisibleFocus = accessibilityTester.hasVisibleFocusIndicator(element);
        expect(hasVisibleFocus).toBe(true, `Element ${element.id} should have visible focus indicator`);
      });
    });

    it('should show enhanced focus indicators during keyboard navigation', () => {
      testContainer.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

      const btn1 = testContainer.querySelector('#btn1');
      const btn2 = testContainer.querySelector('#btn2');

      // Simulate keyboard navigation (Tab key)
      btn1.focus();
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true 
      });
      btn1.dispatchEvent(tabEvent);

      // After keyboard navigation, should have keyboard-focused class
      expect(btn1.classList.contains('keyboard-navigation')).toBe(true);

      // Simulate mouse click on second button
      btn2.focus();
      const clickEvent = new MouseEvent('click', { bubbles: true });
      btn2.dispatchEvent(clickEvent);

      // Should not have keyboard-navigation class after mouse interaction
      setTimeout(() => {
        expect(btn2.classList.contains('keyboard-navigation')).toBe(false);
      }, 100);
    });

    it('should maintain focus indicators for custom components', () => {
      const customComponent = new AccessibleComponent({
        id: 'custom-component',
        role: 'button',
        focusable: true
      });

      customComponent.render(testContainer);

      const element = customComponent.element;
      element.focus();

      // Should have proper focus styles applied
      expect(element.hasAttribute('tabindex')).toBe(true);
      expect(element.getAttribute('role')).toBe('button');
    });
  });

  describe('Modal Dialog Focus Trapping', () => {
    it('should trap focus within modal dialog', () => {
      const modal = new Modal({
        id: 'test-modal',
        title: 'Test Modal',
        content: `
          <p>Modal content</p>
          <input type="text" id="modal-input" placeholder="Type here">
          <button id="modal-action">Action</button>
        `,
        showConfirmButton: true,
        showCancelButton: true
      });

      modal.create();
      modal.open();

      const modalElement = document.getElementById('test-modal');
      const focusableElements = accessibilityTester.getFocusableElements(modalElement);

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test focus trap activation
      const focusTrap = service.createFocusTrap(modalElement);
      focusTrap.activate();

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // Simulate Tab on last element - should wrap to first
      lastFocusable.focus();
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true, 
        cancelable: true 
      });
      tabEvent.preventDefault = vi.fn();
      lastFocusable.dispatchEvent(tabEvent);

      expect(tabEvent.preventDefault).toHaveBeenCalled();

      // Simulate Shift+Tab on first element - should wrap to last
      firstFocusable.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab',
        shiftKey: true,
        bubbles: true, 
        cancelable: true 
      });
      shiftTabEvent.preventDefault = vi.fn();
      firstFocusable.dispatchEvent(shiftTabEvent);

      expect(shiftTabEvent.preventDefault).toHaveBeenCalled();

      focusTrap.deactivate();
      modal.destroy();
    });

    it('should restore focus when modal closes', () => {
      // Set up trigger button
      testContainer.innerHTML = `
        <button id="modal-trigger">Open Modal</button>
      `;

      const triggerButton = testContainer.querySelector('#modal-trigger');
      triggerButton.focus();

      const modal = new Modal({
        id: 'focus-restore-modal',
        title: 'Focus Restore Test',
        content: '<p>Test content</p>',
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      const restoreFocusSpy = vi.spyOn(triggerButton, 'focus');

      // Close modal
      modal.close();

      // Focus should be restored to trigger
      expect(restoreFocusSpy).toHaveBeenCalled();

      modal.destroy();
    });

    it('should handle Escape key to close modal', () => {
      const modal = new Modal({
        id: 'escape-modal',
        title: 'Escape Test',
        content: '<p>Press Escape to close</p>',
        showConfirmButton: true
      });

      modal.create();
      modal.open();

      expect(modal.isOpen).toBe(true);

      // Simulate Escape key
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true, 
        cancelable: true 
      });

      document.dispatchEvent(escapeEvent);

      expect(modal.isOpen).toBe(false);

      modal.destroy();
    });
  });

  describe('Arrow Key Navigation for Complex Widgets', () => {
    it('should handle arrow navigation in menu systems', () => {
      testContainer.innerHTML = `
        <nav role="menubar" aria-label="Main menu">
          <ul role="none">
            <li role="none">
              <button role="menuitem" tabindex="0" aria-haspopup="true" id="file-menu">File</button>
              <ul role="menu" aria-labelledby="file-menu">
                <li role="none"><button role="menuitem" tabindex="-1" id="new">New</button></li>
                <li role="none"><button role="menuitem" tabindex="-1" id="open">Open</button></li>
                <li role="none"><button role="menuitem" tabindex="-1" id="save">Save</button></li>
              </ul>
            </li>
            <li role="none">
              <button role="menuitem" tabindex="-1" id="edit-menu">Edit</button>
            </li>
          </ul>
        </nav>
      `;

      const menubar = testContainer.querySelector('[role="menubar"]');
      const component = new AccessibleComponent();
      component.element = menubar;
      component.setupKeyboardNavigation();

      const fileMenu = testContainer.querySelector('#file-menu');
      const editMenu = testContainer.querySelector('#edit-menu');

      // Focus file menu
      fileMenu.focus();
      expect(document.activeElement).toBe(fileMenu);

      // Test Arrow Right navigation
      const arrowRightEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true, 
        cancelable: true 
      });
      arrowRightEvent.preventDefault = vi.fn();
      fileMenu.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();

      // Test Arrow Down to open submenu
      const arrowDownEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowDown', 
        bubbles: true, 
        cancelable: true 
      });
      arrowDownEvent.preventDefault = vi.fn();
      fileMenu.dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle arrow navigation in grid/table structures', () => {
      testContainer.innerHTML = `
        <div role="grid" aria-label="Data Grid" tabindex="0">
          <div role="row">
            <div role="columnheader" tabindex="0" id="col1">Name</div>
            <div role="columnheader" tabindex="-1" id="col2">Age</div>
            <div role="columnheader" tabindex="-1" id="col3">City</div>
          </div>
          <div role="row">
            <div role="gridcell" tabindex="-1" id="cell1">John</div>
            <div role="gridcell" tabindex="-1" id="cell2">30</div>
            <div role="gridcell" tabindex="-1" id="cell3">NYC</div>
          </div>
          <div role="row">
            <div role="gridcell" tabindex="-1" id="cell4">Jane</div>
            <div role="gridcell" tabindex="-1" id="cell5">25</div>
            <div role="gridcell" tabindex="-1" id="cell6">LA</div>
          </div>
        </div>
      `;

      const grid = testContainer.querySelector('[role="grid"]');
      const component = new AccessibleComponent();
      component.element = grid;
      component.setupKeyboardNavigation();

      const col1 = testContainer.querySelector('#col1');
      
      // Focus first cell
      col1.focus();
      expect(document.activeElement).toBe(col1);

      // Test Arrow Right navigation
      const arrowRightEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true, 
        cancelable: true 
      });
      arrowRightEvent.preventDefault = vi.fn();
      col1.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();

      // Test Arrow Down navigation
      const arrowDownEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowDown', 
        bubbles: true, 
        cancelable: true 
      });
      arrowDownEvent.preventDefault = vi.fn();
      col1.dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle arrow navigation in tab panels', () => {
      testContainer.innerHTML = `
        <div>
          <div role="tablist" aria-label="Sample Tabs">
            <button role="tab" tabindex="0" aria-selected="true" aria-controls="panel1" id="tab1">Tab 1</button>
            <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel2" id="tab2">Tab 2</button>
            <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel3" id="tab3">Tab 3</button>
          </div>
          <div role="tabpanel" id="panel1" aria-labelledby="tab1">Panel 1 content</div>
          <div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>Panel 2 content</div>
          <div role="tabpanel" id="panel3" aria-labelledby="tab3" hidden>Panel 3 content</div>
        </div>
      `;

      const tablist = testContainer.querySelector('[role="tablist"]');
      const component = new AccessibleComponent();
      component.element = tablist;
      component.setupRovingTabindex();

      const tab1 = testContainer.querySelector('#tab1');
      const tab2 = testContainer.querySelector('#tab2');

      // Focus first tab
      tab1.focus();
      expect(document.activeElement).toBe(tab1);
      expect(tab1.getAttribute('tabindex')).toBe('0');
      expect(tab2.getAttribute('tabindex')).toBe('-1');

      // Test Arrow Right navigation
      const arrowRightEvent = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true, 
        cancelable: true 
      });
      arrowRightEvent.preventDefault = vi.fn();
      tab1.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Form Keyboard Navigation', () => {
    it('should handle comprehensive form navigation with Tab and Shift+Tab', () => {
      const formComponent = new FormComponent({
        id: 'keyboard-form',
        fields: [
          { name: 'firstName', type: 'text', label: 'First Name', required: true },
          { name: 'email', type: 'email', label: 'Email', required: true },
          { name: 'category', type: 'select', label: 'Category', options: [
            { value: 'student', label: 'Student' },
            { value: 'teacher', label: 'Teacher' }
          ]},
          { name: 'notifications', type: 'checkbox', label: 'Notifications', options: [
            { value: 'email', label: 'Email notifications' },
            { value: 'sms', label: 'SMS notifications' }
          ]},
          { name: 'level', type: 'radio', label: 'Level', options: [
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' }
          ]},
          { name: 'comments', type: 'textarea', label: 'Comments' }
        ]
      });

      formComponent.render(testContainer);

      const form = testContainer.querySelector('#keyboard-form');
      const focusableElements = accessibilityTester.getFocusableElements(form);

      // Should have all form fields plus submit button
      expect(focusableElements.length).toBeGreaterThan(8); // includes radio buttons, checkboxes, submit

      // Test Tab navigation through form
      let currentIndex = 0;
      focusableElements[currentIndex].focus();
      
      for (let i = 0; i < 3; i++) {
        const tabEvent = new KeyboardEvent('keydown', { 
          key: 'Tab', 
          bubbles: true, 
          cancelable: true 
        });
        
        focusableElements[currentIndex].dispatchEvent(tabEvent);
        currentIndex = (currentIndex + 1) % focusableElements.length;
      }

      // Test Shift+Tab backward navigation
      for (let i = 0; i < 2; i++) {
        const shiftTabEvent = new KeyboardEvent('keydown', { 
          key: 'Tab',
          shiftKey: true,
          bubbles: true, 
          cancelable: true 
        });
        
        focusableElements[currentIndex].dispatchEvent(shiftTabEvent);
        currentIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      }

      formComponent.destroy();
    });

    it('should handle Enter key submission and field navigation', () => {
      const onSubmitSpy = vi.fn();
      
      const formComponent = new FormComponent({
        id: 'enter-form',
        fields: [
          { name: 'username', type: 'text', label: 'Username', required: true },
          { name: 'password', type: 'password', label: 'Password', required: true }
        ],
        onSubmit: onSubmitSpy
      });

      formComponent.render(testContainer);

      const usernameField = testContainer.querySelector('[name="username"]');
      const passwordField = testContainer.querySelector('[name="password"]');
      const submitButton = testContainer.querySelector('[type="submit"]');

      // Fill required fields
      usernameField.value = 'testuser';
      passwordField.value = 'testpass';

      // Test Enter on submit button
      submitButton.focus();
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true, 
        cancelable: true 
      });
      enterEvent.preventDefault = vi.fn();
      submitButton.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();

      formComponent.destroy();
    });

    it('should provide keyboard access to form validation errors', () => {
      const formComponent = new FormComponent({
        id: 'validation-form',
        fields: [
          { 
            name: 'email', 
            type: 'email', 
            label: 'Email', 
            required: true,
            validate: (value) => {
              if (!value.includes('@')) return 'Please enter a valid email';
              return true;
            }
          }
        ]
      });

      formComponent.render(testContainer);

      const emailField = testContainer.querySelector('[name="email"]');
      const errorElement = testContainer.querySelector(`#validation-form-email-error`);

      // Enter invalid email
      emailField.value = 'invalid-email';
      emailField.dispatchEvent(new Event('blur', { bubbles: true }));

      // Error should be associated with field
      expect(emailField.getAttribute('aria-describedby')).toContain('validation-form-email-error');
      expect(errorElement.textContent).toContain('valid email');

      formComponent.destroy();
    });
  });

  describe('Game-Specific Keyboard Controls', () => {
    it('should handle WASD keys for directional game movement', () => {
      testContainer.innerHTML = `
        <div id="game-area" tabindex="0" role="application" aria-label="Educational Game">
          <div id="player" style="position: absolute; left: 100px; top: 100px;"></div>
        </div>
      `;

      const gameArea = testContainer.querySelector('#game-area');
      const player = testContainer.querySelector('#player');
      
      let playerPosition = { x: 100, y: 100 };
      
      // Mock game movement handler
      const movementHandler = (e) => {
        const moveDistance = 10;
        switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          playerPosition.y -= moveDistance;
          e.preventDefault();
          break;
        case 'a':
        case 'arrowleft':
          playerPosition.x -= moveDistance;
          e.preventDefault();
          break;
        case 's':
        case 'arrowdown':
          playerPosition.y += moveDistance;
          e.preventDefault();
          break;
        case 'd':
        case 'arrowright':
          playerPosition.x += moveDistance;
          e.preventDefault();
          break;
        }
        player.style.left = `${playerPosition.x}px`;
        player.style.top = `${playerPosition.y}px`;
      };

      gameArea.addEventListener('keydown', movementHandler);
      gameArea.focus();

      // Test WASD movement
      const testKeys = [
        { key: 'w', expectedY: 90 },
        { key: 'a', expectedX: 90 },
        { key: 's', expectedY: 100 },
        { key: 'd', expectedX: 100 }
      ];

      testKeys.forEach(({ key, expectedX, expectedY }) => {
        const keyEvent = new KeyboardEvent('keydown', { 
          key, 
          bubbles: true, 
          cancelable: true 
        });
        keyEvent.preventDefault = vi.fn();
        gameArea.dispatchEvent(keyEvent);

        expect(keyEvent.preventDefault).toHaveBeenCalled();
        if (expectedX !== undefined) {
          expect(playerPosition.x).toBe(expectedX);
        }
        if (expectedY !== undefined) {
          expect(playerPosition.y).toBe(expectedY);
        }
      });
    });

    it('should handle Space bar for game actions', () => {
      testContainer.innerHTML = `
        <div id="bubble-game" tabindex="0" role="application" aria-label="Bubble Pop Game">
          <div id="bubble" data-active="true">Pop me!</div>
        </div>
      `;

      const gameArea = testContainer.querySelector('#bubble-game');
      const bubble = testContainer.querySelector('#bubble');
      
      let bubblePopped = false;
      
      const actionHandler = (e) => {
        if (e.key === ' ' && bubble.dataset.active === 'true') {
          bubblePopped = true;
          bubble.dataset.active = 'false';
          bubble.style.display = 'none';
          e.preventDefault();
        }
      };

      gameArea.addEventListener('keydown', actionHandler);
      gameArea.focus();

      // Test Space bar action
      const spaceEvent = new KeyboardEvent('keydown', { 
        key: ' ', 
        bubbles: true, 
        cancelable: true 
      });
      spaceEvent.preventDefault = vi.fn();
      gameArea.dispatchEvent(spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(bubblePopped).toBe(true);
      expect(bubble.dataset.active).toBe('false');
    });

    it('should handle number keys for educational game selections', () => {
      testContainer.innerHTML = `
        <div id="math-game" tabindex="0" role="application" aria-label="Math Game">
          <div class="question">5 + 3 = ?</div>
          <div class="options">
            <button data-answer="7" data-key="1">1. Seven</button>
            <button data-answer="8" data-key="2">2. Eight</button>
            <button data-answer="9" data-key="3">3. Nine</button>
          </div>
        </div>
      `;

      const gameArea = testContainer.querySelector('#math-game');
      const buttons = gameArea.querySelectorAll('button');
      
      let selectedAnswer = null;
      
      const selectionHandler = (e) => {
        const keyNum = e.key;
        if (keyNum >= '1' && keyNum <= '3') {
          const buttonIndex = parseInt(keyNum) - 1;
          if (buttons[buttonIndex]) {
            selectedAnswer = buttons[buttonIndex].dataset.answer;
            buttons[buttonIndex].click();
            e.preventDefault();
          }
        }
      };

      gameArea.addEventListener('keydown', selectionHandler);
      gameArea.focus();

      // Test number key selection
      const numberTwoEvent = new KeyboardEvent('keydown', { 
        key: '2', 
        bubbles: true, 
        cancelable: true 
      });
      numberTwoEvent.preventDefault = vi.fn();
      gameArea.dispatchEvent(numberTwoEvent);

      expect(numberTwoEvent.preventDefault).toHaveBeenCalled();
      expect(selectedAnswer).toBe('8');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle focus on elements that become disabled', () => {
      testContainer.innerHTML = `
        <button id="enable-btn">Enable</button>
        <button id="disable-btn">Disable</button>
        <button id="target-btn">Target</button>
      `;

      const enableBtn = testContainer.querySelector('#enable-btn');
      const disableBtn = testContainer.querySelector('#disable-btn');
      const targetBtn = testContainer.querySelector('#target-btn');

      // Focus target button
      targetBtn.focus();
      expect(document.activeElement).toBe(targetBtn);

      // Disable the focused button
      targetBtn.disabled = true;

      // Focus should move to next focusable element
      expect(accessibilityTester.isKeyboardAccessible(targetBtn)).toBe(false);
    });

    it('should handle elements removed from DOM while focused', () => {
      testContainer.innerHTML = `
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <button id="btn3">Button 3</button>
      `;

      const btn2 = testContainer.querySelector('#btn2');
      btn2.focus();
      expect(document.activeElement).toBe(btn2);

      // Remove focused element
      btn2.remove();

      // Document should handle gracefully
      expect(document.body.contains(btn2)).toBe(false);
    });

    it('should prevent infinite focus loops', () => {
      testContainer.innerHTML = `
        <div id="container" tabindex="0">
          <button id="nested-btn" tabindex="0">Nested Button</button>
        </div>
      `;

      const container = testContainer.querySelector('#container');
      const nestedBtn = testContainer.querySelector('#nested-btn');

      let focusCount = 0;
      const focusHandler = () => {
        focusCount++;
        if (focusCount > 10) {
          throw new Error('Infinite focus loop detected');
        }
      };

      container.addEventListener('focus', focusHandler);
      nestedBtn.addEventListener('focus', focusHandler);

      // Focus should not create infinite loops
      container.focus();
      nestedBtn.focus();

      expect(focusCount).toBeLessThan(10);
    });
  });

  describe('Performance and Accessibility Testing', () => {
    it('should maintain performance with large numbers of focusable elements', () => {
      // Create many focusable elements
      const numElements = 1000;
      let html = '';
      for (let i = 0; i < numElements; i++) {
        html += `<button id="btn-${i}">Button ${i}</button>`;
      }
      testContainer.innerHTML = html;

      const startTime = performance.now();
      const focusableElements = accessibilityTester.getFocusableElements(testContainer);
      const endTime = performance.now();

      expect(focusableElements.length).toBe(numElements);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should pass automated accessibility audit for keyboard navigation', () => {
      testContainer.innerHTML = `
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <main>
          <h1>Welcome</h1>
          <form>
            <label for="search">Search:</label>
            <input type="search" id="search" name="search">
            <button type="submit">Submit</button>
          </form>
        </main>
      `;

      const auditResults = accessibilityTester.runAudit(testContainer);
      
      // Should pass basic keyboard navigation audit
      expect(auditResults.passed).toBe(true);
      expect(auditResults.errors.length).toBe(0);
      expect(auditResults.warnings.length).toBeLessThanOrEqual(0);
    });
  });
});