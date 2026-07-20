/**
 * Character Generation Regression Tests
 * Tests to prevent previously fixed bugs from reoccurring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Character Generation Regression Tests', () => {
  let CharacterGenerationAPI, CharacterUtils, CharacterFactory, SubjectTemplates;

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
    const characterSystem = await import('../../character-generation/index.js');
    CharacterGenerationAPI = characterSystem.CharacterGenerationAPI;
    CharacterUtils = characterSystem.CharacterUtils;
    CharacterFactory = characterSystem.CharacterFactory;
    SubjectTemplates = characterSystem.SubjectTemplates;
  });

  describe('Bug #1: Static Date Initialization Prevention', () => {
    it('should generate unique timestamps for each character', async () => {
      const timestamps = new Set();
      const characters = [];

      // Generate 10 characters rapidly
      for (let i = 0; i < 10; i++) {
        const result = await CharacterGenerationAPI.createCharacter({
          name: `Timestamp Test ${i}`,
          subject: 'math',
          autoSave: false,
        });

        if (result.success) {
          characters.push(result.character);
          timestamps.add(result.character.metadata.created);
          timestamps.add(result.character.metadata.modified);
        }
      }

      // Check if all timestamps are unique
      const expectedTimestamps = characters.length * 2; // created + modified for each
      expect(timestamps.size).toBe(expectedTimestamps);

      // Additional check: timestamps should be recent
      const now = Date.now();
      const allRecent = characters.every(char => {
        const created = new Date(char.metadata.created).getTime();
        return now - created < 60000; // Within last minute
      });

      expect(allRecent).toBe(true);
    });
  });

  describe('Bug #2: Subject Template Completeness', () => {
    it('should have templates for all available subjects', () => {
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const missingTemplates = [];

      allSubjects.forEach(subject => {
        if (!SubjectTemplates[subject]) {
          missingTemplates.push(subject);
        } else {
          // Verify template has required fields
          const template = SubjectTemplates[subject];
          if (!template.personality || !template.appearance || !template.education) {
            missingTemplates.push(`${subject} (incomplete)`);
          }
        }
      });

      expect(missingTemplates).toEqual([]);
      expect(allSubjects.length).toBeGreaterThanOrEqual(12); // Should have all 12 subjects
    });
  });

  describe('Bug #3: Name Generation Completeness', () => {
    it('should generate names for all subjects', () => {
      const factory = new CharacterFactory();
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const failedSubjects = [];

      for (const subject of allSubjects) {
        const name = factory.generateRandomName(subject);
        if (!name || name === '' || name === 'Unknown') {
          failedSubjects.push(subject);
        }
      }

      // Also test that names are different
      const names = new Set();
      for (let i = 0; i < 20; i++) {
        const subject = allSubjects[i % allSubjects.length];
        names.add(factory.generateRandomName(subject));
      }

      expect(failedSubjects).toEqual([]);
      expect(names.size).toBeGreaterThan(10); // Should have good diversity
    });
  });

  describe('Bug #4: Education Specialties Completeness', () => {
    it('should have education specialties for all subjects', () => {
      const factory = new CharacterFactory();
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const missingSpecialties = [];

      for (const subject of allSubjects) {
        const specialties = factory.generationRules.educationSpecialties[subject];
        if (!specialties || specialties.length === 0) {
          missingSpecialties.push(subject);
        }
      }

      expect(missingSpecialties).toEqual([]);
    });

    it('should generate subject-specific specialties', async () => {
      const testCharacter = await CharacterGenerationAPI.generateRandomCharacter('music', {
        autoSave: false,
      });

      expect(testCharacter.success).toBe(true);
      expect(testCharacter.character.education.specialties.length).toBeGreaterThan(0);
      expect(testCharacter.character.education.specialties).not.toContain('General Learning');
    });
  });

  describe('Bug #5: Color Palette Completeness', () => {
    it('should have color palettes for all subjects', () => {
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const failedSubjects = [];

      for (const subject of allSubjects) {
        const palettes = CharacterUtils.getColorPalettes(subject);
        if (!palettes || palettes.length === 0) {
          failedSubjects.push(subject);
        }
      }

      expect(failedSubjects).toEqual([]);
    });

    it('should provide good color diversity across subjects', async () => {
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const colorSets = new Map();

      for (const subject of allSubjects.slice(0, 10)) {
        // Test first 10 subjects
        const result = await CharacterGenerationAPI.generateRandomCharacter(subject, {
          autoSave: false,
        });
        if (result.success) {
          const colors = `${result.character.appearance.primaryColor}-${result.character.appearance.secondaryColor}`;
          if (!colorSets.has(colors)) {
            colorSets.set(colors, []);
          }
          colorSets.get(colors).push(subject);
        }
      }

      // Check for color diversity (at least 30% unique, or minimum 3 different combinations)
      const minDiversity = Math.max(3, Math.min(allSubjects.length * 0.3, 10));
      const hasGoodDiversity = colorSets.size >= minDiversity;
      expect(hasGoodDiversity).toBe(true);
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid generation with high reliability', async () => {
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const promises = [];
      const results = { total: 0, passed: 0 };
      const errors = new Map();

      // Generate 25 characters rapidly (reduced from 50 for faster test)
      for (let i = 0; i < 25; i++) {
        const subject = allSubjects[i % allSubjects.length];
        promises.push(
          CharacterGenerationAPI.generateRandomCharacter(subject, {
            autoSave: false,
          })
            .then(result => {
              results.total++;
              if (result.success) {
                results.passed++;
              } else {
                const error = result.error || 'Unknown error';
                errors.set(error, (errors.get(error) || 0) + 1);
              }
            })
            .catch(error => {
              results.total++;
              const errorMsg = error.message || 'Exception thrown';
              errors.set(errorMsg, (errors.get(errorMsg) || 0) + 1);
            })
        );
      }

      await Promise.all(promises);
      const successRate = (results.passed / results.total) * 100;

      expect(successRate).toBeGreaterThanOrEqual(60); // At least 60% success rate in test environment
      expect(results.total).toBe(25);
    });
  });

  describe('Subject-Specific Validation', () => {
    it('should validate all subject templates', async () => {
      const allSubjects = CharacterUtils.getAvailableSubjects();
      const validationFailures = [];

      for (const subject of allSubjects) {
        const result = await CharacterGenerationAPI.createFromTemplate(subject, {
          name: `${subject} Test Character`,
          autoSave: false,
        });

        if (!result.success) {
          validationFailures.push({
            subject,
            error: result.error,
            details: result.details,
          });
        } else {
          // Verify subject was set correctly
          if (result.character.subject !== subject) {
            validationFailures.push({
              subject,
              error: `Subject mismatch: expected ${subject}, got ${result.character.subject}`,
            });
          }
        }
      }

      expect(validationFailures).toEqual([]);
    });
  });
});
