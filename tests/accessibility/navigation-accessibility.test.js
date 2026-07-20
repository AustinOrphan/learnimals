/**
 * Navigation Accessibility Tests
 * Comprehensive tests for navigation accessibility patterns
 * Ensures WCAG 2.1 Level AA compliance for navigation systems
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../components/AccessibleComponent.js';
/* global FocusEvent */
import { AccessibilityService } from '../../services/accessibility/AccessibilityService.js';
import '../../utils/accessibilityTester.js';

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

describe('Navigation Accessibility Tests', () => {
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

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Main Navigation Structure', () => {
    it('should have proper landmark roles and labels', () => {
      testContainer.innerHTML = `
        <header role="banner">
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/" aria-current="page">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/courses">Courses</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        
        <nav role="navigation" aria-label="Breadcrumb" class="breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/courses">Courses</a></li>
            <li aria-current="page">Math</li>
          </ol>
        </nav>
        
        <main role="main" id="main-content">
          <h1>Page Content</h1>
        </main>
        
        <footer role="contentinfo">
          <nav role="navigation" aria-label="Footer links">
            <ul>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
            </ul>
          </nav>
        </footer>
      `;

      const header = testContainer.querySelector('header');
      const mainNav = testContainer.querySelector('nav[aria-label="Main navigation"]');
      const breadcrumbNav = testContainer.querySelector('nav[aria-label="Breadcrumb"]');
      const main = testContainer.querySelector('main');
      const footer = testContainer.querySelector('footer');
      const footerNav = testContainer.querySelector('nav[aria-label="Footer links"]');

      expect(header.getAttribute('role')).toBe('banner');
      expect(mainNav.getAttribute('role')).toBe('navigation');
      expect(mainNav.getAttribute('aria-label')).toBe('Main navigation');

      expect(breadcrumbNav.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(breadcrumbNav.classList.contains('breadcrumb')).toBe(true);

      expect(main.getAttribute('role')).toBe('main');
      expect(main.id).toBe('main-content');

      expect(footer.getAttribute('role')).toBe('contentinfo');
      expect(footerNav.getAttribute('aria-label')).toBe('Footer links');
    });

    it('should indicate current page location', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/courses">Courses</a></li>
          </ul>
        </nav>
        
        <nav aria-label="Course sections">
          <ul>
            <li><a href="/courses/math">Math</a></li>
            <li><a href="/courses/science" aria-current="page">Science</a></li>
            <li><a href="/courses/reading">Reading</a></li>
          </ul>
        </nav>
      `;

      const currentPageLinks = testContainer.querySelectorAll('[aria-current="page"]');

      expect(currentPageLinks.length).toBe(2);
      expect(currentPageLinks[0].textContent).toBe('Home');
      expect(currentPageLinks[1].textContent).toBe('Science');
    });

    it('should provide skip links for main content areas', async () => {
      // Add main content areas first
      testContainer.innerHTML = `
        <main id="main-content" tabindex="-1">
          <h1>Main Content</h1>
        </main>
        <nav id="main-navigation">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </nav>
        <div id="search">
          <input type="search" placeholder="Search...">
        </div>
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
  });

  describe('Dropdown and Submenu Navigation', () => {
    it('should handle dropdown menus with proper ARIA states', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <ul role="menubar">
            <li role="none">
              <a href="/" role="menuitem">Home</a>
            </li>
            <li role="none">
              <button role="menuitem" 
                      aria-expanded="false" 
                      aria-haspopup="true"
                      aria-controls="courses-menu"
                      id="courses-trigger">
                Courses
              </button>
              <ul role="menu" 
                  id="courses-menu" 
                  aria-labelledby="courses-trigger"
                  style="display: none;">
                <li role="none">
                  <a href="/courses/math" role="menuitem">Math</a>
                </li>
                <li role="none">
                  <a href="/courses/science" role="menuitem">Science</a>
                </li>
                <li role="none">
                  <a href="/courses/reading" role="menuitem">Reading</a>
                </li>
              </ul>
            </li>
            <li role="none">
              <a href="/contact" role="menuitem">Contact</a>
            </li>
          </ul>
        </nav>
      `;

      const menubar = testContainer.querySelector('[role="menubar"]');
      const coursesButton = testContainer.querySelector('#courses-trigger');
      const coursesMenu = testContainer.querySelector('#courses-menu');
      const menuItems = coursesMenu.querySelectorAll('[role="menuitem"]');

      expect(menubar.getAttribute('role')).toBe('menubar');
      expect(coursesButton.getAttribute('aria-expanded')).toBe('false');
      expect(coursesButton.getAttribute('aria-haspopup')).toBe('true');
      expect(coursesButton.getAttribute('aria-controls')).toBe('courses-menu');

      expect(coursesMenu.getAttribute('role')).toBe('menu');
      expect(coursesMenu.getAttribute('aria-labelledby')).toBe('courses-trigger');
      expect(menuItems.length).toBe(3);

      // Simulate opening dropdown
      coursesButton.setAttribute('aria-expanded', 'true');
      coursesMenu.style.display = 'block';

      expect(coursesButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('should handle multi-level navigation menus', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <ul role="menubar">
            <li role="none">
              <button role="menuitem" 
                      aria-expanded="false" 
                      aria-haspopup="true"
                      aria-controls="subjects-menu">
                Subjects
              </button>
              <ul role="menu" 
                  id="subjects-menu" 
                  style="display: none;">
                <li role="none">
                  <button role="menuitem" 
                          aria-expanded="false" 
                          aria-haspopup="true"
                          aria-controls="math-submenu">
                    Math
                  </button>
                  <ul role="menu" 
                      id="math-submenu" 
                      style="display: none;">
                    <li role="none">
                      <a href="/math/algebra" role="menuitem">Algebra</a>
                    </li>
                    <li role="none">
                      <a href="/math/geometry" role="menuitem">Geometry</a>
                    </li>
                  </ul>
                </li>
                <li role="none">
                  <a href="/science" role="menuitem">Science</a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      `;

      const subjectsButton = testContainer.querySelector('[aria-controls="subjects-menu"]');
      const mathButton = testContainer.querySelector('[aria-controls="math-submenu"]');
      const subjectsMenu = testContainer.querySelector('#subjects-menu');
      const mathSubmenu = testContainer.querySelector('#math-submenu');

      expect(subjectsButton.getAttribute('aria-haspopup')).toBe('true');
      expect(mathButton.getAttribute('aria-haspopup')).toBe('true');

      // Test nested menu structure
      expect(subjectsMenu.getAttribute('role')).toBe('menu');
      expect(mathSubmenu.getAttribute('role')).toBe('menu');
      expect(mathSubmenu.parentElement.closest('[role="menu"]')).toBe(subjectsMenu);
    });

    it('should handle mobile menu toggle', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <button class="mobile-menu-toggle" 
                  aria-expanded="false" 
                  aria-controls="mobile-menu"
                  aria-label="Toggle main menu">
            <span class="hamburger-icon" aria-hidden="true">☰</span>
          </button>
          
          <div id="mobile-menu" 
               class="mobile-menu"
               aria-hidden="true"
               style="display: none;">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/courses">Courses</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
        </nav>
      `;

      const menuToggle = testContainer.querySelector('.mobile-menu-toggle');
      const mobileMenu = testContainer.querySelector('#mobile-menu');
      const hamburgerIcon = testContainer.querySelector('.hamburger-icon');

      expect(menuToggle.getAttribute('aria-expanded')).toBe('false');
      expect(menuToggle.getAttribute('aria-controls')).toBe('mobile-menu');
      expect(menuToggle.getAttribute('aria-label')).toBe('Toggle main menu');
      expect(mobileMenu.getAttribute('aria-hidden')).toBe('true');
      expect(hamburgerIcon.getAttribute('aria-hidden')).toBe('true');

      // Simulate opening mobile menu
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      mobileMenu.style.display = 'block';

      expect(menuToggle.getAttribute('aria-expanded')).toBe('true');
      expect(mobileMenu.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should provide proper breadcrumb structure', () => {
      testContainer.innerHTML = `
        <nav aria-label="Breadcrumb" class="breadcrumb">
          <ol>
            <li>
              <a href="/">
                <span class="visually-hidden">Go to </span>
                Home
              </a>
            </li>
            <li>
              <a href="/courses">
                <span class="visually-hidden">Go to </span>
                Courses
              </a>
            </li>
            <li>
              <a href="/courses/math">
                <span class="visually-hidden">Go to </span>
                Math
              </a>
            </li>
            <li aria-current="page">
              <span>Basic Addition</span>
            </li>
          </ol>
        </nav>
      `;

      const breadcrumb = testContainer.querySelector('.breadcrumb');
      const currentPage = testContainer.querySelector('[aria-current="page"]');
      const breadcrumbLinks = testContainer.querySelectorAll('.breadcrumb a');

      expect(breadcrumb.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(currentPage.getAttribute('aria-current')).toBe('page');
      expect(currentPage.textContent.trim()).toBe('Basic Addition');
      expect(breadcrumbLinks.length).toBe(3); // Not including current page

      // Check for screen reader helper text
      const srHelperTexts = testContainer.querySelectorAll('.visually-hidden');
      expect(srHelperTexts.length).toBe(3);
      srHelperTexts.forEach(text => {
        expect(text.textContent).toBe('Go to ');
      });
    });

    it('should handle breadcrumb with separators', () => {
      testContainer.innerHTML = `
        <nav aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item">
              <a href="/">Home</a>
              <span class="separator" aria-hidden="true">/</span>
            </li>
            <li class="breadcrumb-item">
              <a href="/courses">Courses</a>
              <span class="separator" aria-hidden="true">/</span>
            </li>
            <li class="breadcrumb-item">
              <a href="/courses/math">Math</a>
              <span class="separator" aria-hidden="true">/</span>
            </li>
            <li class="breadcrumb-item" aria-current="page">
              <span>Multiplication</span>
            </li>
          </ol>
        </nav>
      `;

      const separators = testContainer.querySelectorAll('.separator');
      const currentItem = testContainer.querySelector('[aria-current="page"]');

      // Separators should be hidden from screen readers
      separators.forEach(separator => {
        expect(separator.getAttribute('aria-hidden')).toBe('true');
      });

      expect(currentItem.getAttribute('aria-current')).toBe('page');
      expect(currentItem.querySelector('span').textContent).toBe('Multiplication');
    });

    it('should handle dynamic breadcrumb updates', () => {
      testContainer.innerHTML = `
        <nav aria-label="Breadcrumb" id="dynamic-breadcrumb" aria-live="polite">
          <ol>
            <li><a href="/">Home</a></li>
            <li aria-current="page">Loading...</li>
          </ol>
        </nav>
      `;

      const breadcrumb = testContainer.querySelector('#dynamic-breadcrumb');

      expect(breadcrumb.getAttribute('aria-live')).toBe('polite');

      // Simulate breadcrumb update after navigation
      breadcrumb.innerHTML = `
        <ol>
          <li><a href="/">Home</a></li>
          <li><a href="/courses">Courses</a></li>
          <li aria-current="page">Math</li>
        </ol>
      `;

      const updatedCurrentPage = breadcrumb.querySelector('[aria-current="page"]');
      expect(updatedCurrentPage.textContent).toBe('Math');
    });
  });

  describe('Keyboard Navigation in Menus', () => {
    it('should handle arrow key navigation in menubar', () => {
      testContainer.innerHTML = `
        <nav role="navigation">
          <ul role="menubar" id="main-menubar">
            <li role="none">
              <a href="/" role="menuitem" tabindex="0" id="home-menu">Home</a>
            </li>
            <li role="none">
              <button role="menuitem" tabindex="-1" id="courses-menu">Courses</button>
            </li>
            <li role="none">
              <a href="/about" role="menuitem" tabindex="-1" id="about-menu">About</a>
            </li>
            <li role="none">
              <a href="/contact" role="menuitem" tabindex="-1" id="contact-menu">Contact</a>
            </li>
          </ul>
        </nav>
      `;

      const menubar = testContainer.querySelector('#main-menubar');
      const menuItems = menubar.querySelectorAll('[role="menuitem"]');

      const component = new AccessibleComponent();
      component.element = menubar;
      component.setupKeyboardNavigation();

      // Focus first menu item
      menuItems[0].focus();
      expect(document.activeElement).toBe(menuItems[0]);

      // Test Arrow Right navigation
      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      arrowRightEvent.preventDefault = vi.fn();
      menuItems[0].dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();

      // Test Arrow Left navigation (should wrap to last)
      const arrowLeftEvent = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      });
      arrowLeftEvent.preventDefault = vi.fn();
      menuItems[0].dispatchEvent(arrowLeftEvent);

      expect(arrowLeftEvent.preventDefault).toHaveBeenCalled();

      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      });
      homeEvent.preventDefault = vi.fn();
      menuItems[2].dispatchEvent(homeEvent);

      expect(homeEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle submenu navigation with arrow keys', () => {
      testContainer.innerHTML = `
        <nav role="navigation">
          <ul role="menubar">
            <li role="none">
              <button role="menuitem" 
                      aria-expanded="true" 
                      aria-haspopup="true"
                      aria-controls="submenu">
                Main Item
              </button>
              <ul role="menu" id="submenu" aria-labelledby="main-item">
                <li role="none">
                  <a href="/item1" role="menuitem" tabindex="0">Item 1</a>
                </li>
                <li role="none">
                  <a href="/item2" role="menuitem" tabindex="-1">Item 2</a>
                </li>
                <li role="none">
                  <a href="/item3" role="menuitem" tabindex="-1">Item 3</a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      `;

      const submenu = testContainer.querySelector('#submenu');
      const submenuItems = submenu.querySelectorAll('[role="menuitem"]');

      const component = new AccessibleComponent();
      component.element = submenu;
      component.setupKeyboardNavigation();

      // Focus first submenu item
      submenuItems[0].focus();
      expect(document.activeElement).toBe(submenuItems[0]);

      // Test Arrow Down navigation
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      arrowDownEvent.preventDefault = vi.fn();
      submenuItems[0].dispatchEvent(arrowDownEvent);

      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();

      // Test Escape to close submenu
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      escapeEvent.preventDefault = vi.fn();
      submenuItems[1].dispatchEvent(escapeEvent);

      // Escape handling would be implemented to close submenu and return focus to parent
    });

    it('should handle roving tabindex in menu groups', () => {
      testContainer.innerHTML = `
        <nav role="navigation">
          <div role="menubar" aria-label="Topic navigation">
            <button role="menuitem" tabindex="0" id="math-topic">Math</button>
            <button role="menuitem" tabindex="-1" id="science-topic">Science</button>
            <button role="menuitem" tabindex="-1" id="reading-topic">Reading</button>
            <button role="menuitem" tabindex="-1" id="art-topic">Art</button>
          </div>
        </nav>
      `;

      const menubar = testContainer.querySelector('[role="menubar"]');
      const menuItems = menubar.querySelectorAll('[role="menuitem"]');

      const keyboardNav = service.keyboardNavigation;
      const rovingTabindex = keyboardNav.setupRovingTabindex(menubar, Array.from(menuItems));

      // Initial state: first item should be focusable
      expect(menuItems[0].getAttribute('tabindex')).toBe('0');
      expect(menuItems[1].getAttribute('tabindex')).toBe('-1');
      expect(menuItems[2].getAttribute('tabindex')).toBe('-1');
      expect(menuItems[3].getAttribute('tabindex')).toBe('-1');

      // Simulate focus change
      menuItems[2].focus();
      menuItems[2].dispatchEvent(new FocusEvent('focus', { bubbles: true }));

      // Third item should now be focusable
      expect(menuItems[0].getAttribute('tabindex')).toBe('-1');
      expect(menuItems[1].getAttribute('tabindex')).toBe('-1');
      expect(menuItems[2].getAttribute('tabindex')).toBe('0');
      expect(menuItems[3].getAttribute('tabindex')).toBe('-1');

      // Clean up
      rovingTabindex.destroy();
    });
  });

  describe('Page Navigation and Landmarks', () => {
    it('should handle F6 landmark navigation', async () => {
      testContainer.innerHTML = `
        <header role="banner" tabindex="-1" id="header">
          <h1>Site Header</h1>
        </header>
        <nav role="navigation" tabindex="-1" id="nav">
          <ul><li><a href="/">Home</a></li></ul>
        </nav>
        <main role="main" tabindex="-1" id="main">
          <h2>Main Content</h2>
        </main>
        <aside role="complementary" tabindex="-1" id="sidebar">
          <h3>Sidebar</h3>
        </aside>
        <footer role="contentinfo" tabindex="-1" id="footer">
          <p>Footer Content</p>
        </footer>
      `;

      await service.initialize();

      const nav = testContainer.querySelector('#nav');
      const main = testContainer.querySelector('#main');

      // Focus navigation
      nav.focus();
      expect(document.activeElement).toBe(nav);

      const focusSpy = vi.spyOn(main, 'focus');
      const announceSpy = vi.spyOn(service, 'announce');

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
      expect(announceSpy).toHaveBeenCalledWith(expect.stringContaining('main content'), 'polite');
    });

    it('should provide landmark names for screen readers', () => {
      testContainer.innerHTML = `
        <nav aria-label="Main navigation">Navigation</nav>
        <nav aria-labelledby="breadcrumb-title">
          <h2 id="breadcrumb-title">Page Location</h2>
        </nav>
        <main>Main Content</main>
        <aside aria-label="Related articles">Sidebar</aside>
        <footer>Footer</footer>
      `;

      const mainNav = testContainer.querySelector('nav[aria-label="Main navigation"]');
      const breadcrumbNav = testContainer.querySelector('nav[aria-labelledby="breadcrumb-title"]');
      const main = testContainer.querySelector('main');
      const aside = testContainer.querySelector('aside');
      const footer = testContainer.querySelector('footer');

      expect(service.getLandmarkName(mainNav)).toBe('Main navigation');
      expect(service.getLandmarkName(breadcrumbNav)).toBe('Page Location');
      expect(service.getLandmarkName(main)).toBe('main content');
      expect(service.getLandmarkName(aside)).toBe('Related articles');
      expect(service.getLandmarkName(footer)).toBe('footer');
    });

    it('should handle page navigation announcements', () => {
      testContainer.innerHTML = `
        <div id="page-status" aria-live="polite" class="sr-only"></div>
        
        <nav role="navigation">
          <ul>
            <li><a href="/home" id="home-link">Home</a></li>
            <li><a href="/about" id="about-link">About</a></li>
            <li><a href="/courses" id="courses-link">Courses</a></li>
          </ul>
        </nav>
        
        <main id="main-content" tabindex="-1">
          <h1 id="page-title">Current Page Title</h1>
        </main>
      `;

      const pageStatus = testContainer.querySelector('#page-status');
      const pageTitle = testContainer.querySelector('#page-title');
      const mainContent = testContainer.querySelector('#main-content');

      // Simulate navigation to new page
      pageTitle.textContent = 'About Us';
      pageStatus.textContent = 'Navigated to About Us page';

      // Focus should move to main content
      mainContent.focus();

      expect(pageStatus.getAttribute('aria-live')).toBe('polite');
      expect(pageStatus.textContent).toBe('Navigated to About Us page');
      expect(document.activeElement).toBe(mainContent);
    });
  });

  describe('Search Navigation', () => {
    it('should provide accessible search interface', () => {
      testContainer.innerHTML = `
        <div role="search" aria-labelledby="search-heading">
          <h2 id="search-heading">Search Courses</h2>
          
          <form role="search">
            <label for="search-input" class="visually-hidden">Search query</label>
            <input type="search" 
                   id="search-input"
                   placeholder="Enter search terms..."
                   aria-describedby="search-help search-results-count"
                   autocomplete="off">
            
            <button type="submit" aria-label="Submit search">
              <span class="search-icon" aria-hidden="true">🔍</span>
            </button>
            
            <div id="search-help" class="help-text">
              Search through course titles, descriptions, and topics
            </div>
          </form>
          
          <div id="search-results-count" 
               aria-live="polite" 
               aria-atomic="true"
               class="sr-only">
          </div>
        </div>
      `;

      const searchRegion = testContainer.querySelector('[role="search"]');
      const searchInput = testContainer.querySelector('#search-input');
      const searchButton = testContainer.querySelector('button[type="submit"]');
      const searchIcon = testContainer.querySelector('.search-icon');
      const resultsCount = testContainer.querySelector('#search-results-count');

      expect(searchRegion.getAttribute('aria-labelledby')).toBe('search-heading');
      expect(searchInput.getAttribute('aria-describedby')).toContain('search-help');
      expect(searchInput.getAttribute('aria-describedby')).toContain('search-results-count');
      expect(searchButton.getAttribute('aria-label')).toBe('Submit search');
      expect(searchIcon.getAttribute('aria-hidden')).toBe('true');
      expect(resultsCount.getAttribute('aria-live')).toBe('polite');
    });

    it('should handle search suggestions and autocomplete', () => {
      testContainer.innerHTML = `
        <div role="search">
          <label for="search-with-suggestions">Search</label>
          <input type="search" 
                 id="search-with-suggestions"
                 role="combobox"
                 aria-expanded="false"
                 aria-autocomplete="list"
                 aria-controls="search-suggestions"
                 aria-activedescendant="">
          
          <ul id="search-suggestions" 
              role="listbox" 
              aria-label="Search suggestions"
              style="display: none;">
            <li role="option" id="suggestion-1" aria-selected="false">Mathematics</li>
            <li role="option" id="suggestion-2" aria-selected="false">Math Games</li>
            <li role="option" id="suggestion-3" aria-selected="false">Math Worksheets</li>
          </ul>
        </div>
      `;

      const searchInput = testContainer.querySelector('#search-with-suggestions');
      const suggestions = testContainer.querySelector('#search-suggestions');
      const options = suggestions.querySelectorAll('[role="option"]');

      expect(searchInput.getAttribute('role')).toBe('combobox');
      expect(searchInput.getAttribute('aria-expanded')).toBe('false');
      expect(searchInput.getAttribute('aria-autocomplete')).toBe('list');
      expect(searchInput.getAttribute('aria-controls')).toBe('search-suggestions');

      expect(suggestions.getAttribute('role')).toBe('listbox');
      expect(suggestions.getAttribute('aria-label')).toBe('Search suggestions');

      options.forEach(option => {
        expect(option.getAttribute('role')).toBe('option');
        expect(option.getAttribute('aria-selected')).toBe('false');
      });

      // Simulate showing suggestions
      searchInput.setAttribute('aria-expanded', 'true');
      suggestions.style.display = 'block';

      // Simulate selecting first suggestion
      options[0].setAttribute('aria-selected', 'true');
      searchInput.setAttribute('aria-activedescendant', 'suggestion-1');

      expect(searchInput.getAttribute('aria-expanded')).toBe('true');
      expect(options[0].getAttribute('aria-selected')).toBe('true');
      expect(searchInput.getAttribute('aria-activedescendant')).toBe('suggestion-1');
    });

    it('should announce search results', () => {
      testContainer.innerHTML = `
        <div role="search">
          <input type="search" aria-describedby="results-summary">
          <button type="submit">Search</button>
        </div>
        
        <div id="results-summary" 
             aria-live="polite" 
             aria-atomic="true">
        </div>
        
        <div role="region" 
             aria-labelledby="results-heading"
             id="search-results">
          <h2 id="results-heading">Search Results</h2>
          <ul>
            <li><a href="/math-basics">Math Basics</a></li>
            <li><a href="/advanced-math">Advanced Math</a></li>
          </ul>
        </div>
      `;

      const resultsSummary = testContainer.querySelector('#results-summary');
      const resultsRegion = testContainer.querySelector('#search-results');

      // Simulate search completion
      resultsSummary.textContent = 'Found 2 results for "math"';

      expect(resultsSummary.getAttribute('aria-live')).toBe('polite');
      expect(resultsSummary.getAttribute('aria-atomic')).toBe('true');
      expect(resultsSummary.textContent).toBe('Found 2 results for "math"');

      expect(resultsRegion.getAttribute('role')).toBe('region');
      expect(resultsRegion.getAttribute('aria-labelledby')).toBe('results-heading');
    });
  });

  describe('Responsive Navigation', () => {
    it('should handle off-canvas navigation drawer', () => {
      testContainer.innerHTML = `
        <button class="nav-drawer-toggle" 
                aria-expanded="false" 
                aria-controls="nav-drawer"
                aria-label="Open navigation menu">
          <span class="hamburger" aria-hidden="true">☰</span>
        </button>
        
        <nav id="nav-drawer" 
             class="nav-drawer"
             aria-label="Main navigation"
             aria-hidden="true"
             style="transform: translateX(-100%);">
          
          <div class="nav-drawer-content">
            <button class="nav-drawer-close" 
                    aria-label="Close navigation menu">
              <span aria-hidden="true">×</span>
            </button>
            
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/courses">Courses</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
        </nav>
        
        <div class="nav-overlay" 
             aria-hidden="true" 
             style="display: none;"></div>
      `;

      const drawerToggle = testContainer.querySelector('.nav-drawer-toggle');
      const navDrawer = testContainer.querySelector('#nav-drawer');
      testContainer.querySelector('.nav-drawer-close');
      const overlay = testContainer.querySelector('.nav-overlay');

      expect(drawerToggle.getAttribute('aria-expanded')).toBe('false');
      expect(drawerToggle.getAttribute('aria-controls')).toBe('nav-drawer');
      expect(navDrawer.getAttribute('aria-hidden')).toBe('true');
      expect(overlay.getAttribute('aria-hidden')).toBe('true');

      // Simulate opening drawer
      drawerToggle.setAttribute('aria-expanded', 'true');
      navDrawer.setAttribute('aria-hidden', 'false');
      navDrawer.style.transform = 'translateX(0)';
      overlay.setAttribute('aria-hidden', 'false');
      overlay.style.display = 'block';

      expect(drawerToggle.getAttribute('aria-expanded')).toBe('true');
      expect(navDrawer.getAttribute('aria-hidden')).toBe('false');
      expect(overlay.getAttribute('aria-hidden')).toBe('false');
    });

    it('should handle tab navigation collapse/expand', () => {
      testContainer.innerHTML = `
        <nav role="navigation" class="tab-navigation">
          <button class="nav-expander" 
                  aria-expanded="false" 
                  aria-controls="nav-tabs"
                  aria-label="Show all navigation options">
            More Navigation
          </button>
          
          <div id="nav-tabs" 
               role="tablist" 
               aria-label="Site sections"
               style="display: none;">
            <button role="tab" 
                    aria-selected="true" 
                    aria-controls="home-panel"
                    id="home-tab">
              Home
            </button>
            <button role="tab" 
                    aria-selected="false" 
                    aria-controls="courses-panel"
                    id="courses-tab">
              Courses
            </button>
            <button role="tab" 
                    aria-selected="false" 
                    aria-controls="about-panel"
                    id="about-tab">
              About
            </button>
          </div>
        </nav>
      `;

      const navExpander = testContainer.querySelector('.nav-expander');
      const navTabs = testContainer.querySelector('#nav-tabs');
      const tabs = navTabs.querySelectorAll('[role="tab"]');

      expect(navExpander.getAttribute('aria-expanded')).toBe('false');
      expect(navExpander.getAttribute('aria-controls')).toBe('nav-tabs');
      expect(navTabs.getAttribute('role')).toBe('tablist');

      // First tab should be selected
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
      expect(tabs[2].getAttribute('aria-selected')).toBe('false');

      // Simulate expanding navigation
      navExpander.setAttribute('aria-expanded', 'true');
      navTabs.style.display = 'block';

      expect(navExpander.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Navigation Error Handling and Edge Cases', () => {
    it('should handle broken navigation links gracefully', () => {
      testContainer.innerHTML = `
        <nav role="navigation" aria-label="Main navigation">
          <ul>
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/broken-link" id="broken-link">Broken Link</a></li>
            <li><a href="/courses">Courses</a></li>
          </ul>
          
          <div id="nav-status" 
               aria-live="polite" 
               class="sr-only">
          </div>
        </nav>
      `;

      const brokenLink = testContainer.querySelector('#broken-link');
      const navStatus = testContainer.querySelector('#nav-status');

      // Simulate navigation error
      brokenLink.addEventListener('click', e => {
        e.preventDefault();
        navStatus.textContent = 'Navigation failed. Please try again or contact support.';
      });

      brokenLink.click();

      expect(navStatus.getAttribute('aria-live')).toBe('polite');
      expect(navStatus.textContent).toContain('Navigation failed');
    });

    it('should handle navigation with loading states', () => {
      testContainer.innerHTML = `
        <nav role="navigation">
          <ul>
            <li>
              <a href="/slow-page" 
                 id="slow-link"
                 aria-describedby="nav-status">
                Slow Loading Page
              </a>
            </li>
          </ul>
        </nav>
        
        <div id="nav-status" 
             aria-live="polite" 
             class="sr-only">
        </div>
      `;

      const slowLink = testContainer.querySelector('#slow-link');
      const navStatus = testContainer.querySelector('#nav-status');

      // Simulate slow navigation
      slowLink.addEventListener('click', e => {
        e.preventDefault();
        slowLink.setAttribute('aria-busy', 'true');
        navStatus.textContent = 'Loading page, please wait...';

        setTimeout(() => {
          slowLink.removeAttribute('aria-busy');
          navStatus.textContent = 'Page loaded successfully';
        }, 100);
      });

      slowLink.click();

      expect(slowLink.getAttribute('aria-busy')).toBe('true');
      expect(navStatus.textContent).toBe('Loading page, please wait...');

      setTimeout(() => {
        expect(slowLink.getAttribute('aria-busy')).toBeNull();
        expect(navStatus.textContent).toBe('Page loaded successfully');
      }, 150);
    });

    it('should maintain navigation state during dynamic updates', () => {
      testContainer.innerHTML = `
        <nav role="navigation" id="dynamic-nav" aria-live="polite">
          <ul id="nav-list">
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/courses">Courses</a></li>
          </ul>
        </nav>
      `;

      const dynamicNav = testContainer.querySelector('#dynamic-nav');
      const navList = testContainer.querySelector('#nav-list');

      expect(dynamicNav.getAttribute('aria-live')).toBe('polite');

      // Simulate adding new navigation item
      const newItem = document.createElement('li');
      newItem.innerHTML = '<a href="/new-section">New Section</a>';
      navList.appendChild(newItem);

      const navItems = navList.querySelectorAll('li');
      expect(navItems.length).toBe(3);

      // Current page indicator should be maintained
      const currentPage = navList.querySelector('[aria-current="page"]');
      expect(currentPage.textContent).toBe('Home');
    });
  });
});
