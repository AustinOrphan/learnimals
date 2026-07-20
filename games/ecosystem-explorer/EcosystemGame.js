import { debounce } from '../../utils/common.js';

/**
 * EcosystemGame - Sky's Ecosystem Explorer
 * A dynamic ecosystem-building game where players create balanced ecosystems
 */
export default class EcosystemGame {
  constructor(canvasId, _options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Game configuration
    this.config = {
      canvas: {
        width: 800,
        height: 600,
      },
      ecosystem: {
        gridSize: 40,
        maxSpecies: 20,
        balanceThreshold: 0.8,
      },
      animation: {
        frameRate: 60,
        particleLifetime: 2000,
      },
    };

    // Game state
    this.gameState = {
      level: 1,
      score: 0,
      ecosystemHealth: 1.0,
      placedSpecies: new Map(),
      selectedSpecies: null,
      draggedSpecies: null,
      particles: [],
    };

    // Available species for current level
    this.availableSpecies = [
      { id: 'grass', name: 'Grass', type: 'producer', energy: 1, color: '#4CAF50' },
      {
        id: 'rabbit',
        name: 'Rabbit',
        type: 'herbivore',
        energy: 2,
        color: '#8BC34A',
        eats: ['grass'],
      },
      { id: 'fox', name: 'Fox', type: 'carnivore', energy: 3, color: '#FF9800', eats: ['rabbit'] },
    ];

    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);

    // Initialize
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.startGameLoop();

    // Show welcome message
    this.showMessage(
      "Welcome to Sky's Ecosystem Explorer! Drag species to build your ecosystem.",
      3000
    );
  }

  setupCanvas() {
    this.resizeCanvas();
    this.ctx.imageSmoothingEnabled = true;
  }

  setupEventListeners() {
    // Canvas events
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Window resize
    window.addEventListener('resize', debounce(this.resizeCanvas, 250));
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();

    this.canvas.width = Math.min(this.config.canvas.width, rect.width - 40);
    this.canvas.height = Math.min(this.config.canvas.height, rect.height - 40);

    this.gridWidth = Math.floor(this.canvas.width / this.config.ecosystem.gridSize);
    this.gridHeight = Math.floor(this.canvas.height / this.config.ecosystem.gridSize);
  }

  startGameLoop() {
    this.lastFrameTime = performance.now();
    this.animate();
  }

  animate(currentTime) {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update game logic
    this.update(deltaTime);

    // Render
    this.render();

    // Continue loop
    requestAnimationFrame(this.animate);
  }

  update(deltaTime) {
    // Update ecosystem balance
    this.updateEcosystemBalance();

    // Update particles
    this.updateParticles(deltaTime);

    // Check win conditions
    this.checkWinConditions();
  }

  updateEcosystemBalance() {
    const speciesCount = { producer: 0, herbivore: 0, carnivore: 0 };

    this.gameState.placedSpecies.forEach(species => {
      speciesCount[species.type]++;
    });

    // Calculate balance (simple ratio-based system)
    const total = speciesCount.producer + speciesCount.herbivore + speciesCount.carnivore;
    if (total === 0) {
      this.gameState.ecosystemHealth = 1.0;
      return;
    }

    // Ideal ratios: many producers, some herbivores, few carnivores
    const idealRatio = {
      producer: 0.6,
      herbivore: 0.3,
      carnivore: 0.1,
    };

    let balance = 0;
    Object.keys(idealRatio).forEach(type => {
      const actualRatio = speciesCount[type] / total;
      const difference = Math.abs(actualRatio - idealRatio[type]);
      balance += 1 - difference;
    });

    this.gameState.ecosystemHealth = Math.max(0, Math.min(1, balance / 3));
  }

  updateParticles(deltaTime) {
    this.gameState.particles = this.gameState.particles.filter(particle => {
      particle.age += deltaTime;
      particle.y -= particle.speed * (deltaTime / 16);
      particle.alpha = Math.max(0, 1 - particle.age / particle.lifetime);
      return particle.age < particle.lifetime;
    });
  }

  checkWinConditions() {
    if (
      this.gameState.ecosystemHealth > this.config.ecosystem.balanceThreshold &&
      this.gameState.placedSpecies.size >= 5
    ) {
      this.levelComplete();
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = this.getBackgroundColor();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw placed species
    this.drawPlacedSpecies();

    // Draw available species palette
    this.drawSpeciesPalette();

    // Draw particles
    this.drawParticles();

    // Draw UI
    this.drawUI();

    // Draw dragged species
    if (this.gameState.draggedSpecies) {
      this.drawDraggedSpecies();
    }
  }

  getBackgroundColor() {
    // Background changes based on ecosystem health
    const health = this.gameState.ecosystemHealth;
    const red = Math.floor(255 * (1 - health));
    const green = Math.floor(255 * health);
    return `rgb(${red + 200}, ${green + 230}, 200)`;
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.gridWidth; x++) {
      const xPos = x * this.config.ecosystem.gridSize;
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, 0);
      this.ctx.lineTo(xPos, this.canvas.height - 100); // Leave space for palette
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.gridHeight - 3; y++) {
      const yPos = y * this.config.ecosystem.gridSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, yPos);
      this.ctx.lineTo(this.canvas.width, yPos);
      this.ctx.stroke();
    }
  }

  drawPlacedSpecies() {
    this.gameState.placedSpecies.forEach((species, position) => {
      const [x, y] = position.split(',').map(Number);
      this.drawSpecies(
        species,
        x * this.config.ecosystem.gridSize,
        y * this.config.ecosystem.gridSize
      );
    });
  }

  drawSpecies(species, x, y, alpha = 1) {
    const size = this.config.ecosystem.gridSize - 4;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = species.color;
    this.ctx.fillRect(x + 2, y + 2, size, size);

    // Draw species name
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(species.name, x + size / 2, y + size / 2 + 4);

    this.ctx.restore();
  }

  drawSpeciesPalette() {
    const paletteY = this.canvas.height - 80;
    const speciesWidth = 100;

    // Palette background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, paletteY, this.canvas.width, 80);

    // Draw available species
    this.availableSpecies.forEach((species, index) => {
      const x = 20 + index * speciesWidth;
      const y = paletteY + 10;

      // Highlight selected species
      if (this.gameState.selectedSpecies === species.id) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x - 5, y - 5, 70, 60);
      }

      // Draw species icon
      this.ctx.fillStyle = species.color;
      this.ctx.fillRect(x, y, 60, 40);

      // Draw species name
      this.ctx.fillStyle = 'white';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(species.name, x, y + 55);
    });
  }

  drawParticles() {
    this.gameState.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
      this.ctx.restore();
    });
  }

  drawUI() {
    // Score
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 10, 30);

    // Level
    this.ctx.fillText(`Level: ${this.gameState.level}`, 10, 55);

    // Ecosystem health bar
    const barWidth = 200;
    const barHeight = 20;
    const barX = this.canvas.width - barWidth - 20;
    const barY = 20;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthColor =
      this.gameState.ecosystemHealth > 0.8
        ? '#4CAF50'
        : this.gameState.ecosystemHealth > 0.5
          ? '#FFC107'
          : '#F44336';
    this.ctx.fillStyle = healthColor;
    this.ctx.fillRect(barX, barY, barWidth * this.gameState.ecosystemHealth, barHeight);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Ecosystem Health', barX + barWidth / 2, barY + 14);
  }

  drawDraggedSpecies() {
    if (this.gameState.draggedSpecies && this.mousePos) {
      this.drawSpecies(
        this.gameState.draggedSpecies,
        this.mousePos.x - this.config.ecosystem.gridSize / 2,
        this.mousePos.y - this.config.ecosystem.gridSize / 2,
        0.7
      );
    }
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on species palette
    if (y > this.canvas.height - 80) {
      this.handlePaletteClick(x, y);
      return;
    }

    // Place species on grid
    if (this.gameState.selectedSpecies) {
      this.placeSpecies(x, y);
    }
  }

  handlePaletteClick(x, _y) {
    const speciesIndex = Math.floor((x - 20) / 100);
    if (speciesIndex >= 0 && speciesIndex < this.availableSpecies.length) {
      this.gameState.selectedSpecies = this.availableSpecies[speciesIndex].id;
    }
  }

  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (y > this.canvas.height - 80) {
      const speciesIndex = Math.floor((x - 20) / 100);
      if (speciesIndex >= 0 && speciesIndex < this.availableSpecies.length) {
        this.gameState.draggedSpecies = this.availableSpecies[speciesIndex];
        this.mousePos = { x, y };
      }
    }
  }

  handleMouseUp(event) {
    if (this.gameState.draggedSpecies) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (y < this.canvas.height - 100) {
        this.placeSpeciesAt(x, y, this.gameState.draggedSpecies);
      }

      this.gameState.draggedSpecies = null;
    }
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  placeSpecies(x, y) {
    const species = this.availableSpecies.find(s => s.id === this.gameState.selectedSpecies);
    if (species) {
      this.placeSpeciesAt(x, y, species);
    }
  }

  placeSpeciesAt(x, y, species) {
    const gridX = Math.floor(x / this.config.ecosystem.gridSize);
    const gridY = Math.floor(y / this.config.ecosystem.gridSize);
    const position = `${gridX},${gridY}`;

    // Check bounds
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight - 3) {
      return;
    }

    // Check if position is already occupied
    if (this.gameState.placedSpecies.has(position)) {
      this.showMessage('Position already occupied!', 1000);
      return;
    }

    // Place the species
    this.gameState.placedSpecies.set(position, { ...species, position });
    this.gameState.score += species.energy * 10;

    // Create success particles
    this.createParticles(
      gridX * this.config.ecosystem.gridSize + this.config.ecosystem.gridSize / 2,
      gridY * this.config.ecosystem.gridSize + this.config.ecosystem.gridSize / 2,
      species.color
    );

    this.showMessage(`${species.name} placed! +${species.energy * 10} points`, 1000);
  }

  createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      this.gameState.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        speed: 0.5 + Math.random(),
        color,
        alpha: 1,
        age: 0,
        lifetime: 1000 + Math.random() * 1000,
      });
    }
  }

  showMessage(text, duration) {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = text;
    messageEl.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 16px;
      z-index: 1000;
      pointer-events: none;
    `;

    this.canvas.parentElement.style.position = 'relative';
    this.canvas.parentElement.appendChild(messageEl);

    setTimeout(() => {
      if (messageEl.parentElement) {
        messageEl.parentElement.removeChild(messageEl);
      }
    }, duration);
  }

  levelComplete() {
    this.gameState.level++;
    this.gameState.score += 1000;
    this.showMessage(`Level ${this.gameState.level - 1} Complete! Bonus: +1000 points`, 3000);

    // Add new species for next level
    if (this.gameState.level === 2) {
      this.availableSpecies.push(
        { id: 'tree', name: 'Tree', type: 'producer', energy: 2, color: '#2E7D32' },
        {
          id: 'deer',
          name: 'Deer',
          type: 'herbivore',
          energy: 3,
          color: '#6D4C41',
          eats: ['grass', 'tree'],
        }
      );
    }

    // Reset for next level
    this.gameState.placedSpecies.clear();
    this.gameState.ecosystemHealth = 1.0;
  }

  // Public methods for game control
  start() {
    this.gameState.gameActive = true;
  }

  pause() {
    this.gameState.gameActive = false;
  }

  reset() {
    this.gameState = {
      level: 1,
      score: 0,
      ecosystemHealth: 1.0,
      placedSpecies: new Map(),
      selectedSpecies: null,
      draggedSpecies: null,
      particles: [],
    };
    this.availableSpecies = [
      { id: 'grass', name: 'Grass', type: 'producer', energy: 1, color: '#4CAF50' },
      {
        id: 'rabbit',
        name: 'Rabbit',
        type: 'herbivore',
        energy: 2,
        color: '#8BC34A',
        eats: ['grass'],
      },
      { id: 'fox', name: 'Fox', type: 'carnivore', energy: 3, color: '#FF9800', eats: ['rabbit'] },
    ];
  }

  destroy() {
    // Clean up event listeners
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.resizeCanvas);
  }
}
