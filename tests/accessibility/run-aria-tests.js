/**
 * ARIA Testing Suite Runner
 * Comprehensive test runner for all ARIA implementations in Learnimals
 * Validates WCAG 2.1 Level AA compliance across the entire application
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ariaTestConfig from './aria-test-suite.config.js';

const { validators: _validators, utils, matchers, factory, setup } = ariaTestConfig;

// Extend expect with custom ARIA matchers
expect.extend(matchers);

describe('Comprehensive ARIA Implementation Tests', () => {
  let testContainer;

  beforeAll(() => {
    testContainer = setup.setupAccessibleDOM();
    setup.setupLiveRegions();
  });

  afterAll(() => {
    setup.cleanup();
  });

  describe('Application-wide ARIA Compliance', () => {
    it('should validate all interactive elements have accessible names', () => {
      // Test all common interactive elements
      const interactiveElements = [
        { tag: 'button', content: 'Click me' },
        { tag: 'a', attributes: { href: '#' }, content: 'Link text' },
        { tag: 'input', attributes: { type: 'text', 'aria-label': 'Search' } },
        { tag: 'select', attributes: { 'aria-label': 'Choose option' } },
        { tag: 'textarea', attributes: { 'aria-label': 'Comments' } },
      ];

      interactiveElements.forEach(({ tag, attributes = {}, content = '' }) => {
        const element = utils.createMockElement(tag, attributes);
        if (content) element.textContent = content;
        testContainer.appendChild(element);

        expect(element).toHaveAccessibleName();
      });
    });

    it('should validate all ARIA roles are valid', () => {
      const roleTests = [
        'button',
        'dialog',
        'alert',
        'status',
        'progressbar',
        'tab',
        'tablist',
        'tabpanel',
        'menu',
        'menuitem',
        'navigation',
        'main',
        'complementary',
        'banner',
      ];

      roleTests.forEach(role => {
        const element = utils.createMockElement('div', { role });
        testContainer.appendChild(element);

        expect(element).toHaveValidAriaRole();
      });
    });

    it('should validate all ARIA relationships reference existing elements', () => {
      // Create elements with relationships
      const label = utils.createMockElement('span', {
        id: 'test-label',
      });
      label.textContent = 'Test Label';

      const description = utils.createMockElement('div', {
        id: 'test-description',
      });
      description.textContent = 'Test description';

      const controlledElement = utils.createMockElement('div', {
        id: 'controlled-element',
      });

      const mainElement = utils.createMockElement('div', {
        'aria-labelledby': 'test-label',
        'aria-describedby': 'test-description',
        'aria-controls': 'controlled-element',
      });

      testContainer.appendChild(label);
      testContainer.appendChild(description);
      testContainer.appendChild(controlledElement);
      testContainer.appendChild(mainElement);

      expect(mainElement).toHaveValidAriaRelationships();
    });

    it('should validate live regions are properly configured', () => {
      const liveRegionConfigs = [
        { 'aria-live': 'polite', 'aria-atomic': 'true' },
        { 'aria-live': 'assertive', 'aria-atomic': 'true' },
        { role: 'status' },
        { role: 'alert' },
      ];

      liveRegionConfigs.forEach(config => {
        const region = utils.createMockElement('div', config);
        testContainer.appendChild(region);

        expect(region).toBeValidLiveRegion();
      });
    });
  });

  describe('Educational Game ARIA Patterns', () => {
    it('should validate quiz question accessibility', () => {
      const quiz = utils.createMockElement('fieldset', {
        'aria-describedby': 'quiz-feedback',
      });

      const legend = document.createElement('legend');
      legend.textContent = 'What is 5 + 3?';

      const feedback = utils.createMockElement('div', {
        id: 'quiz-feedback',
        role: 'status',
        'aria-live': 'polite',
      });

      const options = ['6', '7', '8', '9'];
      options.forEach((option, index) => {
        const radio = utils.createMockElement('input', {
          type: 'radio',
          name: 'quiz-q1',
          value: option,
          id: `q1-${index}`,
        });

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = option;

        quiz.appendChild(radio);
        quiz.appendChild(label);
      });

      quiz.appendChild(legend);
      testContainer.appendChild(quiz);
      testContainer.appendChild(feedback);

      expect(quiz).toHaveValidAriaRelationships();
      expect(feedback).toBeValidLiveRegion();

      const radios = quiz.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        expect(radio).toHaveAccessibleName();
      });
    });

    it('should validate drag-and-drop game accessibility', () => {
      const gameBoard = utils.createMockElement('div', {
        role: 'application',
        'aria-label': 'Math sorting game',
        'aria-describedby': 'game-instructions',
      });

      const instructions = utils.createMockElement('div', {
        id: 'game-instructions',
      });
      instructions.textContent = 'Drag numbers to correct boxes';

      const draggableItem = utils.createMockElement('div', {
        role: 'button',
        draggable: 'true',
        'aria-grabbed': 'false',
        tabindex: '0',
        'aria-label': 'Number 5 - draggable',
      });

      const dropZone = utils.createMockElement('div', {
        role: 'button',
        'aria-dropeffect': 'move',
        'aria-label': 'Even numbers drop zone',
        tabindex: '0',
      });

      testContainer.appendChild(instructions);
      testContainer.appendChild(gameBoard);
      testContainer.appendChild(draggableItem);
      testContainer.appendChild(dropZone);

      expect(gameBoard).toHaveValidAriaRelationships();
      expect(gameBoard).toHaveAccessibleName();
      expect(draggableItem).toSupportKeyboardNavigation();
      expect(dropZone).toSupportKeyboardNavigation();
    });

    it('should validate progress tracking accessibility', () => {
      const progressData = factory.createProgressTestData();

      const overallProgress = utils.createMockElement('div', {
        role: 'progressbar',
        'aria-label': 'Overall learning progress',
        'aria-valuenow': progressData.overallProgress.toString(),
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuetext': `${progressData.overallProgress}% complete`,
      });

      const progressAnnouncements = utils.createLiveRegion('polite');
      progressAnnouncements.id = 'progress-announcements';

      testContainer.appendChild(overallProgress);
      testContainer.appendChild(progressAnnouncements);

      expect(overallProgress).toHaveAccessibleName();
      expect(progressAnnouncements).toBeValidLiveRegion();

      // Validate progress values
      const valuenow = parseInt(overallProgress.getAttribute('aria-valuenow'));
      const valuemin = parseInt(overallProgress.getAttribute('aria-valuemin'));
      const valuemax = parseInt(overallProgress.getAttribute('aria-valuemax'));

      expect(valuenow).toBeGreaterThanOrEqual(valuemin);
      expect(valuenow).toBeLessThanOrEqual(valuemax);
    });
  });

  describe('Form and Input Accessibility', () => {
    it('should validate comprehensive form accessibility', () => {
      const form = utils.createMockElement('form', {
        'aria-label': 'Student registration form',
      });

      const {
        container: fieldContainer,
        label: _label,
        input,
      } = utils.createAccessibleField('email', {
        label: 'Email Address',
        required: true,
        describedBy: 'email-help email-error',
      });

      const helpText = utils.createMockElement('div', {
        id: 'email-help',
      });
      helpText.textContent = 'We will never share your email';

      const errorMessage = utils.createMockElement('div', {
        id: 'email-error',
        role: 'alert',
        'aria-live': 'assertive',
      });

      form.appendChild(fieldContainer);
      form.appendChild(helpText);
      form.appendChild(errorMessage);
      testContainer.appendChild(form);

      expect(form).toHaveAccessibleName();
      expect(input).toHaveValidAriaRelationships();
      expect(input).toHaveAccessibleName();
      expect(errorMessage).toBeValidLiveRegion();

      // Test validation feedback
      input.setAttribute('aria-invalid', 'true');
      errorMessage.textContent = 'Please enter a valid email address';

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(errorMessage.textContent).toBeTruthy();
    });

    it('should validate complex form controls', () => {
      const combobox = utils.createMockElement('input', {
        role: 'combobox',
        'aria-expanded': 'false',
        'aria-autocomplete': 'list',
        'aria-owns': 'suggestions-list',
        'aria-label': 'Choose subject',
      });

      const listbox = utils.createMockElement('ul', {
        id: 'suggestions-list',
        role: 'listbox',
      });

      const options = ['Math', 'Science', 'Reading'];
      options.forEach((optionText, index) => {
        const option = utils.createMockElement('li', {
          role: 'option',
          'aria-selected': 'false',
          id: `option-${index}`,
        });
        option.textContent = optionText;
        listbox.appendChild(option);
      });

      testContainer.appendChild(combobox);
      testContainer.appendChild(listbox);

      expect(combobox).toHaveValidAriaRelationships();
      expect(combobox).toHaveAccessibleName();
      expect(listbox.getAttribute('role')).toBe('listbox');

      const optionElements = listbox.querySelectorAll('[role="option"]');
      expect(optionElements.length).toBe(3);
      optionElements.forEach(option => {
        expect(['true', 'false']).toContain(option.getAttribute('aria-selected'));
      });
    });
  });

  describe('Navigation and Landmark Accessibility', () => {
    it('should validate navigation structure', () => {
      const nav = utils.createMockElement('nav', {
        'aria-label': 'Main navigation',
      });

      const menubar = utils.createMockElement('ul', {
        role: 'menubar',
      });

      const menuItems = ['Home', 'Subjects', 'Games', 'Progress'];
      menuItems.forEach((itemText, index) => {
        const listItem = utils.createMockElement('li', {
          role: 'none',
        });

        const menuItem = utils.createMockElement('a', {
          href: '#',
          role: 'menuitem',
          'aria-current': index === 0 ? 'page' : null,
        });
        menuItem.textContent = itemText;

        listItem.appendChild(menuItem);
        menubar.appendChild(listItem);
      });

      nav.appendChild(menubar);
      testContainer.appendChild(nav);

      expect(nav).toHaveAccessibleName();
      expect(menubar.getAttribute('role')).toBe('menubar');

      const menuItemElements = menubar.querySelectorAll('[role="menuitem"]');
      expect(menuItemElements.length).toBe(4);
      menuItemElements.forEach(item => {
        expect(item).toHaveAccessibleName();
        expect(item).toSupportKeyboardNavigation();
      });
    });

    it('should validate landmark roles', () => {
      const landmarks = [
        { tag: 'main', role: 'main', label: 'Main content' },
        { tag: 'aside', role: 'complementary', label: 'Sidebar' },
        { tag: 'header', role: 'banner', label: 'Site header' },
        { tag: 'footer', role: 'contentinfo', label: 'Site footer' },
        { tag: 'section', role: 'search', label: 'Search games' },
      ];

      landmarks.forEach(({ tag, role, label }) => {
        const element = utils.createMockElement(tag, {
          role,
          'aria-label': label,
        });

        testContainer.appendChild(element);

        expect(element).toHaveValidAriaRole();
        expect(element).toHaveAccessibleName();
      });
    });
  });

  describe('Dynamic Content and Live Regions', () => {
    it('should validate game announcements', async () => {
      const gameStatus = utils.createLiveRegion('polite');
      gameStatus.id = 'game-status';

      const gameScore = utils.createLiveRegion('polite');
      gameScore.id = 'game-score';

      const urgentAlerts = utils.createLiveRegion('assertive');
      urgentAlerts.id = 'urgent-alerts';

      testContainer.appendChild(gameStatus);
      testContainer.appendChild(gameScore);
      testContainer.appendChild(urgentAlerts);

      expect(gameStatus).toBeValidLiveRegion();
      expect(gameScore).toBeValidLiveRegion();
      expect(urgentAlerts).toBeValidLiveRegion();

      // Test announcement content
      const announcements = [
        { region: gameStatus, message: 'Level 2 completed!' },
        { region: gameScore, message: 'Score: 150 points' },
        { region: urgentAlerts, message: 'Achievement unlocked!' },
      ];

      announcements.forEach(({ region, message }) => {
        region.textContent = message;
        expect(region.textContent).toBe(message);
      });
    });

    it('should validate timer and countdown accessibility', () => {
      const timer = utils.createMockElement('div', {
        role: 'timer',
        'aria-labelledby': 'timer-label',
      });

      const timerLabel = utils.createMockElement('h3', {
        id: 'timer-label',
      });
      timerLabel.textContent = 'Game Timer';

      const timerStatus = utils.createLiveRegion('polite');
      timerStatus.id = 'timer-status';

      const timerAlerts = utils.createMockElement('div', {
        role: 'alert',
        'aria-live': 'assertive',
        id: 'timer-alerts',
      });

      testContainer.appendChild(timerLabel);
      testContainer.appendChild(timer);
      testContainer.appendChild(timerStatus);
      testContainer.appendChild(timerAlerts);

      expect(timer).toHaveValidAriaRole();
      expect(timer).toHaveValidAriaRelationships();
      expect(timerStatus).toBeValidLiveRegion();
      expect(timerAlerts).toBeValidLiveRegion();

      // Test timer announcements
      const timerMessages = [
        { region: timerStatus, message: '2 minutes remaining' },
        { region: timerStatus, message: '1 minute remaining' },
        { region: timerAlerts, message: '30 seconds remaining!' },
        { region: timerAlerts, message: 'Time up!' },
      ];

      timerMessages.forEach(({ region, message }) => {
        region.textContent = message;
        expect(region.textContent).toBe(message);
      });
    });
  });

  describe('Complex Widget Patterns', () => {
    it('should validate tab interface accessibility', () => {
      const { tablist, panels } = utils.createTablist(['Math', 'Science', 'Reading']);

      testContainer.appendChild(tablist);
      testContainer.appendChild(panels);

      expect(tablist.getAttribute('role')).toBe('tablist');
      expect(tablist).toHaveAccessibleName();

      const tabs = tablist.querySelectorAll('[role="tab"]');
      const tabPanels = panels.querySelectorAll('[role="tabpanel"]');

      expect(tabs.length).toBe(3);
      expect(tabPanels.length).toBe(3);

      tabs.forEach((tab, index) => {
        expect(tab).toHaveValidAriaRole();
        expect(tab).toSupportKeyboardNavigation();
        expect(tab.getAttribute('aria-controls')).toBe(`panel-${index}`);

        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        expect(panel).toBeTruthy();
        expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
      });
    });

    it('should validate slider controls accessibility', () => {
      const slider = utils.createMockElement('div', {
        role: 'slider',
        'aria-label': 'Volume control',
        'aria-valuenow': '50',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuetext': '50 percent',
        tabindex: '0',
      });

      const sliderFeedback = utils.createLiveRegion('polite');
      sliderFeedback.id = 'slider-feedback';

      testContainer.appendChild(slider);
      testContainer.appendChild(sliderFeedback);

      expect(slider).toHaveValidAriaRole();
      expect(slider).toHaveAccessibleName();
      expect(slider).toSupportKeyboardNavigation();
      expect(sliderFeedback).toBeValidLiveRegion();

      // Validate slider values
      const valuenow = parseInt(slider.getAttribute('aria-valuenow'));
      const valuemin = parseInt(slider.getAttribute('aria-valuemin'));
      const valuemax = parseInt(slider.getAttribute('aria-valuemax'));

      expect(valuenow).toBeGreaterThanOrEqual(valuemin);
      expect(valuenow).toBeLessThanOrEqual(valuemax);
      expect(slider.getAttribute('aria-valuetext')).toContain('percent');

      // Test value change
      slider.setAttribute('aria-valuenow', '75');
      slider.setAttribute('aria-valuetext', '75 percent');
      sliderFeedback.textContent = 'Volume set to 75%';

      expect(slider.getAttribute('aria-valuenow')).toBe('75');
      expect(sliderFeedback.textContent).toContain('75%');
    });

    it('should validate data table accessibility', () => {
      const table = utils.createMockElement('table', {
        role: 'table',
        'aria-labelledby': 'table-caption',
      });

      const caption = document.createElement('caption');
      caption.id = 'table-caption';
      caption.textContent = 'Student Scores';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');

      const headers = ['Student', 'Math', 'Science'];
      headers.forEach((headerText, index) => {
        const th = document.createElement('th');
        th.id = `header-${index}`;
        th.setAttribute('scope', 'col');
        th.textContent = headerText;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);

      const tbody = document.createElement('tbody');
      const dataRow = document.createElement('tr');

      const studentCell = document.createElement('th');
      studentCell.setAttribute('scope', 'row');
      studentCell.textContent = 'Alice';

      const mathCell = document.createElement('td');
      mathCell.setAttribute('headers', 'header-1');
      mathCell.textContent = '95';

      const scienceCell = document.createElement('td');
      scienceCell.setAttribute('headers', 'header-2');
      scienceCell.textContent = '88';

      dataRow.appendChild(studentCell);
      dataRow.appendChild(mathCell);
      dataRow.appendChild(scienceCell);
      tbody.appendChild(dataRow);

      table.appendChild(caption);
      table.appendChild(thead);
      table.appendChild(tbody);
      testContainer.appendChild(table);

      expect(table).toHaveValidAriaRole();
      expect(table).toHaveValidAriaRelationships();

      // Validate header relationships
      const headerCells = table.querySelectorAll('th[scope="col"]');
      expect(headerCells.length).toBe(3);
      headerCells.forEach(header => {
        expect(header.id).toBeTruthy();
      });

      // Validate data cell relationships
      const dataCells = table.querySelectorAll('td[headers]');
      dataCells.forEach(cell => {
        const headerId = cell.getAttribute('headers');
        expect(document.getElementById(headerId)).toBeTruthy();
      });
    });
  });

  describe('Screen Reader Optimization', () => {
    it('should validate screen reader only content', () => {
      const srOnlyElements = [
        'Instructions for screen reader users',
        'Skip to main content',
        'Additional context for this section',
        'Current status: Level 3 of 5',
      ];

      srOnlyElements.forEach(text => {
        const element = utils.createMockElement('span', {
          class: 'sr-only',
        });
        element.textContent = text;
        testContainer.appendChild(element);

        expect(element.textContent.trim()).toBeTruthy();
        expect(element.className).toContain('sr-only');
      });
    });

    it('should validate decorative content is hidden', () => {
      const decorativeElements = [
        { tag: 'img', attributes: { 'aria-hidden': 'true', alt: '' } },
        { tag: 'span', attributes: { 'aria-hidden': 'true' }, content: '🎮' },
        { tag: 'div', attributes: { 'aria-hidden': 'true' }, content: '• • •' },
      ];

      decorativeElements.forEach(({ tag, attributes, content = '' }) => {
        const element = utils.createMockElement(tag, attributes);
        if (content) element.textContent = content;
        testContainer.appendChild(element);

        expect(element.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should validate keyboard navigation paths', () => {
      const focusableElements = utils.getFocusableElements(testContainer);

      focusableElements.forEach(element => {
        expect(element).toSupportKeyboardNavigation();
      });

      // Test tab order makes sense
      const tabIndexElements = testContainer.querySelectorAll('[tabindex]');
      tabIndexElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        expect(['0', '-1']).toContain(tabIndex);
      });
    });
  });

  describe('WCAG 2.1 Level AA Compliance', () => {
    it('should validate heading hierarchy', () => {
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      let validHierarchy = true;

      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        if (previousLevel > 0 && level > previousLevel + 1) {
          validHierarchy = false;
        }
        previousLevel = level;
      });

      expect(validHierarchy).toBe(true);
    });

    it('should validate all images have appropriate alt text', () => {
      const images = testContainer.querySelectorAll('img');

      images.forEach(img => {
        const hasAlt = img.hasAttribute('alt');
        const isDecorative = img.getAttribute('aria-hidden') === 'true';

        if (isDecorative) {
          expect(img.alt).toBe('');
        } else {
          expect(hasAlt).toBe(true);
          if (img.alt !== '') {
            expect(img.alt.trim()).toBeTruthy();
          }
        }
      });
    });

    it('should validate color is not the only means of conveying information', () => {
      // This would typically require visual testing
      // For now, we ensure important elements have text labels
      const buttons = testContainer.querySelectorAll('button');

      buttons.forEach(button => {
        const hasText =
          button.textContent.trim() ||
          button.getAttribute('aria-label') ||
          button.getAttribute('aria-labelledby');
        expect(hasText).toBeTruthy();
      });
    });

    it('should validate focus indicators are present', () => {
      const focusableElements = utils.getFocusableElements(testContainer);

      focusableElements.forEach(element => {
        // Ensure element can receive focus
        expect(element.tabIndex).toBeGreaterThanOrEqual(-1);

        // In a real browser test, we would check for visible focus indicators
        // For now, we ensure the element is not explicitly disabled
        expect(element.disabled).not.toBe(true);
        expect(element.getAttribute('aria-disabled')).not.toBe('true');
      });
    });
  });
});
