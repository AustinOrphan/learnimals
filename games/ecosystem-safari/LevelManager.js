// Guided-levels controller logic: holds the ordered levels, tracks progress, and
// decides win/lose from an engine ecosystem-state snapshot. Pure and DOM-free.

export default class LevelManager {
  constructor(levels) {
    this.levels = levels;
    this.current = 0;
    // Transient per-attempt trackers (reset via resetAttempt on each (re)start).
    this._healthHeldSince = null;
  }

  get length() {
    return this.levels.length;
  }

  getLevel(i) {
    return this.levels[i] || null;
  }

  get currentLevel() {
    return this.levels[this.current] || null;
  }

  advance() {
    this.current = Math.min(this.current + 1, this.levels.length - 1);
    this.resetAttempt();
    return this.currentLevel;
  }

  reset() {
    this.current = 0;
    this.resetAttempt();
  }

  resetAttempt() {
    this._healthHeldSince = null;
  }

  /** Which required species are currently alive (present with a positive population). */
  _alive(state) {
    return new Set(state.populations.filter(p => p.currentPopulation > 0.5).map(p => p.id));
  }

  /**
   * @param {Object} level - a level definition
   * @param {Object} state - engine.getEcosystemState()
   * @param {number} elapsedSec - seconds since this attempt started
   * @returns {{status:'playing'|'won'|'lost', reason:string}}
   */
  evaluateGoal(level, state, elapsedSec) {
    const goal = level.goal;
    const alive = this._alive(state);

    switch (goal.type) {
      case 'survive': {
        const missing = goal.requires.filter(id => !alive.has(id));
        if (missing.length) return { status: 'lost', reason: `${missing[0]} died out` };
        if (elapsedSec >= goal.durationSec) return { status: 'won', reason: 'balanced' };
        return { status: 'playing', reason: '' };
      }
      case 'noExtinctions': {
        const missing = goal.requires.filter(id => !alive.has(id));
        if (missing.length) return { status: 'lost', reason: `${missing[0]} died out` };
        if (elapsedSec >= goal.durationSec) return { status: 'won', reason: 'survived' };
        return { status: 'playing', reason: '' };
      }
      case 'reachHealth': {
        if (state.health >= goal.healthTarget) {
          if (this._healthHeldSince == null) this._healthHeldSince = elapsedSec;
          if (elapsedSec - this._healthHeldSince >= goal.holdSec) {
            return { status: 'won', reason: 'healthy' };
          }
        } else {
          this._healthHeldSince = null;
        }
        if (elapsedSec >= goal.timeoutSec) return { status: 'lost', reason: 'ran out of time' };
        return { status: 'playing', reason: '' };
      }
      case 'biodiversity': {
        const count = state.populations.filter(p => p.currentPopulation > 0.5).length;
        if (count < goal.minSpecies) return { status: 'lost', reason: 'too many species died' };
        if (elapsedSec >= goal.timeoutSec)
          return { status: 'won', reason: 'diverse and resilient' };
        return { status: 'playing', reason: '' };
      }
      default:
        return { status: 'playing', reason: '' };
    }
  }
}
