// Asteroid Math — a canvas arcade game where you blast the asteroid carrying
// the correct answer to a math problem. Self-contained (no framework), with a
// center turret that aims at the pointer and fires on click / tap / space.

const TAU = Math.PI * 2;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A rounded, kid-friendly system stack — no web font, so canvas text never
// pops from a fallback to the real face mid-game.
const FONT = "'Trebuchet MS', 'Segoe UI', system-ui, -apple-system, sans-serif";

const HIGH_SCORE_KEY = 'learnimals-asteroid-highscore';
const MUTED_KEY = 'learnimals-asteroid-muted';

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
  const op = level <= 1 ? pick(['+', '-']) : pick(['+', '-', '×']);
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
  constructor(muted = false) {
    this.enabled = true;
    this.muted = muted;
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
    if (!this.enabled || this.muted) return;
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
  countdown() {
    this.tone(660, 0.09, 'square', 0.05);
  }
  go() {
    this.tone(880, 0.16, 'triangle', 0.07);
  }
}

export default class AsteroidMathGame {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.el = options.elements || {};

    this.muted = this._loadMuted();
    this.beeper = new Beeper(this.muted);
    this.highScore = this._loadHighScore();

    // Respect the OS "reduce motion" setting for shake / twinkle / heavy bursts.
    this.reduceMotion = false;
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq) {
      this.reduceMotion = mq.matches;
      const onChange = e => (this.reduceMotion = e.matches);
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    this.state = 'idle'; // idle | countdown | playing | gameover
    this.paused = false;
    this.rafId = null;
    this.aim = { x: 0, y: 0 };
    this.fireCooldown = 0;
    this.recoil = 0;
    this.grace = 0;
    this.keyAim = null; // set while aiming with the keyboard

    // Sensible defaults so the HUD reads 0 / 1 / 0 / 🚀🚀🚀 on the landing
    // screen (start() resets these anyway).
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.streak = 0;

    // Init the starfield before the first _resize(), which renders the idle
    // frame and needs this.stars to exist.
    this._initStars();

    this._bindInput();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    // Never keep animating (and beeping) an unseen tab.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
    window.addEventListener('blur', () => this.pause());

    this._syncControls();
    this._updateHUD();
    this._renderIdle();
  }

  // ---- persistence ----------------------------------------------------------
  _loadHighScore() {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }
  _saveHighScore(v) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(v));
    } catch {
      /* storage unavailable — high score just won't persist */
    }
  }
  _loadMuted() {
    try {
      return localStorage.getItem(MUTED_KEY) === '1';
    } catch {
      return false;
    }
  }
  _saveMuted(v) {
    try {
      localStorage.setItem(MUTED_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  // ---- setup / sizing -------------------------------------------------------
  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Match the bitmap to the element's real box so circles stay circular and
    // pointer coords map 1:1. Playable height is guaranteed by .am-stage's CSS
    // min-height, not by inflating the bitmap here (which would squish it).
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.state !== 'playing' && this.state !== 'countdown') {
      this.aim = { x: this.w / 2, y: this.h / 4 };
      this._renderIdle();
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
      this.keyAim = null; // pointer takes over from keyboard aim
      this.aim = toLocal(e);
    });
    this.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.beeper.ensure();
      this.keyAim = null;
      this.aim = toLocal(e);
      if (this.state === 'playing' && !this.paused) this._fire();
    });
    window.addEventListener('keydown', e => this._onKeyDown(e));
  }

  // True when a page control (link/button/etc.) is focused, so we don't hijack
  // its keys (Space to scroll/activate, etc.) for the game.
  _interactiveFocused() {
    const el = document.activeElement;
    return !!el && ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(el.tagName);
  }

  _onKeyDown(e) {
    if (e.code === 'KeyM' && !this._interactiveFocused()) {
      this.toggleMute();
      return;
    }
    if (e.code === 'KeyP' && (this.state === 'playing' || this.state === 'countdown')) {
      this.togglePause();
      return;
    }
    if (this.state !== 'playing' || this.paused || this._interactiveFocused()) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      this._fire();
    } else if (
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown'
    ) {
      // Keyboard aim: rotate the turret so keyboard/switch users can play.
      e.preventDefault();
      const cx = this.w / 2;
      const cy = this.h / 2;
      if (this.keyAim == null) this.keyAim = Math.atan2(this.aim.y - cy, this.aim.x - cx);
      const step = 0.18;
      if (e.code === 'ArrowLeft') this.keyAim -= step;
      else if (e.code === 'ArrowRight') this.keyAim += step;
      else if (e.code === 'ArrowUp') this.keyAim = -Math.PI / 2;
      else if (e.code === 'ArrowDown') this.keyAim = Math.PI / 2;
      const r = Math.min(this.w, this.h) * 0.4;
      this.aim = { x: cx + Math.cos(this.keyAim) * r, y: cy + Math.sin(this.keyAim) * r };
    }
  }

  // ---- controls (mute / pause) ---------------------------------------------
  toggleMute() {
    this.muted = !this.muted;
    this.beeper.muted = this.muted;
    this._saveMuted(this.muted);
    this._syncControls();
  }

  togglePause() {
    if (this.paused) this.resume();
    else this.pause();
  }

  pause() {
    if ((this.state !== 'playing' && this.state !== 'countdown') || this.paused) return;
    this.paused = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this._syncControls();
    this._showOverlay(this.el.pause);
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._hideOverlay(this.el.pause);
    this._syncControls();
    this.last = performance.now(); // avoid a giant dt jump on resume
    this._loop(this.last);
  }

  _syncControls() {
    if (this.el.muteBtn) {
      this.el.muteBtn.textContent = this.muted ? '🔇' : '🔊';
      this.el.muteBtn.setAttribute('aria-pressed', String(this.muted));
      this.el.muteBtn.setAttribute('aria-label', this.muted ? 'Unmute sound' : 'Mute sound');
    }
    if (this.el.pauseBtn) {
      const playing = this.state === 'playing' || this.state === 'countdown';
      this.el.pauseBtn.disabled = !playing;
      this.el.pauseBtn.textContent = this.paused ? '▶' : '⏸';
      this.el.pauseBtn.setAttribute('aria-label', this.paused ? 'Resume game' : 'Pause game');
    }
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
    this.rings = [];
    this.shake = 0;
    this.flash = null;
    this.grace = 0;
    this.recoil = 0;
    this.paused = false;
    this.newBest = false;
    this.keyAim = null;
    this.muzzle = null;
    this.state = 'countdown';
    // Start at exactly 3 so the first frame reads "3" (not a stray "4"); the
    // GO! beat plays while countdownLeft is in (-GO_TIME, 0].
    this.countdownLeft = 3;
    this.lastCountShown = 4;
    this._hideOverlay(this.el.start);
    this._hideOverlay(this.el.gameover);
    this._hideOverlay(this.el.pause);
    this._newRound(true);
    this._updateHUD();
    this._syncControls();
    this.last = performance.now();
    this._loop(this.last);
  }

  _newRound(silent = false) {
    const problem = generateProblem(this.level);
    this.problem = problem;
    const distractorCount = clamp(1 + this.level, 2, 5);
    const values = shuffle([problem.answer, ...makeDistractors(problem.answer, distractorCount)]);

    const speed = 22 + this.level * 6;
    // Build one at a time so each new asteroid can be placed clear of the ones
    // already spawned (de-clutter — no overlapping numbers at spawn).
    this.asteroids = [];
    for (const value of values) {
      this.asteroids.push(
        this._makeAsteroid(value, value === problem.answer, speed, this.asteroids)
      );
    }

    // Stray bullets from the round just solved must not fly into this fresh
    // field and cost a life on a problem the player hasn't seen yet.
    this.bullets = [];
    this.muzzle = null;

    this.roundTime = Math.max(6, 15 - this.level * 0.8);
    this.roundLeft = this.roundTime;
    this._announce(`${problem.text} equals what?`);
    if (this.el.problem) {
      this.el.problem.textContent = `${problem.text} = ?`;
      if (!silent) {
        // Quick "new problem" pulse so the next question doesn't snap in cold.
        this.el.problem.classList.remove('am-problem--pop');
        // Force reflow so the animation restarts even on back-to-back rounds.
        void this.el.problem.offsetWidth;
        this.el.problem.classList.add('am-problem--pop');
      }
    }
  }

  _makeAsteroid(value, isCorrect, speed, others = []) {
    const radius = rand(30, 42);
    // Spawn away from the centre turret AND clear of already-placed asteroids
    // so numbers don't overlap. Give up after a bounded search (small canvas /
    // many asteroids) rather than looping forever.
    let x, y;
    let tries = 0;
    do {
      x = rand(radius, this.w - radius);
      y = rand(radius, this.h - radius);
      tries++;
    } while (
      tries < 60 &&
      (Math.hypot(x - this.w / 2, y - this.h / 2) < 120 ||
        others.some(o => Math.hypot(x - o.x, y - o.y) < o.radius + radius + 12))
    );
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
      vr: this.reduceMotion ? 0 : rand(-0.6, 0.6),
      shape: Array.from({ length: verts }, (_, i) => ({
        a: (i / verts) * TAU,
        r: rand(0.78, 1.05),
      })),
    };
  }

  _fire() {
    if (this.fireCooldown > 0) return;
    this.fireCooldown = 0.22;
    this.recoil = this.reduceMotion ? 0 : 6;
    const cx = this.w / 2;
    const cy = this.h / 2;
    const ang = Math.atan2(this.aim.y - cy, this.aim.x - cx);
    const speed = 620;
    this.bullets.push({
      x: cx + Math.cos(ang) * 26,
      y: cy + Math.sin(ang) * 26,
      px: cx + Math.cos(ang) * 26,
      py: cy + Math.sin(ang) * 26,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      life: 1.3,
    });
    // Muzzle flash at the turret nose.
    this.muzzle = { x: cx + Math.cos(ang) * 26, y: cy + Math.sin(ang) * 26, life: 0.08 };
    this.beeper.shoot();
  }

  // ---- main loop ------------------------------------------------------------
  _loop(ts) {
    if ((this.state !== 'playing' && this.state !== 'countdown') || this.paused) return;
    // Clamp to [0, 0.05]: never negative (a rAF stamp can land just before the
    // performance.now() we stored, which would run time backwards) and never a
    // huge catch-up step after a stall.
    const dt = Math.max(0, Math.min(0.05, (ts - this.last) / 1000));
    this.last = ts;
    this._update(dt);
    this._render();
    this.rafId = requestAnimationFrame(t => this._loop(t));
  }

  _update(dt) {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.recoil = Math.max(0, this.recoil - dt * 40);
    this.grace = Math.max(0, this.grace - dt);
    if (!this.reduceMotion) this.shake = Math.max(0, this.shake - dt * 60);
    else this.shake = 0;
    if (this.muzzle) {
      this.muzzle.life -= dt;
      if (this.muzzle.life <= 0) this.muzzle = null;
    }
    if (this.flash) {
      this.flash.life -= dt;
      if (this.flash.life <= 0) this.flash = null;
    }

    // Countdown intro: asteroids drift for life, but nothing is scored yet.
    // Runs 3..2..1..GO! then hands off to 'playing'.
    if (this.state === 'countdown') {
      this.countdownLeft -= dt;
      const n = Math.ceil(Math.max(this.countdownLeft, 0));
      if (n >= 1 && n !== this.lastCountShown) {
        this.lastCountShown = n;
        this.beeper.countdown();
        this._announce(String(n));
      } else if (n === 0 && this.lastCountShown !== 0) {
        this.lastCountShown = 0;
        this.beeper.go();
        this._announce('Go!');
      }
      this._driftAsteroids(dt);
      // Keep showing GO! briefly, then start.
      if (this.countdownLeft <= -0.6) this.state = 'playing';
      this._twinkle(dt);
      return;
    }

    // Round timer.
    this.roundLeft -= dt;
    if (this.roundLeft <= 0) {
      this._loseLife('⏱ Time up!');
      return;
    }

    this._driftAsteroids(dt);

    // Bullets.
    for (const b of this.bullets) {
      b.px = b.x;
      b.py = b.y;
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

    // Expanding hit rings.
    for (const r of this.rings) {
      r.radius += r.speed * dt;
      r.life -= dt;
    }
    this.rings = this.rings.filter(r => r.life > 0);

    // Particles.
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    this._twinkle(dt);
  }

  _driftAsteroids(dt) {
    const list = this.asteroids;
    for (const a of list) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.vr * dt;
    }
    // Gentle mutual repulsion so drifting asteroids don't pile up or hide each
    // other's numbers. Only nudges positions; velocities keep their free drift.
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minGap = a.radius + b.radius + 10;
        if (dist < minGap) {
          const push = (minGap - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
    // Wrap after separation so a nudge can't leave one stuck off-screen.
    for (const a of list) {
      if (a.x < -a.radius) a.x = this.w + a.radius;
      if (a.x > this.w + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = this.h + a.radius;
      if (a.y > this.h + a.radius) a.y = -a.radius;
    }
  }

  _twinkle(dt) {
    if (this.reduceMotion) return;
    for (const s of this.stars) s.tw += dt * 2;
  }

  _hitAsteroid(a) {
    // A second bullet resolving in the same frame must not score or spawn a
    // round after game over has already been triggered.
    if (this.state !== 'playing') return;
    if (a.isCorrect) {
      a.dead = true;
      this._explode(a.x, a.y, '#00e676', 26);
      this._ring(a.x, a.y, '#00e676', a.radius);
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
        this._announce(`Level ${this.level}!`);
      }
      this._updateHUD();
      this._newRound();
    } else {
      // Wrong asteroid. A brief grace window after any life loss keeps a panic
      // multi-tap from instantly burning every life on stray fires.
      this._explode(a.x, a.y, '#ff5252', 18);
      if (this.grace > 0) {
        this.beeper.wrong();
        return;
      }
      this.beeper.wrong();
      this._loseLife('Wrong! 💥');
    }
  }

  _loseLife(reason) {
    this.lives -= 1;
    this.streak = 0;
    this.grace = 1.0;
    this.shake = 14;
    this.flash = { color: 'rgba(255,82,82,0.22)', life: 0.3 };
    this.beeper.loseLife();
    if (reason) {
      this._floatText(this.w / 2, this.h / 2, reason, '#ff8a80');
      this._announce(`${reason} ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`);
    }
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
    this.newBest = this.score > this.highScore;
    if (this.newBest) {
      this.highScore = this.score;
      this._saveHighScore(this.highScore);
    }
    if (this.el.finalScore) this.el.finalScore.textContent = String(this.score);
    if (this.el.gameoverBest) this.el.gameoverBest.textContent = String(this.highScore);
    if (this.el.newBest) this.el.newBest.style.display = this.newBest ? '' : 'none';
    this._announce(`Game over. Final score ${this.score}.${this.newBest ? ' New best!' : ''}`);
    this._updateHUD();
    this._syncControls();
    this._showOverlay(this.el.gameover);
  }

  // ---- effects --------------------------------------------------------------
  _explode(x, y, color, n) {
    const count = this.reduceMotion ? Math.ceil(n / 3) : n;
    for (let i = 0; i < count; i++) {
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

  _ring(x, y, color, r) {
    if (this.reduceMotion) return; // expanding rings are motion — skip when calmed
    this.rings.push({ x, y, color, radius: r, speed: 160, life: 0.4, maxLife: 0.4 });
  }

  _floatText(x, y, text, color) {
    // Static (no upward drift) under reduced motion; it still fades.
    const vy = this.reduceMotion ? 0 : -40;
    this.particles.push({ x, y, vx: 0, vy, life: 1.1, maxLife: 1.1, color, text, size: 20 });
  }

  // Push a message to the visually-hidden polite live region for screen readers.
  _announce(msg) {
    if (this.el.live) this.el.live.textContent = msg;
  }

  _updateHUD() {
    const lives = Math.max(0, this.lives);
    if (this.el.score) this.el.score.textContent = String(this.score);
    if (this.el.best) this.el.best.textContent = String(Math.max(this.highScore, this.score || 0));
    if (this.el.level) this.el.level.textContent = String(this.level);
    if (this.el.streak) this.el.streak.textContent = String(this.streak);
    if (this.el.lives) {
      this.el.lives.textContent = '🚀'.repeat(lives) || '—';
      // Screen readers otherwise hear "rocket rocket rocket"; give a number.
      this.el.lives.setAttribute('aria-label', `${lives} ${lives === 1 ? 'life' : 'lives'}`);
    }
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
    if (this.shake > 0 && !this.reduceMotion) {
      ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    }
    this._drawBackground();

    // Round timer bar (hidden during the countdown intro).
    if (this.state === 'playing') {
      const frac = clamp(this.roundLeft / this.roundTime, 0, 1);
      const low = frac < 0.3;
      const color = frac < 0.3 ? '#ff5252' : frac < 0.6 ? '#ffd54f' : '#4fc3f7';
      if (low && !this.reduceMotion) {
        // Pulse the warning bar so a timeout never feels like a rug-pull.
        const pulse = 0.6 + 0.4 * Math.sin(this.roundLeft * 12);
        ctx.globalAlpha = pulse;
      }
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.w * frac, 5);
      ctx.globalAlpha = 1;
    }

    // Expanding hit rings (drawn under asteroids).
    for (const r of this.rings) {
      const alpha = clamp(r.life / r.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // Asteroids.
    for (const a of this.asteroids) this._drawAsteroid(a);

    // Bullets with a short trail.
    for (const b of this.bullets) {
      ctx.save();
      ctx.strokeStyle = 'rgba(120,230,255,0.55)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.px, b.py);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.shadowColor = '#4fe3ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#c9fbff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Ship (with a little recoil kickback along the aim line).
    const cx = this.w / 2;
    const cy = this.h / 2;
    const ang = Math.atan2(this.aim.y - cy, this.aim.x - cx);
    this._drawShip(cx - Math.cos(ang) * this.recoil, cy - Math.sin(ang) * this.recoil, ang);

    // Muzzle flash.
    if (this.muzzle) {
      const a = clamp(this.muzzle.life / 0.08, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#e8fbff';
      ctx.shadowColor = '#4fe3ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(this.muzzle.x, this.muzzle.y, 7, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Particles.
    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.text) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.font = `bold 20px ${FONT}`;
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

    // Countdown numbers.
    if (this.state === 'countdown') this._drawCountdown();

    if (this.flash) {
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(-40, -40, this.w + 80, this.h + 80);
    }
    ctx.restore();
  }

  _drawCountdown() {
    const ctx = this.ctx;
    const n = Math.ceil(this.countdownLeft);
    const label = n <= 0 ? 'GO!' : String(n);
    const frac = this.countdownLeft - Math.floor(this.countdownLeft); // 1 → 0 within the second
    // The zoom is motion — hold at 1.0 under reduced motion (keep only the fade).
    const scale = this.reduceMotion ? 1 : 1 + (1 - frac) * 0.6;
    ctx.save();
    ctx.globalAlpha = clamp(frac + 0.15, 0, 1);
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(79,195,247,0.9)';
    ctx.lineWidth = 4;
    ctx.font = `bold 88px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(79,195,247,0.8)';
    ctx.shadowBlur = 24;
    ctx.strokeText(label, 0, 0);
    ctx.fillText(label, 0, 0);
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
      const tw = this.reduceMotion ? 0.7 : 0.5 + 0.5 * Math.sin(s.tw);
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
    ctx.font = `bold ${Math.round(a.radius * 0.85)}px ${FONT}`;
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
    // engine glow (flicker frozen under reduced motion)
    const flick = this.reduceMotion ? 3 : rand(0, 6);
    ctx.fillStyle = 'rgba(79,227,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-24 - flick, 0);
    ctx.lineTo(-14, 6);
    ctx.closePath();
    ctx.fill();
    // soft hull glow
    ctx.shadowColor = 'rgba(79,195,247,0.7)';
    ctx.shadowBlur = 12;
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
