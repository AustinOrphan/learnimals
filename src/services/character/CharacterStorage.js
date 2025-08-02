/**
 * Character Storage Service
 *
 * Handles persistent storage and retrieval of character data using IndexedDB.
 * Provides caching, validation, and migration capabilities.
 */

import { CharacterValidation } from '../../data/characterSchema.js';

export class CharacterStorage {
  constructor() {
    this.dbName = 'learnimals_characters';
    this.version = 1;
    this.db = null;
    this.cache = new Map();
    this.isInitialized = false;

    // Store names
    this.stores = {
      CHARACTERS: 'characters',
      USER_CHARACTERS: 'user_characters',
      SHARED_CHARACTERS: 'shared_characters',
      METADATA: 'storage_metadata',
    };
  }

  /**
   * Initialize the IndexedDB connection and create object stores
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    if (this.isInitialized) {
      return true;
    }

    try {
      this.db = await this.openDatabase();
      this.isInitialized = true;
      console.log('Character storage initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize character storage:', error);

      // Fallback to localStorage if IndexedDB fails
      this.initializeLocalStorageFallback();
      return false;
    }
  }

  /**
   * Open IndexedDB connection and set up object stores
   * @returns {Promise<IDBDatabase>} Database connection
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB: ' + request.error));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        // Characters store - for all character data
        if (!db.objectStoreNames.contains(this.stores.CHARACTERS)) {
          const charactersStore = db.createObjectStore(this.stores.CHARACTERS, {
            keyPath: 'id',
          });

          // Indexes for efficient querying
          charactersStore.createIndex('owner', 'owner', { unique: false });
          charactersStore.createIndex('created', 'created', { unique: false });
          charactersStore.createIndex('lastModified', 'lastModified', { unique: false });
          charactersStore.createIndex('isCustom', 'isCustom', { unique: false });
          charactersStore.createIndex('species', 'species.primary', { unique: false });
          charactersStore.createIndex('favoriteSubject', 'personality.favoriteSubject', {
            unique: false,
          });
        }

        // User characters mapping
        if (!db.objectStoreNames.contains(this.stores.USER_CHARACTERS)) {
          const userCharactersStore = db.createObjectStore(this.stores.USER_CHARACTERS, {
            keyPath: 'userId',
          });
          userCharactersStore.createIndex('activeCharacter', 'activeCharacterId', {
            unique: false,
          });
        }

        // Shared characters for social features
        if (!db.objectStoreNames.contains(this.stores.SHARED_CHARACTERS)) {
          const sharedStore = db.createObjectStore(this.stores.SHARED_CHARACTERS, {
            keyPath: 'shareId',
          });
          sharedStore.createIndex('characterId', 'characterId', { unique: false });
          sharedStore.createIndex('created', 'created', { unique: false });
          sharedStore.createIndex('isPublic', 'isPublic', { unique: false });
        }

        // Metadata store for storage information
        if (!db.objectStoreNames.contains(this.stores.METADATA)) {
          db.createObjectStore(this.stores.METADATA, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Save a character to storage
   * @param {Object} character - Character data to save
   * @param {string} [ownerId] - ID of the character owner
   * @returns {Promise<string>} Character ID
   */
  async saveCharacter(character, ownerId = 'default') {
    if (!this.isInitialized) {
      await this.init();
    }

    // Validate character data
    const validationResult = this.validateCharacter(character);
    if (!validationResult.isValid) {
      throw new Error('Invalid character data: ' + validationResult.errors.join(', '));
    }

    // Prepare character for storage
    const characterToSave = {
      ...character,
      owner: ownerId,
      lastModified: new Date(),
      size: this.calculateDataSize(character),
    };

    try {
      if (this.db) {
        // Save to IndexedDB
        await this.saveToIndexedDB(characterToSave);
      } else {
        // Fallback to localStorage
        await this.saveToLocalStorage(characterToSave);
      }

      // Update cache
      this.cache.set(character.id, characterToSave);

      console.log(`Character ${character.id} saved successfully`);
      return character.id;
    } catch (error) {
      console.error('Failed to save character:', error);
      throw new Error('Failed to save character: ' + error.message);
    }
  }

  /**
   * Load a character from storage
   * @param {string} characterId - ID of character to load
   * @returns {Promise<Object|null>} Character data or null if not found
   */
  async loadCharacter(characterId) {
    if (!this.isInitialized) {
      await this.init();
    }

    // Check cache first
    if (this.cache.has(characterId)) {
      return this.cache.get(characterId);
    }

    try {
      let character = null;

      if (this.db) {
        character = await this.loadFromIndexedDB(characterId);
      } else {
        character = await this.loadFromLocalStorage(characterId);
      }

      if (character) {
        // Migrate character data if needed
        character = this.migrateCharacterData(character);

        // Cache the character
        this.cache.set(characterId, character);
      }

      return character;
    } catch (error) {
      console.error('Failed to load character:', error);
      return null;
    }
  }

  /**
   * Get all characters for a user
   * @param {string} [ownerId] - Owner ID to filter by
   * @returns {Promise<Array>} Array of characters
   */
  async getUserCharacters(ownerId = 'default') {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      let characters = [];

      if (this.db) {
        characters = await this.getUserCharactersFromIndexedDB(ownerId);
      } else {
        characters = await this.getUserCharactersFromLocalStorage(ownerId);
      }

      // Sort by last modified (most recent first)
      characters.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

      return characters;
    } catch (error) {
      console.error('Failed to get user characters:', error);
      return [];
    }
  }

  /**
   * Delete a character from storage
   * @param {string} characterId - ID of character to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteCharacter(characterId) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      if (this.db) {
        await this.deleteFromIndexedDB(characterId);
      } else {
        await this.deleteFromLocalStorage(characterId);
      }

      // Remove from cache
      this.cache.delete(characterId);

      console.log(`Character ${characterId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Failed to delete character:', error);
      return false;
    }
  }

  /**
   * IndexedDB save operation
   * @param {Object} character - Character to save
   * @returns {Promise<void>}
   */
  saveToIndexedDB(character) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.CHARACTERS], 'readwrite');
      const store = transaction.objectStore(this.stores.CHARACTERS);
      const request = store.put(character);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * IndexedDB load operation
   * @param {string} characterId - Character ID to load
   * @returns {Promise<Object|null>}
   */
  loadFromIndexedDB(characterId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.CHARACTERS], 'readonly');
      const store = transaction.objectStore(this.stores.CHARACTERS);
      const request = store.get(characterId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get user characters from IndexedDB
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Array>}
   */
  getUserCharactersFromIndexedDB(ownerId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.CHARACTERS], 'readonly');
      const store = transaction.objectStore(this.stores.CHARACTERS);
      const index = store.index('owner');
      const request = index.getAll(ownerId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete from IndexedDB
   * @param {string} characterId - Character ID to delete
   * @returns {Promise<void>}
   */
  deleteFromIndexedDB(characterId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.CHARACTERS], 'readwrite');
      const store = transaction.objectStore(this.stores.CHARACTERS);
      const request = store.delete(characterId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Initialize localStorage fallback
   */
  initializeLocalStorageFallback() {
    this.storageKey = 'learnimals_characters';
    this.isInitialized = true;
    console.warn('Using localStorage fallback for character storage');
  }

  /**
   * Save to localStorage
   * @param {Object} character - Character to save
   * @returns {Promise<void>}
   */
  async saveToLocalStorage(character) {
    try {
      const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      existingData[character.id] = character;
      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
    } catch (error) {
      throw new Error('localStorage save failed: ' + error.message);
    }
  }

  /**
   * Load from localStorage
   * @param {string} characterId - Character ID to load
   * @returns {Promise<Object|null>}
   */
  async loadFromLocalStorage(characterId) {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      return data[characterId] || null;
    } catch (error) {
      console.error('localStorage load failed:', error);
      return null;
    }
  }

  /**
   * Get user characters from localStorage
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Array>}
   */
  async getUserCharactersFromLocalStorage(ownerId) {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      return Object.values(data).filter(char => char.owner === ownerId);
    } catch (error) {
      console.error('localStorage getUserCharacters failed:', error);
      return [];
    }
  }

  /**
   * Delete from localStorage
   * @param {string} characterId - Character ID to delete
   * @returns {Promise<void>}
   */
  async deleteFromLocalStorage(characterId) {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      delete data[characterId];
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      throw new Error('localStorage delete failed: ' + error.message);
    }
  }

  /**
   * Validate character data against schema
   * @param {Object} character - Character to validate
   * @returns {Object} Validation result
   */
  validateCharacter(character) {
    const errors = [];

    // Check required fields
    CharacterValidation.required.forEach(field => {
      if (!this.getNestedValue(character, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check data types
    Object.entries(CharacterValidation.types).forEach(([field, expectedType]) => {
      const value = this.getNestedValue(character, field);
      if (value !== undefined && typeof value !== expectedType) {
        errors.push(`Invalid type for ${field}: expected ${expectedType}`);
      }
    });

    // Check enum values
    Object.entries(CharacterValidation.enums).forEach(([field, validValues]) => {
      const value = this.getNestedValue(character, field);
      if (value !== undefined && !validValues.includes(value)) {
        errors.push(`Invalid value for ${field}: ${value}`);
      }
    });

    // Check numeric ranges
    Object.entries(CharacterValidation.ranges).forEach(([field, [min, max]]) => {
      const value = this.getNestedValue(character, field);
      if (value !== undefined && (value < min || value > max)) {
        errors.push(`Value out of range for ${field}: ${value} (expected ${min}-${max})`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Get nested object value using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Migrate character data to current version
   * @param {Object} character - Character to migrate
   * @returns {Object} Migrated character
   */
  migrateCharacterData(character) {
    // Add migration logic here when schema versions change
    if (!character.version || character.version < 1) {
      // Migrate to version 1
      character.version = 1;
      character.lastModified = new Date();
    }

    return character;
  }

  /**
   * Calculate approximate data size
   * @param {Object} data - Data to measure
   * @returns {number} Size in bytes
   */
  calculateDataSize(data) {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const characters = await this.getUserCharacters();
      const totalSize = characters.reduce((sum, char) => sum + (char.size || 0), 0);

      return {
        characterCount: characters.length,
        totalSize: totalSize,
        averageSize: characters.length > 0 ? totalSize / characters.length : 0,
        cacheSize: this.cache.size,
        storageType: this.db ? 'IndexedDB' : 'localStorage',
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  /**
   * Clear all character data (use with caution!)
   * @returns {Promise<boolean>} Success status
   */
  async clearAllData() {
    try {
      if (this.db) {
        const transaction = this.db.transaction([this.stores.CHARACTERS], 'readwrite');
        const store = transaction.objectStore(this.stores.CHARACTERS);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        localStorage.removeItem(this.storageKey);
      }

      this.cache.clear();
      console.log('All character data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear character data:', error);
      return false;
    }
  }
}

export default CharacterStorage;
