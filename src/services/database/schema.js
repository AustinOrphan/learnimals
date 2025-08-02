/**
 * Database Schema Configuration
 * Defines the structure and versioning for the Learnimals IndexedDB
 */

export const DB_NAME = 'learnimals';
export const DB_VERSION = 1;

export const STORES = {
  USERS: 'users',
  PROGRESS: 'progress',
  ACHIEVEMENTS: 'achievements',
  ACTIVITIES: 'activities',
  SETTINGS: 'settings',
  SESSIONS: 'sessions',
};

export const SCHEMAS = {
  [STORES.USERS]: {
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'lastActive', keyPath: 'lastActive', unique: false },
    ],
  },

  [STORES.PROGRESS]: {
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'activityId', keyPath: 'activityId', unique: false },
      { name: 'subject', keyPath: 'subject', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'userActivity', keyPath: ['userId', 'activityId'], unique: false },
    ],
  },

  [STORES.ACHIEVEMENTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'subject', keyPath: 'subject', unique: false },
      { name: 'unlockedAt', keyPath: 'unlockedAt', unique: false },
      { name: 'userType', keyPath: ['userId', 'type'], unique: false },
    ],
  },

  [STORES.ACTIVITIES]: {
    keyPath: 'id',
    indexes: [
      { name: 'subject', keyPath: 'subject', unique: false },
      { name: 'difficulty', keyPath: 'difficulty', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },

  [STORES.SETTINGS]: {
    keyPath: 'userId',
    indexes: [
      { name: 'theme', keyPath: 'preferences.theme', unique: false },
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false },
    ],
  },

  [STORES.SESSIONS]: {
    keyPath: 'id',
    indexes: [
      { name: 'userId', keyPath: 'userId', unique: false },
      { name: 'startTime', keyPath: 'startTime', unique: false },
      { name: 'endTime', keyPath: 'endTime', unique: false },
      { name: 'duration', keyPath: 'duration', unique: false },
    ],
  },
};

/**
 * Data validation schemas
 */
export const VALIDATION_SCHEMAS = {
  USER: {
    id: { type: 'string', required: true },
    email: { type: 'string', required: false },
    name: { type: 'string', required: true },
    preferences: { type: 'object', required: false },
    createdAt: { type: 'date', required: true },
    lastActive: { type: 'date', required: true },
  },

  PROGRESS: {
    id: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    activityId: { type: 'string', required: true },
    subject: { type: 'string', required: true },
    score: { type: 'number', required: true },
    completion: { type: 'number', required: true },
    timeSpent: { type: 'number', required: true },
    timestamp: { type: 'date', required: true },
    data: { type: 'object', required: false },
  },

  ACHIEVEMENT: {
    id: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    type: { type: 'string', required: true },
    subject: { type: 'string', required: false },
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    points: { type: 'number', required: true },
    unlockedAt: { type: 'date', required: true },
    metadata: { type: 'object', required: false },
  },
};

/**
 * Migration functions for database versioning
 */
export const MIGRATIONS = {
  1: {
    description: 'Initial database setup',
    up: (db, _transaction) => {
      // Create all stores with their schemas
      Object.entries(SCHEMAS).forEach(([storeName, schema]) => {
        const store = db.createObjectStore(storeName, { keyPath: schema.keyPath });

        // Create indexes
        schema.indexes.forEach(index => {
          store.createIndex(index.name, index.keyPath, { unique: index.unique });
        });
      });
    },
  },
};

/**
 * Utility functions
 */
export function validateData(data, schema) {
  const errors = [];

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Field '${field}' is required`);
      return;
    }

    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      return;
    }

    // Type validation
    switch (rules.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`Field '${field}' must be a string`);
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`Field '${field}' must be a number`);
      }
      break;
    case 'date':
      if (!(value instanceof Date) && !Date.parse(value)) {
        errors.push(`Field '${field}' must be a valid date`);
      }
      break;
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`Field '${field}' must be an object`);
      }
      break;
    }
  });

  return errors;
}

export function generateId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}`;
}
