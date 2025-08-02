// Number Line Jump Game for Learnimals
// An interactive math game where Leo the Lion jumps along a number line to learn addition and subtraction
// Enhanced with BaseGame framework for progress tracking, analytics, and mobile optimization
import logger from '../../../utils/logger.js';
import BaseGame from '../../../components/games/BaseGame.js';

class NumberLineJumpGame extends BaseGame {
  constructor(canvasId, options = {}) {
    // Initialize BaseGame with canvas mode
    super(canvasId, {
      gameType: 'number-line-jump',
      subject: 'math',
      difficulty: options.difficulty || 'easy',
      enableProgressTracking: true,
      ...options,
    });

    // Game-specific properties
    this.currentPosition = 0;
    this.targetNumber = 0;
    this.currentEquation = [];
    this.jumpsUsed = 0;
    this.maxJumpsAllowed = 10;
    this.round = 0;
    this.maxRounds = 5;

    // Difficulty-based settings
    this.maxNumber = this.getMaxNumberForDifficulty();
    this.availableJumps = this.getJumpsForDifficulty();

    // Animation and rendering
    this.leoPosition = { x: 0, y: 0 };
    this.targetLeoPosition = { x: 0, y: 0 };
    this.leoAnimationSpeed = 0.15;
    this.isAnimating = false;

    // Visual elements
    this.numberLineY = 0;
    this.numberLineHeight = 60;
    this.tickSpacing = 0;
    this.leoSize = { width: 40, height: 40 };

    // Colors and styling
    this.colors = {
      background: '#87CEEB',
      numberLine: '#2C3E50',
      numbers: '#2C3E50',
      leo: '#FF6B35',
      target: '#FFD700',
      equation: '#2C3E50',
      button: '#4ECDC4',
      buttonHover: '#45B7B8',
      success: '#2ECC71',
      error: '#E74C3C',
    };

    // UI elements
    this.buttons = [];
    this.selectedJump = 1;
    this.lastJumpDirection = 1; // 1 for forward, -1 for backward

    // Game state
    this.problemStartTime = null;
  }

  /**
   * Get maximum number for current difficulty
   */
  getMaxNumberForDifficulty() {
    switch (this.difficulty) {
    case 'easy':
      return 20;
    case 'medium':
      return 50;
    case 'hard':
      return 100;
    default:
      return 20;
    }
  }

  /**
   * Get available jump amounts for current difficulty
   */
  getJumpsForDifficulty() {
    switch (this.difficulty) {
    case 'easy':
      return [1, 2, 5];
    case 'medium':
      return [1, 2, 5, 10];
    case 'hard':
      return [1, 2, 5, 10, 25];
    default:
      return [1, 2, 5];
    }
  }

  /**
   * Override BaseGame's onInitialized
   */
  onInitialized() {
    super.onInitialized();
    this.setupGameDimensions();
    this.createButtons();
    logger.debug('Number Line Jump game initialized successfully');
  }

  /**
   * Override BaseGame's onStart
   */
  onStart() {
    super.onStart();
    this.startNewGame();
  }

  /**
   * Override BaseGame's onRestart
   */
  onRestart() {
    super.onRestart();
    this.currentPosition = 0;
    this.targetNumber = 0;
    this.currentEquation = [];
    this.jumpsUsed = 0;
    this.round = 0;
    this.leoPosition = { x: 0, y: 0 };
    this.targetLeoPosition = { x: 0, y: 0 };
    this.isAnimating = false;
    this.problemStartTime = null;
  }

  /**
   * Setup game dimensions based on canvas size
   */
  setupGameDimensions() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Position number line in middle of canvas
    this.numberLineY = height * 0.5;

    // Calculate spacing between number ticks
    const lineWidth = width * 0.8; // Use 80% of canvas width
    this.tickSpacing = lineWidth / this.maxNumber;

    // Position Leo at start
    this.leoPosition.x = width * 0.1; // Start at 10% from left
    this.leoPosition.y = this.numberLineY - this.leoSize.height - 10;
    this.targetLeoPosition = { ...this.leoPosition };
  }

  /**
   * Create UI buttons for jump controls
   */
  createButtons() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.buttons = [];

    // Jump amount buttons
    const buttonWidth = 60;
    const buttonHeight = 40;
    const buttonSpacing = 20;
    const startX = (width - this.availableJumps.length * (buttonWidth + buttonSpacing)) / 2;
    const buttonY = height * 0.75;

    this.availableJumps.forEach((jump, index) => {
      this.buttons.push({
        type: 'jump',
        value: jump,
        x: startX + index * (buttonWidth + buttonSpacing),
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
        label: jump.toString(),
        selected: jump === this.selectedJump,
      });
    });

    // Direction buttons
    const dirButtonWidth = 80;
    const dirButtonY = buttonY + buttonHeight + 20;

    this.buttons.push({
      type: 'direction',
      value: 1,
      x: width * 0.3 - dirButtonWidth / 2,
      y: dirButtonY,
      width: dirButtonWidth,
      height: buttonHeight,
      label: '→ Add',
      selected: false,
    });

    this.buttons.push({
      type: 'direction',
      value: -1,
      x: width * 0.7 - dirButtonWidth / 2,
      y: dirButtonY,
      width: dirButtonWidth,
      height: buttonHeight,
      label: '← Subtract',
      selected: false,
    });

    // Undo button
    this.buttons.push({
      type: 'undo',
      value: null,
      x: width - 80,
      y: 20,
      width: 60,
      height: 30,
      label: 'Undo',
      selected: false,
      disabled: true,
    });
  }

  /**
   * Start a new game session
   */
  startNewGame() {
    this.round = 0;
    this.generateNewProblem();
  }

  /**
   * Generate a new math problem
   */
  generateNewProblem() {
    if (this.round >= this.maxRounds) {
      this.gameOver();
      return;
    }

    this.round++;
    this.updateLevel(this.round);

    // Reset game state
    this.currentPosition = 0;
    this.currentEquation = [];
    this.jumpsUsed = 0;
    this.isAnimating = false;
    this.problemStartTime = performance.now();

    // Generate target number based on difficulty
    let minTarget, maxTarget;
    switch (this.difficulty) {
    case 'easy':
      minTarget = 3;
      maxTarget = 15;
      break;
    case 'medium':
      minTarget = 5;
      maxTarget = 35;
      break;
    case 'hard':
      minTarget = 10;
      maxTarget = 75;
      break;
    default:
      minTarget = 3;
      maxTarget = 15;
    }

    this.targetNumber = Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget;

    // Reset Leo position
    this.setupGameDimensions();

    // Update undo button state
    this.updateUndoButton();

    logger.debug(`New problem: Reach ${this.targetNumber}`);
  }

  /**
   * Make a jump on the number line
   */
  makeJump(amount, direction) {
    if (this.isAnimating || this.state !== 'playing') {
      return;
    }

    const jumpValue = amount * direction;
    const newPosition = this.currentPosition + jumpValue;

    // Check bounds
    if (newPosition < 0 || newPosition > this.maxNumber) {
      this.playSound(200, 200, 'sawtooth'); // Error sound
      return;
    }

    // Record the jump
    this.currentEquation.push({
      operation: direction > 0 ? '+' : '-',
      value: amount,
      fromPosition: this.currentPosition,
      toPosition: newPosition,
    });

    this.currentPosition = newPosition;
    this.jumpsUsed++;
    this.lastJumpDirection = direction;

    // Animate Leo to new position
    this.animateLeoToPosition(newPosition);

    // Track analytics
    this.trackJumpMade(amount, direction, newPosition);

    // Update undo button
    this.updateUndoButton();

    // Check win condition after animation
    setTimeout(() => {
      this.checkWinCondition();
    }, 500);
  }

  /**
   * Animate Leo jumping to new position
   */
  animateLeoToPosition(position) {
    this.isAnimating = true;
    const targetX = this.canvas.width * 0.1 + position * this.tickSpacing;
    this.targetLeoPosition.x = targetX;

    // Play jump sound
    this.playSound(400 + position * 10, 150, 'sine');

    // Mobile haptic feedback
    if (this.hapticFeedback) {
      navigator.vibrate(30);
    }
  }

  /**
   * Undo the last jump
   */
  undoLastJump() {
    if (this.currentEquation.length === 0 || this.isAnimating) {
      return;
    }

    const lastJump = this.currentEquation.pop();
    this.currentPosition = lastJump.fromPosition;
    this.jumpsUsed = Math.max(0, this.jumpsUsed - 1);

    // Animate Leo back
    this.animateLeoToPosition(this.currentPosition);

    // Update undo button
    this.updateUndoButton();

    // Play undo sound
    this.playSound(300, 100, 'triangle');
  }

  /**
   * Update undo button state
   */
  updateUndoButton() {
    const undoButton = this.buttons.find(btn => btn.type === 'undo');
    if (undoButton) {
      undoButton.disabled = this.currentEquation.length === 0;
    }
  }

  /**
   * Check if player reached the target
   */
  checkWinCondition() {
    if (this.currentPosition === this.targetNumber) {
      // Success!
      const timeToSolve = performance.now() - this.problemStartTime;
      const basePoints = this.difficulty === 'easy' ? 50 : this.difficulty === 'medium' ? 75 : 100;
      const efficiencyBonus = Math.max(0, (10 - this.jumpsUsed) * 5);
      const totalPoints = basePoints + efficiencyBonus;

      this.addScore(totalPoints);

      // Track successful completion
      this.trackCorrectAnswer({
        targetNumber: this.targetNumber,
        jumpsUsed: this.jumpsUsed,
        timeToSolve,
        equation: this.getEquationString(),
        difficulty: this.difficulty,
      });

      // Play success sound
      this.playSound(800, 300, 'sine');

      // Haptic feedback for success
      if (this.hapticFeedback) {
        navigator.vibrate([100, 50, 100]);
      }

      // Show success animation and continue to next problem
      setTimeout(() => {
        this.generateNewProblem();
      }, 1500);
    } else if (this.jumpsUsed >= this.maxJumpsAllowed) {
      // Too many jumps - track as incorrect attempt
      this.trackIncorrectAnswer({
        targetNumber: this.targetNumber,
        finalPosition: this.currentPosition,
        jumpsUsed: this.jumpsUsed,
        equation: this.getEquationString(),
      });

      // Give another chance or move to next problem
      this.generateNewProblem();
    }
  }

  /**
   * Get equation as string
   */
  getEquationString() {
    if (this.currentEquation.length === 0) {
      return '0';
    }

    let equation = '0';
    this.currentEquation.forEach(jump => {
      equation += ` ${jump.operation} ${jump.value}`;
    });
    equation += ` = ${this.currentPosition}`;
    return equation;
  }

  /**
   * Track jump made for analytics
   */
  trackJumpMade(amount, direction, newPosition) {
    // This could be expanded for detailed learning analytics
    logger.debug(`Jump made: ${direction > 0 ? '+' : '-'}${amount} to position ${newPosition}`);
  }

  /**
   * Override BaseGame's update method
   */
  update(deltaTime, timestamp) {
    super.update(deltaTime, timestamp);

    // Update Leo animation
    if (this.isAnimating) {
      const dx = this.targetLeoPosition.x - this.leoPosition.x;
      const dy = this.targetLeoPosition.y - this.leoPosition.y;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        this.leoPosition.x += dx * this.leoAnimationSpeed;
        this.leoPosition.y += dy * this.leoAnimationSpeed;
      } else {
        this.leoPosition.x = this.targetLeoPosition.x;
        this.leoPosition.y = this.targetLeoPosition.y;
        this.isAnimating = false;
      }
    }
  }

  /**
   * Override BaseGame's render method
   */
  render() {
    super.render(); // Clear canvas

    if (this.state !== 'playing') {
      return;
    }

    this.renderBackground();
    this.renderNumberLine();
    this.renderLeoCharacter();
    this.renderTarget();
    this.renderEquation();
    this.renderButtons();
    this.renderGameInfo();
  }

  /**
   * Render game background
   */
  renderBackground() {
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render the number line
   */
  renderNumberLine() {
    const width = this.canvas.width;
    const startX = width * 0.1;
    const endX = startX + this.maxNumber * this.tickSpacing;

    // Draw main line
    this.ctx.strokeStyle = this.colors.numberLine;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, this.numberLineY);
    this.ctx.lineTo(endX, this.numberLineY);
    this.ctx.stroke();

    // Draw tick marks and numbers
    this.ctx.fillStyle = this.colors.numbers;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';

    for (let i = 0; i <= this.maxNumber; i += this.maxNumber <= 20 ? 1 : 5) {
      const x = startX + i * this.tickSpacing;

      // Draw tick mark
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.numberLineY - 10);
      this.ctx.lineTo(x, this.numberLineY + 10);
      this.ctx.stroke();

      // Draw number
      this.ctx.fillText(i.toString(), x, this.numberLineY + 25);
    }
  }

  /**
   * Render Leo character
   */
  renderLeoCharacter() {
    const centerX = this.leoPosition.x;
    const centerY = this.leoPosition.y + this.leoSize.height / 2;

    // Simple Leo representation (could be replaced with sprite)
    this.ctx.fillStyle = this.colors.leo;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.leoSize.width / 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 8, centerY - 5, 4, 0, Math.PI * 2);
    this.ctx.arc(centerX + 8, centerY - 5, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Pupils
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 8, centerY - 5, 2, 0, Math.PI * 2);
    this.ctx.arc(centerX + 8, centerY - 5, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Render target indicator
   */
  renderTarget() {
    const targetX = this.canvas.width * 0.1 + this.targetNumber * this.tickSpacing;
    const targetY = this.numberLineY - 30;

    // Draw star shape for target
    this.ctx.fillStyle = this.colors.target;
    this.ctx.strokeStyle = this.colors.numberLine;
    this.ctx.lineWidth = 2;

    // Simple star shape
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x = targetX + Math.cos(angle) * 12;
      const y = targetY + Math.sin(angle) * 12;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Target number label
    this.ctx.fillStyle = this.colors.numbers;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Target: ${this.targetNumber}`, targetX, targetY - 20);
  }

  /**
   * Render current equation
   */
  renderEquation() {
    const equation = this.getEquationString();

    this.ctx.fillStyle = this.colors.equation;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(equation, this.canvas.width / 2, 50);
  }

  /**
   * Render control buttons
   */
  renderButtons() {
    this.buttons.forEach(button => {
      // Button background
      this.ctx.fillStyle = button.disabled
        ? '#BDC3C7'
        : button.selected
          ? this.colors.buttonHover
          : this.colors.button;
      this.ctx.fillRect(button.x, button.y, button.width, button.height);

      // Button border
      this.ctx.strokeStyle = this.colors.numberLine;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(button.x, button.y, button.width, button.height);

      // Button text
      this.ctx.fillStyle = button.disabled ? '#7F8C8D' : this.colors.numberLine;
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        button.label,
        button.x + button.width / 2,
        button.y + button.height / 2 + 5
      );
    });
  }

  /**
   * Render game information
   */
  renderGameInfo() {
    this.ctx.fillStyle = this.colors.numbers;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';

    // Score and level
    this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    this.ctx.fillText(`Round: ${this.round}/${this.maxRounds}`, 20, 50);
    this.ctx.fillText(`Jumps: ${this.jumpsUsed}/${this.maxJumpsAllowed}`, 20, 70);
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    super.handleClick(event);

    const pos = this.getPointerPosition(event);

    // Check button clicks
    this.buttons.forEach(button => {
      if (this.isPointInRect(pos, button) && !button.disabled) {
        this.handleButtonClick(button);
      }
    });
  }

  /**
   * Handle button clicks
   */
  handleButtonClick(button) {
    switch (button.type) {
    case 'jump':
      // Select jump amount
      this.buttons.forEach(btn => {
        if (btn.type === 'jump') {
          btn.selected = btn === button;
        }
      });
      this.selectedJump = button.value;
      break;

    case 'direction':
      // Make jump in selected direction
      this.makeJump(this.selectedJump, button.value);
      break;

    case 'undo':
      // Undo last jump
      this.undoLastJump();
      break;
    }
  }

  /**
   * Check if point is within rectangle
   */
  isPointInRect(point, rect) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Override BaseGame's onGameEnd
   */
  onGameEnd() {
    super.onGameEnd();

    // Track final game statistics
    if (this.round > 0) {
      this.trackLevelComplete({
        roundsCompleted: this.round,
        maxRounds: this.maxRounds,
        totalJumps: this.jumpsUsed,
        difficulty: this.difficulty,
        finalScore: this.score,
      });
    }
  }
}

// Export the game class
export default NumberLineJumpGame;
