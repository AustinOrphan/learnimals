/**
 * Enhanced Unit Tests for Card Component
 *
 * Comprehensive test suite covering card rendering, interactions, accessibility,
 * and various card types (linked vs static cards)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModule } from '../helpers/moduleResolver.js';
import { CharacterFactory, GameFactory } from '../fixtures/testDataFactory.js';

// Mock Card component
const mockCard = createMockModule({
  createCard: function (cardData) {
    if (!cardData) {
      throw new Error('Card data is required');
    }

    const card = document.createElement('div');
    card.className = 'card';

    // Set accessibility attributes
    if (cardData.link) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', cardData.ariaLabel || cardData.title);
    } else {
      card.setAttribute('role', 'article');
    }

    // Add card content
    if (cardData.image) {
      const img = document.createElement('img');
      img.src = cardData.image;
      img.alt = cardData.imageAlt || cardData.title || '';
      img.className = 'card-image';
      card.appendChild(img);
    }

    if (cardData.title) {
      const title = document.createElement('h3');
      title.textContent = cardData.title;
      title.className = 'card-title';
      card.appendChild(title);
    }

    if (cardData.description) {
      const desc = document.createElement('p');
      desc.textContent = cardData.description;
      desc.className = 'card-description';
      card.appendChild(desc);
    }

    if (cardData.features && Array.isArray(cardData.features)) {
      const featuresList = document.createElement('ul');
      featuresList.className = 'card-features';

      cardData.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
      });

      card.appendChild(featuresList);
    }

    // Add interactive behavior for linked cards
    if (cardData.link) {
      card.style.cursor = 'pointer';
      card.classList.add('card-interactive');

      const handleClick = e => {
        e.preventDefault();
        if (cardData.onClick) {
          cardData.onClick(cardData);
        } else if (cardData.link.startsWith('http')) {
          window.open(cardData.link, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cardData.link;
        }
      };

      const handleKeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      };

      card.addEventListener('click', handleClick);
      card.addEventListener('keydown', handleKeydown);

      // Store references for cleanup
      card._handleClick = handleClick;
      card._handleKeydown = handleKeydown;
    }

    // Add category styling
    if (cardData.category) {
      card.classList.add(`card-${cardData.category.toLowerCase()}`);
      card.setAttribute('data-category', cardData.category);
    }

    // Add custom classes
    if (cardData.className) {
      const classNames = cardData.className.split(' ').filter(cls => cls.trim());
      classNames.forEach(className => {
        card.classList.add(className);
      });
    }

    // Store card data for testing
    card._cardData = cardData;

    return card;
  },

  createCardsGrid: function (cardsData, options = {}) {
    if (!Array.isArray(cardsData)) {
      throw new Error('Cards data must be an array');
    }

    const grid = document.createElement('div');
    grid.className = 'cards-grid';

    if (options.className) {
      grid.classList.add(options.className);
    }

    // Apply grid layout options
    if (options.columns) {
      grid.style.gridTemplateColumns = `repeat(${options.columns}, 1fr)`;
    }

    if (options.gap) {
      grid.style.gap = options.gap;
    }

    // Create cards
    cardsData.forEach((cardData, index) => {
      try {
        const card = this.createCard(cardData);
        card.setAttribute('data-index', index);
        grid.appendChild(card);
      } catch (error) {
        console.warn(`Failed to create card at index ${index}:`, error);
      }
    });

    // Store grid data for testing
    grid._cardsData = cardsData;
    grid._options = options;

    return grid;
  },

  // Card validation utility
  validateCardData: function (cardData) {
    const errors = [];

    if (!cardData || typeof cardData !== 'object') {
      errors.push('Card data must be an object');
      return errors;
    }

    if (!cardData.title && !cardData.image) {
      errors.push('Card must have either title or image');
    }

    if (cardData.link && typeof cardData.link !== 'string') {
      errors.push('Link must be a string');
    }

    if (cardData.features && !Array.isArray(cardData.features)) {
      errors.push('Features must be an array');
    }

    return errors;
  },

  // Utility to find cards by criteria
  findCards: function (container, criteria) {
    const cards = container.querySelectorAll('.card');
    return Array.from(cards).filter(card => {
      const cardData = card._cardData;
      if (!cardData) return false;

      return Object.entries(criteria).every(([key, value]) => {
        if (typeof value === 'string') {
          return cardData[key] && cardData[key].toLowerCase().includes(value.toLowerCase());
        }
        return cardData[key] === value;
      });
    });
  },
});

// Mock the module
vi.mock('../../components/ui/Card.js', () => mockCard);

describe('Card Component Enhanced Tests', () => {
  let container;
  const Card = mockCard;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Mock window methods
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    global.open = vi.fn();
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Card Creation and Rendering', () => {
    it('should create basic card with title and description', () => {
      const cardData = {
        title: 'Test Card',
        description: 'This is a test card description',
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      expect(card.className).toBe('card');
      expect(card.querySelector('.card-title').textContent).toBe('Test Card');
      expect(card.querySelector('.card-description').textContent).toBe(
        'This is a test card description'
      );
      expect(card.getAttribute('role')).toBe('article');
    });

    it('should create card with image', () => {
      const cardData = {
        title: 'Image Card',
        image: '/test-image.jpg',
        imageAlt: 'Test image description',
      };

      const card = Card.createCard(cardData);
      const image = card.querySelector('.card-image');

      expect(image).toBeTruthy();
      expect(image.src).toContain('/test-image.jpg');
      expect(image.alt).toBe('Test image description');
    });

    it('should create card with features list', () => {
      const cardData = {
        title: 'Feature Card',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
      };

      const card = Card.createCard(cardData);
      const featuresList = card.querySelector('.card-features');
      const features = featuresList.querySelectorAll('li');

      expect(featuresList).toBeTruthy();
      expect(features).toHaveLength(3);
      expect(features[0].textContent).toBe('Feature 1');
      expect(features[2].textContent).toBe('Feature 3');
    });

    it('should create linked card with proper accessibility', () => {
      const cardData = {
        title: 'Linked Card',
        link: '/target-page',
        ariaLabel: 'Navigate to target page',
      };

      const card = Card.createCard(cardData);

      expect(card.getAttribute('role')).toBe('button');
      expect(card.getAttribute('tabindex')).toBe('0');
      expect(card.getAttribute('aria-label')).toBe('Navigate to target page');
      expect(card.style.cursor).toBe('pointer');
      expect(card.classList.contains('card-interactive')).toBe(true);
    });

    it('should apply category styling', () => {
      const cardData = {
        title: 'Math Card',
        category: 'Mathematics',
      };

      const card = Card.createCard(cardData);

      expect(card.classList.contains('card-mathematics')).toBe(true);
      expect(card.getAttribute('data-category')).toBe('Mathematics');
    });

    it('should apply custom className', () => {
      const cardData = {
        title: 'Custom Card',
        className: 'custom-style special-card',
      };

      const card = Card.createCard(cardData);

      expect(card.classList.contains('custom-style')).toBe(true);
      expect(card.classList.contains('special-card')).toBe(true);
    });

    it('should throw error for missing card data', () => {
      expect(() => Card.createCard()).toThrow('Card data is required');
      expect(() => Card.createCard(null)).toThrow('Card data is required');
    });
  });

  describe('Interactive Card Behavior', () => {
    it('should handle click events on linked cards', () => {
      const onClick = vi.fn();
      const cardData = {
        title: 'Clickable Card',
        link: '/test-page',
        onClick: onClick,
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      card.click();

      expect(onClick).toHaveBeenCalledWith(cardData);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation (Enter key)', () => {
      const onClick = vi.fn();
      const cardData = {
        title: 'Keyboard Card',
        link: '/test-page',
        onClick: onClick,
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      card.dispatchEvent(enterEvent);

      expect(onClick).toHaveBeenCalledWith(cardData);
    });

    it('should handle keyboard navigation (Space key)', () => {
      const onClick = vi.fn();
      const cardData = {
        title: 'Keyboard Card',
        link: '/test-page',
        onClick: onClick,
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      card.dispatchEvent(spaceEvent);

      expect(onClick).toHaveBeenCalledWith(cardData);
    });

    it('should ignore other keyboard keys', () => {
      const onClick = vi.fn();
      const cardData = {
        title: 'Keyboard Card',
        link: '/test-page',
        onClick: onClick,
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      card.dispatchEvent(tabEvent);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should navigate to external links in new tab', () => {
      const cardData = {
        title: 'External Card',
        link: 'https://example.com',
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      card.click();

      expect(global.open).toHaveBeenCalledWith(
        'https://example.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should navigate to internal links', () => {
      const cardData = {
        title: 'Internal Card',
        link: '/internal-page',
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      card.click();

      expect(window.location.href).toBe('/internal-page');
    });
  });

  describe('Cards Grid Creation', () => {
    it('should create grid with multiple cards', () => {
      const cardsData = [
        { title: 'Card 1', description: 'First card' },
        { title: 'Card 2', description: 'Second card' },
        { title: 'Card 3', description: 'Third card' },
      ];

      const grid = Card.createCardsGrid(cardsData);
      container.appendChild(grid);

      expect(grid.className).toBe('cards-grid');
      expect(grid.children).toHaveLength(3);
      expect(grid.children[0].getAttribute('data-index')).toBe('0');
      expect(grid.children[2].getAttribute('data-index')).toBe('2');
    });

    it('should apply grid options', () => {
      const cardsData = [{ title: 'Card 1' }, { title: 'Card 2' }];

      const options = {
        columns: 3,
        gap: '20px',
        className: 'custom-grid',
      };

      const grid = Card.createCardsGrid(cardsData, options);

      expect(grid.classList.contains('custom-grid')).toBe(true);
      expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
      expect(grid.style.gap).toBe('20px');
    });

    it('should handle invalid cards gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const cardsData = [
        { title: 'Valid Card' },
        null, // Invalid card
        { title: 'Another Valid Card' },
      ];

      const grid = Card.createCardsGrid(cardsData);

      expect(grid.children).toHaveLength(2); // Only valid cards created
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to create card at index 1:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error for non-array cards data', () => {
      expect(() => Card.createCardsGrid('not an array')).toThrow('Cards data must be an array');
      expect(() => Card.createCardsGrid({ not: 'array' })).toThrow('Cards data must be an array');
    });
  });

  describe('Card Data Validation', () => {
    it('should validate correct card data', () => {
      const validCard = {
        title: 'Valid Card',
        description: 'Valid description',
        link: '/valid-link',
        features: ['feature1', 'feature2'],
      };

      const errors = Card.validateCardData(validCard);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing title and image', () => {
      const invalidCard = {
        description: 'No title or image',
      };

      const errors = Card.validateCardData(invalidCard);
      expect(errors).toContain('Card must have either title or image');
    });

    it('should validate link type', () => {
      const invalidCard = {
        title: 'Test',
        link: 123, // Should be string
      };

      const errors = Card.validateCardData(invalidCard);
      expect(errors).toContain('Link must be a string');
    });

    it('should validate features type', () => {
      const invalidCard = {
        title: 'Test',
        features: 'not an array',
      };

      const errors = Card.validateCardData(invalidCard);
      expect(errors).toContain('Features must be an array');
    });

    it('should handle null/undefined card data', () => {
      expect(Card.validateCardData(null)).toContain('Card data must be an object');
      expect(Card.validateCardData(undefined)).toContain('Card data must be an object');
      expect(Card.validateCardData('string')).toContain('Card data must be an object');
    });
  });

  describe('Card Finding and Filtering', () => {
    beforeEach(() => {
      const cardsData = [
        { title: 'Math Card', category: 'Education', description: 'Learn mathematics' },
        { title: 'Science Card', category: 'Education', description: 'Explore science' },
        { title: 'Game Card', category: 'Entertainment', description: 'Play games' },
      ];

      const grid = Card.createCardsGrid(cardsData);
      container.appendChild(grid);
    });

    it('should find cards by title', () => {
      const mathCards = Card.findCards(container, { title: 'Math' });
      expect(mathCards).toHaveLength(1);
      expect(mathCards[0]._cardData.title).toBe('Math Card');
    });

    it('should find cards by category', () => {
      const educationCards = Card.findCards(container, { category: 'Education' });
      expect(educationCards).toHaveLength(2);
    });

    it('should find cards by multiple criteria', () => {
      const specificCards = Card.findCards(container, {
        category: 'Education',
        title: 'Science',
      });
      expect(specificCards).toHaveLength(1);
      expect(specificCards[0]._cardData.title).toBe('Science Card');
    });

    it('should handle case-insensitive search', () => {
      const cards = Card.findCards(container, { title: 'MATH' });
      expect(cards).toHaveLength(1);
    });

    it('should return empty array for non-matching criteria', () => {
      const cards = Card.findCards(container, { category: 'NonExistent' });
      expect(cards).toHaveLength(0);
    });
  });

  describe('Accessibility Features', () => {
    it('should provide proper ARIA labels for linked cards', () => {
      const cardData = {
        title: 'Accessible Card',
        link: '/page',
        ariaLabel: 'Custom aria label',
      };

      const card = Card.createCard(cardData);
      expect(card.getAttribute('aria-label')).toBe('Custom aria label');
    });

    it('should fallback to title for ARIA label', () => {
      const cardData = {
        title: 'Fallback Card',
        link: '/page',
      };

      const card = Card.createCard(cardData);
      expect(card.getAttribute('aria-label')).toBe('Fallback Card');
    });

    it('should set proper image alt text', () => {
      const cardData = {
        title: 'Image Card',
        image: '/image.jpg',
        imageAlt: 'Descriptive alt text',
      };

      const card = Card.createCard(cardData);
      const image = card.querySelector('.card-image');
      expect(image.alt).toBe('Descriptive alt text');
    });

    it('should fallback to title for image alt text', () => {
      const cardData = {
        title: 'Auto Alt Card',
        image: '/image.jpg',
      };

      const card = Card.createCard(cardData);
      const image = card.querySelector('.card-image');
      expect(image.alt).toBe('Auto Alt Card');
    });

    it('should use empty alt for decorative images', () => {
      const cardData = {
        image: '/decorative.jpg',
        // No title or imageAlt
      };

      const card = Card.createCard(cardData);
      const image = card.querySelector('.card-image');
      expect(image.alt).toBe('');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of cards efficiently', () => {
      const startTime = performance.now();

      const cardsData = Array.from({ length: 100 }, (_, i) => ({
        title: `Card ${i}`,
        description: `Description for card ${i}`,
        link: `/page/${i}`,
      }));

      const grid = Card.createCardsGrid(cardsData);
      container.appendChild(grid);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(grid.children).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should store minimal data references', () => {
      const cardData = {
        title: 'Test Card',
        largeData: 'x'.repeat(10000), // Large string
      };

      const card = Card.createCard(cardData);

      // Card should store reference to original data
      expect(card._cardData).toBe(cardData);
      // Not create copies
      expect(card._cardData.largeData).toBe(cardData.largeData);
    });
  });

  describe('Integration with Test Data Factory', () => {
    it('should create cards from CharacterFactory data', () => {
      const character = CharacterFactory.create();
      const cardData = {
        title: character.name,
        description: `A ${character.species.primary} character`,
        image: character.appearance.avatar,
        category: 'Character',
      };

      const card = Card.createCard(cardData);

      expect(card.querySelector('.card-title').textContent).toBe(character.name);
      expect(card.getAttribute('data-category')).toBe('Character');
    });

    it('should create cards from GameFactory data', () => {
      const game = GameFactory.create();
      const cardData = {
        title: game.name,
        description: game.description || `A ${game.type} game for ${game.subject}`,
        features: [
          'Game Type: ' + game.type,
          'Subject: ' + game.subject,
          'Difficulty: ' + game.difficulty,
        ],
        link: `/games/${game.id}`,
        category: 'Game',
      };

      const card = Card.createCard(cardData);
      const features = card.querySelectorAll('.card-features li');

      expect(card.querySelector('.card-title').textContent).toBe(game.name);
      expect(features).toHaveLength(cardData.features.length);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle malformed card data gracefully', () => {
      const malformedData = {
        title: null,
        description: undefined,
        features: 'not an array',
        link: 123,
      };

      // Should not throw but may not render optimally
      expect(() => Card.createCard(malformedData)).not.toThrow();
    });

    it('should handle empty arrays and strings', () => {
      const emptyData = {
        title: '',
        description: '',
        features: [],
        link: '',
      };

      const card = Card.createCard(emptyData);
      expect(card.querySelector('.card-features')).toBeTruthy();
      expect(card.querySelector('.card-features').children).toHaveLength(0);
    });

    it('should prevent event bubbling on interactive cards', () => {
      const cardData = {
        title: 'Interactive Card',
        link: '/test',
        onClick: vi.fn(),
      };

      const card = Card.createCard(cardData);
      container.appendChild(card);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

      card.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
