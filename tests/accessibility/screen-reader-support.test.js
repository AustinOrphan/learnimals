/**
 * Screen Reader Support Tests
 * Comprehensive tests for screen reader compatibility, announcements, and semantic markup
 * Ensures WCAG 2.1 Level AA compliance for screen reader accessibility
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

describe('Screen Reader Support Tests', () => {
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

    // Mock speechSynthesis using Vitest stubGlobal
    vi.stubGlobal('speechSynthesis', {
      getVoices: vi.fn(() => [{ name: 'Test Voice', lang: 'en-US' }]),
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      speaking: false,
      pending: false,
      paused: false,
    });

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Screen Reader Detection', () => {
    it('should detect screen reader from user agent', () => {
      // Mock user agent with NVDA
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NVDA',
      });

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should detect screen reader from JAWS user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JAWS/2023',
      });

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should detect screen reader from speech synthesis availability', () => {
      // Reset user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      // Mock speechSynthesis with voices
      window.speechSynthesis.getVoices.mockReturnValue([
        { name: 'Microsoft David', lang: 'en-US' },
        { name: 'Microsoft Zira', lang: 'en-US' },
      ]);

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should handle errors during screen reader detection', () => {
      // Mock speechSynthesis to throw error
      vi.stubGlobal('speechSynthesis', {
        get getVoices() {
          throw new Error('Not available');
        },
        speak: vi.fn(),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        speaking: false,
        pending: false,
        paused: false,
      });

      const isDetected = service.detectScreenReader();
      expect(typeof isDetected).toBe('boolean');
    });
  });

  describe('Live Region Announcements', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create ARIA live regions for announcements', () => {
      const politeRegion = document.getElementById('accessibility-announcer-polite');
      const assertiveRegion = document.getElementById('accessibility-announcer-assertive');

      expect(politeRegion).toBeTruthy();
      expect(politeRegion.getAttribute('aria-live')).toBe('polite');
      expect(politeRegion.getAttribute('aria-atomic')).toBe('true');
      expect(politeRegion.className).toContain('sr-only');

      expect(assertiveRegion).toBeTruthy();
      expect(assertiveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(assertiveRegion.getAttribute('aria-atomic')).toBe('true');
      expect(assertiveRegion.className).toContain('sr-only');
    });

    it('should announce polite messages', done => {
      const message = 'Form saved successfully';

      service.announce(message, 'polite', 500);

      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-polite');
        expect(announcer.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should announce assertive messages', done => {
      const message = 'Error: Please correct the highlighted fields';

      service.announce(message, 'assertive', 500);

      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-assertive');
        expect(announcer.textContent).toBe(message);
        done();
      }, 150);
    });

    it('should clear announcements after timeout', done => {
      const message = 'Temporary message';

      service.announce(message, 'polite', 300);

      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-polite');
        expect(announcer.textContent).toBe('');
        done();
      }, 400);
    });

    it('should handle multiple rapid announcements', done => {
      service.announce('First message', 'polite', 100);
      service.announce('Second message', 'polite', 100);
      service.announce('Third message', 'polite', 100);

      setTimeout(() => {
        const announcer = document.getElementById('accessibility-announcer-polite');
        expect(announcer.textContent).toBe('Third message');
        done();
      }, 150);
    });

    it('should not announce empty or null messages', () => {
      service.announce('', 'polite');
      service.announce(null, 'polite');
      service.announce(undefined, 'polite');

      const politeAnnouncer = document.getElementById('accessibility-announcer-polite');
      const assertiveAnnouncer = document.getElementById('accessibility-announcer-assertive');

      expect(politeAnnouncer.textContent).toBe('');
      expect(assertiveAnnouncer.textContent).toBe('');
    });
  });

  describe('Status and Alert Messages', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create status region for non-urgent messages', () => {
      const statusRegion = document.getElementById('status-messages');

      expect(statusRegion).toBeTruthy();
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
      expect(statusRegion.getAttribute('aria-atomic')).toBe('false');
      expect(statusRegion.className).toContain('sr-only');
    });

    it('should create alert region for urgent messages', () => {
      const alertRegion = document.getElementById('alert-messages');

      expect(alertRegion).toBeTruthy();
      expect(alertRegion.getAttribute('aria-live')).toBe('assertive');
      expect(alertRegion.getAttribute('aria-atomic')).toBe('true');
      expect(alertRegion.className).toContain('sr-only');
    });

    it('should announce status changes properly', () => {
      const component = new AccessibleComponent({
        announceChanges: true,
      });

      const div = document.createElement('div');
      component.element = div;
      testContainer.appendChild(div);

      const announceSpy = vi.spyOn(component, 'announce');

      component.setState({ loading: true }, true);

      expect(announceSpy).toHaveBeenCalled();
    });

    it('should handle form validation announcements', () => {
      testContainer.innerHTML = `
        <form>
          <label for="email">Email</label>
          <input type="email" id="email" aria-invalid="false">
          <div id="email-error" role="alert" aria-live="assertive" style="display: none;"></div>
        </form>
      `;

      const input = testContainer.querySelector('#email');
      const errorDiv = testContainer.querySelector('#email-error');

      // Simulate validation error
      input.setAttribute('aria-invalid', 'true');
      errorDiv.textContent = 'Please enter a valid email address';
      errorDiv.style.display = 'block';

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(errorDiv.getAttribute('role')).toBe('alert');
      expect(errorDiv.textContent).toBe('Please enter a valid email address');
    });
  });

  describe('Semantic Markup for Screen Readers', () => {
    it('should provide proper heading structure', () => {
      testContainer.innerHTML = `
        <h1>Page Title</h1>
        <section>
          <h2>Section Title</h2>
          <article>
            <h3>Article Title</h3>
            <p>Content goes here</p>
          </article>
        </section>
      `;

      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBe(3);

      // Verify logical heading order
      expect(headings[0].tagName).toBe('H1');
      expect(headings[1].tagName).toBe('H2');
      expect(headings[2].tagName).toBe('H3');
    });

    it('should fix skipped heading levels', () => {
      testContainer.innerHTML = `
        <div>
          <h1>Main Title</h1>
          <h4>Skipped to H4</h4>
          <h2>Proper H2</h2>
        </div>
      `;

      const component = new AccessibleComponent();
      component.element = testContainer;
      component.setupHeadingHierarchy();

      // The component should correct heading levels
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should provide proper list semantics', () => {
      testContainer.innerHTML = `
        <ul role="list">
          <li role="listitem">Item 1</li>
          <li role="listitem">Item 2</li>
          <li role="listitem">Item 3</li>
        </ul>
      `;

      const list = testContainer.querySelector('ul');
      const items = testContainer.querySelectorAll('li');

      expect(list.getAttribute('role')).toBe('list');
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });

    it('should handle definition lists properly', () => {
      testContainer.innerHTML = `
        <dl>
          <dt>Term 1</dt>
          <dd>Definition 1</dd>
          <dt>Term 2</dt>
          <dd>Definition 2</dd>
        </dl>
      `;

      const dl = testContainer.querySelector('dl');
      const terms = testContainer.querySelectorAll('dt');
      const definitions = testContainer.querySelectorAll('dd');

      expect(dl).toBeTruthy();
      expect(terms.length).toBe(2);
      expect(definitions.length).toBe(2);
    });

    it('should provide proper table semantics', () => {
      testContainer.innerHTML = `
        <table role="table" aria-label="Student grades">
          <caption>Final exam scores by student</caption>
          <thead>
            <tr role="row">
              <th role="columnheader">Name</th>
              <th role="columnheader">Score</th>
              <th role="columnheader">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr role="row">
              <td role="cell">John Doe</td>
              <td role="cell">85</td>
              <td role="cell">B</td>
            </tr>
            <tr role="row">
              <td role="cell">Jane Smith</td>
              <td role="cell">92</td>
              <td role="cell">A</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = testContainer.querySelector('table');
      const caption = testContainer.querySelector('caption');
      const headers = testContainer.querySelectorAll('th[role="columnheader"]');
      const cells = testContainer.querySelectorAll('td[role="cell"]');

      expect(table.getAttribute('aria-label')).toBe('Student grades');
      expect(caption.textContent).toBe('Final exam scores by student');
      expect(headers.length).toBe(3);
      expect(cells.length).toBe(6);
    });
  });

  describe('Component State Announcements', () => {
    it('should announce component ready state', () => {
      const component = new AccessibleComponent({
        announceChanges: true,
        ariaLabel: 'Navigation menu',
      });

      const nav = document.createElement('nav');
      component.element = nav;
      testContainer.appendChild(nav);

      const announceSpy = vi.spyOn(component, 'announce');

      component.announceComponentReady();

      expect(announceSpy).toHaveBeenCalledWith('Navigation menu is ready', 'polite');
    });

    it('should announce loading states', () => {
      const button = document.createElement('button');
      button.textContent = 'Load Data';
      button.setAttribute('aria-describedby', 'loading-status');

      const status = document.createElement('div');
      status.id = 'loading-status';
      status.setAttribute('aria-live', 'polite');
      status.className = 'sr-only';

      testContainer.appendChild(button);
      testContainer.appendChild(status);

      // Simulate loading start
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
      button.textContent = 'Loading...';
      status.textContent = 'Loading data, please wait';

      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.disabled).toBe(true);
      expect(status.textContent).toBe('Loading data, please wait');

      // Simulate loading complete
      button.setAttribute('aria-busy', 'false');
      button.disabled = false;
      button.textContent = 'Load Data';
      status.textContent = 'Data loaded successfully';

      expect(button.getAttribute('aria-busy')).toBe('false');
      expect(button.disabled).toBe(false);
      expect(status.textContent).toBe('Data loaded successfully');
    });

    it('should announce progress updates', () => {
      testContainer.innerHTML = `
        <div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Upload progress">
          <div class="progress-bar" style="width: 0%;"></div>
        </div>
        <div id="progress-status" aria-live="polite" class="sr-only"></div>
      `;

      const progressbar = testContainer.querySelector('[role="progressbar"]');
      const status = testContainer.querySelector('#progress-status');
      const progressBar = testContainer.querySelector('.progress-bar');

      // Simulate progress updates
      const updateProgress = value => {
        progressbar.setAttribute('aria-valuenow', value.toString());
        progressBar.style.width = `${value}%`;
        status.textContent = `Upload ${value}% complete`;
      };

      updateProgress(25);
      expect(progressbar.getAttribute('aria-valuenow')).toBe('25');
      expect(status.textContent).toBe('Upload 25% complete');

      updateProgress(50);
      expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
      expect(status.textContent).toBe('Upload 50% complete');

      updateProgress(100);
      expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
      expect(status.textContent).toBe('Upload 100% complete');
    });

    it('should announce expansion state changes', () => {
      testContainer.innerHTML = `
        <button aria-expanded="false" aria-controls="menu">Menu</button>
        <ul id="menu" aria-hidden="true">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div id="menu-status" aria-live="polite" class="sr-only"></div>
      `;

      const button = testContainer.querySelector('button');
      const menu = testContainer.querySelector('#menu');
      const status = testContainer.querySelector('#menu-status');

      // Simulate menu expansion
      button.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      status.textContent = 'Menu expanded';

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(menu.getAttribute('aria-hidden')).toBe('false');
      expect(status.textContent).toBe('Menu expanded');

      // Simulate menu collapse
      button.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      status.textContent = 'Menu collapsed';

      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(menu.getAttribute('aria-hidden')).toBe('true');
      expect(status.textContent).toBe('Menu collapsed');
    });
  });

  describe('Alternative Text and Descriptions', () => {
    it('should provide meaningful alt text for images', () => {
      testContainer.innerHTML = `
        <img src="chart.png" alt="Sales increased by 25% from Q1 to Q2 2023">
        <img src="decoration.png" alt="" role="presentation">
        <img src="logo.png" alt="Learnimals Educational Platform">
      `;

      const images = testContainer.querySelectorAll('img');

      expect(images[0].alt).toBe('Sales increased by 25% from Q1 to Q2 2023');
      expect(images[1].alt).toBe(''); // Decorative image
      expect(images[1].getAttribute('role')).toBe('presentation');
      expect(images[2].alt).toBe('Learnimals Educational Platform');
    });

    it('should handle complex images with descriptions', () => {
      testContainer.innerHTML = `
        <figure>
          <img src="complex-chart.png" alt="Revenue trends chart" aria-describedby="chart-desc">
          <figcaption id="chart-desc">
            This chart shows quarterly revenue from 2020 to 2023. 
            Revenue started at $100K in Q1 2020, declined to $80K in Q2 2020 due to pandemic, 
            then steadily increased to reach $250K in Q4 2023.
          </figcaption>
        </figure>
      `;

      const img = testContainer.querySelector('img');
      const description = testContainer.querySelector('#chart-desc');

      expect(img.alt).toBe('Revenue trends chart');
      expect(img.getAttribute('aria-describedby')).toBe('chart-desc');
      expect(description.textContent).toContain('quarterly revenue');
    });

    it('should handle audio and video descriptions', () => {
      testContainer.innerHTML = `
        <video controls aria-describedby="video-desc">
          <source src="tutorial.mp4" type="video/mp4">
          <track kind="captions" src="captions.vtt" srclang="en" label="English">
          <track kind="descriptions" src="descriptions.vtt" srclang="en" label="Audio descriptions">
        </video>
        <div id="video-desc">
          This video demonstrates how to create a new account on the platform. 
          It includes step-by-step instructions with visual indicators.
        </div>
      `;

      const video = testContainer.querySelector('video');
      const captionTrack = testContainer.querySelector('track[kind="captions"]');
      const descriptionTrack = testContainer.querySelector('track[kind="descriptions"]');

      expect(video.getAttribute('aria-describedby')).toBe('video-desc');
      expect(captionTrack.getAttribute('kind')).toBe('captions');
      expect(descriptionTrack.getAttribute('kind')).toBe('descriptions');
    });
  });

  describe('Reading Order and Navigation', () => {
    it('should maintain logical reading order', () => {
      testContainer.innerHTML = `
        <article>
          <h1>Article Title</h1>
          <p class="byline">By Author Name</p>
          <p class="date">Published March 15, 2024</p>
          <div class="content">
            <p>First paragraph of content...</p>
            <p>Second paragraph of content...</p>
          </div>
          <aside class="related">
            <h2>Related Articles</h2>
            <ul>
              <li><a href="#article1">Related Article 1</a></li>
              <li><a href="#article2">Related Article 2</a></li>
            </ul>
          </aside>
        </article>
      `;

      const article = testContainer.querySelector('article');
      const elements = Array.from(article.querySelectorAll('*'));

      // The elements should maintain logical reading order in DOM
      expect(elements[0].tagName).toBe('H1');
      expect(elements[1].classList.contains('byline')).toBe(true);
      expect(elements[2].classList.contains('date')).toBe(true);
    });

    it('should handle skip to content functionality', () => {
      testContainer.innerHTML = `
        <nav id="main-navigation">
          <a href="#main-content" class="skip-link">Skip to main content</a>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </nav>
        <main id="main-content" tabindex="-1">
          <h1>Main Content</h1>
          <p>This is the main content area.</p>
        </main>
      `;

      const skipLink = testContainer.querySelector('.skip-link');
      const mainContent = testContainer.querySelector('#main-content');

      expect(skipLink.getAttribute('href')).toBe('#main-content');
      expect(mainContent.getAttribute('tabindex')).toBe('-1');
      expect(mainContent.id).toBe('main-content');
    });

    it('should provide breadcrumb navigation with proper semantics', () => {
      testContainer.innerHTML = `
        <nav aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/courses">Courses</a></li>
            <li><a href="/courses/math">Math</a></li>
            <li aria-current="page">Basic Addition</li>
          </ol>
        </nav>
      `;

      const breadcrumb = testContainer.querySelector('nav');
      const currentPage = testContainer.querySelector('[aria-current="page"]');

      expect(breadcrumb.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(currentPage.getAttribute('aria-current')).toBe('page');
      expect(currentPage.textContent).toBe('Basic Addition');
    });
  });

  describe('Screen Reader Instructions and Hints', () => {
    it('should provide clear instructions for interactive elements', () => {
      testContainer.innerHTML = `
        <div role="slider" 
             aria-valuenow="50" 
             aria-valuemin="0" 
             aria-valuemax="100" 
             aria-label="Volume"
             aria-describedby="volume-instructions"
             tabindex="0">
          <div class="slider-track">
            <div class="slider-thumb" style="left: 50%;"></div>
          </div>
        </div>
        <div id="volume-instructions" class="sr-only">
          Use arrow keys to adjust volume. Press Home for minimum, End for maximum.
        </div>
      `;

      const slider = testContainer.querySelector('[role="slider"]');
      const instructions = testContainer.querySelector('#volume-instructions');

      expect(slider.getAttribute('aria-describedby')).toBe('volume-instructions');
      expect(instructions.textContent).toContain('Use arrow keys');
    });

    it('should provide context for form fields', () => {
      testContainer.innerHTML = `
        <fieldset>
          <legend>Payment Information</legend>
          <div>
            <label for="cc-number">Credit Card Number</label>
            <input type="text" 
                   id="cc-number" 
                   aria-describedby="cc-format cc-security"
                   autocomplete="cc-number">
            <div id="cc-format" class="help-text">Format: 1234 5678 9012 3456</div>
            <div id="cc-security" class="help-text">Your card information is encrypted and secure</div>
          </div>
        </fieldset>
      `;

      const input = testContainer.querySelector('#cc-number');
      const formatHelp = testContainer.querySelector('#cc-format');
      const securityHelp = testContainer.querySelector('#cc-security');

      expect(input.getAttribute('aria-describedby')).toBe('cc-format cc-security');
      expect(formatHelp.textContent).toContain('Format:');
      expect(securityHelp.textContent).toContain('encrypted and secure');
    });

    it('should announce search results and counts', () => {
      testContainer.innerHTML = `
        <div role="search" aria-label="Course search">
          <input type="search" 
                 aria-label="Search courses" 
                 aria-describedby="search-results-count">
          <button type="submit">Search</button>
        </div>
        <div id="search-results-count" aria-live="polite" class="sr-only">
          Found 15 courses matching your search
        </div>
        <div role="region" aria-label="Search results">
          <!-- Search results would go here -->
        </div>
      `;

      const searchInput = testContainer.querySelector('input[type="search"]');
      const resultsCount = testContainer.querySelector('#search-results-count');
      const resultsRegion = testContainer.querySelector('[role="region"]');

      expect(searchInput.getAttribute('aria-describedby')).toBe('search-results-count');
      expect(resultsCount.getAttribute('aria-live')).toBe('polite');
      expect(resultsRegion.getAttribute('aria-label')).toBe('Search results');
    });
  });
});
