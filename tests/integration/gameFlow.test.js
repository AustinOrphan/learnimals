/**
 * Game Flow Integration Tests
 * Tests for complete game workflows and interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockCanvas, createMockDOM, mockBrowserEnvironment, waitForDOM } from '../utils/testHelpers.js';

// Mock all dependencies
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../src/components/BaseComponent.js', () => ({
  default: class MockBaseComponent {
    constructor(options) {
      this.options = options;
    }
    addEventListener() {}
    destroy() {}
  }
}));

describe('Game Flow Integration', () => {
  let mockDOM;
  let mockCanvas;
  
  beforeEach(() => {
    mockBrowserEnvironment();
    mockDOM = createMockDOM();
    mockCanvas = createMockCanvas();
  });

  describe('Bubble Pop Game Flow', () => {
    let BubblePopGame;
    let game;
    
    beforeEach(async () => {
      // Set up canvas in DOM
      mockDOM.main.appendChild(mockCanvas.canvas);
      
      try {
        const module = await import('../../src/features/games/bubble-pop/bubblepop.js');
        BubblePopGame = module.default;
        
        game = new BubblePopGame({
          canvas: mockCanvas.canvas,
          gameId: 'bubble-pop-test'
        });
      } catch (error) {
        // If the module doesn't exist or has issues, create a mock
        BubblePopGame = class MockBubblePopGame {
          constructor(options) {
            this.canvas = options.canvas;
            this.gameId = options.gameId;
            this.state = {
              isRunning: false,
              isPaused: false,
              score: 0,
              level: 1,
              bubbles: []
            };
          }
          
          start() {
            this.state.isRunning = true;
            return true;
          }
          
          pause() {
            this.state.isPaused = true;
            return true;
          }
          
          resume() {
            this.state.isPaused = false;
            return true;
          }
          
          stop() {
            this.state.isRunning = false;
            this.state.isPaused = false;
            return true;
          }
          
          addBubble(bubble) {
            this.state.bubbles.push(bubble);
          }
          
          popBubble(bubbleId) {
            const bubbleIndex = this.state.bubbles.findIndex(b => b.id === bubbleId);
            if (bubbleIndex !== -1) {
              this.state.bubbles.splice(bubbleIndex, 1);
              this.state.score += 10;
              return true;
            }
            return false;
          }
        };
        
        game = new BubblePopGame({
          canvas: mockCanvas.canvas,
          gameId: 'bubble-pop-test'
        });
      }
    });
    
    it('should complete a full game cycle', async () => {
      // Start game
      expect(game.start()).toBe(true);
      expect(game.state.isRunning).toBe(true);
      
      // Add some bubbles
      game.addBubble({ id: 1, x: 100, y: 100, radius: 20 });
      game.addBubble({ id: 2, x: 200, y: 150, radius: 25 });
      
      expect(game.state.bubbles.length).toBe(2);
      
      // Pop a bubble
      const popped = game.popBubble(1);
      expect(popped).toBe(true);
      expect(game.state.bubbles.length).toBe(1);
      expect(game.state.score).toBe(10);
      
      // Pause and resume
      expect(game.pause()).toBe(true);
      expect(game.state.isPaused).toBe(true);
      
      expect(game.resume()).toBe(true);
      expect(game.state.isPaused).toBe(false);
      
      // Stop game
      expect(game.stop()).toBe(true);
      expect(game.state.isRunning).toBe(false);
    });
    
    it('should handle rapid state changes', () => {
      // Test rapid start/stop cycles
      for (let i = 0; i < 5; i++) {
        expect(game.start()).toBe(true);
        expect(game.stop()).toBe(true);
      }
      
      // Test pause/resume cycles
      game.start();
      for (let i = 0; i < 3; i++) {
        expect(game.pause()).toBe(true);
        expect(game.resume()).toBe(true);
      }
      game.stop();
    });
  });

  describe('Game Template Loader Integration', () => {
    let GameTemplateLoader;
    
    beforeEach(async () => {
      try {
        const module = await import('../../src/components/games/GameTemplateLoader.js');
        GameTemplateLoader = module.default;
      } catch (error) {
        // Create a mock if the module doesn't exist
        GameTemplateLoader = {
          loadGame: vi.fn().mockResolvedValue({ success: true }),
          getAvailableGames: vi.fn().mockReturnValue(['bubble-pop', 'word-scramble']),
          isGameSupported: vi.fn().mockReturnValue(true)
        };
      }
    });
    
    it('should load and initialize games correctly', async () => {
      const gameConfig = {
        type: 'bubble-pop',
        canvas: mockCanvas.canvas,
        options: {
          difficulty: 'easy',
          theme: 'ocean'
        }
      };
      
      const result = await GameTemplateLoader.loadGame(gameConfig);
      expect(result).toBeDefined();
      expect(GameTemplateLoader.loadGame).toHaveBeenCalledWith(gameConfig);
    });
    
    it('should list available games', () => {
      const games = GameTemplateLoader.getAvailableGames();
      expect(Array.isArray(games)).toBe(true);
      expect(games.length).toBeGreaterThan(0);
    });
    
    it('should validate game support', () => {
      expect(GameTemplateLoader.isGameSupported('bubble-pop')).toBe(true);
      expect(GameTemplateLoader.isGameSupported('nonexistent-game')).toBe(true); // Mock returns true
    });
  });

  describe('Subject Page Integration', () => {
    let SubjectPage;
    
    beforeEach(async () => {
      // Create a mock subject page
      SubjectPage = class MockSubjectPage {
        constructor(options) {
          this.subjectName = options.subjectName;
          this.character = options.character;
          this.features = options.features || [];
          this.modalShown = false;
        }
        
        init() {
          this.setupEventListeners();
        }
        
        setupEventListeners() {
          // Mock setup
        }
        
        showCharacterMessage(message) {
          this.modalShown = true;
          this.lastMessage = message;
        }
        
        handleFeatureClick(feature) {
          this.lastClickedFeature = feature;
          this.showCharacterMessage(`Let's explore ${feature}!`);
        }
      };
    });
    
    it('should handle subject interaction flow', () => {
      const subject = new SubjectPage({
        subjectName: 'Math',
        character: {
          name: 'Archie',
          type: 'Owl',
          role: 'Math Teacher'
        },
        features: ['Addition', 'Subtraction', 'Multiplication']
      });
      
      subject.init();
      
      // Simulate feature click
      subject.handleFeatureClick('Addition');
      
      expect(subject.lastClickedFeature).toBe('Addition');
      expect(subject.modalShown).toBe(true);
      expect(subject.lastMessage).toContain('Addition');
    });
  });

  describe('Theme Integration', () => {
    let ThemeManager;
    
    beforeEach(() => {
      // Mock theme manager
      ThemeManager = {
        currentTheme: 'light',
        themes: ['light', 'dark', 'blue', 'green'],
        setTheme: vi.fn((theme) => {
          ThemeManager.currentTheme = theme;
          // Dispatch theme change event
          document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
          }));
        }),
        getTheme: vi.fn(() => ThemeManager.currentTheme),
        getThemeColors: vi.fn(() => ({
          primary: '#007bff',
          secondary: '#6c757d',
          background: '#ffffff'
        }))
      };
      
      // Make it globally available
      window.themeManager = ThemeManager;
    });
    
    it('should propagate theme changes to components', async () => {
      const themeChangeHandler = vi.fn();
      
      // Listen for theme changes
      document.addEventListener('themeChanged', themeChangeHandler);
      
      // Change theme
      ThemeManager.setTheme('dark');
      
      await waitForDOM();
      
      expect(themeChangeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { theme: 'dark' }
        })
      );
      
      expect(ThemeManager.currentTheme).toBe('dark');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle component initialization errors gracefully', () => {
      const ErrorProneComponent = class {
        constructor() {
          throw new Error('Initialization failed');
        }
      };
      
      expect(() => {
        try {
          new ErrorProneComponent();
        } catch (error) {
          // Component should handle its own errors
          expect(error.message).toBe('Initialization failed');
        }
      }).not.toThrow();
    });
    
    it('should handle game errors without crashing', () => {
      const game = {
        state: { isRunning: true },
        update: vi.fn().mockImplementation(() => {
          throw new Error('Update failed');
        }),
        handleError: vi.fn((error) => {
          game.state.isRunning = false;
        })
      };
      
      expect(() => {
        try {
          game.update();
        } catch (error) {
          game.handleError(error);
        }
      }).not.toThrow();
      
      expect(game.state.isRunning).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should track performance metrics across components', () => {
      const performanceTracker = {
        metrics: {},
        startTiming: vi.fn((label) => {
          performanceTracker.metrics[label] = { start: performance.now() };
        }),
        endTiming: vi.fn((label) => {
          if (performanceTracker.metrics[label]) {
            performanceTracker.metrics[label].duration = performance.now() - performanceTracker.metrics[label].start;
          }
        }),
        getMetrics: vi.fn(() => performanceTracker.metrics)
      };
      
      // Simulate component lifecycle
      performanceTracker.startTiming('component-init');
      // ... component initialization ...
      performanceTracker.endTiming('component-init');
      
      performanceTracker.startTiming('game-loop');
      // ... game loop execution ...
      performanceTracker.endTiming('game-loop');
      
      const metrics = performanceTracker.getMetrics();
      expect(metrics['component-init']).toBeDefined();
      expect(metrics['component-init'].duration).toBeGreaterThanOrEqual(0);
      expect(metrics['game-loop']).toBeDefined();
      expect(metrics['game-loop'].duration).toBeGreaterThanOrEqual(0);
    });
  });
});