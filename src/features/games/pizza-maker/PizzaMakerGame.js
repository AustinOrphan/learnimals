/**
 * Pizza Party Rush! - A fun pizza-making game for kids
 * Players fulfill customer orders by dragging the correct toppings
 */
import { animationDelay, animationSequence } from '../../../utils/AnimationManager.js';
import logger from '../../../utils/logger.js';
export default class PizzaMakerGame {
  constructor() {
    // Game state
    this.gameState = 'start'; // start, playing, levelComplete, gameOver
    this.currentLevel = 1;
    this.totalStars = 0;
    this.totalTips = 0;
    this.currentOrder = null;
    this.currentToppings = [];
    this.orderTimer = null;
    this.timeRemaining = 30;
    
    // Store bound event handlers for cleanup
    this.boundHandlers = {
      startGame: () => this.startGame(),
      nextLevel: () => this.nextLevel(),
      restartGame: () => this.restartGame(),
      servePizza: () => this.servePizza(),
      clearPizza: () => this.clearPizza(),
      handleDrag: (e) => this.handleDrag(e),
      endDrag: (e) => this.endDrag(e)
    };
    
    // Level progression
    this.ordersPerLevel = 3;
    this.ordersCompleted = 0;
    this.levelScore = 0;
    
    // Customer types with different personalities
    this.customers = [
      { emoji: '👧', name: 'Sarah', greeting: 'Hi! Can I have' },
      { emoji: '👦', name: 'Tommy', greeting: 'Hey! I want' },
      { emoji: '👨', name: 'Mr. Jones', greeting: 'Good day! I\'d like' },
      { emoji: '👩', name: 'Mrs. Smith', greeting: 'Hello! Please make me' },
      { emoji: '🧑', name: 'Alex', greeting: 'Yo! Give me' },
      { emoji: '👴', name: 'Grandpa Joe', greeting: 'Hello there! May I have' },
      { emoji: '👵', name: 'Grandma Sue', greeting: 'Hi sweetie! I\'d love' },
      { emoji: '👶', name: 'Baby Max', greeting: 'Goo goo! Want' }
    ];
    
    // Available toppings
    this.toppings = {
      cheese: { emoji: '🧀', name: 'Cheese', color: '#FFD93D' },
      pepperoni: { emoji: '🍕', name: 'Pepperoni', color: '#C1272D' },
      mushrooms: { emoji: '🍄', name: 'Mushrooms', color: '#8B4513' },
      peppers: { emoji: '🫑', name: 'Peppers', color: '#2ECC40' },
      tomatoes: { emoji: '🍅', name: 'Tomatoes', color: '#FF4136' },
      olives: { emoji: '🫒', name: 'Olives', color: '#3D9970' },
      pineapple: { emoji: '🍍', name: 'Pineapple', color: '#FFDC00' },
      bacon: { emoji: '🥓', name: 'Bacon', color: '#85144B' }
    };
    
    // Pizza templates for different difficulty levels
    this.pizzaTemplates = {
      1: [ // Level 1 - Simple pizzas (1-2 toppings)
        ['cheese'],
        ['pepperoni'],
        ['cheese', 'pepperoni'],
        ['cheese', 'mushrooms']
      ],
      2: [ // Level 2 - Medium pizzas (2-3 toppings)
        ['cheese', 'pepperoni', 'mushrooms'],
        ['cheese', 'peppers', 'olives'],
        ['cheese', 'tomatoes', 'bacon'],
        ['cheese', 'pineapple']
      ],
      3: [ // Level 3+ - Complex pizzas (3-4 toppings)
        ['cheese', 'pepperoni', 'mushrooms', 'peppers'],
        ['cheese', 'bacon', 'pineapple', 'olives'],
        ['cheese', 'tomatoes', 'peppers', 'mushrooms'],
        ['cheese', 'pepperoni', 'bacon', 'olives']
      ]
    };
    
    // Drag and drop state
    this.isDragging = false;
    this.dragElement = null;
    this.dragClone = null;
    this.touchOffset = { x: 0, y: 0 };
    
    // Get DOM elements
    this.initializeDOMElements();
    
    // Initialize game
    this.init();
  }

  initializeDOMElements() {
    // Game elements
    this.pizzaBase = document.getElementById('pizzaBase');
    this.pizzaToppings = document.getElementById('pizzaToppings');
    this.toppingsGrid = document.getElementById('toppingsGrid');
    this.bakeButton = document.getElementById('bakeButton');
    this.trashButton = document.getElementById('trashButton');
    
    // UI elements
    this.totalStarsElement = document.getElementById('totalStars');
    this.currentLevelElement = document.getElementById('currentLevel');
    this.totalTipsElement = document.getElementById('totalTips');
    this.orderTimerElement = document.getElementById('orderTimer');
    
    // Customer elements
    this.customerCharacter = document.getElementById('customerCharacter');
    this.speechBubble = document.getElementById('speechBubble');
    this.orderRequest = document.getElementById('orderRequest');
    this.progressBar = document.getElementById('progressBar');
    this.starRating = document.getElementById('starRating');
    
    // Modal elements
    this.startScreen = document.getElementById('startScreen');
    this.levelCompleteModal = document.getElementById('levelCompleteModal');
    this.gameOverModal = document.getElementById('gameOverModal');
    
    // Buttons
    this.startGameButton = document.getElementById('startGameButton');
    this.nextLevelButton = document.getElementById('nextLevelButton');
    this.restartButton = document.getElementById('restartButton');
  }

  init() {
    this.setupEventListeners();
    this.setupTouchDragAndDrop();
    this.updateUI();
  }

  setupEventListeners() {
    // Game control buttons
    this.startGameButton.addEventListener('click', this.boundHandlers.startGame);
    this.nextLevelButton.addEventListener('click', this.boundHandlers.nextLevel);
    this.restartButton.addEventListener('click', this.boundHandlers.restartGame);
    
    // Pizza making buttons
    this.bakeButton.addEventListener('click', this.boundHandlers.servePizza);
    this.trashButton.addEventListener('click', this.boundHandlers.clearPizza);
    
    // Close modals on backdrop click
    document.querySelectorAll('.game-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal && modal.id !== 'startScreen') {
          e.target.classList.remove('show');
        }
      });
    });
  }

  setupTouchDragAndDrop() {
    const toppings = this.toppingsGrid.querySelectorAll('.topping-item');
    
    toppings.forEach(topping => {
      // Mouse events
      topping.addEventListener('mousedown', (e) => this.startDrag(e, topping));
      
      // Touch events
      topping.addEventListener('touchstart', (e) => this.startDrag(e, topping), { passive: false });
      
      // Accessibility
      topping.setAttribute('tabindex', '0');
      topping.setAttribute('role', 'button');
      topping.setAttribute('aria-label', `Drag ${topping.dataset.topping} to pizza`);
    });

    // Global drag events
    document.addEventListener('mousemove', this.boundHandlers.handleDrag);
    document.addEventListener('mouseup', this.boundHandlers.endDrag);
    document.addEventListener('touchmove', this.boundHandlers.handleDrag, { passive: false });
    document.addEventListener('touchend', this.boundHandlers.endDrag);
  }

  startGame() {
    this.gameState = 'playing';
    this.currentLevel = 1;
    this.totalStars = 0;
    this.totalTips = 0;
    this.ordersCompleted = 0;
    this.levelScore = 0;
    
    this.startScreen.classList.remove('show');
    this.startNewOrder();
    this.updateUI();
  }

  startNewOrder() {
    // Clear previous pizza
    this.clearPizza();
    
    // Select random customer
    const customer = this.customers[Math.floor(Math.random() * this.customers.length)];
    this.customerCharacter.querySelector('.customer-emoji').textContent = customer.emoji;
    
    // Generate order based on level
    const templates = this.pizzaTemplates[Math.min(this.currentLevel, 3)];
    const orderTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    this.currentOrder = {
      customer: customer,
      toppings: orderTemplate,
      timeLimit: Math.max(30 - (this.currentLevel - 1) * 2, 15) // Decreasing time as levels progress
    };
    
    // Display order
    this.displayOrder();
    
    // Start timer
    this.startOrderTimer();
    
    // Animate customer entrance
    this.animateCustomerEntrance();
  }

  displayOrder() {
    const orderHTML = this.currentOrder.toppings.map(topping => {
      const toppingData = this.toppings[topping];
      return `<span class="order-topping">${toppingData.emoji} ${toppingData.name}</span>`;
    }).join('');
    
    this.orderRequest.innerHTML = `
      <p>${this.currentOrder.customer.greeting} a pizza with:</p>
      <div class="order-toppings">${orderHTML}</div>
    `;
    
    // Reset star rating
    this.starRating.querySelectorAll('.star').forEach(star => {
      star.classList.remove('filled');
      star.classList.add('empty');
    });
  }

  startOrderTimer() {
    this.timeRemaining = this.currentOrder.timeLimit;
    this.updateTimerDisplay();
    
    if (this.orderTimer) clearInterval(this.orderTimer);
    
    this.orderTimer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      
      // Update progress bar
      const progress = (this.timeRemaining / this.currentOrder.timeLimit) * 100;
      this.progressBar.style.width = `${progress}%`;
      
      // Change color based on time remaining
      if (this.timeRemaining <= 5) {
        this.progressBar.style.backgroundColor = '#e74c3c';
        this.orderTimerElement.classList.add('critical');
      } else if (this.timeRemaining <= 10) {
        this.progressBar.style.backgroundColor = '#f39c12';
      }
      
      // Time's up!
      if (this.timeRemaining <= 0) {
        this.orderFailed();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.orderTimerElement.textContent = this.timeRemaining;
  }

  // Drag and drop methods
  startDrag(e, toppingElement) {
    if (this.gameState !== 'playing') return;
    
    e.preventDefault();
    
    if (this.isDragging) return;
    
    this.isDragging = true;
    this.dragElement = toppingElement;
    
    toppingElement.classList.add('dragging');
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = toppingElement.getBoundingClientRect();
    this.touchOffset.x = clientX - rect.left - rect.width / 2;
    this.touchOffset.y = clientY - rect.top - rect.height / 2;
    
    this.createDragClone(toppingElement, clientX, clientY);
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    this.playSound('pickup');
  }

  createDragClone(originalElement, x, y) {
    this.dragClone = originalElement.cloneNode(true);
    this.dragClone.classList.add('drag-clone');
    this.dragClone.style.position = 'fixed';
    this.dragClone.style.pointerEvents = 'none';
    this.dragClone.style.zIndex = '1000';
    this.dragClone.style.transform = 'scale(1.2) rotate(5deg)';
    this.dragClone.style.transition = 'none';
    
    this.updateClonePosition(x, y);
    document.body.appendChild(this.dragClone);
  }

  updateClonePosition(x, y) {
    if (this.dragClone) {
      this.dragClone.style.left = `${x - this.touchOffset.x - 50}px`;
      this.dragClone.style.top = `${y - this.touchOffset.y - 50}px`;
    }
  }

  handleDrag(e) {
    if (!this.isDragging || !this.dragClone) return;
    
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    this.updateClonePosition(clientX, clientY);
    
    const pizzaRect = this.pizzaBase.getBoundingClientRect();
    const isOverPizza = (
      clientX >= pizzaRect.left &&
      clientX <= pizzaRect.right &&
      clientY >= pizzaRect.top &&
      clientY <= pizzaRect.bottom
    );
    
    this.pizzaBase.classList.toggle('drop-target', isOverPizza);
  }

  endDrag(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    
    const pizzaRect = this.pizzaBase.getBoundingClientRect();
    const droppedOnPizza = (
      clientX >= pizzaRect.left &&
      clientX <= pizzaRect.right &&
      clientY >= pizzaRect.top &&
      clientY <= pizzaRect.bottom
    );
    
    if (droppedOnPizza && this.dragElement) {
      this.addToppingToPizza(this.dragElement.dataset.topping, clientX, clientY);
    }
    
    this.cleanupDrag();
  }

  addToppingToPizza(toppingType, dropX, dropY) {
    const pizzaRect = this.pizzaBase.getBoundingClientRect();
    const relativeX = ((dropX - pizzaRect.left) / pizzaRect.width) * 100;
    const relativeY = ((dropY - pizzaRect.top) / pizzaRect.height) * 100;
    
    const toppingElement = document.createElement('div');
    toppingElement.className = `pizza-topping ${toppingType}-topping`;
    toppingElement.dataset.topping = toppingType;
    
    // Random rotation for natural look
    const rotation = Math.random() * 30 - 15;
    toppingElement.style.left = `${Math.max(10, Math.min(85, relativeX))}%`;
    toppingElement.style.top = `${Math.max(10, Math.min(85, relativeY))}%`;
    toppingElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(0)`;
    
    const toppingData = this.toppings[toppingType];
    toppingElement.textContent = toppingData.emoji;
    toppingElement.setAttribute('aria-label', `${toppingType} topping`);
    
    this.pizzaToppings.appendChild(toppingElement);
    
    // Animate in
    requestAnimationFrame(() => {
      toppingElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
      toppingElement.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    });
    
    this.currentToppings.push(toppingType);
    this.updateUI();
    
    this.playSound('drop');
    
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }

  cleanupDrag() {
    if (this.dragElement) {
      this.dragElement.classList.remove('dragging');
      this.dragElement = null;
    }
    
    if (this.dragClone) {
      this.dragClone.remove();
      this.dragClone = null;
    }
    
    this.pizzaBase.classList.remove('drop-target');
  }

  clearPizza() {
    this.pizzaToppings.innerHTML = '';
    this.currentToppings = [];
    this.updateUI();
    this.playSound('trash');
  }

  servePizza() {
    if (this.currentToppings.length === 0 || this.gameState !== 'playing') return;
    
    // Stop timer
    clearInterval(this.orderTimer);
    
    // Check if pizza matches order
    const orderCorrect = this.checkOrder();
    
    // Calculate score
    const timeBonus = Math.floor(this.timeRemaining * 10);
    const accuracyBonus = orderCorrect.perfectMatch ? 500 : (orderCorrect.score * 100);
    const totalScore = timeBonus + accuracyBonus;
    
    // Calculate stars (1-3)
    let stars = 0;
    if (orderCorrect.perfectMatch && this.timeRemaining > this.currentOrder.timeLimit * 0.7) {
      stars = 3;
    } else if (orderCorrect.score >= 0.8 && this.timeRemaining > this.currentOrder.timeLimit * 0.5) {
      stars = 2;
    } else if (orderCorrect.score >= 0.6) {
      stars = 1;
    }
    
    // Calculate tip
    const tip = Math.floor(stars * 5 * (this.currentLevel * 0.5));
    
    // Update game state
    this.levelScore += totalScore;
    this.totalStars += stars;
    this.totalTips += tip;
    this.ordersCompleted++;
    
    // Show feedback
    this.showOrderFeedback(orderCorrect, stars, tip);
    
    // Check if level complete using frame-based timing
    animationDelay(() => {
      if (this.ordersCompleted >= this.ordersPerLevel) {
        this.levelComplete();
      } else {
        this.startNewOrder();
      }
    }, 2000);
  }

  checkOrder() {
    const orderSet = new Set(this.currentOrder.toppings);
    const pizzaSet = new Set(this.currentToppings);
    
    let correctToppings = 0;
    let extraToppings = 0;
    let missingToppings = 0;
    
    // Check what's on the pizza
    this.currentToppings.forEach(topping => {
      if (orderSet.has(topping)) {
        correctToppings++;
      } else {
        extraToppings++;
      }
    });
    
    // Check what's missing
    this.currentOrder.toppings.forEach(topping => {
      if (!pizzaSet.has(topping)) {
        missingToppings++;
      }
    });
    
    const perfectMatch = correctToppings === this.currentOrder.toppings.length && extraToppings === 0;
    const score = correctToppings / (this.currentOrder.toppings.length + extraToppings);
    
    return {
      perfectMatch,
      score,
      correctToppings,
      extraToppings,
      missingToppings
    };
  }

  showOrderFeedback(orderResult, stars, _tip) {
    // Animate stars using frame-based timing
    const starElements = this.starRating.querySelectorAll('.star');
    for (let i = 0; i < stars; i++) {
      animationDelay(() => {
        starElements[i].classList.remove('empty');
        starElements[i].classList.add('filled');
        this.playSound('star');
      }, i * 300);
    }
    
    // Show feedback message
    let message = '';
    if (orderResult.perfectMatch) {
      message = 'Perfect! 🎉';
    } else if (orderResult.score >= 0.8) {
      message = 'Great job! 👍';
    } else if (orderResult.score >= 0.6) {
      message = 'Good try! 😊';
    } else {
      message = 'Not quite right... 😅';
    }
    
    // Animate customer reaction
    this.animateCustomerReaction(message, stars > 0);
    
    // Play appropriate sound
    if (stars >= 2) {
      this.playSound('success');
    } else if (stars === 1) {
      this.playSound('ok');
    } else {
      this.playSound('fail');
    }
    
    this.updateUI();
  }

  levelComplete() {
    this.gameState = 'levelComplete';
    clearInterval(this.orderTimer);
    
    // Show level complete modal
    document.getElementById('levelScore').textContent = this.levelScore;
    document.getElementById('levelTips').textContent = this.totalTips;
    
    // Display stars earned
    const starsContainer = document.getElementById('levelStars');
    starsContainer.innerHTML = '';
    for (let i = 0; i < this.ordersPerLevel; i++) {
      const star = document.createElement('span');
      star.className = 'level-star';
      star.textContent = '⭐';
      starsContainer.appendChild(star);
    }
    
    this.levelCompleteModal.classList.add('show');
    this.playSound('levelComplete');
  }

  nextLevel() {
    this.currentLevel++;
    this.ordersCompleted = 0;
    this.levelScore = 0;
    this.gameState = 'playing';
    
    this.levelCompleteModal.classList.remove('show');
    this.startNewOrder();
    this.updateUI();
  }

  orderFailed() {
    this.gameState = 'gameOver';
    clearInterval(this.orderTimer);
    
    document.getElementById('finalScore').textContent = this.totalStars;
    document.getElementById('finalLevel').textContent = this.currentLevel;
    
    this.gameOverModal.classList.add('show');
    this.playSound('gameOver');
  }

  restartGame() {
    this.gameOverModal.classList.remove('show');
    this.startGame();
  }

  updateUI() {
    this.totalStarsElement.textContent = this.totalStars;
    this.currentLevelElement.textContent = this.currentLevel;
    this.totalTipsElement.textContent = this.totalTips;
    
    // Update bake button
    this.bakeButton.disabled = this.currentToppings.length === 0 || this.gameState !== 'playing';
    
    if (this.currentToppings.length > 0) {
      this.bakeButton.innerHTML = `<span class="bake-icon">🔥</span> Bake & Serve! (${this.currentToppings.length})`;
    } else {
      this.bakeButton.innerHTML = '<span class="bake-icon">🔥</span> Add toppings first!';
    }
  }

  animateCustomerEntrance() {
    this.customerCharacter.style.transform = 'translateX(-200%)';
    this.customerCharacter.style.opacity = '0';
    
    requestAnimationFrame(() => {
      this.customerCharacter.style.transition = 'all 0.5s ease-out';
      this.customerCharacter.style.transform = 'translateX(0)';
      this.customerCharacter.style.opacity = '1';
    });
    
    this.speechBubble.style.transform = 'scale(0)';
    animationDelay(() => {
      this.speechBubble.style.transition = 'transform 0.3s ease-out';
      this.speechBubble.style.transform = 'scale(1)';
    }, 300);
  }

  animateCustomerReaction(message, happy) {
    const emoji = happy ? '😊' : '😔';
    const originalEmoji = this.customerCharacter.querySelector('.customer-emoji').textContent;
    
    this.customerCharacter.querySelector('.customer-emoji').textContent = emoji;
    
    // Add reaction text
    const reaction = document.createElement('div');
    reaction.className = 'customer-reaction';
    reaction.textContent = message;
    this.customerCharacter.appendChild(reaction);
    
    animationDelay(() => {
      reaction.remove();
      this.customerCharacter.querySelector('.customer-emoji').textContent = originalEmoji;
    }, 1500);
  }

  playSound(type) {
    try {
      // Reuse audio context if available for better performance
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      
      switch (type) {
      case 'pickup':
        oscillator.frequency.value = 600;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        break;
      case 'drop':
        oscillator.frequency.value = 800;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        break;
      case 'success':
        // Happy arpeggio
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        break;
      case 'star':
        oscillator.frequency.value = 1047; // High C
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        break;
      case 'levelComplete':
        // Victory fanfare
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
        break;
      case 'gameOver':
        // Sad sound
        oscillator.frequency.value = 200;
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        break;
      case 'trash':
        oscillator.frequency.value = 150;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        break;
      default:
        oscillator.frequency.value = 440;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      }
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + (type === 'levelComplete' ? 0.6 : type === 'gameOver' ? 0.5 : 0.3));
    } catch (error) {
      logger.warn('Audio not available:', error);
    }
  }

  /**
   * Clean up all resources and prevent memory leaks
   */
  destroy() {
    // Stop and clear timer
    if (this.orderTimer) {
      clearInterval(this.orderTimer);
      this.orderTimer = null;
    }

    // Clean up drag state
    this.cleanupDrag();

    // Remove all event listeners using bound handlers
    if (this.startGameButton && this.boundHandlers) {
      this.startGameButton.removeEventListener('click', this.boundHandlers.startGame);
    }
    if (this.nextLevelButton && this.boundHandlers) {
      this.nextLevelButton.removeEventListener('click', this.boundHandlers.nextLevel);
    }
    if (this.restartButton && this.boundHandlers) {
      this.restartButton.removeEventListener('click', this.boundHandlers.restartGame);
    }
    if (this.bakeButton && this.boundHandlers) {
      this.bakeButton.removeEventListener('click', this.boundHandlers.servePizza);
    }
    if (this.trashButton && this.boundHandlers) {
      this.trashButton.removeEventListener('click', this.boundHandlers.clearPizza);
    }

    // Remove modal event listeners
    document.querySelectorAll('.game-modal').forEach(modal => {
      // Create new modal to remove all event listeners
      const newModal = modal.cloneNode(true);
      if (modal.parentNode) {
        modal.parentNode.replaceChild(newModal, modal);
      }
    });

    // Remove drag and drop event listeners
    if (this.boundHandlers) {
      document.removeEventListener('mousemove', this.boundHandlers.handleDrag);
      document.removeEventListener('mouseup', this.boundHandlers.endDrag);
      document.removeEventListener('touchmove', this.boundHandlers.handleDrag);
      document.removeEventListener('touchend', this.boundHandlers.endDrag);
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (error) {
        logger.warn('Error closing audio context:', error);
      }
    }

    // Clear all references to prevent memory leaks
    this.currentOrder = null;
    this.currentToppings = [];
    this.dragElement = null;
    this.dragClone = null;
    this.audioContext = null;
    this.boundHandlers = null;
    
    // Clear DOM element references
    this.pizzaBase = null;
    this.pizzaToppings = null;
    this.toppingsGrid = null;
    this.bakeButton = null;
    this.trashButton = null;
    this.totalStarsElement = null;
    this.currentLevelElement = null;
    this.totalTipsElement = null;
    this.orderTimerElement = null;
    this.customerCharacter = null;
    this.speechBubble = null;
    this.orderRequest = null;
    this.progressBar = null;
    this.starRating = null;
    this.startScreen = null;
    this.levelCompleteModal = null;
    this.gameOverModal = null;
    this.startGameButton = null;
    this.nextLevelButton = null;
    this.restartButton = null;

    logger.info('PizzaMakerGame destroyed and cleaned up');
  }
}