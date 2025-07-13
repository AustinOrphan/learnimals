/**
 * Character Generation System - Main Export Module
 * 
 * Part of Phase D: Character Generator Core
 * 
 * This module provides the complete character generation system including:
 * - Character schemas and validation
 * - Character factory for creation and management
 * - Storage system for persistence
 * - Templates and utilities
 */

// Core exports
export { CharacterFactory } from './core/CharacterFactory.js';
export { CharacterValidator } from './validation/CharacterValidator.js';
export { CharacterStorage } from './storage/CharacterStorage.js';

// Schema exports
export { 
  CharacterSchema, 
  DefaultCharacterTemplate, 
  SubjectTemplates 
} from './schemas/CharacterSchema.js';

// Default instances for easy usage
import { CharacterFactory } from './core/CharacterFactory.js';
import { CharacterStorage } from './storage/CharacterStorage.js';
import { SubjectTemplates } from './schemas/CharacterSchema.js';

// Create fresh instances every time to avoid caching issues
export const characterFactory = new CharacterFactory();
export const characterStorage = new CharacterStorage();

/**
 * Quick API for common operations
 */
export const CharacterGenerationAPI = {
  // Character creation (using fresh factory instances)
  async createCharacter(options = {}) {
    const freshFactory = new CharacterFactory();
    return freshFactory.createCharacter(options);
  },

  async generateRandomCharacter(subject, constraints = {}) {
    const freshFactory = new CharacterFactory();
    return freshFactory.generateRandomCharacter(subject, constraints);
  },

  async createFromTemplate(templateName, overrides = {}) {
    const freshFactory = new CharacterFactory();
    return freshFactory.createFromTemplate(templateName, overrides);
  },

  // Character management
  loadCharacter(characterId) {
    return characterStorage.loadCharacter(characterId);
  },

  loadAllCharacters(options = {}) {
    return characterStorage.loadAllCharacters(options);
  },

  async saveCharacter(character) {
    return characterStorage.saveCharacter(character);
  },

  deleteCharacter(characterId) {
    return characterStorage.deleteCharacter(characterId);
  },

  // Validation (using fresh factory instance)
  validateCharacter(character) {
    const freshFactory = new CharacterFactory();
    return freshFactory.validateCharacter(character);
  },

  // Utilities
  getCreationSuggestions(preferences = {}) {
    return characterFactory.getCreationSuggestions(preferences);
  },

  generatePreview(partialCharacter = {}) {
    return characterFactory.generatePreview(partialCharacter);
  },

  getStorageStats() {
    return characterStorage.getStorageStats();
  },

  // Import/Export
  exportCharacters(characterIds = []) {
    return characterStorage.exportCharacters(characterIds);
  },

  async importCharacters(exportData, options = {}) {
    return characterStorage.importCharacters(exportData, options);
  }
};

/**
 * Character Generation Event System
 * For monitoring and reacting to character generation events
 */
export class CharacterGenerationEvents {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }
}

// Global event emitter instance
export const characterEvents = new CharacterGenerationEvents();

/**
 * Character Generation Utilities
 */
export const CharacterUtils = {
  /**
   * Generate unique ID
   */
  generateId() {
    return 'char_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Get available subjects
   */
  getAvailableSubjects() {
    return Object.keys(SubjectTemplates);
  },

  /**
   * Get color palette suggestions for a subject
   */
  getColorPalettes(subject) {
    return characterFactory.generationRules.colorPalettes.filter(
      palette => !palette.subjects || palette.subjects.includes(subject)
    );
  },

  /**
   * Get name suggestions for a subject
   */
  getNameSuggestions(subject, count = 5) {
    const names = characterFactory.generationRules.nameGenerators[subject] || 
                  characterFactory.generationRules.nameGenerators.general;
    return names.slice(0, count);
  },

  /**
   * Get personality trait combinations
   */
  getPersonalityTraits() {
    return characterFactory.generationRules.personalityTraitCombinations;
  },

  /**
   * Get education specialties for a subject
   */
  getEducationSpecialties(subject) {
    return characterFactory.generationRules.educationSpecialties[subject] || [];
  },

  /**
   * Validate character ID format
   */
  validateCharacterId(id) {
    return /^[a-zA-Z0-9-_]+$/.test(id) && id.length >= 3 && id.length <= 50;
  },

  /**
   * Generate character summary for display
   */
  generateCharacterSummary(character) {
    if (!character) return null;

    return {
      id: character.id,
      name: character.name,
      subject: character.subject,
      primaryTrait: character.personality?.primaryTrait,
      primaryColor: character.appearance?.primaryColor,
      specialties: character.education?.specialties?.slice(0, 3) || [],
      created: character.metadata?.created,
      popularity: character.metadata?.popularity || 0
    };
  },

  /**
   * Check character compatibility with existing characters
   */
  checkCharacterCompatibility(character, existingCharacters = []) {
    const issues = [];
    const similarities = [];

    existingCharacters.forEach(existing => {
      // Check for duplicate names
      if (existing.name.toLowerCase() === character.name.toLowerCase()) {
        issues.push(`Name "${character.name}" already exists`);
      }

      // Check for very similar appearance
      if (existing.appearance?.primaryColor === character.appearance?.primaryColor &&
          existing.subject === character.subject) {
        similarities.push(`Similar appearance to "${existing.name}"`);
      }

      // Check for identical specialties
      const sharedSpecialties = character.education?.specialties?.filter(
        specialty => existing.education?.specialties?.includes(specialty)
      ) || [];
      
      if (sharedSpecialties.length >= 2) {
        similarities.push(`Shares specialties with "${existing.name}": ${sharedSpecialties.join(', ')}`);
      }
    });

    return {
      hasIssues: issues.length > 0,
      issues,
      similarities,
      isCompatible: issues.length === 0
    };
  }
};

// Default export for easy importing
export default CharacterGenerationAPI;