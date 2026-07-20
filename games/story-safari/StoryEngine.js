// StoryEngine.js - Core narrative system for Story Safari
// Manages branching storylines, reading comprehension challenges, and story progression

import logger from '../../utils/logger.js';
import { getRandomInt } from '../../utils/common.js';

/**
 * StoryEngine - Manages the branching narrative system
 * Features:
 * - Dynamic story path generation based on player choices
 * - Reading comprehension challenges at key decision points
 * - Adaptive difficulty based on player performance
 * - Context-aware vocabulary integration
 * - Story state persistence and restoration
 */
export default class StoryEngine {
  constructor(storyData, options = {}) {
    this.storyData = storyData;
    this.options = {
      difficulty: 'medium',
      readingLevel: 'grade-3',
      enableAdaptiveDifficulty: true,
      comprehensionChallengeFrequency: 0.3, // 30% of choices trigger challenges
      ...options,
    };

    // Story state management
    this.currentScene = null;
    this.visitedScenes = new Set();
    this.playerChoices = [];
    this.storyPath = [];
    this.globalVariables = new Map(); // For story state tracking

    // Reading comprehension tracking
    this.comprehensionHistory = [];
    this.vocabularyEncountered = new Set();
    this.readingSpeedData = [];

    // Adaptive difficulty system
    this.playerPerformance = {
      comprehensionAccuracy: 0.8,
      averageChoiceTime: 5000, // ms
      vocabularyRetention: 0.7,
      engagementLevel: 0.9,
    };

    // Story branching logic
    this.branchingRules = new Map();
    this.conditionalScenes = new Map();

    this.initialized = false;
  }

  /**
   * Initialize the story engine with data validation and setup
   */
  async initialize() {
    try {
      logger.info('Initializing Story Engine...');

      // Validate story data structure
      this.validateStoryData();

      // Set up branching rules and conditional logic
      this.setupBranchingRules();

      // Initialize global story variables
      this.initializeGlobalVariables();

      // Prepare vocabulary for current reading level
      this.prepareVocabularyIntegration();

      this.initialized = true;
      logger.info('Story Engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Story Engine:', error);
      throw new Error('Story Engine initialization failed');
    }
  }

  /**
   * Validate the story data structure for required fields and consistency
   */
  validateStoryData() {
    if (!this.storyData || typeof this.storyData !== 'object') {
      throw new Error('Invalid story data: must be an object');
    }

    const required = ['scenes', 'startingScene', 'metadata'];
    for (const field of required) {
      if (!this.storyData[field]) {
        throw new Error(`Missing required story data field: ${field}`);
      }
    }

    // Validate scenes structure
    const scenes = this.storyData.scenes;
    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw new Error('Story data must contain at least one scene');
    }

    // Validate each scene has required properties
    scenes.forEach((scene, index) => {
      const requiredSceneFields = ['id', 'title', 'content', 'choices'];
      requiredSceneFields.forEach(field => {
        if (!scene[field]) {
          throw new Error(`Scene ${index} missing required field: ${field}`);
        }
      });
    });

    logger.info(`Story validation passed: ${scenes.length} scenes loaded`);
  }

  /**
   * Set up branching rules for dynamic story progression
   */
  setupBranchingRules() {
    // Define story branching logic based on player choices and performance
    this.branchingRules.set('courage_path', choices => {
      return choices.filter(c => c.traits?.includes('brave')).length >= 2;
    });

    this.branchingRules.set('wisdom_path', choices => {
      return choices.filter(c => c.traits?.includes('thoughtful')).length >= 2;
    });

    this.branchingRules.set('friendship_path', choices => {
      return choices.filter(c => c.traits?.includes('helpful')).length >= 2;
    });

    // Conditional scenes based on story variables
    this.conditionalScenes.set('secret_grove', () => {
      return this.globalVariables.get('found_map') && this.globalVariables.get('trust_level') > 3;
    });

    this.conditionalScenes.set('night_adventure', () => {
      return (
        this.visitedScenes.has('campfire') && this.playerPerformance.comprehensionAccuracy > 0.7
      );
    });
  }

  /**
   * Initialize global story variables
   */
  initializeGlobalVariables() {
    this.globalVariables.set('trust_level', 0);
    this.globalVariables.set('exploration_score', 0);
    this.globalVariables.set('animal_friends', []);
    this.globalVariables.set('found_items', []);
    this.globalVariables.set('challenges_completed', 0);
  }

  /**
   * Prepare vocabulary integration based on reading level
   */
  prepareVocabularyIntegration() {
    const vocabularyLevels = {
      'grade-1': ['big', 'small', 'happy', 'run', 'jump'],
      'grade-2': ['adventure', 'forest', 'friend', 'discover', 'journey'],
      'grade-3': ['magnificent', 'enormous', 'cautiously', 'investigate', 'expedition'],
      'grade-4': ['extraordinary', 'treacherous', 'meticulously', 'phenomenon', 'contemplated'],
      'grade-5': ['exhilarating', 'unprecedented', 'comprehensive', 'magnificent', 'exceptional'],
    };

    const currentLevelWords =
      vocabularyLevels[this.options.readingLevel] || vocabularyLevels['grade-3'];
    this.vocabularyPool = new Set(currentLevelWords);

    logger.info(
      `Vocabulary prepared for ${this.options.readingLevel}: ${currentLevelWords.length} words`
    );
  }

  /**
   * Get the starting scene for the adventure
   */
  getStartingScene() {
    if (!this.initialized) {
      throw new Error('Story Engine not initialized');
    }

    const startingSceneId = this.storyData.startingScene;
    const scene = this.findSceneById(startingSceneId);

    if (!scene) {
      throw new Error(`Starting scene not found: ${startingSceneId}`);
    }

    // Process scene for vocabulary and reading level
    const processedScene = this.processSceneForReadingLevel(scene);

    // Mark as visited and set as current
    this.visitedScenes.add(scene.id);
    this.currentScene = processedScene;
    this.storyPath.push(scene.id);

    return processedScene;
  }

  /**
   * Process player choice and determine next scene
   */
  async processPlayerChoice(choiceIndex, choiceData) {
    if (!this.currentScene) {
      throw new Error('No current scene to process choice from');
    }

    const choice = this.currentScene.choices[choiceIndex];
    if (!choice) {
      throw new Error(`Invalid choice index: ${choiceIndex}`);
    }

    // Record the choice
    this.playerChoices.push({
      sceneId: this.currentScene.id,
      choiceIndex,
      choice: choice,
      timestamp: Date.now(),
      reactionTime: choiceData.reactionTime || 0,
    });

    // Update global variables based on choice
    this.updateGlobalVariables(choice);

    // Check if this choice triggers a comprehension challenge
    const needsChallenge = this.shouldTriggerComprehensionChallenge();
    if (needsChallenge) {
      return this.createComprehensionChallenge(choice);
    }

    // Determine and advance to the next scene (may be null when the story ends)
    return this.advanceFromChoice(choice);
  }

  /**
   * Advance the story to the scene reached by the given choice.
   * Returns the processed next scene, or null when there is no further scene
   * (the adventure is complete). Never throws for unresolved branches so the
   * incomplete story data cannot dead-end the player.
   */
  advanceFromChoice(choice) {
    const nextSceneId = this.determineNextScene(choice);
    if (!nextSceneId) {
      return null; // Story complete
    }

    const nextScene = this.findSceneById(nextSceneId);
    if (!nextScene) {
      return null;
    }

    const processedScene = this.processSceneForReadingLevel(nextScene);

    this.visitedScenes.add(nextScene.id);
    this.currentScene = processedScene;
    this.storyPath.push(nextScene.id);

    return processedScene;
  }

  /**
   * Find a scene by its ID
   */
  findSceneById(sceneId) {
    return this.storyData.scenes.find(scene => scene.id === sceneId);
  }

  /**
   * Process scene content for appropriate reading level and vocabulary
   */
  processSceneForReadingLevel(scene) {
    const processedScene = { ...scene };

    // Mark vocabulary words in the content
    processedScene.content = this.markVocabularyWords(scene.content);

    // Adjust sentence complexity if needed
    if (this.options.readingLevel === 'grade-1' || this.options.readingLevel === 'grade-2') {
      processedScene.content = this.simplifyLanguage(processedScene.content);
    }

    // Add reading time estimate
    processedScene.estimatedReadingTime = this.calculateReadingTime(processedScene.content);

    // Process choices for reading level
    processedScene.choices = scene.choices.map(choice => ({
      ...choice,
      text: this.adjustChoiceLanguage(choice.text),
    }));

    return processedScene;
  }

  /**
   * Mark vocabulary words in content for interactive learning
   */
  markVocabularyWords(content) {
    let markedContent = content;

    // Find words that should be marked as vocabulary
    this.vocabularyPool.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      markedContent = markedContent.replace(regex, match => {
        const definition = this.getWordDefinition(match.toLowerCase());
        return `<span class="vocabulary-word" data-word="${match.toLowerCase()}" data-definition="${definition}">${match}</span>`;
      });
    });

    return markedContent;
  }

  /**
   * Get definition for a vocabulary word
   */
  getWordDefinition(word) {
    const definitions = {
      adventure: 'An exciting or dangerous experience',
      forest: 'A large area covered with trees',
      magnificent: 'Very beautiful or impressive',
      enormous: 'Very large in size',
      cautiously: 'Being very careful about something',
      investigate: 'To look into something carefully',
      expedition: 'A journey made for a special purpose',
      extraordinary: 'Very unusual or remarkable',
      treacherous: 'Dangerous or difficult to deal with',
      phenomenon: 'Something remarkable or unusual',
      contemplated: 'To think deeply about something',
    };

    return definitions[word] || 'An interesting word to explore!';
  }

  /**
   * Determine if a comprehension challenge should be triggered
   */
  shouldTriggerComprehensionChallenge() {
    const random = Math.random();
    const baseFrequency = this.options.comprehensionChallengeFrequency;

    // Adjust frequency based on player performance
    let adjustedFrequency = baseFrequency;
    if (this.playerPerformance.comprehensionAccuracy > 0.8) {
      adjustedFrequency *= 1.3; // More challenges for high performers
    } else if (this.playerPerformance.comprehensionAccuracy < 0.6) {
      adjustedFrequency *= 0.7; // Fewer challenges for struggling readers
    }

    return random < adjustedFrequency;
  }

  /**
   * Create a reading comprehension challenge
   */
  createComprehensionChallenge(choice) {
    const challengeTypes = [
      'context-clues',
      'character-motivation',
      'plot-prediction',
      'vocabulary',
    ];
    const challengeType = challengeTypes[getRandomInt(0, challengeTypes.length - 1)];

    const challenge = {
      type: 'comprehension-challenge',
      challengeType,
      question: this.generateChallengeQuestion(challengeType),
      options: this.generateChallengeOptions(challengeType),
      correctAnswer: 0, // Will be set by generation methods
      originalChoice: choice,
      timeLimit: 30000, // 30 seconds
    };

    return challenge;
  }

  /**
   * Generate challenge question based on type
   */
  generateChallengeQuestion(type) {
    const questions = {
      'context-clues': 'Based on the story so far, what do you think will happen next?',
      'character-motivation': 'Why do you think Ruby made this choice?',
      'plot-prediction': 'What clues in the story helped you make this decision?',
      vocabulary: 'What does the highlighted word mean in this context?',
    };

    return questions[type] || 'What did you learn from this part of the story?';
  }

  /**
   * Generate multiple choice options for challenges
   */
  generateChallengeOptions(_type) {
    // This would be more sophisticated in a full implementation
    return [
      'Ruby wants to help her new friends',
      'Ruby is scared and wants to go home',
      'Ruby is curious about what she might find',
      'Ruby wants to find food for her journey',
    ];
  }

  /**
   * Determine the next scene based on choice and branching logic
   */
  determineNextScene(choice) {
    // Check for direct scene targeting in choice, but only honor it when the
    // target scene actually exists in the story data. The authored data contains
    // branches that point at scenes that were never written, so unresolved
    // targets fall through to the default progression instead of dead-ending.
    if (choice.nextScene && this.findSceneById(choice.nextScene)) {
      return choice.nextScene;
    }

    // Check conditional scenes
    for (const [sceneId, condition] of this.conditionalScenes) {
      if (condition() && !this.visitedScenes.has(sceneId) && this.findSceneById(sceneId)) {
        return sceneId;
      }
    }

    // Default progression logic
    return this.getDefaultNextScene(choice);
  }

  /**
   * Get default next scene when no special rules apply
   */
  getDefaultNextScene(_choice) {
    const scenes = this.storyData.scenes;
    const currentIndex = scenes.findIndex(s => s.id === this.currentScene.id);

    // Prefer the next unvisited scene in authored order.
    for (let i = currentIndex + 1; i < scenes.length; i++) {
      if (!this.visitedScenes.has(scenes[i].id)) {
        return scenes[i].id;
      }
    }

    // Fall back to any remaining unvisited scene, wherever it sits.
    const unvisited = scenes.find(s => !this.visitedScenes.has(s.id));

    // Return null when every scene has been explored so the game can end.
    return unvisited ? unvisited.id : null;
  }

  /**
   * Update global story variables based on player choice
   */
  updateGlobalVariables(choice) {
    if (choice.effects) {
      choice.effects.forEach(effect => {
        const currentValue = this.globalVariables.get(effect.variable) || 0;
        this.globalVariables.set(effect.variable, currentValue + (effect.change || 1));
      });
    }

    // Update trust level based on choice traits
    if (choice.traits?.includes('helpful')) {
      const currentTrust = this.globalVariables.get('trust_level');
      this.globalVariables.set('trust_level', currentTrust + 1);
    }
  }

  /**
   * Calculate estimated reading time for content
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 150; // Average reading speed for target age
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Adjust choice language for reading level
   */
  adjustChoiceLanguage(text) {
    // Simple language adjustment (would be more sophisticated in full implementation)
    if (this.options.readingLevel === 'grade-1' || this.options.readingLevel === 'grade-2') {
      return text
        .replace(/investigate/g, 'look at')
        .replace(/magnificent/g, 'amazing')
        .replace(/cautiously/g, 'carefully');
    }
    return text;
  }

  /**
   * Simplify language for younger readers
   */
  simplifyLanguage(content) {
    return content
      .replace(/Nevertheless/g, 'But')
      .replace(/However/g, 'But')
      .replace(/Furthermore/g, 'Also')
      .replace(/magnificent/g, 'amazing')
      .replace(/extraordinary/g, 'very special');
  }

  /**
   * Get current story progress information
   */
  getStoryProgress() {
    return {
      currentScene: this.currentScene?.id,
      visitedScenes: Array.from(this.visitedScenes),
      storyPath: [...this.storyPath],
      globalVariables: Object.fromEntries(this.globalVariables),
      playerChoices: [...this.playerChoices],
      progressPercentage: (this.visitedScenes.size / this.storyData.scenes.length) * 100,
    };
  }

  /**
   * Save story state for persistence
   */
  saveState() {
    return {
      currentScene: this.currentScene,
      visitedScenes: Array.from(this.visitedScenes),
      playerChoices: [...this.playerChoices],
      storyPath: [...this.storyPath],
      globalVariables: Object.fromEntries(this.globalVariables),
      playerPerformance: { ...this.playerPerformance },
      vocabularyEncountered: Array.from(this.vocabularyEncountered),
    };
  }

  /**
   * Restore story state from saved data
   */
  restoreState(savedState) {
    this.currentScene = savedState.currentScene;
    this.visitedScenes = new Set(savedState.visitedScenes || []);
    this.playerChoices = savedState.playerChoices || [];
    this.storyPath = savedState.storyPath || [];
    this.globalVariables = new Map(Object.entries(savedState.globalVariables || {}));
    this.playerPerformance = savedState.playerPerformance || this.playerPerformance;
    this.vocabularyEncountered = new Set(savedState.vocabularyEncountered || []);
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.branchingRules.clear();
    this.conditionalScenes.clear();
    this.globalVariables.clear();
    this.vocabularyPool?.clear();
    this.vocabularyEncountered.clear();
  }
}
