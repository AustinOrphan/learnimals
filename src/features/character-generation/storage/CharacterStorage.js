/**
 * Character Storage System
 * Manages persistence and retrieval of generated characters
 * 
 * Part of Phase D: Character Generator Core
 */

import { CharacterValidator } from '../validation/CharacterValidator.js';
import { DefaultCharacterTemplate } from '../schemas/CharacterSchema.js';

export class CharacterStorage {
  constructor() {
    this.storageKey = 'learnimals_characters';
    this.metaStorageKey = 'learnimals_character_meta';
    this.validator = new CharacterValidator();
    
    // Initialize storage if needed
    this.initializeStorage();
  }

  /**
   * Initialize storage with default structure
   */
  initializeStorage() {
    try {
      const existingData = localStorage.getItem(this.storageKey);
      if (!existingData) {
        const initialData = {
          characters: {},
          collections: {},
          version: '1.0.0',
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(initialData));
      }

      const existingMeta = localStorage.getItem(this.metaStorageKey);
      if (!existingMeta) {
        const initialMeta = {
          totalCharacters: 0,
          totalCollections: 0,
          storageSize: 0,
          lastCleanup: new Date().toISOString(),
          settings: {
            autoSave: true,
            compressionEnabled: false,
            maxCharacters: 100
          }
        };
        localStorage.setItem(this.metaStorageKey, JSON.stringify(initialMeta));
      }
    } catch (error) {
      console.error('Failed to initialize character storage:', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Save a character to storage
   * @param {Object} character - Character data to save
   * @returns {Promise<Object>} Save result with success status and character id
   */
  async saveCharacter(character) {
    try {
      // Validate character data
      const validation = this.validator.validate(character);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          warnings: validation.warnings
        };
      }

      // Sanitize character data
      const sanitizedCharacter = CharacterValidator.sanitize(character);
      
      // Set metadata
      const now = new Date().toISOString();
      sanitizedCharacter.metadata = {
        ...sanitizedCharacter.metadata,
        modified: now
      };

      if (!sanitizedCharacter.metadata.created) {
        sanitizedCharacter.metadata.created = now;
      }

      // Get current storage data
      const storageData = this.getStorageData();
      
      // Check storage limits
      const limitCheck = this.checkStorageLimits(storageData);
      if (!limitCheck.canSave) {
        return {
          success: false,
          error: limitCheck.reason,
          details: limitCheck.details
        };
      }

      // Generate ID if not provided
      if (!sanitizedCharacter.id) {
        sanitizedCharacter.id = this.generateCharacterId(sanitizedCharacter);
      }

      // Check for ID conflicts
      if (storageData.characters[sanitizedCharacter.id]) {
        const existingChar = storageData.characters[sanitizedCharacter.id];
        if (existingChar.metadata?.created !== sanitizedCharacter.metadata?.created) {
          return {
            success: false,
            error: 'Character ID already exists',
            details: ['A different character with this ID already exists']
          };
        }
      }

      // Save character
      storageData.characters[sanitizedCharacter.id] = sanitizedCharacter;
      storageData.lastModified = now;

      // Update storage
      localStorage.setItem(this.storageKey, JSON.stringify(storageData));
      this.updateMetadata();

      return {
        success: true,
        characterId: sanitizedCharacter.id,
        character: sanitizedCharacter,
        warnings: validation.warnings
      };

    } catch (error) {
      console.error('Failed to save character:', error);
      return {
        success: false,
        error: 'Save operation failed',
        details: [error.message]
      };
    }
  }

  /**
   * Load a character by ID
   * @param {string} characterId - Character ID to load
   * @returns {Object|null} Character data or null if not found
   */
  loadCharacter(characterId) {
    try {
      const storageData = this.getStorageData();
      const character = storageData.characters[characterId];
      
      if (!character) {
        return null;
      }

      // Validate loaded character
      const validation = this.validator.validate(character);
      if (!validation.isValid) {
        console.warn(`Loaded character ${characterId} has validation issues:`, validation.errors);
      }

      return character;
    } catch (error) {
      console.error('Failed to load character:', error);
      return null;
    }
  }

  /**
   * Load all characters
   * @param {Object} options - Loading options (filters, sorting, pagination)
   * @returns {Array} Array of character objects
   */
  loadAllCharacters(options = {}) {
    try {
      const storageData = this.getStorageData();
      let characters = Object.values(storageData.characters);

      // Apply filters
      if (options.subject) {
        characters = characters.filter(char => char.subject === options.subject);
      }

      if (options.creator) {
        characters = characters.filter(char => char.metadata?.creator === options.creator);
      }

      if (options.tags && options.tags.length > 0) {
        characters = characters.filter(char => 
          options.tags.every(tag => char.metadata?.tags?.includes(tag))
        );
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        characters = characters.filter(char =>
          char.name.toLowerCase().includes(searchLower) ||
          char.subject.toLowerCase().includes(searchLower) ||
          char.personality?.primaryTrait?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      if (options.sortBy) {
        characters.sort((a, b) => {
          switch (options.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'created':
            return new Date(b.metadata?.created || 0) - new Date(a.metadata?.created || 0);
          case 'modified':
            return new Date(b.metadata?.modified || 0) - new Date(a.metadata?.modified || 0);
          case 'popularity':
            return (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0);
          case 'subject':
            return a.subject.localeCompare(b.subject);
          default:
            return 0;
          }
        });
      }

      // Apply pagination
      if (options.limit || options.offset) {
        const offset = options.offset || 0;
        const limit = options.limit || characters.length;
        characters = characters.slice(offset, offset + limit);
      }

      return characters;
    } catch (error) {
      console.error('Failed to load characters:', error);
      return [];
    }
  }

  /**
   * Delete a character
   * @param {string} characterId - Character ID to delete
   * @returns {boolean} Success status
   */
  deleteCharacter(characterId) {
    try {
      const storageData = this.getStorageData();
      
      if (!storageData.characters[characterId]) {
        return false;
      }

      delete storageData.characters[characterId];
      storageData.lastModified = new Date().toISOString();

      localStorage.setItem(this.storageKey, JSON.stringify(storageData));
      this.updateMetadata();

      return true;
    } catch (error) {
      console.error('Failed to delete character:', error);
      return false;
    }
  }

  /**
   * Update character popularity/rating
   * @param {string} characterId - Character ID
   * @param {number} rating - New popularity rating (0-100)
   */
  updateCharacterPopularity(characterId, rating) {
    try {
      const character = this.loadCharacter(characterId);
      if (!character) return false;

      character.metadata.popularity = Math.max(0, Math.min(100, rating));
      character.metadata.modified = new Date().toISOString();

      return this.saveCharacter(character);
    } catch (error) {
      console.error('Failed to update character popularity:', error);
      return false;
    }
  }

  /**
   * Create a character collection
   * @param {string} name - Collection name
   * @param {Array} characterIds - Character IDs to include
   * @param {Object} metadata - Collection metadata
   */
  createCollection(name, characterIds = [], metadata = {}) {
    try {
      const storageData = this.getStorageData();
      const collectionId = this.generateCollectionId(name);

      const collection = {
        id: collectionId,
        name,
        characterIds: [...characterIds],
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          creator: 'user',
          ...metadata
        }
      };

      storageData.collections[collectionId] = collection;
      storageData.lastModified = new Date().toISOString();

      localStorage.setItem(this.storageKey, JSON.stringify(storageData));
      this.updateMetadata();

      return { success: true, collectionId, collection };
    } catch (error) {
      console.error('Failed to create collection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export characters for backup or sharing
   * @param {Array} characterIds - Character IDs to export (empty for all)
   * @returns {Object} Export data
   */
  exportCharacters(characterIds = []) {
    try {
      const storageData = this.getStorageData();
      let charactersToExport;

      if (characterIds.length === 0) {
        charactersToExport = storageData.characters;
      } else {
        charactersToExport = {};
        characterIds.forEach(id => {
          if (storageData.characters[id]) {
            charactersToExport[id] = storageData.characters[id];
          }
        });
      }

      return {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        characters: charactersToExport,
        characterCount: Object.keys(charactersToExport).length,
        metadata: {
          source: 'Learnimals Character Generator',
          format: 'json'
        }
      };
    } catch (error) {
      console.error('Failed to export characters:', error);
      return null;
    }
  }

  /**
   * Import characters from export data
   * @param {Object} exportData - Export data to import
   * @param {Object} options - Import options
   * @returns {Object} Import result
   */
  async importCharacters(exportData, options = {}) {
    try {
      if (!exportData?.characters) {
        return { success: false, error: 'Invalid export data format' };
      }

      const results = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const [characterId, character] of Object.entries(exportData.characters)) {
        if (options.overwrite || !this.loadCharacter(characterId)) {
          const saveResult = await this.saveCharacter(character);
          if (saveResult.success) {
            results.imported++;
          } else {
            results.errors.push(`Failed to import ${characterId}: ${saveResult.error}`);
          }
        } else {
          results.skipped++;
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to import characters:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      const storageData = this.getStorageData();
      const meta = this.getMetadata();
      
      const characters = Object.values(storageData.characters);
      const subjectCounts = {};
      const creatorCounts = {};

      characters.forEach(char => {
        subjectCounts[char.subject] = (subjectCounts[char.subject] || 0) + 1;
        const creator = char.metadata?.creator || 'unknown';
        creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
      });

      return {
        totalCharacters: characters.length,
        totalCollections: Object.keys(storageData.collections).length,
        storageSize: this.calculateStorageSize(),
        subjectDistribution: subjectCounts,
        creatorDistribution: creatorCounts,
        lastModified: storageData.lastModified,
        settings: meta.settings
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  /**
   * Clean up storage (remove invalid/corrupted characters)
   */
  cleanupStorage() {
    try {
      const storageData = this.getStorageData();
      const validCharacters = {};
      let cleanedCount = 0;

      Object.entries(storageData.characters).forEach(([id, character]) => {
        const validation = this.validator.validate(character);
        if (validation.isValid) {
          validCharacters[id] = character;
        } else {
          cleanedCount++;
          console.warn(`Removed invalid character ${id}:`, validation.errors);
        }
      });

      storageData.characters = validCharacters;
      storageData.lastModified = new Date().toISOString();

      localStorage.setItem(this.storageKey, JSON.stringify(storageData));
      this.updateMetadata();

      return { cleaned: cleanedCount, remaining: Object.keys(validCharacters).length };
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
      return null;
    }
  }

  // Private helper methods

  getStorageData() {
    const data = localStorage.getItem(this.storageKey);
    if (!data) {
      this.initializeStorage();
      return JSON.parse(localStorage.getItem(this.storageKey));
    }
    return JSON.parse(data);
  }

  getMetadata() {
    const meta = localStorage.getItem(this.metaStorageKey);
    if (!meta) {
      this.initializeStorage();
      return JSON.parse(localStorage.getItem(this.metaStorageKey));
    }
    return JSON.parse(meta);
  }

  updateMetadata() {
    const meta = this.getMetadata();
    const storageData = this.getStorageData();
    
    meta.totalCharacters = Object.keys(storageData.characters).length;
    meta.totalCollections = Object.keys(storageData.collections).length;
    meta.storageSize = this.calculateStorageSize();
    
    localStorage.setItem(this.metaStorageKey, JSON.stringify(meta));
  }

  checkStorageLimits(storageData) {
    const meta = this.getMetadata();
    const currentCount = Object.keys(storageData.characters).length;
    
    if (currentCount >= meta.settings.maxCharacters) {
      return {
        canSave: false,
        reason: 'Storage limit reached',
        details: [`Maximum ${meta.settings.maxCharacters} characters allowed`]
      };
    }

    const storageSize = this.calculateStorageSize();
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (storageSize > maxSize) {
      return {
        canSave: false,
        reason: 'Storage size limit reached',
        details: ['Storage size exceeds 10MB limit']
      };
    }

    return { canSave: true };
  }

  generateCharacterId(character) {
    const baseName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const subject = character.subject.toLowerCase();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    
    return `${baseName}-${subject}-${timestamp}-${random}`;
  }

  generateCollectionId(name) {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    
    return `collection-${baseName}-${timestamp}-${random}`;
  }

  calculateStorageSize() {
    const data = localStorage.getItem(this.storageKey);
    const meta = localStorage.getItem(this.metaStorageKey);
    return (data?.length || 0) + (meta?.length || 0);
  }
}

// Export class only - instances created in index.js
export default CharacterStorage;