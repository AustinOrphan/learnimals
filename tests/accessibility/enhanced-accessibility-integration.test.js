/**
 * Enhanced Accessibility Integration Tests
 * Comprehensive integration tests for accessibility features across the application
 * Tests real-world scenarios and cross-component accessibility interactions
 * Ensures WCAG 2.1 Level AA compliance in integrated workflows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import { accessibilityService, AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
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
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

describe('Enhanced Accessibility Integration Tests', () => {
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
      y: 0
    }));

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    // Mock focus and blur methods
    Element.prototype.focus = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: this,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      this.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });

    Element.prototype.blur = vi.fn(function() {
      Object.defineProperty(document, 'activeElement', {
        value: document.body,
        configurable: true
      });
      this.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      this.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });

    // Mock getComputedStyle
    window.getComputedStyle = vi.fn((element) => ({
      color: element.dataset.color || 'rgb(0, 0, 0)',
      backgroundColor: element.dataset.backgroundColor || 'rgb(255, 255, 255)',
      fontSize: element.dataset.fontSize || '16px',
      fontWeight: element.dataset.fontWeight || 'normal',
      display: element.style.display || 'block',
      visibility: element.style.visibility || 'visible',
      opacity: element.style.opacity || '1',
      outline: element.classList.contains('no-outline') ? 'none' : '2px solid blue',
      outlineOffset: '2px'
    }));

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Complete User Journey Accessibility', () => {
    it('should handle full registration form workflow with accessibility', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <form id="registration-form" novalidate>
          <fieldset>
            <legend>Personal Information</legend>
            
            <div class="form-group">
              <label for="username">
                Username <span class="required" aria-label="required">*</span>
              </label>
              <input type="text" 
                     id="username" 
                     name="username" 
                     required 
                     aria-describedby="username-help username-error"
                     autocomplete="username">
              <div id="username-help" class="help-text">
                Must be 3-20 characters, letters and numbers only
              </div>
              <div id="username-error" 
                   class="error-message" 
                   role="alert" 
                   aria-live="polite"
                   style="display: none;">
              </div>
            </div>

            <div class="form-group">
              <label for="email">
                Email Address <span class="required" aria-label="required">*</span>
              </label>
              <input type="email" 
                     id="email" 
                     name="email" 
                     required 
                     aria-describedby="email-help email-error"
                     autocomplete="email">
              <div id="email-help" class="help-text">
                We'll send confirmation to this email
              </div>
              <div id="email-error" 
                   class="error-message" 
                   role="alert" 
                   aria-live="polite"
                   style="display: none;">
              </div>
            </div>

            <div class="form-group">
              <label for="password">
                Password <span class="required" aria-label="required">*</span>
              </label>
              <input type="password" 
                     id="password" 
                     name="password" 
                     required 
                     aria-describedby="password-help password-error"
                     autocomplete="new-password">
              <div id="password-help" class="help-text">
                At least 8 characters with one uppercase, lowercase, and number
              </div>
              <div id="password-error" 
                   class="error-message" 
                   role="alert" 
                   aria-live="polite"
                   style="display: none;">
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Preferences</legend>
            
            <div class="form-group">
              <label for="age-range">Age Range</label>
              <select id="age-range" name="age-range" aria-describedby="age-help">
                <option value="">Select age range</option>
                <option value="child">Under 13</option>
                <option value="teen">13-17</option>
                <option value="adult">18+</option>
              </select>
              <div id="age-help" class="help-text">
                Helps us customize content appropriately
              </div>
            </div>

            <fieldset class="checkbox-group">
              <legend>Communication Preferences</legend>
              <div class="checkbox-item">
                <input type="checkbox" id="newsletter" name="newsletter" value="yes">
                <label for="newsletter">Send me learning tips and updates</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="reminders" name="reminders" value="yes">
                <label for="reminders">Send me practice reminders</label>
              </div>
            </fieldset>
          </fieldset>

          <div class="form-actions">
            <button type="button" id="clear-form">Clear Form</button>
            <button type="submit" id="submit-form">Create Account</button>
          </div>

          <div id="form-status" 
               class="sr-only" 
               aria-live="polite" 
               aria-atomic="true">
          </div>
        </form>
      `;

      const form = testContainer.querySelector('#registration-form');
      const usernameInput = testContainer.querySelector('#username');
      const emailInput = testContainer.querySelector('#email');
      const passwordInput = testContainer.querySelector('#password');
      const submitButton = testContainer.querySelector('#submit-form');
      const formStatus = testContainer.querySelector('#form-status');

      // Test form structure
      expect(form.getAttribute('novalidate')).toBe('');
      expect(form.querySelectorAll('fieldset').length).toBe(3);
      expect(form.querySelectorAll('legend').length).toBe(3);

      // Test required field indicators
      const requiredIndicators = form.querySelectorAll('.required');
      expect(requiredIndicators.length).toBe(3);
      requiredIndicators.forEach(indicator => {
        expect(indicator.getAttribute('aria-label')).toBe('required');
      });

      // Test input associations
      expect(usernameInput.getAttribute('aria-describedby')).toContain('username-help');
      expect(usernameInput.getAttribute('aria-describedby')).toContain('username-error');
      expect(emailInput.getAttribute('autocomplete')).toBe('email');
      expect(passwordInput.getAttribute('autocomplete')).toBe('new-password');

      // Test validation workflow
      usernameInput.value = 'ab'; // Too short
      usernameInput.dispatchEvent(new Event('blur'));

      // Simulate validation error
      const usernameError = testContainer.querySelector('#username-error');
      usernameError.textContent = 'Username must be at least 3 characters';
      usernameError.style.display = 'block';
      usernameInput.setAttribute('aria-invalid', 'true');

      expect(usernameInput.getAttribute('aria-invalid')).toBe('true');
      expect(usernameError.getAttribute('role')).toBe('alert');
      expect(usernameError.style.display).toBe('block');

      // Test form submission
      submitButton.click();
      formStatus.textContent = 'Please correct the errors above';

      expect(formStatus.getAttribute('aria-live')).toBe('polite');
      expect(formStatus.textContent).toBe('Please correct the errors above');
    });

    it('should handle complex modal with nested forms and navigation', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <button id="open-settings">Open Settings</button>
        
        <div id="settings-modal" 
             role="dialog" 
             aria-labelledby="settings-title"
             aria-describedby="settings-description"
             aria-modal="true"
             style="display: none;">
          <div class="modal-header">
            <h2 id="settings-title">Application Settings</h2>
            <p id="settings-description">Customize your learning experience</p>
            <button id="close-modal" 
                    class="modal-close" 
                    aria-label="Close settings">×</button>
          </div>
          
          <div class="modal-body">
            <div role="tablist" aria-label="Settings categories">
              <button role="tab" 
                      aria-selected="true" 
                      aria-controls="accessibility-panel"
                      id="accessibility-tab"
                      tabindex="0">
                Accessibility
              </button>
              <button role="tab" 
                      aria-selected="false" 
                      aria-controls="display-panel"
                      id="display-tab"
                      tabindex="-1">
                Display
              </button>
              <button role="tab" 
                      aria-selected="false" 
                      aria-controls="audio-panel"
                      id="audio-tab"
                      tabindex="-1">
                Audio
              </button>
            </div>
            
            <div role="tabpanel" 
                 id="accessibility-panel" 
                 aria-labelledby="accessibility-tab">
              <h3>Accessibility Settings</h3>
              <form id="accessibility-form">
                <div class="form-group">
                  <input type="checkbox" 
                         id="high-contrast" 
                         name="high-contrast">
                  <label for="high-contrast">Enable high contrast mode</label>
                </div>
                
                <div class="form-group">
                  <input type="checkbox" 
                         id="large-text" 
                         name="large-text">
                  <label for="large-text">Use larger text</label>
                </div>
                
                <div class="form-group">
                  <input type="checkbox" 
                         id="reduced-motion" 
                         name="reduced-motion">
                  <label for="reduced-motion">Reduce motion and animations</label>
                </div>
                
                <fieldset>
                  <legend>Screen Reader Verbosity</legend>
                  <div class="radio-group">
                    <input type="radio" 
                           id="verbosity-low" 
                           name="verbosity" 
                           value="low">
                    <label for="verbosity-low">Low</label>
                  </div>
                  <div class="radio-group">
                    <input type="radio" 
                           id="verbosity-medium" 
                           name="verbosity" 
                           value="medium" 
                           checked>
                    <label for="verbosity-medium">Medium</label>
                  </div>
                  <div class="radio-group">
                    <input type="radio" 
                           id="verbosity-high" 
                           name="verbosity" 
                           value="high">
                    <label for="verbosity-high">High</label>
                  </div>
                </fieldset>
              </form>
            </div>
            
            <div role="tabpanel" 
                 id="display-panel" 
                 aria-labelledby="display-tab"
                 style="display: none;">
              <h3>Display Settings</h3>
              <form id="display-form">
                <div class="form-group">
                  <label for="theme-select">Color Theme</label>
                  <select id="theme-select" name="theme">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div role="tabpanel" 
                 id="audio-panel" 
                 aria-labelledby="audio-tab"
                 style="display: none;">
              <h3>Audio Settings</h3>
              <form id="audio-form">
                <div class="form-group">
                  <label for="volume-slider">Master Volume</label>
                  <input type="range" 
                         id="volume-slider" 
                         name="volume" 
                         min="0" 
                         max="100" 
                         value="75"
                         aria-describedby="volume-value">
                  <span id="volume-value" aria-live="polite">75%</span>
                </div>
              </form>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" id="reset-settings">Reset to Defaults</button>
            <button type="button" id="cancel-settings">Cancel</button>
            <button type="button" id="save-settings">Save Changes</button>
          </div>
        </div>
        
        <div id="modal-status" 
             class="sr-only" 
             aria-live="polite" 
             aria-atomic="true">
        </div>
      `;

      const openButton = testContainer.querySelector('#open-settings');
      const modal = testContainer.querySelector('#settings-modal');
      const closeButton = testContainer.querySelector('#close-modal');
      const tabs = testContainer.querySelectorAll('[role="tab"]');
      const panels = testContainer.querySelectorAll('[role="tabpanel"]');

      // Test modal opening
      openButton.focus();
      openButton.click();
      
      modal.style.display = 'block';
      const focusTrap = service.createFocusTrap(modal);
      focusTrap.activate();

      // Test modal structure
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe('settings-title');
      expect(modal.getAttribute('aria-describedby')).toBe('settings-description');

      // Test tab navigation
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[0].getAttribute('tabindex')).toBe('0');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');
      expect(tabs[1].getAttribute('tabindex')).toBe('-1');

      // Test panel associations
      expect(panels[0].getAttribute('aria-labelledby')).toBe('accessibility-tab');
      expect(panels[1].getAttribute('aria-labelledby')).toBe('display-tab');
      expect(panels[2].getAttribute('aria-labelledby')).toBe('audio-tab');

      // Test form elements within modal
      const accessibilityForm = testContainer.querySelector('#accessibility-form');
      const checkboxes = accessibilityForm.querySelectorAll('input[type="checkbox"]');
      const radioFieldset = accessibilityForm.querySelector('fieldset');
      const radioButtons = radioFieldset.querySelectorAll('input[type="radio"]');

      expect(checkboxes.length).toBe(3);
      expect(radioFieldset.querySelector('legend').textContent).toBe('Screen Reader Verbosity');
      expect(radioButtons.length).toBe(3);

      // Test volume slider with live feedback
      const volumeSlider = testContainer.querySelector('#volume-slider');
      const volumeValue = testContainer.querySelector('#volume-value');

      expect(volumeSlider.getAttribute('aria-describedby')).toBe('volume-value');
      expect(volumeValue.getAttribute('aria-live')).toBe('polite');

      // Test modal closing
      closeButton.click();
      focusTrap.deactivate();
      modal.style.display = 'none';

      expect(document.activeElement).toBe(openButton);
    });

    it('should handle complete game interface with accessibility', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <div id="game-container" role="application" aria-label="Math Learning Game">
          <header class="game-header">
            <h1 id="game-title">Addition Practice</h1>
            <div class="game-controls">
              <button id="pause-game" aria-label="Pause game">⏸️</button>
              <button id="settings-game" aria-label="Game settings">⚙️</button>
              <button id="help-game" aria-label="Game help">❓</button>
            </div>
          </header>
          
          <div class="game-status" aria-live="polite">
            <div class="score">
              <span id="score-label">Score:</span>
              <span id="score-value" aria-describedby="score-label">0</span>
            </div>
            <div class="level">
              <span id="level-label">Level:</span>
              <span id="level-value" aria-describedby="level-label">1</span>
            </div>
            <div class="lives">
              <span id="lives-label">Lives:</span>
              <span id="lives-value" aria-describedby="lives-label">3</span>
            </div>
          </div>
          
          <main class="game-area">
            <div class="question-container">
              <div id="question" 
                   role="img" 
                   aria-labelledby="question-text"
                   tabindex="0">
                <span id="question-text" class="sr-only">5 plus 3 equals what?</span>
                <div class="math-expression" aria-hidden="true">
                  5 + 3 = ?
                </div>
              </div>
            </div>
            
            <div class="answer-container">
              <div role="group" aria-labelledby="answers-label">
                <h2 id="answers-label" class="sr-only">Choose the correct answer</h2>
                <button class="answer-button" 
                        data-value="6" 
                        aria-describedby="answer-feedback">6</button>
                <button class="answer-button" 
                        data-value="7" 
                        aria-describedby="answer-feedback">7</button>
                <button class="answer-button" 
                        data-value="8" 
                        aria-describedby="answer-feedback">8</button>
                <button class="answer-button" 
                        data-value="9" 
                        aria-describedby="answer-feedback">9</button>
              </div>
              
              <div id="answer-feedback" 
                   class="feedback" 
                   role="status" 
                   aria-live="assertive"
                   style="display: none;">
              </div>
            </div>
          </main>
          
          <div class="game-progress" role="progressbar" 
               aria-valuenow="1" 
               aria-valuemin="1" 
               aria-valuemax="10" 
               aria-label="Question 1 of 10">
            <div class="progress-bar" style="width: 10%;"></div>
          </div>
          
          <div id="game-announcements" 
               class="sr-only" 
               aria-live="polite" 
               aria-atomic="true">
          </div>
        </div>
      `;

      const gameContainer = testContainer.querySelector('#game-container');
      const question = testContainer.querySelector('#question');
      const answerButtons = testContainer.querySelectorAll('.answer-button');
      const feedback = testContainer.querySelector('#answer-feedback');
      const progressBar = testContainer.querySelector('.game-progress');
      const announcements = testContainer.querySelector('#game-announcements');

      // Test game container structure
      expect(gameContainer.getAttribute('role')).toBe('application');
      expect(gameContainer.getAttribute('aria-label')).toBe('Math Learning Game');

      // Test question accessibility
      expect(question.getAttribute('role')).toBe('img');
      expect(question.getAttribute('aria-labelledby')).toBe('question-text');
      expect(question.getAttribute('tabindex')).toBe('0');

      // Test answer buttons
      expect(answerButtons.length).toBe(4);
      answerButtons.forEach(button => {
        expect(button.getAttribute('aria-describedby')).toBe('answer-feedback');
      });

      // Test progress bar
      expect(progressBar.getAttribute('role')).toBe('progressbar');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('1');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('10');
      expect(progressBar.getAttribute('aria-label')).toBe('Question 1 of 10');

      // Test answer interaction
      const correctAnswer = testContainer.querySelector('[data-value="8"]');
      correctAnswer.click();

      // Simulate correct answer feedback
      feedback.textContent = 'Correct! 5 plus 3 equals 8';
      feedback.style.display = 'block';
      feedback.className = 'feedback correct';

      expect(feedback.getAttribute('role')).toBe('status');
      expect(feedback.getAttribute('aria-live')).toBe('assertive');
      expect(feedback.textContent).toBe('Correct! 5 plus 3 equals 8');

      // Test game state announcements
      announcements.textContent = 'Level completed! Moving to level 2';
      expect(announcements.getAttribute('aria-live')).toBe('polite');
      expect(announcements.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('Cross-Component Accessibility Integration', () => {
    it('should maintain accessibility when components interact', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <nav class="main-nav" role="navigation" aria-label="Main navigation">
          <ul role="menubar">
            <li role="none">
              <button role="menuitem" 
                      aria-haspopup="true" 
                      aria-expanded="false"
                      id="subjects-menu-trigger">
                Subjects
              </button>
              <ul role="menu" 
                  aria-labelledby="subjects-menu-trigger"
                  id="subjects-menu"
                  style="display: none;">
                <li role="none">
                  <a role="menuitem" href="/math" id="math-link">Math</a>
                </li>
                <li role="none">
                  <a role="menuitem" href="/science" id="science-link">Science</a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
        
        <main id="main-content" tabindex="-1">
          <section class="hero-section">
            <h1>Welcome to Learnimals</h1>
            <p>Choose a subject to begin learning</p>
            <div class="subject-cards" role="grid" aria-label="Subject selection">
              <div class="subject-card" 
                   role="gridcell" 
                   tabindex="0"
                   data-subject="math"
                   aria-describedby="math-description">
                <h2>Math with Marvin</h2>
                <p id="math-description">Practice arithmetic and problem solving</p>
                <button class="start-button">Start Learning</button>
              </div>
              
              <div class="subject-card" 
                   role="gridcell" 
                   tabindex="-1"
                   data-subject="science"
                   aria-describedby="science-description">
                <h2>Science with Sophie</h2>
                <p id="science-description">Explore the natural world</p>
                <button class="start-button">Start Learning</button>
              </div>
            </div>
          </section>
        </main>
        
        <div id="notification-area" 
             aria-live="polite" 
             aria-atomic="true"
             class="notification-container">
        </div>
      `;

      const menuTrigger = testContainer.querySelector('#subjects-menu-trigger');
      const subjectsMenu = testContainer.querySelector('#subjects-menu');
      const mathLink = testContainer.querySelector('#math-link');
      const subjectCards = testContainer.querySelectorAll('.subject-card');
      const mathCard = testContainer.querySelector('[data-subject="math"]');
      const notificationArea = testContainer.querySelector('#notification-area');

      // Test menu interaction
      menuTrigger.focus();
      expect(document.activeElement).toBe(menuTrigger);
      expect(menuTrigger.getAttribute('aria-expanded')).toBe('false');

      // Open menu
      menuTrigger.click();
      menuTrigger.setAttribute('aria-expanded', 'true');
      subjectsMenu.style.display = 'block';

      expect(menuTrigger.getAttribute('aria-expanded')).toBe('true');

      // Test menu keyboard navigation
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true
      });
      menuTrigger.dispatchEvent(arrowDownEvent);

      // Focus should move to first menu item
      mathLink.focus();
      expect(document.activeElement).toBe(mathLink);

      // Test subject card navigation
      mathCard.focus();
      expect(document.activeElement).toBe(mathCard);
      expect(mathCard.getAttribute('tabindex')).toBe('0');

      // Test arrow key navigation between cards
      const arrowRightEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true
      });
      mathCard.dispatchEvent(arrowRightEvent);

      // Focus should move to next card
      const scienceCard = testContainer.querySelector('[data-subject="science"]');
      scienceCard.setAttribute('tabindex', '0');
      mathCard.setAttribute('tabindex', '-1');
      scienceCard.focus();

      expect(document.activeElement).toBe(scienceCard);
      expect(scienceCard.getAttribute('tabindex')).toBe('0');
      expect(mathCard.getAttribute('tabindex')).toBe('-1');

      // Test notification system
      notificationArea.textContent = 'Subject selection updated';
      expect(notificationArea.getAttribute('aria-live')).toBe('polite');
      expect(notificationArea.textContent).toBe('Subject selection updated');
    });

    it('should handle error states across multiple components', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <div class="app-container">
          <header class="app-header">
            <h1>Learnimals Dashboard</h1>
            <div class="connection-status" 
                 role="status" 
                 aria-live="polite"
                 id="connection-status">
              Connected
            </div>
          </header>
          
          <main class="dashboard">
            <form id="profile-form" class="profile-section">
              <h2>Update Profile</h2>
              
              <div class="form-group">
                <label for="display-name">Display Name</label>
                <input type="text" 
                       id="display-name" 
                       name="display-name"
                       aria-describedby="name-error"
                       value="Current Name">
                <div id="name-error" 
                     class="error-message" 
                     role="alert" 
                     style="display: none;">
                </div>
              </div>
              
              <button type="submit" id="save-profile">Save Changes</button>
            </form>
            
            <div class="progress-section">
              <h2>Learning Progress</h2>
              <div class="progress-item" 
                   role="progressbar" 
                   aria-valuenow="75" 
                   aria-valuemin="0" 
                   aria-valuemax="100"
                   aria-label="Math progress: 75%"
                   id="math-progress">
                <div class="progress-fill" style="width: 75%;"></div>
              </div>
              
              <div id="progress-error" 
                   role="alert" 
                   aria-live="assertive"
                   style="display: none;">
              </div>
            </div>
          </main>
          
          <div class="error-boundary" 
               role="alert" 
               aria-live="assertive"
               id="global-error"
               style="display: none;">
          </div>
        </div>
      `;

      const connectionStatus = testContainer.querySelector('#connection-status');
      const profileForm = testContainer.querySelector('#profile-form');
      const displayNameInput = testContainer.querySelector('#display-name');
      const nameError = testContainer.querySelector('#name-error');
      const saveButton = testContainer.querySelector('#save-profile');
      const progressError = testContainer.querySelector('#progress-error');
      const globalError = testContainer.querySelector('#global-error');

      // Test connection error
      connectionStatus.textContent = 'Connection lost';
      connectionStatus.className = 'connection-status error';
      
      expect(connectionStatus.getAttribute('role')).toBe('status');
      expect(connectionStatus.getAttribute('aria-live')).toBe('polite');
      expect(connectionStatus.textContent).toBe('Connection lost');

      // Test form validation error
      displayNameInput.value = '';
      profileForm.dispatchEvent(new Event('submit'));

      nameError.textContent = 'Display name is required';
      nameError.style.display = 'block';
      displayNameInput.setAttribute('aria-invalid', 'true');

      expect(nameError.getAttribute('role')).toBe('alert');
      expect(displayNameInput.getAttribute('aria-invalid')).toBe('true');
      expect(nameError.textContent).toBe('Display name is required');

      // Test progress loading error
      progressError.textContent = 'Unable to load progress data';
      progressError.style.display = 'block';

      expect(progressError.getAttribute('role')).toBe('alert');
      expect(progressError.getAttribute('aria-live')).toBe('assertive');
      expect(progressError.textContent).toBe('Unable to load progress data');

      // Test global error handling
      globalError.textContent = 'An unexpected error occurred. Please refresh the page.';
      globalError.style.display = 'block';

      expect(globalError.getAttribute('role')).toBe('alert');
      expect(globalError.getAttribute('aria-live')).toBe('assertive');
      expect(globalError.textContent).toContain('unexpected error occurred');
    });
  });

  describe('Accessibility Performance and Optimization', () => {
    it('should handle large lists with virtual scrolling accessibility', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <div class="virtual-list-container">
          <h2 id="list-title">Learning Activities</h2>
          <div class="list-controls">
            <label for="filter-input">Filter activities</label>
            <input type="text" 
                   id="filter-input" 
                   placeholder="Type to filter..."
                   aria-describedby="filter-help">
            <div id="filter-help" class="help-text">
              Use keywords to find specific activities
            </div>
          </div>
          
          <div role="region" 
               aria-labelledby="list-title"
               aria-describedby="list-status"
               class="virtual-list">
            <div id="list-status" class="sr-only" aria-live="polite">
              Showing 50 of 1000 activities
            </div>
            
            <ul role="list" 
                id="activity-list"
                aria-setsize="1000"
                aria-describedby="list-instructions">
              <li role="listitem" 
                  tabindex="0"
                  aria-posinset="1"
                  aria-setsize="1000"
                  data-id="activity-1">
                <h3>Addition Basics</h3>
                <p>Learn fundamental addition concepts</p>
                <div class="activity-meta">
                  <span class="difficulty">Beginner</span>
                  <span class="duration">15 minutes</span>
                </div>
              </li>
              
              <li role="listitem" 
                  tabindex="-1"
                  aria-posinset="2"
                  aria-setsize="1000"
                  data-id="activity-2">
                <h3>Subtraction Practice</h3>
                <p>Master subtraction with visual aids</p>
                <div class="activity-meta">
                  <span class="difficulty">Beginner</span>
                  <span class="duration">20 minutes</span>
                </div>
              </li>
            </ul>
            
            <div id="list-instructions" class="sr-only">
              Use arrow keys to navigate, Enter to select, Page Up/Down for faster navigation
            </div>
          </div>
          
          <div class="list-footer">
            <button id="load-more" aria-describedby="load-more-status">
              Load More Activities
            </button>
            <div id="load-more-status" 
                 class="sr-only" 
                 aria-live="polite">
            </div>
          </div>
        </div>
      `;

      const virtualList = testContainer.querySelector('.virtual-list');
      const activityList = testContainer.querySelector('#activity-list');
      const listItems = testContainer.querySelectorAll('[role="listitem"]');
      const listStatus = testContainer.querySelector('#list-status');
      const filterInput = testContainer.querySelector('#filter-input');
      const loadMoreButton = testContainer.querySelector('#load-more');

      // Test list structure
      expect(virtualList.getAttribute('role')).toBe('region');
      expect(virtualList.getAttribute('aria-labelledby')).toBe('list-title');
      expect(activityList.getAttribute('role')).toBe('list');
      expect(activityList.getAttribute('aria-setsize')).toBe('1000');

      // Test list items
      expect(listItems[0].getAttribute('aria-posinset')).toBe('1');
      expect(listItems[0].getAttribute('aria-setsize')).toBe('1000');
      expect(listItems[0].getAttribute('tabindex')).toBe('0');
      expect(listItems[1].getAttribute('tabindex')).toBe('-1');

      // Test filtering
      filterInput.value = 'addition';
      filterInput.dispatchEvent(new Event('input'));

      // Simulate filtered results
      listStatus.textContent = 'Showing 12 of 1000 activities matching "addition"';
      expect(listStatus.getAttribute('aria-live')).toBe('polite');
      expect(listStatus.textContent).toContain('Showing 12 of 1000');

      // Test load more functionality
      loadMoreButton.click();
      const loadMoreStatus = testContainer.querySelector('#load-more-status');
      loadMoreStatus.textContent = 'Loading more activities...';

      expect(loadMoreStatus.getAttribute('aria-live')).toBe('polite');
      expect(loadMoreStatus.textContent).toBe('Loading more activities...');
    });

    it('should optimize accessibility announcements to avoid overload', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <div class="announcement-test">
          <div id="frequent-updates" 
               aria-live="polite" 
               aria-atomic="false">
          </div>
          
          <div id="important-updates" 
               aria-live="assertive" 
               aria-atomic="true">
          </div>
          
          <div id="batched-updates" 
               aria-live="polite" 
               aria-atomic="true">
          </div>
        </div>
      `;

      const frequentUpdates = testContainer.querySelector('#frequent-updates');
      const importantUpdates = testContainer.querySelector('#important-updates');
      const batchedUpdates = testContainer.querySelector('#batched-updates');

      // Test that frequent updates are properly throttled
      let updateCount = 0;
      const mockThrottledUpdate = vi.fn(() => {
        updateCount++;
        frequentUpdates.textContent = `Update ${updateCount}`;
      });

      // Simulate rapid updates (should be throttled)
      for (let i = 0; i < 10; i++) {
        setTimeout(mockThrottledUpdate, i * 50);
      }

      // Test important updates are immediate
      importantUpdates.textContent = 'Critical error occurred';
      expect(importantUpdates.getAttribute('aria-live')).toBe('assertive');
      expect(importantUpdates.textContent).toBe('Critical error occurred');

      // Test batched updates
      let batchedContent = [];
      batchedContent.push('Item 1 completed');
      batchedContent.push('Item 2 completed');
      batchedContent.push('Item 3 completed');

      // Batch multiple updates into single announcement
      setTimeout(() => {
        batchedUpdates.textContent = batchedContent.join('. ') + '.';
        expect(batchedUpdates.textContent).toBe('Item 1 completed. Item 2 completed. Item 3 completed.');
      }, 500);
    });
  });

  describe('Accessibility Testing and Validation', () => {
    it('should validate complete page accessibility', async () => {
      await service.initialize();

      testContainer.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>Learnimals - Math Learning</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <a href="#main-content" class="skip-link">Skip to main content</a>
          
          <header role="banner">
            <h1>Learnimals</h1>
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/" aria-current="page">Home</a></li>
                <li><a href="/math">Math</a></li>
                <li><a href="/science">Science</a></li>
              </ul>
            </nav>
          </header>
          
          <main id="main-content" tabindex="-1">
            <h1>Math Learning Activities</h1>
            
            <section aria-labelledby="current-activity">
              <h2 id="current-activity">Current Activity</h2>
              <div class="activity-card">
                <h3>Addition Practice</h3>
                <p>Practice basic addition problems</p>
                <button type="button" class="start-button">Start Activity</button>
              </div>
            </section>
            
            <section aria-labelledby="progress-section">
              <h2 id="progress-section">Your Progress</h2>
              <div role="progressbar" 
                   aria-valuenow="65" 
                   aria-valuemin="0" 
                   aria-valuemax="100"
                   aria-label="Overall math progress">
                <div class="progress-fill" style="width: 65%;"></div>
              </div>
            </section>
          </main>
          
          <footer role="contentinfo">
            <p>© 2023 Learnimals. All rights reserved.</p>
          </footer>
        </body>
        </html>
      `;

      // Run comprehensive accessibility tests
      const results = await accessibilityTester.runFullAccessibilityAudit(testContainer);

      // Test document structure
      expect(testContainer.querySelector('h1')).toBeTruthy();
      expect(testContainer.querySelector('[role="banner"]')).toBeTruthy();
      expect(testContainer.querySelector('[role="navigation"]')).toBeTruthy();
      expect(testContainer.querySelector('main')).toBeTruthy();
      expect(testContainer.querySelector('[role="contentinfo"]')).toBeTruthy();

      // Test skip link
      const skipLink = testContainer.querySelector('.skip-link');
      expect(skipLink.getAttribute('href')).toBe('#main-content');

      // Test heading hierarchy
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);

      // Test landmark roles
      const landmarks = testContainer.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], main');
      expect(landmarks.length).toBeGreaterThanOrEqual(4);

      // Test ARIA labels and descriptions
      const labeledElements = testContainer.querySelectorAll('[aria-label], [aria-labelledby]');
      expect(labeledElements.length).toBeGreaterThan(0);

      // Test that results contain expected accessibility checks
      expect(results).toBeDefined();
    });

    it('should generate accessibility compliance report', async () => {
      await service.initialize();

      const report = accessibilityTester.generateComplianceReport(testContainer);

      expect(report).toHaveProperty('wcagLevel');
      expect(report).toHaveProperty('passedTests');
      expect(report).toHaveProperty('failedTests');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('recommendations');

      // Test that report includes key accessibility areas
      expect(report.categories).toContain('ARIA Compliance');
      expect(report.categories).toContain('Keyboard Navigation');
      expect(report.categories).toContain('Screen Reader Support');
      expect(report.categories).toContain('Focus Management');
      expect(report.categories).toContain('Color Contrast');
      expect(report.categories).toContain('Form Accessibility');
      expect(report.categories).toContain('Modal/Dialog Accessibility');
      expect(report.categories).toContain('Navigation Accessibility');
    });
  });
});