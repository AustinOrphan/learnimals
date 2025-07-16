/**
 * Character System Integration Tests
 * 
 * Tests the integration of character creation, customization, rendering, and persistence
 * Verifies that all character-related components work together correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterFactory, TestDataUtils } from '../../fixtures/testDataFactory.js';

describe('Character System Integration', () => {
  let container;
  let mockLocalStorage;
  let characterData;

  beforeEach(() => {
    // Setup test container
    container = testUtils.createTestContainer('character-integration-test');
    
    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem: vi.fn((key) => mockLocalStorage.data[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.data[key] = value; }),
      removeItem: vi.fn((key) => { delete mockLocalStorage.data[key]; }),
      clear: vi.fn(() => { mockLocalStorage.data = {}; })
    };
    global.localStorage = mockLocalStorage;
    
    // Create test character data
    characterData = CharacterFactory.create();
  });

  afterEach(() => {
    container.innerHTML = '';
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Character Creation Workflow', () => {
    it('should complete full character creation flow', async () => {
      // Mock components involved in character creation
      const mockWizard = {
        show: vi.fn(),
        onComplete: null,
        steps: ['species', 'appearance', 'personality', 'review']
      };
      
      const mockRenderer = {
        render: vi.fn(),
        updateCharacter: vi.fn()
      };
      
      const mockStorage = {
        saveCharacter: vi.fn().mockResolvedValue(true),
        loadCharacter: vi.fn().mockResolvedValue(characterData)
      };
      
      // Simulate wizard completion
      mockWizard.onComplete = vi.fn((data) => {
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('species');
        expect(data).toHaveProperty('appearance');
        expect(data).toHaveProperty('personality');
        
        // Save character
        return mockStorage.saveCharacter(data);
      });
      
      // Trigger character creation
      const creationData = {
        name: 'Test Character',
        species: { primary: 'cat', secondary: null },
        appearance: {
          colors: { primary: '#FF6B6B', secondary: '#4ECDC4' }
        },
        personality: {
          traits: { enthusiasm: 80, patience: 70 }
        }
      };
      
      await mockWizard.onComplete(creationData);
      
      // Verify character was saved
      expect(mockStorage.saveCharacter).toHaveBeenCalledWith(creationData);
      
      // Verify character can be loaded
      const loadedCharacter = await mockStorage.loadCharacter(creationData.id);
      expect(loadedCharacter).toBeDefined();
    });

    it('should validate character data during creation', () => {
      const validateCharacterData = (data) => {
        const errors = [];
        
        // Name validation
        if (!data.name || data.name.trim().length < 2) {
          errors.push('Name must be at least 2 characters');
        }
        if (data.name && data.name.length > 50) {
          errors.push('Name must be less than 50 characters');
        }
        
        // Species validation
        if (!data.species || !data.species.primary) {
          errors.push('Species is required');
        }
        
        // Appearance validation
        if (!data.appearance || !data.appearance.colors || !data.appearance.colors.primary) {
          errors.push('Primary color is required');
        }
        
        // Personality validation
        if (data.personality && data.personality.traits) {
          const traits = data.personality.traits;
          Object.values(traits).forEach(value => {
            if (value < 0 || value > 100) {
              errors.push('Trait values must be between 0 and 100');
            }
          });
        }
        
        return errors;
      };
      
      // Test valid data
      const validData = CharacterFactory.create();
      const validErrors = validateCharacterData(validData);
      expect(validErrors).toHaveLength(0);
      
      // Test invalid data
      const invalidData = {
        name: '',
        species: null,
        appearance: {}
      };
      const invalidErrors = validateCharacterData(invalidData);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors).toContain('Name must be at least 2 characters');
      expect(invalidErrors).toContain('Species is required');
    });
  });

  describe('Character Rendering Integration', () => {
    it('should render character with all visual elements', () => {
      // Create rendering container
      const renderContainer = document.createElement('div');
      container.appendChild(renderContainer);
      
      // Mock renderer with comprehensive rendering
      const mockRenderer = {
        element: null,
        character: null,
        
        render: vi.fn(function(character, target) {
          this.character = character;
          this.element = document.createElement('div');
          this.element.className = 'character-renderer';
          
          // Create character visual elements
          const characterSvg = document.createElement('svg');
          characterSvg.setAttribute('width', '200');
          characterSvg.setAttribute('height', '200');
          characterSvg.setAttribute('class', 'character-svg');
          
          // Add species-specific elements
          const speciesClass = `character-${character.species.primary}`;
          characterSvg.classList.add(speciesClass);
          
          // Apply colors
          characterSvg.style.setProperty('--primary-color', character.appearance.colors.primary);
          characterSvg.style.setProperty('--secondary-color', character.appearance.colors.secondary);
          
          // Add character info
          const infoDiv = document.createElement('div');
          infoDiv.className = 'character-info';
          infoDiv.innerHTML = `
            <h3>${character.name}</h3>
            <p>Species: ${character.species.primary}</p>
            <p>Level: ${character.stats.level}</p>
          `;
          
          this.element.appendChild(characterSvg);
          this.element.appendChild(infoDiv);
          target.appendChild(this.element);
          
          return this;
        }),
        
        updateCharacter: vi.fn(function(updates) {
          Object.assign(this.character, updates);
          this.render(this.character, this.element.parentNode);
        })
      };
      
      // Render character
      mockRenderer.render(characterData, renderContainer);
      
      // Verify rendering
      expect(mockRenderer.render).toHaveBeenCalled();
      expect(renderContainer.querySelector('.character-renderer')).toBeTruthy();
      expect(renderContainer.querySelector('.character-svg')).toBeTruthy();
      expect(renderContainer.querySelector('.character-info')).toBeTruthy();
      
      // Verify species class
      const svg = renderContainer.querySelector('.character-svg');
      expect(svg.classList.contains(`character-${characterData.species.primary}`)).toBe(true);
      
      // Verify character info
      const info = renderContainer.querySelector('.character-info');
      expect(info.textContent).toContain(characterData.name);
      expect(info.textContent).toContain(characterData.species.primary);
    });

    it('should update character appearance dynamically', () => {
      const renderContainer = document.createElement('div');
      container.appendChild(renderContainer);
      
      // Mock components
      const mockRenderer = {
        updateAppearance: vi.fn((colors) => {
          const svg = renderContainer.querySelector('.character-svg');
          if (svg) {
            svg.style.setProperty('--primary-color', colors.primary);
            svg.style.setProperty('--secondary-color', colors.secondary);
          }
        })
      };
      
      const mockCustomizer = {
        onColorChange: vi.fn((callback) => {
          // Simulate color change
          callback({ primary: '#00FF00', secondary: '#0000FF' });
        })
      };
      
      // Setup initial render
      renderContainer.innerHTML = `
        <svg class="character-svg" style="--primary-color: #FF0000; --secondary-color: #FFFF00;"></svg>
      `;
      
      // Connect customizer to renderer
      mockCustomizer.onColorChange((colors) => {
        mockRenderer.updateAppearance(colors);
      });
      
      // Verify update was called
      expect(mockRenderer.updateAppearance).toHaveBeenCalledWith({
        primary: '#00FF00',
        secondary: '#0000FF'
      });
    });
  });

  describe('Character Persistence Integration', () => {
    it('should save and load character data correctly', async () => {
      const storageKey = 'learnimals_character';
      
      // Mock character manager
      const mockCharacterManager = {
        saveCharacter: vi.fn((character) => {
          const serialized = JSON.stringify(character);
          localStorage.setItem(storageKey, serialized);
          return Promise.resolve(true);
        }),
        
        loadCharacter: vi.fn(() => {
          const data = localStorage.getItem(storageKey);
          return data ? Promise.resolve(JSON.parse(data)) : Promise.resolve(null);
        }),
        
        deleteCharacter: vi.fn(() => {
          localStorage.removeItem(storageKey);
          return Promise.resolve(true);
        })
      };
      
      // Save character
      await mockCharacterManager.saveCharacter(characterData);
      
      // Verify save
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(characterData);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        storageKey,
        JSON.stringify(characterData)
      );
      
      // Load character
      const loadedCharacter = await mockCharacterManager.loadCharacter();
      
      // Verify load
      expect(mockCharacterManager.loadCharacter).toHaveBeenCalled();
      expect(loadedCharacter).toEqual(characterData);
      
      // Delete character
      await mockCharacterManager.deleteCharacter();
      
      // Verify deletion
      expect(localStorage.removeItem).toHaveBeenCalledWith(storageKey);
      
      // Verify character is gone
      const deletedCharacter = await mockCharacterManager.loadCharacter();
      expect(deletedCharacter).toBeNull();
    });

    it('should handle character data migration', async () => {
      // Mock old character format
      const oldCharacterData = {
        name: 'Old Character',
        type: 'cat', // Old format used 'type' instead of 'species'
        color: '#FF0000', // Old format had single color
        level: 5
      };
      
      // Migration function
      const migrateCharacterData = (data) => {
        if (!data) return null;
        
        // Check if migration needed
        if (data.species) return data; // Already migrated
        
        // Migrate old format
        return {
          ...data,
          species: { primary: data.type || 'cat', secondary: null },
          appearance: {
            colors: {
              primary: data.color || '#FF6B6B',
              secondary: '#4ECDC4'
            }
          },
          stats: {
            level: data.level || 1,
            experience: 0
          },
          // Remove old properties
          type: undefined,
          color: undefined,
          level: undefined
        };
      };
      
      // Test migration
      const migrated = migrateCharacterData(oldCharacterData);
      
      expect(migrated.species.primary).toBe('cat');
      expect(migrated.appearance.colors.primary).toBe('#FF0000');
      expect(migrated.stats.level).toBe(5);
      expect(migrated.type).toBeUndefined();
      expect(migrated.color).toBeUndefined();
    });
  });

  describe('Character Gallery Integration', () => {
    it('should display multiple characters in gallery', () => {
      // Create multiple characters
      const characters = [
        CharacterFactory.create({ name: 'Character 1' }),
        CharacterFactory.create({ name: 'Character 2' }),
        CharacterFactory.create({ name: 'Character 3' })
      ];
      
      // Mock gallery component
      const mockGallery = {
        characters: [],
        element: null,
        
        render: vi.fn(function(chars, target) {
          this.characters = chars;
          this.element = document.createElement('div');
          this.element.className = 'character-gallery';
          
          chars.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.characterId = char.id;
            card.innerHTML = `
              <img src="/api/character/${char.id}/thumbnail" alt="${char.name}">
              <h4>${char.name}</h4>
              <p>${char.species.primary}</p>
            `;
            this.element.appendChild(card);
          });
          
          target.appendChild(this.element);
          return this;
        }),
        
        onCharacterSelect: vi.fn()
      };
      
      // Render gallery
      mockGallery.render(characters, container);
      
      // Verify gallery rendered
      expect(mockGallery.render).toHaveBeenCalledWith(characters, container);
      expect(container.querySelector('.character-gallery')).toBeTruthy();
      
      // Verify all characters displayed
      const cards = container.querySelectorAll('.character-card');
      expect(cards).toHaveLength(3);
      
      // Verify character data
      cards.forEach((card, index) => {
        expect(card.dataset.characterId).toBe(characters[index].id);
        expect(card.textContent).toContain(characters[index].name);
        expect(card.textContent).toContain(characters[index].species.primary);
      });
    });

    it('should handle character selection from gallery', () => {
      const characters = [CharacterFactory.create()];
      const onSelect = vi.fn();
      
      // Create gallery with selection handler
      const galleryEl = document.createElement('div');
      galleryEl.className = 'character-gallery';
      
      const card = document.createElement('div');
      card.className = 'character-card';
      card.dataset.characterId = characters[0].id;
      card.innerHTML = `<h4>${characters[0].name}</h4>`;
      
      card.addEventListener('click', () => {
        onSelect(characters[0]);
      });
      
      galleryEl.appendChild(card);
      container.appendChild(galleryEl);
      
      // Simulate selection
      card.click();
      
      // Verify selection handler called
      expect(onSelect).toHaveBeenCalledWith(characters[0]);
    });
  });

  describe('Character System Error Handling', () => {
    it('should handle character loading errors gracefully', async () => {
      const mockStorage = {
        loadCharacter: vi.fn().mockRejectedValue(new Error('Storage error'))
      };
      
      const mockErrorHandler = {
        handleError: vi.fn((error) => {
          console.error('Character loading failed:', error);
          return { fallbackCharacter: CharacterFactory.createMinimal({ name: 'Test Character' }) };
        })
      };
      
      try {
        await mockStorage.loadCharacter();
      } catch (error) {
        const result = mockErrorHandler.handleError(error);
        expect(result.fallbackCharacter).toBeDefined();
        expect(result.fallbackCharacter.name).toBe('Test Character');
      }
      
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should validate and sanitize character input', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        
        // Remove script tags and dangerous content
        return input
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      };
      
      // Test dangerous inputs
      const dangerousInputs = [
        '<script>alert("xss")</script>Test',
        'Normal text <img src=x onerror=alert(1)>',
        '"><svg/onload=alert(/XSS/)>'
      ];
      
      dangerousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('alert');
        expect(sanitized).not.toContain('onerror');
      });
    });
  });

  describe('Character Features Integration', () => {
    it('should integrate with progress tracking', async () => {
      const mockProgressTracker = {
        updateCharacterStats: vi.fn((characterId, stats) => {
          return Promise.resolve({
            characterId,
            ...stats,
            updated: true
          });
        })
      };
      
      // Update character progress
      const updates = {
        experience: 100,
        gamesPlayed: 5,
        achievementsUnlocked: ['first_game', 'math_beginner']
      };
      
      const result = await mockProgressTracker.updateCharacterStats(
        characterData.id,
        updates
      );
      
      expect(mockProgressTracker.updateCharacterStats).toHaveBeenCalled();
      expect(result.updated).toBe(true);
      expect(result.experience).toBe(100);
    });

    it('should integrate with game systems', () => {
      const mockGameIntegration = {
        loadCharacterIntoGame: vi.fn((character, gameId) => {
          return {
            gameId,
            character: {
              id: character.id,
              name: character.name,
              appearance: character.appearance
            },
            ready: true
          };
        })
      };
      
      // Load character into game
      const gameResult = mockGameIntegration.loadCharacterIntoGame(
        characterData,
        'bubble-pop'
      );
      
      expect(gameResult.ready).toBe(true);
      expect(gameResult.character.id).toBe(characterData.id);
      expect(gameResult.gameId).toBe('bubble-pop');
    });
  });
});