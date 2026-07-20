/**
 * EcosystemGame Unit Tests
 * Tests for Sky's Ecosystem Explorer game
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupCanvasMocking } from '../helpers/canvasMock.js';
import EcosystemGame from '../../games/ecosystem-explorer/EcosystemGame.js';

// Mock the dependencies (plain functions so global mock resets cannot strip implementations)
vi.mock('../../utils/common.js', () => ({
  getRandomInt: (min, max) => Math.floor(min + (max - min) * 0.5),
  debounce: fn => fn,
}));

describe('Ecosystem Explorer Game', () => {
  beforeEach(() => {
    // Use the ambient vitest jsdom document; global setup clears the body before each test
    document.body.innerHTML = '<canvas id="ecosystem-canvas" width="800" height="600"></canvas>';

    // jsdom has no canvas 2D implementation; mock it on the prototype
    setupCanvasMocking({ width: 800, height: 600 });

    // Prevent the game loop from scheduling frames during tests
    vi.stubGlobal('requestAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('Game Initialization', () => {
    it('should create game instance successfully', () => {
      const game = new EcosystemGame('ecosystem-canvas');

      expect(game).toBeDefined();
      expect(game.canvas).toBe(document.getElementById('ecosystem-canvas'));
      expect(game.gameState.level).toBe(1);
      expect(game.gameState.score).toBe(0);
      expect(game.gameState.ecosystemHealth).toBe(1.0);
    });

    it('should initialize with correct species data', () => {
      const game = new EcosystemGame('ecosystem-canvas');

      expect(game.availableSpecies).toHaveLength(3);
      expect(game.availableSpecies[0].id).toBe('grass');
      expect(game.availableSpecies[1].id).toBe('rabbit');
      expect(game.availableSpecies[2].id).toBe('fox');
    });

    it('should set up canvas dimensions correctly', () => {
      const game = new EcosystemGame('ecosystem-canvas');

      expect(game.canvas.width).toBe(800);
      expect(game.canvas.height).toBe(600);
      expect(game.gridWidth).toBeGreaterThan(0);
      expect(game.gridHeight).toBeGreaterThan(0);
    });
  });

  describe('Game Mechanics', () => {
    let game;

    beforeEach(() => {
      game = new EcosystemGame('ecosystem-canvas');
    });

    it('should place species correctly', () => {
      const species = game.availableSpecies[0]; // grass
      game.placeSpeciesAt(100, 100, species);

      expect(game.gameState.placedSpecies.size).toBe(1);
      expect(game.gameState.score).toBeGreaterThan(0);
    });

    it('should prevent placing species in occupied positions', () => {
      const species = game.availableSpecies[0];

      // Place first species
      game.placeSpeciesAt(100, 100, species);
      const initialScore = game.gameState.score;

      // Try to place another species in same position
      game.placeSpeciesAt(100, 100, species);

      expect(game.gameState.placedSpecies.size).toBe(1);
      expect(game.gameState.score).toBe(initialScore);
    });

    it('should calculate ecosystem health correctly', () => {
      // Add some species to test balance calculation
      game.gameState.placedSpecies.set('0,0', { type: 'producer' });
      game.gameState.placedSpecies.set('1,0', { type: 'herbivore' });
      game.gameState.placedSpecies.set('2,0', { type: 'carnivore' });

      game.updateEcosystemBalance();

      expect(game.gameState.ecosystemHealth).toBeGreaterThan(0);
      expect(game.gameState.ecosystemHealth).toBeLessThanOrEqual(1);
    });

    it('should handle level progression', () => {
      // Set up conditions for level completion
      game.gameState.ecosystemHealth = 0.9;
      game.gameState.placedSpecies.set('0,0', { type: 'producer' });
      game.gameState.placedSpecies.set('1,0', { type: 'producer' });
      game.gameState.placedSpecies.set('2,0', { type: 'herbivore' });
      game.gameState.placedSpecies.set('3,0', { type: 'herbivore' });
      game.gameState.placedSpecies.set('4,0', { type: 'carnivore' });

      const initialLevel = game.gameState.level;
      const initialScore = game.gameState.score;

      game.checkWinConditions();

      expect(game.gameState.level).toBe(initialLevel + 1);
      expect(game.gameState.score).toBeGreaterThan(initialScore);
    });
  });

  describe('User Interaction', () => {
    let game;

    beforeEach(() => {
      game = new EcosystemGame('ecosystem-canvas');
    });

    it('should handle palette clicks correctly', () => {
      // Simulate clicking on first species in palette
      game.handlePaletteClick(50, 500); // Within first species area

      expect(game.gameState.selectedSpecies).toBe('grass');
    });

    it('should handle species dragging', () => {
      // Simulate drag start
      const mockEvent = {
        clientX: 50,
        clientY: 550,
        target: game.canvas,
      };

      // Mock getBoundingClientRect
      game.canvas.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }));

      game.handleMouseDown(mockEvent);

      expect(game.gameState.draggedSpecies).toBeDefined();
    });
  });

  describe('Game Control Methods', () => {
    let game;

    beforeEach(() => {
      game = new EcosystemGame('ecosystem-canvas');
    });

    it('should start game correctly', () => {
      game.start();
      expect(game.gameState.gameActive).toBe(true);
    });

    it('should pause game correctly', () => {
      game.pause();
      expect(game.gameState.gameActive).toBe(false);
    });

    it('should reset game correctly', () => {
      // Modify game state
      game.gameState.level = 5;
      game.gameState.score = 1000;
      game.gameState.placedSpecies.set('0,0', { type: 'producer' });

      game.reset();

      expect(game.gameState.level).toBe(1);
      expect(game.gameState.score).toBe(0);
      expect(game.gameState.placedSpecies.size).toBe(0);
      expect(game.gameState.ecosystemHealth).toBe(1.0);
    });

    it('should clean up resources on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(game.canvas, 'removeEventListener');
      const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      game.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(windowRemoveEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('Particle System', () => {
    let game;

    beforeEach(() => {
      game = new EcosystemGame('ecosystem-canvas');
    });

    it('should create particles correctly', () => {
      game.createParticles(100, 100, '#00FF00');

      expect(game.gameState.particles.length).toBeGreaterThan(0);

      // Check particle properties
      const particle = game.gameState.particles[0];
      expect(particle.x).toBeDefined();
      expect(particle.y).toBeDefined();
      expect(particle.color).toBe('#00FF00');
      expect(particle.alpha).toBe(1);
    });

    it('should update particles over time', () => {
      game.createParticles(100, 100, '#00FF00');
      const initialCount = game.gameState.particles.length;

      // Simulate time passing
      game.gameState.particles.forEach(particle => {
        particle.age = particle.lifetime + 100; // Make them expire
      });

      game.updateParticles(16); // 16ms frame time

      expect(game.gameState.particles.length).toBeLessThan(initialCount);
    });
  });
});
