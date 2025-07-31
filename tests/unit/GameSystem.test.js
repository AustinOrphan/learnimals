/**
 * GameSystem Unit Tests
 * Tests the core functionality of the GameSystem
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameSystem } from '../../src/utils/GameSystem.js';
import { GameRegistryUtil } from '../../src/config/gameRegistry.js';

// Mock logger with inline mock to avoid hoisting issues
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    level: 2,
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

describe('GameSystem', () => {
  let gameSystem;

  beforeEach(() => {
    gameSystem = new GameSystem();
  });

  describe('initialization', () => {
    it('should initialize with empty registry and active games', () => {
      expect(gameSystem.registry.size).toBe(0);
      expect(gameSystem.activeGames.size).toBe(0);
      expect(gameSystem.initialized).toBe(false);
    });

    it('should have event listener methods', () => {
      expect(typeof gameSystem.on).toBe('function');
      expect(typeof gameSystem.off).toBe('function');
      expect(typeof gameSystem.emit).toBe('function');
    });
  });

  describe('game registration', () => {
    it('should register a valid game', async () => {
      const gameConfig = {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js'
      };

      const registered = await gameSystem.registerGame(gameConfig);
      
      expect(registered.id).toBe('test-game');
      expect(gameSystem.registry.has('test-game')).toBe(true);
    });

    it('should validate game configuration', async () => {
      const invalidConfig = {
        id: 'test game', // Invalid ID with space
        name: 'Test Game'
        // Missing required fields
      };

      await expect(gameSystem.registerGame(invalidConfig))
        .rejects.toThrow();
    });

    it('should set default values for optional fields', async () => {
      const minimalConfig = {
        id: 'minimal-game',
        name: 'Minimal Game',
        gameClass: 'MinimalGame',
        scriptPath: '/minimal/game.js'
      };

      const registered = await gameSystem.registerGame(minimalConfig);
      
      expect(registered.subject).toBe('general');
      expect(registered.difficulty).toEqual(['easy']);
      expect(registered.template).toBe('game');
      expect(registered.features).toContain('analytics');
    });
  });

  describe('game queries', () => {
    beforeEach(async () => {
      // Register test games
      await gameSystem.registerGame({
        id: 'math-game',
        name: 'Math Game',
        gameClass: 'MathGame',
        scriptPath: '/math/game.js',
        subject: 'math',
        difficulty: ['easy', 'medium']
      });

      await gameSystem.registerGame({
        id: 'reading-game',
        name: 'Reading Game',
        gameClass: 'ReadingGame',
        scriptPath: '/reading/game.js',
        subject: 'reading',
        difficulty: ['medium', 'hard']
      });
    });

    it('should get all games', () => {
      const allGames = gameSystem.getAvailableGames();
      expect(allGames).toHaveLength(2);
    });

    it('should filter games by subject', () => {
      const mathGames = gameSystem.getAvailableGames({ subject: 'math' });
      expect(mathGames).toHaveLength(1);
      expect(mathGames[0].id).toBe('math-game');
    });

    it('should filter games by difficulty', () => {
      const mediumGames = gameSystem.getAvailableGames({ difficulty: 'medium' });
      expect(mediumGames).toHaveLength(2);
    });

    it('should filter games by features', () => {
      const analyticsGames = gameSystem.getAvailableGames({ features: 'analytics' });
      expect(analyticsGames).toHaveLength(2); // Both have analytics by default
    });

    it('should get game info by ID', () => {
      const gameInfo = gameSystem.getGameInfo('math-game');
      expect(gameInfo).toBeTruthy();
      expect(gameInfo.name).toBe('Math Game');
    });

    it('should return null for non-existent game', () => {
      const gameInfo = gameSystem.getGameInfo('non-existent');
      expect(gameInfo).toBeNull();
    });
  });

  describe('event system', () => {
    it('should add and remove event listeners', () => {
      const handler = vi.fn();
      
      gameSystem.on('test-event', handler);
      gameSystem.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      
      gameSystem.off('test-event', handler);
      gameSystem.emit('test-event', { data: 'test2' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      gameSystem.on('test-event', handler1);
      gameSystem.on('test-event', handler2);
      gameSystem.emit('test-event', { data: 'test' });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();
      
      gameSystem.on('test-event', errorHandler);
      gameSystem.on('test-event', goodHandler);
      
      // Should not throw
      expect(() => gameSystem.emit('test-event')).not.toThrow();
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await gameSystem.registerGame({
        id: 'stats-game',
        name: 'Stats Game',
        gameClass: 'StatsGame',
        scriptPath: '/stats/game.js'
      });
    });

    it('should provide system statistics', () => {
      const stats = gameSystem.getStats();
      
      expect(stats.registeredGames).toBe(1);
      expect(stats.activeGames).toBe(0);
      expect(stats.initialized).toBe(false);
      expect(stats.gamesList).toContain('stats-game');
    });
  });

  describe('validation', () => {
    it('should validate game config schema', () => {
      const validConfig = {
        id: 'valid-game',
        name: 'Valid Game',
        gameClass: 'ValidGame',
        scriptPath: '/valid/game.js',
        subject: 'math',
        difficulty: ['easy', 'medium'],
        template: 'game',
        features: ['analytics', 'progress']
      };

      const result = gameSystem.validateGameConfig(validConfig);
      expect(result.id).toBe('valid-game');
      expect(result.subject).toBe('math');
    });

    it('should reject invalid game ID format', async () => {
      const invalidConfig = {
        id: 'Invalid Game ID!', // Contains invalid characters
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js'
      };

      await expect(gameSystem.registerGame(invalidConfig))
        .rejects.toThrow('Game ID must be lowercase alphanumeric with hyphens only');
    });

    it('should reject missing required fields', async () => {
      const incompleteConfig = {
        id: 'incomplete-game',
        name: 'Incomplete Game'
        // Missing gameClass and scriptPath
      };

      await expect(gameSystem.registerGame(incompleteConfig))
        .rejects.toThrow();
    });
  });
});

describe('GameRegistryUtil', () => {
  describe('validation', () => {
    it('should validate correct game configuration', () => {
      const validConfig = {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js',
        subject: 'math',
        difficulty: ['easy', 'medium'],
        template: 'game'
      };

      const result = GameRegistryUtil.validateGameConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidConfig = {
        name: 'Invalid Game'
        // Missing id, gameClass, scriptPath
      };

      const result = GameRegistryUtil.validateGameConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
      expect(result.errors).toContain('Missing required field: gameClass');
      expect(result.errors).toContain('Missing required field: scriptPath');
    });

    it('should detect invalid subject', () => {
      const invalidConfig = {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js',
        subject: 'invalid-subject'
      };

      const result = GameRegistryUtil.validateGameConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid subject'))).toBe(true);
    });

    it('should detect invalid difficulty levels', () => {
      const invalidConfig = {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js',
        difficulty: ['easy', 'impossible']
      };

      const result = GameRegistryUtil.validateGameConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid difficulty levels'))).toBe(true);
    });

    it('should detect invalid template', () => {
      const invalidConfig = {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js',
        template: 'invalid-template'
      };

      const result = GameRegistryUtil.validateGameConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid template'))).toBe(true);
    });
  });

  describe('registry queries', () => {
    it('should get unique subjects', () => {
      const subjects = GameRegistryUtil.getSubjects();
      expect(Array.isArray(subjects)).toBe(true);
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects).toContain('math');
      expect(subjects).toContain('reading');
      expect(subjects).toContain('science');
    });

    it('should get unique characters', () => {
      const characters = GameRegistryUtil.getCharacters();
      expect(Array.isArray(characters)).toBe(true);
      expect(characters.length).toBeGreaterThan(0);
    });

    it('should get unique difficulties', () => {
      const difficulties = GameRegistryUtil.getDifficulties();
      expect(Array.isArray(difficulties)).toBe(true);
      expect(difficulties).toContain('easy');
      expect(difficulties).toContain('medium');
      expect(difficulties).toContain('hard');
    });

    it('should provide registry statistics', () => {
      const stats = GameRegistryUtil.getStats();
      expect(stats.totalGames).toBeGreaterThan(0);
      expect(typeof stats.subjects).toBe('object');
      expect(typeof stats.difficulties).toBe('object');
      expect(typeof stats.features).toBe('object');
      expect(typeof stats.needingConversion).toBe('number');
    });
  });

  describe('search and filter', () => {
    it('should search games by query', () => {
      const results = GameRegistryUtil.searchGames('math');
      expect(Array.isArray(results)).toBe(true);
      // Should find games with 'math' in name, description, or subject
    });

    it('should get games by subject', () => {
      const mathGames = GameRegistryUtil.getGamesBySubject('math');
      expect(Array.isArray(mathGames)).toBe(true);
      mathGames.forEach(game => {
        expect(game.subject).toBe('math');
      });
    });

    it('should get games by difficulty', () => {
      const easyGames = GameRegistryUtil.getGamesByDifficulty('easy');
      expect(Array.isArray(easyGames)).toBe(true);
      easyGames.forEach(game => {
        expect(game.difficulty).toContain('easy');
      });
    });

    it('should get games by features', () => {
      const analyticsGames = GameRegistryUtil.getGamesByFeatures('analytics');
      expect(Array.isArray(analyticsGames)).toBe(true);
      analyticsGames.forEach(game => {
        expect(game.features).toContain('analytics');
      });
    });

    it('should identify games needing conversion', () => {
      const needingConversion = GameRegistryUtil.getGamesNeedingConversion();
      expect(Array.isArray(needingConversion)).toBe(true);
      // These should be games that don't have all the full features
    });
  });
});