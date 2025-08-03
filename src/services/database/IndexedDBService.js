/**
 * IndexedDB Service
 * Provides a robust, promise-based interface to IndexedDB for user data storage
 */

import { 
  DB_NAME, 
  DB_VERSION, 
  STORES, 
  MIGRATIONS,
  validateData,
  generateId 
} from './schema.js';
import logger from '../../utils/logger.js';

export class IndexedDBService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.subscribers = new Set();
  }

  /**
   * Initialize the database connection
   * @returns {Promise<IDBDatabase>}
   */
  async initialize() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._openDatabase();
    
    try {
      this.db = await this.initPromise;
      this.isInitialized = true;
      logger.info('IndexedDB initialized successfully');
      return this.db;
    } catch (error) {
      logger.error('Failed to initialize IndexedDB:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Open database connection with proper error handling
   * @private
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('IndexedDB connection failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.debug('IndexedDB connection established');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        logger.info(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);
        const db = event.target.result;
        this._handleUpgrade(db, event.oldVersion, event.newVersion);
      };

      request.onblocked = () => {
        logger.warn('IndexedDB upgrade blocked - close other tabs');
      };
    });
  }

  /**
   * Handle database upgrades and migrations
   * @private
   */
  _handleUpgrade(db, oldVersion, newVersion) {
    try {
      // Run migrations from oldVersion to newVersion
      for (let version = oldVersion + 1; version <= newVersion; version++) {
        const migration = MIGRATIONS[version];
        if (migration) {
          logger.info(`Running migration ${version}: ${migration.description}`);
          migration.up(db, null);
        }
      }
    } catch (error) {
      logger.error('Database migration failed:', error);
      throw error;
    }
  }

  /**
   * Generic method to add data to a store
   * @param {string} storeName - Name of the store
   * @param {Object} data - Data to add
   * @param {Object} validationSchema - Optional validation schema
   * @returns {Promise<string>} - ID of the added record
   */
  async add(storeName, data, validationSchema = null) {
    await this.initialize();

    // Validate data if schema provided
    if (validationSchema) {
      const errors = validateData(data, validationSchema);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }
    }

    // Generate ID if not provided
    if (!data.id) {
      data.id = generateId(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => {
        logger.debug(`Added record to ${storeName}:`, data.id);
        this._notifySubscribers('add', storeName, data);
        resolve(data.id);
      };

      request.onerror = () => {
        logger.error(`Failed to add record to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to update data in a store
   * @param {string} storeName - Name of the store
   * @param {Object} data - Data to update (must include ID)
   * @param {Object} validationSchema - Optional validation schema
   * @returns {Promise<string>} - ID of the updated record
   */
  async update(storeName, data, validationSchema = null) {
    await this.initialize();

    if (!data.id) {
      throw new Error('Data must include an ID for updates');
    }

    // Validate data if schema provided
    if (validationSchema) {
      const errors = validateData(data, validationSchema);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        logger.debug(`Updated record in ${storeName}:`, data.id);
        this._notifySubscribers('update', storeName, data);
        resolve(data.id);
      };

      request.onerror = () => {
        logger.error(`Failed to update record in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to get data from a store by ID
   * @param {string} storeName - Name of the store
   * @param {string} id - ID of the record
   * @returns {Promise<Object|null>} - The record or null if not found
   */
  async get(storeName, id) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result || null;
        logger.debug(`Retrieved record from ${storeName}:`, id, !!result);
        resolve(result);
      };

      request.onerror = () => {
        logger.error(`Failed to get record from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to get all data from a store
   * @param {string} storeName - Name of the store
   * @param {number} limit - Optional limit
   * @returns {Promise<Array>} - Array of records
   */
  async getAll(storeName, limit = null) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = limit ? store.getAll(undefined, limit) : store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        logger.debug(`Retrieved ${results.length} records from ${storeName}`);
        resolve(results);
      };

      request.onerror = () => {
        logger.error(`Failed to get all records from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Query data using an index
   * @param {string} storeName - Name of the store
   * @param {string} indexName - Name of the index
   * @param {*} value - Value to query for
   * @param {number} limit - Optional limit
   * @returns {Promise<Array>} - Array of matching records
   */
  async queryByIndex(storeName, indexName, value, limit = null) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = limit ? index.getAll(value, limit) : index.getAll(value);

      request.onsuccess = () => {
        const results = request.result || [];
        logger.debug(`Queried ${results.length} records from ${storeName} by ${indexName}`);
        resolve(results);
      };

      request.onerror = () => {
        logger.error(`Failed to query records from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a record by ID
   * @param {string} storeName - Name of the store
   * @param {string} id - ID of the record to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(storeName, id) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        logger.debug(`Deleted record from ${storeName}:`, id);
        this._notifySubscribers('delete', storeName, { id });
        resolve(true);
      };

      request.onerror = () => {
        logger.error(`Failed to delete record from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data from a store
   * @param {string} storeName - Name of the store
   * @returns {Promise<boolean>} - Success status
   */
  async clear(storeName) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        logger.info(`Cleared all records from ${storeName}`);
        this._notifySubscribers('clear', storeName, null);
        resolve(true);
      };

      request.onerror = () => {
        logger.error(`Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Subscribe to database changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of changes
   * @private
   */
  _notifySubscribers(action, storeName, data) {
    const event = { action, storeName, data, timestamp: new Date() };
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in database subscriber:', error);
      }
    });
  }

  /**
   * Export data for backup
   * @returns {Promise<Object>} - All data from all stores
   */
  async exportData() {
    await this.initialize();
    
    const backup = {};
    
    for (const storeName of Object.values(STORES)) {
      try {
        backup[storeName] = await this.getAll(storeName);
      } catch (error) {
        logger.error(`Failed to export ${storeName}:`, error);
        backup[storeName] = [];
      }
    }
    
    backup.metadata = {
      version: DB_VERSION,
      exportedAt: new Date(),
      stores: Object.keys(backup).filter(key => key !== 'metadata')
    };
    
    logger.info('Data export completed');
    return backup;
  }

  /**
   * Import data from backup
   * @param {Object} backupData - Data to import
   * @returns {Promise<boolean>} - Success status
   */
  async importData(backupData) {
    await this.initialize();
    
    if (!backupData.metadata) {
      throw new Error('Invalid backup data - missing metadata');
    }
    
    const transaction = this.db.transaction(Object.values(STORES), 'readwrite');
    
    try {
      for (const [storeName, records] of Object.entries(backupData)) {
        if (storeName === 'metadata' || !Array.isArray(records)) {
          continue;
        }
        
        const store = transaction.objectStore(storeName);
        
        for (const record of records) {
          await new Promise((resolve, reject) => {
            const request = store.put(record);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
      
      logger.info('Data import completed successfully');
      return true;
    } catch (error) {
      logger.error('Data import failed:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
      logger.info('IndexedDB connection closed');
    }
  }

  /**
   * Delete the entire database
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        logger.info('Database deleted successfully');
        resolve(true);
      };
      
      request.onerror = () => {
        logger.error('Failed to delete database:', request.error);
        reject(request.error);
      };
      
      request.onblocked = () => {
        logger.warn('Database deletion blocked - close other tabs');
      };
    });
  }

  /**
   * Get database information
   * @returns {Promise<Object>} - Database info
   */
  async getInfo() {
    await this.initialize();
    
    const info = {
      name: DB_NAME,
      version: DB_VERSION,
      stores: Object.values(STORES),
      isConnected: !!this.db,
      objectStoreNames: Array.from(this.db.objectStoreNames)
    };
    
    // Get record counts for each store
    for (const storeName of Object.values(STORES)) {
      try {
        const records = await this.getAll(storeName);
        info[`${storeName}Count`] = records.length;
      } catch (error) {
        info[`${storeName}Count`] = 0;
      }
    }
    
    return info;
  }
}

// Create and export a singleton instance
export const dbService = new IndexedDBService();