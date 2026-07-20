// filepath: src/features/games/pizza-party/ParticleSystem.js

/**
 * ParticleSystem - Creates beautiful particle effects for the pizza game
 */
export default class ParticleSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.particles = [];
    this.maxParticles = 200;
  }

  /**
   * Add a burst of particles at a location
   */
  addBurst(x, y, color = '#FFD700', count = 15) {
    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle({
          x: x,
          y: y,
          color: color,
          type: 'burst',
          life: Math.random() * 1000 + 500,
          velocity: {
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200 - 50,
          },
        })
      );
    }

    this.limitParticles();
  }

  /**
   * Add confetti particles for celebrations
   */
  addConfetti(x, y, count = 30) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];

    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle({
          x: x + (Math.random() - 0.5) * 100,
          y: y + (Math.random() - 0.5) * 50,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: 'confetti',
          life: Math.random() * 2000 + 1000,
          velocity: {
            x: (Math.random() - 0.5) * 300,
            y: Math.random() * -300 - 100,
          },
          size: Math.random() * 8 + 4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        })
      );
    }

    this.limitParticles();
  }

  /**
   * Add sparkle particles around a point
   */
  addSparkles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = 30 + Math.random() * 20;

      this.particles.push(
        new Particle({
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          color: '#FFD700',
          type: 'sparkle',
          life: Math.random() * 800 + 400,
          velocity: {
            x: Math.cos(angle) * 50,
            y: Math.sin(angle) * 50,
          },
          size: Math.random() * 4 + 2,
        })
      );
    }

    this.limitParticles();
  }

  /**
   * Add floating numbers for score display
   */
  addFloatingText(x, y, text, color = '#4CAF50') {
    this.particles.push(
      new Particle({
        x: x,
        y: y,
        color: color,
        type: 'text',
        text: text,
        life: 2000,
        velocity: {
          x: 0,
          y: -80,
        },
        size: 24,
      })
    );

    this.limitParticles();
  }

  /**
   * Add steam particles for hot pizza
   */
  addSteam(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle({
          x: x + (Math.random() - 0.5) * 40,
          y: y,
          color: 'rgba(255, 255, 255, 0.6)',
          type: 'steam',
          life: Math.random() * 2000 + 1000,
          velocity: {
            x: (Math.random() - 0.5) * 20,
            y: -30 - Math.random() * 20,
          },
          size: Math.random() * 8 + 4,
        })
      );
    }

    this.limitParticles();
  }

  /**
   * Update all particles
   */
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update particle
      particle.update(deltaTime);

      // Remove dead particles
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all particles
   */
  draw() {
    this.particles.forEach(particle => {
      particle.draw(this.ctx);
    });
  }

  /**
   * Limit particle count for performance
   */
  limitParticles() {
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getParticleCount() {
    return this.particles.length;
  }

  /**
   * Destroy particle system
   */
  destroy() {
    this.clear();
    this.ctx = null;
  }
}

/**
 * Individual particle class
 */
class Particle {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.color = options.color || '#FFD700';
    this._type = options.type || 'basic';
    this.text = options.text || '';

    this.velocity = options.velocity || { x: 0, y: 0 };
    this.acceleration = options.acceleration || { x: 0, y: 0 };

    this.size = options.size || 4;
    this.life = options.life || 1000;
    this.maxLife = this.life;

    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;

    this.gravity = options.gravity || 200; // pixels per second squared
    this.friction = options.friction || 0.98;
    this.bounce = options.bounce || 0.7;

    this.alpha = 1;
    this.scale = 1;
  }

  /**
   * Update particle physics and state
   */
  update(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds

    // Apply gravity based on particle type
    if (this.type === 'confetti' || this.type === 'burst') {
      this.velocity.y += this.gravity * dt;
    }

    // Apply friction
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    // Update position
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    // Update rotation
    this.rotation += this.rotationSpeed * dt;

    // Update life
    this.life -= deltaTime;

    // Update visual properties based on life
    const lifeRatio = this.life / this.maxLife;

    switch (this.type) {
      case 'burst':
        this.alpha = lifeRatio;
        this.scale = 1 + (1 - lifeRatio) * 0.5;
        break;

      case 'confetti':
        this.alpha = lifeRatio;
        break;

      case 'sparkle':
        this.alpha = Math.sin(lifeRatio * Math.PI);
        this.scale = 0.5 + Math.sin(lifeRatio * Math.PI * 4) * 0.5;
        break;

      case 'text':
        this.alpha = lifeRatio;
        this.scale = 1 + (1 - lifeRatio) * 0.2;
        break;

      case 'steam':
        this.alpha = lifeRatio * 0.6;
        this.scale = 1 + (1 - lifeRatio) * 2;
        break;
    }
  }

  /**
   * Draw particle to canvas
   */
  draw(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Move to particle position
    ctx.translate(this.x, this.y);

    // Apply rotation
    if (this.rotation) {
      ctx.rotate(this.rotation);
    }

    // Apply scale
    if (this.scale !== 1) {
      ctx.scale(this.scale, this.scale);
    }

    // Draw based on type
    switch (this.type) {
      case 'burst':
      case 'sparkle':
        this.drawCircle(ctx);
        break;

      case 'confetti':
        this.drawConfetti(ctx);
        break;

      case 'text':
        this.drawText(ctx);
        break;

      case 'steam':
        this.drawSteam(ctx);
        break;

      default:
        this.drawCircle(ctx);
    }

    ctx.restore();
  }

  /**
   * Draw a simple circle particle
   */
  drawCircle(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Add glow effect for sparkles
    if (this.type === 'sparkle') {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.size * 2;
      ctx.fill();
    }
  }

  /**
   * Draw confetti as a rectangle
   */
  drawConfetti(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);

    // Add highlight
    ctx.fillStyle = this.lightenColor(this.color, 30);
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size / 3, this.size / 2);
  }

  /**
   * Draw floating text
   */
  drawText(ctx) {
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(this.text, 0, 0);
  }

  /**
   * Draw steam as a soft circle
   */
  drawSteam(ctx) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Lighten a color by a percentage
   */
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  /**
   * Check if particle is dead
   */
  isDead() {
    return this.life <= 0;
  }
}
