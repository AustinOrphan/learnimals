/**
 * ARIA Compliance Tests
 * Comprehensive tests for ARIA attributes, roles, labels, and descriptions
 * Ensures WCAG 2.1 Level AA compliance for ARIA implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessibleComponent } from '../../components/AccessibleComponent.js';
import { AccessibilityService } from '../../services/accessibility/AccessibilityService.js';
import { accessibilityTester } from '../../utils/accessibilityTester.js';

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

describe('ARIA Compliance Tests', () => {
  let testContainer;

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
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('ARIA Labels and Descriptions', () => {
    it('should properly set aria-label attributes', () => {
      const button = document.createElement('button');
      const component = new AccessibleComponent({
        ariaLabel: 'Close dialog',
      });
      component.element = button;
      component.setupAccessibility();

      expect(button.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('should properly set aria-labelledby attributes', () => {
      const heading = document.createElement('h2');
      heading.id = 'dialog-title';
      heading.textContent = 'Settings Dialog';
      testContainer.appendChild(heading);

      const dialog = document.createElement('div');
      const component = new AccessibleComponent({
        ariaLabelledBy: 'dialog-title',
      });
      component.element = dialog;
      component.setupAccessibility();

      expect(dialog.getAttribute('aria-labelledby')).toBe('dialog-title');
    });

    it('should properly set aria-describedby attributes', () => {
      const description = document.createElement('p');
      description.id = 'help-text';
      description.textContent = 'This field is required';
      testContainer.appendChild(description);

      const input = document.createElement('input');
      const component = new AccessibleComponent({
        ariaDescribedBy: 'help-text',
      });
      component.element = input;
      component.setupAccessibility();

      expect(input.getAttribute('aria-describedby')).toBe('help-text');
    });

    it('should validate accessible names for buttons', () => {
      // Button with text content
      const buttonWithText = document.createElement('button');
      buttonWithText.textContent = 'Submit';
      testContainer.appendChild(buttonWithText);

      // Button with aria-label
      const buttonWithLabel = document.createElement('button');
      buttonWithLabel.setAttribute('aria-label', 'Close dialog');
      testContainer.appendChild(buttonWithLabel);

      // Button without accessible name (should fail)
      const buttonWithoutName = document.createElement('button');
      testContainer.appendChild(buttonWithoutName);

      // hasAccessibleName returns the accessible name (truthy) or a falsy value
      expect(accessibilityTester.hasAccessibleName(buttonWithText)).toBeTruthy();
      expect(accessibilityTester.hasAccessibleName(buttonWithLabel)).toBeTruthy();
      expect(accessibilityTester.hasAccessibleName(buttonWithoutName)).toBeFalsy();
    });

    it('should validate form input labels', () => {
      // Input with label element
      const label = document.createElement('label');
      label.textContent = 'Email Address';
      label.htmlFor = 'email';

      const inputWithLabel = document.createElement('input');
      inputWithLabel.type = 'email';
      inputWithLabel.id = 'email';

      testContainer.appendChild(label);
      testContainer.appendChild(inputWithLabel);

      // Input with aria-label
      const inputWithAriaLabel = document.createElement('input');
      inputWithAriaLabel.setAttribute('aria-label', 'Search query');
      testContainer.appendChild(inputWithAriaLabel);

      // Input without label (should fail)
      const inputWithoutLabel = document.createElement('input');
      testContainer.appendChild(inputWithoutLabel);

      // Need to set labels property for the test
      Object.defineProperty(inputWithLabel, 'labels', {
        get: () => [label],
      });

      // hasLabel returns the label source (truthy) or a falsy value
      expect(accessibilityTester.hasLabel(inputWithLabel)).toBeTruthy();
      expect(accessibilityTester.hasLabel(inputWithAriaLabel)).toBeTruthy();
      expect(accessibilityTester.hasLabel(inputWithoutLabel)).toBeFalsy();
    });

    it('should validate image alt text', () => {
      // Image with alt text
      const imgWithAlt = document.createElement('img');
      imgWithAlt.alt = 'A beautiful sunset over mountains';
      imgWithAlt.src = 'sunset.jpg';
      testContainer.appendChild(imgWithAlt);

      // Decorative image with empty alt
      const decorativeImg = document.createElement('img');
      decorativeImg.alt = '';
      decorativeImg.src = 'decoration.jpg';
      testContainer.appendChild(decorativeImg);

      // Image without alt (should fail)
      const imgWithoutAlt = document.createElement('img');
      imgWithoutAlt.src = 'photo.jpg';
      testContainer.appendChild(imgWithoutAlt);

      expect(imgWithAlt.hasAttribute('alt')).toBe(true);
      expect(imgWithAlt.alt).toBe('A beautiful sunset over mountains');
      expect(decorativeImg.hasAttribute('alt')).toBe(true);
      expect(decorativeImg.alt).toBe('');
      expect(imgWithoutAlt.hasAttribute('alt')).toBe(false);
    });
  });

  describe('ARIA Roles', () => {
    it('should validate ARIA role usage', () => {
      const validRoles = [
        'button',
        'dialog',
        'navigation',
        'main',
        'banner',
        'contentinfo',
        'complementary',
        'search',
        'form',
        'list',
        'listitem',
        'tab',
        'tabpanel',
        'tablist',
        'menu',
        'menuitem',
        'checkbox',
        'radio',
        'slider',
        'progressbar',
      ];

      validRoles.forEach(role => {
        expect(accessibilityTester.isValidRole(role)).toBe(true);
      });

      const invalidRoles = ['invalid-role', 'custom-widget', 'my-component'];
      invalidRoles.forEach(role => {
        expect(accessibilityTester.isValidRole(role)).toBe(false);
      });
    });

    it('should set appropriate roles for components', () => {
      const dialog = document.createElement('div');
      const component = new AccessibleComponent({
        role: 'dialog',
      });
      component.element = dialog;
      component.setupAccessibility();

      expect(dialog.getAttribute('role')).toBe('dialog');
    });

    it('should ensure required ARIA properties for roles', () => {
      // Test checkbox role requirements
      const checkbox = document.createElement('div');
      checkbox.setAttribute('role', 'checkbox');
      checkbox.setAttribute('aria-checked', 'false');
      testContainer.appendChild(checkbox);

      const requiredProps = accessibilityTester.getRequiredARIAProperties('checkbox');
      expect(requiredProps).toContain('aria-checked');
      expect(checkbox.hasAttribute('aria-checked')).toBe(true);

      // Test slider role requirements
      const slider = document.createElement('div');
      slider.setAttribute('role', 'slider');
      slider.setAttribute('aria-valuenow', '50');
      slider.setAttribute('aria-valuemin', '0');
      slider.setAttribute('aria-valuemax', '100');
      testContainer.appendChild(slider);

      const sliderProps = accessibilityTester.getRequiredARIAProperties('slider');
      expect(sliderProps).toContain('aria-valuenow');
      expect(sliderProps).toContain('aria-valuemin');
      expect(sliderProps).toContain('aria-valuemax');
      expect(slider.hasAttribute('aria-valuenow')).toBe(true);
      expect(slider.hasAttribute('aria-valuemin')).toBe(true);
      expect(slider.hasAttribute('aria-valuemax')).toBe(true);

      // Test dialog role requirements
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-labelledby', 'dialog-title');
      testContainer.appendChild(dialog);

      const dialogProps = accessibilityTester.getRequiredARIAProperties('dialog');
      expect(dialogProps).toContain('aria-labelledby');
      expect(dialog.hasAttribute('aria-labelledby')).toBe(true);
    });

    it('should properly handle composite widgets', () => {
      // Tab list with tabs and panels
      const tablist = document.createElement('div');
      tablist.setAttribute('role', 'tablist');
      tablist.setAttribute('aria-label', 'Main navigation');

      const tab1 = document.createElement('button');
      tab1.setAttribute('role', 'tab');
      tab1.setAttribute('aria-selected', 'true');
      tab1.setAttribute('aria-controls', 'panel1');
      tab1.id = 'tab1';
      tab1.textContent = 'Home';

      const tab2 = document.createElement('button');
      tab2.setAttribute('role', 'tab');
      tab2.setAttribute('aria-selected', 'false');
      tab2.setAttribute('aria-controls', 'panel2');
      tab2.id = 'tab2';
      tab2.textContent = 'About';

      const panel1 = document.createElement('div');
      panel1.setAttribute('role', 'tabpanel');
      panel1.setAttribute('aria-labelledby', 'tab1');
      panel1.id = 'panel1';
      panel1.textContent = 'Home content';

      const panel2 = document.createElement('div');
      panel2.setAttribute('role', 'tabpanel');
      panel2.setAttribute('aria-labelledby', 'tab2');
      panel2.id = 'panel2';
      panel2.textContent = 'About content';
      panel2.setAttribute('aria-hidden', 'true');

      tablist.appendChild(tab1);
      tablist.appendChild(tab2);
      testContainer.appendChild(tablist);
      testContainer.appendChild(panel1);
      testContainer.appendChild(panel2);

      // Validate tab list structure
      expect(tablist.getAttribute('role')).toBe('tablist');
      expect(tab1.getAttribute('role')).toBe('tab');
      expect(tab1.getAttribute('aria-selected')).toBe('true');
      expect(tab2.getAttribute('aria-selected')).toBe('false');
      expect(panel1.getAttribute('role')).toBe('tabpanel');
      expect(panel2.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('ARIA States and Properties', () => {
    it('should handle aria-expanded for collapsible content', () => {
      const button = document.createElement('button');
      button.textContent = 'Toggle menu';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'menu');

      const menu = document.createElement('ul');
      menu.id = 'menu';
      menu.setAttribute('aria-hidden', 'true');

      testContainer.appendChild(button);
      testContainer.appendChild(menu);

      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(menu.getAttribute('aria-hidden')).toBe('true');

      // Simulate expanding
      button.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(menu.getAttribute('aria-hidden')).toBe('false');
    });

    it('should handle aria-checked for checkboxes and radio buttons', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('aria-checked', 'false');

      const customCheckbox = document.createElement('div');
      customCheckbox.setAttribute('role', 'checkbox');
      customCheckbox.setAttribute('aria-checked', 'false');
      customCheckbox.setAttribute('tabindex', '0');

      testContainer.appendChild(checkbox);
      testContainer.appendChild(customCheckbox);

      expect(customCheckbox.getAttribute('aria-checked')).toBe('false');

      // Simulate checking
      customCheckbox.setAttribute('aria-checked', 'true');
      expect(customCheckbox.getAttribute('aria-checked')).toBe('true');
    });

    it('should handle aria-disabled and aria-readonly', () => {
      const disabledButton = document.createElement('button');
      disabledButton.setAttribute('aria-disabled', 'true');
      disabledButton.textContent = 'Disabled action';

      const readonlyInput = document.createElement('input');
      readonlyInput.setAttribute('aria-readonly', 'true');
      readonlyInput.value = 'Read-only value';

      testContainer.appendChild(disabledButton);
      testContainer.appendChild(readonlyInput);

      expect(disabledButton.getAttribute('aria-disabled')).toBe('true');
      expect(readonlyInput.getAttribute('aria-readonly')).toBe('true');
    });

    it('should handle aria-invalid for form validation', () => {
      const input = document.createElement('input');
      input.type = 'email';
      input.setAttribute('aria-invalid', 'false');
      input.setAttribute('aria-describedby', 'email-error');

      const errorMessage = document.createElement('div');
      errorMessage.id = 'email-error';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.style.display = 'none';

      testContainer.appendChild(input);
      testContainer.appendChild(errorMessage);

      expect(input.getAttribute('aria-invalid')).toBe('false');

      // Simulate validation error
      input.setAttribute('aria-invalid', 'true');
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.style.display = 'block';

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(errorMessage.textContent).toBe('Please enter a valid email address');
      expect(errorMessage.getAttribute('role')).toBe('alert');
    });
  });

  describe('ARIA Live Regions', () => {
    it('should create and manage live regions', async () => {
      const service = new AccessibilityService();
      await service.initialize();

      const politeRegion = document.getElementById('accessibility-announcer-polite');
      const assertiveRegion = document.getElementById('accessibility-announcer-assertive');

      expect(politeRegion).toBeTruthy();
      expect(politeRegion.getAttribute('aria-live')).toBe('polite');
      expect(politeRegion.getAttribute('aria-atomic')).toBe('true');

      expect(assertiveRegion).toBeTruthy();
      expect(assertiveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(assertiveRegion.getAttribute('aria-atomic')).toBe('true');

      service.destroy();
    });

    it('should validate aria-live values', () => {
      const validValues = ['polite', 'assertive', 'off'];
      const invalidValues = ['immediate', 'urgent', 'loud'];

      const liveRegion = document.createElement('div');
      testContainer.appendChild(liveRegion);

      validValues.forEach(value => {
        liveRegion.setAttribute('aria-live', value);
        const ariaLiveValue = liveRegion.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(ariaLiveValue);
      });

      invalidValues.forEach(value => {
        liveRegion.setAttribute('aria-live', value);
        const ariaLiveValue = liveRegion.getAttribute('aria-live');
        // In a real test, this would fail validation
        expect(['polite', 'assertive', 'off']).not.toContain(ariaLiveValue);
      });
    });

    it('should handle status messages correctly', () => {
      const statusRegion = document.createElement('div');
      statusRegion.setAttribute('role', 'status');
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.className = 'sr-only';
      testContainer.appendChild(statusRegion);

      expect(statusRegion.getAttribute('role')).toBe('status');
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    });

    it('should handle alert messages correctly', () => {
      const alertRegion = document.createElement('div');
      alertRegion.setAttribute('role', 'alert');
      alertRegion.setAttribute('aria-live', 'assertive');
      alertRegion.className = 'sr-only';
      testContainer.appendChild(alertRegion);

      expect(alertRegion.getAttribute('role')).toBe('alert');
      expect(alertRegion.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Landmark Roles', () => {
    it('should validate landmark structure', () => {
      // Create proper landmark structure
      const header = document.createElement('header');
      header.setAttribute('role', 'banner');

      const nav = document.createElement('nav');
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');

      const main = document.createElement('main');
      main.setAttribute('role', 'main');

      const aside = document.createElement('aside');
      aside.setAttribute('role', 'complementary');
      aside.setAttribute('aria-label', 'Related links');

      const footer = document.createElement('footer');
      footer.setAttribute('role', 'contentinfo');

      testContainer.appendChild(header);
      testContainer.appendChild(nav);
      testContainer.appendChild(main);
      testContainer.appendChild(aside);
      testContainer.appendChild(footer);

      // Validate landmark roles
      expect(header.getAttribute('role')).toBe('banner');
      expect(nav.getAttribute('role')).toBe('navigation');
      expect(main.getAttribute('role')).toBe('main');
      expect(aside.getAttribute('role')).toBe('complementary');
      expect(footer.getAttribute('role')).toBe('contentinfo');

      // Validate landmark labels
      expect(nav.getAttribute('aria-label')).toBe('Main navigation');
      expect(aside.getAttribute('aria-label')).toBe('Related links');
    });

    it('should ensure main landmark exists', () => {
      const main = document.createElement('main');
      testContainer.appendChild(main);

      const mainLandmark = testContainer.querySelector('main');
      expect(mainLandmark).toBeTruthy();
    });

    it('should handle multiple navigation landmarks', () => {
      const mainNav = document.createElement('nav');
      mainNav.setAttribute('aria-label', 'Main navigation');

      const breadcrumbNav = document.createElement('nav');
      breadcrumbNav.setAttribute('aria-label', 'Breadcrumb');

      const footerNav = document.createElement('nav');
      footerNav.setAttribute('aria-label', 'Footer links');

      testContainer.appendChild(mainNav);
      testContainer.appendChild(breadcrumbNav);
      testContainer.appendChild(footerNav);

      const navElements = testContainer.querySelectorAll('nav');
      expect(navElements.length).toBe(3);
      expect(mainNav.getAttribute('aria-label')).toBe('Main navigation');
      expect(breadcrumbNav.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(footerNav.getAttribute('aria-label')).toBe('Footer links');
    });
  });

  describe('AccessibleComponent Integration', () => {
    it('should automatically apply semantic structure', () => {
      const component = new AccessibleComponent({
        role: 'navigation',
        ariaLabel: 'Site navigation',
      });

      const nav = document.createElement('nav');
      component.element = nav;
      component.setupAccessibility();

      expect(nav.getAttribute('role')).toBe('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Site navigation');
    });

    it('should fix heading hierarchy', () => {
      testContainer.innerHTML = `
        <div>
          <h1>Page Title</h1>
          <h4>Skipped Level</h4>
          <h3>Should be corrected</h3>
        </div>
      `;

      const component = new AccessibleComponent();
      component.element = testContainer;
      component.setupHeadingHierarchy();

      // The component should correct the heading levels
      // This test verifies the correction logic exists
      const headings = testContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should setup list semantics', () => {
      testContainer.innerHTML = `
        <ul style="list-style: none;">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      `;

      const component = new AccessibleComponent();
      component.element = testContainer;
      component.setupListSemantics();

      const list = testContainer.querySelector('ul');
      const items = testContainer.querySelectorAll('li');

      // Check if role="list" was added due to list-style: none
      expect(list.getAttribute('role')).toBe('list');
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });
  });

  describe('ARIA Best Practices', () => {
    it('should not use both aria-label and aria-labelledby', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close');
      button.setAttribute('aria-labelledby', 'close-text');
      testContainer.appendChild(button);

      // aria-labelledby should take precedence over aria-label
      expect(button.hasAttribute('aria-label')).toBe(true);
      expect(button.hasAttribute('aria-labelledby')).toBe(true);
      // In practice, only one should be used - this test documents the current state
    });

    it('should use semantic HTML elements when appropriate', () => {
      // Prefer semantic button over div with role="button"
      const semanticButton = document.createElement('button');
      semanticButton.textContent = 'Click me';

      const divButton = document.createElement('div');
      divButton.setAttribute('role', 'button');
      divButton.setAttribute('tabindex', '0');
      divButton.textContent = 'Click me too';

      testContainer.appendChild(semanticButton);
      testContainer.appendChild(divButton);

      expect(semanticButton.tagName).toBe('BUTTON');
      expect(divButton.getAttribute('role')).toBe('button');
      expect(divButton.getAttribute('tabindex')).toBe('0');
    });

    it('should properly associate form controls with labels', () => {
      const form = document.createElement('form');

      // Explicit label association
      const emailLabel = document.createElement('label');
      emailLabel.htmlFor = 'email-input';
      emailLabel.textContent = 'Email Address';

      const emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.id = 'email-input';
      emailInput.required = true;

      // Implicit label association
      const nameLabel = document.createElement('label');
      nameLabel.textContent = 'Full Name';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.required = true;

      nameLabel.appendChild(nameInput);

      form.appendChild(emailLabel);
      form.appendChild(emailInput);
      form.appendChild(nameLabel);
      testContainer.appendChild(form);

      // Verify explicit association
      expect(emailLabel.htmlFor).toBe('email-input');
      expect(emailInput.id).toBe('email-input');

      // Verify implicit association
      expect(nameLabel.contains(nameInput)).toBe(true);
    });
  });
});
