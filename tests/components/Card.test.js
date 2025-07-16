import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import Card from '../../src/components/ui/Card.js';

// Mock DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;

describe('Card Component', () => {
  let container;
  let card;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (card) {
      card.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      card = new Card({ title: 'Test Card' });
      
      expect(card.options.title).toBe('Test Card');
      expect(card.options.content).toBe('');
      expect(card.options.imageUrl).toBeNull();
      expect(card.options.imageAlt).toBe('');
      expect(card.options.linkUrl).toBeNull();
      expect(card.options.linkText).toBe('Learn More');
      expect(card.options.theme).toBe('default');
    });

    it('should initialize with custom options', () => {
      const options = {
        title: 'Custom Card',
        content: 'Custom content',
        imageUrl: '/test/image.jpg',
        imageAlt: 'Test image',
        linkUrl: '/test/link',
        linkText: 'Custom Link',
        theme: 'alt',
        cssClasses: ['custom-class']
      };
      
      card = new Card(options);
      
      expect(card.options.title).toBe('Custom Card');
      expect(card.options.content).toBe('Custom content');
      expect(card.options.imageUrl).toBe('/test/image.jpg');
      expect(card.options.imageAlt).toBe('Test image');
      expect(card.options.linkUrl).toBe('/test/link');
      expect(card.options.linkText).toBe('Custom Link');
      expect(card.options.theme).toBe('alt');
      expect(card.options.cssClasses).toEqual(['custom-class']);
    });
  });

  describe('HTML Generation', () => {
    it('should generate basic card HTML', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('class="component feature-card"');
      expect(html).toContain('role="article"');
      expect(html).toContain('<h3 class="card-title">Test Card</h3>');
      expect(html).toContain('<div class="card-content">Test content</div>');
      expect(html).toContain(`id="${card.options.id}"`);
    });

    it('should generate card with image', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content',
        imageUrl: '/test/image.jpg',
        imageAlt: 'Test image'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('<div class="card-image">');
      expect(html).toContain('<img src="/test/image.jpg" alt="Test image" loading="lazy">');
    });

    it('should generate card with link', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content',
        linkUrl: '/test/link',
        linkText: 'Custom Link'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('<a href="/test/link" class="card-link component-button component-button--primary">Custom Link</a>');
    });

    it('should apply alt theme class', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content',
        theme: 'alt'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('class="component feature-card feature-card--alt"');
    });

    it('should apply custom CSS classes', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content',
        cssClasses: ['custom-class', 'another-class']
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('class="component feature-card custom-class another-class"');
    });

    it('should handle missing title', () => {
      card = new Card({
        content: 'Test content'
      });
      
      const html = card.generateHTML();
      
      expect(html).not.toContain('<h3 class="card-title">');
      expect(html).toContain('<div class="card-content">Test content</div>');
    });

    it('should handle HTML content', () => {
      card = new Card({
        title: 'Test Card',
        content: '<p>HTML <strong>content</strong></p>'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('<p>HTML <strong>content</strong></p>');
    });
  });

  describe('Rendering', () => {
    it('should render card to container', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content'
      });
      
      card.render(container);
      
      expect(card.isRendered).toBe(true);
      expect(container.querySelector('.feature-card')).toBeTruthy();
      expect(container.querySelector('.card-title').textContent).toBe('Test Card');
      expect(container.querySelector('.card-content').textContent).toBe('Test content');
    });

    it('should render complete card with all elements', () => {
      card = new Card({
        title: 'Complete Card',
        content: 'Complete content',
        imageUrl: '/test/image.jpg',
        imageAlt: 'Test image',
        linkUrl: '/test/link',
        linkText: 'Test Link'
      });
      
      card.render(container);
      
      expect(container.querySelector('.card-image img')).toBeTruthy();
      expect(container.querySelector('.card-image img').src).toContain('/test/image.jpg');
      expect(container.querySelector('.card-image img').alt).toBe('Test image');
      expect(container.querySelector('.card-link')).toBeTruthy();
      expect(container.querySelector('.card-link').href).toContain('/test/link');
      expect(container.querySelector('.card-link').textContent).toBe('Test Link');
    });
  });

  describe('Event Handling', () => {
    it('should handle card link clicks', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content',
        linkUrl: '/test/link'
      });
      
      card.render(container);
      
      const cardClickHandler = vi.fn();
      card.element.addEventListener('cardClick', cardClickHandler);
      
      const link = container.querySelector('.card-link');
      link.click();
      
      expect(cardClickHandler).toHaveBeenCalled();
      expect(cardClickHandler.mock.calls[0][0].detail.linkUrl).toBe('/test/link');
    });

    it('should handle card hover', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content'
      });
      
      card.render(container);
      
      const cardHoverHandler = vi.fn();
      card.element.addEventListener('cardHover', cardHoverHandler);
      
      // Simulate mouseenter
      const mouseEnterEvent = document.createEvent('Event');
      mouseEnterEvent.initEvent('mouseenter', true, true);
      card.element.dispatchEvent(mouseEnterEvent);
      
      expect(cardHoverHandler).toHaveBeenCalled();
      expect(cardHoverHandler.mock.calls[0][0].detail.card).toEqual(card.options);
    });

    it('should not have click handler without link', () => {
      card = new Card({
        title: 'Test Card',
        content: 'Test content'
      });
      
      card.render(container);
      
      const cardClickHandler = vi.fn();
      card.element.addEventListener('cardClick', cardClickHandler);
      
      // No link element should exist
      expect(container.querySelector('.card-link')).toBeNull();
      
      // Click the card itself
      card.element.click();
      
      expect(cardClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Static Methods', () => {
    it('should create linked card', () => {
      const options = {
        title: 'Linked Card',
        content: 'Linked content'
      };
      
      const linkedCardHTML = Card.createLinkedCard(options, '/test/link');
      
      expect(linkedCardHTML).toContain('<a href="/test/link" class="feature-card-link">');
      expect(linkedCardHTML).toContain('Linked Card');
      expect(linkedCardHTML).toContain('Linked content');
    });

    it('should create linked card with complex options', () => {
      const options = {
        title: 'Complex Linked Card',
        content: 'Complex content',
        imageUrl: '/test/image.jpg',
        theme: 'alt'
      };
      
      const linkedCardHTML = Card.createLinkedCard(options, '/test/complex-link');
      
      expect(linkedCardHTML).toContain('<a href="/test/complex-link" class="feature-card-link">');
      expect(linkedCardHTML).toContain('feature-card--alt');
      expect(linkedCardHTML).toContain('/test/image.jpg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      card = new Card({
        title: 'Accessible Card',
        content: 'Accessible content'
      });
      
      card.render(container);
      
      expect(card.element.getAttribute('role')).toBe('article');
    });

    it('should have proper image alt text', () => {
      card = new Card({
        title: 'Image Card',
        content: 'Card with image',
        imageUrl: '/test/image.jpg',
        imageAlt: 'Descriptive alt text'
      });
      
      card.render(container);
      
      const img = container.querySelector('.card-image img');
      expect(img.alt).toBe('Descriptive alt text');
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Theming', () => {
    it('should apply default theme', () => {
      card = new Card({
        title: 'Default Card',
        content: 'Default content'
      });
      
      card.render(container);
      
      expect(card.element.classList.contains('feature-card')).toBe(true);
      expect(card.element.classList.contains('feature-card--alt')).toBe(false);
    });

    it('should apply alt theme', () => {
      card = new Card({
        title: 'Alt Card',
        content: 'Alt content',
        theme: 'alt'
      });
      
      card.render(container);
      
      expect(card.element.classList.contains('feature-card')).toBe(true);
      expect(card.element.classList.contains('feature-card--alt')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      card = new Card({
        title: 'Empty Content Card',
        content: ''
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('<div class="card-content"></div>');
    });

    it('should handle missing image alt text', () => {
      card = new Card({
        title: 'No Alt Card',
        content: 'Card without alt text',
        imageUrl: '/test/image.jpg'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('alt=""');
    });

    it('should handle special characters in content', () => {
      card = new Card({
        title: 'Special Characters',
        content: 'Content with "quotes" & <tags>'
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain('Content with "quotes" & <tags>');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000);
      card = new Card({
        title: 'Long Content Card',
        content: longContent
      });
      
      const html = card.generateHTML();
      
      expect(html).toContain(longContent);
    });
  });

  describe('Integration', () => {
    it('should work with BaseComponent methods', () => {
      card = new Card({
        title: 'Integration Card',
        content: 'Integration content'
      });
      
      card.render(container);
      
      // Test BaseComponent methods
      card.addClass('integration-test');
      expect(card.element.classList.contains('integration-test')).toBe(true);
      
      card.hide();
      expect(card.element.style.display).toBe('none');
      
      card.show();
      expect(card.element.style.display).toBe('');
      
      const customEventHandler = vi.fn();
      card.element.addEventListener('customEvent', customEventHandler);
      
      card.emit('customEvent', { test: 'data' });
      expect(customEventHandler).toHaveBeenCalled();
    });
  });
});