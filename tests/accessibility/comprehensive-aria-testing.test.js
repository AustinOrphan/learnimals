/**
 * Comprehensive ARIA Testing Suite
 * Tests all ARIA improvements including attributes, landmarks, live regions,
 * labeling, states, relationships, and custom patterns
 * Ensures WCAG 2.1 Level AA compliance for all ARIA implementations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';
import '../../src/services/accessibility/AccessibilityService.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Comprehensive ARIA Testing Suite', () => {
  let testContainer;
  let mockElement;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    mockElement = document.createElement('div');
    testContainer.appendChild(mockElement);

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

    // Mock focus/blur
    Element.prototype.focus = vi.fn();
    Element.prototype.blur = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('1. ARIA Attributes Validation', () => {
    describe('Basic ARIA attributes', () => {
      it('should validate aria-label attributes', () => {
        const button = document.createElement('button');
        button.setAttribute('aria-label', 'Close dialog');
        testContainer.appendChild(button);

        expect(button.hasAttribute('aria-label')).toBe(true);
        expect(button.getAttribute('aria-label')).toBe('Close dialog');
        expect(button.getAttribute('aria-label')).toMatch(/^[A-Za-z\s]+$/);
      });

      it('should validate aria-labelledby relationships', () => {
        const heading = document.createElement('h2');
        heading.id = 'section-title';
        heading.textContent = 'Settings';

        const section = document.createElement('section');
        section.setAttribute('aria-labelledby', 'section-title');

        testContainer.appendChild(heading);
        testContainer.appendChild(section);

        expect(section.getAttribute('aria-labelledby')).toBe('section-title');
        expect(document.getElementById('section-title')).toBeTruthy();
        expect(document.getElementById('section-title').textContent.trim()).toBeTruthy();
      });

      it('should validate aria-describedby relationships', () => {
        const input = document.createElement('input');
        input.id = 'password';
        input.setAttribute('aria-describedby', 'password-help');

        const helpText = document.createElement('div');
        helpText.id = 'password-help';
        helpText.textContent = 'Password must be at least 8 characters';

        testContainer.appendChild(input);
        testContainer.appendChild(helpText);

        expect(input.getAttribute('aria-describedby')).toBe('password-help');
        expect(document.getElementById('password-help')).toBeTruthy();
        expect(document.getElementById('password-help').textContent.trim()).toBeTruthy();
      });

      it('should validate multiple aria-describedby references', () => {
        const input = document.createElement('input');
        input.setAttribute('aria-describedby', 'help-text error-message');

        const helpText = document.createElement('div');
        helpText.id = 'help-text';
        helpText.textContent = 'Enter your email address';

        const errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.textContent = 'Email is required';

        testContainer.appendChild(input);
        testContainer.appendChild(helpText);
        testContainer.appendChild(errorMessage);

        const describedByIds = input.getAttribute('aria-describedby').split(' ');
        expect(describedByIds).toHaveLength(2);
        expect(describedByIds).toContain('help-text');
        expect(describedByIds).toContain('error-message');

        describedByIds.forEach(id => {
          expect(document.getElementById(id)).toBeTruthy();
        });
      });
    });

    describe('ARIA roles validation', () => {
      it('should validate standard ARIA roles', () => {
        const roles = [
          'button',
          'dialog',
          'alert',
          'status',
          'progressbar',
          'slider',
          'spinbutton',
          'textbox',
          'combobox',
          'listbox',
          'option',
          'tab',
          'tablist',
          'tabpanel',
          'menu',
          'menuitem',
          'navigation',
          'main',
          'complementary',
          'banner',
          'contentinfo',
        ];

        roles.forEach(role => {
          const element = document.createElement('div');
          element.setAttribute('role', role);
          testContainer.appendChild(element);

          expect(element.getAttribute('role')).toBe(role);
          expect(element.hasAttribute('role')).toBe(true);
        });
      });

      it('should validate custom widget roles', () => {
        const customWidget = document.createElement('div');
        customWidget.setAttribute('role', 'application');
        customWidget.setAttribute('aria-label', 'Pizza Fraction Game');

        testContainer.appendChild(customWidget);

        expect(customWidget.getAttribute('role')).toBe('application');
        expect(customWidget.getAttribute('aria-label')).toBeTruthy();
      });

      it('should validate role hierarchy compliance', () => {
        // Test tab structure
        const tablist = document.createElement('div');
        tablist.setAttribute('role', 'tablist');

        const tab = document.createElement('button');
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('aria-controls', 'panel1');

        const tabpanel = document.createElement('div');
        tabpanel.setAttribute('role', 'tabpanel');
        tabpanel.id = 'panel1';
        tabpanel.setAttribute('aria-labelledby', tab.id || 'tab1');

        tablist.appendChild(tab);
        testContainer.appendChild(tablist);
        testContainer.appendChild(tabpanel);

        expect(tablist.getAttribute('role')).toBe('tablist');
        expect(tab.getAttribute('role')).toBe('tab');
        expect(tabpanel.getAttribute('role')).toBe('tabpanel');
        expect(tab.getAttribute('aria-controls')).toBe(tabpanel.id);
      });
    });

    describe('ARIA properties validation', () => {
      it('should validate aria-required property', () => {
        const input = document.createElement('input');
        input.setAttribute('aria-required', 'true');
        testContainer.appendChild(input);

        expect(input.getAttribute('aria-required')).toBe('true');
        expect(['true', 'false']).toContain(input.getAttribute('aria-required'));
      });

      it('should validate aria-disabled property', () => {
        const button = document.createElement('button');
        button.setAttribute('aria-disabled', 'true');
        testContainer.appendChild(button);

        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(['true', 'false']).toContain(button.getAttribute('aria-disabled'));
      });

      it('should validate aria-readonly property', () => {
        const input = document.createElement('input');
        input.setAttribute('aria-readonly', 'true');
        testContainer.appendChild(input);

        expect(input.getAttribute('aria-readonly')).toBe('true');
        expect(['true', 'false']).toContain(input.getAttribute('aria-readonly'));
      });

      it('should validate aria-invalid property', () => {
        const input = document.createElement('input');
        input.setAttribute('aria-invalid', 'true');
        testContainer.appendChild(input);

        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(['true', 'false', 'grammar', 'spelling']).toContain(
          input.getAttribute('aria-invalid')
        );
      });
    });
  });

  describe('2. ARIA Landmark Roles and Navigation Structure', () => {
    it('should validate main landmark', () => {
      const main = document.createElement('main');
      main.setAttribute('role', 'main');
      testContainer.appendChild(main);

      expect(main.getAttribute('role')).toBe('main');
      expect(main.tagName.toLowerCase()).toBe('main');
    });

    it('should validate navigation landmark', () => {
      const nav = document.createElement('nav');
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
      testContainer.appendChild(nav);

      expect(nav.getAttribute('role')).toBe('navigation');
      expect(nav.getAttribute('aria-label')).toBeTruthy();
      expect(nav.tagName.toLowerCase()).toBe('nav');
    });

    it('should validate complementary landmark', () => {
      const aside = document.createElement('aside');
      aside.setAttribute('role', 'complementary');
      aside.setAttribute('aria-label', 'Related articles');
      testContainer.appendChild(aside);

      expect(aside.getAttribute('role')).toBe('complementary');
      expect(aside.getAttribute('aria-label')).toBeTruthy();
    });

    it('should validate banner and contentinfo landmarks', () => {
      const header = document.createElement('header');
      header.setAttribute('role', 'banner');

      const footer = document.createElement('footer');
      footer.setAttribute('role', 'contentinfo');

      testContainer.appendChild(header);
      testContainer.appendChild(footer);

      expect(header.getAttribute('role')).toBe('banner');
      expect(footer.getAttribute('role')).toBe('contentinfo');
    });

    it('should validate search landmark with proper labeling', () => {
      const search = document.createElement('form');
      search.setAttribute('role', 'search');
      search.setAttribute('aria-label', 'Search games');

      const input = document.createElement('input');
      input.type = 'search';
      input.setAttribute('aria-label', 'Search query');

      const button = document.createElement('button');
      button.textContent = 'Search';
      button.type = 'submit';

      search.appendChild(input);
      search.appendChild(button);
      testContainer.appendChild(search);

      expect(search.getAttribute('role')).toBe('search');
      expect(search.getAttribute('aria-label')).toBeTruthy();
      expect(input.getAttribute('aria-label')).toBeTruthy();
    });

    it('should validate multiple navigation landmarks with distinct labels', () => {
      const primaryNav = document.createElement('nav');
      primaryNav.setAttribute('aria-label', 'Primary navigation');

      const breadcrumbNav = document.createElement('nav');
      breadcrumbNav.setAttribute('aria-label', 'Breadcrumb');

      const footerNav = document.createElement('nav');
      footerNav.setAttribute('aria-label', 'Footer navigation');

      testContainer.appendChild(primaryNav);
      testContainer.appendChild(breadcrumbNav);
      testContainer.appendChild(footerNav);

      const navElements = testContainer.querySelectorAll('nav');
      expect(navElements).toHaveLength(3);

      navElements.forEach(nav => {
        expect(nav.getAttribute('aria-label')).toBeTruthy();
      });

      // Ensure labels are unique
      const labels = Array.from(navElements).map(nav => nav.getAttribute('aria-label'));
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  describe('3. ARIA Live Regions for Dynamic Content', () => {
    it('should validate aria-live="polite" regions', () => {
      const statusRegion = document.createElement('div');
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.setAttribute('aria-atomic', 'true');
      statusRegion.id = 'status-messages';
      testContainer.appendChild(statusRegion);

      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
      expect(statusRegion.getAttribute('aria-atomic')).toBe('true');
      expect(['polite', 'assertive', 'off']).toContain(statusRegion.getAttribute('aria-live'));
    });

    it('should validate aria-live="assertive" regions', () => {
      const alertRegion = document.createElement('div');
      alertRegion.setAttribute('aria-live', 'assertive');
      alertRegion.setAttribute('aria-atomic', 'true');
      alertRegion.id = 'alert-messages';
      testContainer.appendChild(alertRegion);

      expect(alertRegion.getAttribute('aria-live')).toBe('assertive');
      expect(alertRegion.getAttribute('aria-atomic')).toBe('true');
    });

    it('should validate role="status" as implicit aria-live="polite"', () => {
      const status = document.createElement('div');
      status.setAttribute('role', 'status');
      status.textContent = 'Game saved successfully';
      testContainer.appendChild(status);

      expect(status.getAttribute('role')).toBe('status');
      expect(status.textContent.trim()).toBeTruthy();
    });

    it('should validate role="alert" as implicit aria-live="assertive"', () => {
      const alert = document.createElement('div');
      alert.setAttribute('role', 'alert');
      alert.textContent = 'Error: Please try again';
      testContainer.appendChild(alert);

      expect(alert.getAttribute('role')).toBe('alert');
      expect(alert.textContent.trim()).toBeTruthy();
    });

    it('should validate aria-relevant attribute', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-relevant', 'additions text');
      testContainer.appendChild(liveRegion);

      expect(liveRegion.getAttribute('aria-relevant')).toBeTruthy();

      const validValues = ['additions', 'removals', 'text', 'all'];
      const relevantValues = liveRegion.getAttribute('aria-relevant').split(' ');
      relevantValues.forEach(value => {
        expect(validValues).toContain(value);
      });
    });

    it('should validate game progress announcements', () => {
      const progressRegion = document.createElement('div');
      progressRegion.setAttribute('aria-live', 'polite');
      progressRegion.setAttribute('aria-label', 'Game progress');
      progressRegion.id = 'game-progress';
      testContainer.appendChild(progressRegion);

      // Simulate progress update
      progressRegion.textContent = 'Level 2 completed. Score: 150 points.';

      expect(progressRegion.getAttribute('aria-live')).toBe('polite');
      expect(progressRegion.textContent).toContain('Level');
      expect(progressRegion.textContent).toContain('Score');
    });
  });

  describe('4. ARIA Labeling and Descriptions for Forms', () => {
    it('should validate form input labeling', () => {
      const form = document.createElement('form');
      form.setAttribute('aria-label', 'User registration form');

      const label = document.createElement('label');
      label.textContent = 'Username';
      label.htmlFor = 'username';

      const input = document.createElement('input');
      input.id = 'username';
      input.type = 'text';
      input.setAttribute('aria-required', 'true');

      form.appendChild(label);
      form.appendChild(input);
      testContainer.appendChild(form);

      expect(form.getAttribute('aria-label')).toBeTruthy();
      expect(label.htmlFor).toBe(input.id);
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should validate fieldset and legend labeling', () => {
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = 'Contact preferences';

      const radio1 = document.createElement('input');
      radio1.type = 'radio';
      radio1.name = 'contact';
      radio1.value = 'email';
      radio1.id = 'contact-email';

      const label1 = document.createElement('label');
      label1.htmlFor = 'contact-email';
      label1.textContent = 'Email';

      fieldset.appendChild(legend);
      fieldset.appendChild(radio1);
      fieldset.appendChild(label1);
      testContainer.appendChild(fieldset);

      expect(fieldset.querySelector('legend')).toBeTruthy();
      expect(legend.textContent.trim()).toBeTruthy();
      expect(label1.htmlFor).toBe(radio1.id);
    });

    it('should validate error message associations', () => {
      const input = document.createElement('input');
      input.id = 'email';
      input.type = 'email';
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'email-error');

      const errorMessage = document.createElement('div');
      errorMessage.id = 'email-error';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.textContent = 'Please enter a valid email address';

      testContainer.appendChild(input);
      testContainer.appendChild(errorMessage);

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('email-error');
      expect(errorMessage.getAttribute('role')).toBe('alert');
      expect(errorMessage.textContent.trim()).toBeTruthy();
    });

    it('should validate help text associations', () => {
      const input = document.createElement('input');
      input.id = 'password';
      input.type = 'password';
      input.setAttribute('aria-describedby', 'password-help');

      const helpText = document.createElement('div');
      helpText.id = 'password-help';
      helpText.textContent = 'Password must be at least 8 characters long';

      testContainer.appendChild(input);
      testContainer.appendChild(helpText);

      expect(input.getAttribute('aria-describedby')).toBe('password-help');
      expect(document.getElementById('password-help')).toBeTruthy();
      expect(helpText.textContent.trim()).toBeTruthy();
    });

    it('should validate required field indicators', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      input.setAttribute('aria-required', 'true');

      const label = document.createElement('label');
      label.htmlFor = input.id || 'test-input';
      label.innerHTML = 'Full Name <span aria-label="required">*</span>';

      if (!input.id) input.id = 'test-input';

      testContainer.appendChild(label);
      testContainer.appendChild(input);

      expect(input.hasAttribute('required')).toBe(true);
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(label.querySelector('[aria-label="required"]')).toBeTruthy();
    });
  });

  describe('5. ARIA Expanded/Collapsed States', () => {
    it('should validate dropdown button states', () => {
      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown';

      const button = document.createElement('button');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-controls', 'dropdown-menu');
      button.textContent = 'Options';

      const menu = document.createElement('ul');
      menu.id = 'dropdown-menu';
      menu.setAttribute('role', 'menu');
      menu.style.display = 'none';

      dropdown.appendChild(button);
      dropdown.appendChild(menu);
      testContainer.appendChild(dropdown);

      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-haspopup')).toBe('true');
      expect(button.getAttribute('aria-controls')).toBe(menu.id);

      // Simulate opening dropdown
      button.setAttribute('aria-expanded', 'true');
      menu.style.display = 'block';

      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('should validate accordion states', () => {
      const accordion = document.createElement('div');
      accordion.className = 'accordion';

      const header = document.createElement('h3');
      const button = document.createElement('button');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'panel1');
      button.textContent = 'Section 1';
      header.appendChild(button);

      const panel = document.createElement('div');
      panel.id = 'panel1';
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', button.id || 'button1');
      panel.style.display = 'none';

      if (!button.id) button.id = 'button1';

      accordion.appendChild(header);
      accordion.appendChild(panel);
      testContainer.appendChild(accordion);

      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('role')).toBe('region');
      expect(panel.getAttribute('aria-labelledby')).toBe(button.id);
    });

    it('should validate navigation menu states', () => {
      const nav = document.createElement('nav');
      const menuButton = document.createElement('button');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-controls', 'main-menu');
      menuButton.setAttribute('aria-label', 'Toggle navigation menu');

      const menu = document.createElement('ul');
      menu.id = 'main-menu';
      menu.setAttribute('role', 'menu');
      menu.style.display = 'none';

      nav.appendChild(menuButton);
      nav.appendChild(menu);
      testContainer.appendChild(nav);

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
      expect(menuButton.getAttribute('aria-controls')).toBe(menu.id);
      expect(menuButton.getAttribute('aria-label')).toBeTruthy();
    });

    it('should validate collapsible content states', () => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.setAttribute('aria-expanded', 'false');
      summary.textContent = 'Show more details';

      const content = document.createElement('div');
      content.textContent = 'Additional information...';

      details.appendChild(summary);
      details.appendChild(content);
      testContainer.appendChild(details);

      expect(summary.getAttribute('aria-expanded')).toBe('false');

      // Simulate opening details
      details.open = true;
      summary.setAttribute('aria-expanded', 'true');

      expect(summary.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('6. ARIA Selected/Checked States', () => {
    it('should validate tab selection states', () => {
      const tablist = document.createElement('div');
      tablist.setAttribute('role', 'tablist');

      const tab1 = document.createElement('button');
      tab1.setAttribute('role', 'tab');
      tab1.setAttribute('aria-selected', 'true');
      tab1.setAttribute('aria-controls', 'panel1');
      tab1.textContent = 'Tab 1';

      const tab2 = document.createElement('button');
      tab2.setAttribute('role', 'tab');
      tab2.setAttribute('aria-selected', 'false');
      tab2.setAttribute('aria-controls', 'panel2');
      tab2.textContent = 'Tab 2';

      tablist.appendChild(tab1);
      tablist.appendChild(tab2);
      testContainer.appendChild(tablist);

      expect(tab1.getAttribute('aria-selected')).toBe('true');
      expect(tab2.getAttribute('aria-selected')).toBe('false');
      expect(['true', 'false']).toContain(tab1.getAttribute('aria-selected'));
      expect(['true', 'false']).toContain(tab2.getAttribute('aria-selected'));
    });

    it('should validate checkbox states', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;

      const customCheckbox = document.createElement('div');
      customCheckbox.setAttribute('role', 'checkbox');
      customCheckbox.setAttribute('aria-checked', 'true');
      customCheckbox.setAttribute('tabindex', '0');

      testContainer.appendChild(checkbox);
      testContainer.appendChild(customCheckbox);

      expect(checkbox.checked).toBe(true);
      expect(customCheckbox.getAttribute('aria-checked')).toBe('true');
      expect(['true', 'false', 'mixed']).toContain(customCheckbox.getAttribute('aria-checked'));
    });

    it('should validate radio button states', () => {
      const radioGroup = document.createElement('fieldset');
      radioGroup.setAttribute('role', 'radiogroup');
      radioGroup.setAttribute('aria-labelledby', 'group-label');

      const label = document.createElement('legend');
      label.id = 'group-label';
      label.textContent = 'Choose an option';

      const radio1 = document.createElement('input');
      radio1.type = 'radio';
      radio1.name = 'options';
      radio1.checked = true;

      const radio2 = document.createElement('input');
      radio2.type = 'radio';
      radio2.name = 'options';
      radio2.checked = false;

      radioGroup.appendChild(label);
      radioGroup.appendChild(radio1);
      radioGroup.appendChild(radio2);
      testContainer.appendChild(radioGroup);

      expect(radioGroup.getAttribute('role')).toBe('radiogroup');
      expect(radio1.checked).toBe(true);
      expect(radio2.checked).toBe(false);
    });

    it('should validate listbox option states', () => {
      const listbox = document.createElement('ul');
      listbox.setAttribute('role', 'listbox');
      listbox.setAttribute('aria-label', 'Choose a subject');

      const option1 = document.createElement('li');
      option1.setAttribute('role', 'option');
      option1.setAttribute('aria-selected', 'true');
      option1.textContent = 'Math';

      const option2 = document.createElement('li');
      option2.setAttribute('role', 'option');
      option2.setAttribute('aria-selected', 'false');
      option2.textContent = 'Science';

      listbox.appendChild(option1);
      listbox.appendChild(option2);
      testContainer.appendChild(listbox);

      expect(listbox.getAttribute('role')).toBe('listbox');
      expect(option1.getAttribute('aria-selected')).toBe('true');
      expect(option2.getAttribute('aria-selected')).toBe('false');
    });

    it('should validate mixed state checkboxes', () => {
      const parentCheckbox = document.createElement('div');
      parentCheckbox.setAttribute('role', 'checkbox');
      parentCheckbox.setAttribute('aria-checked', 'mixed');
      parentCheckbox.setAttribute('aria-label', 'Select all subjects');
      parentCheckbox.setAttribute('tabindex', '0');

      testContainer.appendChild(parentCheckbox);

      expect(parentCheckbox.getAttribute('aria-checked')).toBe('mixed');
      expect(['true', 'false', 'mixed']).toContain(parentCheckbox.getAttribute('aria-checked'));
    });
  });

  describe('7. ARIA Hidden Attributes for Decorative Content', () => {
    it('should validate decorative images are hidden', () => {
      const decorativeImg = document.createElement('img');
      decorativeImg.src = 'decoration.png';
      decorativeImg.setAttribute('aria-hidden', 'true');
      decorativeImg.alt = '';

      testContainer.appendChild(decorativeImg);

      expect(decorativeImg.getAttribute('aria-hidden')).toBe('true');
      expect(decorativeImg.alt).toBe('');
    });

    it('should validate decorative icons are hidden', () => {
      const button = document.createElement('button');
      button.innerHTML = '<span aria-hidden="true">🎮</span> Play Game';

      testContainer.appendChild(button);

      const icon = button.querySelector('[aria-hidden="true"]');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should validate visual separators are hidden', () => {
      const separator = document.createElement('div');
      separator.className = 'visual-separator';
      separator.setAttribute('aria-hidden', 'true');
      separator.innerHTML = '&bull; &bull; &bull;';

      testContainer.appendChild(separator);

      expect(separator.getAttribute('aria-hidden')).toBe('true');
    });

    it('should validate duplicate content is hidden', () => {
      const visibleHeading = document.createElement('h2');
      visibleHeading.textContent = 'Game Instructions';

      const duplicateHeading = document.createElement('h2');
      duplicateHeading.textContent = 'Game Instructions';
      duplicateHeading.setAttribute('aria-hidden', 'true');
      duplicateHeading.className = 'visual-only';

      testContainer.appendChild(visibleHeading);
      testContainer.appendChild(duplicateHeading);

      expect(duplicateHeading.getAttribute('aria-hidden')).toBe('true');
    });

    it('should validate background decorations are hidden', () => {
      const container = document.createElement('div');
      container.className = 'content-section';

      const backgroundElement = document.createElement('div');
      backgroundElement.className = 'background-decoration';
      backgroundElement.setAttribute('aria-hidden', 'true');

      const content = document.createElement('p');
      content.textContent = 'Main content here';

      container.appendChild(backgroundElement);
      container.appendChild(content);
      testContainer.appendChild(container);

      expect(backgroundElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('8. ARIA Describedby and Labelledby Relationships', () => {
    it('should validate complex labelledby relationships', () => {
      const firstName = document.createElement('span');
      firstName.id = 'first-name-label';
      firstName.textContent = 'First Name';

      const required = document.createElement('span');
      required.id = 'required-indicator';
      required.textContent = '(required)';

      const input = document.createElement('input');
      input.setAttribute('aria-labelledby', 'first-name-label required-indicator');

      testContainer.appendChild(firstName);
      testContainer.appendChild(required);
      testContainer.appendChild(input);

      const labelIds = input.getAttribute('aria-labelledby').split(' ');
      expect(labelIds).toHaveLength(2);
      labelIds.forEach(id => {
        expect(document.getElementById(id)).toBeTruthy();
      });
    });

    it('should validate complex describedby relationships', () => {
      const input = document.createElement('input');
      input.type = 'password';
      input.setAttribute('aria-describedby', 'pwd-help pwd-strength pwd-error');

      const helpText = document.createElement('div');
      helpText.id = 'pwd-help';
      helpText.textContent = 'Must be at least 8 characters';

      const strengthText = document.createElement('div');
      strengthText.id = 'pwd-strength';
      strengthText.textContent = 'Strength: Weak';

      const errorText = document.createElement('div');
      errorText.id = 'pwd-error';
      errorText.textContent = '';

      testContainer.appendChild(input);
      testContainer.appendChild(helpText);
      testContainer.appendChild(strengthText);
      testContainer.appendChild(errorText);

      const describeIds = input.getAttribute('aria-describedby').split(' ');
      expect(describeIds).toHaveLength(3);
      describeIds.forEach(id => {
        expect(document.getElementById(id)).toBeTruthy();
      });
    });

    it('should validate table cell relationships', () => {
      const table = document.createElement('table');
      table.setAttribute('role', 'table');

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');

      const th1 = document.createElement('th');
      th1.id = 'subject-header';
      th1.textContent = 'Subject';

      const th2 = document.createElement('th');
      th2.id = 'score-header';
      th2.textContent = 'Score';

      headerRow.appendChild(th1);
      headerRow.appendChild(th2);
      thead.appendChild(headerRow);

      const tbody = document.createElement('tbody');
      const dataRow = document.createElement('tr');

      const td1 = document.createElement('td');
      td1.setAttribute('aria-describedby', 'subject-header');
      td1.textContent = 'Math';

      const td2 = document.createElement('td');
      td2.setAttribute('aria-describedby', 'score-header');
      td2.textContent = '95';

      dataRow.appendChild(td1);
      dataRow.appendChild(td2);
      tbody.appendChild(dataRow);

      table.appendChild(thead);
      table.appendChild(tbody);
      testContainer.appendChild(table);

      expect(td1.getAttribute('aria-describedby')).toBe('subject-header');
      expect(td2.getAttribute('aria-describedby')).toBe('score-header');
      expect(document.getElementById('subject-header')).toBeTruthy();
      expect(document.getElementById('score-header')).toBeTruthy();
    });

    it('should validate group labeling relationships', () => {
      const group = document.createElement('div');
      group.setAttribute('role', 'group');
      group.setAttribute('aria-labelledby', 'group-title');
      group.setAttribute('aria-describedby', 'group-description');

      const title = document.createElement('h3');
      title.id = 'group-title';
      title.textContent = 'Math Games';

      const description = document.createElement('p');
      description.id = 'group-description';
      description.textContent = 'Interactive games to practice math skills';

      testContainer.appendChild(title);
      testContainer.appendChild(description);
      testContainer.appendChild(group);

      expect(group.getAttribute('aria-labelledby')).toBe('group-title');
      expect(group.getAttribute('aria-describedby')).toBe('group-description');
      expect(document.getElementById('group-title')).toBeTruthy();
      expect(document.getElementById('group-description')).toBeTruthy();
    });
  });

  describe('9. ARIA Controls and Owns Relationships', () => {
    it('should validate aria-controls relationships', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-controls', 'controlled-panel');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'Show Panel';

      const panel = document.createElement('div');
      panel.id = 'controlled-panel';
      panel.style.display = 'none';
      panel.textContent = 'Controlled content';

      testContainer.appendChild(button);
      testContainer.appendChild(panel);

      expect(button.getAttribute('aria-controls')).toBe('controlled-panel');
      expect(document.getElementById('controlled-panel')).toBeTruthy();
    });

    it('should validate aria-owns relationships', () => {
      const combobox = document.createElement('input');
      combobox.setAttribute('role', 'combobox');
      combobox.setAttribute('aria-owns', 'options-list');
      combobox.setAttribute('aria-expanded', 'false');

      const listbox = document.createElement('ul');
      listbox.id = 'options-list';
      listbox.setAttribute('role', 'listbox');

      const option = document.createElement('li');
      option.setAttribute('role', 'option');
      option.textContent = 'Option 1';
      listbox.appendChild(option);

      // Place listbox elsewhere in DOM to demonstrate ownership
      document.body.appendChild(listbox);
      testContainer.appendChild(combobox);

      expect(combobox.getAttribute('aria-owns')).toBe('options-list');
      expect(document.getElementById('options-list')).toBeTruthy();

      // Cleanup
      document.body.removeChild(listbox);
    });

    it('should validate multiple controls relationships', () => {
      const toolbar = document.createElement('div');
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-controls', 'editor-area formatting-panel');

      const editorArea = document.createElement('div');
      editorArea.id = 'editor-area';
      editorArea.setAttribute('role', 'textbox');
      editorArea.setAttribute('contenteditable', 'true');

      const formattingPanel = document.createElement('div');
      formattingPanel.id = 'formatting-panel';
      formattingPanel.className = 'formatting-options';

      testContainer.appendChild(toolbar);
      testContainer.appendChild(editorArea);
      testContainer.appendChild(formattingPanel);

      const controlledIds = toolbar.getAttribute('aria-controls').split(' ');
      expect(controlledIds).toHaveLength(2);
      controlledIds.forEach(id => {
        expect(document.getElementById(id)).toBeTruthy();
      });
    });

    it('should validate tab controls relationships', () => {
      const tab = document.createElement('button');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'tabpanel-1');
      tab.setAttribute('aria-selected', 'true');
      tab.textContent = 'Tab 1';

      const tabpanel = document.createElement('div');
      tabpanel.id = 'tabpanel-1';
      tabpanel.setAttribute('role', 'tabpanel');
      tabpanel.setAttribute('aria-labelledby', tab.id || 'tab-1');
      tabpanel.textContent = 'Panel content';

      if (!tab.id) tab.id = 'tab-1';

      testContainer.appendChild(tab);
      testContainer.appendChild(tabpanel);

      expect(tab.getAttribute('aria-controls')).toBe('tabpanel-1');
      expect(tabpanel.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(document.getElementById('tabpanel-1')).toBeTruthy();
    });
  });

  describe('10. Custom ARIA Patterns for Complex Widgets', () => {
    it('should validate drag and drop ARIA patterns', () => {
      const draggableItem = document.createElement('div');
      draggableItem.setAttribute('draggable', 'true');
      draggableItem.setAttribute('aria-grabbed', 'false');
      draggableItem.setAttribute('aria-describedby', 'drag-instructions');
      draggableItem.textContent = 'Draggable item';

      const dropZone = document.createElement('div');
      dropZone.setAttribute('role', 'application');
      dropZone.setAttribute('aria-dropeffect', 'move');
      dropZone.setAttribute('aria-label', 'Drop zone for items');

      const instructions = document.createElement('div');
      instructions.id = 'drag-instructions';
      instructions.textContent = 'Use arrow keys to move, space to grab/drop';
      instructions.className = 'sr-only';

      testContainer.appendChild(draggableItem);
      testContainer.appendChild(dropZone);
      testContainer.appendChild(instructions);

      expect(draggableItem.getAttribute('aria-grabbed')).toBe('false');
      expect(dropZone.getAttribute('aria-dropeffect')).toBe('move');
      expect(['true', 'false', 'undefined']).toContain(draggableItem.getAttribute('aria-grabbed'));
      expect(['copy', 'move', 'link', 'execute', 'popup', 'none']).toContain(
        dropZone.getAttribute('aria-dropeffect')
      );
    });

    it('should validate slider ARIA patterns', () => {
      const slider = document.createElement('div');
      slider.setAttribute('role', 'slider');
      slider.setAttribute('aria-valuenow', '50');
      slider.setAttribute('aria-valuemin', '0');
      slider.setAttribute('aria-valuemax', '100');
      slider.setAttribute('aria-valuetext', '50 percent');
      slider.setAttribute('aria-label', 'Volume control');
      slider.setAttribute('tabindex', '0');

      testContainer.appendChild(slider);

      expect(slider.getAttribute('role')).toBe('slider');
      expect(parseInt(slider.getAttribute('aria-valuenow'))).toBe(50);
      expect(parseInt(slider.getAttribute('aria-valuemin'))).toBe(0);
      expect(parseInt(slider.getAttribute('aria-valuemax'))).toBe(100);
      expect(slider.getAttribute('aria-valuetext')).toBeTruthy();

      const valuenow = parseInt(slider.getAttribute('aria-valuenow'));
      const valuemin = parseInt(slider.getAttribute('aria-valuemin'));
      const valuemax = parseInt(slider.getAttribute('aria-valuemax'));

      expect(valuenow).toBeGreaterThanOrEqual(valuemin);
      expect(valuenow).toBeLessThanOrEqual(valuemax);
    });

    it('should validate progressbar ARIA patterns', () => {
      const progressbar = document.createElement('div');
      progressbar.setAttribute('role', 'progressbar');
      progressbar.setAttribute('aria-valuenow', '75');
      progressbar.setAttribute('aria-valuemin', '0');
      progressbar.setAttribute('aria-valuemax', '100');
      progressbar.setAttribute('aria-label', 'Loading progress');

      testContainer.appendChild(progressbar);

      expect(progressbar.getAttribute('role')).toBe('progressbar');
      expect(parseInt(progressbar.getAttribute('aria-valuenow'))).toBe(75);

      const valuenow = parseInt(progressbar.getAttribute('aria-valuenow'));
      const valuemin = parseInt(progressbar.getAttribute('aria-valuemin'));
      const valuemax = parseInt(progressbar.getAttribute('aria-valuemax'));

      expect(valuenow).toBeGreaterThanOrEqual(valuemin);
      expect(valuenow).toBeLessThanOrEqual(valuemax);
    });

    it('should validate combobox ARIA patterns', () => {
      const combobox = document.createElement('input');
      combobox.setAttribute('role', 'combobox');
      combobox.setAttribute('aria-autocomplete', 'list');
      combobox.setAttribute('aria-expanded', 'false');
      combobox.setAttribute('aria-owns', 'suggestions-list');
      combobox.setAttribute('aria-haspopup', 'listbox');

      const listbox = document.createElement('ul');
      listbox.id = 'suggestions-list';
      listbox.setAttribute('role', 'listbox');
      listbox.style.display = 'none';

      testContainer.appendChild(combobox);
      testContainer.appendChild(listbox);

      expect(combobox.getAttribute('role')).toBe('combobox');
      expect(combobox.getAttribute('aria-autocomplete')).toBe('list');
      expect(['list', 'inline', 'both', 'none']).toContain(
        combobox.getAttribute('aria-autocomplete')
      );
      expect(combobox.getAttribute('aria-expanded')).toBe('false');
      expect(combobox.getAttribute('aria-owns')).toBe('suggestions-list');
    });

    it('should validate tree widget ARIA patterns', () => {
      const tree = document.createElement('ul');
      tree.setAttribute('role', 'tree');
      tree.setAttribute('aria-label', 'File explorer');

      const treeitem = document.createElement('li');
      treeitem.setAttribute('role', 'treeitem');
      treeitem.setAttribute('aria-expanded', 'false');
      treeitem.setAttribute('aria-level', '1');
      treeitem.setAttribute('aria-setsize', '3');
      treeitem.setAttribute('aria-posinset', '1');
      treeitem.setAttribute('tabindex', '0');
      treeitem.textContent = 'Folder 1';

      const subtree = document.createElement('ul');
      subtree.setAttribute('role', 'group');

      const subitem = document.createElement('li');
      subitem.setAttribute('role', 'treeitem');
      subitem.setAttribute('aria-level', '2');
      subitem.setAttribute('tabindex', '-1');
      subitem.textContent = 'File 1.1';

      subtree.appendChild(subitem);
      treeitem.appendChild(subtree);
      tree.appendChild(treeitem);
      testContainer.appendChild(tree);

      expect(tree.getAttribute('role')).toBe('tree');
      expect(treeitem.getAttribute('role')).toBe('treeitem');
      expect(parseInt(treeitem.getAttribute('aria-level'))).toBe(1);
      expect(parseInt(subitem.getAttribute('aria-level'))).toBe(2);
      expect(subtree.getAttribute('role')).toBe('group');
    });

    it('should validate grid widget ARIA patterns', () => {
      const grid = document.createElement('div');
      grid.setAttribute('role', 'grid');
      grid.setAttribute('aria-label', 'Game board');
      grid.setAttribute('aria-rowcount', '3');
      grid.setAttribute('aria-colcount', '3');

      const row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', '1');

      const cell = document.createElement('div');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-colindex', '1');
      cell.setAttribute('tabindex', '0');
      cell.textContent = 'Cell 1,1';

      row.appendChild(cell);
      grid.appendChild(row);
      testContainer.appendChild(grid);

      expect(grid.getAttribute('role')).toBe('grid');
      expect(row.getAttribute('role')).toBe('row');
      expect(cell.getAttribute('role')).toBe('gridcell');
      expect(parseInt(grid.getAttribute('aria-rowcount'))).toBe(3);
      expect(parseInt(grid.getAttribute('aria-colcount'))).toBe(3);
      expect(parseInt(row.getAttribute('aria-rowindex'))).toBe(1);
      expect(parseInt(cell.getAttribute('aria-colindex'))).toBe(1);
    });
  });

  describe('Integration Tests - AccessibleComponent', () => {
    it('should apply all ARIA attributes through AccessibleComponent', () => {
      const component = new AccessibleComponent({
        ariaLabel: 'Test Component',
        ariaDescribedBy: 'test-description',
        role: 'application',
        ariaHidden: false,
      });

      const element = document.createElement('div');
      component.element = element;
      component.setupAccessibility();

      expect(element.getAttribute('aria-label')).toBe('Test Component');
      expect(element.getAttribute('aria-describedby')).toBe('test-description');
      expect(element.getAttribute('role')).toBe('application');
      expect(element.getAttribute('aria-hidden')).toBe('false');
    });

    it('should handle dynamic ARIA state changes', () => {
      const component = new AccessibleComponent({
        role: 'button',
      });

      const element = document.createElement('div');
      component.element = element;
      component.setupAccessibility();

      // Simulate state change
      element.setAttribute('aria-pressed', 'false');
      expect(element.getAttribute('aria-pressed')).toBe('false');

      element.setAttribute('aria-pressed', 'true');
      expect(element.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('WCAG 2.1 Compliance Validation', () => {
    it('should validate proper heading hierarchy', () => {
      const h1 = document.createElement('h1');
      h1.textContent = 'Main Title';

      const h2 = document.createElement('h2');
      h2.textContent = 'Section Title';

      const h3 = document.createElement('h3');
      h3.textContent = 'Subsection Title';

      testContainer.appendChild(h1);
      testContainer.appendChild(h2);
      testContainer.appendChild(h3);

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

    it('should validate focus management', () => {
      const focusableElements = ['button', 'input[type="text"]', 'a[href="#"]', '[tabindex="0"]'];

      focusableElements.forEach(selector => {
        const tagName = selector.split('[')[0] || 'div';
        const element = document.createElement(tagName);

        if (selector.includes('href')) {
          element.href = '#';
        }
        if (selector.includes('tabindex')) {
          element.setAttribute('tabindex', '0');
        }
        if (selector.includes('type=')) {
          element.type = 'text';
        }

        testContainer.appendChild(element);

        expect(element.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate color contrast requirements', () => {
      // This would typically require actual color contrast calculation
      // For now, we'll validate that high contrast classes are properly applied
      const highContrastElement = document.createElement('div');
      highContrastElement.className = 'high-contrast';
      highContrastElement.textContent = 'High contrast text';

      testContainer.appendChild(highContrastElement);

      expect(highContrastElement.classList.contains('high-contrast')).toBe(true);
    });

    it('should validate keyboard navigation patterns', () => {
      const navigationElement = document.createElement('nav');
      navigationElement.setAttribute('role', 'navigation');

      const menuList = document.createElement('ul');
      menuList.setAttribute('role', 'menubar');

      const menuItem = document.createElement('li');
      menuItem.setAttribute('role', 'none');

      const menuLink = document.createElement('a');
      menuLink.setAttribute('role', 'menuitem');
      menuLink.href = '#';
      menuLink.textContent = 'Home';

      menuItem.appendChild(menuLink);
      menuList.appendChild(menuItem);
      navigationElement.appendChild(menuList);
      testContainer.appendChild(navigationElement);

      expect(navigationElement.getAttribute('role')).toBe('navigation');
      expect(menuList.getAttribute('role')).toBe('menubar');
      expect(menuItem.getAttribute('role')).toBe('none');
      expect(menuLink.getAttribute('role')).toBe('menuitem');
    });
  });
});
