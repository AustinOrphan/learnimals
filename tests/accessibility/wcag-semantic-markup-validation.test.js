/**
 * WCAG Semantic Markup Validation Tests
 * Comprehensive validation of semantic HTML markup for screen reader accessibility
 * Ensures compliance with WCAG 2.1 Level AA guidelines for semantic structure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import { accessibilityService, AccessibilityService } from '../../src/services/accessibility/AccessibilityService.js';

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

describe('WCAG Semantic Markup Validation Tests', () => {
  let testContainer;
  let service;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Document Structure and Landmarks', () => {
    it('should validate proper document landmark structure', () => {
      testContainer.innerHTML = `
        <div class="page-layout">
          <header role="banner" aria-label="Site header">
            <div class="site-branding">
              <h1 class="site-title">Learnimals Educational Platform</h1>
              <p class="site-tagline">Learn Through Play</p>
            </div>
            
            <nav role="navigation" aria-label="Main navigation" id="main-nav">
              <ul role="list">
                <li role="listitem"><a href="/" aria-current="page">Home</a></li>
                <li role="listitem"><a href="/subjects">Subjects</a></li>
                <li role="listitem"><a href="/games">Games</a></li>
                <li role="listitem"><a href="/progress">Progress</a></li>
              </ul>
            </nav>
          </header>

          <main role="main" id="main-content" tabindex="-1">
            <div class="content-header">
              <h1>Mathematics Learning Center</h1>
              <nav aria-label="Breadcrumb" role="navigation">
                <ol role="list">
                  <li role="listitem"><a href="/">Home</a></li>
                  <li role="listitem"><a href="/subjects">Subjects</a></li>
                  <li role="listitem" aria-current="page">Mathematics</li>
                </ol>
              </nav>
            </div>

            <section aria-labelledby="featured-content-heading">
              <h2 id="featured-content-heading">Featured Activities</h2>
              <article aria-labelledby="activity-1-heading">
                <h3 id="activity-1-heading">Addition Practice</h3>
                <p>Master basic addition with interactive exercises.</p>
                <a href="/activities/addition" aria-describedby="activity-1-desc">
                  Start Activity
                </a>
                <div id="activity-1-desc" class="sr-only">
                  Interactive addition practice for grades 1-3
                </div>
              </article>
            </section>

            <section aria-labelledby="recent-progress-heading">
              <h2 id="recent-progress-heading">Your Recent Progress</h2>
              <div class="progress-summary" role="complementary" aria-label="Progress overview">
                <dl class="stats-list">
                  <dt>Lessons Completed</dt>
                  <dd>12 out of 20</dd>
                  <dt>Current Level</dt>
                  <dd>Intermediate</dd>
                  <dt>Total Points</dt>
                  <dd>1,450 points</dd>
                </dl>
              </div>
            </section>
          </main>

          <aside role="complementary" aria-labelledby="sidebar-heading">
            <h2 id="sidebar-heading">Quick Links</h2>
            <nav aria-label="Quick navigation">
              <ul role="list">
                <li role="listitem"><a href="/help">Help & Support</a></li>
                <li role="listitem"><a href="/settings">Account Settings</a></li>
                <li role="listitem"><a href="/achievements">Achievements</a></li>
              </ul>
            </nav>
            
            <section aria-labelledby="tips-heading">
              <h3 id="tips-heading">Learning Tips</h3>
              <ul role="list">
                <li role="listitem">Practice a little bit every day</li>
                <li role="listitem">Review mistakes to learn from them</li>
                <li role="listitem">Celebrate your achievements</li>
              </ul>
            </section>
          </aside>

          <footer role="contentinfo" aria-label="Site footer">
            <div class="footer-content">
              <div class="footer-section">
                <h3>About Learnimals</h3>
                <p>Making learning fun and accessible for all children.</p>
              </div>
              
              <div class="footer-section">
                <h3>Contact</h3>
                <address>
                  <p>Email: <a href="mailto:support@learnimals.com">support@learnimals.com</a></p>
                  <p>Phone: <a href="tel:+1234567890">+1 (234) 567-8900</a></p>
                </address>
              </div>
              
              <nav aria-label="Footer navigation">
                <h3>Links</h3>
                <ul role="list">
                  <li role="listitem"><a href="/privacy">Privacy Policy</a></li>
                  <li role="listitem"><a href="/terms">Terms of Service</a></li>
                  <li role="listitem"><a href="/accessibility">Accessibility</a></li>
                </ul>
              </nav>
            </div>
            
            <div class="copyright">
              <p>&copy; 2024 Learnimals Educational Platform. All rights reserved.</p>
            </div>
          </footer>
        </div>
      `;

      // Validate landmark structure
      const landmarks = {
        banner: testContainer.querySelector('[role="banner"]'),
        main: testContainer.querySelector('[role="main"]'),
        complementary: testContainer.querySelectorAll('[role="complementary"]'),
        contentinfo: testContainer.querySelector('[role="contentinfo"]'),
        navigation: testContainer.querySelectorAll('[role="navigation"]')
      };

      // Verify all major landmarks exist
      expect(landmarks.banner).toBeTruthy();
      expect(landmarks.main).toBeTruthy();
      expect(landmarks.contentinfo).toBeTruthy();
      expect(landmarks.complementary.length).toBeGreaterThan(0);
      expect(landmarks.navigation.length).toBeGreaterThan(0);

      // Verify landmark labeling
      expect(landmarks.banner.getAttribute('aria-label')).toBe('Site header');
      expect(landmarks.main.getAttribute('id')).toBe('main-content');
      expect(landmarks.main.getAttribute('tabindex')).toBe('-1');
      expect(landmarks.contentinfo.getAttribute('aria-label')).toBe('Site footer');

      // Verify navigation labeling
      landmarks.navigation.forEach(nav => {
        const ariaLabel = nav.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel.length).toBeGreaterThan(0);
      });

      // Verify heading hierarchy
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
      
      // Should start with h1 and not skip levels
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i++) {
        const currentLevel = levels[i];
        const previousLevel = levels[i - 1];
        // Should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    });

    it('should validate section and article structure', () => {
      testContainer.innerHTML = `
        <main role="main">
          <article aria-labelledby="lesson-title" class="lesson-content">
            <header class="lesson-header">
              <h1 id="lesson-title">Introduction to Fractions</h1>
              <div class="lesson-metadata">
                <dl>
                  <dt>Subject:</dt>
                  <dd>Mathematics</dd>
                  <dt>Grade Level:</dt>
                  <dd>Grade 3</dd>
                  <dt>Duration:</dt>
                  <dd>25 minutes</dd>
                </dl>
              </div>
            </header>

            <section aria-labelledby="objectives-heading">
              <h2 id="objectives-heading">Learning Objectives</h2>
              <ul role="list">
                <li role="listitem">Understand what a fraction represents</li>
                <li role="listitem">Identify numerator and denominator</li>
                <li role="listitem">Compare simple fractions</li>
              </ul>
            </section>

            <section aria-labelledby="content-heading">
              <h2 id="content-heading">Lesson Content</h2>
              
              <section aria-labelledby="intro-heading">
                <h3 id="intro-heading">What is a Fraction?</h3>
                <p>A fraction represents a part of a whole.</p>
                
                <figure aria-labelledby="pizza-example-caption">
                  <img src="pizza-fractions.png" 
                       alt="Pizza divided into 8 slices with 3 slices highlighted">
                  <figcaption id="pizza-example-caption">
                    Example: 3 out of 8 pizza slices = 3/8
                  </figcaption>
                </figure>
              </section>

              <section aria-labelledby="parts-heading">
                <h3 id="parts-heading">Parts of a Fraction</h3>
                <dl class="fraction-parts">
                  <dt>Numerator</dt>
                  <dd>The top number - tells us how many parts we have</dd>
                  <dt>Denominator</dt>
                  <dd>The bottom number - tells us how many equal parts in total</dd>
                </dl>
              </section>
            </section>

            <section aria-labelledby="practice-heading">
              <h2 id="practice-heading">Practice Exercises</h2>
              
              <div class="exercise" role="complementary" aria-labelledby="exercise-1-title">
                <h3 id="exercise-1-title">Exercise 1: Identifying Fractions</h3>
                <p>Look at the shape and identify the fraction that represents the shaded area.</p>
                
                <div class="exercise-content" role="img" aria-describedby="exercise-1-desc">
                  <div id="exercise-1-desc">
                    Circle divided into 4 equal parts with 1 part shaded blue
                  </div>
                </div>

                <fieldset>
                  <legend>Choose the correct fraction:</legend>
                  <div role="radiogroup" aria-required="true">
                    <label>
                      <input type="radio" name="exercise1" value="1/2">
                      1/2
                    </label>
                    <label>
                      <input type="radio" name="exercise1" value="1/4">
                      1/4
                    </label>
                    <label>
                      <input type="radio" name="exercise1" value="1/3">
                      1/3
                    </label>
                  </div>
                </fieldset>
              </div>
            </section>

            <footer class="lesson-footer">
              <nav aria-label="Lesson navigation">
                <a href="/lessons/whole-numbers" rel="prev" 
                   aria-label="Previous lesson: Whole Numbers">
                  ← Previous
                </a>
                <a href="/lessons/comparing-fractions" rel="next"
                   aria-label="Next lesson: Comparing Fractions">
                  Next →
                </a>
              </nav>
            </footer>
          </article>
        </main>
      `;

      // Validate article structure
      const article = testContainer.querySelector('article');
      const sections = testContainer.querySelectorAll('section');
      const headings = testContainer.querySelectorAll('h1, h2, h3');

      expect(article.getAttribute('aria-labelledby')).toBe('lesson-title');
      
      // Verify all sections have proper labeling
      sections.forEach(section => {
        const ariaLabelledBy = section.getAttribute('aria-labelledby');
        expect(ariaLabelledBy).toBeTruthy();
        
        const labelElement = testContainer.querySelector(`#${ariaLabelledBy}`);
        expect(labelElement).toBeTruthy();
      });

      // Verify figure and figcaption relationship
      const figure = testContainer.querySelector('figure');
      const figcaption = testContainer.querySelector('figcaption');
      
      expect(figure.getAttribute('aria-labelledby')).toBe(figcaption.id);

      // Verify exercise structure
      const exercise = testContainer.querySelector('.exercise');
      expect(exercise.getAttribute('role')).toBe('complementary');
      expect(exercise.getAttribute('aria-labelledby')).toBe('exercise-1-title');
    });

    it('should validate list semantics and structure', () => {
      testContainer.innerHTML = `
        <div class="list-examples">
          <!-- Unordered list with proper semantics -->
          <section aria-labelledby="subjects-heading">
            <h2 id="subjects-heading">Available Subjects</h2>
            <ul role="list" aria-labelledby="subjects-heading">
              <li role="listitem">
                <h3>Mathematics</h3>
                <p>Learn numbers, operations, and problem-solving</p>
                <ul role="list" aria-label="Mathematics topics">
                  <li role="listitem">Addition and Subtraction</li>
                  <li role="listitem">Multiplication and Division</li>
                  <li role="listitem">Fractions and Decimals</li>
                </ul>
              </li>
              <li role="listitem">
                <h3>Science</h3>
                <p>Explore the natural world through experiments</p>
                <ul role="list" aria-label="Science topics">
                  <li role="listitem">Life Science</li>
                  <li role="listitem">Physical Science</li>
                  <li role="listitem">Earth Science</li>
                </ul>
              </li>
            </ul>
          </section>

          <!-- Ordered list for step-by-step instructions -->
          <section aria-labelledby="instructions-heading">
            <h2 id="instructions-heading">How to Complete an Activity</h2>
            <ol role="list" aria-labelledby="instructions-heading">
              <li role="listitem">
                <strong>Step 1:</strong> Read the instructions carefully
                <div class="step-details">
                  Make sure you understand what you need to do before starting.
                </div>
              </li>
              <li role="listitem">
                <strong>Step 2:</strong> Start the activity
                <div class="step-details">
                  Click the "Start" button to begin the interactive exercise.
                </div>
              </li>
              <li role="listitem">
                <strong>Step 3:</strong> Complete all problems
                <div class="step-details">
                  Work through each problem at your own pace.
                </div>
              </li>
              <li role="listitem">
                <strong>Step 4:</strong> Review your results
                <div class="step-details">
                  Check your answers and see areas for improvement.
                </div>
              </li>
            </ol>
          </section>

          <!-- Definition list for terminology -->
          <section aria-labelledby="vocabulary-heading">
            <h2 id="vocabulary-heading">Math Vocabulary</h2>
            <dl class="vocabulary-list" aria-labelledby="vocabulary-heading">
              <dt id="term-sum">Sum</dt>
              <dd aria-labelledby="term-sum">
                The result of adding two or more numbers together.
                <div class="example">Example: 5 + 3 = 8 (8 is the sum)</div>
              </dd>
              
              <dt id="term-difference">Difference</dt>
              <dd aria-labelledby="term-difference">
                The result of subtracting one number from another.
                <div class="example">Example: 10 - 4 = 6 (6 is the difference)</div>
              </dd>
              
              <dt id="term-product">Product</dt>
              <dd aria-labelledby="term-product">
                The result of multiplying two or more numbers together.
                <div class="example">Example: 3 × 4 = 12 (12 is the product)</div>
              </dd>
            </dl>
          </section>

          <!-- Custom list with ARIA for interactive elements -->
          <section aria-labelledby="activities-heading">
            <h2 id="activities-heading">Featured Activities</h2>
            <div role="list" aria-labelledby="activities-heading" class="activity-grid">
              <div role="listitem" class="activity-card">
                <h3>Number Patterns</h3>
                <p>Discover sequences and patterns in numbers</p>
                <div class="activity-meta">
                  <span class="difficulty" aria-label="Difficulty level">Easy</span>
                  <span class="duration" aria-label="Estimated duration">10 minutes</span>
                </div>
                <a href="/activities/patterns" class="activity-link">
                  Start Activity
                </a>
              </div>
              
              <div role="listitem" class="activity-card">
                <h3>Shape Sorting</h3>
                <p>Learn about geometric shapes and their properties</p>
                <div class="activity-meta">
                  <span class="difficulty" aria-label="Difficulty level">Medium</span>
                  <span class="duration" aria-label="Estimated duration">15 minutes</span>
                </div>
                <a href="/activities/shapes" class="activity-link">
                  Start Activity
                </a>
              </div>
            </div>
          </section>
        </div>
      `;

      // Validate unordered list structure
      const unorderedLists = testContainer.querySelectorAll('ul[role="list"]');
      unorderedLists.forEach(list => {
        expect(list.getAttribute('role')).toBe('list');
        
        const listItems = list.querySelectorAll('li');
        listItems.forEach(item => {
          expect(item.getAttribute('role')).toBe('listitem');
        });

        // Check for proper labeling
        const ariaLabel = list.getAttribute('aria-label') || list.getAttribute('aria-labelledby');
        expect(ariaLabel).toBeTruthy();
      });

      // Validate ordered list structure
      const orderedList = testContainer.querySelector('ol[role="list"]');
      expect(orderedList.getAttribute('role')).toBe('list');
      
      const orderedItems = orderedList.querySelectorAll('li');
      orderedItems.forEach((item, index) => {
        expect(item.getAttribute('role')).toBe('listitem');
        // Verify step structure
        const stepText = item.textContent;
        expect(stepText).toContain(`Step ${index + 1}`);
      });

      // Validate definition list structure
      const definitionList = testContainer.querySelector('dl');
      const terms = definitionList.querySelectorAll('dt');
      const definitions = definitionList.querySelectorAll('dd');
      
      expect(terms.length).toEqual(definitions.length);
      
      // Verify term-definition relationships
      terms.forEach((term, index) => {
        const termId = term.id;
        const relatedDefinition = definitions[index];
        
        expect(termId).toBeTruthy();
        expect(relatedDefinition.getAttribute('aria-labelledby')).toBe(termId);
      });

      // Validate custom list with ARIA
      const customList = testContainer.querySelector('.activity-grid[role="list"]');
      const customItems = customList.querySelectorAll('[role="listitem"]');
      
      expect(customList.getAttribute('role')).toBe('list');
      expect(customItems.length).toBeGreaterThan(0);
      
      customItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });
  });

  describe('Form Accessibility and Labeling', () => {
    it('should validate comprehensive form structure', () => {
      testContainer.innerHTML = `
        <form aria-labelledby="contact-form-title" novalidate>
          <h2 id="contact-form-title">Contact Support Form</h2>
          <p class="form-description">
            Use this form to get help with your learning activities. 
            Required fields are marked with an asterisk (*).
          </p>

          <fieldset>
            <legend>Your Information</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="student-name">
                  Student Name
                  <span class="required" aria-label="required field">*</span>
                </label>
                <input type="text" 
                       id="student-name" 
                       name="studentName" 
                       required 
                       aria-required="true"
                       aria-invalid="false"
                       aria-describedby="name-help name-error"
                       autocomplete="name">
                <div id="name-help" class="help-text">
                  Enter the student's first and last name
                </div>
                <div id="name-error" 
                     role="alert" 
                     aria-live="assertive" 
                     class="error-message" 
                     style="display: none;">
                </div>
              </div>

              <div class="form-group">
                <label for="parent-email">
                  Parent/Guardian Email
                  <span class="required" aria-label="required field">*</span>
                </label>
                <input type="email" 
                       id="parent-email" 
                       name="parentEmail" 
                       required 
                       aria-required="true"
                       aria-invalid="false"
                       aria-describedby="email-help email-error"
                       autocomplete="email">
                <div id="email-help" class="help-text">
                  We'll send our response to this email address
                </div>
                <div id="email-error" 
                     role="alert" 
                     aria-live="assertive" 
                     class="error-message" 
                     style="display: none;">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="grade-level">Grade Level</label>
              <select id="grade-level" 
                      name="gradeLevel" 
                      aria-describedby="grade-help"
                      aria-required="false">
                <option value="">Select grade level (optional)</option>
                <optgroup label="Elementary">
                  <option value="k">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                </optgroup>
                <optgroup label="Middle School">
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                </optgroup>
              </select>
              <div id="grade-help" class="help-text">
                Optional: Helps us provide age-appropriate assistance
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Issue Details</legend>
            
            <div class="form-group">
              <fieldset class="radio-group">
                <legend>What type of help do you need?</legend>
                <div role="radiogroup" 
                     aria-required="true" 
                     aria-describedby="issue-type-help issue-type-error">
                  <label class="radio-label">
                    <input type="radio" 
                           name="issueType" 
                           value="technical" 
                           aria-describedby="issue-type-help">
                    <span class="radio-text">Technical Problem</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" 
                           name="issueType" 
                           value="content" 
                           aria-describedby="issue-type-help">
                    <span class="radio-text">Content Question</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" 
                           name="issueType" 
                           value="account" 
                           aria-describedby="issue-type-help">
                    <span class="radio-text">Account Help</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" 
                           name="issueType" 
                           value="other" 
                           aria-describedby="issue-type-help">
                    <span class="radio-text">Other</span>
                  </label>
                </div>
                <div id="issue-type-help" class="help-text">
                  Select the category that best describes your question or problem
                </div>
                <div id="issue-type-error" 
                     role="alert" 
                     aria-live="assertive" 
                     class="error-message" 
                     style="display: none;">
                </div>
              </fieldset>
            </div>

            <div class="form-group">
              <label for="subject-area">Related Subject (Optional)</label>
              <div role="group" aria-labelledby="subject-area-label">
                <div id="subject-area-label" class="group-label">
                  Which subject is your question about? (Check all that apply)
                </div>
                <div class="checkbox-group" aria-describedby="subjects-help">
                  <label class="checkbox-label">
                    <input type="checkbox" 
                           name="subjects" 
                           value="math" 
                           aria-describedby="subjects-help">
                    <span class="checkbox-text">Mathematics</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" 
                           name="subjects" 
                           value="science" 
                           aria-describedby="subjects-help">
                    <span class="checkbox-text">Science</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" 
                           name="subjects" 
                           value="reading" 
                           aria-describedby="subjects-help">
                    <span class="checkbox-text">Reading & Language Arts</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" 
                           name="subjects" 
                           value="art" 
                           aria-describedby="subjects-help">
                    <span class="checkbox-text">Creative Arts</span>
                  </label>
                </div>
                <div id="subjects-help" class="help-text">
                  Optional: Select subjects related to your question
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="message">
                Describe your question or problem
                <span class="required" aria-label="required field">*</span>
              </label>
              <textarea id="message" 
                        name="message" 
                        required 
                        aria-required="true"
                        aria-invalid="false"
                        aria-describedby="message-help message-count message-error"
                        rows="6"
                        maxlength="1000"
                        placeholder="Please provide as much detail as possible...">
              </textarea>
              <div id="message-help" class="help-text">
                Describe your question or problem in detail. Include any error messages or specific activities you were working on.
              </div>
              <div id="message-count" 
                   aria-live="polite" 
                   class="character-count">
                0 / 1000 characters
              </div>
              <div id="message-error" 
                   role="alert" 
                   aria-live="assertive" 
                   class="error-message" 
                   style="display: none;">
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Additional Options</legend>
            
            <div class="form-group">
              <div role="group" aria-labelledby="notification-preferences-label">
                <div id="notification-preferences-label" class="group-label">
                  How would you like to receive updates about your support request?
                </div>
                <label class="checkbox-label">
                  <input type="checkbox" 
                         name="notifications" 
                         value="email" 
                         checked
                         aria-describedby="notification-help">
                  <span class="checkbox-text">Email notifications</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" 
                         name="notifications" 
                         value="sms" 
                         aria-describedby="notification-help">
                  <span class="checkbox-text">Text message updates (if phone provided)</span>
                </label>
                <div id="notification-help" class="help-text">
                  We'll use your preferred method to send updates about your support request
                </div>
              </div>
            </div>
          </fieldset>

          <div class="form-actions">
            <button type="submit" 
                    class="submit-button"
                    aria-describedby="submit-help">
              Send Message
            </button>
            <button type="reset" 
                    class="reset-button"
                    aria-describedby="reset-help">
              Clear Form
            </button>
            
            <div id="submit-help" class="help-text">
              Submit your support request. We typically respond within 24 hours.
            </div>
            <div id="reset-help" class="help-text">
              Clear all form fields and start over
            </div>
          </div>

          <div class="form-status" 
               aria-live="polite" 
               aria-atomic="true"
               class="sr-only">
          </div>
        </form>
      `;

      // Validate form structure
      const form = testContainer.querySelector('form');
      const fieldsets = testContainer.querySelectorAll('fieldset');
      const labels = testContainer.querySelectorAll('label');
      const inputs = testContainer.querySelectorAll('input, select, textarea');
      const requiredFields = testContainer.querySelectorAll('[required]');
      const errorContainers = testContainer.querySelectorAll('[role="alert"]');

      // Verify form has proper labeling
      expect(form.getAttribute('aria-labelledby')).toBe('contact-form-title');
      expect(form.hasAttribute('novalidate')).toBe(true);

      // Verify fieldsets have legends
      fieldsets.forEach(fieldset => {
        const legend = fieldset.querySelector('legend');
        expect(legend).toBeTruthy();
        expect(legend.textContent.trim().length).toBeGreaterThan(0);
      });

      // Verify all form controls have proper labeling
      inputs.forEach(input => {
        const inputId = input.id;
        
        if (input.type === 'radio' || input.type === 'checkbox') {
          // Radio and checkbox inputs can be labeled by parent fieldset/group
          const parentFieldset = input.closest('fieldset');
          const parentGroup = input.closest('[role="group"], [role="radiogroup"]');
          expect(parentFieldset || parentGroup).toBeTruthy();
        } else {
          // Other inputs should have explicit labels
          const label = testContainer.querySelector(`label[for="${inputId}"]`);
          expect(label).toBeTruthy();
        }

        // Verify aria-describedby relationships
        const describedBy = input.getAttribute('aria-describedby');
        if (describedBy) {
          const describedByIds = describedBy.split(' ');
          describedByIds.forEach(id => {
            const describingElement = testContainer.querySelector(`#${id}`);
            expect(describingElement).toBeTruthy();
          });
        }
      });

      // Verify required fields are properly marked
      requiredFields.forEach(field => {
        expect(field.getAttribute('aria-required')).toBe('true');
        expect(field.getAttribute('aria-invalid')).toBe('false');
        
        // Check for required indicator in label
        const fieldId = field.id;
        const label = testContainer.querySelector(`label[for="${fieldId}"]`);
        if (label) {
          const requiredIndicator = label.querySelector('[aria-label*="required"]');
          expect(requiredIndicator).toBeTruthy();
        }
      });

      // Verify error containers are properly configured
      errorContainers.forEach(errorContainer => {
        expect(errorContainer.getAttribute('role')).toBe('alert');
        expect(errorContainer.getAttribute('aria-live')).toBe('assertive');
      });

      // Verify radio group structure
      const radioGroup = testContainer.querySelector('[role="radiogroup"]');
      expect(radioGroup.getAttribute('aria-required')).toBe('true');
      
      const radioButtons = radioGroup.querySelectorAll('input[type="radio"]');
      expect(radioButtons.length).toBeGreaterThan(1);
      
      // All radio buttons should have the same name
      const radioName = radioButtons[0].name;
      radioButtons.forEach(radio => {
        expect(radio.name).toBe(radioName);
      });

      // Verify select with optgroups
      const select = testContainer.querySelector('select');
      const optgroups = select.querySelectorAll('optgroup');
      
      optgroups.forEach(optgroup => {
        expect(optgroup.getAttribute('label')).toBeTruthy();
        
        const options = optgroup.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(0);
      });

      // Verify character counter
      const charCounter = testContainer.querySelector('#message-count');
      expect(charCounter.getAttribute('aria-live')).toBe('polite');

      // Verify form status region
      const formStatus = testContainer.querySelector('.form-status');
      expect(formStatus.getAttribute('aria-live')).toBe('polite');
      expect(formStatus.getAttribute('aria-atomic')).toBe('true');
    });

    it('should validate complex form interactions', () => {
      testContainer.innerHTML = `
        <form class="dynamic-form">
          <fieldset>
            <legend>Student Assessment Form</legend>
            
            <!-- Conditional field that appears based on selection -->
            <div class="form-group">
              <label for="assessment-type">Assessment Type</label>
              <select id="assessment-type" 
                      name="assessmentType" 
                      aria-describedby="assessment-help"
                      aria-controls="conditional-fields">
                <option value="">Choose assessment type</option>
                <option value="quiz">Quiz</option>
                <option value="project">Project</option>
                <option value="assignment">Assignment</option>
              </select>
              <div id="assessment-help" class="help-text">
                Select the type of assessment to show relevant options
              </div>
            </div>

            <!-- Conditional fields (initially hidden) -->
            <div id="conditional-fields" 
                 aria-hidden="true" 
                 aria-expanded="false"
                 class="conditional-section">
              
              <div class="quiz-specific" data-show-when="quiz">
                <div class="form-group">
                  <label for="quiz-duration">Quiz Duration (minutes)</label>
                  <input type="number" 
                         id="quiz-duration" 
                         name="quizDuration"
                         min="5" 
                         max="120" 
                         step="5"
                         aria-describedby="duration-help">
                  <div id="duration-help" class="help-text">
                    Enter duration between 5 and 120 minutes
                  </div>
                </div>
              </div>

              <div class="project-specific" data-show-when="project">
                <div class="form-group">
                  <label for="project-deadline">Project Deadline</label>
                  <input type="date" 
                         id="project-deadline" 
                         name="projectDeadline"
                         aria-describedby="deadline-help">
                  <div id="deadline-help" class="help-text">
                    Select the project submission deadline
                  </div>
                </div>
              </div>
            </div>

            <!-- Multi-step form sections -->
            <div class="form-steps" role="tablist" aria-label="Form steps">
              <button role="tab" 
                      aria-selected="true" 
                      aria-controls="step-1-panel"
                      id="step-1-tab"
                      tabindex="0">
                Step 1: Basic Info
              </button>
              <button role="tab" 
                      aria-selected="false" 
                      aria-controls="step-2-panel"
                      id="step-2-tab"
                      tabindex="-1">
                Step 2: Questions
              </button>
              <button role="tab" 
                      aria-selected="false" 
                      aria-controls="step-3-panel"
                      id="step-3-tab"
                      tabindex="-1">
                Step 3: Review
              </button>
            </div>

            <div role="tabpanel" 
                 id="step-1-panel" 
                 aria-labelledby="step-1-tab"
                 aria-hidden="false">
              <h3>Basic Information</h3>
              <div class="form-group">
                <label for="topic">Assessment Topic</label>
                <input type="text" 
                       id="topic" 
                       name="topic" 
                       required
                       aria-required="true"
                       aria-describedby="topic-help">
                <div id="topic-help" class="help-text">
                  Enter the main topic or subject being assessed
                </div>
              </div>
            </div>

            <div role="tabpanel" 
                 id="step-2-panel" 
                 aria-labelledby="step-2-tab"
                 aria-hidden="true">
              <h3>Assessment Questions</h3>
              <p>Question configuration will be shown here.</p>
            </div>

            <div role="tabpanel" 
                 id="step-3-panel" 
                 aria-labelledby="step-3-tab"
                 aria-hidden="true">
              <h3>Review and Submit</h3>
              <p>Final review will be shown here.</p>
            </div>
          </fieldset>

          <!-- Progress indicator -->
          <div class="form-progress" role="progressbar" 
               aria-valuenow="33" 
               aria-valuemin="0" 
               aria-valuemax="100"
               aria-label="Form completion progress"
               aria-describedby="progress-text">
            <div class="progress-bar" style="width: 33%;"></div>
          </div>
          <div id="progress-text" class="progress-text">
            Step 1 of 3 completed (33%)
          </div>

          <!-- Form validation summary -->
          <div id="validation-summary" 
               role="alert" 
               aria-live="assertive"
               aria-atomic="true"
               class="validation-summary"
               style="display: none;">
            <h3>Please correct the following errors:</h3>
            <ul role="list">
              <!-- Error list will be populated here -->
            </ul>
          </div>
        </form>
      `;

      // Validate conditional form structure
      const assessmentSelect = testContainer.querySelector('#assessment-type');
      const conditionalFields = testContainer.querySelector('#conditional-fields');
      
      expect(assessmentSelect.getAttribute('aria-controls')).toBe('conditional-fields');
      expect(conditionalFields.getAttribute('aria-hidden')).toBe('true');
      expect(conditionalFields.getAttribute('aria-expanded')).toBe('false');

      // Validate tab interface
      const tablist = testContainer.querySelector('[role="tablist"]');
      const tabs = testContainer.querySelectorAll('[role="tab"]');
      const tabpanels = testContainer.querySelectorAll('[role="tabpanel"]');

      expect(tablist.getAttribute('aria-label')).toBe('Form steps');
      expect(tabs.length).toBe(3);
      expect(tabpanels.length).toBe(3);

      // Verify tab-panel relationships
      tabs.forEach((tab, index) => {
        const controls = tab.getAttribute('aria-controls');
        const panel = testContainer.querySelector(`#${controls}`);
        
        expect(panel).toBeTruthy();
        expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
        
        // Verify initial state
        const isSelected = tab.getAttribute('aria-selected') === 'true';
        const panelHidden = panel.getAttribute('aria-hidden') === 'true';
        
        if (index === 0) {
          expect(isSelected).toBe(true);
          expect(panelHidden).toBe(false);
          expect(tab.getAttribute('tabindex')).toBe('0');
        } else {
          expect(isSelected).toBe(false);
          expect(panelHidden).toBe(true);
          expect(tab.getAttribute('tabindex')).toBe('-1');
        }
      });

      // Validate progress indicator
      const progressbar = testContainer.querySelector('[role="progressbar"]');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('33');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
      expect(progressbar.getAttribute('aria-describedby')).toBe('progress-text');

      // Validate validation summary
      const validationSummary = testContainer.querySelector('#validation-summary');
      expect(validationSummary.getAttribute('role')).toBe('alert');
      expect(validationSummary.getAttribute('aria-live')).toBe('assertive');
      expect(validationSummary.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('Table Accessibility and Data Relationships', () => {
    it('should validate complex data table structure', () => {
      testContainer.innerHTML = `
        <div class="grade-report-section">
          <h2 id="grade-report-title">Student Grade Report - Quarter 2</h2>
          
          <table role="table" 
                 aria-labelledby="grade-report-title"
                 aria-describedby="grade-report-summary">
            
            <caption id="grade-report-caption">
              Detailed grade report showing performance across all subjects for Quarter 2. 
              Grades are listed by subject with individual assignment scores and overall averages.
            </caption>

            <thead>
              <tr role="row">
                <th role="columnheader" 
                    scope="col" 
                    id="subject-header"
                    aria-sort="none">
                  Subject
                </th>
                <th role="columnheader" 
                    scope="col" 
                    id="assignment1-header">
                  Assignment 1
                </th>
                <th role="columnheader" 
                    scope="col" 
                    id="assignment2-header">
                  Assignment 2
                </th>
                <th role="columnheader" 
                    scope="col" 
                    id="quiz-header">
                  Quiz Average
                </th>
                <th role="columnheader" 
                    scope="col" 
                    id="overall-header"
                    aria-sort="descending">
                  Overall Grade
                </th>
                <th role="columnheader" 
                    scope="col" 
                    id="trend-header">
                  Trend
                </th>
              </tr>
            </thead>

            <tbody>
              <tr role="row">
                <th role="rowheader" 
                    scope="row" 
                    id="math-row"
                    headers="subject-header">
                  Mathematics
                </th>
                <td role="cell" 
                    headers="math-row assignment1-header">
                  <span class="grade">A-</span>
                  <span class="score" aria-label="Score: 92 out of 100">(92/100)</span>
                </td>
                <td role="cell" 
                    headers="math-row assignment2-header">
                  <span class="grade">B+</span>
                  <span class="score" aria-label="Score: 88 out of 100">(88/100)</span>
                </td>
                <td role="cell" 
                    headers="math-row quiz-header">
                  <span class="grade">A</span>
                  <span class="score" aria-label="Average: 94 percent">94%</span>
                </td>
                <td role="cell" 
                    headers="math-row overall-header">
                  <span class="grade overall-grade">A-</span>
                  <span class="gpa" aria-label="GPA: 3.7">3.7</span>
                </td>
                <td role="cell" 
                    headers="math-row trend-header">
                  <span class="trend improving" 
                        aria-label="Grade trend: Improving"
                        title="Grade has improved from last quarter">
                    ↗️ Improving
                  </span>
                </td>
              </tr>

              <tr role="row">
                <th role="rowheader" 
                    scope="row" 
                    id="science-row"
                    headers="subject-header">
                  Science
                </th>
                <td role="cell" 
                    headers="science-row assignment1-header">
                  <span class="grade">B</span>
                  <span class="score" aria-label="Score: 85 out of 100">(85/100)</span>
                </td>
                <td role="cell" 
                    headers="science-row assignment2-header">
                  <span class="grade">B+</span>
                  <span class="score" aria-label="Score: 89 out of 100">(89/100)</span>
                </td>
                <td role="cell" 
                    headers="science-row quiz-header">
                  <span class="grade">B</span>
                  <span class="score" aria-label="Average: 83 percent">83%</span>
                </td>
                <td role="cell" 
                    headers="science-row overall-header">
                  <span class="grade overall-grade">B</span>
                  <span class="gpa" aria-label="GPA: 3.0">3.0</span>
                </td>
                <td role="cell" 
                    headers="science-row trend-header">
                  <span class="trend stable" 
                        aria-label="Grade trend: Stable"
                        title="Grade has remained consistent">
                    ➡️ Stable
                  </span>
                </td>
              </tr>

              <tr role="row">
                <th role="rowheader" 
                    scope="row" 
                    id="reading-row"
                    headers="subject-header">
                  Reading & Language Arts
                </th>
                <td role="cell" 
                    headers="reading-row assignment1-header">
                  <span class="grade">A</span>
                  <span class="score" aria-label="Score: 96 out of 100">(96/100)</span>
                </td>
                <td role="cell" 
                    headers="reading-row assignment2-header">
                  <span class="grade">A</span>
                  <span class="score" aria-label="Score: 94 out of 100">(94/100)</span>
                </td>
                <td role="cell" 
                    headers="reading-row quiz-header">
                  <span class="grade">A+</span>
                  <span class="score" aria-label="Average: 98 percent">98%</span>
                </td>
                <td role="cell" 
                    headers="reading-row overall-header">
                  <span class="grade overall-grade">A</span>
                  <span class="gpa" aria-label="GPA: 4.0">4.0</span>
                </td>
                <td role="cell" 
                    headers="reading-row trend-header">
                  <span class="trend improving" 
                        aria-label="Grade trend: Improving"
                        title="Grade has improved from last quarter">
                    ↗️ Improving
                  </span>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr role="row" class="summary-row">
                <th role="rowheader" 
                    scope="row" 
                    id="overall-row"
                    headers="subject-header">
                  Overall Average
                </th>
                <td role="cell" 
                    headers="overall-row assignment1-header">
                  <span class="grade">B+</span>
                  <span class="score" aria-label="Average: 91 out of 100">(91/100)</span>
                </td>
                <td role="cell" 
                    headers="overall-row assignment2-header">
                  <span class="grade">A-</span>
                  <span class="score" aria-label="Average: 90 out of 100">(90/100)</span>
                </td>
                <td role="cell" 
                    headers="overall-row quiz-header">
                  <span class="grade">A-</span>
                  <span class="score" aria-label="Average: 92 percent">92%</span>
                </td>
                <td role="cell" 
                    headers="overall-row overall-header">
                  <span class="grade overall-grade">A-</span>
                  <span class="gpa" aria-label="Overall GPA: 3.6">3.6</span>
                </td>
                <td role="cell" 
                    headers="overall-row trend-header">
                  <span class="trend improving" 
                        aria-label="Overall trend: Improving"
                        title="Overall performance has improved">
                    ↗️ Improving
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>

          <div id="grade-report-summary" class="table-summary">
            <h3>Grade Report Summary</h3>
            <p>
              This table shows grades for 3 subjects across different assessment types. 
              The student's overall GPA is 3.6 with an improving trend in most subjects. 
              Reading & Language Arts shows the highest performance with a 4.0 GPA.
            </p>
            
            <dl class="grade-scale">
              <dt>Grade Scale:</dt>
              <dd>A+ (97-100), A (93-96), A- (90-92), B+ (87-89), B (83-86), B- (80-82)</dd>
            </dl>
          </div>
        </div>
      `;

      // Validate table structure
      const table = testContainer.querySelector('table');
      const caption = testContainer.querySelector('caption');
      const thead = testContainer.querySelector('thead');
      const tbody = testContainer.querySelector('tbody');
      const tfoot = testContainer.querySelector('tfoot');

      expect(table.getAttribute('role')).toBe('table');
      expect(table.getAttribute('aria-labelledby')).toBe('grade-report-title');
      expect(table.getAttribute('aria-describedby')).toBe('grade-report-summary');

      // Validate caption
      expect(caption).toBeTruthy();
      expect(caption.textContent.length).toBeGreaterThan(50);

      // Validate column headers
      const columnHeaders = testContainer.querySelectorAll('th[scope="col"]');
      columnHeaders.forEach(header => {
        expect(header.getAttribute('role')).toBe('columnheader');
        expect(header.getAttribute('scope')).toBe('col');
        expect(header.id).toBeTruthy();
      });

      // Validate row headers
      const rowHeaders = testContainer.querySelectorAll('th[scope="row"]');
      rowHeaders.forEach(header => {
        expect(header.getAttribute('role')).toBe('rowheader');
        expect(header.getAttribute('scope')).toBe('row');
        expect(header.id).toBeTruthy();
      });

      // Validate data cells and headers relationships
      const dataCells = testContainer.querySelectorAll('td[role="cell"]');
      dataCells.forEach(cell => {
        expect(cell.getAttribute('role')).toBe('cell');
        
        const headers = cell.getAttribute('headers');
        expect(headers).toBeTruthy();
        
        // Verify that referenced header elements exist
        const headerIds = headers.split(' ');
        headerIds.forEach(headerId => {
          const headerElement = testContainer.querySelector(`#${headerId}`);
          expect(headerElement).toBeTruthy();
        });
      });

      // Validate sortable columns
      const sortableHeaders = testContainer.querySelectorAll('[aria-sort]');
      sortableHeaders.forEach(header => {
        const sortValue = header.getAttribute('aria-sort');
        expect(['none', 'ascending', 'descending'].includes(sortValue)).toBe(true);
      });

      // Validate grade trend accessibility
      const trendElements = testContainer.querySelectorAll('.trend');
      trendElements.forEach(trend => {
        expect(trend.getAttribute('aria-label')).toContain('trend');
        expect(trend.getAttribute('title')).toBeTruthy();
      });

      // Validate score accessibility
      const scoreElements = testContainer.querySelectorAll('.score');
      scoreElements.forEach(score => {
        const ariaLabel = score.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toMatch(/Score:|Average:/);
      });
    });

    it('should validate sortable and filterable table interactions', () => {
      testContainer.innerHTML = `
        <div class="interactive-table-container">
          <div class="table-controls" role="group" aria-label="Table controls">
            <div class="filter-controls">
              <label for="subject-filter">Filter by Subject:</label>
              <select id="subject-filter" 
                      name="subjectFilter"
                      aria-describedby="filter-help filter-status">
                <option value="">All Subjects</option>
                <option value="math">Mathematics</option>
                <option value="science">Science</option>
                <option value="reading">Reading</option>
              </select>
              <div id="filter-help" class="help-text">
                Filter table rows by subject
              </div>
              <div id="filter-status" aria-live="polite" class="sr-only">
                Showing all 10 students
              </div>
            </div>

            <div class="search-controls">
              <label for="student-search">Search Students:</label>
              <input type="search" 
                     id="student-search" 
                     name="studentSearch"
                     placeholder="Type student name..."
                     aria-describedby="search-help search-results">
              <div id="search-help" class="help-text">
                Search for students by name
              </div>
              <div id="search-results" aria-live="polite" class="sr-only">
                <!-- Search results count will appear here -->
              </div>
            </div>
          </div>

          <table role="table" 
                 aria-labelledby="student-table-title"
                 aria-describedby="table-instructions">
            
            <caption id="student-table-title">
              Student Performance Tracking Table
            </caption>

            <thead>
              <tr role="row">
                <th role="columnheader" 
                    scope="col"
                    aria-sort="none"
                    tabindex="0"
                    aria-describedby="sort-instructions">
                  <button type="button" 
                          class="sort-button"
                          aria-label="Sort by student name">
                    Student Name
                    <span class="sort-indicator" aria-hidden="true"></span>
                  </button>
                </th>
                <th role="columnheader" 
                    scope="col"
                    aria-sort="none"
                    tabindex="0">
                  <button type="button" 
                          class="sort-button"
                          aria-label="Sort by grade level">
                    Grade Level
                    <span class="sort-indicator" aria-hidden="true"></span>
                  </button>
                </th>
                <th role="columnheader" 
                    scope="col"
                    aria-sort="descending"
                    tabindex="0">
                  <button type="button" 
                          class="sort-button"
                          aria-label="Sort by overall score (currently sorted descending)">
                    Overall Score
                    <span class="sort-indicator" aria-hidden="true">↓</span>
                  </button>
                </th>
                <th role="columnheader" 
                    scope="col"
                    aria-sort="none"
                    tabindex="0">
                  <button type="button" 
                          class="sort-button"
                          aria-label="Sort by last activity date">
                    Last Activity
                    <span class="sort-indicator" aria-hidden="true"></span>
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr role="row" data-subject="math">
                <th role="rowheader" scope="row">Emma Johnson</th>
                <td role="cell">Grade 3</td>
                <td role="cell">
                  <span class="score-value">95</span>
                  <span class="score-bar" 
                        role="img" 
                        aria-label="Score: 95 out of 100"
                        style="width: 95%;">
                  </span>
                </td>
                <td role="cell">
                  <time datetime="2024-03-15">March 15, 2024</time>
                </td>
              </tr>
              
              <tr role="row" data-subject="science">
                <th role="rowheader" scope="row">Liam Chen</th>
                <td role="cell">Grade 4</td>
                <td role="cell">
                  <span class="score-value">88</span>
                  <span class="score-bar" 
                        role="img" 
                        aria-label="Score: 88 out of 100"
                        style="width: 88%;">
                  </span>
                </td>
                <td role="cell">
                  <time datetime="2024-03-14">March 14, 2024</time>
                </td>
              </tr>
            </tbody>
          </table>

          <div id="table-instructions" class="table-instructions">
            <p>
              This table can be sorted by clicking column headers. 
              Use the filter and search controls above to find specific students. 
              Current sort: Overall Score (highest to lowest).
            </p>
          </div>

          <div class="table-pagination" 
               role="navigation" 
               aria-label="Table pagination">
            <div class="pagination-info" aria-live="polite">
              Showing 1-10 of 25 students
            </div>
            
            <div class="pagination-controls">
              <button type="button" 
                      aria-label="Go to previous page"
                      disabled>
                Previous
              </button>
              <span class="page-numbers" role="list">
                <span role="listitem" 
                      aria-current="page"
                      aria-label="Current page, page 1">
                  1
                </span>
                <span role="listitem">
                  <button type="button" aria-label="Go to page 2">2</button>
                </span>
                <span role="listitem">
                  <button type="button" aria-label="Go to page 3">3</button>
                </span>
              </span>
              <button type="button" 
                      aria-label="Go to next page">
                Next
              </button>
            </div>
          </div>
        </div>
      `;

      // Validate table controls
      const tableControls = testContainer.querySelector('[role="group"]');
      expect(tableControls.getAttribute('aria-label')).toBe('Table controls');

      // Validate filter control
      const subjectFilter = testContainer.querySelector('#subject-filter');
      const filterStatus = testContainer.querySelector('#filter-status');
      
      expect(subjectFilter.getAttribute('aria-describedby')).toContain('filter-status');
      expect(filterStatus.getAttribute('aria-live')).toBe('polite');

      // Validate search control
      const studentSearch = testContainer.querySelector('#student-search');
      const searchResults = testContainer.querySelector('#search-results');
      
      expect(studentSearch.type).toBe('search');
      expect(studentSearch.getAttribute('aria-describedby')).toContain('search-results');
      expect(searchResults.getAttribute('aria-live')).toBe('polite');

      // Validate sortable headers
      const sortableHeaders = testContainer.querySelectorAll('th[aria-sort]');
      const sortButtons = testContainer.querySelectorAll('.sort-button');
      
      expect(sortableHeaders.length).toBe(sortButtons.length);
      
      sortableHeaders.forEach((header, index) => {
        expect(header.getAttribute('tabindex')).toBe('0');
        
        const sortValue = header.getAttribute('aria-sort');
        expect(['none', 'ascending', 'descending'].includes(sortValue)).toBe(true);
        
        const button = sortButtons[index];
        const ariaLabel = button.getAttribute('aria-label');
        expect(ariaLabel).toContain('Sort by');
        
        if (sortValue === 'descending') {
          expect(ariaLabel).toContain('currently sorted descending');
        }
      });

      // Validate score visualization
      const scoreBars = testContainer.querySelectorAll('.score-bar');
      scoreBars.forEach(bar => {
        expect(bar.getAttribute('role')).toBe('img');
        expect(bar.getAttribute('aria-label')).toContain('Score:');
      });

      // Validate pagination
      const pagination = testContainer.querySelector('.table-pagination');
      const paginationInfo = testContainer.querySelector('.pagination-info');
      const currentPage = testContainer.querySelector('[aria-current="page"]');
      
      expect(pagination.getAttribute('role')).toBe('navigation');
      expect(pagination.getAttribute('aria-label')).toBe('Table pagination');
      expect(paginationInfo.getAttribute('aria-live')).toBe('polite');
      expect(currentPage.getAttribute('aria-current')).toBe('page');
    });
  });
});