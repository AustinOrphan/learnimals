import BaseGame from '../../components/games/BaseGame.js';
import EcosystemEngine from './EcosystemEngine.js';
import SpeciesManager from './SpeciesManager.js';
import HabitatBuilder from './HabitatBuilder.js';
import DiscoveryJournal from './DiscoveryJournal.js';
import LevelManager from './LevelManager.js';
import levels from './levels.js';

// Emoji per species id (no art assets). Producers first, then consumers, decomposer, pollinator.
const SPECIES_EMOJI = {
  grass: '🌿',
  oak_tree: '🌳',
  seaweed: '🪸',
  rabbit: '🐰',
  deer: '🦌',
  sea_turtle: '🐢',
  hawk: '🦅',
  wolf: '🐺',
  shark: '🦈',
  bacteria: '🦠',
  bee: '🐝',
};

// Per-habitat background gradient stops [top, bottom].
const HABITAT_BG = {
  grassland: ['#aee36b', '#5a9a2e'],
  forest: ['#5fa96a', '#20502c'],
  ocean: ['#4facfe', '#0a4d8c'],
};

const SIM_TICK_MS = 500; // engine ticks twice a second

export default class EcosystemSafariGame extends BaseGame {
  constructor(canvasId, options = {}) {
    super(canvasId, { gameType: 'ecosystem', subject: 'science', ...options });

    this.speciesManager = new SpeciesManager();
    this.habitatBuilder = new HabitatBuilder();
    this.discoveryJournal = new DiscoveryJournal();
    this.engine = new EcosystemEngine({});
    this.levelManager = new LevelManager(levels);

    this.creatures = []; // {id, emoji, x, y, driftPhase} — populated in Task 4
    this.state_ = null; // latest engine.getEcosystemState()
    this.elapsedSec = 0;
    this._simAccumMs = 0;
    this._attemptOver = false;
    this._challengeFired = false;

    this.loadCurrentLevel();
    this.wireControls();
    // NOTE: BaseGame's own constructor kicks off an async initialize() —
    // canvas/DOM setup runs synchronously, but it then `await`s loadAssets()
    // before calling setState('ready'), and that continuation only runs as a
    // microtask. So `this.state` is still 'loading' at this exact point;
    // calling start() here would hit BaseGame's "cannot start in current
    // state" guard and silently no-op the game loop (blank canvas, sim never
    // ticks). Start once BaseGame actually reports ready, in onInitialized()
    // below — the same pattern BubblePopGameTemplate uses.
  }

  onInitialized() {
    // BaseGame calls this once canvas/DOM setup + async asset loading finish
    // and state has moved to 'ready'. That's the right moment to start the loop.
    this.start(); // BaseGame: begins the loop, sets state 'playing'
  }

  /**
   * Resume the sim loop if it's currently paused, then load the current level.
   * Used by the Next/Retry/Restart buttons so a paused game doesn't stay
   * frozen after a level transition.
   */
  loadNextAttempt() {
    if (this.state === 'paused') this.resume();
    this.loadCurrentLevel();
  }

  /** Load the LevelManager's current level into the engine + UI. */
  loadCurrentLevel() {
    const level = this.levelManager.currentLevel;
    this.level_ = level;
    this.elapsedSec = 0;
    this._simAccumMs = 0;
    this._attemptOver = false;
    this._challengeFired = false;
    this.levelManager.resetAttempt();

    // Habitat → engine (bridge id → type).
    this.habitatBuilder.selectHabitat(level.habitat);
    const habitat = this.habitatBuilder.getCurrentHabitat();
    this.engine.reset();
    this.engine.addHabitat({ ...habitat, type: habitat.id });
    this.habitatBg = HABITAT_BG[level.habitat] || HABITAT_BG.grassland;

    // Starting species (pass full species objects).
    for (const entry of level.starting) {
      const sp = this.speciesManager.getSpecies(entry.species);
      if (sp) this.engine.addSpecies(sp, entry.population);
    }

    this.state_ = this.engine.getEcosystemState();
    this.rebuildCreatures(); // Task 4 (no-op-safe until then)
    this.buildPalette(level);
    this.updateGoalUI(level);
    this.setTip(level.intro);
    this.syncPanels();
    this.hideOverlays();
    document.getElementById('eco-goal')?.focus();
  }

  /** Build the tappable species palette for this level. */
  buildPalette(level) {
    const palette = document.getElementById('eco-palette');
    if (!palette) return;
    palette.innerHTML = '';
    for (const id of level.palette) {
      const sp = this.speciesManager.getSpecies(id);
      if (!sp) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eco-palette-item';
      btn.setAttribute('aria-label', `Add ${sp.name}, a ${this.roleLabel(sp)}`);
      btn.innerHTML = `<span class="eco-emoji" aria-hidden="true">${SPECIES_EMOJI[id] || '❓'}</span><span class="eco-name">${sp.name}</span>`;
      btn.addEventListener('click', () => this.addSpeciesByTap(id));
      palette.appendChild(btn);
    }
  }

  roleLabel(sp) {
    return sp.trophicLevel === 0
      ? 'decomposer'
      : sp.trophicLevel <= 1
        ? 'producer'
        : sp.trophicLevel >= 3
          ? 'predator'
          : 'herbivore';
  }

  /** Player taps a species: add it, or increase its population if already present. */
  addSpeciesByTap(id) {
    if (this.state !== 'playing' || this._attemptOver) return;
    const sp = this.speciesManager.getSpecies(id);
    if (!sp) return;
    const STARTING_POPULATION = 12;
    const TAP_INCREMENT = 8;
    const existing = this.state_?.populations.find(p => p.id === id);
    const amount = existing
      ? Math.round(existing.currentPopulation) + TAP_INCREMENT
      : STARTING_POPULATION;
    this.engine.addSpecies(sp, amount);
    this.playSound(440, 120);
    this.state_ = this.engine.getEcosystemState();
    this.rebuildCreatures();
    this.syncPanels();
  }

  /** Fixed-timestep simulation, driven by BaseGame's update(deltaTime, timestamp). */
  update(deltaTime, _timestamp) {
    if (this.state !== 'playing' || this._attemptOver) return;

    this.elapsedSec += deltaTime / 1000;
    this._simAccumMs += deltaTime;

    // Fire a scheduled challenge (e.g. drought) once.
    const ch = this.level_.challenge;
    if (ch && !this._challengeFired && this.elapsedSec >= ch.atSec) {
      this.engine.applyChallenge({ type: ch.type });
      this._challengeFired = true;
      this.setTip(`Sky: A ${ch.type} is here! Keep your species alive!`);
    }

    while (this._simAccumMs >= SIM_TICK_MS) {
      this.engine.update(SIM_TICK_MS);
      this._simAccumMs -= SIM_TICK_MS;
    }

    this.state_ = this.engine.getEcosystemState();
    this.updateCreatures(deltaTime); // Task 4 (safe no-op until then)
    this.syncPanels();
    this.maybeHint();

    const verdict = this.levelManager.evaluateGoal(this.level_, this.state_, this.elapsedSec);
    if (verdict.status === 'won') this.winLevel();
    else if (verdict.status === 'lost') this.loseLevel(verdict.reason);
  }

  /** Draw the habitat background. Creatures added in Task 4. */
  render() {
    const { ctx, canvas } = this;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, this.habitatBg[0]);
    grad.addColorStop(1, this.habitatBg[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.renderCreatures(); // Task 4 (safe no-op until then)
  }

  // --- DOM sync -----------------------------------------------------------
  syncPanels() {
    const s = this.state_;
    if (!s) return;
    const health = Math.round(s.health);
    const fill = document.getElementById('eco-health-fill');
    const label = document.getElementById('eco-health-label');
    if (fill) {
      fill.style.width = `${Math.max(0, Math.min(100, health))}%`;
      fill.style.background = health > 66 ? '#2ecc71' : health > 33 ? '#f1c40f' : '#e74c3c';
    }
    if (label) label.textContent = `Health: ${health}%`;

    this.syncPopulationPanel(s.populations);

    const timer = document.getElementById('eco-timer');
    if (timer) timer.textContent = this.timerText();
  }

  /**
   * Update the population panel rows in place instead of rebuilding them.
   * syncPanels runs every update() (~60fps); recreating each <li><button>
   * every frame destroys focus and drops the click listener a
   * keyboard/screen-reader user needs to open a species' fun-fact card. Rows
   * are keyed by a data-species attribute so existing rows are patched
   * (count, bar width, aria-label) without replacing the node; rows are only
   * added when a species newly appears and removed when it disappears.
   */
  syncPopulationPanel(populations) {
    const panel = document.getElementById('eco-population-panel');
    if (!panel) return;

    // Index existing rows by species id (avoids CSS.escape + repeated
    // attribute-selector queries, and lets us detect stale rows in one pass).
    const rows = new Map();
    for (const li of panel.querySelectorAll('li[data-species]')) {
      rows.set(li.dataset.species, li);
    }

    for (const p of populations) {
      const count = Math.round(p.currentPopulation);
      const barPct = Math.min(100, (p.currentPopulation / (p.maxPopulation || 100)) * 100);
      const label = `${p.name}: ${count}. Tap for facts.`;

      let li = rows.get(p.id);
      if (!li) {
        li = document.createElement('li');
        li.className = 'eco-pop-row';
        li.dataset.species = p.id;
        li.innerHTML = `<button type="button" class="eco-pop-btn">
            <span class="eco-emoji" aria-hidden="true">${SPECIES_EMOJI[p.id] || '❓'}</span>
            <span class="eco-pop-count"></span>
            <span class="eco-pop-bar" aria-hidden="true"><span></span></span>
          </button>`;
        li.querySelector('button').addEventListener('click', () => this.showFactCard(p.id));
        panel.appendChild(li);
        rows.set(p.id, li);
      }
      rows.delete(p.id); // remaining entries after the loop are stale rows

      const btn = li.querySelector('.eco-pop-btn');
      if (btn.getAttribute('aria-label') !== label) btn.setAttribute('aria-label', label);
      const countEl = li.querySelector('.eco-pop-count');
      if (countEl.textContent !== String(count)) countEl.textContent = String(count);
      const barFill = li.querySelector('.eco-pop-bar span');
      barFill.style.width = `${barPct}%`;
    }

    // Whatever is left in `rows` belongs to species no longer present.
    for (const li of rows.values()) li.remove();
  }

  timerText() {
    const g = this.level_.goal;
    const limit = g.durationSec || g.timeoutSec;
    if (!limit) return '';
    return `⏱ ${Math.max(0, Math.ceil(limit - this.elapsedSec))}s`;
  }

  updateGoalUI(level) {
    const el = document.getElementById('eco-goal');
    if (el) el.textContent = this.goalText(level);
  }

  goalText(level) {
    const g = level.goal;
    switch (g.type) {
      case 'survive':
      case 'noExtinctions':
        return `${level.title}: keep ${g.requires.map(id => SPECIES_EMOJI[id] || id).join(' ')} alive for ${g.durationSec}s`;
      case 'reachHealth':
        return `${level.title}: get ecosystem health to ${g.healthTarget}%`;
      case 'biodiversity':
        return `${level.title}: keep at least ${g.minSpecies} species alive`;
      default:
        return level.title;
    }
  }

  setTip(text) {
    const el = document.getElementById('eco-tip');
    if (el) el.textContent = text;
  }

  /** Occasionally surface a contextual hint when things look wrong. */
  maybeHint() {
    if (!this.state_ || this.state_.health >= 50) return;
    if (this._lastHintSec && this.elapsedSec - this._lastHintSec < 6) return;
    const hints = this.discoveryJournal.getContextualHints({
      ecosystemHealth: this.state_.health,
      species: this.state_.populations,
    });
    if (hints.length) {
      this.setTip(`Sky: ${hints[0].message}`);
      this._lastHintSec = this.elapsedSec;
    }
  }

  showFactCard(id) {
    const content = this.speciesManager.getEducationalContent(id);
    if (!content) return;
    const fact = content.facts[Math.floor(Math.random() * content.facts.length)];
    this.setTip(`${SPECIES_EMOJI[id] || ''} ${content.name}: ${fact}`);
  }

  // --- Win / lose ---------------------------------------------------------
  winLevel() {
    this._attemptOver = true;
    this.addScore(100);
    this.playSound(660, 200);
    const lesson = this.discoveryJournal.getLessonContent(this.level_.lesson);
    const lessonEl = document.getElementById('eco-win-lesson');
    if (lessonEl && lesson)
      lessonEl.textContent = `You discovered: ${lesson.title} — ${lesson.content.summary}`;
    const win = document.getElementById('eco-win');
    if (win) win.hidden = false;
    // Hide "Next" on the final level.
    const next = document.getElementById('eco-next');
    if (next)
      next.textContent =
        this.levelManager.current >= this.levelManager.length - 1 ? 'Play again' : 'Next level →';
    // Move focus into the overlay so screen-reader / keyboard users get the
    // win signal (role="alert" on #eco-win announces it, but focus still
    // needs to move there so subsequent Tab presses land inside the card).
    document.getElementById('eco-win-title')?.focus();
  }

  loseLevel(reason) {
    this._attemptOver = true;
    this.playSound(180, 300);
    const hintEl = document.getElementById('eco-lose-hint');
    if (hintEl) hintEl.textContent = `${reason ? reason + '. ' : ''}${this.level_.hint}`;
    const lose = document.getElementById('eco-lose');
    if (lose) lose.hidden = false;
    document.getElementById('eco-lose-title')?.focus();
  }

  hideOverlays() {
    document.getElementById('eco-win')?.setAttribute('hidden', '');
    document.getElementById('eco-lose')?.setAttribute('hidden', '');
  }

  wireControls() {
    document.getElementById('eco-next')?.addEventListener('click', () => {
      if (this.levelManager.current >= this.levelManager.length - 1) this.levelManager.reset();
      else this.levelManager.advance();
      this.loadNextAttempt();
    });
    document.getElementById('eco-retry')?.addEventListener('click', () => {
      this.loadNextAttempt();
    });
    document.getElementById('eco-restart')?.addEventListener('click', () => {
      this.loadNextAttempt();
    });
    document.getElementById('eco-pause')?.addEventListener('click', () => {
      if (this.state === 'paused') this.resume();
      else this.pause();
    });
    document
      .getElementById('eco-help')
      ?.addEventListener('click', () => this.setTip(this.level_.hint));
  }

  // --- Task 4 placeholders (no-op until implemented) ----------------------
  rebuildCreatures() {}
  updateCreatures(_dt) {}
  renderCreatures() {}
}
