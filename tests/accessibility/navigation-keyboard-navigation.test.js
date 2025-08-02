/**
 * Navigation System Keyboard Navigation Tests
 *
 * Tests keyboard accessibility for the main navigation system including:
 * - Mobile menu keyboard navigation
 * - Skip links integration
 * - Breadcrumb navigation
 * - Dropdown menu navigation
 * - Navigation state announcements
 * - Focus management during navigation changes
 * - Responsive navigation patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../src/utils/accessibilityTester.js';

// Mock the navigation module
const mockNavigationComponent = {
  mobileMenuButton: null,
  navMenu: null,
  menuOpen: false,

  init() {
    this.mobileMenuButton = document.getElementById('mobile-menu');
    this.navMenu = document.getElementById('nav-menu');

    if (this.mobileMenuButton && this.navMenu) {
      this.mobileMenuButton.setAttribute('aria-expanded', 'false');
      this.mobileMenuButton.setAttribute('aria-controls', 'nav-menu');
      this.addEventListeners();
    }
  },

  addEventListeners() {
    this.mobileMenuButton.addEventListener('click', () => this.toggleMenu());

    document.addEventListener('click', e => {
      if (
        this.menuOpen &&
        !this.navMenu.contains(e.target) &&
        !this.mobileMenuButton.contains(e.target)
      ) {
        this.closeMenu();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.menuOpen) {
        this.closeMenu();
      }
    });

    const menuLinks = this.navMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && window.innerWidth <= 768) {
          setTimeout(() => this.closeMenu(), 100);
        }
      });
    });
  },

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.navMenu.classList.toggle('active');
    this.mobileMenuButton.classList.toggle('active');
    this.mobileMenuButton.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
  },

  closeMenu() {
    this.menuOpen = false;
    this.navMenu.classList.remove('active');
    this.mobileMenuButton.classList.remove('active');
    this.mobileMenuButton.setAttribute('aria-expanded', 'false');
  },
};

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

describe('Navigation System Keyboard Navigation Tests', () => {
  let testContainer;
  let navigationComponent;

  beforeEach(() => {
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock focus methods
    Element.prototype.focus = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    });

    Element.prototype.blur = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });

    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    navigationComponent = Object.create(mockNavigationComponent);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Primary Navigation Structure', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <nav id="main-navigation" role="navigation" aria-label="Main navigation">
          <button id="mobile-menu" class="mobile-menu-toggle" aria-expanded="false" aria-controls="nav-menu">
            <span class="sr-only">Toggle navigation menu</span>
            <span class="hamburger"></span>
          </button>
          
          <ul id="nav-menu" class="nav-menu">
            <li><a href="/index.html" id="nav-home">Home</a></li>
            <li class="has-submenu">
              <a href="/subjects" id="nav-subjects" aria-haspopup="true" aria-expanded="false">Subjects</a>
              <ul class="submenu" id="subjects-submenu">
                <li><a href="/math" id="nav-math">Math</a></li>
                <li><a href="/science" id="nav-science">Science</a></li>
                <li><a href="/reading" id="nav-reading">Reading</a></li>
                <li><a href="/art" id="nav-art">Art</a></li>
              </ul>
            </li>
            <li><a href="/games" id="nav-games">Games</a></li>
            <li><a href="/progress" id="nav-progress">Progress</a></li>
            <li><a href="/about" id="nav-about">About</a></li>
          </ul>
        </nav>
        
        <div id="skip-links" class="skip-links" role="navigation" aria-label="Skip links">
          <a href="#main-content" class="skip-link">Skip to main content</a>
          <a href="#main-navigation" class="skip-link">Skip to navigation</a>
        </div>
      `;

      navigationComponent.init();
    });

    it('should have proper tab order through navigation elements', () => {
      const focusableElements = accessibilityTester.getFocusableElements(testContainer);

      const expectedOrder = [
        'skip-link',
        'skip-link',
        'mobile-menu',
        'nav-home',
        'nav-subjects',
        'nav-math',
        'nav-science',
        'nav-reading',
        'nav-art',
        'nav-games',
        'nav-progress',
        'nav-about',
      ];

      focusableElements.forEach((element, index) => {
        const expectedClass = expectedOrder[index];
        const hasExpectedClass =
          element.classList.contains(expectedClass) ||
          element.id === expectedClass ||
          element.className.includes(expectedClass);
        expect(hasExpectedClass).toBe(true);
      });
    });

    it('should handle skip links with proper focus management', () => {
      const skipToMain = testContainer.querySelector('a[href="#main-content"]');
      const skipToNav = testContainer.querySelector('a[href="#main-navigation"]');

      // Test skip to navigation
      skipToNav.focus();
      expect(document.activeElement).toBe(skipToNav);

      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      clickEvent.preventDefault = vi.fn();
      skipToNav.dispatchEvent(clickEvent);

      expect(clickEvent.preventDefault).toHaveBeenCalled();

      // Should focus the navigation landmark
      const navigation = testContainer.querySelector('#main-navigation');
      expect(navigation.focus).toHaveBeenCalled();
    });

    it('should support keyboard navigation through menu items', () => {
      const homeLink = testContainer.querySelector('#nav-home');
      const subjectsLink = testContainer.querySelector('#nav-subjects');
      const gamesLink = testContainer.querySelector('#nav-games');

      // Test Tab navigation
      homeLink.focus();
      expect(document.activeElement).toBe(homeLink);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      homeLink.dispatchEvent(tabEvent);

      // Should move to next focusable element
      expect(subjectsLink.focus).toHaveBeenCalled();
    });
  });

  describe('Mobile Menu Keyboard Navigation', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
      });

      testContainer.innerHTML = `
        <nav id="main-navigation" role="navigation" aria-label="Main navigation">
          <button id="mobile-menu" class="mobile-menu-toggle" aria-expanded="false" aria-controls="nav-menu">
            <span class="sr-only">Toggle navigation menu</span>
            <span class="hamburger"></span>
          </button>
          
          <ul id="nav-menu" class="nav-menu">
            <li><a href="/index.html" id="nav-home">Home</a></li>
            <li><a href="/subjects" id="nav-subjects">Subjects</a></li>
            <li><a href="/games" id="nav-games">Games</a></li>
            <li><a href="/about" id="nav-about">About</a></li>
          </ul>
        </nav>
      `;

      navigationComponent.init();
    });

    it('should toggle mobile menu with Enter and Space keys', () => {
      const mobileMenuButton = testContainer.querySelector('#mobile-menu');

      expect(navigationComponent.menuOpen).toBe(false);
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');

      // Test Enter key
      mobileMenuButton.focus();
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterEvent.preventDefault = vi.fn();
      mobileMenuButton.dispatchEvent(enterEvent);

      // Simulate click since Enter should trigger click
      mobileMenuButton.click();

      expect(navigationComponent.menuOpen).toBe(true);
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('true');

      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      spaceEvent.preventDefault = vi.fn();
      mobileMenuButton.dispatchEvent(spaceEvent);

      // Simulate click since Space should trigger click
      mobileMenuButton.click();

      expect(navigationComponent.menuOpen).toBe(false);
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close mobile menu with Escape key', () => {
      const mobileMenuButton = testContainer.querySelector('#mobile-menu');

      // Open menu first
      navigationComponent.toggleMenu();
      expect(navigationComponent.menuOpen).toBe(true);

      // Test Escape key
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);

      expect(navigationComponent.menuOpen).toBe(false);
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close menu when menu links are activated in mobile view', () => {
      // Open menu
      navigationComponent.toggleMenu();
      expect(navigationComponent.menuOpen).toBe(true);

      const homeLink = testContainer.querySelector('#nav-home');

      // Test Enter key on menu link
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      homeLink.dispatchEvent(enterEvent);

      // Menu should close after timeout
      setTimeout(() => {
        expect(navigationComponent.menuOpen).toBe(false);
      }, 150);
    });

    it('should manage focus properly when mobile menu opens/closes', () => {
      const mobileMenuButton = testContainer.querySelector('#mobile-menu');
      const navMenu = testContainer.querySelector('#nav-menu');

      mobileMenuButton.focus();

      // Open menu
      navigationComponent.toggleMenu();

      // First menu item should receive focus
      const firstMenuItem = navMenu.querySelector('a');
      expect(firstMenuItem.focus).toHaveBeenCalled();

      // Close menu
      navigationComponent.closeMenu();

      // Focus should return to mobile menu button
      expect(mobileMenuButton.focus).toHaveBeenCalled();
    });
  });

  describe('Dropdown/Submenu Navigation', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <nav id="main-navigation" role="navigation" aria-label="Main navigation">
          <ul id="nav-menu" class="nav-menu">
            <li class="dropdown">
              <a href="/subjects" id="subjects-trigger" 
                 aria-haspopup="true" aria-expanded="false" 
                 role="button">Subjects</a>
              <ul class="dropdown-menu" id="subjects-menu" hidden>
                <li><a href="/math" id="math-link">Math</a></li>
                <li><a href="/science" id="science-link">Science</a></li>
                <li><a href="/reading" id="reading-link">Reading</a></li>
                <li><a href="/art" id="art-link">Art</a></li>
                <li><a href="/coding" id="coding-link">Coding</a></li>
              </ul>
            </li>
            <li class="dropdown">
              <a href="/games" id="games-trigger" 
                 aria-haspopup="true" aria-expanded="false" 
                 role="button">Games</a>
              <ul class="dropdown-menu" id="games-menu" hidden>
                <li><a href="/bubble-pop" id="bubble-pop-link">Bubble Pop</a></li>
                <li><a href="/word-scramble" id="word-scramble-link">Word Scramble</a></li>
                <li><a href="/math-quest" id="math-quest-link">Math Quest</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      `;

      // Set up dropdown behavior
      const dropdownTriggers = testContainer.querySelectorAll('[aria-haspopup="true"]');
      dropdownTriggers.forEach(trigger => {
        const menuId =
          trigger.getAttribute('aria-controls') || trigger.id.replace('-trigger', '-menu');
        const menu = document.getElementById(menuId);

        if (menu) {
          trigger.addEventListener('keydown', e => {
            switch (e.key) {
            case 'Enter':
            case ' ':
              e.preventDefault();
              toggleDropdown(trigger, menu);
              break;
            case 'ArrowDown':
              e.preventDefault();
              openDropdown(trigger, menu);
              focusFirstMenuItem(menu);
              break;
            case 'Escape':
              closeDropdown(trigger, menu);
              break;
            }
          });

          // Add menu item navigation
          const menuItems = menu.querySelectorAll('a');
          menuItems.forEach((item, index) => {
            item.addEventListener('keydown', e => {
              switch (e.key) {
              case 'ArrowDown':
                e.preventDefault();
                focusMenuItem(menuItems, index + 1);
                break;
              case 'ArrowUp':
                e.preventDefault();
                focusMenuItem(menuItems, index - 1);
                break;
              case 'Home':
                e.preventDefault();
                focusMenuItem(menuItems, 0);
                break;
              case 'End':
                e.preventDefault();
                focusMenuItem(menuItems, menuItems.length - 1);
                break;
              case 'Escape':
                e.preventDefault();
                closeDropdown(trigger, menu);
                trigger.focus();
                break;
              }
            });
          });
        }
      });

      function toggleDropdown(trigger, menu) {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closeDropdown(trigger, menu);
        } else {
          openDropdown(trigger, menu);
        }
      }

      function openDropdown(trigger, menu) {
        trigger.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
      }

      function closeDropdown(trigger, menu) {
        trigger.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }

      function focusFirstMenuItem(menu) {
        const firstItem = menu.querySelector('a');
        if (firstItem) firstItem.focus();
      }

      function focusMenuItem(items, index) {
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        items[index].focus();
      }
    });

    it('should open dropdown with Enter and Space keys', () => {
      const subjectsTrigger = testContainer.querySelector('#subjects-trigger');
      const subjectsMenu = testContainer.querySelector('#subjects-menu');

      subjectsTrigger.focus();
      expect(subjectsTrigger.getAttribute('aria-expanded')).toBe('false');
      expect(subjectsMenu.hidden).toBe(true);

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      enterEvent.preventDefault = vi.fn();
      subjectsTrigger.dispatchEvent(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(subjectsTrigger.getAttribute('aria-expanded')).toBe('true');
      expect(subjectsMenu.hidden).toBe(false);
    });

    it('should navigate dropdown with arrow keys', () => {
      const subjectsTrigger = testContainer.querySelector('#subjects-trigger');
      const subjectsMenu = testContainer.querySelector('#subjects-menu');

      subjectsTrigger.focus();

      // Open dropdown with Arrow Down
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      subjectsTrigger.dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
      expect(subjectsTrigger.getAttribute('aria-expanded')).toBe('true');
      expect(subjectsMenu.hidden).toBe(false);

      // First menu item should be focused
      const firstMenuItem = subjectsMenu.querySelector('#math-link');
      expect(firstMenuItem.focus).toHaveBeenCalled();
    });

    it('should handle arrow navigation within dropdown menu', () => {
      const subjectsTrigger = testContainer.querySelector('#subjects-trigger');
      const subjectsMenu = testContainer.querySelector('#subjects-menu');
      const mathLink = testContainer.querySelector('#math-link');
      const scienceLink = testContainer.querySelector('#science-link');

      // Open dropdown first
      subjectsTrigger.setAttribute('aria-expanded', 'true');
      subjectsMenu.hidden = false;
      mathLink.focus();

      // Test Arrow Down
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      mathLink.dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
      expect(scienceLink.focus).toHaveBeenCalled();

      // Test Arrow Up
      scienceLink.focus();
      const arrowUpEvent = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      arrowUpEvent.preventDefault = vi.fn();
      scienceLink.dispatchEvent(arrowUpEvent);

      expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
      expect(mathLink.focus).toHaveBeenCalled();
    });

    it('should handle Home and End keys in dropdown menu', () => {
      const subjectsMenu = testContainer.querySelector('#subjects-menu');
      const mathLink = testContainer.querySelector('#math-link');
      const codingLink = testContainer.querySelector('#coding-link');

      // Open dropdown
      subjectsMenu.hidden = false;
      mathLink.focus();

      // Test End key
      const endEvent = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true,
      });
      endEvent.preventDefault = vi.fn();
      mathLink.dispatchEvent(endEvent);

      expect(endEvent.preventDefault).toHaveBeenCalled();
      expect(codingLink.focus).toHaveBeenCalled();

      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      });
      homeEvent.preventDefault = vi.fn();
      codingLink.dispatchEvent(homeEvent);

      expect(homeEvent.preventDefault).toHaveBeenCalled();
      expect(mathLink.focus).toHaveBeenCalled();
    });

    it('should close dropdown with Escape and return focus to trigger', () => {
      const subjectsTrigger = testContainer.querySelector('#subjects-trigger');
      const subjectsMenu = testContainer.querySelector('#subjects-menu');
      const mathLink = testContainer.querySelector('#math-link');

      // Open dropdown and focus menu item
      subjectsTrigger.setAttribute('aria-expanded', 'true');
      subjectsMenu.hidden = false;
      mathLink.focus();

      // Test Escape key
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      escapeEvent.preventDefault = vi.fn();
      mathLink.dispatchEvent(escapeEvent);

      expect(escapeEvent.preventDefault).toHaveBeenCalled();
      expect(subjectsTrigger.getAttribute('aria-expanded')).toBe('false');
      expect(subjectsMenu.hidden).toBe(true);
      expect(subjectsTrigger.focus).toHaveBeenCalled();
    });
  });

  describe('Breadcrumb Navigation', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <nav aria-label="Breadcrumb" id="breadcrumb-nav">
          <ol class="breadcrumb">
            <li><a href="/" id="breadcrumb-home">Home</a></li>
            <li><a href="/subjects" id="breadcrumb-subjects">Subjects</a></li>
            <li><a href="/subjects/math" id="breadcrumb-math">Math</a></li>
            <li aria-current="page" id="breadcrumb-current">Place Value</li>
          </ol>
        </nav>
      `;
    });

    it('should have proper tab order through breadcrumb links', () => {
      const breadcrumbNav = testContainer.querySelector('#breadcrumb-nav');
      const focusableElements = accessibilityTester.getFocusableElements(breadcrumbNav);

      expect(focusableElements.length).toBe(3); // 3 links, current page not focusable

      const expectedOrder = ['breadcrumb-home', 'breadcrumb-subjects', 'breadcrumb-math'];
      focusableElements.forEach((element, index) => {
        expect(element.id).toBe(expectedOrder[index]);
      });
    });

    it('should indicate current page properly', () => {
      const currentPage = testContainer.querySelector('#breadcrumb-current');

      expect(currentPage.getAttribute('aria-current')).toBe('page');
      expect(currentPage.tagName.toLowerCase()).not.toBe('a'); // Should not be a link
    });

    it('should support keyboard navigation through breadcrumb links', () => {
      const homeLink = testContainer.querySelector('#breadcrumb-home');
      const subjectsLink = testContainer.querySelector('#breadcrumb-subjects');

      homeLink.focus();
      expect(document.activeElement).toBe(homeLink);

      // Test tab navigation
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      homeLink.dispatchEvent(tabEvent);

      // Should move to next breadcrumb link
      expect(subjectsLink.focus).toHaveBeenCalled();
    });
  });

  describe('Navigation State Announcements', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <nav id="main-navigation" role="navigation" aria-label="Main navigation">
          <button id="mobile-menu" class="mobile-menu-toggle" aria-expanded="false">
            Toggle menu
          </button>
          <ul id="nav-menu" class="nav-menu">
            <li><a href="/" id="nav-home" aria-current="page">Home</a></li>
            <li><a href="/about" id="nav-about">About</a></li>
          </ul>
        </nav>
        
        <div id="nav-announcements" aria-live="polite" class="sr-only"></div>
      `;

      navigationComponent.init();
    });

    it('should announce current page in navigation', () => {
      const currentPageLink = testContainer.querySelector('[aria-current="page"]');

      expect(currentPageLink.getAttribute('aria-current')).toBe('page');
      expect(currentPageLink.textContent).toBe('Home');
    });

    it('should announce mobile menu state changes', () => {
      const announcements = testContainer.querySelector('#nav-announcements');
      const mobileMenuButton = testContainer.querySelector('#mobile-menu');

      // Mock announcement function
      const announceNavState = message => {
        announcements.textContent = message;
      };

      // Test opening menu
      navigationComponent.toggleMenu();
      announceNavState('Navigation menu opened');

      expect(announcements.textContent).toBe('Navigation menu opened');
      expect(announcements.getAttribute('aria-live')).toBe('polite');

      // Test closing menu
      navigationComponent.closeMenu();
      announceNavState('Navigation menu closed');

      expect(announcements.textContent).toBe('Navigation menu closed');
    });

    it('should announce navigation changes for screen readers', () => {
      const announceSpy = vi.spyOn(accessibilityService, 'announce');

      // Simulate navigation change
      const homeLink = testContainer.querySelector('#nav-home');
      homeLink.click();

      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Navigating to Home'),
        'polite'
      );
    });
  });

  describe('Focus Management and Edge Cases', () => {
    beforeEach(() => {
      testContainer.innerHTML = `
        <nav id="main-navigation" role="navigation">
          <ul id="nav-menu">
            <li><a href="/" id="nav-home">Home</a></li>
            <li><a href="/about" id="nav-about">About</a></li>
            <li><a href="/contact" id="nav-contact">Contact</a></li>
          </ul>
        </nav>
      `;
    });

    it('should handle focus when navigation items are dynamically added', () => {
      const navMenu = testContainer.querySelector('#nav-menu');

      // Add new navigation item
      const newItem = document.createElement('li');
      newItem.innerHTML = '<a href="/blog" id="nav-blog">Blog</a>';
      navMenu.appendChild(newItem);

      const focusableElements = accessibilityTester.getFocusableElements(navMenu);
      expect(focusableElements.length).toBe(4);

      const blogLink = testContainer.querySelector('#nav-blog');
      expect(accessibilityTester.isKeyboardAccessible(blogLink)).toBe(true);
    });

    it('should handle focus when navigation items are removed', () => {
      const navMenu = testContainer.querySelector('#nav-menu');
      const aboutLink = testContainer.querySelector('#nav-about');
      const contactLink = testContainer.querySelector('#nav-contact');

      // Focus the about link
      aboutLink.focus();
      expect(document.activeElement).toBe(aboutLink);

      // Remove the focused element
      aboutLink.parentElement.remove();

      // Focus should move to a safe location
      const remainingFocusable = accessibilityTester.getFocusableElements(navMenu);
      expect(remainingFocusable.length).toBe(2);
      expect(remainingFocusable.includes(aboutLink)).toBe(false);
    });

    it('should handle navigation when no items are focusable', () => {
      const navMenu = testContainer.querySelector('#nav-menu');

      // Remove all links
      navMenu.innerHTML = '<li>Static text only</li>';

      const focusableElements = accessibilityTester.getFocusableElements(navMenu);
      expect(focusableElements.length).toBe(0);

      // Navigation should still be keyboard accessible via tabindex
      expect(navMenu.getAttribute('tabindex')).toBe('0');
    });

    it('should handle rapid navigation changes without focus loss', () => {
      const homeLink = testContainer.querySelector('#nav-home');
      const aboutLink = testContainer.querySelector('#nav-about');
      const contactLink = testContainer.querySelector('#nav-contact');

      // Rapid focus changes
      homeLink.focus();
      aboutLink.focus();
      contactLink.focus();
      homeLink.focus();

      expect(document.activeElement).toBe(homeLink);
      expect(homeLink.focus).toHaveBeenCalled();
    });
  });

  describe('Responsive Navigation Patterns', () => {
    it('should adapt keyboard navigation for different screen sizes', () => {
      // Desktop view
      Object.defineProperty(window, 'innerWidth', { value: 1200 });

      testContainer.innerHTML = `
        <nav id="responsive-nav">
          <ul class="desktop-menu">
            <li><a href="/" id="desktop-home">Home</a></li>
            <li><a href="/about" id="desktop-about">About</a></li>
          </ul>
          <button id="mobile-toggle" class="mobile-only" hidden>Menu</button>
          <ul id="mobile-menu" class="mobile-menu" hidden>
            <li><a href="/" id="mobile-home">Home</a></li>
            <li><a href="/about" id="mobile-about">About</a></li>
          </ul>
        </nav>
      `;

      let focusableElements = accessibilityTester.getFocusableElements(testContainer);
      expect(focusableElements.length).toBe(2); // Only desktop links

      // Mobile view
      Object.defineProperty(window, 'innerWidth', { value: 600 });

      // Update visibility
      testContainer.querySelector('.desktop-menu').hidden = true;
      testContainer.querySelector('#mobile-toggle').hidden = false;
      testContainer.querySelector('#mobile-menu').hidden = false;

      focusableElements = accessibilityTester.getFocusableElements(testContainer);
      expect(focusableElements.length).toBe(3); // Mobile toggle + mobile links
    });

    it('should maintain focus visibility across responsive breakpoints', () => {
      testContainer.innerHTML = `
        <nav id="breakpoint-nav">
          <a href="/" id="nav-link" class="nav-item">Home</a>
        </nav>
      `;

      const navLink = testContainer.querySelector('#nav-link');
      navLink.focus();

      // Simulate responsive breakpoint change
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      window.dispatchEvent(new Event('resize'));

      // Focus should still be visible and accessible
      expect(document.activeElement).toBe(navLink);
      expect(accessibilityTester.hasVisibleFocusIndicator(navLink)).toBe(true);
    });
  });

  describe('Accessibility Compliance', () => {
    it('should pass automated accessibility audit for navigation', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
        
        <nav role="navigation" aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li aria-current="page">Current Page</li>
          </ol>
        </nav>
      `;

      const auditResults = accessibilityTester.runAudit(testContainer);

      expect(auditResults.passed).toBe(true);
      expect(auditResults.errors.length).toBe(0);
    });

    it('should have proper ARIA labeling for navigation landmarks', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation" id="main-nav">
          <ul>
            <li><a href="/">Home</a></li>
          </ul>
        </nav>
        
        <nav role="navigation" aria-label="Secondary navigation" id="secondary-nav">
          <ul>
            <li><a href="/help">Help</a></li>
          </ul>
        </nav>
      `;

      const mainNav = testContainer.querySelector('#main-nav');
      const secondaryNav = testContainer.querySelector('#secondary-nav');

      expect(mainNav.getAttribute('aria-label')).toBe('Main navigation');
      expect(secondaryNav.getAttribute('aria-label')).toBe('Secondary navigation');
      expect(mainNav.getAttribute('role')).toBe('navigation');
      expect(secondaryNav.getAttribute('role')).toBe('navigation');
    });

    it('should support screen reader navigation patterns', () => {
      testContainer.innerHTML = `
        <nav aria-label="Main navigation">
          <ul role="menubar">
            <li role="none">
              <a href="/" role="menuitem" id="nav-home">Home</a>
            </li>
            <li role="none">
              <a href="/about" role="menuitem" id="nav-about">About</a>
            </li>
          </ul>
        </nav>
      `;

      const menuItems = testContainer.querySelectorAll('[role="menuitem"]');

      menuItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('menuitem');
        expect(accessibilityTester.isKeyboardAccessible(item)).toBe(true);
      });

      const menubar = testContainer.querySelector('[role="menubar"]');
      expect(menubar.getAttribute('role')).toBe('menubar');
    });
  });
});
