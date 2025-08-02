/**
 * Debug Character Generation Test
 * Simple script to test character generation in isolation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Debug Character Generation', () => {
  let CharacterGenerationAPI, CharacterUtils;

  beforeEach(async () => {
    // Mock localStorage for tests
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock;

    try {
      // Import the character generation system
      console.log('Attempting to import character generation system...');
      const characterSystem = await import('../src/features/character-generation/index.js');
      console.log('Import successful, available exports:', Object.keys(characterSystem));

      CharacterGenerationAPI = characterSystem.CharacterGenerationAPI;
      CharacterUtils = characterSystem.CharacterUtils;

      console.log('CharacterGenerationAPI available:', !!CharacterGenerationAPI);
      console.log('CharacterUtils available:', !!CharacterUtils);

      if (CharacterUtils) {
        const subjects = CharacterUtils.getAvailableSubjects();
        console.log('Available subjects:', subjects);
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  });

  it('should import character generation system', () => {
    expect(CharacterGenerationAPI).toBeDefined();
    expect(CharacterUtils).toBeDefined();
  });

  it('should create a basic character', async () => {
    console.log('Testing basic character creation...');

    try {
      const result = await CharacterGenerationAPI.createCharacter({
        name: 'Debug Test Character',
        subject: 'math',
        autoSave: false,
      });

      console.log('Character creation result:', {
        success: result.success,
        error: result.error,
        details: result.details,
        hasCharacter: !!result.character,
      });

      if (result.character) {
        console.log('Created character:', {
          id: result.character.id,
          name: result.character.name,
          subject: result.character.subject,
        });
      }

      expect(result.success).toBe(true);
      expect(result.character.name).toBe('Debug Test Character');
    } catch (error) {
      console.error('Character creation failed with exception:', error);
      throw error;
    }
  });

  it('should generate random character', async () => {
    console.log('Testing random character generation...');

    try {
      const result = await CharacterGenerationAPI.generateRandomCharacter('math', {
        autoSave: false,
      });

      console.log('Random generation result:', {
        success: result.success,
        error: result.error,
        details: result.details,
        hasCharacter: !!result.character,
      });

      if (!result.success) {
        console.log('Generation failed. Full result:', result);
      }

      expect(result.success).toBe(true);
    } catch (error) {
      console.error('Random generation failed with exception:', error);
      throw error;
    }
  });
});
