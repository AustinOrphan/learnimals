/**
 * ProgressTracker — records gameplay activity to localStorage.
 *
 * BaseGame calls recordActivity() on every tracked event (game start/end,
 * correct/incorrect answer, level complete). Previously this was a no-op
 * placeholder missing recordActivity entirely, which threw and made every
 * BaseGame game unplayable.
 */
export default class ProgressTracker {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'learnimals_progress';
    this.progress = this.load();
  }

  load() {
    const empty = { activities: [], bySubject: {}, totals: { activities: 0 } };
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? { ...empty, ...JSON.parse(raw) } : empty;
    } catch {
      return empty;
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch {
      // storage unavailable (private mode / quota) — keep in-memory only
    }
  }

  /**
   * Record a gameplay activity.
   * @param {Object} activity - { type, subject, gameType, difficulty, level, score, ... }
   * @returns {Object} the stored entry
   */
  recordActivity(activity = {}) {
    const entry = { ...activity, timestamp: Date.now() };
    this.progress.activities.push(entry);
    // cap the log so it cannot grow unbounded
    if (this.progress.activities.length > 500) {
      this.progress.activities = this.progress.activities.slice(-500);
    }
    this.progress.totals.activities += 1;
    if (activity.subject) {
      if (!this.progress.bySubject[activity.subject]) {
        this.progress.bySubject[activity.subject] = { activities: 0 };
      }
      this.progress.bySubject[activity.subject].activities += 1;
    }
    this.save();
    return entry;
  }

  // Back-compat alias.
  track(data) {
    return this.recordActivity(data);
  }

  getProgress() {
    return this.progress;
  }
}
