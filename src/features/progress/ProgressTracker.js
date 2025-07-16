/**
 * Mock ProgressTracker - Placeholder for future implementation
 * This file is created to allow BaseGame to import it without errors
 */

export default class ProgressTracker {
  constructor() {
    this.progress = {};
  }
  
  track(_data) {
    // Placeholder method
  }
  
  getProgress() {
    return this.progress;
  }
}