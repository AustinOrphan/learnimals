import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdventureQuestGame from '../../src/features/games/adventure-quest/AdventureQuestGame.js';
import StoryProgression from '../../src/features/games/adventure-quest/StoryProgression.js';
import ChallengeManager from '../../src/features/games/adventure-quest/ChallengeManager.js';
import DiscoveryTracker from '../../src/features/games/adventure-quest/DiscoveryTracker.js';
import IslandNavigator from '../../src/features/games/adventure-quest/IslandNavigator.js';

// Mock DOM elements
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    ellipse: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    setLineDash: vi.fn(),
    canvas: mockCanvas
  })),
  width: 1280,
  height: 720,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 1280,
    height: 720
  })),
  parentElement: {
    clientWidth: 1280,
    clientHeight: 720
  },
  style: {},
  focus: vi.fn()
};

// Spy container for localStorage; the spies are installed on the real jsdom
// localStorage in the file-level beforeEach below.
const mockLocalStorage = {
  getItem: null,
  setItem: null,
  removeItem: null,
  clear: null
};

// Spy on the real jsdom document/window instead of replacing the globals.
// Replacing them with plain-object stubs crashes the shared setup hooks in
// tests/setup/enhanced-setup.js (which need document.body, createElement, etc.).
// MutationObserver, performance, and requestAnimationFrame mocks are already
// provided by the shared setup's beforeAll.
const domSpies = [];

beforeEach(() => {
  domSpies.push(
    vi.spyOn(document, 'getElementById').mockImplementation(id => {
      if (id === 'gameCanvas') return mockCanvas;
      return null;
    }),
    vi.spyOn(document, 'addEventListener'),
    vi.spyOn(document, 'removeEventListener'),
    vi.spyOn(window, 'addEventListener'),
    vi.spyOn(window, 'removeEventListener')
  );

  // Store-backed localStorage spies: assertions on calls still work, and
  // read-after-write flows (e.g. story chapter completion feeding island
  // unlock conditions) behave like real storage.
  let localStorageStore = {};
  mockLocalStorage.getItem = vi
    .spyOn(localStorage, 'getItem')
    .mockImplementation(key => (key in localStorageStore ? localStorageStore[key] : null));
  mockLocalStorage.setItem = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    localStorageStore[key] = String(value);
  });
  mockLocalStorage.removeItem = vi.spyOn(localStorage, 'removeItem').mockImplementation(key => {
    delete localStorageStore[key];
  });
  mockLocalStorage.clear = vi.spyOn(localStorage, 'clear').mockImplementation(() => {
    localStorageStore = {};
  });
  domSpies.push(
    mockLocalStorage.getItem,
    mockLocalStorage.setItem,
    mockLocalStorage.removeItem,
    mockLocalStorage.clear
  );
});

afterEach(() => {
  while (domSpies.length > 0) {
    domSpies.pop().mockRestore();
  }
});

describe('AdventureQuestGame', () => {
  let game;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });
  
  describe('Initialization', () => {
    it('should create a new game instance', () => {
      game = new AdventureQuestGame('gameCanvas');
      
      expect(game).toBeDefined();
      expect(game.canvas).toBe(mockCanvas);
      expect(game.ctx).toBeDefined();
      expect(game.gameState.isPlaying).toBe(false);
      expect(game.gameState.currentScene).toBe('intro');
    });
    
    it('should initialize all game systems', () => {
      game = new AdventureQuestGame('gameCanvas');
      
      expect(game.storyProgression).toBeInstanceOf(StoryProgression);
      expect(game.challengeManager).toBeInstanceOf(ChallengeManager);
      expect(game.discoveryTracker).toBeInstanceOf(DiscoveryTracker);
      expect(game.islandNavigator).toBeInstanceOf(IslandNavigator);
    });
    
    it('should set up event listeners', () => {
      game = new AdventureQuestGame('gameCanvas');
      
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
    
    it('should throw error if canvas not found', () => {
      document.getElementById.mockReturnValue(null);
      
      expect(() => new AdventureQuestGame('nonexistent')).toThrow('Canvas element with id "nonexistent" not found');
    });
  });
  
  describe('Game State Management', () => {
    beforeEach(() => {
      game = new AdventureQuestGame('gameCanvas');
    });
    
    it('should start the game correctly', () => {
      game.startGame();
      
      expect(game.gameState.isPlaying).toBe(true);
      expect(game.gameState.isPaused).toBe(false);
      expect(game.gameState.currentScene).toBe('story');
    });
    
    it('should toggle pause state', () => {
      game.startGame();
      
      game.togglePause();
      expect(game.gameState.isPaused).toBe(true);
      
      game.togglePause();
      expect(game.gameState.isPaused).toBe(false);
    });
    
    it('should load different scenes', () => {
      game.loadScene('navigation');
      expect(game.gameState.currentScene).toBe('navigation');
      
      game.loadScene('challenge', { type: 'physics' });
      expect(game.gameState.currentScene).toBe('challenge');
      
      game.loadScene('discovery');
      expect(game.gameState.currentScene).toBe('discovery');
    });
  });
  
  describe('Progress Management', () => {
    beforeEach(() => {
      game = new AdventureQuestGame('gameCanvas');
    });
    
    it('should get progress data', () => {
      const progress = game.getProgress();
      
      expect(progress).toHaveProperty('score');
      expect(progress).toHaveProperty('discoveries');
      expect(progress).toHaveProperty('currentScene');
      expect(progress).toHaveProperty('storyProgress');
      expect(progress).toHaveProperty('challengeProgress');
      expect(progress).toHaveProperty('explorationProgress');
    });
    
    it('should save progress to localStorage', () => {
      game.gameState.score = 100;
      game.gameState.totalDiscoveries = 5;
      
      game.saveProgress();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adventureQuest_progress',
        expect.any(String)
      );
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.score).toBe(100);
      expect(savedData.discoveries).toBe(5);
    });
    
    it('should load progress from localStorage', () => {
      const savedProgress = {
        score: 250,
        discoveries: 10,
        currentScene: 'challenge'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedProgress));
      
      const loaded = game.loadProgress();
      expect(loaded).toEqual(savedProgress);
    });
  });
  
  describe('Input Handling', () => {
    beforeEach(() => {
      game = new AdventureQuestGame('gameCanvas');
      game.startGame();
    });
    
    it('should handle keyboard input for pause', () => {
      const pauseSpy = vi.spyOn(game, 'togglePause');
      
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      game.handleKeyPress(event);
      
      expect(pauseSpy).toHaveBeenCalled();
    });
    
    it('should handle escape key for menu', () => {
      const menuSpy = vi.spyOn(game, 'showPauseMenu');
      
      const event = new KeyboardEvent('keydown', { code: 'Escape' });
      game.handleKeyPress(event);
      
      expect(menuSpy).toHaveBeenCalled();
    });
    
    it('should handle help key', () => {
      const helpSpy = vi.spyOn(game, 'showHelp');
      
      const event = new KeyboardEvent('keydown', { code: 'KeyH' });
      game.handleKeyPress(event);
      
      expect(helpSpy).toHaveBeenCalled();
    });
  });
  
  describe('Rendering', () => {
    beforeEach(() => {
      game = new AdventureQuestGame('gameCanvas');
    });
    
    it('should render intro scene', () => {
      game.render();
      
      const ctx = game.ctx;
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Sky\'s Scientific Expedition'),
        expect.any(Number),
        expect.any(Number)
      );
    });
    
    it('should render UI overlay when playing', () => {
      game.startGame();
      game.render();
      
      const ctx = game.ctx;
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Score:'),
        expect.any(Number),
        expect.any(Number)
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Discoveries:'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
  
  describe('Cleanup', () => {
    beforeEach(() => {
      game = new AdventureQuestGame('gameCanvas');
    });
    
    it('should clean up resources on destroy', () => {
      const stopSpy = vi.spyOn(game, 'stopGameLoop');
      
      game.destroy();
      
      expect(stopSpy).toHaveBeenCalled();
      expect(mockCanvas.removeEventListener).toHaveBeenCalled();
      expect(document.removeEventListener).toHaveBeenCalled();
      expect(window.removeEventListener).toHaveBeenCalled();
    });
  });
});

describe('StoryProgression', () => {
  let game, storyProgression;
  
  beforeEach(() => {
    game = new AdventureQuestGame('gameCanvas');
    storyProgression = game.storyProgression;
  });
  
  it('should load story chapters', () => {
    storyProgression.loadStory({ chapter: 'introduction' });
    
    expect(storyProgression.currentChapter).toBeDefined();
    expect(storyProgression.currentChapter.title).toBe('Welcome to Sky\'s Scientific Expedition');
    expect(storyProgression.dialogueIndex).toBe(0);
  });
  
  it('should advance dialogue', () => {
    storyProgression.loadStory({ chapter: 'introduction' });
    const initialDialogue = storyProgression.currentDialogue;
    
    storyProgression.nextDialogue();
    
    expect(storyProgression.dialogueIndex).toBe(1);
    expect(storyProgression.currentDialogue).not.toBe(initialDialogue);
  });
  
  it('should handle dialogue choices', () => {
    storyProgression.loadStory({ chapter: 'introduction' });
    storyProgression.dialogueIndex = 2; // Move to dialogue with choices
    storyProgression.loadDialogue(2);
    
    expect(storyProgression.currentDialogue.choices).toBeDefined();
    expect(storyProgression.currentDialogue.choices.length).toBeGreaterThan(0);
  });
});

describe('ChallengeManager', () => {
  let game, challengeManager;
  
  beforeEach(() => {
    game = new AdventureQuestGame('gameCanvas');
    challengeManager = game.challengeManager;
  });
  
  it('should load challenges', () => {
    challengeManager.loadChallenge({ type: 'physics', challenge: 'gravity_basics' });
    
    expect(challengeManager.currentChallenge).toBeDefined();
    expect(challengeManager.currentChallenge.title).toBe('Understanding Gravity');
    expect(challengeManager.isActive).toBe(true);
  });
  
  it('should adapt difficulty based on performance', () => {
    // adaptDifficulty raises difficulty only when accuracy is strictly above 0.8,
    // so use 9/10 rather than the exact 8/10 boundary value
    challengeManager.playerPerformance.correct = 9;
    challengeManager.playerPerformance.incorrect = 1;
    challengeManager.playerPerformance.streak = 4;
    
    challengeManager.adaptDifficulty();
    
    expect(challengeManager.difficultyLevel).toBeGreaterThan(1);
  });
  
  it('should check answers correctly', () => {
    challengeManager.currentQuestion = {
      type: 'prediction',
      correct: 2
    };
    
    expect(challengeManager.checkAnswer(2)).toBe(true);
    expect(challengeManager.checkAnswer(1)).toBe(false);
  });
});

describe('DiscoveryTracker', () => {
  let game, discoveryTracker;
  
  beforeEach(() => {
    game = new AdventureQuestGame('gameCanvas');
    discoveryTracker = game.discoveryTracker;
  });
  
  it('should add discoveries', () => {
    const initialCount = discoveryTracker.discoveries.length;
    
    discoveryTracker.addDiscovery({
      type: 'challenge',
      name: 'Test Discovery',
      points: 50
    });
    
    expect(discoveryTracker.discoveries.length).toBe(initialCount + 1);
    expect(game.gameState.totalDiscoveries).toBe(initialCount + 1);
  });
  
  it('should track achievements', () => {
    // Simulate completing first challenge
    discoveryTracker.addDiscovery({
      type: 'challenge_complete',
      name: 'First Challenge',
      points: 100
    });
    
    const achievement = discoveryTracker.achievements.find(a => a.id === 'first_steps');
    expect(achievement).toBeDefined();
  });
  
  it('should save and load progress', () => {
    discoveryTracker.addDiscovery({
      type: 'exploration',
      name: 'Island Found',
      points: 30
    });
    
    discoveryTracker.saveProgress();
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'adventureQuest_discoveryProgress',
      expect.any(String)
    );
  });
});

describe('IslandNavigator', () => {
  let game, islandNavigator;
  
  beforeEach(() => {
    game = new AdventureQuestGame('gameCanvas');
    islandNavigator = game.islandNavigator;
  });
  
  it('should initialize with starting dock unlocked', () => {
    expect(islandNavigator.unlockedIslands.has('starting_dock')).toBe(true);
    expect(islandNavigator.currentIsland).toBe('starting_dock');
  });
  
  it('should unlock islands based on conditions', () => {
    // Simulate completing story introduction
    game.storyProgression.markChapterCompleted('introduction');
    
    islandNavigator.updateUnlockedIslands();
    
    expect(islandNavigator.unlockedIslands.has('physics_island')).toBe(true);
    expect(islandNavigator.unlockedIslands.has('chemistry_cove')).toBe(true);
    expect(islandNavigator.unlockedIslands.has('biology_beach')).toBe(true);
  });
  
  it('should handle island travel', () => {
    islandNavigator.unlockedIslands.add('physics_island');
    
    islandNavigator.travelToIsland('physics_island');
    
    expect(islandNavigator.currentIsland).toBe('physics_island');
    expect(islandNavigator.isMoving).toBe(true);
    expect(islandNavigator.visitedIslands.has('physics_island')).toBe(true);
  });
  
  it('should check travel connections', () => {
    islandNavigator.currentIsland = 'starting_dock';
    
    expect(islandNavigator.canTravelTo('physics_island')).toBe(true);
    expect(islandNavigator.canTravelTo('engineering_bay')).toBe(false);
  });
});