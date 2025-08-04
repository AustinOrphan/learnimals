/**
 * StoryProgression - Manages narrative flow and dialogue in Adventure Quest
 * Handles story chapters, character dialogue, and narrative progression
 */
export default class StoryProgression {
  /**
   * Create a new StoryProgression instance
   * @param {AdventureQuestGame} game - Reference to main game instance
   */
  constructor(game) {
    this.game = game;
    this.currentChapter = null;
    this.currentDialogue = null;
    this.dialogueIndex = 0;
    this.isDialogueActive = false;
    this.clickableBounds = [];

    // Story data structure
    this.storyData = this.initializeStoryData();

    // Character animations and timing
    this.animationTime = 0;
    this.characterOffset = 0;
    this.textRevealProgress = 0;
    this.textRevealSpeed = 50; // characters per second
  }

  /**
   * Initialize story data with chapters and dialogue
   * @returns {Object} Story data structure
   */
  initializeStoryData() {
    return {
      introduction: {
        title: 'Welcome to Sky\'s Scientific Expedition',
        character: 'Sky the Parrot',
        dialogues: [
          {
            speaker: 'Sky',
            text: 'Hello there, young explorer! I\'m Sky the Parrot, and I need your help with an incredible scientific mission!',
            emotion: 'excited',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'I\'ve discovered mysterious islands scattered across the Science Ocean, each one containing unique scientific phenomena waiting to be studied!',
            emotion: 'curious',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'But I can\'t explore them all by myself. Will you join me on this grand scientific adventure?',
            emotion: 'hopeful',
            choices: [
              { text: 'Yes, let\'s explore!', action: 'accept_mission' },
              { text: 'Tell me more first', action: 'learn_more' },
              { text: 'What kind of science?', action: 'explain_science' },
            ],
          },
        ],
      },

      physics_island_intro: {
        title: 'Physics Island Discovery',
        character: 'Sky the Parrot',
        dialogues: [
          {
            speaker: 'Sky',
            text: 'Look! We\'ve reached Physics Island! Can you see how the waves move in perfect patterns?',
            emotion: 'amazed',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'This island is full of motion, forces, and energy phenomena. Every experiment here will teach us about how things move and interact!',
            emotion: 'educational',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'Are you ready for your first physics challenge? We\'ll start with something fun - understanding gravity and motion!',
            emotion: 'encouraging',
            choices: [
              { text: 'I\'m ready!', action: 'start_physics_challenge' },
              { text: 'What will we learn?', action: 'explain_physics' },
              { text: 'Can we explore first?', action: 'explore_island' },
            ],
          },
        ],
      },

      chemistry_cove_intro: {
        title: 'Chemistry Cove Adventure',
        character: 'Sky the Parrot',
        dialogues: [
          {
            speaker: 'Sky',
            text: 'Welcome to Chemistry Cove! Do you smell those interesting scents in the air? Those are different chemical compounds!',
            emotion: 'intrigued',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'Here we\'ll mix, react, and discover how different substances interact with each other. Science is like cooking, but much more colorful!',
            emotion: 'playful',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'Should we start with a safe, colorful reaction to see how atoms and molecules behave?',
            emotion: 'excited',
            choices: [
              { text: 'Let\'s mix things!', action: 'start_chemistry_challenge' },
              { text: 'Is it safe?', action: 'explain_safety' },
              { text: 'What are molecules?', action: 'explain_molecules' },
            ],
          },
        ],
      },

      biology_beach_intro: {
        title: 'Biology Beach Exploration',
        character: 'Sky the Parrot',
        dialogues: [
          {
            speaker: 'Sky',
            text: 'Ah, Biology Beach! This is where we study living things - plants, animals, and all the amazing ways life works!',
            emotion: 'gentle',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'Look around - there are tide pools with tiny creatures, plants that change with the seasons, and ecosystems working together!',
            emotion: 'observant',
            choices: null,
          },
          {
            speaker: 'Sky',
            text: 'Would you like to start by observing how different organisms adapt to their environment?',
            emotion: 'scientific',
            choices: [
              { text: 'Yes, let\'s observe!', action: 'start_biology_challenge' },
              { text: 'What\'s an ecosystem?', action: 'explain_ecosystem' },
              { text: 'Can we help the animals?', action: 'help_animals' },
            ],
          },
        ],
      },
    };
  }

  /**
   * Load a story chapter
   * @param {Object} data - Story loading data
   */
  loadStory(data) {
    const chapterName = data.chapter || 'introduction';
    this.currentChapter = this.storyData[chapterName];

    if (!this.currentChapter) {
      console.warn(`Story chapter "${chapterName}" not found`);
      return;
    }

    this.dialogueIndex = 0;
    this.loadDialogue(0);
  }

  /**
   * Load a specific dialogue within the current chapter
   * @param {number} index - Dialogue index
   */
  loadDialogue(index) {
    if (!this.currentChapter || !this.currentChapter.dialogues[index]) {
      return;
    }

    this.currentDialogue = this.currentChapter.dialogues[index];
    this.dialogueIndex = index;
    this.isDialogueActive = true;
    this.textRevealProgress = 0;
    this.clickableBounds = [];
  }

  /**
   * Advance to next dialogue or handle choices
   */
  nextDialogue() {
    if (!this.currentChapter) return;

    // If current dialogue has choices, don't auto-advance
    if (this.currentDialogue.choices) {
      return;
    }

    // Move to next dialogue
    if (this.dialogueIndex < this.currentChapter.dialogues.length - 1) {
      this.loadDialogue(this.dialogueIndex + 1);
    } else {
      // Chapter complete
      this.completeChapter();
    }
  }

  /**
   * Handle dialogue choice selection
   * @param {string} action - The action associated with the choice
   */
  handleChoice(action) {
    console.log(`Story choice selected: ${action}`);

    switch (action) {
    case 'accept_mission':
      this.game.loadScene('navigation', { showIntro: true });
      break;

    case 'learn_more':
      this.showMoreInfo();
      break;

    case 'explain_science':
      this.explainScience();
      break;

    case 'start_physics_challenge':
      this.game.loadScene('challenge', {
        type: 'physics',
        challenge: 'gravity_basics',
      });
      break;

    case 'start_chemistry_challenge':
      this.game.loadScene('challenge', {
        type: 'chemistry',
        challenge: 'color_reactions',
      });
      break;

    case 'start_biology_challenge':
      this.game.loadScene('challenge', {
        type: 'biology',
        challenge: 'ecosystem_observation',
      });
      break;

    case 'explore_island':
      this.game.loadScene('discovery', { mode: 'exploration' });
      break;

    default:
      console.warn(`Unknown story action: ${action}`);
      this.nextDialogue();
    }
  }

  /**
   * Complete current chapter and progress story
   */
  completeChapter() {
    this.isDialogueActive = false;

    // Award discovery points for completing story
    this.game.discoveryTracker.addDiscovery({
      type: 'story',
      name: this.currentChapter.title,
      points: 50,
    });

    // Progress to next appropriate scene
    this.game.loadScene('navigation', { completedChapter: this.currentChapter });
  }

  /**
   * Show additional information about the mission
   */
  showMoreInfo() {
    // Create temporary info dialogue
    this.currentDialogue = {
      speaker: 'Sky',
      text: 'We\'ll visit different scientific islands, conduct experiments, make discoveries, and learn how the natural world works. Each island teaches different scientific concepts through hands-on activities!',
      emotion: 'informative',
      choices: [
        { text: 'Sounds amazing!', action: 'accept_mission' },
        { text: 'What islands are there?', action: 'list_islands' },
      ],
    };
    this.textRevealProgress = 0;
  }

  /**
   * Explain the types of science we'll encounter
   */
  explainScience() {
    this.currentDialogue = {
      speaker: 'Sky',
      text: 'We\'ll explore Physics (how things move), Chemistry (how substances react), Biology (living things), and Earth Science (our planet\'s systems). Each type of science has its own island with unique experiments!',
      emotion: 'educational',
      choices: [
        { text: 'Let\'s start exploring!', action: 'accept_mission' },
        { text: 'Which should we visit first?', action: 'choose_first_island' },
      ],
    };
    this.textRevealProgress = 0;
  }

  /**
   * Handle click events
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    if (!this.isDialogueActive) return false;

    // Check if clicking on choice buttons
    if (this.currentDialogue.choices) {
      for (let i = 0; i < this.clickableBounds.length; i++) {
        const bounds = this.clickableBounds[i];
        if (
          x >= bounds.x &&
          x <= bounds.x + bounds.width &&
          y >= bounds.y &&
          y <= bounds.y + bounds.height
        ) {
          this.handleChoice(bounds.action);
          return true;
        }
      }
    } else {
      // Click to advance dialogue
      if (this.textRevealProgress >= this.currentDialogue.text.length) {
        this.nextDialogue();
      } else {
        // Skip text reveal animation
        this.textRevealProgress = this.currentDialogue.text.length;
      }
      return true;
    }

    return false;
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyPress(event) {
    if (!this.isDialogueActive) return;

    switch (event.code) {
    case 'Space':
    case 'Enter':
      if (this.currentDialogue.choices) {
        // Select first choice with Space/Enter
        if (this.currentDialogue.choices.length > 0) {
          this.handleChoice(this.currentDialogue.choices[0].action);
        }
      } else {
        if (this.textRevealProgress >= this.currentDialogue.text.length) {
          this.nextDialogue();
        } else {
          this.textRevealProgress = this.currentDialogue.text.length;
        }
      }
      break;

    case 'Digit1':
    case 'Digit2':
    case 'Digit3':
      if (this.currentDialogue.choices) {
        const choiceIndex = parseInt(event.code.slice(-1)) - 1;
        if (choiceIndex < this.currentDialogue.choices.length) {
          this.handleChoice(this.currentDialogue.choices[choiceIndex].action);
        }
      }
      break;
    }
  }

  /**
   * Update story state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (!this.isDialogueActive) return;

    // Update character animation
    this.animationTime += deltaTime;
    this.characterOffset = Math.sin(this.animationTime * 0.003) * 5;

    // Update text reveal animation
    if (this.textRevealProgress < this.currentDialogue.text.length) {
      this.textRevealProgress += (this.textRevealSpeed * deltaTime) / 1000;
      this.textRevealProgress = Math.min(this.textRevealProgress, this.currentDialogue.text.length);
    }
  }

  /**
   * Render the story scene
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    if (!this.isDialogueActive || !this.currentDialogue) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Clear clickable bounds for this frame
    this.clickableBounds = [];

    // Draw character
    this.renderCharacter(ctx, canvasWidth, canvasHeight);

    // Draw dialogue box
    this.renderDialogueBox(ctx, canvasWidth, canvasHeight);

    // Draw text
    this.renderDialogueText(ctx, canvasWidth, canvasHeight);

    // Draw choices if available
    if (
      this.currentDialogue.choices &&
      this.textRevealProgress >= this.currentDialogue.text.length
    ) {
      this.renderChoices(ctx, canvasWidth, canvasHeight);
    }

    // Draw continue indicator if no choices
    if (
      !this.currentDialogue.choices &&
      this.textRevealProgress >= this.currentDialogue.text.length
    ) {
      this.renderContinueIndicator(ctx, canvasWidth, canvasHeight);
    }
  }

  /**
   * Render Sky the Parrot character
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderCharacter(ctx, canvasWidth, canvasHeight) {
    const characterX = 100;
    const characterY = canvasHeight * 0.3 + this.characterOffset;
    const characterSize = 120;

    // Sky the Parrot (simplified representation)
    // Body
    ctx.fillStyle = '#4a90e2'; // Blue body
    ctx.beginPath();
    ctx.ellipse(
      characterX,
      characterY,
      characterSize * 0.4,
      characterSize * 0.6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Wing
    ctx.fillStyle = '#2171b5';
    ctx.beginPath();
    ctx.ellipse(
      characterX - 20,
      characterY,
      characterSize * 0.3,
      characterSize * 0.4,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Head
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(characterX, characterY - 40, characterSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ffa500';
    ctx.beginPath();
    ctx.ellipse(characterX + 25, characterY - 40, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(characterX + 10, characterY - 45, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(characterX + 12, characterY - 45, 4, 0, Math.PI * 2);
    ctx.fill();

    // Character name
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sky the Parrot', characterX, characterY + characterSize * 0.8);
  }

  /**
   * Render dialogue box
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderDialogueBox(ctx, canvasWidth, canvasHeight) {
    const boxX = canvasWidth * 0.25;
    const boxY = canvasHeight * 0.65;
    const boxWidth = canvasWidth * 0.7;
    const boxHeight = canvasHeight * 0.3;

    // Main dialogue box
    ctx.fillStyle = this.game.themeColors.surface;
    ctx.strokeStyle = this.game.themeColors.primary;
    ctx.lineWidth = 3;

    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Speaker name box
    const nameBoxWidth = 150;
    const nameBoxHeight = 30;
    ctx.fillStyle = this.game.themeColors.primary;
    ctx.fillRect(boxX, boxY - nameBoxHeight, nameBoxWidth, nameBoxHeight);

    ctx.fillStyle = this.game.themeColors.background;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentDialogue.speaker, boxX + nameBoxWidth / 2, boxY - 8);
  }

  /**
   * Render dialogue text with typewriter effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderDialogueText(ctx, canvasWidth, canvasHeight) {
    const boxX = canvasWidth * 0.25;
    const boxY = canvasHeight * 0.65;
    const boxWidth = canvasWidth * 0.7;
    const textPadding = 20;

    // Get revealed text
    const revealedText = this.currentDialogue.text.substring(
      0,
      Math.floor(this.textRevealProgress)
    );

    // Text styling
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';

    // Word wrap and render text
    const maxWidth = boxWidth - textPadding * 2;
    const lineHeight = 24;
    const lines = this.wrapText(ctx, revealedText, maxWidth);

    let textY = boxY + textPadding + lineHeight;
    lines.forEach(line => {
      ctx.fillText(line, boxX + textPadding, textY);
      textY += lineHeight;
    });
  }

  /**
   * Wrap text to fit within specified width
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum line width
   * @returns {Array<string>} Array of text lines
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Render choice buttons
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderChoices(ctx, canvasWidth, canvasHeight) {
    const choices = this.currentDialogue.choices;
    const buttonWidth = 250;
    const buttonHeight = 45;
    const buttonSpacing = 10;
    const startY = canvasHeight * 0.85;

    choices.forEach((choice, index) => {
      const buttonX = (canvasWidth - buttonWidth) / 2;
      const buttonY = startY + index * (buttonHeight + buttonSpacing);

      // Button background
      ctx.fillStyle = this.game.themeColors.primary;
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Button text
      ctx.fillStyle = this.game.themeColors.background;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(choice.text, buttonX + buttonWidth / 2, buttonY + 28);

      // Choice number
      ctx.fillStyle = this.game.themeColors.secondary;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${index + 1}`, buttonX + 10, buttonY + 25);

      // Store clickable bounds
      this.clickableBounds.push({
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        action: choice.action,
      });
    });
  }

  /**
   * Render continue indicator
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderContinueIndicator(ctx, canvasWidth, canvasHeight) {
    const indicatorX = canvasWidth * 0.9;
    const indicatorY = canvasHeight * 0.9;

    // Pulsing triangle
    const alpha = 0.5 + 0.5 * Math.sin(this.animationTime * 0.008);
    ctx.fillStyle =
      this.game.themeColors.primary +
      Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, '0');

    ctx.beginPath();
    ctx.moveTo(indicatorX, indicatorY - 10);
    ctx.lineTo(indicatorX + 15, indicatorY);
    ctx.lineTo(indicatorX, indicatorY + 10);
    ctx.closePath();
    ctx.fill();

    // "Click to continue" text
    ctx.fillStyle = this.game.themeColors.textSecondary;
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Click to continue', indicatorX - 25, indicatorY + 3);
  }

  /**
   * Get current story progress
   * @returns {Object} Story progress data
   */
  getProgress() {
    return {
      currentChapter: this.currentChapter
        ? Object.keys(this.storyData).find(key => this.storyData[key] === this.currentChapter)
        : null,
      dialogueIndex: this.dialogueIndex,
      completedChapters: this.getCompletedChapters(),
    };
  }

  /**
   * Get list of completed story chapters
   * @returns {Array<string>} Completed chapter names
   */
  getCompletedChapters() {
    // This would be stored in localStorage or game state
    const saved = localStorage.getItem('adventureQuest_completedChapters');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Mark chapter as completed
   * @param {string} chapterName - Name of completed chapter
   */
  markChapterCompleted(chapterName) {
    const completed = this.getCompletedChapters();
    if (!completed.includes(chapterName)) {
      completed.push(chapterName);
      localStorage.setItem('adventureQuest_completedChapters', JSON.stringify(completed));
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up any story-related resources
    this.currentChapter = null;
    this.currentDialogue = null;
    this.clickableBounds = [];
  }
}
