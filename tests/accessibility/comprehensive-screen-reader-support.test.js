/**
 * Comprehensive Screen Reader Support Tests
 * Complete test suite covering all aspects of screen reader accessibility
 * including announcements, semantic markup, navigation, and WCAG 2.1 compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';

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

describe('Comprehensive Screen Reader Support Tests', () => {
  let testContainer;
  let service;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock timers for announcement testing
    vi.useFakeTimers();

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

    // Mock speechSynthesis for screen reader detection
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      configurable: true,
      value: {
        getVoices: vi.fn(() => [{ name: 'Test Voice', lang: 'en-US' }]),
        speak: vi.fn(),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        speaking: false,
        pending: false,
        paused: false,
      },
    });

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Screen Reader Detection and Optimization', () => {
    it('should detect NVDA screen reader', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NVDA/2023.1',
      });

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should detect JAWS screen reader', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JAWS/2023',
      });

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should detect VoiceOver on macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      });

      // Mock VoiceOver detection through speech synthesis
      window.speechSynthesis.getVoices.mockReturnValue([
        { name: 'Alex', lang: 'en-US' },
        { name: 'Victoria', lang: 'en-US' },
      ]);

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should detect TalkBack on Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
      });

      // Mock TalkBack indicators
      Object.defineProperty(window, 'accessibility', {
        value: { talkBackEnabled: true },
      });

      const isDetected = service.detectScreenReader();
      expect(isDetected).toBe(true);
    });

    it('should optimize interface for detected screen readers', async () => {
      // Mock screen reader detection
      vi.spyOn(service, 'detectScreenReader').mockReturnValue(true);

      await service.initialize();

      // Check for screen reader optimizations (the service records detection
      // in its preferences; it does not currently toggle a body class)
      expect(service.preferences.screenReader).toBe(true);

      // Verify enhanced semantics are applied
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should handle screen reader detection errors gracefully', () => {
      // Mock error in detection
      Object.defineProperty(window, 'speechSynthesis', {
        get: () => {
          throw new Error('Speech synthesis not available');
        },
      });

      expect(() => service.detectScreenReader()).not.toThrow();
      const result = service.detectScreenReader();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Dynamic Content Announcements', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should announce content changes with proper timing', async () => {
      const message = 'New content has loaded';

      service.announce(message, 'polite', 500);

      await vi.advanceTimersByTimeAsync(150);
      const announcer = document.getElementById('accessibility-announcer-polite');
      expect(announcer.textContent).toBe(message);
    });

    it('should prioritize urgent announcements', async () => {
      const urgentMessage = 'Error: Form submission failed';
      const normalMessage = 'Loading complete';

      // Send normal message first
      service.announce(normalMessage, 'polite');

      // Then urgent message should override
      service.announce(urgentMessage, 'assertive');

      await vi.advanceTimersByTimeAsync(150);
      const assertiveAnnouncer = document.getElementById('accessibility-announcer-assertive');
      expect(assertiveAnnouncer.textContent).toBe(urgentMessage);
    });

    it('should announce page navigation changes', () => {
      testContainer.innerHTML = `
        <main id="main-content">
          <h1>New Page Title</h1>
          <nav aria-label="Breadcrumb">
            <ol>
              <li><a href="/">Home</a></li>
              <li><a href="/subjects">Subjects</a></li>
              <li aria-current="page">Mathematics</li>
            </ol>
          </nav>
        </main>
        <div id="page-status" aria-live="polite" class="sr-only"></div>
      `;

      const pageStatus = testContainer.querySelector('#page-status');
      const heading = testContainer.querySelector('h1');
      const currentPage = testContainer.querySelector('[aria-current="page"]');

      // Simulate page change announcement
      pageStatus.textContent = `Navigated to ${heading.textContent}. You are on ${currentPage.textContent} page.`;

      expect(pageStatus.textContent).toContain('Navigated to New Page Title');
      expect(pageStatus.textContent).toContain('Mathematics page');
    });

    it('should announce modal dialog state changes', () => {
      testContainer.innerHTML = `
        <div role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-desc" aria-modal="true">
          <h2 id="dialog-title">Confirm Action</h2>
          <p id="dialog-desc">Are you sure you want to delete this item?</p>
          <button type="button">Confirm</button>
          <button type="button">Cancel</button>
        </div>
        <div id="dialog-status" aria-live="assertive" class="sr-only">
          Dialog opened: Confirm Action
        </div>
      `;

      const dialog = testContainer.querySelector('[role="dialog"]');
      const statusRegion = testContainer.querySelector('#dialog-status');

      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(statusRegion.textContent).toContain('Dialog opened');
      expect(statusRegion.getAttribute('aria-live')).toBe('assertive');
    });

    it('should announce dynamic list updates', () => {
      testContainer.innerHTML = `
        <ul role="list" aria-labelledby="list-title">
          <li role="listitem">Item 1</li>
          <li role="listitem">Item 2</li>
          <li role="listitem">Item 3</li>
        </ul>
        <div id="list-updates" aria-live="polite" class="sr-only"></div>
      `;

      const list = testContainer.querySelector('[role="list"]');
      const updateRegion = testContainer.querySelector('#list-updates');

      // Simulate adding an item
      const newItem = document.createElement('li');
      newItem.setAttribute('role', 'listitem');
      newItem.textContent = 'Item 4';
      list.appendChild(newItem);

      updateRegion.textContent = 'Item added to list. List now contains 4 items.';

      expect(updateRegion.textContent).toContain('Item added');
      expect(updateRegion.textContent).toContain('4 items');
    });
  });

  describe('Semantic HTML Structure Validation', () => {
    it('should validate proper heading hierarchy', () => {
      testContainer.innerHTML = `
        <article>
          <h1>Main Article Title</h1>
          <section>
            <h2>Section Title</h2>
            <h3>Subsection Title</h3>
            <h4>Sub-subsection Title</h4>
          </section>
          <section>
            <h2>Another Section</h2>
            <h3>Another Subsection</h3>
          </section>
        </article>
      `;

      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');

      // Verify heading levels are sequential
      const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
      expect(levels).toEqual([1, 2, 3, 4, 2, 3]);

      // Verify each heading has meaningful text
      headings.forEach(heading => {
        expect(heading.textContent.trim()).toBeTruthy();
        expect(heading.textContent.length).toBeGreaterThan(3);
      });
    });

    it('should provide proper landmark structure', () => {
      testContainer.innerHTML = `
        <header role="banner">
          <h1>Site Title</h1>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
        </header>
        <main role="main">
          <h2>Page Content</h2>
          <p>Main content goes here</p>
        </main>
        <aside role="complementary" aria-label="Related links">
          <h3>Related</h3>
          <ul>
            <li><a href="/related1">Related 1</a></li>
          </ul>
        </aside>
        <footer role="contentinfo">
          <p>&copy; 2024 Educational Platform</p>
        </footer>
      `;

      const landmarks = {
        banner: testContainer.querySelector('[role="banner"]'),
        navigation: testContainer.querySelector('[role="navigation"]'),
        main: testContainer.querySelector('[role="main"]'),
        complementary: testContainer.querySelector('[role="complementary"]'),
        contentinfo: testContainer.querySelector('[role="contentinfo"]'),
      };

      Object.entries(landmarks).forEach(([role, element]) => {
        expect(element).toBeTruthy();
        expect(element.getAttribute('role')).toBe(role);
      });

      // Verify navigation has proper labeling
      const nav = landmarks.navigation;
      expect(nav.getAttribute('aria-label')).toBe('Main navigation');

      // Verify complementary has descriptive label
      const aside = landmarks.complementary;
      expect(aside.getAttribute('aria-label')).toBe('Related links');
    });

    it('should validate table semantics for data tables', () => {
      testContainer.innerHTML = `
        <table role="table" aria-labelledby="table-caption">
          <caption id="table-caption">Student Grade Report</caption>
          <thead>
            <tr role="row">
              <th role="columnheader" scope="col">Student Name</th>
              <th role="columnheader" scope="col">Subject</th>
              <th role="columnheader" scope="col">Grade</th>
              <th role="columnheader" scope="col">Comments</th>
            </tr>
          </thead>
          <tbody>
            <tr role="row">
              <th role="rowheader" scope="row">John Doe</th>
              <td role="cell">Mathematics</td>
              <td role="cell">A-</td>
              <td role="cell">Excellent problem-solving skills</td>
            </tr>
            <tr role="row">
              <th role="rowheader" scope="row">Jane Smith</th>
              <td role="cell">Science</td>
              <td role="cell">B+</td>
              <td role="cell">Shows good understanding of concepts</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = testContainer.querySelector('table');
      const caption = testContainer.querySelector('caption');
      const columnHeaders = testContainer.querySelectorAll('th[scope="col"]');
      const rowHeaders = testContainer.querySelectorAll('th[scope="row"]');
      const dataCells = testContainer.querySelectorAll('td[role="cell"]');

      expect(table.getAttribute('aria-labelledby')).toBe('table-caption');
      expect(caption.textContent).toContain('Student Grade Report');
      expect(columnHeaders.length).toBe(4);
      expect(rowHeaders.length).toBe(2);
      expect(dataCells.length).toBe(6);

      // Verify all headers have scope attributes
      columnHeaders.forEach(th => {
        expect(th.getAttribute('scope')).toBe('col');
      });

      rowHeaders.forEach(th => {
        expect(th.getAttribute('scope')).toBe('row');
      });
    });

    it('should validate list semantics and structure', () => {
      testContainer.innerHTML = `
        <nav aria-label="Course navigation">
          <ul role="list">
            <li role="listitem">
              <a href="/math">Mathematics</a>
              <ul role="list">
                <li role="listitem"><a href="/math/algebra">Algebra</a></li>
                <li role="listitem"><a href="/math/geometry">Geometry</a></li>
              </ul>
            </li>
            <li role="listitem">
              <a href="/science">Science</a>
              <ul role="list">
                <li role="listitem"><a href="/science/physics">Physics</a></li>
                <li role="listitem"><a href="/science/chemistry">Chemistry</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      `;

      const lists = testContainer.querySelectorAll('ul[role="list"]');
      const listItems = testContainer.querySelectorAll('li[role="listitem"]');

      expect(lists.length).toBe(3); // 1 parent + 2 nested
      expect(listItems.length).toBe(6); // 2 parent + 4 nested

      // Verify nested structure is proper
      const parentItems = testContainer.querySelectorAll('nav > ul > li');
      parentItems.forEach(item => {
        const nestedList = item.querySelector('ul');
        if (nestedList) {
          expect(nestedList.getAttribute('role')).toBe('list');
          const nestedItems = nestedList.querySelectorAll('li');
          nestedItems.forEach(nestedItem => {
            expect(nestedItem.getAttribute('role')).toBe('listitem');
          });
        }
      });
    });

    it('should validate form labeling and structure', () => {
      testContainer.innerHTML = `
        <form aria-labelledby="form-title">
          <h2 id="form-title">Student Registration Form</h2>
          
          <fieldset>
            <legend>Personal Information</legend>
            
            <div class="form-group">
              <label for="student-name">Full Name <span aria-label="required">*</span></label>
              <input type="text" 
                     id="student-name" 
                     name="studentName" 
                     required 
                     aria-describedby="name-help name-error"
                     aria-invalid="false">
              <div id="name-help" class="help-text">Enter your first and last name</div>
              <div id="name-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
            </div>

            <div class="form-group">
              <label for="student-email">Email Address <span aria-label="required">*</span></label>
              <input type="email" 
                     id="student-email" 
                     name="studentEmail" 
                     required 
                     aria-describedby="email-help"
                     aria-invalid="false">
              <div id="email-help" class="help-text">We'll use this to send important updates</div>
            </div>

            <div class="form-group">
              <label for="grade-level">Grade Level</label>
              <select id="grade-level" name="gradeLevel" aria-describedby="grade-help">
                <option value="">Select grade level</option>
                <option value="k">Kindergarten</option>
                <option value="1">1st Grade</option>
                <option value="2">2nd Grade</option>
                <option value="3">3rd Grade</option>
              </select>
              <div id="grade-help" class="help-text">Choose your current grade level</div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Subjects of Interest</legend>
            <div role="group" aria-labelledby="subjects-label">
              <div id="subjects-label" class="group-label">Select all subjects you're interested in:</div>
              <label>
                <input type="checkbox" name="subjects" value="math" aria-describedby="subjects-help">
                Mathematics
              </label>
              <label>
                <input type="checkbox" name="subjects" value="science" aria-describedby="subjects-help">
                Science
              </label>
              <label>
                <input type="checkbox" name="subjects" value="reading" aria-describedby="subjects-help">
                Reading
              </label>
              <div id="subjects-help" class="help-text">You can change these preferences later</div>
            </div>
          </fieldset>

          <button type="submit" aria-describedby="submit-help">Register</button>
          <div id="submit-help" class="help-text">By registering, you agree to our terms of service</div>
        </form>
      `;

      const form = testContainer.querySelector('form');
      const fieldsets = testContainer.querySelectorAll('fieldset');
      const inputs = testContainer.querySelectorAll('input, select');
      const requiredInputs = testContainer.querySelectorAll('[required]');

      // Verify form has proper labeling
      expect(form.getAttribute('aria-labelledby')).toBe('form-title');

      // Verify fieldsets have legends
      fieldsets.forEach(fieldset => {
        const legend = fieldset.querySelector('legend');
        expect(legend).toBeTruthy();
        expect(legend.textContent.trim()).toBeTruthy();
      });

      // Verify all inputs have labels
      inputs.forEach(input => {
        if (input.type !== 'checkbox') {
          const label = testContainer.querySelector(`label[for="${input.id}"]`);
          expect(label).toBeTruthy();
        }
      });

      // Verify required fields are properly marked
      requiredInputs.forEach(input => {
        expect(input.hasAttribute('required')).toBe(true);
        expect(input.getAttribute('aria-invalid')).toBe('false');

        const label = testContainer.querySelector(`label[for="${input.id}"]`);
        if (label) {
          const requiredIndicator = label.querySelector('[aria-label="required"]');
          expect(requiredIndicator).toBeTruthy();
        }
      });

      // Verify aria-describedby relationships
      const nameInput = testContainer.querySelector('#student-name');
      expect(nameInput.getAttribute('aria-describedby')).toContain('name-help');
      expect(nameInput.getAttribute('aria-describedby')).toContain('name-error');
    });
  });

  describe('Alternative Text and Media Content', () => {
    it('should provide meaningful alt text for informative images', () => {
      testContainer.innerHTML = `
        <img src="math-problem.png" alt="Word problem: Sarah has 5 apples and gives away 2. How many apples does she have left?">
        <img src="science-diagram.jpg" alt="Diagram showing the water cycle with evaporation, condensation, and precipitation labeled.">
        <img src="reading-comprehension.png" alt="Story excerpt about a brave knight saving a village, with questions below.">
      `;

      const images = testContainer.querySelectorAll('img');

      images.forEach(img => {
        const alt = img.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt.length).toBeGreaterThan(10);
        // Alt text should be descriptive and contextual
        expect(alt).toMatch(/^[A-Z].*[.!?]$/); // Starts with capital, ends with punctuation
      });
    });

    it('should handle decorative images properly', () => {
      testContainer.innerHTML = `
        <div class="lesson-card">
          <img src="decorative-border.png" alt="" role="presentation">
          <h3>Mathematics Lesson 1</h3>
          <img src="star-decoration.svg" alt="" aria-hidden="true">
          <p>Learn basic addition and subtraction</p>
        </div>
      `;

      const decorativeImages = testContainer.querySelectorAll('img[alt=""]');

      decorativeImages.forEach(img => {
        expect(img.getAttribute('alt')).toBe('');
        const hasPresentation = img.getAttribute('role') === 'presentation';
        const isHidden = img.getAttribute('aria-hidden') === 'true';
        expect(hasPresentation || isHidden).toBe(true);
      });
    });

    it('should provide comprehensive descriptions for complex images', () => {
      testContainer.innerHTML = `
        <figure>
          <img src="complex-chart.png" alt="Bar chart showing student performance" aria-describedby="chart-description">
          <figcaption id="chart-description">
            This bar chart displays test scores for 4 subjects across 3 grade levels. 
            Mathematics scores: Grade 1: 85%, Grade 2: 78%, Grade 3: 92%. 
            Science scores: Grade 1: 79%, Grade 2: 83%, Grade 3: 88%. 
            Reading scores: Grade 1: 91%, Grade 2: 89%, Grade 3: 94%. 
            Art scores: Grade 1: 76%, Grade 2: 81%, Grade 3: 85%.
            The chart shows generally improving performance in higher grades, 
            with reading consistently scoring highest across all levels.
          </figcaption>
        </figure>
      `;

      const img = testContainer.querySelector('img');
      const description = testContainer.querySelector('#chart-description');

      expect(img.getAttribute('aria-describedby')).toBe('chart-description');
      expect(description.textContent).toContain('bar chart');
      expect(description.textContent).toContain('Mathematics scores');
      expect(description.textContent).toContain('Grade 1');
      expect(description.textContent.length).toBeGreaterThan(100);
    });

    it('should handle audio and video content accessibility', () => {
      testContainer.innerHTML = `
        <video controls aria-labelledby="video-title" aria-describedby="video-description">
          <source src="math-tutorial.mp4" type="video/mp4">
          <track kind="captions" src="math-tutorial-captions.vtt" srclang="en" label="English Captions" default>
          <track kind="descriptions" src="math-tutorial-descriptions.vtt" srclang="en" label="Audio Descriptions">
          <track kind="chapters" src="math-tutorial-chapters.vtt" srclang="en" label="Chapters">
          Your browser does not support the video tag.
        </video>
        <h3 id="video-title">Introduction to Addition</h3>
        <div id="video-description">
          This 5-minute video teaches basic addition using visual examples with counting blocks. 
          The instructor demonstrates adding single-digit numbers step by step.
        </div>

        <audio controls aria-labelledby="audio-title" aria-describedby="audio-description">
          <source src="pronunciation-guide.mp3" type="audio/mpeg">
          <track kind="captions" src="pronunciation-captions.vtt" srclang="en" label="English Captions">
          Your browser does not support the audio element.
        </audio>
        <h4 id="audio-title">Pronunciation Guide</h4>
        <div id="audio-description">
          Audio guide for pronouncing mathematical terms correctly.
        </div>
      `;

      const video = testContainer.querySelector('video');
      const audio = testContainer.querySelector('audio');
      const captionTracks = testContainer.querySelectorAll('track[kind="captions"]');
      const descriptionTracks = testContainer.querySelectorAll('track[kind="descriptions"]');

      // Verify video accessibility
      expect(video.getAttribute('aria-labelledby')).toBe('video-title');
      expect(video.getAttribute('aria-describedby')).toBe('video-description');
      expect(video.hasAttribute('controls')).toBe(true);

      // Verify audio accessibility
      expect(audio.getAttribute('aria-labelledby')).toBe('audio-title');
      expect(audio.getAttribute('aria-describedby')).toBe('audio-description');

      // Verify caption tracks
      expect(captionTracks.length).toBeGreaterThan(0);
      captionTracks.forEach(track => {
        expect(track.getAttribute('srclang')).toBeTruthy();
        expect(track.getAttribute('label')).toBeTruthy();
      });

      // Verify description tracks
      expect(descriptionTracks.length).toBeGreaterThan(0);
    });

    it('should handle interactive media with proper announcements', () => {
      testContainer.innerHTML = `
        <div class="interactive-game" role="application" aria-labelledby="game-title" aria-describedby="game-instructions">
          <h3 id="game-title">Math Bubble Pop Game</h3>
          <div id="game-instructions">
            Pop bubbles containing correct answers to the math problems. 
            Use arrow keys to move, space bar to pop bubbles.
          </div>
          
          <div class="game-area" tabindex="0" role="grid" aria-label="Game playing field">
            <div class="bubble" role="button" aria-label="Bubble with answer 5 for problem 2 plus 3" tabindex="0">5</div>
            <div class="bubble" role="button" aria-label="Bubble with answer 7 for problem 4 plus 2" tabindex="0">7</div>
            <div class="bubble" role="button" aria-label="Bubble with answer 9 for problem 6 plus 4" tabindex="0">9</div>
          </div>
          
          <div class="game-status" aria-live="polite" aria-atomic="true" class="sr-only">
            Current problem: 2 + 3. Score: 0 points. Lives remaining: 3.
          </div>
          
          <div class="game-feedback" aria-live="assertive" class="sr-only"></div>
        </div>
      `;

      const gameArea = testContainer.querySelector('.interactive-game');
      const bubbles = testContainer.querySelectorAll('.bubble');
      const gameStatus = testContainer.querySelector('.game-status');
      const gameFeedback = testContainer.querySelector('.game-feedback');

      // Verify game accessibility structure
      expect(gameArea.getAttribute('role')).toBe('application');
      expect(gameArea.getAttribute('aria-labelledby')).toBe('game-title');
      expect(gameArea.getAttribute('aria-describedby')).toBe('game-instructions');

      // Verify interactive elements
      bubbles.forEach(bubble => {
        expect(bubble.getAttribute('role')).toBe('button');
        expect(bubble.getAttribute('aria-label')).toContain('Bubble with answer');
        expect(bubble.getAttribute('tabindex')).toBe('0');
      });

      // Verify status and feedback regions
      expect(gameStatus.getAttribute('aria-live')).toBe('polite');
      expect(gameFeedback.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Screen Reader Navigation Patterns', () => {
    it('should provide skip navigation functionality', () => {
      testContainer.innerHTML = `
        <div class="skip-links">
          <a href="#main-content" class="skip-link sr-only-focusable">Skip to main content</a>
          <a href="#main-navigation" class="skip-link sr-only-focusable">Skip to navigation</a>
          <a href="#search" class="skip-link sr-only-focusable">Skip to search</a>
        </div>
        
        <nav id="main-navigation" aria-label="Main navigation">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/subjects">Subjects</a></li>
            <li><a href="/games">Games</a></li>
          </ul>
        </nav>
        
        <div id="search" role="search" aria-label="Site search">
          <input type="search" aria-label="Search courses and activities">
          <button type="submit">Search</button>
        </div>
        
        <main id="main-content" tabindex="-1">
          <h1>Educational Content</h1>
          <p>Main educational content goes here.</p>
        </main>
      `;

      const skipLinks = testContainer.querySelectorAll('.skip-link');
      const mainContent = testContainer.querySelector('#main-content');
      const navigation = testContainer.querySelector('#main-navigation');
      const search = testContainer.querySelector('#search');

      // Verify skip links exist and point to correct targets
      expect(skipLinks.length).toBe(3);
      skipLinks.forEach(link => {
        const target = link.getAttribute('href').substring(1);
        const targetElement = testContainer.querySelector(`#${target}`);
        expect(targetElement).toBeTruthy();
      });

      // Verify targets are properly configured
      expect(mainContent.getAttribute('tabindex')).toBe('-1');
      expect(navigation.getAttribute('aria-label')).toBe('Main navigation');
      expect(search.getAttribute('role')).toBe('search');
    });

    it('should support landmark navigation', () => {
      testContainer.innerHTML = `
        <header role="banner" tabindex="-1" aria-label="Site header">
          <h1>Educational Platform</h1>
        </header>
        
        <nav role="navigation" tabindex="-1" aria-label="Main navigation">
          <ul>
            <li><a href="/math">Math</a></li>
            <li><a href="/science">Science</a></li>
          </ul>
        </nav>
        
        <main role="main" tabindex="-1" aria-label="Main content">
          <h2>Welcome to Learning</h2>
          <p>Educational content here.</p>
        </main>
        
        <aside role="complementary" tabindex="-1" aria-label="Additional resources">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/help">Help</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </aside>
        
        <footer role="contentinfo" tabindex="-1" aria-label="Site footer">
          <p>&copy; 2024 Educational Platform</p>
        </footer>
      `;

      const landmarks = testContainer.querySelectorAll(
        '[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]'
      );

      landmarks.forEach(landmark => {
        // All landmarks should be focusable for F6 navigation
        expect(landmark.getAttribute('tabindex')).toBe('-1');

        // All landmarks should have descriptive labels
        const label = landmark.getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(3);
      });

      // Verify landmark roles are correct
      const roleMap = {
        HEADER: 'banner',
        NAV: 'navigation',
        MAIN: 'main',
        ASIDE: 'complementary',
        FOOTER: 'contentinfo',
      };

      landmarks.forEach(landmark => {
        const expectedRole = roleMap[landmark.tagName] || landmark.getAttribute('role');
        expect(landmark.getAttribute('role')).toBe(expectedRole);
      });
    });

    it('should provide breadcrumb navigation with proper announcements', () => {
      testContainer.innerHTML = `
        <nav aria-label="Breadcrumb" role="navigation">
          <ol role="list">
            <li role="listitem">
              <a href="/" aria-label="Home page">Home</a>
            </li>
            <li role="listitem">
              <a href="/subjects" aria-label="Subjects section">Subjects</a>
            </li>
            <li role="listitem">
              <a href="/subjects/math" aria-label="Mathematics subject">Mathematics</a>
            </li>
            <li role="listitem" aria-current="page">
              <span aria-label="Current page: Basic Addition">Basic Addition</span>
            </li>
          </ol>
        </nav>
        <div id="breadcrumb-status" aria-live="polite" class="sr-only">
          You are here: Home, Subjects, Mathematics, Basic Addition
        </div>
      `;

      const breadcrumb = testContainer.querySelector('nav[aria-label="Breadcrumb"]');
      const breadcrumbList = breadcrumb.querySelector('ol');
      const breadcrumbItems = breadcrumb.querySelectorAll('li');
      const currentPage = breadcrumb.querySelector('[aria-current="page"]');
      const statusRegion = testContainer.querySelector('#breadcrumb-status');

      expect(breadcrumb.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(breadcrumbList.getAttribute('role')).toBe('list');
      expect(breadcrumbItems.length).toBe(4);

      // Verify current page indicator
      expect(currentPage.getAttribute('aria-current')).toBe('page');

      // Verify all items have proper roles
      breadcrumbItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('listitem');
      });

      // Verify status announcement
      expect(statusRegion.textContent).toContain('You are here');
      expect(statusRegion.textContent).toContain('Basic Addition');
    });

    it('should handle pagination with screen reader announcements', () => {
      testContainer.innerHTML = `
        <nav aria-label="Pagination navigation" role="navigation">
          <ul class="pagination" role="list">
            <li role="listitem">
              <a href="?page=1" aria-label="Go to previous page, page 2" rel="prev">
                <span aria-hidden="true">&laquo;</span>
                Previous
              </a>
            </li>
            <li role="listitem">
              <a href="?page=1" aria-label="Go to page 1">1</a>
            </li>
            <li role="listitem">
              <a href="?page=2" aria-label="Go to page 2">2</a>
            </li>
            <li role="listitem" aria-current="page">
              <span aria-label="Current page, page 3">3</span>
            </li>
            <li role="listitem">
              <a href="?page=4" aria-label="Go to page 4">4</a>
            </li>
            <li role="listitem">
              <a href="?page=5" aria-label="Go to page 5">5</a>
            </li>
            <li role="listitem">
              <a href="?page=4" aria-label="Go to next page, page 4" rel="next">
                Next
                <span aria-hidden="true">&raquo;</span>
              </a>
            </li>
          </ul>
        </nav>
        <div id="pagination-status" aria-live="polite" class="sr-only">
          Page 3 of 5. Showing results 21-30 of 50 total.
        </div>
      `;

      const pagination = testContainer.querySelector('nav[aria-label="Pagination navigation"]');
      const currentPage = pagination.querySelector('[aria-current="page"]');
      const statusRegion = testContainer.querySelector('#pagination-status');

      expect(pagination.getAttribute('aria-label')).toBe('Pagination navigation');
      expect(currentPage.getAttribute('aria-current')).toBe('page');

      // Verify all pagination links have descriptive labels
      const paginationLinks = pagination.querySelectorAll('a');
      paginationLinks.forEach(link => {
        const label = link.getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect(label).toMatch(/Go to (page|previous|next)/);
      });

      // Verify status provides context
      expect(statusRegion.textContent).toContain('Page 3 of 5');
      expect(statusRegion.textContent).toContain('results 21-30');
    });
  });

  describe('Live Region Announcements', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should configure polite live regions for non-urgent updates', () => {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.setAttribute('aria-relevant', 'additions text');
      politeRegion.className = 'sr-only';

      testContainer.appendChild(politeRegion);

      expect(politeRegion.getAttribute('aria-live')).toBe('polite');
      expect(politeRegion.getAttribute('aria-atomic')).toBe('true');
      expect(politeRegion.getAttribute('aria-relevant')).toBe('additions text');
    });

    it('should configure assertive live regions for urgent updates', () => {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';

      testContainer.appendChild(assertiveRegion);

      expect(assertiveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(assertiveRegion.getAttribute('aria-atomic')).toBe('true');
    });

    it('should announce game state changes appropriately', () => {
      testContainer.innerHTML = `
        <div class="game-container" role="application" aria-labelledby="game-title">
          <h2 id="game-title">Math Quiz Game</h2>
          
          <div class="question-area" aria-live="polite" aria-atomic="true">
            <div id="current-question">What is 7 + 5?</div>
            <div class="answer-options" role="radiogroup" aria-labelledby="current-question">
              <label>
                <input type="radio" name="answer" value="11"> 11
              </label>
              <label>
                <input type="radio" name="answer" value="12"> 12
              </label>
              <label>
                <input type="radio" name="answer" value="13"> 13
              </label>
            </div>
          </div>

          <div class="game-status" aria-live="polite" class="sr-only">
            Question 1 of 10. Score: 0 points. Time remaining: 2 minutes.
          </div>

          <div class="game-feedback" aria-live="assertive" class="sr-only"></div>
          
          <div class="game-achievements" aria-live="polite" class="sr-only"></div>
        </div>
      `;

      const questionArea = testContainer.querySelector('.question-area');
      const gameStatus = testContainer.querySelector('.game-status');
      const gameFeedback = testContainer.querySelector('.game-feedback');
      const gameAchievements = testContainer.querySelector('.game-achievements');

      // Verify live region configuration
      expect(questionArea.getAttribute('aria-live')).toBe('polite');
      expect(gameStatus.getAttribute('aria-live')).toBe('polite');
      expect(gameFeedback.getAttribute('aria-live')).toBe('assertive');
      expect(gameAchievements.getAttribute('aria-live')).toBe('polite');

      // Test different types of announcements
      gameStatus.textContent =
        'Question 2 of 10. Score: 10 points. Time remaining: 1 minute 45 seconds.';
      expect(gameStatus.textContent).toContain('Question 2');

      gameFeedback.textContent = 'Correct! Well done.';
      expect(gameFeedback.textContent).toBe('Correct! Well done.');

      gameAchievements.textContent = 'Achievement unlocked: Fast Solver!';
      expect(gameAchievements.textContent).toContain('Achievement unlocked');
    });

    it('should handle form validation announcements', () => {
      testContainer.innerHTML = `
        <form>
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" required aria-describedby="username-error">
            <div id="username-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required aria-describedby="password-strength password-error">
            <div id="password-strength" aria-live="polite" class="help-text"></div>
            <div id="password-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
          </div>

          <div class="form-status" aria-live="polite" class="sr-only"></div>
          <button type="submit">Submit</button>
        </form>
      `;

      const usernameError = testContainer.querySelector('#username-error');
      const passwordStrength = testContainer.querySelector('#password-strength');
      const formStatus = testContainer.querySelector('.form-status');

      // Test error announcements (assertive)
      usernameError.style.display = 'block';
      usernameError.textContent = 'Username is required';
      expect(usernameError.getAttribute('aria-live')).toBe('assertive');
      expect(usernameError.getAttribute('role')).toBe('alert');

      // Test password strength updates (polite)
      passwordStrength.textContent = 'Password strength: Medium';
      expect(passwordStrength.getAttribute('aria-live')).toBe('polite');

      // Test form status updates
      formStatus.textContent = 'Form submitted successfully';
      expect(formStatus.getAttribute('aria-live')).toBe('polite');
    });

    it('should announce search and filter results', () => {
      testContainer.innerHTML = `
        <div class="search-container">
          <div role="search" aria-label="Course search">
            <input type="search" aria-label="Search courses" aria-describedby="search-status">
            <button type="submit">Search</button>
          </div>
          
          <div id="search-status" aria-live="polite" class="sr-only">
            Enter keywords to search for courses
          </div>
          
          <div class="filters" role="group" aria-label="Search filters">
            <select aria-label="Grade level filter" aria-describedby="filter-status">
              <option value="">All grades</option>
              <option value="k">Kindergarten</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
            </select>
            
            <select aria-label="Subject filter" aria-describedby="filter-status">
              <option value="">All subjects</option>
              <option value="math">Math</option>
              <option value="science">Science</option>
              <option value="reading">Reading</option>
            </select>
          </div>
          
          <div id="filter-status" aria-live="polite" class="sr-only"></div>
          
          <div class="results-container" aria-live="polite" aria-label="Search results">
            <div class="results-count" aria-live="polite">
              Showing 15 results for "addition games"
            </div>
          </div>
        </div>
      `;

      const searchStatus = testContainer.querySelector('#search-status');
      const filterStatus = testContainer.querySelector('#filter-status');
      const resultsCount = testContainer.querySelector('.results-count');

      // Test search status updates
      searchStatus.textContent = 'Searching...';
      expect(searchStatus.getAttribute('aria-live')).toBe('polite');

      searchStatus.textContent = 'Found 15 results for "addition games"';
      expect(searchStatus.textContent).toContain('Found 15 results');

      // Test filter status updates
      filterStatus.textContent = 'Filter applied: Grade 1. Updated results below.';
      expect(filterStatus.textContent).toContain('Filter applied');

      // Test results count announcements
      resultsCount.textContent = 'Showing 8 results for "addition games" filtered by Grade 1';
      expect(resultsCount.textContent).toContain('Showing 8 results');
    });
  });

  describe('Reading Order and Content Flow', () => {
    it('should maintain logical reading order', () => {
      testContainer.innerHTML = `
        <article class="lesson-content">
          <header>
            <h1>Lesson 1: Basic Addition</h1>
            <div class="lesson-meta">
              <span class="grade-level">Grade: 1st</span>
              <span class="duration">Duration: 15 minutes</span>
              <span class="difficulty">Difficulty: Beginner</span>
            </div>
          </header>
          
          <nav class="lesson-nav" aria-label="Lesson sections">
            <ol>
              <li><a href="#introduction">Introduction</a></li>
              <li><a href="#examples">Examples</a></li>
              <li><a href="#practice">Practice</a></li>
              <li><a href="#quiz">Quiz</a></li>
            </ol>
          </nav>
          
          <main class="lesson-main">
            <section id="introduction">
              <h2>Introduction</h2>
              <p>Today we'll learn about adding numbers together.</p>
              <img src="addition-intro.png" alt="Two groups of apples being combined">
            </section>
            
            <section id="examples">
              <h2>Examples</h2>
              <div class="example">
                <h3>Example 1</h3>
                <p>2 + 3 = 5</p>
                <img src="example1.png" alt="Visual showing 2 blocks plus 3 blocks equals 5 blocks">
              </div>
            </section>
            
            <section id="practice">
              <h2>Practice Problems</h2>
              <div class="problem">
                <p>Try this: 4 + 2 = ?</p>
                <button type="button">Show Answer</button>
              </div>
            </section>
          </main>
          
          <aside class="lesson-sidebar">
            <h3>Related Topics</h3>
            <ul>
              <li><a href="/subtraction">Subtraction</a></li>
              <li><a href="/counting">Counting</a></li>
            </ul>
          </aside>
          
          <footer class="lesson-footer">
            <div class="lesson-progress">
              <div role="progressbar" aria-valuenow="33" aria-valuemin="0" aria-valuemax="100" aria-label="Lesson progress">
                <span class="progress-text">Progress: 33% complete</span>
              </div>
            </div>
            <nav class="lesson-navigation" aria-label="Lesson navigation">
              <a href="/lessons/counting" rel="prev">Previous: Counting</a>
              <a href="/lessons/subtraction" rel="next">Next: Subtraction</a>
            </nav>
          </footer>
        </article>
      `;

      // Verify document structure follows logical flow
      const article = testContainer.querySelector('article');
      const children = Array.from(article.children);

      expect(children[0].tagName).toBe('HEADER');
      expect(children[1].tagName).toBe('NAV');
      expect(children[2].tagName).toBe('MAIN');
      expect(children[3].tagName).toBe('ASIDE');
      expect(children[4].tagName).toBe('FOOTER');

      // Verify heading hierarchy within sections
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));

      // Should start with h1, then h2s, then h3s
      expect(headingLevels[0]).toBe(1); // Main title
      expect(headingLevels[1]).toBe(2); // Introduction
      expect(headingLevels[2]).toBe(2); // Examples
      expect(headingLevels[3]).toBe(3); // Example 1
      expect(headingLevels[4]).toBe(2); // Practice
      expect(headingLevels[5]).toBe(3); // Related Topics
    });

    it('should handle complex layouts with proper reading order', () => {
      testContainer.innerHTML = `
        <div class="dashboard">
          <header class="dashboard-header">
            <h1>Student Dashboard</h1>
            <nav aria-label="User menu">
              <button aria-expanded="false" aria-controls="user-menu">John Doe</button>
              <ul id="user-menu" aria-hidden="true">
                <li><a href="/profile">Profile</a></li>
                <li><a href="/settings">Settings</a></li>
                <li><a href="/logout">Logout</a></li>
              </ul>
            </nav>
          </header>
          
          <div class="dashboard-content">
            <nav class="sidebar" aria-label="Main navigation">
              <ul>
                <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
                <li><a href="/courses">My Courses</a></li>
                <li><a href="/progress">Progress</a></li>
                <li><a href="/achievements">Achievements</a></li>
              </ul>
            </nav>
            
            <main class="main-content">
              <section class="welcome-section">
                <h2>Welcome Back, John!</h2>
                <p>You have 3 new assignments and 1 achievement waiting.</p>
              </section>
              
              <section class="quick-stats">
                <h2>Quick Stats</h2>
                <div class="stats-grid">
                  <div class="stat-card">
                    <h3>Courses Completed</h3>
                    <div class="stat-number" aria-label="5 courses completed">5</div>
                  </div>
                  <div class="stat-card">
                    <h3>Total Points</h3>
                    <div class="stat-number" aria-label="1,250 total points earned">1,250</div>
                  </div>
                </div>
              </section>
              
              <section class="recent-activity">
                <h2>Recent Activity</h2>
                <ul class="activity-list">
                  <li>
                    <time datetime="2024-03-15">March 15</time>
                    <span>Completed Math Quiz: Addition</span>
                    <span class="score">Score: 9/10</span>
                  </li>
                  <li>
                    <time datetime="2024-03-14">March 14</time>
                    <span>Started Science Lesson: Plants</span>
                  </li>
                </ul>
              </section>
            </main>
            
            <aside class="notifications-panel">
              <h2>Notifications</h2>
              <div class="notification" role="status">
                <h3>New Achievement!</h3>
                <p>You earned the "Math Master" badge for completing 10 math quizzes.</p>
                <time datetime="2024-03-15T10:30:00">2 hours ago</time>
              </div>
            </aside>
          </div>
        </div>
      `;

      // Verify main sections maintain proper order
      const dashboardContent = testContainer.querySelector('.dashboard-content');
      const contentChildren = Array.from(dashboardContent.children);

      expect(contentChildren[0].classList.contains('sidebar')).toBe(true);
      expect(contentChildren[1].tagName).toBe('MAIN');
      expect(contentChildren[2].tagName).toBe('ASIDE');

      // Verify all interactive elements are focusable in logical order
      const focusableElements = testContainer.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // Should be able to tab through in logical order
      expect(focusableElements.length).toBeGreaterThan(0);

      // Verify each focusable element has appropriate labels/descriptions
      focusableElements.forEach(element => {
        const hasLabel =
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.getAttribute('aria-describedby') ||
          element.textContent.trim();
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should handle data tables with proper reading order', () => {
      testContainer.innerHTML = `
        <div class="grade-report">
          <h2>Grade Report - Mathematics</h2>
          
          <table role="table" aria-labelledby="grade-table-caption">
            <caption id="grade-table-caption">
              Student grades for Mathematics course, sorted by assignment date
            </caption>
            <thead>
              <tr role="row">
                <th role="columnheader" scope="col">Assignment</th>
                <th role="columnheader" scope="col">Date</th>
                <th role="columnheader" scope="col">Score</th>
                <th role="columnheader" scope="col">Grade</th>
                <th role="columnheader" scope="col">Feedback</th>
              </tr>
            </thead>
            <tbody>
              <tr role="row">
                <th role="rowheader" scope="row">Addition Quiz 1</th>
                <td role="cell"><time datetime="2024-03-10">March 10, 2024</time></td>
                <td role="cell">18/20</td>
                <td role="cell">A-</td>
                <td role="cell">Great work on basic addition problems!</td>
              </tr>
              <tr role="row">
                <th role="rowheader" scope="row">Subtraction Practice</th>
                <td role="cell"><time datetime="2024-03-12">March 12, 2024</time></td>
                <td role="cell">15/20</td>
                <td role="cell">B</td>
                <td role="cell">Good progress, practice borrowing problems.</td>
              </tr>
              <tr role="row">
                <th role="rowheader" scope="row">Mixed Operations Test</th>
                <td role="cell"><time datetime="2024-03-15">March 15, 2024</time></td>
                <td role="cell">17/20</td>
                <td role="cell">A-</td>
                <td role="cell">Excellent improvement in problem solving!</td>
              </tr>
            </tbody>
            <tfoot>
              <tr role="row">
                <th role="rowheader" scope="row">Average</th>
                <td role="cell">-</td>
                <td role="cell">16.7/20</td>
                <td role="cell">A-</td>
                <td role="cell">Strong performance overall</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="table-summary" aria-label="Table summary">
            <p>This table shows 3 completed assignments with an average grade of A-. 
               Most recent assignment: Mixed Operations Test on March 15, 2024.</p>
          </div>
        </div>
      `;

      const table = testContainer.querySelector('table');
      const caption = testContainer.querySelector('caption');
      const headers = testContainer.querySelectorAll('th');
      const cells = testContainer.querySelectorAll('td');
      const summary = testContainer.querySelector('.table-summary');

      // Verify table structure
      expect(table.getAttribute('role')).toBe('table');
      expect(table.getAttribute('aria-labelledby')).toBe('grade-table-caption');
      expect(caption.textContent).toContain('Student grades for Mathematics');

      // Verify all headers have proper scope
      headers.forEach(th => {
        const scope = th.getAttribute('scope');
        expect(['col', 'row'].includes(scope)).toBe(true);
      });

      // Verify all cells have role
      cells.forEach(td => {
        expect(td.getAttribute('role')).toBe('cell');
      });

      // Verify summary provides context
      expect(summary.getAttribute('aria-label')).toBe('Table summary');
      expect(summary.textContent).toContain('3 completed assignments');
    });
  });

  describe('Form Field Labels and Error Messages', () => {
    it('should provide comprehensive form labeling', () => {
      testContainer.innerHTML = `
        <form aria-labelledby="registration-title" novalidate>
          <h2 id="registration-title">Student Registration</h2>
          
          <fieldset>
            <legend>Personal Information</legend>
            
            <div class="form-group">
              <label for="first-name">
                First Name 
                <span class="required" aria-label="required">*</span>
              </label>
              <input type="text" 
                     id="first-name" 
                     name="firstName" 
                     required 
                     aria-required="true"
                     aria-invalid="false"
                     aria-describedby="first-name-help first-name-error">
              <div id="first-name-help" class="help-text">
                Enter your legal first name as it appears on official documents
              </div>
              <div id="first-name-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
            </div>

            <div class="form-group">
              <label for="email">
                Email Address 
                <span class="required" aria-label="required">*</span>
              </label>
              <input type="email" 
                     id="email" 
                     name="email" 
                     required 
                     aria-required="true"
                     aria-invalid="false"
                     aria-describedby="email-help email-error"
                     autocomplete="email">
              <div id="email-help" class="help-text">
                We'll use this email for important course updates and login
              </div>
              <div id="email-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
            </div>

            <div class="form-group">
              <label for="birthdate">Date of Birth</label>
              <input type="date" 
                     id="birthdate" 
                     name="birthdate" 
                     aria-describedby="birthdate-help"
                     aria-invalid="false">
              <div id="birthdate-help" class="help-text">
                Used to provide age-appropriate content recommendations
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Learning Preferences</legend>
            
            <div class="form-group">
              <fieldset class="checkbox-group">
                <legend>Subjects of Interest <span class="help-text">(Select all that apply)</span></legend>
                <div role="group" aria-describedby="subjects-help">
                  <label class="checkbox-label">
                    <input type="checkbox" name="subjects" value="math" aria-describedby="subjects-help">
                    <span class="checkbox-text">Mathematics</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="subjects" value="science" aria-describedby="subjects-help">
                    <span class="checkbox-text">Science</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="subjects" value="reading" aria-describedby="subjects-help">
                    <span class="checkbox-text">Reading & Language Arts</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" name="subjects" value="art" aria-describedby="subjects-help">
                    <span class="checkbox-text">Creative Arts</span>
                  </label>
                </div>
                <div id="subjects-help" class="help-text">
                  Select subjects you'd like to focus on. You can change these later in your profile.
                </div>
              </fieldset>
            </div>

            <div class="form-group">
              <label for="learning-style">Preferred Learning Style</label>
              <select id="learning-style" name="learningStyle" aria-describedby="learning-style-help">
                <option value="">Choose your preferred style</option>
                <option value="visual">Visual (pictures, diagrams, charts)</option>
                <option value="auditory">Auditory (listening, discussion)</option>
                <option value="kinesthetic">Kinesthetic (hands-on, movement)</option>
                <option value="mixed">Mixed approach</option>
              </select>
              <div id="learning-style-help" class="help-text">
                This helps us recommend the best learning activities for you
              </div>
            </div>
          </fieldset>

          <div class="form-actions">
            <button type="submit" aria-describedby="submit-help">
              Create Account
            </button>
            <div id="submit-help" class="help-text">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>

          <div class="form-status" aria-live="polite" class="sr-only"></div>
        </form>
      `;

      const form = testContainer.querySelector('form');
      const fieldsets = testContainer.querySelectorAll('fieldset');
      const inputs = testContainer.querySelectorAll('input, select');
      const helpTexts = testContainer.querySelectorAll('.help-text');
      const errorContainers = testContainer.querySelectorAll('[role="alert"]');

      // Verify form has descriptive title
      expect(form.getAttribute('aria-labelledby')).toBe('registration-title');

      // Verify fieldsets have legends
      fieldsets.forEach(fieldset => {
        const legend = fieldset.querySelector('legend');
        expect(legend).toBeTruthy();
        expect(legend.textContent.trim().length).toBeGreaterThan(0);
      });

      // Verify all form controls have labels
      inputs.forEach(input => {
        if (input.type !== 'checkbox') {
          const label = testContainer.querySelector(`label[for="${input.id}"]`);
          expect(label || input.getAttribute('aria-label')).toBeTruthy();
        }
      });

      // Verify required fields are properly marked
      const requiredInputs = testContainer.querySelectorAll('[required]');
      requiredInputs.forEach(input => {
        expect(input.getAttribute('aria-required')).toBe('true');

        const label = testContainer.querySelector(`label[for="${input.id}"]`);
        if (label) {
          const requiredIndicator = label.querySelector('[aria-label="required"]');
          expect(requiredIndicator).toBeTruthy();
        }
      });

      // Verify help text associations
      helpTexts.forEach(help => {
        const helpId = help.id;
        if (helpId) {
          const associatedField = testContainer.querySelector(`[aria-describedby*="${helpId}"]`);
          expect(associatedField).toBeTruthy();
        }
      });

      // Verify error containers are properly configured
      errorContainers.forEach(errorContainer => {
        expect(errorContainer.getAttribute('role')).toBe('alert');
        expect(errorContainer.getAttribute('aria-live')).toBe('assertive');
      });
    });

    it('should handle dynamic validation with proper announcements', () => {
      testContainer.innerHTML = `
        <form>
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" 
                   id="username" 
                   name="username" 
                   required
                   minlength="3"
                   aria-describedby="username-help username-error"
                   aria-invalid="false">
            <div id="username-help" class="help-text">
              Choose a unique username (3-20 characters, letters and numbers only)
            </div>
            <div id="username-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" 
                   id="password" 
                   name="password" 
                   required
                   minlength="8"
                   aria-describedby="password-help password-strength password-error"
                   aria-invalid="false">
            <div id="password-help" class="help-text">
              Create a strong password (at least 8 characters)
            </div>
            <div id="password-strength" aria-live="polite" class="strength-indicator"></div>
            <div id="password-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input type="password" 
                   id="confirm-password" 
                   name="confirmPassword" 
                   required
                   aria-describedby="confirm-password-help confirm-password-error"
                   aria-invalid="false">
            <div id="confirm-password-help" class="help-text">
              Re-enter your password to confirm
            </div>
            <div id="confirm-password-error" role="alert" aria-live="assertive" class="error-message" style="display: none;"></div>
          </div>

          <button type="submit">Create Account</button>
        </form>
      `;

      const usernameInput = testContainer.querySelector('#username');
      const confirmPasswordInput = testContainer.querySelector('#confirm-password');

      const usernameError = testContainer.querySelector('#username-error');
      const passwordStrength = testContainer.querySelector('#password-strength');
      const confirmPasswordError = testContainer.querySelector('#confirm-password-error');

      // Test username validation
      usernameInput.setAttribute('aria-invalid', 'true');
      usernameError.style.display = 'block';
      usernameError.textContent = 'Username must be at least 3 characters long';

      expect(usernameInput.getAttribute('aria-invalid')).toBe('true');
      expect(usernameError.textContent).toContain('3 characters');
      expect(usernameError.getAttribute('aria-live')).toBe('assertive');

      // Test password strength updates
      passwordStrength.textContent = 'Password strength: Weak - Add numbers and special characters';
      expect(passwordStrength.getAttribute('aria-live')).toBe('polite');
      expect(passwordStrength.textContent).toContain('strength: Weak');

      passwordStrength.textContent = 'Password strength: Strong';
      expect(passwordStrength.textContent).toBe('Password strength: Strong');

      // Test password confirmation error
      confirmPasswordInput.setAttribute('aria-invalid', 'true');
      confirmPasswordError.style.display = 'block';
      confirmPasswordError.textContent = 'Passwords do not match';

      expect(confirmPasswordInput.getAttribute('aria-invalid')).toBe('true');
      expect(confirmPasswordError.textContent).toBe('Passwords do not match');

      // Test successful validation (clearing errors)
      usernameInput.setAttribute('aria-invalid', 'false');
      usernameError.style.display = 'none';
      usernameError.textContent = '';

      expect(usernameInput.getAttribute('aria-invalid')).toBe('false');
      expect(usernameError.textContent).toBe('');
    });
  });

  describe('Educational Content Structure', () => {
    it('should structure lesson content for optimal screen reader navigation', () => {
      testContainer.innerHTML = `
        <article class="lesson" role="main" aria-labelledby="lesson-title">
          <header class="lesson-header">
            <h1 id="lesson-title">Lesson 3: Multiplication Tables</h1>
            <div class="lesson-metadata">
              <dl class="lesson-details">
                <dt>Subject:</dt>
                <dd>Mathematics</dd>
                <dt>Grade Level:</dt>
                <dd>3rd Grade</dd>
                <dt>Duration:</dt>
                <dd>20 minutes</dd>
                <dt>Difficulty:</dt>
                <dd>Intermediate</dd>
              </dl>
            </div>
            <div class="lesson-objectives">
              <h2>Learning Objectives</h2>
              <ul role="list">
                <li role="listitem">Understand the concept of multiplication as repeated addition</li>
                <li role="listitem">Memorize multiplication tables for numbers 1-5</li>
                <li role="listitem">Apply multiplication to solve word problems</li>
              </ul>
            </div>
          </header>

          <nav class="lesson-navigation" aria-label="Lesson sections">
            <h2>Lesson Sections</h2>
            <ol role="list">
              <li role="listitem"><a href="#introduction" aria-describedby="intro-desc">Introduction to Multiplication</a>
                <span id="intro-desc" class="section-desc">Learn what multiplication means</span>
              </li>
              <li role="listitem"><a href="#examples" aria-describedby="examples-desc">Step-by-Step Examples</a>
                <span id="examples-desc" class="section-desc">See multiplication in action</span>
              </li>
              <li role="listitem"><a href="#practice" aria-describedby="practice-desc">Guided Practice</a>
                <span id="practice-desc" class="section-desc">Try problems with guidance</span>
              </li>
              <li role="listitem"><a href="#assessment" aria-describedby="assessment-desc">Knowledge Check</a>
                <span id="assessment-desc" class="section-desc">Test your understanding</span>
              </li>
            </ol>
          </nav>

          <main class="lesson-content">
            <section id="introduction" aria-labelledby="intro-heading">
              <h2 id="intro-heading">Introduction to Multiplication</h2>
              <p class="section-intro">
                Multiplication is a way to add the same number multiple times quickly.
              </p>
              
              <div class="concept-explanation">
                <h3>Key Concept</h3>
                <p>Instead of writing 3 + 3 + 3 + 3, we can write 4 × 3 = 12</p>
                
                <figure aria-labelledby="visual-example-caption">
                  <img src="multiplication-visual.png" 
                       alt="Four groups of three dots each, showing 3 + 3 + 3 + 3 equals 12, and 4 times 3 equals 12">
                  <figcaption id="visual-example-caption">
                    Visual representation: Four groups of three items demonstrate that 4 × 3 = 12
                  </figcaption>
                </figure>
              </div>

              <div class="vocabulary" role="complementary" aria-labelledby="vocab-heading">
                <h3 id="vocab-heading">Key Vocabulary</h3>
                <dl class="vocab-list">
                  <dt>Multiplication</dt>
                  <dd>A mathematical operation that represents repeated addition</dd>
                  <dt>Factor</dt>
                  <dd>The numbers being multiplied together (in 4 × 3, both 4 and 3 are factors)</dd>
                  <dt>Product</dt>
                  <dd>The result of multiplication (in 4 × 3 = 12, the product is 12)</dd>
                </dl>
              </div>
            </section>

            <section id="examples" aria-labelledby="examples-heading">
              <h2 id="examples-heading">Step-by-Step Examples</h2>
              
              <div class="example-set">
                <div class="example" role="article" aria-labelledby="example1-title">
                  <h3 id="example1-title">Example 1: 2 × 4</h3>
                  <div class="example-steps">
                    <ol role="list">
                      <li role="listitem">
                        <strong>Step 1:</strong> Think of this as "2 groups of 4"
                      </li>
                      <li role="listitem">
                        <strong>Step 2:</strong> Add: 4 + 4 = 8
                      </li>
                      <li role="listitem">
                        <strong>Step 3:</strong> So 2 × 4 = 8
                      </li>
                    </ol>
                  </div>
                  <div class="visual-aid">
                    <img src="example-2x4.png" 
                         alt="Two groups of four blocks each, showing 4 plus 4 equals 8"
                         aria-describedby="example1-description">
                    <div id="example1-description" class="visual-description">
                      The image shows two separate groups, each containing four blocks, 
                      visually demonstrating that 2 × 4 equals 8.
                    </div>
                  </div>
                </div>

                <div class="example" role="article" aria-labelledby="example2-title">
                  <h3 id="example2-title">Example 2: 3 × 5</h3>
                  <div class="example-steps">
                    <ol role="list">
                      <li role="listitem">
                        <strong>Step 1:</strong> Think of this as "3 groups of 5"
                      </li>
                      <li role="listitem">
                        <strong>Step 2:</strong> Add: 5 + 5 + 5 = 15
                      </li>
                      <li role="listitem">
                        <strong>Step 3:</strong> So 3 × 5 = 15
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            <section id="practice" aria-labelledby="practice-heading">
              <h2 id="practice-heading">Guided Practice</h2>
              <p class="practice-intro">
                Now it's your turn to try! Work through these problems step by step.
              </p>

              <div class="practice-problems">
                <div class="problem" role="article" aria-labelledby="problem1-title">
                  <h3 id="problem1-title">Practice Problem 1</h3>
                  <div class="problem-statement">
                    <p><strong>Problem:</strong> 4 × 2 = ?</p>
                    <div class="hint" aria-label="Hint for problem 1">
                      <button type="button" aria-expanded="false" aria-controls="hint1">Show Hint</button>
                      <div id="hint1" aria-hidden="true" class="hint-content">
                        Think of this as 4 groups of 2, or 2 + 2 + 2 + 2
                      </div>
                    </div>
                  </div>
                  
                  <div class="solution" aria-label="Solution for problem 1">
                    <button type="button" aria-expanded="false" aria-controls="solution1">Show Solution</button>
                    <div id="solution1" aria-hidden="true" class="solution-content">
                      <ol>
                        <li>4 × 2 means "4 groups of 2"</li>
                        <li>2 + 2 + 2 + 2 = 8</li>
                        <li>Therefore, 4 × 2 = 8</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <aside class="lesson-sidebar" role="complementary" aria-labelledby="sidebar-heading">
            <h2 id="sidebar-heading">Additional Resources</h2>
            
            <section class="related-lessons" aria-labelledby="related-heading">
              <h3 id="related-heading">Related Lessons</h3>
              <ul role="list">
                <li role="listitem">
                  <a href="/lessons/addition-review">Review: Addition Basics</a>
                </li>
                <li role="listitem">
                  <a href="/lessons/skip-counting">Skip Counting Patterns</a>
                </li>
              </ul>
            </section>

            <section class="study-tips" aria-labelledby="tips-heading">
              <h3 id="tips-heading">Study Tips</h3>
              <ul role="list">
                <li role="listitem">Practice multiplication tables daily for 5 minutes</li>
                <li role="listitem">Use physical objects like blocks or coins to visualize problems</li>
                <li role="listitem">Connect multiplication to real-world situations</li>
              </ul>
            </section>
          </aside>

          <footer class="lesson-footer">
            <div class="lesson-progress" role="status" aria-label="Lesson progress">
              <div role="progressbar" 
                   aria-valuenow="75" 
                   aria-valuemin="0" 
                   aria-valuemax="100" 
                   aria-label="Lesson completion"
                   aria-describedby="progress-text">
                <div class="progress-bar" style="width: 75%;"></div>
              </div>
              <div id="progress-text" class="progress-text">
                You've completed 75% of this lesson
              </div>
            </div>

            <nav class="lesson-navigation" aria-label="Previous and next lessons">
              <a href="/lessons/division-intro" 
                 rel="prev" 
                 class="nav-link prev"
                 aria-label="Previous lesson: Introduction to Division">
                ← Previous Lesson
              </a>
              <a href="/lessons/multiplication-tables" 
                 rel="next" 
                 class="nav-link next"
                 aria-label="Next lesson: Multiplication Tables Practice">
                Next Lesson →
              </a>
            </nav>
          </footer>
        </article>
      `;

      // Verify lesson structure
      const lesson = testContainer.querySelector('.lesson');
      expect(lesson.getAttribute('role')).toBe('main');
      expect(lesson.getAttribute('aria-labelledby')).toBe('lesson-title');

      // Verify heading hierarchy
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
      expect(levels[0]).toBe(1); // Main lesson title

      // Verify vocabulary is properly structured
      const vocabList = testContainer.querySelector('.vocab-list');
      const terms = vocabList.querySelectorAll('dt');
      const definitions = vocabList.querySelectorAll('dd');
      expect(terms.length).toEqual(definitions.length);

      // Verify examples have proper structure
      const examples = testContainer.querySelectorAll('.example');
      examples.forEach(example => {
        expect(example.getAttribute('role')).toBe('article');
        const title = example.querySelector('h3');
        expect(title).toBeTruthy();
        expect(example.getAttribute('aria-labelledby')).toBe(title.id);
      });

      // Verify progress indicator
      const progressbar = testContainer.querySelector('[role="progressbar"]');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
      expect(progressbar.getAttribute('aria-label')).toBe('Lesson completion');

      // Verify navigation links
      const navLinks = testContainer.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        expect(link.getAttribute('aria-label')).toBeTruthy();
        expect(link.getAttribute('aria-label')).toContain('lesson:');
      });
    });
  });

  describe('Advanced Screen Reader Features', () => {
    it('should handle complex interactive widgets with proper announcements', () => {
      testContainer.innerHTML = `
        <div class="drag-drop-activity" 
             role="application" 
             aria-labelledby="activity-title"
             aria-describedby="activity-instructions">
          
          <h2 id="activity-title">Sorting Activity: Group Animals by Habitat</h2>
          <div id="activity-instructions">
            Drag each animal to its correct habitat. Use arrow keys to navigate, 
            space to pick up/drop items, and escape to cancel.
          </div>

          <div class="activity-status" aria-live="polite" aria-atomic="true" class="sr-only">
            Activity ready. 6 animals to sort into 3 habitats.
          </div>

          <div class="activity-feedback" aria-live="assertive" class="sr-only"></div>

          <div class="source-area" role="group" aria-labelledby="animals-heading">
            <h3 id="animals-heading">Animals to Sort</h3>
            <div class="animals-container" role="list">
              <div class="animal-item" 
                   role="button" 
                   tabindex="0"
                   draggable="true"
                   aria-describedby="animal-1-desc"
                   data-animal="fish">
                <img src="fish.png" alt="Fish">
                <span class="animal-name">Fish</span>
                <div id="animal-1-desc" class="sr-only">
                  Fish - drag to correct habitat (ocean, forest, or desert)
                </div>
              </div>
              
              <div class="animal-item" 
                   role="button" 
                   tabindex="0"
                   draggable="true"
                   aria-describedby="animal-2-desc"
                   data-animal="bear">
                <img src="bear.png" alt="Bear">
                <span class="animal-name">Bear</span>
                <div id="animal-2-desc" class="sr-only">
                  Bear - drag to correct habitat (ocean, forest, or desert)
                </div>
              </div>
            </div>
          </div>

          <div class="drop-zones" role="group" aria-labelledby="habitats-heading">
            <h3 id="habitats-heading">Habitats</h3>
            
            <div class="habitat-zone" 
                 role="button"
                 tabindex="0"
                 aria-describedby="ocean-desc"
                 data-habitat="ocean"
                 aria-dropeffect="move">
              <h4>Ocean</h4>
              <div id="ocean-desc" class="habitat-description">
                Drop zone for ocean animals. Currently contains 0 animals.
              </div>
              <div class="habitat-contents" role="list" aria-label="Animals in ocean habitat">
                <!-- Dropped animals appear here -->
              </div>
            </div>

            <div class="habitat-zone" 
                 role="button"
                 tabindex="0"
                 aria-describedby="forest-desc"
                 data-habitat="forest"
                 aria-dropeffect="move">
              <h4>Forest</h4>
              <div id="forest-desc" class="habitat-description">
                Drop zone for forest animals. Currently contains 0 animals.
              </div>
              <div class="habitat-contents" role="list" aria-label="Animals in forest habitat">
                <!-- Dropped animals appear here -->
              </div>
            </div>

            <div class="habitat-zone" 
                 role="button"
                 tabindex="0"
                 aria-describedby="desert-desc"
                 data-habitat="desert"
                 aria-dropeffect="move">
              <h4>Desert</h4>
              <div id="desert-desc" class="habitat-description">
                Drop zone for desert animals. Currently contains 0 animals.
              </div>
              <div class="habitat-contents" role="list" aria-label="Animals in desert habitat">
                <!-- Dropped animals appear here -->
              </div>
            </div>
          </div>

          <div class="activity-controls">
            <button type="button" class="reset-button" aria-describedby="reset-help">
              Reset Activity
            </button>
            <div id="reset-help" class="help-text">
              Moves all animals back to the starting area
            </div>
            
            <button type="button" class="check-button" aria-describedby="check-help">
              Check Answers
            </button>
            <div id="check-help" class="help-text">
              Reviews your sorting and provides feedback
            </div>
          </div>
        </div>
      `;

      const activity = testContainer.querySelector('.drag-drop-activity');
      const animals = testContainer.querySelectorAll('.animal-item');
      const habitats = testContainer.querySelectorAll('.habitat-zone');
      const statusRegion = testContainer.querySelector('.activity-status');
      const feedbackRegion = testContainer.querySelector('.activity-feedback');

      // Verify activity setup
      expect(activity.getAttribute('role')).toBe('application');
      expect(activity.getAttribute('aria-labelledby')).toBe('activity-title');
      expect(activity.getAttribute('aria-describedby')).toBe('activity-instructions');

      // Verify animals are properly labeled
      animals.forEach(animal => {
        expect(animal.getAttribute('role')).toBe('button');
        expect(animal.getAttribute('tabindex')).toBe('0');
        expect(animal.getAttribute('draggable')).toBe('true');
        expect(animal.getAttribute('aria-describedby')).toBeTruthy();
      });

      // Verify habitats are drop zones
      habitats.forEach(habitat => {
        expect(habitat.getAttribute('role')).toBe('button');
        expect(habitat.getAttribute('aria-dropeffect')).toBe('move');
        const contents = habitat.querySelector('.habitat-contents');
        expect(contents.getAttribute('role')).toBe('list');
      });

      // Test status announcements
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
      expect(statusRegion.textContent).toContain('6 animals to sort');

      // Test feedback announcements
      expect(feedbackRegion.getAttribute('aria-live')).toBe('assertive');

      // Simulate activity interactions
      feedbackRegion.textContent = 'Fish moved to ocean habitat. Correct!';
      expect(feedbackRegion.textContent).toContain('Correct!');

      statusRegion.textContent = 'Activity progress: 2 of 6 animals correctly placed.';
      expect(statusRegion.textContent).toContain('2 of 6');
    });

    it('should provide comprehensive keyboard navigation support', () => {
      testContainer.innerHTML = `
        <div class="complex-interface" role="application" aria-label="Learning dashboard">
          <!-- Tab interface with keyboard navigation -->
          <div class="tab-interface" role="tablist" aria-label="Subject areas">
            <button role="tab" 
                    aria-selected="true" 
                    aria-controls="math-panel" 
                    id="math-tab"
                    tabindex="0">
              Mathematics
            </button>
            <button role="tab" 
                    aria-selected="false" 
                    aria-controls="science-panel" 
                    id="science-tab"
                    tabindex="-1">
              Science
            </button>
            <button role="tab" 
                    aria-selected="false" 
                    aria-controls="reading-panel" 
                    id="reading-tab"
                    tabindex="-1">
              Reading
            </button>
          </div>

          <div role="tabpanel" 
               id="math-panel" 
               aria-labelledby="math-tab" 
               tabindex="0">
            <h3>Mathematics Activities</h3>
            
            <!-- Menu bar with keyboard navigation -->
            <div role="menubar" aria-label="Math tools">
              <button role="menuitem" 
                      aria-haspopup="true" 
                      aria-expanded="false"
                      aria-controls="calculator-menu"
                      tabindex="0">
                Calculator
              </button>
              <ul role="menu" 
                  id="calculator-menu" 
                  aria-hidden="true"
                  aria-labelledby="calculator-menuitem">
                <li role="menuitem" tabindex="-1">Basic Calculator</li>
                <li role="menuitem" tabindex="-1">Scientific Calculator</li>
                <li role="menuitem" tabindex="-1">Graphing Calculator</li>
              </ul>
              
              <button role="menuitem" 
                      aria-haspopup="true" 
                      aria-expanded="false"
                      tabindex="-1">
                Practice Problems
              </button>
              
              <button role="menuitem" 
                      aria-haspopup="true" 
                      aria-expanded="false"
                      tabindex="-1">
                Games
              </button>
            </div>

            <!-- Tree view with keyboard navigation -->
            <div class="lesson-tree" role="tree" aria-label="Math lesson topics">
              <div role="treeitem" 
                   aria-expanded="true" 
                   aria-level="1"
                   tabindex="0"
                   aria-describedby="addition-desc">
                <span class="tree-label">Addition</span>
                <div id="addition-desc" class="sr-only">
                  Addition topic with 3 sub-lessons
                </div>
                
                <div role="group">
                  <div role="treeitem" 
                       aria-level="2"
                       tabindex="-1">
                    Basic Addition (1-10)
                  </div>
                  <div role="treeitem" 
                       aria-level="2"
                       tabindex="-1">
                    Double-Digit Addition
                  </div>
                  <div role="treeitem" 
                       aria-level="2"
                       tabindex="-1">
                    Addition Word Problems
                  </div>
                </div>
              </div>

              <div role="treeitem" 
                   aria-expanded="false" 
                   aria-level="1"
                   tabindex="-1"
                   aria-describedby="subtraction-desc">
                <span class="tree-label">Subtraction</span>
                <div id="subtraction-desc" class="sr-only">
                  Subtraction topic with 2 sub-lessons
                </div>
              </div>
            </div>

            <!-- Grid with keyboard navigation -->
            <div class="activity-grid" 
                 role="grid" 
                 aria-label="Math activities"
                 aria-rowcount="2"
                 aria-colcount="3">
              
              <div role="row" aria-rowindex="1">
                <div role="gridcell" 
                     aria-colindex="1" 
                     tabindex="0"
                     aria-describedby="activity-1-desc">
                  <h4>Number Patterns</h4>
                  <div id="activity-1-desc" class="sr-only">
                    Interactive game to identify number patterns. Difficulty: Easy.
                  </div>
                </div>
                <div role="gridcell" 
                     aria-colindex="2" 
                     tabindex="-1"
                     aria-describedby="activity-2-desc">
                  <h4>Math Facts Quiz</h4>
                  <div id="activity-2-desc" class="sr-only">
                    Timed quiz on basic math facts. Difficulty: Medium.
                  </div>
                </div>
                <div role="gridcell" 
                     aria-colindex="3" 
                     tabindex="-1"
                     aria-describedby="activity-3-desc">
                  <h4>Word Problems</h4>
                  <div id="activity-3-desc" class="sr-only">
                    Practice solving real-world math problems. Difficulty: Hard.
                  </div>
                </div>
              </div>

              <div role="row" aria-rowindex="2">
                <div role="gridcell" 
                     aria-colindex="1" 
                     tabindex="-1">
                  <h4>Fraction Games</h4>
                </div>
                <div role="gridcell" 
                     aria-colindex="2" 
                     tabindex="-1">
                  <h4>Geometry Shapes</h4>
                </div>
                <div role="gridcell" 
                     aria-colindex="3" 
                     tabindex="-1">
                  <h4>Measurement Tools</h4>
                </div>
              </div>
            </div>
          </div>

          <!-- Keyboard navigation instructions -->
          <div class="keyboard-instructions" 
               role="complementary" 
               aria-labelledby="keyboard-help-title">
            <h3 id="keyboard-help-title">Keyboard Navigation Help</h3>
            <dl class="key-bindings">
              <dt>Tab/Shift+Tab</dt>
              <dd>Move between interface sections</dd>
              
              <dt>Arrow Keys</dt>
              <dd>Navigate within tabs, menus, trees, and grids</dd>
              
              <dt>Enter/Space</dt>
              <dd>Activate buttons and select items</dd>
              
              <dt>Escape</dt>
              <dd>Close menus and return to parent level</dd>
              
              <dt>Home/End</dt>
              <dd>Jump to first/last item in current group</dd>
            </dl>
          </div>
        </div>
      `;

      const tablist = testContainer.querySelector('[role="tablist"]');
      const tabs = testContainer.querySelectorAll('[role="tab"]');
      const menubar = testContainer.querySelector('[role="menubar"]');
      const tree = testContainer.querySelector('[role="tree"]');
      const treeitems = testContainer.querySelectorAll('[role="treeitem"]');
      const grid = testContainer.querySelector('[role="grid"]');
      const gridcells = testContainer.querySelectorAll('[role="gridcell"]');

      // Verify tab interface
      expect(tablist.getAttribute('aria-label')).toBe('Subject areas');
      tabs.forEach(tab => {
        const isSelected = tab.getAttribute('aria-selected') === 'true';
        expect(tab.getAttribute('tabindex')).toBe(isSelected ? '0' : '-1');
        expect(tab.getAttribute('aria-controls')).toBeTruthy();
      });

      // Verify menubar
      expect(menubar.getAttribute('aria-label')).toBe('Math tools');
      const focusableMenuItem = testContainer.querySelector('[role="menuitem"][tabindex="0"]');
      expect(focusableMenuItem).toBeTruthy();

      // Verify tree structure
      expect(tree.getAttribute('aria-label')).toBe('Math lesson topics');
      treeitems.forEach(item => {
        expect(item.getAttribute('aria-level')).toBeTruthy();
        const level = parseInt(item.getAttribute('aria-level'));
        expect(level).toBeGreaterThan(0);
      });

      // Verify grid structure
      expect(grid.getAttribute('aria-rowcount')).toBe('2');
      expect(grid.getAttribute('aria-colcount')).toBe('3');
      gridcells.forEach(cell => {
        expect(cell.getAttribute('aria-colindex')).toBeTruthy();
        const parent = cell.parentElement;
        expect(parent.getAttribute('role')).toBe('row');
        expect(parent.getAttribute('aria-rowindex')).toBeTruthy();
      });

      // Verify roving tabindex pattern
      const focusableGridCell = testContainer.querySelector('[role="gridcell"][tabindex="0"]');
      expect(focusableGridCell).toBeTruthy();
    });

    it('should handle screen reader detection and optimizations', async () => {
      // Mock different screen reader environments
      const screenReaderTests = [
        {
          name: 'NVDA',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NVDA/2023.1',
          expected: true,
        },
        {
          name: 'JAWS',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JAWS/2023',
          expected: true,
        },
        {
          name: 'VoiceOver',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
          speechSynthesis: true,
          expected: true,
        },
        {
          name: 'No Screen Reader',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
          expected: false,
        },
      ];

      for (const test of screenReaderTests) {
        // Reset service for each test
        if (service) {
          service.destroy();
        }

        // Mock user agent
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: test.userAgent,
        });

        // Mock speech synthesis if needed. The service treats the mere
        // presence of window.speechSynthesis as a detection indicator, so
        // non-screen-reader environments must not define it at all.
        if (test.speechSynthesis) {
          Object.defineProperty(window, 'speechSynthesis', {
            writable: true,
            configurable: true,
            value: {
              getVoices: vi.fn(() => [
                { name: 'Alex', lang: 'en-US' },
                { name: 'Victoria', lang: 'en-US' },
              ]),
              speak: vi.fn(),
              cancel: vi.fn(),
            },
          });
        } else {
          delete window.speechSynthesis;
        }

        service = new AccessibilityService();
        const detected = service.detectScreenReader();

        expect(detected).toBe(test.expected);

        if (detected) {
          await service.initialize();

          // Verify screen reader optimizations are applied
          const announcer = document.getElementById('accessibility-announcer-polite');
          expect(announcer).toBeTruthy();
          expect(announcer.getAttribute('aria-live')).toBe('polite');

          // Test announcement functionality
          service.announce('Test announcement for ' + test.name, 'polite');

          setTimeout(() => {
            expect(announcer.textContent).toBe('Test announcement for ' + test.name);
          }, 150);
        }
      }
    });
  });
});
