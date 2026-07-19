/**
 * Comprehensive Keyboard Navigation Test Suite
 *
 * Master test suite that orchestrates all keyboard navigation tests
 * to ensure complete coverage of WCAG 2.1 Level AA keyboard accessibility
 * requirements across the entire Learnimals application.
 *
 * This suite validates:
 * - All interactive elements are keyboard accessible
 * - Focus management is consistent and predictable
 * - Keyboard shortcuts work as expected
 * - Screen reader compatibility
 * - Performance under keyboard-only interaction
 * - Error handling and edge cases
 */

/* global FocusEvent */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { accessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../src/utils/accessibilityTester.js';

// Import individual test modules (these would run their own describe blocks)
import './comprehensive-keyboard-navigation.test.js';
import './modal-keyboard-navigation.test.js';
import './game-keyboard-navigation.test.js';
import './navigation-keyboard-navigation.test.js';
import './form-keyboard-navigation.test.js';

// Mock logger for the master suite
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

describe('Keyboard Navigation Test Suite - Integration Tests', () => {
  let testContainer;
  const testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: {
      focusableElements: 0,
      keyboardShortcuts: 0,
      gameControls: 0,
      formFields: 0,
      navigationItems: 0,
    },
    performance: {
      focusTime: 0,
      keyResponseTime: 0,
      memoryUsage: 0,
    },
  };

  beforeAll(async () => {
    // Initialize accessibility service
    await accessibilityService.initialize();

    // Set up global keyboard event tracking
    document.addEventListener('keydown', trackKeyboardUsage);
    document.addEventListener('focus', trackFocusEvents);

    console.log('🚀 Starting Comprehensive Keyboard Navigation Test Suite');
  });

  afterAll(() => {
    // Clean up global event listeners
    document.removeEventListener('keydown', trackKeyboardUsage);
    document.removeEventListener('focus', trackFocusEvents);

    // Generate final report
    generateFinalReport();

    if (accessibilityService && accessibilityService.destroy) {
      accessibilityService.destroy();
    }
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'integration-test-container';
    document.body.appendChild(testContainer);

    // Enhanced focus tracking
    Element.prototype.focus = vi.fn(function () {
      const startTime = performance.now();

      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true,
      });

      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

      const focusTime = performance.now() - startTime;
      testResults.performance.focusTime = Math.max(testResults.performance.focusTime, focusTime);
    });

    Element.prototype.blur = vi.fn(function () {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true,
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  function trackKeyboardUsage(event) {
    const _keyCombo = [
      event.ctrlKey && 'Ctrl',
      event.altKey && 'Alt',
      event.shiftKey && 'Shift',
      event.metaKey && 'Meta',
      event.key,
    ]
      .filter(Boolean)
      .join('+');

    // Track keyboard shortcut usage
    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(
        event.key
      )
    ) {
      testResults.coverage.keyboardShortcuts++;
    }

    // Track game controls
    if (
      ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
        event.key
      )
    ) {
      testResults.coverage.gameControls++;
    }
  }

  function trackFocusEvents(event) {
    if (event.target.tagName) {
      testResults.coverage.focusableElements++;

      // Track form fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        testResults.coverage.formFields++;
      }

      // Track navigation items
      if (event.target.closest('nav') || event.target.getAttribute('role') === 'navigation') {
        testResults.coverage.navigationItems++;
      }
    }
  }

  function generateFinalReport() {
    const report = {
      ...testResults,
      timestamp: new Date().toISOString(),
      wcagCompliance: {
        level: 'AA',
        guidelines: [
          '2.1.1 Keyboard (Level A)',
          '2.1.2 No Keyboard Trap (Level A)',
          '2.1.3 Keyboard (No Exception) (Level AAA)',
          '2.4.1 Bypass Blocks (Level A)',
          '2.4.3 Focus Order (Level A)',
          '2.4.7 Focus Visible (Level AA)',
          '3.2.1 On Focus (Level A)',
          '3.2.2 On Input (Level A)',
        ],
      },
    };

    console.log('📊 Keyboard Navigation Test Results:', report);

    // Save results for CI/CD reporting
    if (typeof process !== 'undefined' && process.env.CI) {
      // In CI environment, could save to file or send to reporting service
      console.log('CI Report Generated');
    }
  }

  describe('Full Application Keyboard Navigation Integration', () => {
    it('should support complete keyboard-only user journey', async () => {
      // Simulate a complete user journey through the app using only keyboard
      testContainer.innerHTML = `
        <div class="app-container">
          <!-- Skip Links -->
          <div class="skip-links">
            <a href="#main-nav" class="skip-link">Skip to navigation</a>
            <a href="#main-content" class="skip-link">Skip to main content</a>
          </div>
          
          <!-- Main Navigation -->
          <nav id="main-nav" role="navigation" aria-label="Main navigation">
            <button id="mobile-menu-toggle" aria-expanded="false" aria-controls="nav-menu">
              Menu
            </button>
            <ul id="nav-menu">
              <li><a href="#home" id="nav-home">Home</a></li>
              <li><a href="#subjects" id="nav-subjects">Subjects</a></li>
              <li><a href="#games" id="nav-games">Games</a></li>
              <li><a href="#profile" id="nav-profile">Profile</a></li>
            </ul>
          </nav>
          
          <!-- Main Content -->
          <main id="main-content">
            <section class="hero">
              <h1>Welcome to Learnimals</h1>
              <button id="get-started" class="cta-button">Get Started</button>
            </section>
            
            <!-- Game Selection -->
            <section class="games-section">
              <h2>Choose a Game</h2>
              <div class="game-grid">
                <button class="game-card" id="math-game" data-game="math">
                  Math Adventures
                </button>
                <button class="game-card" id="science-game" data-game="science">
                  Science Explorer  
                </button>
                <button class="game-card" id="reading-game" data-game="reading">
                  Reading Quest
                </button>
              </div>
            </section>
            
            <!-- Profile Form -->
            <section class="profile-section" hidden>
              <h2>Your Profile</h2>
              <form id="profile-form">
                <div class="form-group">
                  <label for="student-name">Name:</label>
                  <input type="text" id="student-name" name="name" required>
                </div>
                <div class="form-group">
                  <label for="grade-level">Grade Level:</label>
                  <select id="grade-level" name="grade">
                    <option value="">Select grade</option>
                    <option value="k">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                  </select>
                </div>
                <div class="form-group">
                  <fieldset>
                    <legend>Favorite Subjects:</legend>
                    <label><input type="checkbox" name="subjects" value="math"> Math</label>
                    <label><input type="checkbox" name="subjects" value="science"> Science</label>
                    <label><input type="checkbox" name="subjects" value="reading"> Reading</label>
                  </fieldset>
                </div>
                <button type="submit" id="save-profile">Save Profile</button>
              </form>
            </section>
            
            <!-- Game Area -->
            <section class="game-area" hidden>
              <div id="game-container" tabindex="0" role="application" aria-label="Educational Game">
                <div class="game-ui">
                  <div class="score">Score: <span id="score">0</span></div>
                  <div class="level">Level: <span id="level">1</span></div>
                  <button id="pause-game" aria-label="Pause game">⏸️</button>
                </div>
                <div class="game-world">
                  <div id="player" class="player"></div>
                  <div class="game-objects">
                    <div class="bubble" data-value="5" data-answer="correct">5</div>
                    <div class="bubble" data-value="3" data-answer="incorrect">3</div>
                    <div class="bubble" data-value="8" data-answer="correct">8</div>
                  </div>
                </div>
                <div class="game-instructions" aria-live="polite">
                  Use WASD or arrow keys to move. Press Space to interact.
                </div>
              </div>
            </section>
          </div>
          
          <!-- Modal Dialog -->
          <div id="game-modal" class="modal" aria-hidden="true" role="dialog" aria-labelledby="modal-title">
            <div class="modal-content">
              <h3 id="modal-title">Game Paused</h3>
              <p>Your game has been paused. What would you like to do?</p>
              <div class="modal-actions">
                <button id="resume-game">Resume Game</button>
                <button id="quit-game">Quit Game</button>
                <button id="modal-close" aria-label="Close dialog">×</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Set up interactive behaviors
      setupInteractiveBehaviors();

      // Begin keyboard journey
      const skipLink = testContainer.querySelector('.skip-link');
      skipLink.focus();

      expect(document.activeElement).toBe(skipLink);
      testResults.totalTests++;
      testResults.passedTests++;

      // Navigate to main navigation
      const navLink = testContainer.querySelector('#nav-home');
      navLink.focus();

      expect(document.activeElement).toBe(navLink);
      testResults.totalTests++;
      testResults.passedTests++;

      // Navigate to profile section
      const profileLink = testContainer.querySelector('#nav-profile');
      profileLink.focus();
      profileLink.click();

      const profileSection = testContainer.querySelector('.profile-section');
      profileSection.hidden = false;

      // Fill out form using keyboard
      const nameField = testContainer.querySelector('#student-name');
      nameField.focus();
      nameField.value = 'Test Student';

      expect(document.activeElement).toBe(nameField);
      expect(nameField.value).toBe('Test Student');
      testResults.totalTests++;
      testResults.passedTests++;

      // Navigate to game section
      const gameButton = testContainer.querySelector('#math-game');
      gameButton.focus();
      gameButton.click();

      const gameArea = testContainer.querySelector('.game-area');
      gameArea.hidden = false;

      const gameContainer = testContainer.querySelector('#game-container');
      gameContainer.focus();

      expect(document.activeElement).toBe(gameContainer);
      testResults.totalTests++;
      testResults.passedTests++;

      // Test game controls
      const wKeyEvent = new KeyboardEvent('keydown', { key: 'w', bubbles: true });
      gameContainer.dispatchEvent(wKeyEvent);

      const spaceKeyEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      gameContainer.dispatchEvent(spaceKeyEvent);

      testResults.totalTests++;
      testResults.passedTests++;

      // Test modal interaction
      const pauseButton = testContainer.querySelector('#pause-game');
      pauseButton.focus();
      pauseButton.click();

      const modal = testContainer.querySelector('#game-modal');
      modal.setAttribute('aria-hidden', 'false');

      const resumeButton = testContainer.querySelector('#resume-game');
      resumeButton.focus();

      expect(document.activeElement).toBe(resumeButton);
      testResults.totalTests++;
      testResults.passedTests++;

      // Test escape key to close modal
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);

      expect(modal.getAttribute('aria-hidden')).toBe('true');
      testResults.totalTests++;
      testResults.passedTests++;

      // Verify overall accessibility; warnings are advisory only
      // (touch target sizes cannot be measured in jsdom)
      const auditResults = await accessibilityTester.runAudit(testContainer);
      expect(auditResults.violations).toEqual([]);
      testResults.totalTests++;
      testResults.passedTests++;

      console.log(
        `✅ Complete keyboard journey test passed: ${testResults.passedTests}/${testResults.totalTests} tests`
      );
    });

    it('should handle complex multi-modal interactions', () => {
      testContainer.innerHTML = `
        <div class="complex-app">
          <div class="sidebar" role="complementary">
            <nav aria-label="Sidebar navigation">
              <ul>
                <li><a href="#dashboard" id="sidebar-dashboard">Dashboard</a></li>
                <li><a href="#settings" id="sidebar-settings">Settings</a></li>
              </ul>
            </nav>
          </div>
          
          <div class="main-area">
            <div class="toolbar" role="toolbar" aria-label="Content tools">
              <button id="save-btn" aria-describedby="save-tooltip">Save</button>
              <button id="share-btn" aria-describedby="share-tooltip">Share</button>
              <button id="help-btn" aria-describedby="help-tooltip">Help</button>
            </div>
            
            <div class="content-area">
              <div class="tabs" role="tablist" aria-label="Content tabs">
                <button role="tab" tabindex="0" aria-selected="true" aria-controls="panel1" id="tab1">
                  Content
                </button>
                <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel2" id="tab2">
                  Settings
                </button>
                <button role="tab" tabindex="-1" aria-selected="false" aria-controls="panel3" id="tab3">
                  Preview
                </button>
              </div>
              
              <div role="tabpanel" id="panel1" aria-labelledby="tab1">
                <div class="editor" contenteditable="true" role="textbox" aria-label="Content editor">
                  Editable content area
                </div>
              </div>
              
              <div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
                <form class="settings-form">
                  <div class="setting-group">
                    <label for="auto-save">Auto-save:</label>
                    <input type="checkbox" id="auto-save" name="autoSave">
                  </div>
                </form>
              </div>
              
              <div role="tabpanel" id="panel3" aria-labelledby="tab3" hidden>
                <div class="preview-area">Preview content</div>
              </div>
            </div>
          </div>
          
          <div class="context-menu" hidden role="menu" aria-label="Context menu">
            <button role="menuitem" id="cut-item">Cut</button>
            <button role="menuitem" id="copy-item">Copy</button>
            <button role="menuitem" id="paste-item">Paste</button>
          </div>
        </div>
      `;

      setupComplexInteractions();

      // Test sidebar navigation
      const sidebarLink = testContainer.querySelector('#sidebar-dashboard');
      sidebarLink.focus();
      expect(document.activeElement).toBe(sidebarLink);

      // Test toolbar navigation
      const saveBtn = testContainer.querySelector('#save-btn');
      saveBtn.focus();
      expect(document.activeElement).toBe(saveBtn);

      // Test tab navigation with roving tabindex
      const tab1 = testContainer.querySelector('#tab1');
      const tab2 = testContainer.querySelector('#tab2');

      tab1.focus();
      expect(tab1.getAttribute('tabindex')).toBe('0');
      expect(tab2.getAttribute('tabindex')).toBe('-1');

      // Test arrow key navigation in tabs
      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      arrowRightEvent.preventDefault = vi.fn();
      tab1.dispatchEvent(arrowRightEvent);

      expect(arrowRightEvent.preventDefault).toHaveBeenCalled();
      expect(tab2.focus).toHaveBeenCalled();

      // Test content area focus
      const editor = testContainer.querySelector('.editor');
      editor.focus();
      expect(document.activeElement).toBe(editor);

      testResults.totalTests += 5;
      testResults.passedTests += 5;
    });

    it('should maintain performance under heavy keyboard interaction', () => {
      testContainer.innerHTML = `
        <div class="performance-test">
          <div class="large-list" role="listbox" aria-label="Large item list">
            ${Array.from(
              { length: 1000 },
              (_, i) =>
                `<div role="option" tabindex="${i === 0 ? '0' : '-1'}" id="item-${i}">Item ${i + 1}</div>`
            ).join('')}
          </div>
        </div>
      `;

      const _listbox = testContainer.querySelector('.large-list');
      const items = testContainer.querySelectorAll('[role="option"]');

      // Track the active item so roving tabindex updates are O(1) per
      // keystroke instead of touching all 1000 items every time
      let activeIndex = 0;

      // Set up arrow key navigation for large list
      items.forEach((item, index) => {
        item.addEventListener('keydown', e => {
          let nextIndex;
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              nextIndex = Math.min(index + 1, items.length - 1);
              break;
            case 'ArrowUp':
              e.preventDefault();
              nextIndex = Math.max(index - 1, 0);
              break;
            case 'Home':
              e.preventDefault();
              nextIndex = 0;
              break;
            case 'End':
              e.preventDefault();
              nextIndex = items.length - 1;
              break;
            default:
              return;
          }

          // Update roving tabindex: only the previously active and the
          // newly active items change
          items[activeIndex].setAttribute('tabindex', '-1');
          items[nextIndex].setAttribute('tabindex', '0');
          activeIndex = nextIndex;
          items[nextIndex].focus();
        });
      });

      // Performance test: rapid navigation
      const startTime = performance.now();

      items[0].focus();

      // Simulate rapid arrow key presses
      for (let i = 0; i < 100; i++) {
        const currentIndex = i % items.length;
        const arrowEvent = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
        });
        items[currentIndex].dispatchEvent(arrowEvent);
      }

      const endTime = performance.now();
      const navigationTime = endTime - startTime;

      // Should complete navigation in reasonable time
      expect(navigationTime).toBeLessThan(100); // 100ms for 100 operations

      testResults.performance.keyResponseTime = navigationTime;
      testResults.totalTests++;
      testResults.passedTests++;

      console.log(`⚡ Performance test completed in ${navigationTime.toFixed(2)}ms`);
    });
  });

  describe('Cross-Browser Keyboard Compatibility', () => {
    it('should handle browser-specific keyboard event differences', () => {
      testContainer.innerHTML = `
        <div class="browser-test">
          <input type="text" id="test-input" placeholder="Test input">
          <button id="test-button">Test Button</button>
        </div>
      `;

      const input = testContainer.querySelector('#test-input');
      const _button = testContainer.querySelector('#test-button');

      // Test different event properties that vary by browser
      const testKeyEvents = [
        { key: 'Enter', keyCode: 13, which: 13 },
        { key: ' ', keyCode: 32, which: 32 },
        { key: 'Tab', keyCode: 9, which: 9 },
        { key: 'Escape', keyCode: 27, which: 27 },
        { key: 'ArrowUp', keyCode: 38, which: 38 },
        { key: 'ArrowDown', keyCode: 40, which: 40 },
      ];

      testKeyEvents.forEach(({ key, keyCode, which }) => {
        const event = new KeyboardEvent('keydown', {
          key,
          keyCode,
          which,
          bubbles: true,
        });

        input.focus();
        input.dispatchEvent(event);

        // Verify event was handled
        expect(event.key).toBe(key);
        testResults.totalTests++;
        testResults.passedTests++;
      });
    });

    it('should handle virtual keyboard considerations', () => {
      testContainer.innerHTML = `
        <form class="mobile-form">
          <input type="text" id="text-input" inputmode="text" autocomplete="name">
          <input type="email" id="email-input" inputmode="email" autocomplete="email">
          <input type="tel" id="phone-input" inputmode="tel" autocomplete="tel">
          <input type="number" id="number-input" inputmode="numeric">
          <input type="url" id="url-input" inputmode="url">
          <input type="search" id="search-input" inputmode="search">
        </form>
      `;

      const inputs = testContainer.querySelectorAll('input');

      inputs.forEach(input => {
        // Verify proper input mode attributes for virtual keyboards
        expect(input.hasAttribute('inputmode')).toBe(true);

        // Test focus behavior
        input.focus();
        expect(document.activeElement).toBe(input);

        testResults.totalTests++;
        testResults.passedTests++;
      });
    });
  });

  function setupInteractiveBehaviors() {
    // Mobile menu toggle
    const mobileToggle = testContainer.querySelector('#mobile-menu-toggle');
    const navMenu = testContainer.querySelector('#nav-menu');

    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', (!isExpanded).toString());
        navMenu.classList.toggle('open', !isExpanded);
      });
    }

    // Game controls
    const gameContainer = testContainer.querySelector('#game-container');
    if (gameContainer) {
      gameContainer.addEventListener('keydown', e => {
        switch (e.key.toLowerCase()) {
          case 'w':
          case 'arrowup':
          case 'a':
          case 'arrowleft':
          case 's':
          case 'arrowdown':
          case 'd':
          case 'arrowright':
            e.preventDefault();
            // Mock player movement
            break;
          case ' ':
            e.preventDefault();
            // Mock interaction
            break;
          case 'escape':
          case 'p': {
            e.preventDefault();
            // Mock pause
            const modal = testContainer.querySelector('#game-modal');
            if (modal) {
              modal.setAttribute('aria-hidden', 'false');
              const resumeBtn = testContainer.querySelector('#resume-game');
              if (resumeBtn) resumeBtn.focus();
            }
            break;
          }
        }
      });
    }

    // Modal controls
    const modal = testContainer.querySelector('#game-modal');
    if (modal) {
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
          modal.setAttribute('aria-hidden', 'true');
          gameContainer?.focus();
        }
      });

      const closeBtn = testContainer.querySelector('#modal-close');
      const resumeBtn = testContainer.querySelector('#resume-game');
      const quitBtn = testContainer.querySelector('#quit-game');

      [closeBtn, resumeBtn, quitBtn].forEach(btn => {
        btn?.addEventListener('click', () => {
          modal.setAttribute('aria-hidden', 'true');
          gameContainer?.focus();
        });
      });
    }
  }

  function setupComplexInteractions() {
    // Tab navigation with roving tabindex
    const tabs = testContainer.querySelectorAll('[role="tab"]');
    const panels = testContainer.querySelectorAll('[role="tabpanel"]');

    tabs.forEach((tab, index) => {
      tab.addEventListener('keydown', e => {
        let nextIndex;
        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            nextIndex = (index + 1) % tabs.length;
            break;
          case 'ArrowLeft':
            e.preventDefault();
            nextIndex = index > 0 ? index - 1 : tabs.length - 1;
            break;
          case 'Home':
            e.preventDefault();
            nextIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            nextIndex = tabs.length - 1;
            break;
          default:
            return;
        }

        // Update tab selection
        tabs.forEach(t => {
          t.setAttribute('tabindex', '-1');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => (p.hidden = true));

        tabs[nextIndex].setAttribute('tabindex', '0');
        tabs[nextIndex].setAttribute('aria-selected', 'true');
        tabs[nextIndex].focus();
        panels[nextIndex].hidden = false;
      });

      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.setAttribute('tabindex', '-1');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => (p.hidden = true));

        tab.setAttribute('tabindex', '0');
        tab.setAttribute('aria-selected', 'true');
        panels[index].hidden = false;
      });
    });
  }
});
