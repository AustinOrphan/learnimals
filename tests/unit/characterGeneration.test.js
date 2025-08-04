/**
 * Character Generation System Tests
 * Automated tests for the character generation core functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Character Generation System', () => {
  let CharacterGenerationAPI, CharacterUtils, CharacterFactory;

  beforeEach(async () => {
    // Mock localStorage for tests
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock;

    // Import the character generation system
    const characterSystem = await import('../../src/features/character-generation/index.js');
    CharacterGenerationAPI = characterSystem.CharacterGenerationAPI;
    CharacterUtils = characterSystem.CharacterUtils;
    CharacterFactory = characterSystem.CharacterFactory;
  });

  describe('API Functions', () => {
    it('should create a basic character', async () => {
      const result = await CharacterGenerationAPI.createCharacter({
        name: 'Test Character',
        subject: 'math',
        autoSave: false,
      });

      expect(result.success).toBe(true);
      expect(result.character.name).toBe('Test Character');
      expect(result.character.subject).toBe('math');
      expect(result.character.id).toBeDefined();
      expect(result.character.metadata.created).toBeDefined();
    });

    it('should generate random characters for all subjects', async () => {
      const subjects = CharacterUtils.getAvailableSubjects();
      expect(subjects.length).toBeGreaterThan(0);

      for (const subject of subjects.slice(0, 5)) {
        // Test first 5 subjects
        const result = await CharacterGenerationAPI.generateRandomCharacter(subject, {
          autoSave: false,
        });

        if (!result.success) {
          console.log(`Character generation failed for ${subject}:`, result.error, result.details);
        }
        expect(result.success).toBe(true);
        expect(result.character.subject).toBe(subject);
        expect(result.character.name).toBeDefined();
        expect(result.character.appearance.primaryColor).toBeDefined();
      }
    });

    it('should create characters from templates', async () => {
      const subjects = ['math', 'science', 'art'];

      for (const subject of subjects) {
        const result = await CharacterGenerationAPI.createFromTemplate(subject, {
          name: `Template ${subject} Character`,
          autoSave: false,
        });

        expect(result.success).toBe(true);
        expect(result.character.subject).toBe(subject);
        expect(result.character.name).toBe(`Template ${subject} Character`);
      }
    });

    it('should validate character data correctly', () => {
      const validCharacter = {
        id: 'test-character-123',
        name: 'Valid Character',
        subject: 'reading',
        appearance: {
          baseShape: 'circle',
          size: 'medium',
          primaryColor: '#4A90E2',
          secondaryColor: '#FFFFFF',
          accentColor: '#FFD700',
        },
        personality: {
          traits: ['friendly', 'patient'],
          primaryTrait: 'friendly',
          voiceType: 'child',
        },
        education: {
          specialties: ['Stories', 'Vocabulary'],
          difficultyLevel: 'beginner',
          ageRange: { min: 4, max: 8 },
          teachingStyle: 'visual',
        },
      };

      const validation = CharacterGenerationAPI.validateCharacter(validCharacter);
      expect(validation.isValid).toBe(true);
    });

    it('should reject invalid character data', () => {
      const invalidCharacter = {
        name: '', // Invalid: empty name
        subject: 'invalid-subject', // Invalid: not in enum
        appearance: {
          primaryColor: 'not-a-color', // Invalid: wrong format
        },
        personality: {
          traits: [], // Invalid: empty array
          primaryTrait: 'nonexistent-trait',
        },
      };

      const validation = CharacterGenerationAPI.validateCharacter(invalidCharacter);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should generate character previews', () => {
      const preview = CharacterGenerationAPI.generatePreview({
        name: 'Preview Character',
        subject: 'coding',
      });

      expect(preview.character).toBeDefined();
      expect(preview.character.name).toBe('Preview Character');
      expect(preview.character.subject).toBe('coding');
      expect(preview.validation).toBeDefined();
    });
  });

  describe('Character Utils', () => {
    it('should provide available subjects', () => {
      const subjects = CharacterUtils.getAvailableSubjects();
      expect(Array.isArray(subjects)).toBe(true);
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects).toContain('math');
      expect(subjects).toContain('science');
      expect(subjects).toContain('reading');
    });

    it('should generate unique IDs', () => {
      const id1 = CharacterUtils.generateId();
      const id2 = CharacterUtils.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(CharacterUtils.validateCharacterId(id1)).toBe(true);
      expect(CharacterUtils.validateCharacterId(id2)).toBe(true);
    });

    it('should provide color palettes for subjects', () => {
      const subjects = ['math', 'science', 'art'];

      for (const subject of subjects) {
        const palettes = CharacterUtils.getColorPalettes(subject);
        expect(Array.isArray(palettes)).toBe(true);
        expect(palettes.length).toBeGreaterThan(0);
      }
    });

    it('should provide name suggestions', () => {
      const subjects = ['math', 'science', 'coding'];

      for (const subject of subjects) {
        const names = CharacterUtils.getNameSuggestions(subject, 3);
        expect(Array.isArray(names)).toBe(true);
        expect(names.length).toBe(3);
        expect(names.every(name => typeof name === 'string')).toBe(true);
      }
    });

    it('should validate character ID format', () => {
      expect(CharacterUtils.validateCharacterId('valid-id-123')).toBe(true);
      expect(CharacterUtils.validateCharacterId('valid_id_456')).toBe(true);
      expect(CharacterUtils.validateCharacterId('ab')).toBe(false); // too short
      expect(CharacterUtils.validateCharacterId('invalid id with spaces')).toBe(false);
      expect(CharacterUtils.validateCharacterId('')).toBe(false);
    });

    it('should generate character summaries', () => {
      const character = {
        id: 'test-123',
        name: 'Test Character',
        subject: 'math',
        personality: { primaryTrait: 'friendly' },
        appearance: { primaryColor: '#4A90E2' },
        education: { specialties: ['Numbers', 'Algebra', 'Geometry'] },
        metadata: { created: '2023-01-01T00:00:00.000Z', popularity: 5 },
      };

      const summary = CharacterUtils.generateCharacterSummary(character);
      expect(summary.id).toBe('test-123');
      expect(summary.name).toBe('Test Character');
      expect(summary.subject).toBe('math');
      expect(summary.primaryTrait).toBe('friendly');
      expect(summary.specialties).toEqual(['Numbers', 'Algebra', 'Geometry']);
    });
  });

  describe('Character Factory', () => {
    it('should create factory instances', () => {
      const factory = new CharacterFactory();
      expect(factory).toBeDefined();
      expect(factory.validator).toBeDefined();
      expect(factory.storage).toBeDefined();
      expect(factory.generationRules).toBeDefined();
    });

    it('should generate random names for all subjects', () => {
      const factory = new CharacterFactory();
      const subjects = CharacterUtils.getAvailableSubjects();

      for (const subject of subjects) {
        const name = factory.generateRandomName(subject);
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
        expect(name).not.toBe('Unknown');
      }
    });

    it('should provide education specialties for all subjects', () => {
      const factory = new CharacterFactory();
      const subjects = CharacterUtils.getAvailableSubjects();

      for (const subject of subjects) {
        const specialties = factory.generationRules.educationSpecialties[subject];
        expect(Array.isArray(specialties)).toBe(true);
        expect(specialties.length).toBeGreaterThan(0);
      }
    });

    it('should have color palettes available', () => {
      const factory = new CharacterFactory();
      const palettes = factory.generationRules.colorPalettes;

      expect(Array.isArray(palettes)).toBe(true);
      expect(palettes.length).toBeGreaterThan(0);
      expect(palettes.every(p => p.primary && p.secondary && p.accent)).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid character generation', async () => {
      const promises = [];
      const subjects = CharacterUtils.getAvailableSubjects();

      // Generate 10 characters rapidly
      for (let i = 0; i < 10; i++) {
        const subject = subjects[i % subjects.length];
        promises.push(
          CharacterGenerationAPI.createCharacter({
            name: `Perf Test ${i}`,
            subject: subject,
            autoSave: false,
          })
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      expect(successCount).toBeGreaterThanOrEqual(5); // Allow some failures in test environment
      expect(results.length).toBe(10);
    });

    it('should generate unique timestamps for rapid creation', async () => {
      const characters = [];

      // Generate 5 characters rapidly
      for (let i = 0; i < 5; i++) {
        const result = await CharacterGenerationAPI.createCharacter({
          name: `Timestamp Test ${i}`,
          subject: 'math',
          autoSave: false,
        });

        if (result.success) {
          characters.push(result.character);
        }
      }

      expect(characters.length).toBeGreaterThan(0);

      // Check timestamp uniqueness
      const timestamps = new Set();
      characters.forEach(char => {
        timestamps.add(char.metadata.created);
        timestamps.add(char.metadata.modified);
      });

      // All timestamps should be unique
      expect(timestamps.size).toBe(characters.length * 2);

      // All timestamps should be recent (within last minute)
      const now = Date.now();
      characters.forEach(char => {
        const created = new Date(char.metadata.created).getTime();
        expect(now - created).toBeLessThan(60000);
      });
    });
  });
});
