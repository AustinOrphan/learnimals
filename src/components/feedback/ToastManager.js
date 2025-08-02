/**
 * ToastManager
 * Manages toast notifications with stacking, positioning, and lifecycle
 */

import FeedbackToast from './FeedbackToast.js';

class ToastManager {
  constructor() {
    this.toasts = new Map();
    this.maxToasts = 5;
    this.defaultPosition = 'top-right';
    this.stackSpacing = 80; // pixels between stacked toasts
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @returns {string} - Toast ID for management
   */
  show(options) {
    const toastId = this.generateToastId();
    const position = options.position || this.defaultPosition;

    // Limit number of toasts
    this.enforceMaxToasts(position);

    // Update stack indices for existing toasts in this position
    this.updateStackIndices(position);

    // Create new toast
    const toast = new FeedbackToast({
      ...options,
      id: toastId,
      position: position,
      stackIndex: 0,
      onDismiss: () => {
        this.remove(toastId);
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    });

    // Store toast
    this.toasts.set(toastId, {
      toast,
      position,
      createdAt: Date.now(),
    });

    // Show toast
    toast.show();

    return toastId;
  }

  /**
   * Remove a specific toast
   * @param {string} toastId - Toast ID to remove
   */
  async remove(toastId) {
    const toastData = this.toasts.get(toastId);
    if (!toastData) return;

    const { toast, position } = toastData;

    // Remove from tracking
    this.toasts.delete(toastId);

    // Dismiss toast
    await toast.dismiss();

    // Update stack positions for remaining toasts
    this.updateStackIndices(position);
  }

  /**
   * Remove all toasts
   * @param {string} [position] - Specific position to clear, or all if not specified
   */
  async clear(position = null) {
    const toastsToRemove = [];

    for (const [toastId, toastData] of this.toasts) {
      if (!position || toastData.position === position) {
        toastsToRemove.push(toastId);
      }
    }

    // Remove all matching toasts
    await Promise.all(toastsToRemove.map(id => this.remove(id)));
  }

  /**
   * Update toast with new content
   * @param {string} toastId - Toast ID to update
   * @param {Object} newOptions - New options to apply
   */
  update(toastId, newOptions) {
    const toastData = this.toasts.get(toastId);
    if (!toastData) return false;

    toastData.toast.update(newOptions);
    return true;
  }

  /**
   * Get toast by ID
   * @param {string} toastId - Toast ID
   * @returns {FeedbackToast|null} - Toast instance or null
   */
  getToast(toastId) {
    const toastData = this.toasts.get(toastId);
    return toastData ? toastData.toast : null;
  }

  /**
   * Get all active toasts
   * @param {string} [position] - Filter by position
   * @returns {Array} - Array of toast data
   */
  getToasts(position = null) {
    const results = [];

    for (const [toastId, toastData] of this.toasts) {
      if (!position || toastData.position === position) {
        results.push({
          id: toastId,
          toast: toastData.toast,
          position: toastData.position,
          createdAt: toastData.createdAt,
        });
      }
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Check if a toast exists
   * @param {string} toastId - Toast ID
   * @returns {boolean} - Whether toast exists
   */
  has(toastId) {
    return this.toasts.has(toastId);
  }

  /**
   * Get count of active toasts
   * @param {string} [position] - Filter by position
   * @returns {number} - Number of active toasts
   */
  count(position = null) {
    if (!position) {
      return this.toasts.size;
    }

    let count = 0;
    for (const toastData of this.toasts.values()) {
      if (toastData.position === position) {
        count++;
      }
    }
    return count;
  }

  /**
   * Set maximum number of toasts
   * @param {number} max - Maximum number of toasts
   */
  setMaxToasts(max) {
    this.maxToasts = Math.max(1, max);

    // Enforce new limit
    for (const position of this.getPositions()) {
      this.enforceMaxToasts(position);
    }
  }

  /**
   * Set default position for new toasts
   * @param {string} position - Default position
   */
  setDefaultPosition(position) {
    this.defaultPosition = position;
  }

  /**
   * Enforce maximum number of toasts for a position
   * @param {string} position - Toast position
   */
  enforceMaxToasts(position) {
    const positionToasts = this.getToasts(position);

    if (positionToasts.length >= this.maxToasts) {
      // Remove oldest toasts
      const toastsToRemove = positionToasts.slice(this.maxToasts - 1).map(t => t.id);

      toastsToRemove.forEach(id => this.remove(id));
    }
  }

  /**
   * Update stack indices for toasts in a position
   * @param {string} position - Toast position
   */
  updateStackIndices(position) {
    const positionToasts = this.getToasts(position);

    positionToasts.forEach((toastData, index) => {
      const { toast } = toastData;
      toast.options.stackIndex = index;
      toast.updateStackPosition();
    });
  }

  /**
   * Get all unique positions with active toasts
   * @returns {Array} - Array of position strings
   */
  getPositions() {
    const positions = new Set();

    for (const toastData of this.toasts.values()) {
      positions.add(toastData.position);
    }

    return Array.from(positions);
  }

  /**
   * Generate unique toast ID
   * @returns {string} - Unique toast ID
   */
  generateToastId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Pause auto-dismiss for all toasts
   * @param {string} [position] - Specific position or all
   */
  pauseAll(position = null) {
    for (const toastData of this.toasts.values()) {
      if (!position || toastData.position === position) {
        toastData.toast.pauseAutoDismiss();
      }
    }
  }

  /**
   * Resume auto-dismiss for all toasts
   * @param {string} [position] - Specific position or all
   */
  resumeAll(position = null) {
    for (const toastData of this.toasts.values()) {
      if (!position || toastData.position === position) {
        toastData.toast.resumeAutoDismiss();
      }
    }
  }

  /**
   * Show success toast (convenience method)
   * @param {string} message - Success message
   * @param {Object} [options] - Additional options
   * @returns {string} - Toast ID
   */
  success(message, options = {}) {
    return this.show({
      type: 'success',
      message,
      ...options,
    });
  }

  /**
   * Show error toast (convenience method)
   * @param {string} message - Error message
   * @param {Object} [options] - Additional options
   * @returns {string} - Toast ID
   */
  error(message, options = {}) {
    return this.show({
      type: 'error',
      message,
      duration: 6000, // Longer duration for errors
      ...options,
    });
  }

  /**
   * Show hint toast (convenience method)
   * @param {string} message - Hint message
   * @param {Object} [options] - Additional options
   * @returns {string} - Toast ID
   */
  hint(message, options = {}) {
    return this.show({
      type: 'hint',
      message,
      ...options,
    });
  }

  /**
   * Show progress toast (convenience method)
   * @param {string} message - Progress message
   * @param {Object} [options] - Additional options
   * @returns {string} - Toast ID
   */
  progress(message, options = {}) {
    return this.show({
      type: 'progress',
      message,
      duration: 5000,
      ...options,
    });
  }

  /**
   * Show achievement toast (convenience method)
   * @param {string} message - Achievement message
   * @param {Object} [options] - Additional options
   * @returns {string} - Toast ID
   */
  achievement(message, options = {}) {
    return this.show({
      type: 'achievement',
      message,
      duration: 8000, // Longer duration for achievements
      ...options,
    });
  }

  /**
   * Destroy all toasts and clean up
   */
  destroy() {
    // Clear all toasts
    this.clear();

    // Clear internal state
    this.toasts.clear();
  }
}

// Create global singleton instance
const toastManager = new ToastManager();

export default toastManager;
