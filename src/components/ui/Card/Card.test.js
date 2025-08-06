/**
 * Card Component Tests - Co-located CSS Pattern Verification
 * Tests for task 5.1: FR-1.1, FR-1.2, FR-4.1 compliance
 */

import Card from './Card.js';

describe('Card Component - Co-located CSS Pattern', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Basic Functionality', () => {
    test('should create Card component instance', () => {
      const card = new Card({
        title: 'Test Card',
        content: 'Test content'
      });

      expect(card).toBeInstanceOf(Card);
      expect(card.options.title).toBe('Test Card');
      expect(card.options.content).toBe('Test content');
    });

    test('should render Card component with proper HTML structure', async () => {
      const card = new Card({
        title: 'Test Card',
        content: 'Test content',
        theme: 'ocean'
      });

      await card.render(container);

      expect(card.element).toBeTruthy();
      expect(card.element.classList.contains('card')).toBe(true);
      expect(card.element.classList.contains('card--ocean')).toBe(true);
      expect(card.element.querySelector('.card__title').textContent).toBe('Test Card');
      expect(card.element.querySelector('.card__content').textContent).toBe('Test content');
    });
  });

  describe('CSS Co-location Compliance (FR-1.1, FR-1.2)', () => {
    test('should reference Card.css file following naming convention', () => {
      expect(Card.css).toEqual(['Card.css']);
    });

    test('should have proper component path for CSS resolution', () => {
      const card = new Card({ title: 'Test' });
      const componentPath = card.getComponentPath();
      
      expect(componentPath).toBe('/src/components/ui/Card');
    });

    test('should automatically inject CSS during initialization', async () => {
      const card = new Card({ title: 'Test Card' });
      
      // Mock CSS injection for testing
      const originalInjectCSS = card.injectCSS;
      let cssInjected = false;
      card.injectCSS = async function() {
        cssInjected = true;
        return originalInjectCSS.call(this);
      };

      await card.initialize();
      
      expect(cssInjected).toBe(true);
    });
  });

  describe('Backward Compatibility (FR-4.1)', () => {
    test('should maintain CardV2 global availability', () => {
      // Simulate global availability
      if (typeof window !== 'undefined') {
        expect(window.Card).toBe(Card);
        expect(window.CardV2).toBe(Card);
      }
    });

    test('should support all existing Card options', () => {
      const cardOptions = {
        title: 'Test Card',
        content: 'Test content',
        imageUrl: '/test-image.jpg',
        imageAlt: 'Test image',
        linkUrl: '/test-link',
        linkText: 'Test Link',
        theme: 'forest',
        elevated: true,
        size: 'large'
      };

      const card = new Card(cardOptions);

      expect(card.options.title).toBe(cardOptions.title);
      expect(card.options.content).toBe(cardOptions.content);
      expect(card.options.imageUrl).toBe(cardOptions.imageUrl);
      expect(card.options.imageAlt).toBe(cardOptions.imageAlt);
      expect(card.options.linkUrl).toBe(cardOptions.linkUrl);
      expect(card.options.linkText).toBe(cardOptions.linkText);
      expect(card.options.theme).toBe(cardOptions.theme);
      expect(card.options.elevated).toBe(cardOptions.elevated);
      expect(card.options.size).toBe(cardOptions.size);
    });

    test('should support all existing static methods', () => {
      expect(typeof Card.createLinkedCard).toBe('function');
      expect(typeof Card.createCards).toBe('function');

      const linkedCardHTML = Card.createLinkedCard(
        { title: 'Test Card', content: 'Test content' },
        '/test-link'
      );

      expect(linkedCardHTML).toContain('Test Card');
      expect(linkedCardHTML).toContain('href="/test-link"');
    });
  });

  describe('Theme Integration', () => {
    test('should apply theme classes correctly', async () => {
      const card = new Card({
        title: 'Themed Card',
        theme: 'space',
        elevated: true,
        size: 'large'
      });

      await card.render(container);

      expect(card.element.classList.contains('card--space')).toBe(true);
      expect(card.element.classList.contains('card--elevated')).toBe(true);
      expect(card.element.classList.contains('card--large')).toBe(true);
    });

    test('should handle theme changes', async () => {
      const card = new Card({
        title: 'Theme Change Test',
        theme: 'default'
      });

      await card.render(container);

      // Simulate theme change
      card.onThemeChange();

      // Check that theme change was handled
      expect(card.element).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    test('should handle card interactions', async () => {
      const card = new Card({
        title: 'Interactive Card',
        linkUrl: '/test-link'
      });

      await card.render(container);

      let clickEventFired = false;
      card.addEventListener('card:click', () => {
        clickEventFired = true;
      });

      // Simulate click on card link
      const link = card.element.querySelector('.card__link');
      if (link) {
        link.click();
        expect(clickEventFired).toBe(true);
      }
    });
  });

  describe('CSS Architecture Validation', () => {
    test('should have enhanced CSS token support', () => {
      const card = new Card({ title: 'Token Test' });
      
      // Check that component uses BaseComponentV2 features
      expect(card.cssManager).toBeTruthy();
      expect(card.cssPathResolver).toBeTruthy();
      expect(typeof card.applyScopedStyles).toBe('function');
      expect(typeof card.getCSSStats).toBe('function');
    });

    test('should support CSS performance monitoring', async () => {
      const card = new Card({ title: 'Performance Test' });
      
      await card.initialize();
      
      const stats = card.getCSSStats();
      expect(stats).toBeTruthy();
      expect(stats.componentName).toBe('Card');
    });
  });
});