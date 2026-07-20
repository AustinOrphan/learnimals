// Story Safari Game for Learnimals
// An interactive reading adventure game featuring Ruby the Panda
// Players guide Ruby through branching safari adventures that build reading comprehension skills

import logger from '../../../utils/logger.js';
import BaseGame from '../../../components/games/BaseGame.js';
import StoryEngine from './StoryEngine.js';
import SafariJournal from './SafariJournal.js';
import { safariStoryData } from './storyData.js';

/**
 * StorySafariGame - Interactive reading adventure game
 * Features:
 * - Branching narrative system with multiple story paths
 * - Reading comprehension challenges at decision points
 * - Vocabulary building with context clues
 * - Character emotions and animations
 * - Progress tracking and achievement system
 */
export default class StorySafariGame extends BaseGame {
  constructor(containerId, options = {}) {
    // Initialize BaseGame with DOM container mode
    super(containerId, {
      useDOMContainer: true,
      gameType: 'story-safari',
      subject: 'reading',
      difficulty: options.difficulty || 'medium',
      enableProgressTracking: true,
      ...options,
    });

    // Core game components
    this.storyEngine = new StoryEngine(safariStoryData, {
      difficulty: this.difficulty,
      readingLevel: options.readingLevel || 'grade-3',
    });

    this.safariJournal = new SafariJournal({
      enableVocabularyTracking: true,
      enableProgressMapping: true,
    });

    // Game state management
    this.gameState = {
      currentScene: null,
      storyProgress: [],
      playerChoices: [],
      vocabularyDiscovered: [],
      readingSpeed: null,
      comprehensionScore: 0,
      explorerLevel: 1,
      badges: [],
    };

    // UI component references
    this.elements = {
      storyDisplay: null,
      characterContainer: null,
      choicesContainer: null,
      progressMap: null,
      journalButton: null,
      wordDetective: null,
      comprehensionPanel: null,
      achievementNotification: null,
    };

    // Reading engagement tracking
    this.readingMetrics = {
      sessionStartTime: null,
      totalWordsRead: 0,
      averageReadingSpeed: 0,
      vocabulary: new Set(),
      comprehensionAnswers: [],
      choiceReactionTimes: [],
    };

    // Animation and UI state
    this.animations = {
      rubyExpression: 'curious',
      sceneTransition: false,
      choiceHighlight: null,
      textRevealSpeed: 50, // ms per character
    };

    // Initialize game
    this.init();
  }

  /**
   * Initialize the game components and UI
   */
  async init() {
    try {
      this.showMessage("Initializing Ruby's Story Safari...", 'info');

      // Create the game UI structure
      this.createGameUI();

      // Set up event listeners (now that the DOM elements are cached)
      this.setupEventListeners();

      // Initialize character and story engine
      await this.storyEngine.initialize();

      // Load player progress if available
      await this.loadPlayerProgress();

      // BaseGame runs its own async initialize() from the constructor, so this
      // instance may still be in the 'loading' state. start()/setState('playing')
      // only proceeds from 'ready', so wait for that transition before starting.
      await this.waitForReady();

      // Start the adventure
      await this.startAdventure();

      this.showMessage('Welcome to Story Safari!', 'success');
      logger.info('Story Safari game initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Story Safari game:', error);
      this.showMessage('Failed to start the adventure. Please try again.', 'error');
    }
  }

  /**
   * Wait until BaseGame's async initialize() reaches the 'ready' state so that
   * the ready -> playing transition in startAdventure() is valid.
   */
  async waitForReady(timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    while (this.state === 'loading') {
      if (this.state === 'error' || Date.now() > deadline) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    return this.state === 'ready' || this.state === 'playing';
  }

  /**
   * Show a lightweight status message. Delegates to BaseGame's feedback system
   * but never throws if the feedback pipeline is unavailable.
   */
  showMessage(message, type = 'info') {
    try {
      this.displayMessage(message, type);
    } catch (error) {
      logger.debug('Story Safari message (fallback):', message, error);
    }
  }

  /**
   * Create the main game UI structure
   */
  createGameUI() {
    if (!this.container) {
      throw new Error('Game container not found');
    }

    this.container.innerHTML = `
      <div class="story-safari-game">
        <!-- Header with progress and controls -->
        <header class="safari-header">
          <div class="progress-container">
            <div class="story-progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <span class="progress-text">Chapter 1: The Journey Begins</span>
          </div>
          <div class="game-controls">
            <button class="control-btn journal-btn" title="Open Safari Journal">
              📖 Journal
            </button>
            <button class="control-btn map-btn" title="View Story Map">
              🗺️ Map
            </button>
            <button class="control-btn settings-btn" title="Game Settings">
              ⚙️ Settings
            </button>
          </div>
        </header>
        
        <!-- Main story display area -->
        <main class="story-main">
          <!-- Character display -->
          <div class="character-container">
            <div class="ruby-character" data-mood="curious">
              <img src="/public/images/reading-panda.png"
                   alt="Ruby the Panda"
                   class="character-image"
                   onerror="this.style.display='none'; this.closest('.ruby-character').classList.add('character-fallback');" />
              <div class="speech-bubble hidden">
                <p class="character-speech"></p>
              </div>
            </div>
          </div>
          
          <!-- Story content area -->
          <div class="story-display">
            <div class="story-text-container">
              <h2 class="scene-title">Loading adventure...</h2>
              <div class="story-text">
                <p>Preparing your safari adventure...</p>
              </div>
            </div>
            
            <!-- Interactive elements overlay -->
            <div class="story-interactives">
              <div class="word-detective hidden">
                <div class="word-definition">
                  <h4 class="word-term"></h4>
                  <p class="word-meaning"></p>
                  <button class="close-definition">×</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Choice selection area -->
          <div class="choices-container">
            <h3 class="choices-prompt">What should Ruby do next?</h3>
            <div class="choice-buttons">
              <!-- Choice buttons will be dynamically added here -->
            </div>
          </div>
          
          <!-- Comprehension challenge panel -->
          <div class="comprehension-panel hidden">
            <div class="panel-content">
              <h3 class="challenge-title">Reading Challenge</h3>
              <div class="challenge-question">
                <p class="question-text"></p>
                <div class="answer-options">
                  <!-- Answer options will be added dynamically -->
                </div>
              </div>
              <div class="challenge-feedback hidden">
                <p class="feedback-text"></p>
                <button class="continue-btn">Continue Adventure</button>
              </div>
            </div>
          </div>
        </main>
        
        <!-- Footer with stats and achievements -->
        <footer class="safari-footer">
          <div class="stats-container">
            <div class="stat-item">
              <span class="stat-label">Words Discovered:</span>
              <span class="stat-value words-count">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Scenes Explored:</span>
              <span class="stat-value scenes-count">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Explorer Level:</span>
              <span class="stat-value explorer-level">1</span>
            </div>
          </div>
          
          <div class="achievements-preview">
            <div class="recent-badges">
              <!-- Recent badges will appear here -->
            </div>
          </div>
        </footer>
        
        <!-- Modals and overlays -->
        <div class="modal-overlay hidden">
          <div class="modal-content">
            <!-- Modal content will be dynamically loaded -->
          </div>
        </div>
      </div>
    `;

    // Cache DOM element references
    this.cacheElements();
  }

  /**
   * Cache references to frequently used DOM elements
   */
  cacheElements() {
    const container = this.container;

    this.elements = {
      storyDisplay: container.querySelector('.story-display'),
      characterContainer: container.querySelector('.character-container'),
      choicesContainer: container.querySelector('.choices-container'),
      progressBar: container.querySelector('.progress-fill'),
      progressText: container.querySelector('.progress-text'),
      journalButton: container.querySelector('.journal-btn'),
      mapButton: container.querySelector('.map-btn'),
      settingsButton: container.querySelector('.settings-btn'),
      sceneTitle: container.querySelector('.scene-title'),
      storyText: container.querySelector('.story-text'),
      choiceButtons: container.querySelector('.choice-buttons'),
      characterImage: container.querySelector('.character-image'),
      speechBubble: container.querySelector('.speech-bubble'),
      characterSpeech: container.querySelector('.character-speech'),
      wordDetective: container.querySelector('.word-detective'),
      comprehensionPanel: container.querySelector('.comprehension-panel'),
      modalOverlay: container.querySelector('.modal-overlay'),
      wordsCount: container.querySelector('.words-count'),
      scenesCount: container.querySelector('.scenes-count'),
      explorerLevel: container.querySelector('.explorer-level'),
    };
  }

  /**
   * Set up event listeners for game interactions
   */
  setupEventListeners() {
    // BaseGame.initialize() invokes this override during super() construction,
    // before createGameUI()/cacheElements() have run and before the subclass
    // field initializers assign this.elements. Bail out until the UI exists;
    // init() calls this again once the elements are cached.
    if (!this.elements || !this.elements.journalButton) {
      return;
    }

    // Control button listeners
    this.elements.journalButton?.addEventListener('click', () => this.openSafariJournal());
    this.elements.mapButton?.addEventListener('click', () => this.openStoryMap());
    this.elements.settingsButton?.addEventListener('click', () => this.openSettings());

    // Story interaction listeners
    this.elements.storyText?.addEventListener('click', e => this.handleStoryTextClick(e));

    // Word detective close button
    this.elements.wordDetective
      ?.querySelector('.close-definition')
      ?.addEventListener('click', () => this.closeWordDefinition());

    // Modal close listener
    this.elements.modalOverlay?.addEventListener('click', e => {
      if (e.target === this.elements.modalOverlay) {
        this.closeModal();
      }
    });

    // Keyboard shortcuts (store the bound handler so cleanup can remove it)
    this.boundKeyboardHandler = e => this.handleKeyboardShortcuts(e);
    document.addEventListener('keydown', this.boundKeyboardHandler);

    // Reading speed detection
    this.setupReadingSpeedDetection();
  }

  /**
   * Start the safari adventure
   */
  async startAdventure() {
    try {
      // Get the starting scene from story engine
      const startingScene = await this.storyEngine.getStartingScene();

      // Update game state
      this.setState('playing');
      this.gameState.currentScene = startingScene;

      // Record and display the opening scene
      this.recordSceneProgress(startingScene);
      await this.displayScene(startingScene);

      // Start tracking reading metrics
      this.readingMetrics.sessionStartTime = Date.now();

      logger.info('Story Safari adventure started');
    } catch (error) {
      logger.error('Failed to start adventure:', error);
      this.showMessage('Could not start the adventure. Please try again.', 'error');
    }
  }

  /**
   * Display a story scene with text, character reactions, and choices
   */
  async displayScene(scene) {
    if (!scene) {
      logger.error('Cannot display null scene');
      return;
    }

    try {
      // Update scene title
      this.elements.sceneTitle.textContent = scene.title;

      // Animate text reveal
      await this.animateTextReveal(scene.content);

      // Update Ruby's expression based on scene mood
      this.updateCharacterExpression(scene.mood || 'curious');

      // Show character speech if present
      if (scene.characterSpeech) {
        await this.showCharacterSpeech(scene.characterSpeech);
      }

      // Display choice options
      this.displayChoices(scene.choices);

      // Update progress indicators
      this.updateProgress();

      // Track reading metrics
      this.trackSceneReading(scene);
    } catch (error) {
      logger.error('Failed to display scene:', error);
      this.showMessage('Error displaying story scene', 'error');
    }
  }

  /**
   * Handle story text clicks for word detective feature
   */
  handleStoryTextClick(event) {
    const clickedElement = event.target;

    // Check if clicked on a word that can be explored
    if (clickedElement.tagName === 'SPAN' && clickedElement.classList.contains('vocabulary-word')) {
      const word = clickedElement.textContent;
      const definition = clickedElement.dataset.definition;
      this.showWordDefinition(word, definition);
    }
  }

  /**
   * Show word definition in word detective panel
   */
  showWordDefinition(word, definition) {
    const wordTerm = this.elements.wordDetective.querySelector('.word-term');
    const wordMeaning = this.elements.wordDetective.querySelector('.word-meaning');

    wordTerm.textContent = word;
    wordMeaning.textContent = definition;

    this.elements.wordDetective.classList.remove('hidden');

    // Track vocabulary discovery
    this.safariJournal.addVocabularyWord(word, definition);
    this.gameState.vocabularyDiscovered.push(word);
    this.updateStats();
  }

  /**
   * Update game statistics display
   */
  updateStats() {
    if (!this.elements.wordsCount) {
      return;
    }
    // Reflect every word collected in the journal (scene vocabulary plus any the
    // player clicked to reveal), so the footer and the journal stay in sync.
    this.elements.wordsCount.textContent = this.safariJournal.journalData.vocabulary.size;
    this.elements.scenesCount.textContent = this.gameState.storyProgress.length;
    this.elements.explorerLevel.textContent = this.gameState.explorerLevel;
  }

  /**
   * Clean up game resources
   */
  cleanup() {
    // Remove event listeners
    if (this.boundKeyboardHandler) {
      document.removeEventListener('keydown', this.boundKeyboardHandler);
      this.boundKeyboardHandler = null;
    }

    // Clean up components
    this.storyEngine?.cleanup();
    this.safariJournal?.cleanup();

    // Save progress
    this.savePlayerProgress();

    super.destroy?.();
  }

  /**
   * Reveal story text. The engine has already wrapped vocabulary words in
   * interactive spans, so the (trusted, author-provided) HTML is injected
   * directly. Honors reduced-motion by skipping the typewriter animation.
   */
  async animateTextReveal(text) {
    if (!this.elements.storyText) {
      return;
    }

    const html = `<p>${text}</p>`;
    this.elements.storyText.innerHTML = html;

    // Track word count for reading metrics
    const words = text
      .replace(/<[^>]*>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    this.readingMetrics.totalWordsRead += words.length;
  }

  /**
   * Update Ruby's expression based on the scene mood. Avoids swapping the image
   * source (assets are optional) and instead drives styling via a data attribute.
   */
  updateCharacterExpression(mood) {
    this.animations.rubyExpression = mood;
    const rubyCharacter = this.container?.querySelector('.ruby-character');
    if (rubyCharacter) {
      rubyCharacter.dataset.mood = mood;
    }
  }

  /**
   * Show Ruby's speech bubble with the given line.
   */
  async showCharacterSpeech(speech) {
    if (!this.elements.characterSpeech || !this.elements.speechBubble) {
      return;
    }
    this.elements.characterSpeech.textContent = speech;
    this.elements.speechBubble.classList.remove('hidden');
  }

  /**
   * Render the choice buttons for the current scene and wire up selection.
   */
  displayChoices(choices) {
    const container = this.elements.choiceButtons;
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!Array.isArray(choices) || choices.length === 0) {
      // No choices means we've reached a leaf scene: offer to wrap up.
      this.showStoryEnding();
      return;
    }

    choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.className = 'choice-button';
      button.type = 'button';
      button.textContent = choice.text;
      button.dataset.choiceIndex = String(index);
      button.addEventListener('click', () => this.handleChoiceSelection(index, choice));
      container.appendChild(button);
    });

    // Reset reaction-time tracking for this decision point
    this.animations.choiceShownAt = Date.now();

    if (this.elements.choicesContainer) {
      this.elements.choicesContainer.classList.remove('hidden');
    }
  }

  /**
   * Handle the player picking a story choice: record it, run any comprehension
   * challenge, and advance the narrative to the next scene.
   */
  async handleChoiceSelection(choiceIndex, choice) {
    const reactionTime = this.animations.choiceShownAt
      ? Date.now() - this.animations.choiceShownAt
      : 0;

    this.gameState.playerChoices.push(choice);
    this.readingMetrics.choiceReactionTimes.push(reactionTime);

    try {
      const result = await this.storyEngine.processPlayerChoice(choiceIndex, { reactionTime });

      if (!result) {
        // No further scene: the adventure is complete.
        this.showStoryEnding();
        return;
      }

      if (result.type === 'comprehension-challenge') {
        this.showComprehensionChallenge(result);
        return;
      }

      // Advance to the next scene.
      this.gameState.currentScene = result;
      this.recordSceneProgress(result);
      await this.displayScene(result);
    } catch (error) {
      logger.error('Failed to process choice:', error);
      this.showMessage("Something went wrong. Let's keep exploring!", 'error');
    }
  }

  /**
   * Present a reading-comprehension challenge before continuing the story.
   */
  showComprehensionChallenge(challenge) {
    const panel = this.elements.comprehensionPanel;
    if (!panel) {
      // Fall back to advancing if the panel is unavailable.
      this.continueAfterChallenge(challenge);
      return;
    }

    const questionText = panel.querySelector('.question-text');
    const answerOptions = panel.querySelector('.answer-options');
    const challengeQuestion = panel.querySelector('.challenge-question');
    const feedback = panel.querySelector('.challenge-feedback');
    const feedbackText = panel.querySelector('.feedback-text');
    const continueBtn = panel.querySelector('.continue-btn');

    if (questionText) {
      questionText.textContent = challenge.question;
    }

    // Reset feedback state
    feedback?.classList.add('hidden');
    challengeQuestion?.classList.remove('hidden');

    // Build answer options
    if (answerOptions) {
      answerOptions.innerHTML = '';
      challenge.options.forEach((optionText, index) => {
        const option = document.createElement('button');
        option.className = 'answer-option';
        option.type = 'button';
        option.textContent = optionText;
        option.dataset.optionIndex = String(index);
        option.addEventListener('click', () => {
          const isCorrect = index === challenge.correctAnswer;

          // Highlight the chosen answer
          answerOptions.querySelectorAll('.answer-option').forEach(el => {
            el.classList.remove('selected');
            el.disabled = true;
          });
          option.classList.add('selected');

          // Track the answer for analytics
          this.gameState.comprehensionScore += isCorrect ? 1 : 0;
          if (isCorrect) {
            this.trackCorrectAnswer({ challengeType: challenge.challengeType });
          } else {
            this.trackIncorrectAnswer({ challengeType: challenge.challengeType });
          }
          this.readingMetrics.comprehensionAnswers.push({ isCorrect });

          // Show feedback
          if (feedbackText) {
            feedbackText.textContent = isCorrect
              ? 'Great thinking! You really understand the story.'
              : 'Good try! Every answer helps you become a better reader.';
          }
          feedback?.classList.remove('hidden');
        });
        answerOptions.appendChild(option);
      });
    }

    // Continue button advances the story
    if (continueBtn) {
      continueBtn.onclick = () => this.continueAfterChallenge(challenge);
    }

    panel.classList.remove('hidden');
  }

  /**
   * Close the comprehension panel and advance to the scene the original choice
   * pointed to.
   */
  async continueAfterChallenge(challenge) {
    this.elements.comprehensionPanel?.classList.add('hidden');

    const nextScene = this.storyEngine.advanceFromChoice(challenge.originalChoice);
    if (!nextScene) {
      this.showStoryEnding();
      return;
    }

    this.gameState.currentScene = nextScene;
    this.recordSceneProgress(nextScene);
    await this.displayScene(nextScene);
  }

  /**
   * Record a scene visit in game state and the Safari Journal.
   */
  recordSceneProgress(scene) {
    if (!scene || this.gameState.storyProgress.includes(scene.id)) {
      return;
    }

    this.gameState.storyProgress.push(scene.id);

    const lastChoice = this.gameState.playerChoices[this.gameState.playerChoices.length - 1];
    this.safariJournal.recordSceneVisit(scene.id, scene.title, lastChoice ? [lastChoice.text] : []);

    // Automatically log this scene's vocabulary into the journal.
    if (Array.isArray(scene.vocabulary)) {
      scene.vocabulary.forEach(entry => {
        this.safariJournal.addVocabularyWord(entry.word, entry.definition, entry.context, scene.id);
      });
    }

    this.updateStats();
  }

  /**
   * Update the progress bar and chapter label from engine progress.
   */
  updateProgress() {
    const progress = this.storyEngine.getStoryProgress();
    const percentage = Math.min(100, Math.round(progress.progressPercentage || 0));

    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${percentage}%`;
    }
    if (this.elements.progressText) {
      this.elements.progressText.textContent = `${this.gameState.currentScene?.title || 'The Journey'} (${percentage}% explored)`;
    }
  }

  /**
   * Track basic reading engagement metrics for a scene.
   */
  trackSceneReading(scene) {
    this.gameState.explorerLevel = Math.max(
      1,
      Math.floor(this.gameState.storyProgress.length / 2) + 1
    );

    if (scene?.estimatedReadingTime) {
      this.readingMetrics.averageReadingSpeed = scene.estimatedReadingTime;
    }

    this.updateStats();
  }

  /**
   * Show the story completion screen.
   */
  showStoryEnding() {
    if (this.elements.choicesContainer) {
      const prompt = this.elements.choicesContainer.querySelector('.choices-prompt');
      if (prompt) {
        prompt.textContent = 'What an adventure!';
      }
    }

    if (this.elements.choiceButtons) {
      this.elements.choiceButtons.innerHTML = `
        <div class="story-ending">
          <h3>🎉 The End of Ruby's Safari!</h3>
          <p>You explored ${this.gameState.storyProgress.length} scenes and discovered
             ${this.safariJournal.journalData.vocabulary.size} words. Open your Safari Journal
             to review everything you learned!</p>
          <button class="choice-button restart-adventure" type="button">🔄 Play Again</button>
        </div>
      `;
      this.elements.choiceButtons
        .querySelector('.restart-adventure')
        ?.addEventListener('click', () => window.location.reload());
    }

    this.showCharacterSpeech('What a wonderful adventure we had together!');
    this.setState('game-over');
  }

  /**
   * Open the Safari Journal on the vocabulary tab.
   */
  openSafariJournal() {
    this.safariJournal.open('vocabulary');
  }

  /**
   * Open the Safari Journal on the story-map (progress) tab.
   */
  openStoryMap() {
    this.safariJournal.open('progress');
  }

  /**
   * Show a simple settings acknowledgement (no persistent settings yet).
   */
  openSettings() {
    this.safariJournal.open('stats');
  }

  /**
   * Close the word-detective definition popup.
   */
  closeWordDefinition() {
    this.elements.wordDetective?.classList.add('hidden');
  }

  /**
   * Close the generic modal overlay.
   */
  closeModal() {
    this.elements.modalOverlay?.classList.add('hidden');
  }

  /**
   * Keyboard shortcuts: J opens the journal, M the story map, Escape closes overlays.
   */
  handleKeyboardShortcuts(event) {
    if (!event || event.defaultPrevented) {
      return;
    }

    switch (event.key) {
      case 'j':
      case 'J':
        this.openSafariJournal();
        break;
      case 'm':
      case 'M':
        this.openStoryMap();
        break;
      case 'Escape':
        this.closeWordDefinition();
        this.closeModal();
        this.safariJournal?.close();
        break;
      default:
        break;
    }
  }

  /**
   * Begin tracking reading speed for the session.
   */
  setupReadingSpeedDetection() {
    this.readingMetrics.sessionStartTime = this.readingMetrics.sessionStartTime || Date.now();
  }

  /**
   * Load saved player progress (best-effort; never throws).
   */
  async loadPlayerProgress() {
    try {
      const saved = localStorage.getItem('story-safari-progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.gameState.explorerLevel = parsed.explorerLevel || 1;
      }
    } catch (error) {
      logger.debug('No saved Story Safari progress:', error);
    }
  }

  /**
   * Persist player progress (best-effort; never throws).
   */
  savePlayerProgress() {
    try {
      localStorage.setItem(
        'story-safari-progress',
        JSON.stringify({
          explorerLevel: this.gameState.explorerLevel,
          storyProgress: this.gameState.storyProgress,
          vocabularyDiscovered: this.gameState.vocabularyDiscovered,
        })
      );
    } catch (error) {
      logger.debug('Failed to save Story Safari progress:', error);
    }
  }
}
