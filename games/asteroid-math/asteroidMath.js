// Asteroid Math — a canvas arcade game where you blast the asteroid carrying
// the correct answer to a math problem. Self-contained (no framework), with a
// center turret that aims at the pointer and fires on click / tap / space.

const TAU = Math.PI * 2;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a level-appropriate problem: { text, answer }. */
function generateProblem(level) {
  const op =
    level <= 1 ? pick(['+', '-']) : level <= 3 ? pick(['+', '-', '×']) : pick(['+', '-', '×']);
  let a, b, answer;
  if (op === '+') {
    const hi = level <= 2 ? 15 : level <= 4 ? 30 : 50;
    a = randInt(1, hi);
    b = randInt(1, hi);
    answer = a + b;
  } else if (op === '-') {
    const hi = level <= 2 ? 20 : level <= 4 ? 40 : 80;
    a = randInt(5, hi);
    b = randInt(1, a);
    answer = a - b;
  } else {
    const hi = level <= 4 ? 6 : level <= 6 ? 9 : 12;
    a = randInt(2, hi);
    b = randInt(2, hi);
    answer = a * b;
  }
  return { text: `${a} ${op} ${b}`, answer };
}

/** Plausible wrong answers, all distinct from the answer and >= 0. */
function makeDistractors(answer, count) {
  const set = new Set();
  const candidates = shuffle([
    answer + 1,
    answer - 1,
    answer + 2,
    answer - 2,
    answer + 10,
    answer - 10,
    answer + randInt(3, 6),
    answer - randInt(3, 6),
    answer + randInt(1, 20),
  ]);
  for (const c of candidates) {
    if (c !== answer && c >= 0) set.add(c);
    if (set.size >= count) break;
  }
  let extra = answer + 3;
  while (set.size < count) {
    if (extra !== answer && extra >= 0) set.add(extra);
    extra++;
  }
  return [...set].slice(0, count);
}

/** A tiny Web Audio beeper for arcade sound effects. */
class Beeper {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.enabled = false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, dur, type = 'square', vol = 0.06, when = 0) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }
  shoot() {
    this.tone(720, 0.08, 'square', 0.04);
  }
  correct() {
    this.tone(523, 0.09, 'triangle', 0.07);
    this.tone(659, 0.09, 'triangle', 0.07, 0.09);
    this.tone(784, 0.12, 'triangle', 0.07, 0.18);
  }
  wrong() {
    this.tone(180, 0.22, 'sawtooth', 0.06);
  }
  loseLife() {
    this.tone(300, 0.18, 'square', 0.06);
    this.tone(150, 0.28, 'square', 0.06, 0.14);
  }
  gameOver() {
    [440, 349, 262].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.07, i * 0.18));
  }
}

export default class AsteroidMathGame {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.el = options.elements || {};
    this.beeper = new Beeper();

    this.state = 'idle'; // idle | playing | gameover
    this.aim = { x: 0, y: 0 };
    this.fireCooldown = 0;

    this._bindInput();
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Draw a calm starfield while idle.
    this._initStars();
    this._renderIdle();
  }

  // ---- setup / sizing -------------------------------------------------------
  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = Math.max(280, rect.width);
    this.h = Math.max(320, rect.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.state !== 'playing') {
      this.aim = { x: this.w / 2, y: this.h / 4 };
    }
  }

  _initStars() {
    this.stars = Array.from({ length: 90 }, () => ({
      x: rand(0, 1),
      y: rand(0, 1),
      z: rand(0.3, 1),
      tw: rand(0, TAU),
    }));
  }

  _bindInput() {
    const toLocal = e => {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    this.canvas.addEventListener('pointermove', e => {
      this.aim = toLocal(e);
    });
    this.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.beeper.ensure();
      this.aim = toLocal(e);
      if (this.state === 'playing') this._fire();
    });
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && this.state === 'playing') {
        e.preventDefault();
        this._fire();
      }
    });
  }

  // ---- lifecycle ------------------------------------------------------------
  start() {
    this.beeper.ensure();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.streak = 0;
    this.correctThisLevel = 0;
    this.bullets = [];
    this.particles = [];
    this.shake = 0;
    this.flash = null;
    this.state = 'playing';
    this._hideOverlay(this.el.start);
    this._hideOverlay(this.el.gameover);
    this._newRound();
    this._updateHUD();
    this.last = performance.now();
    this._loop(this.last);
  }

  _newRound() {
    const problem = generateProblem(this.level);
    this.problem = problem;
    const distractorCount = clamp(1 + this.level, 2, 5);
    const values = shuffle([problem.answer, ...makeDistractors(problem.answer, distractorCount)]);

    const speed = 22 + this.level * 6;
    this.asteroids = values.map(value =>
      this._makeAsteroid(value, value === problem.answer, speed)
    );

    this.roundTime = Math.max(6, 15 - this.level * 0.8);
    this.roundLeft = this.roundTime;
    if (this.el.problem) this.el.problem.textContent = `${problem.text} = ?`;
  }

  _makeAsteroid(value, isCorrect, speed) {
    const radius = rand(30, 42);
    // Spawn away from the centre turret.
    let x, y;
    do {
      x = rand(radius, this.w - radius);
      y = rand(radius, this.h - radius);
    } while (Math.hypot(x - this.w / 2, y - this.h / 2) < 120);
    const dir = rand(0, TAU);
    const verts = randInt(9, 12);
    return {
      x,
      y,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      radius,
      value,
      isCorrect,
      rot: rand(0, TAU),
      vr: rand(-0.6, 0.6),
      shape: Array.from({ length: verts }, (_, i) => ({
        a: (i / verts) * TAU,
        r: rand(0.78, 1.05),
      })),
    };
  }

  _fire() {
    if (this.fireCooldown > 0) return;
    this.fireCooldown = 0.22;
    const cx = this.w / 2;
    const cy = this.h / 2;
    const ang = Math.atan2(this.aim.y - cy, this.aim.x - cx);
    const speed = 620;
    this.bullets.push({
      x: cx + Math.cos(ang) * 26,
      y: cy + Math.sin(ang) * 26,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 1.3,
    });
    this.beeper.shoot();
  }

  // ---- main loop ------------------------------------------------------------
  _loop(ts) {
    if (this.state !== 'playing') return;
    const dt = Math.min(0.05, (ts - this.last) / 1000);
    this.last = ts;
    this._update(dt);
    this._render();
    requestAnimationFrame(t => this._loop(t));
  }

  _update(dt) {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.shake = Math.max(0, this.shake - dt * 60);
    if (this.flash) {
      this.flash.life -= dt;
      if (this.flash.life <= 0) this.flash = null;
    }

    // Round timer.
    this.roundLeft -= dt;
    if (this.roundLeft <= 0) {
      this._loseLife('⏱ Time up!');
      return;
    }

    // Asteroids drift and wrap.
    for (const a of this.asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.vr * dt;
      if (a.x < -a.radius) a.x = this.w + a.radius;
      if (a.x > this.w + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = this.h + a.radius;
      if (a.y > this.h + a.radius) a.y = -a.radius;
    }

    // Bullets.
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    this.bullets = this.bullets.filter(
      b => b.life > 0 && b.x > -20 && b.x < this.w + 20 && b.y > -20 && b.y < this.h + 20
    );

    // Collisions: bullet vs asteroid.
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (a.dead) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          b.life = 0;
          this._hitAsteroid(a);
          break;
        }
      }
    }
    this.asteroids = this.asteroids.filter(a => !a.dead);

    // Particles.
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Twinkle stars.
    for (const s of this.stars) s.tw += dt * 2;
  }

  _hitAsteroid(a) {
    if (a.isCorrect) {
      a.dead = true;
      this._explode(a.x, a.y, '#00e676', 26);
      const gained =
        100 * this.level + Math.round(this.streak * 25) + Math.ceil(this.roundLeft * 10);
      this.score += gained;
      this.streak += 1;
      this.correctThisLevel += 1;
      this.beeper.correct();
      this._floatText(a.x, a.y, `+${gained}`, '#00e676');
      if (this.correctThisLevel >= 5) {
        this.level += 1;
        this.correctThisLevel = 0;
        this._floatText(this.w / 2, this.h / 2 - 40, `LEVEL ${this.level}!`, '#ffd54f');
      }
      this._updateHUD();
      this._newRound();
    } else {
      // Wrong answer: destroy it, penalise, spawn a replacement distractor.
      a.dead = true;
      this._explode(a.x, a.y, '#ff5252', 18);
      this.score = Math.max(0, this.score - 40);
      this.streak = 0;
      this.shake = 10;
      this.flash = { color: 'rgba(255,82,82,0.18)', life: 0.2 };
      this.beeper.wrong();
      this._floatText(a.x, a.y, '-40', '#ff5252');
      const speed = 22 + this.level * 6;
      let value;
      const used = new Set(this.asteroids.filter(x => !x.dead).map(x => x.value));
      used.add(this.problem.answer);
      let guard = 0;
      do {
        value = this.problem.answer + randInt(-12, 12);
        guard++;
      } while ((value < 0 || used.has(value)) && guard < 40);
      this.asteroids.push(this._makeAsteroid(value, false, speed));
      this._updateHUD();
    }
  }

  _loseLife(reason) {
    this.lives -= 1;
    this.streak = 0;
    this.shake = 14;
    this.flash = { color: 'rgba(255,82,82,0.22)', life: 0.3 };
    this.beeper.loseLife();
    if (reason) this._floatText(this.w / 2, this.h / 2, reason, '#ff8a80');
    this._updateHUD();
    if (this.lives <= 0) {
      this._gameOver();
    } else {
      this._newRound();
    }
  }

  _gameOver() {
    this.state = 'gameover';
    this.beeper.gameOver();
    if (this.el.finalScore) this.el.finalScore.textContent = String(this.score);
    this._showOverlay(this.el.gameover);
  }

  // ---- effects --------------------------------------------------------------
  _explode(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(40, 260);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.4, 0.9),
        maxLife: 0.9,
        color,
        size: rand(2, 4),
      });
    }
  }

  _floatText(x, y, text, color) {
    this.particles.push({ x, y, vx: 0, vy: -40, life: 1.1, maxLife: 1.1, color, text, size: 20 });
  }

  _updateHUD() {
    if (this.el.score) this.el.score.textContent = String(this.score);
    if (this.el.level) this.el.level.textContent = String(this.level);
    if (this.el.streak) this.el.streak.textContent = String(this.streak);
    if (this.el.lives) this.el.lives.textContent = '🚀'.repeat(Math.max(0, this.lives)) || '—';
  }

  _showOverlay(el) {
    if (el) el.classList.add('show');
  }
  _hideOverlay(el) {
    if (el) el.classList.remove('show');
  }

  // ---- rendering ------------------------------------------------------------
  _renderIdle() {
    this._drawBackground();
    this._drawShip(
      this.w / 2,
      this.h / 2,
      Math.atan2(this.aim.y - this.h / 2, this.aim.x - this.w / 2)
    );
  }

  _render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    }
    this._drawBackground();

    // Round timer bar.
    const frac = clamp(this.roundLeft / this.roundTime, 0, 1);
    ctx.fillStyle = frac < 0.3 ? '#ff5252' : '#4fc3f7';
    ctx.fillRect(0, 0, this.w * frac, 5);

    // Asteroids.
    for (const a of this.asteroids) this._drawAsteroid(a);

    // Bullets.
    for (const b of this.bullets) {
      ctx.save();
      ctx.shadowColor = '#4fe3ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#c9fbff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Ship.
    const cx = this.w / 2;
    const cy = this.h / 2;
    this._drawShip(cx, cy, Math.atan2(this.aim.y - cy, this.aim.x - cx));

    // Particles.
    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.text) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 20px "Comic Sans MS", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    if (this.flash) {
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(-40, -40, this.w + 80, this.h + 80);
    }
    ctx.restore();
  }

  _drawBackground() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#0b1026');
    g.addColorStop(1, '#161a3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    for (const s of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(s.tw);
      ctx.globalAlpha = 0.3 + 0.7 * tw * s.z;
      ctx.fillStyle = '#ffffff';
      const size = s.z * 1.8;
      ctx.fillRect(s.x * this.w, s.y * this.h, size, size);
    }
    ctx.globalAlpha = 1;
  }

  _drawAsteroid(a) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.beginPath();
    a.shape.forEach((v, i) => {
      const px = Math.cos(v.a) * a.radius * v.r;
      const py = Math.sin(v.a) * a.radius * v.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    const grad = ctx.createRadialGradient(
      -a.radius * 0.3,
      -a.radius * 0.3,
      a.radius * 0.2,
      0,
      0,
      a.radius
    );
    grad.addColorStop(0, '#8d7b6a');
    grad.addColorStop(1, '#4e4438');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2e2820';
    ctx.stroke();
    ctx.restore();

    // Number label (upright, not rotated).
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(a.radius * 0.85)}px "Comic Sans MS", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(String(a.value), a.x, a.y);
    ctx.restore();
  }

  _drawShip(x, y, angle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // engine glow
    ctx.fillStyle = 'rgba(79,227,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-24 - rand(0, 6), 0);
    ctx.lineTo(-14, 6);
    ctx.closePath();
    ctx.fill();
    // hull
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fillStyle = '#e8f6ff';
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
