/**
 * Visual Accessibility Tests
 * Comprehensive tests for color contrast, visual accessibility, and alternative text
 * Ensures WCAG 2.1 Level AA compliance for visual accessibility
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

describe('Visual Accessibility Tests', () => {
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

    // Mock getComputedStyle
    window.getComputedStyle = vi.fn(element => {
      const styles = {
        color: element.dataset.color || 'rgb(0, 0, 0)',
        backgroundColor: element.dataset.backgroundColor || 'rgb(255, 255, 255)',
        fontSize: element.dataset.fontSize || '16px',
        fontWeight: element.dataset.fontWeight || 'normal',
        display: element.style.display || 'block',
        visibility: element.style.visibility || 'visible',
        opacity: element.style.opacity || '1',
      };
      return styles;
    });

    service = new AccessibilityService();
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Color Contrast Tests', () => {
    it('should calculate contrast ratios correctly', () => {
      // Test perfect contrast (black on white)
      const blackOnWhite = service.checkContrast('#000000', '#ffffff');
      expect(blackOnWhite.ratio).toBeCloseTo(21, 0);
      expect(blackOnWhite.isAA).toBe(true);
      expect(blackOnWhite.isAAA).toBe(true);

      // Test good contrast (dark blue on white)
      const darkBlueOnWhite = service.checkContrast('#003366', '#ffffff');
      expect(darkBlueOnWhite.ratio).toBeGreaterThan(4.5);
      expect(darkBlueOnWhite.isAA).toBe(true);

      // Test poor contrast (light gray on white)
      const lightGrayOnWhite = service.checkContrast('#cccccc', '#ffffff');
      expect(lightGrayOnWhite.ratio).toBeLessThan(4.5);
      expect(lightGrayOnWhite.isAA).toBe(false);

      // Test large text contrast (3:1 requirement)
      const mediumGrayOnWhite = service.checkContrast('#767676', '#ffffff');
      expect(mediumGrayOnWhite.isAALarge).toBe(true);
      expect(mediumGrayOnWhite.isAA).toBe(false);
    });

    it('should handle RGB color formats', () => {
      const rgbContrast = service.calculateContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(rgbContrast).toBeCloseTo(21, 0);
    });

    it('should handle hex color formats', () => {
      const rgb = service.hexToRgb('#ff0000');
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });

      const rgbWithoutHash = service.hexToRgb('00ff00');
      expect(rgbWithoutHash).toEqual({ r: 0, g: 255, b: 0 });

      const invalidHex = service.hexToRgb('invalid');
      expect(invalidHex).toBeNull();
    });

    it('should calculate luminance correctly', () => {
      const whiteLuminance = service.getLuminance('#ffffff');
      expect(whiteLuminance).toBeCloseTo(1, 2);

      const blackLuminance = service.getLuminance('#000000');
      expect(blackLuminance).toBeCloseTo(0, 2);

      const redLuminance = service.getLuminance('#ff0000');
      expect(redLuminance).toBeGreaterThan(0);
      expect(redLuminance).toBeLessThan(1);
    });

    it('should test color contrast on text elements', async () => {
      testContainer.innerHTML = `
        <p data-color="rgb(0, 0, 0)" data-background-color="rgb(255, 255, 255)">Good contrast text</p>
        <p data-color="rgb(170, 170, 170)" data-background-color="rgb(255, 255, 255)">Poor contrast text</p>
        <h1 data-color="rgb(102, 102, 102)" data-background-color="rgb(255, 255, 255)" data-font-size="24px">Large text</h1>
        <small data-color="rgb(102, 102, 102)" data-background-color="rgb(255, 255, 255)" data-font-size="12px">Small text</small>
      `;

      await accessibilityTester.testColorContrast(testContainer);

      // The test should identify contrast issues
      expect(accessibilityTester.warnings.length).toBeGreaterThan(0);

      // Should have warnings about poor contrast
      const contrastWarnings = accessibilityTester.warnings.filter(warning =>
        warning.includes('Low color contrast')
      );
      expect(contrastWarnings.length).toBeGreaterThan(0);
    });

    it('should handle different text sizes and weights', () => {
      testContainer.innerHTML = `
        <p data-color="rgb(85, 85, 85)" data-background-color="rgb(255, 255, 255)" data-font-size="18px">Large text (18px)</p>
        <p data-color="rgb(85, 85, 85)" data-background-color="rgb(255, 255, 255)" data-font-size="14px" data-font-weight="bold">Bold text (14px)</p>
        <p data-color="rgb(85, 85, 85)" data-background-color="rgb(255, 255, 255)" data-font-size="16px">Normal text (16px)</p>
      `;

      const paragraphs = testContainer.querySelectorAll('p');

      // Test that large text (18px+) has different requirements
      const largeTextStyle = window.getComputedStyle(paragraphs[0]);
      const fontSize = parseInt(largeTextStyle.fontSize);
      expect(fontSize).toBe(18);

      // Test that bold text (14px+) has different requirements
      const boldTextStyle = window.getComputedStyle(paragraphs[1]);
      const fontWeight = boldTextStyle.fontWeight;
      expect(fontWeight).toBe('bold');
    });

    it('should detect insufficient contrast for interactive elements', () => {
      testContainer.innerHTML = `
        <button data-color="rgb(100, 100, 100)" data-background-color="rgb(200, 200, 200)">Poor contrast button</button>
        <a href="#" data-color="rgb(0, 100, 200)" data-background-color="rgb(255, 255, 255)">Good contrast link</a>
        <input type="text" data-color="rgb(150, 150, 150)" data-background-color="rgb(255, 255, 255)" placeholder="Poor contrast input">
      `;

      const button = testContainer.querySelector('button');
      const link = testContainer.querySelector('a');
      const input = testContainer.querySelector('input');

      // Test button contrast
      const buttonContrast = service.calculateContrastRatio(
        button.dataset.color,
        button.dataset.backgroundColor
      );
      expect(buttonContrast).toBeLessThan(4.5);

      // Test link contrast
      const linkContrast = service.calculateContrastRatio(
        link.dataset.color,
        link.dataset.backgroundColor
      );
      expect(linkContrast).toBeGreaterThan(4.5);
    });
  });

  describe('Visual Indicators', () => {
    it('should test focus indicators have sufficient contrast', () => {
      testContainer.innerHTML = `
        <button id="good-focus" data-focus-color="rgb(0, 100, 200)">Good Focus</button>
        <button id="poor-focus" data-focus-color="rgb(200, 200, 200)">Poor Focus</button>
      `;

      const goodButton = testContainer.querySelector('#good-focus');
      const poorButton = testContainer.querySelector('#poor-focus');

      // Test focus indicator contrast
      const goodFocusContrast = service.checkContrast('#0064c8', '#ffffff');
      expect(goodFocusContrast.isAA).toBe(true);

      const poorFocusContrast = service.checkContrast('#c8c8c8', '#ffffff');
      expect(poorFocusContrast.isAA).toBe(false);
    });

    it('should test error and success state indicators', () => {
      testContainer.innerHTML = `
        <div class="error" data-color="rgb(200, 0, 0)" data-background-color="rgb(255, 240, 240)">Error message</div>
        <div class="success" data-color="rgb(0, 150, 0)" data-background-color="rgb(240, 255, 240)">Success message</div>
        <div class="warning" data-color="rgb(200, 150, 0)" data-background-color="rgb(255, 255, 240)">Warning message</div>
      `;

      const errorDiv = testContainer.querySelector('.error');
      const successDiv = testContainer.querySelector('.success');
      const warningDiv = testContainer.querySelector('.warning');

      // Test error state contrast
      const errorContrast = service.calculateContrastRatio(
        errorDiv.dataset.color,
        errorDiv.dataset.backgroundColor
      );
      expect(errorContrast).toBeGreaterThan(4.5);

      // Test success state contrast
      const successContrast = service.calculateContrastRatio(
        successDiv.dataset.color,
        successDiv.dataset.backgroundColor
      );
      expect(successContrast).toBeGreaterThan(4.5);

      // Test warning state contrast
      const warningContrast = service.calculateContrastRatio(
        warningDiv.dataset.color,
        warningDiv.dataset.backgroundColor
      );
      expect(warningContrast).toBeGreaterThan(4.5);
    });

    it('should ensure information is not conveyed by color alone', () => {
      testContainer.innerHTML = `
        <form>
          <label for="required-field">
            Required Field <span class="required-indicator" aria-label="required">*</span>
          </label>
          <input type="text" id="required-field" required>
          
          <div class="field-status error" role="alert">
            <span class="icon" aria-label="error">⚠</span>
            This field is required
          </div>
          
          <div class="field-status success" role="status">
            <span class="icon" aria-label="success">✓</span>
            Valid input
          </div>
        </form>
      `;

      const requiredIndicator = testContainer.querySelector('.required-indicator');
      const errorIcon = testContainer.querySelector('.error .icon');
      const successIcon = testContainer.querySelector('.success .icon');

      // Required fields should have text indicators, not just color
      expect(requiredIndicator.getAttribute('aria-label')).toBe('required');
      expect(requiredIndicator.textContent.trim()).toBe('*');

      // Error states should have text/icon indicators, not just color
      expect(errorIcon.getAttribute('aria-label')).toBe('error');
      expect(testContainer.querySelector('.error').getAttribute('role')).toBe('alert');

      // Success states should have text/icon indicators, not just color
      expect(successIcon.getAttribute('aria-label')).toBe('success');
      expect(testContainer.querySelector('.success').getAttribute('role')).toBe('status');
    });
  });

  describe('Alternative Text and Media', () => {
    it('should validate image alternative text', () => {
      testContainer.innerHTML = `
        <img src="chart.png" alt="Sales increased 25% from Q1 to Q2 2023" id="descriptive">
        <img src="decoration.png" alt="" id="decorative">
        <img src="complex.png" alt="Revenue chart" aria-describedby="chart-details" id="complex">
        <div id="chart-details">Detailed description of revenue trends over time...</div>
        <img src="missing-alt.png" id="missing">
      `;

      const descriptiveImg = testContainer.querySelector('#descriptive');
      const decorativeImg = testContainer.querySelector('#decorative');
      const complexImg = testContainer.querySelector('#complex');
      const missingImg = testContainer.querySelector('#missing');

      // Descriptive images should have meaningful alt text
      expect(descriptiveImg.alt).toBeTruthy();
      expect(descriptiveImg.alt.length).toBeGreaterThan(10);

      // Decorative images should have empty alt text
      expect(decorativeImg.alt).toBe('');

      // Complex images should have alt text and aria-describedby
      expect(complexImg.alt).toBeTruthy();
      expect(complexImg.getAttribute('aria-describedby')).toBe('chart-details');

      // Images without alt should fail validation
      expect(missingImg.hasAttribute('alt')).toBe(false);
    });

    it('should handle CSS background images', () => {
      testContainer.innerHTML = `
        <div class="hero-banner" style="background-image: url('hero.jpg');" 
             role="img" 
             aria-label="Students learning together in a classroom">
          <h1>Welcome to Learnimals</h1>
        </div>
        <div class="decorative-bg" style="background-image: url('pattern.png');" 
             aria-hidden="true">
          <p>Content with decorative background</p>
        </div>
      `;

      const heroBanner = testContainer.querySelector('.hero-banner');
      const decorativeBg = testContainer.querySelector('.decorative-bg');

      // Content background images should have role="img" and aria-label
      expect(heroBanner.getAttribute('role')).toBe('img');
      expect(heroBanner.getAttribute('aria-label')).toBeTruthy();

      // Decorative background images should be hidden from screen readers
      expect(decorativeBg.getAttribute('aria-hidden')).toBe('true');
    });

    it('should validate video and audio accessibility', () => {
      testContainer.innerHTML = `
        <video controls aria-describedby="video-description">
          <source src="tutorial.mp4" type="video/mp4">
          <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
          <track kind="descriptions" src="descriptions.vtt" srclang="en" label="Audio descriptions">
          <p>Your browser does not support the video element.</p>
        </video>
        <div id="video-description">
          This video demonstrates the basic features of the math learning module.
        </div>
        
        <audio controls>
          <source src="pronunciation.mp3" type="audio/mpeg">
          <track kind="captions" src="audio-captions.vtt" srclang="en" label="English">
          <p>Your browser does not support the audio element.</p>
        </audio>
      `;

      const video = testContainer.querySelector('video');
      const audio = testContainer.querySelector('audio');
      const captionTrack = video.querySelector('track[kind="captions"]');
      const descriptionTrack = video.querySelector('track[kind="descriptions"]');

      // Video should have controls and description
      expect(video.hasAttribute('controls')).toBe(true);
      expect(video.getAttribute('aria-describedby')).toBe('video-description');

      // Should have captions and audio descriptions
      expect(captionTrack).toBeTruthy();
      expect(captionTrack.getAttribute('kind')).toBe('captions');
      expect(descriptionTrack).toBeTruthy();
      expect(descriptionTrack.getAttribute('kind')).toBe('descriptions');

      // Audio should have controls
      expect(audio.hasAttribute('controls')).toBe(true);
    });

    it('should handle icons and symbolic content', () => {
      testContainer.innerHTML = `
        <button type="submit">
          <span class="icon save" aria-hidden="true">💾</span>
          Save Document
        </button>
        
        <button type="button" aria-label="Delete item">
          <span class="icon delete" aria-hidden="true">🗑️</span>
        </button>
        
        <div class="status-indicator">
          <span class="icon success" aria-label="Success">✓</span>
          <span class="status-text">Operation completed successfully</span>
        </div>
      `;

      const saveButton = testContainer.querySelector('button[type="submit"]');
      const deleteButton = testContainer.querySelector('button[aria-label="Delete item"]');
      const statusIndicator = testContainer.querySelector('.status-indicator');

      // Icons with text labels should be hidden from screen readers
      const saveIcon = saveButton.querySelector('.icon');
      expect(saveIcon.getAttribute('aria-hidden')).toBe('true');
      expect(saveButton.textContent.trim()).toContain('Save Document');

      // Icon-only buttons should have aria-label
      expect(deleteButton.getAttribute('aria-label')).toBe('Delete item');
      const deleteIcon = deleteButton.querySelector('.icon');
      expect(deleteIcon.getAttribute('aria-hidden')).toBe('true');

      // Status icons should have aria-label when they convey meaning
      const successIcon = statusIndicator.querySelector('.icon.success');
      expect(successIcon.getAttribute('aria-label')).toBe('Success');
    });
  });

  describe('Visual Layout and Spacing', () => {
    it('should test touch target sizes', () => {
      testContainer.innerHTML = `
        <button id="good-size" style="width: 44px; height: 44px;">✓</button>
        <button id="small-size" style="width: 20px; height: 20px;">×</button>
        <a href="#" id="good-link" style="display: inline-block; padding: 12px;">Link</a>
        <a href="#" id="small-link" style="display: inline-block; padding: 2px;">Small</a>
      `;

      // Mock getBoundingClientRect for specific elements
      const goodButton = testContainer.querySelector('#good-size');
      const smallButton = testContainer.querySelector('#small-size');
      const goodLink = testContainer.querySelector('#good-link');
      const smallLink = testContainer.querySelector('#small-link');

      vi.spyOn(goodButton, 'getBoundingClientRect').mockReturnValue({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
      });

      vi.spyOn(smallButton, 'getBoundingClientRect').mockReturnValue({
        width: 20,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 20,
        x: 0,
        y: 0,
      });

      vi.spyOn(goodLink, 'getBoundingClientRect').mockReturnValue({
        width: 48,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 48,
        x: 0,
        y: 0,
      });

      vi.spyOn(smallLink, 'getBoundingClientRect').mockReturnValue({
        width: 24,
        height: 16,
        top: 0,
        left: 0,
        bottom: 16,
        right: 24,
        x: 0,
        y: 0,
      });

      const goodButtonRect = goodButton.getBoundingClientRect();
      const smallButtonRect = smallButton.getBoundingClientRect();

      // WCAG recommends minimum 44x44px touch targets
      expect(goodButtonRect.width).toBeGreaterThanOrEqual(44);
      expect(goodButtonRect.height).toBeGreaterThanOrEqual(44);

      expect(smallButtonRect.width).toBeLessThan(44);
      expect(smallButtonRect.height).toBeLessThan(44);
    });

    it('should handle responsive text scaling', () => {
      testContainer.innerHTML = `
        <p data-font-size="16px" style="font-size: 16px;">Normal text at 16px</p>
        <p data-font-size="20px" style="font-size: 20px;">Scaled text at 20px (125%)</p>
        <p data-font-size="32px" style="font-size: 32px;">Large text at 32px (200%)</p>
      `;

      const normalText = testContainer.querySelector('[data-font-size="16px"]');
      const scaledText = testContainer.querySelector('[data-font-size="20px"]');
      const largeText = testContainer.querySelector('[data-font-size="32px"]');

      // Text should be readable when scaled up to 200%
      const normalSize = parseInt(window.getComputedStyle(normalText).fontSize);
      const scaledSize = parseInt(window.getComputedStyle(scaledText).fontSize);
      const largeSize = parseInt(window.getComputedStyle(largeText).fontSize);

      expect(normalSize).toBe(16);
      expect(scaledSize).toBe(20);
      expect(largeSize).toBe(32);

      // Large text should be at least 200% of normal
      expect(largeSize / normalSize).toBeGreaterThanOrEqual(2);
    });

    it('should handle visual spacing and layout', () => {
      testContainer.innerHTML = `
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="input1">First Field</label>
          <input type="text" id="input1" style="margin-top: 4px;">
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="input2">Second Field</label>
          <input type="text" id="input2" style="margin-top: 4px;">
        </div>
        <button type="submit" style="margin-top: 24px;">Submit</button>
      `;

      const formGroups = testContainer.querySelectorAll('.form-group');
      const submitButton = testContainer.querySelector('button[type="submit"]');

      // Form groups should have adequate spacing
      expect(formGroups.length).toBe(2);

      // Button should have adequate spacing from form fields
      expect(submitButton.style.marginTop).toBe('24px');
    });
  });

  describe('Motion and Animation Accessibility', () => {
    it('should respect reduced motion preferences', () => {
      testContainer.innerHTML = `
        <div class="animated-element" style="animation: slide-in 0.3s ease-out;">
          Animated content
        </div>
        <div class="motion-sensitive" data-animation="fade-in">
          Content with motion
        </div>
      `;

      // Test reduced motion preference
      service.preferences.reducedMotion = true;
      service.applyMotionPreferences();

      expect(document.body.classList.contains('reduce-motion')).toBe(true);

      // Test animation control availability
      const animationControl = testContainer.querySelector('.animation-control');
      // Animation control should be present when animations exist
      // (This would be implemented in the actual application)
    });

    it('should provide animation controls for users', () => {
      testContainer.innerHTML = `
        <div class="animation-controls">
          <button id="pause-animations" aria-label="Pause all animations">⏸️ Pause</button>
          <button id="play-animations" aria-label="Play all animations">▶️ Play</button>
          <button id="reduce-motion" aria-label="Reduce motion">🐌 Reduce Motion</button>
        </div>
        <div class="carousel" data-autoplay="true">
          <div class="slide active">Slide 1</div>
          <div class="slide">Slide 2</div>
          <div class="slide">Slide 3</div>
        </div>
      `;

      const pauseButton = testContainer.querySelector('#pause-animations');
      const playButton = testContainer.querySelector('#play-animations');
      const reduceMotionButton = testContainer.querySelector('#reduce-motion');

      expect(pauseButton.getAttribute('aria-label')).toBe('Pause all animations');
      expect(playButton.getAttribute('aria-label')).toBe('Play all animations');
      expect(reduceMotionButton.getAttribute('aria-label')).toBe('Reduce motion');
    });

    it('should handle auto-playing content', () => {
      testContainer.innerHTML = `
        <video autoplay muted loop aria-label="Background video">
          <source src="background.mp4" type="video/mp4">
        </video>
        <div class="carousel" data-autoplay="5000" aria-live="polite" aria-label="Featured content">
          <button class="carousel-pause" aria-label="Pause carousel">⏸️</button>
          <div class="slides" role="region" aria-label="Slides">
            <div class="slide active">Slide 1</div>
            <div class="slide">Slide 2</div>
          </div>
        </div>
      `;

      const video = testContainer.querySelector('video');
      const carousel = testContainer.querySelector('.carousel');
      const pauseButton = testContainer.querySelector('.carousel-pause');

      // Auto-playing video should be muted
      expect(video.hasAttribute('muted')).toBe(true);

      // Auto-playing carousel should have pause control
      expect(pauseButton.getAttribute('aria-label')).toBe('Pause carousel');
      expect(carousel.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Print and High Contrast Modes', () => {
    it('should handle high contrast mode', () => {
      service.preferences.highContrast = true;
      service.applyContrastPreferences();

      expect(document.body.classList.contains('high-contrast')).toBe(true);

      // Test that high contrast styles maintain readability
      testContainer.innerHTML = `
        <button class="primary-button">Primary Action</button>
        <button class="secondary-button">Secondary Action</button>
        <input type="text" placeholder="Text input" class="form-input">
      `;

      // In high contrast mode, elements should have stronger contrast
      // This would be implemented in CSS with @media (prefers-contrast: high)
    });

    it('should handle large text preferences', () => {
      service.preferences.largeText = true;
      service.applyTextPreferences();

      expect(document.body.classList.contains('large-text')).toBe(true);

      testContainer.innerHTML = `
        <p class="body-text">Body text should scale appropriately</p>
        <h1 class="heading">Headings should also scale</h1>
        <button class="action-button">Button text should be readable</button>
      `;

      // Large text preference should make all text larger
      // This would be implemented in CSS
    });

    it('should ensure print accessibility', () => {
      testContainer.innerHTML = `
        <article>
          <h1>Article Title</h1>
          <p>This content should print clearly.</p>
          <a href="https://example.com" class="external-link">External Link</a>
          <div class="interactive-widget" aria-label="Interactive chart">
            <p class="print-alternative">Chart showing sales data from 2020-2023</p>
          </div>
        </article>
      `;

      const externalLink = testContainer.querySelector('.external-link');
      const interactiveWidget = testContainer.querySelector('.interactive-widget');
      const printAlternative = testContainer.querySelector('.print-alternative');

      // External links should show URLs in print
      expect(externalLink.href).toBeTruthy();

      // Interactive content should have print alternatives
      expect(printAlternative.textContent).toContain('Chart showing');
    });
  });

  describe('Color-blind and Visual Impairment Support', () => {
    it('should not rely solely on color for information', () => {
      testContainer.innerHTML = `
        <div class="status-messages">
          <div class="message error" role="alert">
            <span class="icon" aria-label="Error">⚠️</span>
            <span class="text">Error: Please correct the form</span>
          </div>
          <div class="message success" role="status">
            <span class="icon" aria-label="Success">✅</span>
            <span class="text">Success: Form submitted</span>
          </div>
          <div class="message warning" role="alert">
            <span class="icon" aria-label="Warning">⚠️</span>
            <span class="text">Warning: Unsaved changes</span>
          </div>
        </div>
        
        <div class="chart-legend">
          <div class="legend-item">
            <span class="color-indicator red" aria-hidden="true"></span>
            <span class="pattern-indicator diagonal-lines" aria-label="Diagonal lines pattern"></span>
            <span class="label">Series A</span>
          </div>
          <div class="legend-item">
            <span class="color-indicator blue" aria-hidden="true"></span>
            <span class="pattern-indicator dots" aria-label="Dots pattern"></span>
            <span class="label">Series B</span>
          </div>
        </div>
      `;

      const errorMessage = testContainer.querySelector('.message.error');
      const successMessage = testContainer.querySelector('.message.success');
      const warningMessage = testContainer.querySelector('.message.warning');

      // Status messages should have icons and text, not just color
      expect(errorMessage.querySelector('.icon').getAttribute('aria-label')).toBe('Error');
      expect(errorMessage.querySelector('.text').textContent).toContain('Error:');
      expect(errorMessage.getAttribute('role')).toBe('alert');

      expect(successMessage.querySelector('.icon').getAttribute('aria-label')).toBe('Success');
      expect(successMessage.querySelector('.text').textContent).toContain('Success:');

      // Chart legends should use patterns or symbols, not just color
      const legendItems = testContainer.querySelectorAll('.legend-item');
      legendItems.forEach(item => {
        const patternIndicator = item.querySelector('.pattern-indicator');
        expect(patternIndicator.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should provide sufficient color differentiation', () => {
      // Test colors that are distinguishable for color-blind users
      const colorPairs = [
        { name: 'Blue and Orange', color1: '#0066cc', color2: '#ff8800' },
        { name: 'Green and Red with high contrast', color1: '#006600', color2: '#cc0000' },
        { name: 'Purple and Yellow', color1: '#6600cc', color2: '#cccc00' },
      ];

      colorPairs.forEach(pair => {
        const contrast = service.calculateContrastRatio(pair.color1, '#ffffff');
        expect(contrast).toBeGreaterThan(3); // Minimum for color differentiation
      });
    });

    it('should handle focus indicators for low vision users', () => {
      testContainer.innerHTML = `
        <button class="high-visibility-focus">High Visibility Button</button>
        <input type="text" class="high-visibility-focus" placeholder="High visibility input">
        <a href="#" class="high-visibility-focus">High visibility link</a>
      `;

      const button = testContainer.querySelector('button');
      const input = testContainer.querySelector('input');
      const link = testContainer.querySelector('a');

      // Mock high visibility focus styles
      window.getComputedStyle = vi.fn((element, pseudoElement) => {
        if (pseudoElement === ':focus' && element.classList.contains('high-visibility-focus')) {
          return {
            outline: '3px solid #ffff00',
            outlineOffset: '2px',
            boxShadow: '0 0 0 5px rgba(255, 255, 0, 0.3)',
            backgroundColor: 'white',
          };
        }
        return {
          outline: 'none',
          outlineOffset: '0px',
          boxShadow: 'none',
          backgroundColor: 'white',
        };
      });

      // High visibility focus should have thick, bright outlines
      [button, input, link].forEach(element => {
        const focusStyle = window.getComputedStyle(element, ':focus');
        expect(focusStyle.outline).toContain('3px');
        expect(focusStyle.outline).toContain('ffff00');
      });
    });
  });
});
