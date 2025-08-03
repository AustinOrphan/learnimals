/**
 * Screen Reader Test Suite Runner
 * Comprehensive test runner for all screen reader accessibility tests
 * Provides configuration and utilities for screen reader testing
 */

// Import all screen reader test suites
import './comprehensive-screen-reader-support.test.js';
import './game-screen-reader-support.test.js';
import './wcag-semantic-markup-validation.test.js';
import './screen-reader-support.test.js';
import './aria-live-regions.test.js';

/**
 * Screen Reader Test Configuration
 * Configuration settings for screen reader testing
 */
export const screenReaderTestConfig = {
  // Test environment settings
  environment: {
    // Mock screen readers for testing
    mockScreenReaders: [
      {
        name: 'NVDA',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NVDA/2023.1',
        platform: 'Windows',
        announceChanges: true,
        supportsLiveRegions: true,
        supportsAriaDescribedBy: true,
      },
      {
        name: 'JAWS',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JAWS/2023',
        platform: 'Windows',
        announceChanges: true,
        supportsLiveRegions: true,
        supportsAriaDescribedBy: true,
      },
      {
        name: 'VoiceOver',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        platform: 'macOS',
        announceChanges: true,
        supportsLiveRegions: true,
        supportsAriaDescribedBy: true,
        speechSynthesisVoices: [
          { name: 'Alex', lang: 'en-US' },
          { name: 'Victoria', lang: 'en-US' },
        ],
      },
      {
        name: 'TalkBack',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        platform: 'Android',
        announceChanges: true,
        supportsLiveRegions: true,
        supportsAriaDescribedBy: true,
      },
    ],

    // Test timeouts for announcements
    timeouts: {
      politeAnnouncement: 150,
      assertiveAnnouncement: 100,
      liveRegionUpdate: 200,
      focusChange: 50,
    },

    // DOM elements that should always be present
    requiredElements: {
      politeAnnouncer: '#accessibility-announcer-polite',
      assertiveAnnouncer: '#accessibility-announcer-assertive',
      statusRegion: '#status-messages',
      alertRegion: '#alert-messages',
    },
  },

  // WCAG 2.1 Level AA compliance requirements
  wcag: {
    level: 'AA',
    version: '2.1',
    requirements: {
      // 1.3.1 Info and Relationships
      semanticMarkup: {
        headingHierarchy: true,
        landmarkRoles: true,
        listStructure: true,
        tableHeaders: true,
        formLabels: true,
      },

      // 1.3.2 Meaningful Sequence
      readingOrder: {
        logicalFlow: true,
        tabOrder: true,
        visualOrder: true,
      },

      // 1.4.3 Contrast (Minimum)
      colorContrast: {
        normalText: 4.5,
        largeText: 3.0,
      },

      // 2.1.1 Keyboard
      keyboardAccess: {
        allFunctionality: true,
        noKeyboardTrap: true,
        skipLinks: true,
      },

      // 2.4.1 Bypass Blocks
      navigation: {
        skipToContent: true,
        landmarkNavigation: true,
        headingNavigation: true,
      },

      // 2.4.2 Page Titled
      pageStructure: {
        uniqueTitles: true,
        descriptiveTitles: true,
      },

      // 2.4.3 Focus Order
      focusManagement: {
        logicalOrder: true,
        visibleFocus: true,
        focusTrapping: true,
      },

      // 2.4.4 Link Purpose
      linkPurpose: {
        descriptiveText: true,
        contextAvailable: true,
      },

      // 2.4.6 Headings and Labels
      headingsLabels: {
        descriptiveHeadings: true,
        descriptiveLabels: true,
      },

      // 3.1.1 Language of Page
      language: {
        pageLanguage: true,
        partLanguage: true,
      },

      // 3.2.1 On Focus
      predictableOnFocus: {
        noContextChange: true,
      },

      // 3.2.2 On Input
      predictableOnInput: {
        noUnexpectedChange: true,
      },

      // 3.3.1 Error Identification
      errorIdentification: {
        errorMessages: true,
        errorLocation: true,
      },

      // 3.3.2 Labels or Instructions
      formInstructions: {
        requiredFields: true,
        inputFormat: true,
        helpText: true,
      },

      // 4.1.1 Parsing
      validMarkup: {
        wellFormed: true,
        uniqueIds: true,
      },

      // 4.1.2 Name, Role, Value
      nameRoleValue: {
        accessibleName: true,
        accessibleRole: true,
        accessibleState: true,
      },

      // 4.1.3 Status Messages
      statusMessages: {
        liveRegions: true,
        roleStatus: true,
        roleAlert: true,
      },
    },
  },

  // Educational content specific requirements
  educational: {
    gameAccessibility: {
      announceGameState: true,
      announceScore: true,
      announceProgress: true,
      announceAchievements: true,
      announceInstructions: true,
      announceHints: true,
      announceFeedback: true,
    },

    lessonStructure: {
      clearObjectives: true,
      stepByStepInstructions: true,
      practiceExercises: true,
      progressIndicators: true,
      vocabularyDefinitions: true,
    },

    interactiveElements: {
      dragDropAccessibility: true,
      sortingActivities: true,
      multipleChoice: true,
      fillInBlanks: true,
      matchingExercises: true,
    },
  },
};

/**
 * Screen Reader Test Utilities
 * Helper functions for screen reader testing
 */
export class ScreenReaderTestUtils {
  constructor() {
    this.currentScreenReader = null;
    this.announcementHistory = [];
    this.mockTimer = null;
  }

  /**
   * Set up mock screen reader environment
   */
  setupMockScreenReader(screenReaderName) {
    const config = screenReaderTestConfig.environment.mockScreenReaders.find(
      sr => sr.name === screenReaderName
    );

    if (!config) {
      throw new Error(`Unknown screen reader: ${screenReaderName}`);
    }

    this.currentScreenReader = config;

    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: config.userAgent,
    });

    // Mock speech synthesis if needed
    if (config.speechSynthesisVoices) {
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        configurable: true,
        value: {
          getVoices: vi.fn(() => config.speechSynthesisVoices),
          speak: vi.fn(utterance => {
            this.recordAnnouncement(utterance.text, 'speech');
          }),
          cancel: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          speaking: false,
          pending: false,
          paused: false,
        },
      });
    }

    return config;
  }

  /**
   * Record announcement for testing
   */
  recordAnnouncement(text, type = 'live-region', priority = 'polite') {
    this.announcementHistory.push({
      text,
      type,
      priority,
      timestamp: Date.now(),
      screenReader: this.currentScreenReader?.name || 'unknown',
    });
  }

  /**
   * Get announcement history
   */
  getAnnouncementHistory(filterBy = {}) {
    let history = [...this.announcementHistory];

    if (filterBy.type) {
      history = history.filter(a => a.type === filterBy.type);
    }

    if (filterBy.priority) {
      history = history.filter(a => a.priority === filterBy.priority);
    }

    if (filterBy.screenReader) {
      history = history.filter(a => a.screenReader === filterBy.screenReader);
    }

    return history;
  }

  /**
   * Clear announcement history
   */
  clearAnnouncementHistory() {
    this.announcementHistory = [];
  }

  /**
   * Wait for announcement
   */
  async waitForAnnouncement(expectedText, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkAnnouncement = () => {
        const found = this.announcementHistory.find(a => a.text.includes(expectedText));

        if (found) {
          resolve(found);
        } else if (Date.now() - startTime > timeout) {
          reject(
            new Error(`Expected announcement "${expectedText}" not found within ${timeout}ms`)
          );
        } else {
          setTimeout(checkAnnouncement, 50);
        }
      };

      checkAnnouncement();
    });
  }

  /**
   * Validate ARIA live region setup
   */
  validateLiveRegions(container) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Check for required live regions
    const requiredRegions = screenReaderTestConfig.environment.requiredElements;

    Object.entries(requiredRegions).forEach(([name, selector]) => {
      const element = container.querySelector(selector);

      if (!element) {
        results.valid = false;
        results.errors.push(`Missing required live region: ${name} (${selector})`);
      } else {
        // Validate live region attributes
        const ariaLive = element.getAttribute('aria-live');
        if (!ariaLive) {
          results.warnings.push(`Live region ${name} missing aria-live attribute`);
        }

        if (!element.classList.contains('sr-only')) {
          results.warnings.push(`Live region ${name} should be visually hidden with sr-only class`);
        }
      }
    });

    return results;
  }

  /**
   * Validate semantic markup structure
   */
  validateSemanticMarkup(container) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Check heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));

    if (levels.length === 0) {
      results.warnings.push('No headings found');
    } else {
      // Should start with h1
      if (levels[0] !== 1) {
        results.errors.push('Page should start with h1');
        results.valid = false;
      }

      // Check for skipped levels
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          results.errors.push(`Heading level skipped: h${levels[i - 1]} to h${levels[i]}`);
          results.valid = false;
        }
      }
    }

    // Check for landmarks
    const landmarks = container.querySelectorAll(
      '[role="banner"], [role="main"], [role="contentinfo"], [role="navigation"], [role="complementary"]'
    );
    if (landmarks.length === 0) {
      results.warnings.push('No ARIA landmarks found');
    }

    // Check for main landmark
    const main = container.querySelector('[role="main"], main');
    if (!main) {
      results.errors.push('Missing main landmark');
      results.valid = false;
    }

    return results;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(container) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      focusableElements: [],
    };

    // Find all focusable elements
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const focusableElements = Array.from(container.querySelectorAll(focusableSelector));
    results.focusableElements = focusableElements;

    // Check for keyboard traps
    focusableElements.forEach((element, index) => {
      // Check if element has visible focus indicator
      const computedStyle = window.getComputedStyle(element, ':focus');
      if (!computedStyle.outline && !computedStyle.boxShadow) {
        results.warnings.push(`Element ${element.tagName} may lack visible focus indicator`);
      }

      // Check for appropriate ARIA labels
      const hasLabel =
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent.trim() ||
        (element.tagName === 'INPUT' && element.labels?.length > 0);

      if (!hasLabel) {
        results.errors.push(`Focusable element lacks accessible name: ${element.tagName}`);
        results.valid = false;
      }
    });

    return results;
  }

  /**
   * Generate test report
   */
  generateTestReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      screenReader: this.currentScreenReader?.name || 'none',
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
      },
      details: {
        liveRegions: null,
        semanticMarkup: null,
        keyboardNavigation: null,
        announcements: this.getAnnouncementHistory(),
      },
      recommendations: [],
    };

    // Process test results
    Object.entries(testResults).forEach(([testName, result]) => {
      report.summary.totalTests++;

      if (result.valid) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
      }

      report.summary.warnings += result.warnings?.length || 0;
      report.details[testName] = result;
    });

    // Generate recommendations
    if (report.summary.failed > 0) {
      report.recommendations.push('Fix failing accessibility tests before deployment');
    }

    if (report.summary.warnings > 0) {
      report.recommendations.push('Review and address accessibility warnings');
    }

    if (report.details.announcements.length === 0) {
      report.recommendations.push('Ensure screen reader announcements are working properly');
    }

    return report;
  }

  /**
   * Cleanup test environment
   */
  cleanup() {
    this.currentScreenReader = null;
    this.clearAnnouncementHistory();

    if (this.mockTimer) {
      vi.clearAllTimers();
      this.mockTimer = null;
    }
  }
}

/**
 * Educational Game Screen Reader Test Helpers
 */
export class GameScreenReaderTestHelpers extends ScreenReaderTestUtils {
  /**
   * Test game state announcements
   */
  async testGameStateAnnouncements(gameContainer) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      announcementTypes: [],
    };

    // Check for game-specific live regions
    const gameRegions = {
      gameStatus: gameContainer.querySelector(
        '[aria-live="polite"].game-status, .game-status[aria-live="polite"]'
      ),
      gameFeedback: gameContainer.querySelector(
        '[aria-live="assertive"].game-feedback, .game-feedback[aria-live="assertive"]'
      ),
      scoreAnnouncements: gameContainer.querySelector(
        '[aria-live="polite"].score-announcements, .score-announcements[aria-live="polite"]'
      ),
      achievementAnnouncements: gameContainer.querySelector(
        '[aria-live].achievement, .achievement[aria-live]'
      ),
    };

    Object.entries(gameRegions).forEach(([regionName, element]) => {
      if (!element) {
        results.warnings.push(`Missing ${regionName} live region`);
      } else {
        results.announcementTypes.push(regionName);
      }
    });

    // Check for game controls accessibility
    const gameControls = gameContainer.querySelectorAll('button, [role="button"]');
    gameControls.forEach(control => {
      const hasLabel =
        control.getAttribute('aria-label') ||
        control.getAttribute('aria-labelledby') ||
        control.textContent.trim();

      if (!hasLabel) {
        results.errors.push('Game control lacks accessible name');
        results.valid = false;
      }
    });

    return results;
  }

  /**
   * Test interactive game element accessibility
   */
  testInteractiveGameElements(gameContainer) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      interactiveElements: [],
    };

    // Test drag-drop elements
    const draggableElements = gameContainer.querySelectorAll('[draggable="true"]');
    draggableElements.forEach(element => {
      if (!element.getAttribute('aria-describedby') && !element.getAttribute('aria-label')) {
        results.errors.push('Draggable element lacks description');
        results.valid = false;
      }
      results.interactiveElements.push({ type: 'draggable', element: element.tagName });
    });

    // Test grid-based games
    const gameGrids = gameContainer.querySelectorAll('[role="grid"]');
    gameGrids.forEach(grid => {
      const rowCount = grid.getAttribute('aria-rowcount');
      const colCount = grid.getAttribute('aria-colcount');

      if (!rowCount || !colCount) {
        results.errors.push('Game grid missing row/column count');
        results.valid = false;
      }

      results.interactiveElements.push({ type: 'grid', rows: rowCount, cols: colCount });
    });

    // Test application regions
    const appRegions = gameContainer.querySelectorAll('[role="application"]');
    appRegions.forEach(app => {
      const hasLabel = app.getAttribute('aria-label') || app.getAttribute('aria-labelledby');
      const hasDescription = app.getAttribute('aria-describedby');

      if (!hasLabel) {
        results.errors.push('Application region lacks accessible name');
        results.valid = false;
      }

      if (!hasDescription) {
        results.warnings.push('Application region should have instructions');
      }

      results.interactiveElements.push({ type: 'application', labeled: !!hasLabel });
    });

    return results;
  }
}

// Export default test configuration
export default screenReaderTestConfig;
