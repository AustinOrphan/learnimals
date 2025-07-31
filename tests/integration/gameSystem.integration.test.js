/**
 * GameSystem Integration Tests
 * Tests the full pipeline of GameSystem with templates and games
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import gameSystem from '../../src/utils/GameSystem.js';
import { createLoggerMock } from '../helpers/centralizedMocks.js';
import { 
  mockComponentDependencies,
  cleanupIntegrationTest 
} from '../helpers/integrationTestUtils.js';

// Mock modules using centralized mocks
vi.mock('../../src/utils/logger.js', createLoggerMock);

describe('GameSystem Integration', () => {
  let dom;
  let document;
  let window;
  
  beforeEach(() => {
    // Mock component dependencies
    mockComponentDependencies();
    
    // Set up DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GameSystem Test</title>
        </head>
        <body>
          <div id="game-container"></div>
          <div id="game-canvas"></div>
          <div class="game-controls">
            <button id="start-btn">Start</button>
            <button id="pause-btn">Pause</button>
            <button id="reset-btn">Reset</button>
          </div>
          <div class="score-display">
            <span id="score">0</span>
            <span id="high-score">0</span>
          </div>
        </body>
      </html>
    `, { 
      url: 'http://localhost:3000',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    
    document = dom.window.document;
    window = dom.window;
    
    // Set up global variables
    global.document = document;
    global.window = window;
    global.navigator = window.navigator;
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Mock fetch
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      })
    );
  });
  
  afterEach(() => {
    // Clean up
    cleanupIntegrationTest();
    vi.clearAllMocks();
    vi.resetModules();
  });
  
  describe('Game Template Registration', () => {
    it('should register a game template correctly', () => {
      const mockTemplate = {
        id: 'test-game',
        name: 'Test Game',
        description: 'A test game template',
        category: 'test',
        difficulty: 'easy',
        minPlayers: 1,
        maxPlayers: 1,
        
        init: vi.fn(function(container, options) {
          this.container = container;
          this.options = options;
          this.score = 0;
          return this;
        }),
        
        start: vi.fn(function() {
          this.isRunning = true;
        }),
        
        pause: vi.fn(function() {
          this.isRunning = false;
        }),
        
        reset: vi.fn(function() {
          this.score = 0;
          this.isRunning = false;
        }),
        
        destroy: vi.fn(function() {
          this.container = null;
        })
      };
      
      // Register template
      const result = gameSystem.registerTemplate(mockTemplate);
      
      expect(result).toBe(true);
      expect(gameSystem.getTemplate('test-game')).toBeDefined();
      expect(gameSystem.getTemplate('test-game').name).toBe('Test Game');
    });
    
    it('should handle duplicate template registration', () => {
      const template = {
        id: 'duplicate-game',
        name: 'Duplicate Game',
        init: vi.fn(),
        start: vi.fn()
      };
      
      // First registration should succeed
      expect(gameSystem.registerTemplate(template)).toBe(true);
      
      // Second registration should fail
      expect(gameSystem.registerTemplate(template)).toBe(false);
    });
  });
  
  describe('Game Instance Creation', () => {
    beforeEach(() => {
      // Register a test template
      gameSystem.registerTemplate({
        id: 'instance-test',
        name: 'Instance Test Game',
        init: vi.fn(function(container, options) {
          this.container = container;
          this.options = options;
          this.initialized = true;
          return this;
        }),
        start: vi.fn(),
        pause: vi.fn(),
        reset: vi.fn(),
        destroy: vi.fn()
      });
    });
    
    it('should create a game instance from template', () => {
      const container = document.getElementById('game-container');
      const options = { difficulty: 'medium', soundEnabled: true };
      
      const instance = gameSystem.createGame('instance-test', container, options);
      
      expect(instance).toBeDefined();
      expect(instance.initialized).toBe(true);
      expect(instance.container).toBe(container);
      expect(instance.options).toEqual(options);
    });
    
    it('should track active game instances', () => {
      const container = document.getElementById('game-container');
      
      const instance1 = gameSystem.createGame('instance-test', container);
      expect(gameSystem.getActiveGames()).toHaveLength(1);
      
      const instance2 = gameSystem.createGame('instance-test', container);
      expect(gameSystem.getActiveGames()).toHaveLength(2);
      
      // Destroy one instance
      gameSystem.destroyGame(instance1.id);
      expect(gameSystem.getActiveGames()).toHaveLength(1);
    });
  });
  
  describe('Game Lifecycle Management', () => {
    let gameInstance;
    let container;
    
    beforeEach(() => {
      container = document.getElementById('game-container');
      
      // Register lifecycle test template
      gameSystem.registerTemplate({
        id: 'lifecycle-test',
        name: 'Lifecycle Test',
        
        init: vi.fn(function(cont, opts) {
          this.container = cont;
          this.state = 'initialized';
          this.score = 0;
          return this;
        }),
        
        start: vi.fn(function() {
          this.state = 'running';
          this.startTime = Date.now();
        }),
        
        pause: vi.fn(function() {
          this.state = 'paused';
          this.pauseTime = Date.now();
        }),
        
        resume: vi.fn(function() {
          this.state = 'running';
          this.resumeTime = Date.now();
        }),
        
        reset: vi.fn(function() {
          this.state = 'initialized';
          this.score = 0;
          this.startTime = null;
        }),
        
        destroy: vi.fn(function() {
          this.state = 'destroyed';
          this.container = null;
        })
      });
      
      gameInstance = gameSystem.createGame('lifecycle-test', container);
    });
    
    it('should manage game state transitions correctly', () => {
      expect(gameInstance.state).toBe('initialized');
      
      // Start game
      gameInstance.start();
      expect(gameInstance.state).toBe('running');
      expect(gameInstance.startTime).toBeDefined();
      
      // Pause game
      gameInstance.pause();
      expect(gameInstance.state).toBe('paused');
      expect(gameInstance.pauseTime).toBeDefined();
      
      // Resume game
      gameInstance.resume();
      expect(gameInstance.state).toBe('running');
      expect(gameInstance.resumeTime).toBeDefined();
      
      // Reset game
      gameInstance.reset();
      expect(gameInstance.state).toBe('initialized');
      expect(gameInstance.score).toBe(0);
      expect(gameInstance.startTime).toBeNull();
    });
    
    it('should properly destroy game instances', () => {
      const gameId = gameInstance.id;
      
      expect(gameSystem.getActiveGames()).toContainEqual(
        expect.objectContaining({ id: gameId })
      );
      
      // Destroy game
      gameSystem.destroyGame(gameId);
      
      expect(gameInstance.state).toBe('destroyed');
      expect(gameInstance.container).toBeNull();
      expect(gameSystem.getActiveGames()).not.toContainEqual(
        expect.objectContaining({ id: gameId })
      );
    });
  });
  
  describe('Template Categories and Filtering', () => {
    beforeEach(() => {
      // Register multiple templates
      const templates = [
        { id: 'math-1', name: 'Math Game 1', category: 'math', difficulty: 'easy' },
        { id: 'math-2', name: 'Math Game 2', category: 'math', difficulty: 'hard' },
        { id: 'puzzle-1', name: 'Puzzle Game 1', category: 'puzzle', difficulty: 'medium' },
        { id: 'puzzle-2', name: 'Puzzle Game 2', category: 'puzzle', difficulty: 'easy' },
        { id: 'action-1', name: 'Action Game 1', category: 'action', difficulty: 'hard' }
      ];
      
      templates.forEach(template => {
        gameSystem.registerTemplate({
          ...template,
          init: vi.fn(),
          start: vi.fn()
        });
      });
    });
    
    it('should filter templates by category', () => {
      const mathGames = gameSystem.getTemplatesByCategory('math');
      expect(mathGames).toHaveLength(2);
      expect(mathGames.every(g => g.category === 'math')).toBe(true);
      
      const puzzleGames = gameSystem.getTemplatesByCategory('puzzle');
      expect(puzzleGames).toHaveLength(2);
      
      const actionGames = gameSystem.getTemplatesByCategory('action');
      expect(actionGames).toHaveLength(1);
    });
    
    it('should filter templates by difficulty', () => {
      const easyGames = gameSystem.getTemplatesByDifficulty('easy');
      expect(easyGames).toHaveLength(2);
      expect(easyGames.every(g => g.difficulty === 'easy')).toBe(true);
      
      const hardGames = gameSystem.getTemplatesByDifficulty('hard');
      expect(hardGames).toHaveLength(2);
    });
    
    it('should get all available categories', () => {
      const categories = gameSystem.getCategories();
      expect(categories).toContain('math');
      expect(categories).toContain('puzzle');
      expect(categories).toContain('action');
      expect(categories).toHaveLength(3);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle non-existent template gracefully', () => {
      const container = document.getElementById('game-container');
      
      expect(() => {
        gameSystem.createGame('non-existent', container);
      }).toThrow('Template not found: non-existent');
    });
    
    it('should validate template structure on registration', () => {
      const invalidTemplates = [
        { name: 'No ID' }, // Missing id
        { id: 'no-name' }, // Missing name
        { id: 'no-init', name: 'No Init' }, // Missing init
        { id: 'no-start', name: 'No Start', init: vi.fn() } // Missing start
      ];
      
      invalidTemplates.forEach(template => {
        expect(() => {
          gameSystem.registerTemplate(template);
        }).toThrow();
      });
    });
    
    it('should handle container validation', () => {
      expect(() => {
        gameSystem.createGame('test-game', null);
      }).toThrow('Container element is required');
      
      expect(() => {
        gameSystem.createGame('test-game', 'not-an-element');
      }).toThrow('Container must be a DOM element');
    });
  });
});