/**
 * ChallengeManager - Manages educational challenges and adaptive difficulty
 * Handles science experiments, quizzes, and interactive learning activities
 */
export default class ChallengeManager {
  /**
   * Create a new ChallengeManager instance
   * @param {AdventureQuestGame} game - Reference to main game instance
   */
  constructor(game) {
    this.game = game;
    this.currentChallenge = null;
    this.challengeType = null;
    this.difficultyLevel = 1;
    this.playerPerformance = {
      correct: 0,
      incorrect: 0,
      streak: 0,
      averageTime: 0,
    };

    // Challenge state
    this.isActive = false;
    this.startTime = 0;
    this.currentQuestion = null;
    this.questionIndex = 0;
    this.userAnswer = null;
    this.showingResult = false;
    this.resultTimer = 0;

    // UI state
    this.clickableBounds = [];
    this.animationTime = 0;
    this.particles = [];

    // Initialize challenge data
    this.challengeData = this.initializeChallengeData();
  }

  /**
   * Initialize challenge data for different science topics
   * @returns {Object} Challenge data structure
   */
  initializeChallengeData() {
    return {
      physics: {
        gravity_basics: {
          title: 'Understanding Gravity',
          description: 'Learn how gravity affects different objects',
          experiments: [
            {
              type: 'prediction',
              question: 'Which will fall faster in a vacuum - a feather or a rock?',
              options: [
                'The rock',
                'The feather',
                'They fall at the same speed',
                'It depends on their weight',
              ],
              correct: 2,
              explanation:
                'In a vacuum, all objects fall at the same rate regardless of their mass! This is because gravity accelerates all objects equally.',
              visualization: 'falling_objects',
            },
            {
              type: 'experiment',
              question: 'Drop different objects and observe their motion',
              task: 'drag_and_drop',
              objects: ['feather', 'rock', 'paper', 'coin'],
              expected_result: 'same_time',
              explanation:
                'Air resistance affects how objects fall, but gravity pulls on everything equally!',
            },
            {
              type: 'application',
              question: 'Why do astronauts float in space?',
              options: [
                'No gravity in space',
                'They are in constant free fall',
                'Special suits make them float',
                'Space is filled with helium',
              ],
              correct: 1,
              explanation:
                'Astronauts are in constant free fall around Earth! They\'re falling toward Earth but moving so fast sideways that they keep missing it.',
            },
          ],
        },

        force_and_motion: {
          title: 'Forces and Motion',
          description: 'Explore how forces change motion',
          experiments: [
            {
              type: 'interactive',
              question: 'Push the box with different forces. What happens?',
              task: 'force_slider',
              variables: { friction: 0.3, mass: 10 },
              learning_goal: 'Greater force = greater acceleration',
            },
          ],
        },
      },

      chemistry: {
        color_reactions: {
          title: 'Colorful Chemical Reactions',
          description: 'Mix safe substances to see amazing color changes',
          experiments: [
            {
              type: 'mixing',
              question: 'What happens when we mix baking soda and vinegar?',
              options: ['Nothing', 'It gets hot', 'It bubbles and fizzes', 'It changes color'],
              correct: 2,
              explanation:
                'Baking soda and vinegar create an acid-base reaction that produces carbon dioxide gas - that\'s the bubbling!',
              visualization: 'fizzing_reaction',
            },
            {
              type: 'prediction',
              question: 'Which combination will create the most dramatic reaction?',
              mixtures: [
                { name: 'Red + Blue', result: 'purple', intensity: 2 },
                { name: 'Acid + Base', result: 'fizzing', intensity: 5 },
                { name: 'Salt + Water', result: 'dissolving', intensity: 1 },
              ],
              correct: 1,
              explanation:
                'Acid-base reactions are more dramatic because they create new substances and release energy!',
            },
          ],
        },

        states_of_matter: {
          title: 'States of Matter',
          description: 'Explore how heating and cooling changes substances',
          experiments: [
            {
              type: 'temperature_control',
              question: 'What happens to water at different temperatures?',
              substance: 'water',
              temperatures: [-10, 0, 25, 100, 150],
              states: ['ice', 'ice', 'liquid', 'steam', 'steam'],
              explanation:
                'Temperature changes the energy of molecules, making them move faster or slower!',
            },
          ],
        },
      },

      biology: {
        ecosystem_observation: {
          title: 'Ecosystem Interactions',
          description: 'Observe how living things interact in their environment',
          experiments: [
            {
              type: 'observation',
              question: 'What do you notice about this food chain?',
              ecosystem: {
                producers: ['grass', 'algae', 'trees'],
                primary_consumers: ['rabbit', 'fish', 'deer'],
                secondary_consumers: ['fox', 'hawk', 'bear'],
                decomposers: ['mushrooms', 'bacteria'],
              },
              task: 'connect_relationships',
              explanation:
                'Energy flows from producers to consumers, and decomposers recycle nutrients back to the soil!',
            },
            {
              type: 'scenario',
              question: 'What would happen if all the foxes disappeared from this ecosystem?',
              options: [
                'Nothing would change',
                'Rabbit population would increase',
                'Grass would grow better',
                'All plants would die',
              ],
              correct: 1,
              explanation:
                'Without predators, rabbit populations would grow rapidly, which could lead to overgrazing of plants.',
            },
          ],
        },

        adaptation_study: {
          title: 'Animal Adaptations',
          description: 'Discover how animals adapt to their environments',
          experiments: [
            {
              type: 'matching',
              question: 'Match each animal adaptation to its purpose',
              adaptations: [
                { feature: 'Thick fur', purpose: 'Staying warm in cold climates' },
                { feature: 'Large ears', purpose: 'Cooling down in hot climates' },
                { feature: 'Webbed feet', purpose: 'Swimming efficiently' },
                { feature: 'Sharp claws', purpose: 'Climbing and catching prey' },
              ],
              explanation: 'Each adaptation helps animals survive in their specific environment!',
            },
          ],
        },
      },
    };
  }

  /**
   * Load a challenge
   * @param {Object} data - Challenge loading data
   */
  loadChallenge(data) {
    this.challengeType = data.type || 'physics';
    const challengeName = data.challenge || 'gravity_basics';

    this.currentChallenge = this.challengeData[this.challengeType]?.[challengeName];

    if (!this.currentChallenge) {
      console.warn(`Challenge "${challengeName}" not found for type "${this.challengeType}"`);
      return;
    }

    this.questionIndex = 0;
    this.isActive = true;
    this.startTime = Date.now();
    this.loadQuestion(0);
  }

  /**
   * Load a specific question/experiment
   * @param {number} index - Question index
   */
  loadQuestion(index) {
    if (!this.currentChallenge || !this.currentChallenge.experiments[index]) {
      this.completeChallenge();
      return;
    }

    this.currentQuestion = this.currentChallenge.experiments[index];
    this.questionIndex = index;
    this.userAnswer = null;
    this.showingResult = false;
    this.resultTimer = 0;
    this.clickableBounds = [];

    // Adapt difficulty based on performance
    this.adaptDifficulty();
  }

  /**
   * Adapt difficulty based on player performance
   */
  adaptDifficulty() {
    const accuracy =
      this.playerPerformance.correct /
      (this.playerPerformance.correct + this.playerPerformance.incorrect || 1);

    // Adjust difficulty based on performance
    if (accuracy > 0.8 && this.playerPerformance.streak > 3) {
      this.difficultyLevel = Math.min(5, this.difficultyLevel + 1);
    } else if (accuracy < 0.5) {
      this.difficultyLevel = Math.max(1, this.difficultyLevel - 1);
    }

    // Apply difficulty modifications to current question
    this.applyDifficultyModifications();
  }

  /**
   * Apply difficulty modifications to current question
   */
  applyDifficultyModifications() {
    if (!this.currentQuestion) return;

    switch (this.difficultyLevel) {
    case 1: // Easy
      // Provide more obvious hints
      if (this.currentQuestion.options) {
        // Could highlight obviously wrong answers
      }
      break;

    case 2: // Normal
      // Standard question as-is
      break;

    case 3: // Challenging
      // Add time pressure or require more precision
      this.currentQuestion.timeLimit = 30000; // 30 seconds
      break;

    case 4: // Hard
      // Multiple concepts or require deeper thinking
      this.currentQuestion.requireExplanation = true;
      break;

    case 5: // Expert
      // Open-ended questions or complex scenarios
      this.currentQuestion.openEnded = true;
      break;
    }
  }

  /**
   * Submit an answer
   * @param {*} answer - User's answer
   */
  submitAnswer(answer) {
    if (!this.currentQuestion || this.showingResult) return;

    this.userAnswer = answer;
    const isCorrect = this.checkAnswer(answer);
    const responseTime = Date.now() - this.startTime;

    // Update performance tracking
    this.updatePerformance(isCorrect, responseTime);

    // Show result
    this.showResult(isCorrect);
  }

  /**
   * Check if answer is correct
   * @param {*} answer - User's answer
   * @returns {boolean} True if correct
   */
  checkAnswer(answer) {
    if (!this.currentQuestion) return false;

    switch (this.currentQuestion.type) {
    case 'prediction':
    case 'application':
    case 'scenario':
      return answer === this.currentQuestion.correct;

    case 'mixing':
      // For mixing experiments, check if they selected the right combination
      return this.checkMixingAnswer(answer);

    case 'observation':
      return this.checkObservationAnswer(answer);

    case 'matching':
      return this.checkMatchingAnswer(answer);

    case 'experiment':
      return this.checkExperimentAnswer(answer);

    default:
      return false;
    }
  }

  /**
   * Check mixing experiment answer
   * @param {*} answer - User's mixing selection
   * @returns {boolean} True if correct
   */
  checkMixingAnswer(answer) {
    // Implementation depends on mixing interface
    return answer.mixture === this.currentQuestion.correct;
  }

  /**
   * Check observation answer
   * @param {*} answer - User's observation connections
   * @returns {boolean} True if correct
   */
  checkObservationAnswer(answer) {
    // Check if user correctly connected ecosystem relationships
    const expectedConnections = this.getExpectedEcosystemConnections();
    return this.compareConnections(answer.connections, expectedConnections);
  }

  /**
   * Check matching answer
   * @param {*} answer - User's matches
   * @returns {boolean} True if correct
   */
  checkMatchingAnswer(answer) {
    const correctMatches = this.currentQuestion.adaptations;
    return answer.matches.every(match =>
      correctMatches.some(
        correct => correct.feature === match.feature && correct.purpose === match.purpose
      )
    );
  }

  /**
   * Check experiment answer
   * @param {*} answer - User's experiment result
   * @returns {boolean} True if correct
   */
  checkExperimentAnswer(answer) {
    return answer.result === this.currentQuestion.expected_result;
  }

  /**
   * Update performance tracking
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {number} responseTime - Time taken to answer
   */
  updatePerformance(isCorrect, responseTime) {
    if (isCorrect) {
      this.playerPerformance.correct++;
      this.playerPerformance.streak++;
    } else {
      this.playerPerformance.incorrect++;
      this.playerPerformance.streak = 0;
    }

    // Update average response time
    const totalAnswers = this.playerPerformance.correct + this.playerPerformance.incorrect;
    this.playerPerformance.averageTime =
      (this.playerPerformance.averageTime * (totalAnswers - 1) + responseTime) / totalAnswers;
  }

  /**
   * Show result of answer
   * @param {boolean} isCorrect - Whether answer was correct
   */
  showResult(isCorrect) {
    this.showingResult = true;
    this.resultTimer = 0;

    // Create particles for visual feedback
    this.createResultParticles(isCorrect);

    // Update game score
    if (isCorrect) {
      const points = this.calculatePoints();
      this.game.gameState.score += points;

      // Add to discovery tracker
      this.game.discoveryTracker.addDiscovery({
        type: 'challenge',
        name: this.currentQuestion.question,
        points: points,
      });
    }
  }

  /**
   * Calculate points based on difficulty and performance
   * @returns {number} Points earned
   */
  calculatePoints() {
    let basePoints = 10;

    // Difficulty multiplier
    basePoints *= this.difficultyLevel;

    // Streak bonus
    if (this.playerPerformance.streak > 2) {
      basePoints += this.playerPerformance.streak * 2;
    }

    // Speed bonus (if answered quickly)
    const responseTime = Date.now() - this.startTime;
    if (responseTime < 10000) {
      // Less than 10 seconds
      basePoints += 5;
    }

    return basePoints;
  }

  /**
   * Create visual particles for feedback
   * @param {boolean} isCorrect - Whether answer was correct
   */
  createResultParticles(isCorrect) {
    const color = isCorrect ? this.game.themeColors.success : this.game.themeColors.danger;
    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;

    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: color,
        life: 1.0,
        decay: 0.02,
      });
    }
  }

  /**
   * Proceed to next question or complete challenge
   */
  nextQuestion() {
    if (this.questionIndex < this.currentChallenge.experiments.length - 1) {
      this.loadQuestion(this.questionIndex + 1);
    } else {
      this.completeChallenge();
    }
  }

  /**
   * Complete the current challenge
   */
  completeChallenge() {
    this.isActive = false;

    // Calculate final score
    const accuracy =
      this.playerPerformance.correct /
      (this.playerPerformance.correct + this.playerPerformance.incorrect || 1);
    const bonusPoints = Math.floor(accuracy * 100);

    this.game.gameState.score += bonusPoints;

    // Add major discovery
    this.game.discoveryTracker.addDiscovery({
      type: 'challenge_complete',
      name: this.currentChallenge.title,
      points: bonusPoints,
      metadata: {
        accuracy: accuracy,
        difficultyLevel: this.difficultyLevel,
        totalQuestions: this.currentChallenge.experiments.length,
      },
    });

    // Return to navigation or next scene
    this.game.loadScene('navigation', {
      completedChallenge: this.currentChallenge,
      challengeType: this.challengeType,
    });
  }

  /**
   * Handle click events
   * @param {number} x - Click X coordinate
   * @param {number} y - Click Y coordinate
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    if (!this.isActive) return false;

    // Check clickable bounds
    for (const bounds of this.clickableBounds) {
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        if (bounds.type === 'answer') {
          this.submitAnswer(bounds.value);
        } else if (bounds.type === 'continue') {
          if (this.showingResult) {
            this.nextQuestion();
          }
        } else if (bounds.type === 'experiment') {
          this.handleExperimentClick(bounds);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Handle experiment-specific clicks
   * @param {Object} bounds - Clicked bounds with experiment data
   */
  handleExperimentClick(bounds) {
    switch (this.currentQuestion.type) {
    case 'experiment':
      this.handleDragDropExperiment(bounds);
      break;
    case 'mixing':
      this.handleMixingExperiment(bounds);
      break;
    case 'matching':
      this.handleMatchingExperiment(bounds);
      break;
    }
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyPress(event) {
    if (!this.isActive) return;

    // Number keys for multiple choice
    if (event.code.startsWith('Digit')) {
      const number = parseInt(event.code.slice(-1));
      if (this.currentQuestion.options && number <= this.currentQuestion.options.length) {
        this.submitAnswer(number - 1);
      }
    }

    // Enter to continue
    if (event.code === 'Enter' && this.showingResult) {
      this.nextQuestion();
    }
  }

  /**
   * Update challenge state
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (!this.isActive) return;

    this.animationTime += deltaTime;

    // Update result timer
    if (this.showingResult) {
      this.resultTimer += deltaTime;
    }

    // Update particles
    this.updateParticles(deltaTime);
  }

  /**
   * Update particle animations
   * @param {number} deltaTime - Time since last update
   */
  updateParticles(_deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render the challenge scene
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    if (!this.isActive || !this.currentQuestion) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Clear clickable bounds
    this.clickableBounds = [];

    // Render challenge header
    this.renderChallengeHeader(ctx, canvasWidth, canvasHeight);

    // Render question content
    this.renderQuestionContent(ctx, canvasWidth, canvasHeight);

    // Render answer options or experiment interface
    this.renderAnswerInterface(ctx, canvasWidth, canvasHeight);

    // Render result if showing
    if (this.showingResult) {
      this.renderResult(ctx, canvasWidth, canvasHeight);
    }

    // Render particles
    this.renderParticles(ctx);

    // Render progress indicator
    this.renderProgress(ctx, canvasWidth, canvasHeight);
  }

  /**
   * Render challenge header with title and type
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderChallengeHeader(ctx, canvasWidth, _canvasHeight) {
    // Challenge title
    ctx.fillStyle = this.game.themeColors.primary;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentChallenge.title, canvasWidth / 2, 40);

    // Challenge type badge
    const badgeWidth = 120;
    const badgeHeight = 30;
    const badgeX = 20;
    const badgeY = 20;

    ctx.fillStyle = this.game.themeColors.secondary;
    ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);

    ctx.fillStyle = this.game.themeColors.background;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.challengeType.toUpperCase(), badgeX + badgeWidth / 2, badgeY + 20);

    // Difficulty indicator
    const difficultyX = canvasWidth - 140;
    const difficultyText = `Level ${this.difficultyLevel}`;

    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(difficultyText, difficultyX, 35);
  }

  /**
   * Render question content
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderQuestionContent(ctx, canvasWidth, canvasHeight) {
    const questionY = 100;
    const maxWidth = canvasWidth - 80;

    // Question text
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    const lines = this.wrapText(ctx, this.currentQuestion.question, maxWidth);
    lines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, questionY + index * 30);
    });

    // Render visualization if available
    if (this.currentQuestion.visualization) {
      this.renderVisualization(ctx, canvasWidth, canvasHeight);
    }
  }

  /**
   * Render answer interface based on question type
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderAnswerInterface(ctx, canvasWidth, canvasHeight) {
    switch (this.currentQuestion.type) {
    case 'prediction':
    case 'application':
    case 'scenario':
      this.renderMultipleChoice(ctx, canvasWidth, canvasHeight);
      break;
    case 'mixing':
      this.renderMixingInterface(ctx, canvasWidth, canvasHeight);
      break;
    case 'experiment':
      this.renderExperimentInterface(ctx, canvasWidth, canvasHeight);
      break;
    case 'matching':
      this.renderMatchingInterface(ctx, canvasWidth, canvasHeight);
      break;
    case 'observation':
      this.renderObservationInterface(ctx, canvasWidth, canvasHeight);
      break;
    }
  }

  /**
   * Render multiple choice options
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderMultipleChoice(ctx, canvasWidth, canvasHeight) {
    if (!this.currentQuestion.options) return;

    const startY = canvasHeight * 0.4;
    const buttonHeight = 50;
    const buttonSpacing = 10;
    const buttonWidth = canvasWidth * 0.8;
    const buttonX = (canvasWidth - buttonWidth) / 2;

    this.currentQuestion.options.forEach((option, index) => {
      const buttonY = startY + index * (buttonHeight + buttonSpacing);

      // Highlight if selected
      const isSelected = this.userAnswer === index;
      ctx.fillStyle = isSelected ? this.game.themeColors.primary : this.game.themeColors.surface;
      ctx.strokeStyle = this.game.themeColors.primary;
      ctx.lineWidth = 2;

      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Option text
      ctx.fillStyle = isSelected ? this.game.themeColors.background : this.game.themeColors.text;
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${index + 1}. ${option}`, buttonX + 20, buttonY + 30);

      // Store clickable bounds
      this.clickableBounds.push({
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        type: 'answer',
        value: index,
      });
    });
  }

  /**
   * Render result feedback
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderResult(ctx, canvasWidth, canvasHeight) {
    const isCorrect = this.checkAnswer(this.userAnswer);

    // Result background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Result box
    const boxWidth = canvasWidth * 0.8;
    const boxHeight = canvasHeight * 0.6;
    const boxX = (canvasWidth - boxWidth) / 2;
    const boxY = (canvasHeight - boxHeight) / 2;

    ctx.fillStyle = this.game.themeColors.surface;
    ctx.strokeStyle = isCorrect ? this.game.themeColors.success : this.game.themeColors.danger;
    ctx.lineWidth = 4;

    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Result text
    ctx.fillStyle = isCorrect ? this.game.themeColors.success : this.game.themeColors.danger;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isCorrect ? 'Correct!' : 'Not quite right', canvasWidth / 2, boxY + 80);

    // Explanation
    if (this.currentQuestion.explanation) {
      ctx.fillStyle = this.game.themeColors.text;
      ctx.font = '18px Arial';
      const explanationLines = this.wrapText(ctx, this.currentQuestion.explanation, boxWidth - 40);
      explanationLines.forEach((line, index) => {
        ctx.fillText(line, canvasWidth / 2, boxY + 140 + index * 25);
      });
    }

    // Continue button
    if (this.resultTimer > 2000) {
      // Show after 2 seconds
      const continueButtonWidth = 200;
      const continueButtonHeight = 50;
      const continueButtonX = (canvasWidth - continueButtonWidth) / 2;
      const continueButtonY = boxY + boxHeight - 80;

      ctx.fillStyle = this.game.themeColors.primary;
      ctx.fillRect(continueButtonX, continueButtonY, continueButtonWidth, continueButtonHeight);

      ctx.fillStyle = this.game.themeColors.background;
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Continue', canvasWidth / 2, continueButtonY + 32);

      this.clickableBounds.push({
        x: continueButtonX,
        y: continueButtonY,
        width: continueButtonWidth,
        height: continueButtonHeight,
        type: 'continue',
      });
    }
  }

  /**
   * Render particle effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderParticles(ctx) {
    this.particles.forEach(particle => {
      ctx.fillStyle =
        particle.color +
        Math.floor(particle.life * 255)
          .toString(16)
          .padStart(2, '0');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Render progress indicator
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderProgress(ctx, canvasWidth, canvasHeight) {
    const progressY = canvasHeight - 30;
    const progressWidth = canvasWidth - 40;
    const progressHeight = 8;
    const progressX = 20;

    // Progress background
    ctx.fillStyle = this.game.themeColors.surface;
    ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

    // Progress fill
    const progressPercent = (this.questionIndex + 1) / this.currentChallenge.experiments.length;
    ctx.fillStyle = this.game.themeColors.secondary;
    ctx.fillRect(progressX, progressY, progressWidth * progressPercent, progressHeight);

    // Progress text
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Question ${this.questionIndex + 1} of ${this.currentChallenge.experiments.length}`,
      canvasWidth / 2,
      progressY - 10
    );
  }

  /**
   * Render visualization for certain question types
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderVisualization(ctx, canvasWidth, canvasHeight) {
    const visualizationType = this.currentQuestion.visualization;

    switch (visualizationType) {
    case 'falling_objects':
      this.renderFallingObjectsVisualization(ctx, canvasWidth, canvasHeight);
      break;
    case 'fizzing_reaction':
      this.renderFizzingReactionVisualization(ctx, canvasWidth, canvasHeight);
      break;
    }
  }

  /**
   * Render falling objects visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderFallingObjectsVisualization(ctx, canvasWidth, _canvasHeight) {
    const centerX = canvasWidth / 2;
    const startY = 180;
    const dropHeight = Math.sin(this.animationTime * 0.002) * 50 + 100;

    // Feather
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(centerX - 60, startY + dropHeight, 20, 40);

    // Rock
    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.arc(centerX + 40, startY + dropHeight, 15, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = this.game.themeColors.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Feather', centerX - 50, startY + dropHeight + 60);
    ctx.fillText('Rock', centerX + 40, startY + dropHeight + 60);
  }

  /**
   * Render fizzing reaction visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderFizzingReactionVisualization(ctx, canvasWidth, _canvasHeight) {
    const centerX = canvasWidth / 2;
    const centerY = 200;

    // Beaker
    ctx.strokeStyle = this.game.themeColors.text;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(centerX - 30, centerY, 60, 80);
    ctx.stroke();

    // Bubbles
    for (let i = 0; i < 8; i++) {
      const bubbleX = centerX + (Math.random() - 0.5) * 40;
      const bubbleY = centerY + 20 + Math.random() * 40;
      const bubbleSize = 2 + Math.random() * 4;

      ctx.fillStyle = this.game.themeColors.primary + '80';
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Additional rendering methods for other experiment types would go here...
  renderMixingInterface(_ctx, _canvasWidth, _canvasHeight) {
    // Implementation for mixing experiments
  }

  renderExperimentInterface(_ctx, _canvasWidth, _canvasHeight) {
    // Implementation for interactive experiment interfaces
  }

  renderMatchingInterface(_ctx, _canvasWidth, _canvasHeight) {
    // Implementation for matching exercises
  }

  renderObservationInterface(_ctx, _canvasWidth, _canvasHeight) {
    // Implementation for observation exercises
  }

  /**
   * Utility method to wrap text
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width
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
   * Get challenge progress data
   * @returns {Object} Progress information
   */
  getProgress() {
    return {
      currentChallenge: this.currentChallenge?.title,
      challengeType: this.challengeType,
      questionIndex: this.questionIndex,
      performance: { ...this.playerPerformance },
      difficultyLevel: this.difficultyLevel,
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.currentChallenge = null;
    this.currentQuestion = null;
    this.clickableBounds = [];
    this.particles = [];
  }
}
