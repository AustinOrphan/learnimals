/**
 * Pizza Party Rush! - A fun pizza-making game for kids
 * Players fulfill customer orders by dragging the correct toppings
 */
import { animationDelay } from '../../utils/AnimationManager.js';
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
      handleDrag: e => this.handleDrag(e),
      endDrag: e => this.endDrag(e),
    };

    // Level progression
    this.ordersPerLevel = 3;
    this.ordersCompleted = 0;
    this.levelScore = 0;

    // Chef Mango hosts the pizzeria and relays each counting order
    this.chefName = 'Mango';

    // Customer types with different personalities
    this.customers = [
      { emoji: '👧', name: 'Sarah', greeting: 'Sarah would like' },
      { emoji: '👦', name: 'Tommy', greeting: 'Tommy wants' },
      { emoji: '👨', name: 'Mr. Jones', greeting: 'Mr. Jones ordered' },
      { emoji: '👩', name: 'Mrs. Smith', greeting: 'Mrs. Smith asked for' },
      { emoji: '🧑', name: 'Alex', greeting: 'Alex needs' },
      { emoji: '👴', name: 'Grandpa Joe', greeting: 'Grandpa Joe would love' },
      { emoji: '👵', name: 'Grandma Sue', greeting: 'Grandma Sue wants' },
      { emoji: '👶', name: 'Baby Max', greeting: 'Baby Max points at' },
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
      bacon: { emoji: '🥓', name: 'Bacon', color: '#85144B' },
    };

    // Counting pools per level. Each order asks for a specific COUNT of each
    // topping (this is a math game), so only draggable grid toppings are used.
    this.orderPools = {
      1: ['pepperoni', 'mushrooms'],
      2: ['pepperoni', 'mushrooms', 'peppers', 'olives'],
      3: ['cheese', 'pepperoni', 'mushrooms', 'peppers', 'tomatoes', 'olives'],
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
      modal.addEventListener('click', e => {
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
      topping.addEventListener('mousedown', e => this.startDrag(e, topping));

      // Touch events
      topping.addEventListener('touchstart', e => this.startDrag(e, topping), { passive: false });

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

    // Generate a count-based order based on level
    this.currentOrder = {
      customer: customer,
      counts: this.generateOrderCounts(),
      timeLimit: Math.max(45 - (this.currentLevel - 1) * 3, 25), // Decreasing time as levels progress
    };

    // Display order
    this.displayOrder();

    // Start timer
    this.startOrderTimer();

    // Animate customer entrance
    this.animateCustomerEntrance();
  }

  // Build a count-based order, e.g. { pepperoni: 3, mushrooms: 2 }
  generateOrderCounts() {
    const level = Math.min(this.currentLevel, 3);
    const pool = this.orderPools[level];
    const numTypes = level === 1 ? 1 : level === 2 ? 2 : 2 + Math.floor(Math.random() * 2);
    const maxCount = level === 1 ? 3 : level + 2; // L1: 1-3, L2: 1-4, L3: 1-5

    const shuffled = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(numTypes, pool.length));
    const counts = {};
    shuffled.forEach(topping => {
      counts[topping] = 1 + Math.floor(Math.random() * maxCount);
    });
    return counts;
  }

  // Count how many of each topping are currently on the pizza
  getPlacedCounts() {
    return this.currentToppings.reduce((acc, topping) => {
      acc[topping] = (acc[topping] || 0) + 1;
      return acc;
    }, {});
  }

  displayOrder() {
    const entries = Object.entries(this.currentOrder.counts);

    // Readable, count-first sentence: "3 pepperoni and 2 mushrooms"
    const sentence = entries
      .map(([topping, count]) => {
        const data = this.toppings[topping];
        return `<strong>${count}</strong> ${data.emoji} ${data.name}`;
      })
      .join(' and ');

    // Live tally so kids can count each topping as they add it
    const tallies = entries
      .map(([topping, count]) => {
        const data = this.toppings[topping];
        return `
          <div class="order-tally" data-topping="${topping}">
            <span class="order-tally-emoji">${data.emoji}</span>
            <span class="order-tally-name">${data.name}</span>
            <span class="order-tally-count"><span class="placed">0</span> / <span class="needed">${count}</span></span>
          </div>`;
      })
      .join('');

    this.orderRequest.innerHTML = `
      <p class="order-line">${this.currentOrder.customer.greeting} ${sentence}!</p>
      <div class="order-tallies">${tallies}</div>
    `;

    // Reset star rating
    this.starRating.querySelectorAll('.star').forEach(star => {
      star.classList.remove('filled');
      star.classList.add('empty');
    });

    this.updateOrderProgress();
  }

  // Refresh the "placed / needed" tally after each drop or clear
  updateOrderProgress() {
    if (!this.currentOrder || !this.orderRequest) return;

    const placed = this.getPlacedCounts();
    this.orderRequest.querySelectorAll('.order-tally').forEach(row => {
      const topping = row.dataset.topping;
      const needed = this.currentOrder.counts[topping] || 0;
      const have = placed[topping] || 0;

      const placedEl = row.querySelector('.placed');
      if (placedEl) placedEl.textContent = have;

      row.classList.toggle('matched', have === needed);
      row.classList.toggle('over', have > needed);
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
    const isOverPizza =
      clientX >= pizzaRect.left &&
      clientX <= pizzaRect.right &&
      clientY >= pizzaRect.top &&
      clientY <= pizzaRect.bottom;

    this.pizzaBase.classList.toggle('drop-target', isOverPizza);
  }

  endDrag(e) {
    if (!this.isDragging) return;

    this.isDragging = false;

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    const pizzaRect = this.pizzaBase.getBoundingClientRect();
    const droppedOnPizza =
      clientX >= pizzaRect.left &&
      clientX <= pizzaRect.right &&
      clientY >= pizzaRect.top &&
      clientY <= pizzaRect.bottom;

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
    const accuracyBonus = orderCorrect.perfectMatch ? 500 : orderCorrect.score * 100;
    const totalScore = timeBonus + accuracyBonus;

    // Calculate stars (1-3)
    let stars = 0;
    if (orderCorrect.perfectMatch && this.timeRemaining > this.currentOrder.timeLimit * 0.7) {
      stars = 3;
    } else if (
      orderCorrect.score >= 0.8 &&
      this.timeRemaining > this.currentOrder.timeLimit * 0.5
    ) {
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
    const needed = this.currentOrder.counts;
    const placed = this.getPlacedCounts();

    const neededTypes = Object.keys(needed);
    const extraTypes = Object.keys(placed).filter(topping => !needed[topping]);

    // A topping type counts as correct only when the COUNT matches exactly
    let correctTypes = 0;
    neededTypes.forEach(topping => {
      if ((placed[topping] || 0) === needed[topping]) correctTypes++;
    });

    const perfectMatch = correctTypes === neededTypes.length && extraTypes.length === 0;
    const denominator = neededTypes.length + extraTypes.length;
    const score = denominator ? correctTypes / denominator : 0;

    return {
      perfectMatch,
      score,
      correctTypes,
      extraTypes: extraTypes.length,
      neededTypes: neededTypes.length,
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

    // Keep the count tally in sync with the pizza
    this.updateOrderProgress();
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
          oscillator.frequency.exponentialRampToValueAtTime(
            100,
            this.audioContext.currentTime + 0.5
          );
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
      oscillator.stop(
        this.audioContext.currentTime +
          (type === 'levelComplete' ? 0.6 : type === 'gameOver' ? 0.5 : 0.3)
      );
    } catch (error) {
      console.log('Audio not available:', error);
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
        console.log('Error closing audio context:', error);
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

    console.log('PizzaMakerGame destroyed and cleaned up');
  }
}
