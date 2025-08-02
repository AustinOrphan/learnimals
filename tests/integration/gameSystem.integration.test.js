/**
 * GameSystem Integration Tests
 * Tests the full pipeline of GameSystem with templates and games
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import gameSystem from '../../src/utils/GameSystem.js';

// Mock modules
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GameSystem Integration', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Set up DOM environment with proper JSDOM configuration
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="game-container"></div>
          <div id="header-score">0</div>
          <div id="header-level">1</div>
          <div id="progress-fill" style="width: 0%"></div>
        </body>
      </html>
    `,
      {
        url: 'http://localhost:3000/',
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously',
      }
    );

    document = dom.window.document;
    window = dom.window;

    // Set globals with proper JSDOM window
    global.document = document;
    global.window = window;
    global.navigator = window.navigator;
    global.localStorage = window.localStorage;
    global.sessionStorage = window.sessionStorage;

    // Mock fetch for template loading
    global.fetch = vi.fn(url => {
      if (url.includes('game.html')) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
            <div id="{{containerId}}" class="game-container">
              {{gameContent}}
            </div>
          `),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(async () => {
    // Clean up
    if (gameSystem.initialized) {
      await gameSystem.destroy();
    }
    vi.clearAllMocks();
    dom.window.close();
  });

  describe('Full Pipeline Test', () => {
    it('should initialize GameSystem successfully', async () => {
      await gameSystem.init();

      expect(gameSystem.initialized).toBe(true);
      expect(gameSystem.templateEngine).toBeDefined();
    });

    it('should register a game successfully', async () => {
      await gameSystem.init();

      const gameConfig = {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test/game.js',
        subject: 'math',
      };

      const registered = await gameSystem.registerGame(gameConfig);

      expect(registered).toBeDefined();
      expect(registered.id).toBe('test-game');
      expect(gameSystem.registry.has('test-game')).toBe(true);
    });

    it('should handle template rendering', async () => {
      await gameSystem.init();

      const mockTemplate = '<div>{{gameName}}</div>';
      const vars = { gameName: 'Test Game' };

      const result = gameSystem.templateEngine.processTemplate(mockTemplate, vars);

      expect(result).toBe('<div>Test Game</div>');
    });

    it('should process template conditionals', async () => {
      await gameSystem.init();

      const template = '{{#if showStats}}<div>Stats</div>{{/if}}';

      const result1 = gameSystem.templateEngine.processTemplate(template, { showStats: true });
      expect(result1).toBe('<div>Stats</div>');

      const result2 = gameSystem.templateEngine.processTemplate(template, { showStats: false });
      expect(result2).toBe('');
    });

    it('should handle template loops', async () => {
      await gameSystem.init();

      const template = '{{#each items}}<li>{{this}}</li>{{/each}}';
      const vars = { items: ['A', 'B', 'C'] };

      const result = gameSystem.templateEngine.processTemplate(template, vars);

      expect(result).toBe('<li>A</li><li>B</li><li>C</li>');
    });

    it('should emit and handle events correctly', async () => {
      await gameSystem.init();

      const mockHandler = vi.fn();
      gameSystem.on('test-event', mockHandler);

      gameSystem.emit('test-event', { data: 'test' });

      expect(mockHandler).toHaveBeenCalledWith({ data: 'test' });

      // Test event removal
      gameSystem.off('test-event', mockHandler);
      gameSystem.emit('test-event', { data: 'test2' });

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should filter games by subject', async () => {
      // Create a fresh GameSystem instance for this test
      const { GameSystem } = await import('../../src/utils/GameSystem.js');
      const testGameSystem = new GameSystem();

      // Don't load the actual registry
      testGameSystem.loadGameRegistry = vi.fn().mockResolvedValue();

      await testGameSystem.init();

      // Register test games
      await testGameSystem.registerGame({
        id: 'math-game-1',
        name: 'Math Game 1',
        gameClass: 'MathGame1',
        scriptPath: '/math1.js',
        subject: 'math',
      });

      await testGameSystem.registerGame({
        id: 'reading-game-1',
        name: 'Reading Game 1',
        gameClass: 'ReadingGame1',
        scriptPath: '/reading1.js',
        subject: 'reading',
      });

      const mathGames = testGameSystem.getAvailableGames({ subject: 'math' });
      expect(mathGames).toHaveLength(1);
      expect(mathGames[0].id).toBe('math-game-1');

      await testGameSystem.destroy();
    });

    it('should provide accurate system statistics', async () => {
      await gameSystem.init();

      await gameSystem.registerGame({
        id: 'stats-test',
        name: 'Stats Test',
        gameClass: 'StatsTest',
        scriptPath: '/stats.js',
      });

      const stats = gameSystem.getStats();

      expect(stats.initialized).toBe(true);
      expect(stats.registeredGames).toBeGreaterThan(0);
      expect(stats.activeGames).toBe(0);
      expect(stats.gamesList).toContain('stats-test');
    });
  });

  describe('Template Engine', () => {
    it('should cache templates', async () => {
      await gameSystem.init();

      const engine = gameSystem.templateEngine;

      // First call should fetch
      await engine.getTemplate('game');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await engine.getTemplate('game');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle missing templates gracefully', async () => {
      await gameSystem.init();

      const engine = gameSystem.templateEngine;

      // Mock fetch to fail for non-existent template
      global.fetch = vi.fn().mockRejectedValue(new Error('Not found'));

      // Should fall back to minimal template
      const template = await engine.getTemplate('non-existent');
      expect(template).toContain('<!doctype html>');
    });

    it('should escape HTML in template variables', async () => {
      await gameSystem.init();

      const template = '<div>{{userInput}}</div>';
      const vars = { userInput: '<script>alert("XSS")</script>' };

      const result = gameSystem.templateEngine.processTemplate(template, vars);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should build feature flags correctly', async () => {
      await gameSystem.init();

      const features = ['analytics', 'themes'];
      const flags = gameSystem.templateEngine.buildFeatureFlags(features);

      expect(flags.analytics).toBe(true);
      expect(flags.themes).toBe(true);
      expect(flags.progress).toBe(false);
      expect(flags.mobile).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid game registration', async () => {
      await gameSystem.init();

      const invalidConfigs = [
        null,
        {},
        { id: 'INVALID ID!' }, // Invalid characters
        { id: 'valid-id' }, // Missing required fields
      ];

      for (const config of invalidConfigs) {
        await expect(gameSystem.registerGame(config)).rejects.toThrow();
      }
    });

    it('should handle errors in event handlers', async () => {
      await gameSystem.init();

      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      const goodHandler = vi.fn();

      gameSystem.on('test', errorHandler);
      gameSystem.on('test', goodHandler);

      // Should not throw and good handler should still be called
      expect(() => gameSystem.emit('test')).not.toThrow();
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('Game Registry Utilities', () => {
    it('should validate game configurations', () => {
      const { GameRegistryUtil } = require('../../src/config/gameRegistry.js');

      const validConfig = {
        id: 'valid-game',
        name: 'Valid Game',
        gameClass: 'ValidGame',
        scriptPath: '/valid.js',
        subject: 'math',
        difficulty: ['easy', 'medium'],
        template: 'game',
      };

      const validation = GameRegistryUtil.validateGameConfig(validConfig);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect configuration errors', () => {
      const { GameRegistryUtil } = require('../../src/config/gameRegistry.js');

      const invalidConfig = {
        id: 'Invalid Game!',
        name: 'Test',
        subject: 'invalid-subject',
        difficulty: ['super-hard'],
        template: 'invalid-template',
      };

      const validation = GameRegistryUtil.validateGameConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
