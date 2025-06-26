/**
 * BaseGame Component Tests
 * Unit tests for the base game functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockGameState, createMockCanvas, mockBrowserEnvironment } from '../utils/testHelpers.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('BaseGame Component', () => {
  let BaseGame;
  let mockCanvas;
  
  beforeEach(async () => {
    mockBrowserEnvironment();
    mockCanvas = createMockCanvas();
    
    // Dynamic import after mocking
    const module = await import('../../src/components/games/BaseGame.js');
    BaseGame = module.default;
  });

  describe('Constructor', () => {
    it('should create game with required options', () => {
      const game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
      
      expect(game.gameId).toBe('test-game');
      expect(game.canvas).toBe(mockCanvas.canvas);
      expect(game.state.isRunning).toBe(false);
      expect(game.state.isPaused).toBe(false);
    });
    
    it('should merge provided options with defaults', () => {
      const customOptions = {
        canvas: mockCanvas.canvas,
        gameId: 'test-game',
        width: 1024,
        height: 768,
        backgroundColor: '#ff0000'
      };
      
      const game = new BaseGame(customOptions);
      
      expect(game.width).toBe(1024);
      expect(game.height).toBe(768);
      expect(game.backgroundColor).toBe('#ff0000');
    });
    
    it('should throw error if required options are missing', () => {
      expect(() => new BaseGame({})).toThrow();
      expect(() => new BaseGame({ canvas: mockCanvas.canvas })).toThrow();
      expect(() => new BaseGame({ gameId: 'test' })).toThrow();
    });
  });

  describe('Game State Management', () => {
    let game;
    
    beforeEach(() => {
      game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
    });
    
    it('should start game correctly', () => {
      const result = game.start();
      
      expect(game.state.isRunning).toBe(true);
      expect(game.state.isPaused).toBe(false);
      expect(result).toBe(true);
    });
    
    it('should not start game if already running', () => {
      game.start();
      const result = game.start(); // Try to start again
      
      expect(result).toBe(false);
    });
    
    it('should pause game correctly', () => {
      game.start();
      const result = game.pause();
      
      expect(game.state.isPaused).toBe(true);
      expect(game.state.isRunning).toBe(true);
      expect(result).toBe(true);
    });
    
    it('should not pause game if not running', () => {
      const result = game.pause();
      
      expect(result).toBe(false);
      expect(game.state.isPaused).toBe(false);
    });
    
    it('should resume paused game', () => {
      game.start();
      game.pause();
      const result = game.resume();
      
      expect(game.state.isPaused).toBe(false);
      expect(game.state.isRunning).toBe(true);
      expect(result).toBe(true);
    });
    
    it('should stop game correctly', () => {
      game.start();
      const result = game.stop();
      
      expect(game.state.isRunning).toBe(false);
      expect(game.state.isPaused).toBe(false);
      expect(result).toBe(true);
    });
    
    it('should reset game state', () => {
      game.state.score = 100;
      game.state.level = 5;
      game.state.timeElapsed = 30000;
      
      game.reset();
      
      expect(game.state.score).toBe(0);
      expect(game.state.level).toBe(1);
      expect(game.state.timeElapsed).toBe(0);
      expect(game.state.isRunning).toBe(false);
      expect(game.state.isPaused).toBe(false);
    });
  });

  describe('Score Management', () => {
    let game;
    
    beforeEach(() => {
      game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
    });
    
    it('should add score correctly', () => {
      game.addScore(100);
      expect(game.state.score).toBe(100);
      
      game.addScore(50);
      expect(game.state.score).toBe(150);
    });
    
    it('should not allow negative scores', () => {
      game.addScore(-50);
      expect(game.state.score).toBe(0);
    });
    
    it('should update high score', () => {
      game.addScore(200);
      game.updateHighScore();
      
      expect(game.highScore).toBe(200);
    });
    
    it('should load high score from localStorage', () => {
      global.localStorage.getItem.mockReturnValue('150');
      
      const newGame = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game-2'
      });
      
      expect(newGame.highScore).toBe(150);
    });
  });

  describe('Game Loop', () => {
    let game;
    
    beforeEach(() => {
      game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
      
      // Mock the abstract methods
      game.update = vi.fn();
      game.render = vi.fn();
    });
    
    it('should start game loop when game starts', () => {
      const requestAnimationFrameSpy = vi.spyOn(global, 'requestAnimationFrame');
      
      game.start();
      
      expect(requestAnimationFrameSpy).toHaveBeenCalled();
    });
    
    it('should call update and render in game loop', () => {
      game.start();
      
      // Manually trigger a frame
      game.gameLoop(16);
      
      expect(game.update).toHaveBeenCalledWith(16);
      expect(game.render).toHaveBeenCalled();
    });
    
    it('should not update when paused', () => {
      game.start();
      game.pause();
      
      game.gameLoop(16);
      
      expect(game.update).not.toHaveBeenCalled();
      expect(game.render).toHaveBeenCalled(); // Still renders paused state
    });
    
    it('should stop game loop when game stops', () => {
      const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');
      
      game.start();
      game.stop();
      
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    let game;
    
    beforeEach(() => {
      game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
    });
    
    it('should track FPS', () => {
      game.start();
      
      // Simulate frame times
      game.gameLoop(16);
      game.gameLoop(33);
      game.gameLoop(50);
      
      expect(game.fpsCounter.frameCount).toBe(3);
      expect(game.getCurrentFPS()).toBeGreaterThan(0);
    });
    
    it('should update performance stats', () => {
      const mockStats = {
        entitiesCount: 10,
        memoryUsage: 1024
      };
      
      game.updatePerformanceStats(mockStats);
      
      expect(game.performanceStats.entitiesCount).toBe(10);
      expect(game.performanceStats.memoryUsage).toBe(1024);
    });
  });

  describe('Event Handling', () => {
    let game;
    
    beforeEach(() => {
      game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
    });
    
    it('should handle state transitions', () => {
      const transitionHandler = vi.fn();
      game.addEventListener('stateTransition', transitionHandler);
      
      game.start();
      
      expect(transitionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            from: 'stopped',
            to: 'running'
          })
        })
      );
    });
    
    it('should handle game over', () => {
      const gameOverHandler = vi.fn();
      game.addEventListener('gameOver', gameOverHandler);
      
      game.start();
      game.gameOver();
      
      expect(gameOverHandler).toHaveBeenCalled();
      expect(game.state.isRunning).toBe(false);
    });
  });

  describe('Error Handling', () => {
    let game;
    
    beforeEach(() => {
      game = new BaseGame({
        canvas: mockCanvas.canvas,
        gameId: 'test-game'
      });
    });
    
    it('should handle errors gracefully', () => {
      game.update = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      game.start();
      
      expect(() => game.gameLoop(16)).not.toThrow();
      expect(game.state.isRunning).toBe(false); // Should stop on error
    });
    
    it('should emit error events', () => {
      const errorHandler = vi.fn();
      game.addEventListener('error', errorHandler);
      
      game.handleError(new Error('Test error'));
      
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            error: expect.any(Error)
          })
        })
      );
    });
  });
});