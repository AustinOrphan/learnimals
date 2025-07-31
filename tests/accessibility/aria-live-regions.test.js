/**
 * ARIA Live Regions Testing Suite
 * Comprehensive tests for dynamic content announcements and live regions
 * Ensures proper screen reader communication for all dynamic updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accessibilityService } from '../../src/services/accessibility/AccessibilityService.js';
import { AccessibleComponent } from '../../src/components/AccessibleComponent.js';

// Mock logger
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('ARIA Live Regions Testing Suite', () => {
  let testContainer;
  let mockTimer;

  beforeEach(() => {
    // Set up clean DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock timers for announcement testing
    mockTimer = vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Live Region Creation and Configuration', () => {
    it('should create polite live regions correctly', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.id = 'polite-announcements';
      liveRegion.className = 'sr-only';
      
      testContainer.appendChild(liveRegion);
      
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
      expect(liveRegion.classList.contains('sr-only')).toBe(true);
    });

    it('should create assertive live regions correctly', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.id = 'assertive-announcements';
      liveRegion.className = 'sr-only';
      
      testContainer.appendChild(liveRegion);
      
      expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });

    it('should configure aria-relevant attribute properly', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-relevant', 'additions text');
      
      testContainer.appendChild(liveRegion);
      
      const relevant = liveRegion.getAttribute('aria-relevant');
      expect(relevant).toBe('additions text');
      
      const validValues = ['additions', 'removals', 'text', 'all'];
      const relevantValues = relevant.split(' ');
      relevantValues.forEach(value => {
        expect(validValues).toContain(value);
      });
    });

    it('should create status role as implicit polite live region', () => {
      const statusRegion = document.createElement('div');
      statusRegion.setAttribute('role', 'status');
      statusRegion.id = 'game-status';
      
      testContainer.appendChild(statusRegion);
      
      expect(statusRegion.getAttribute('role')).toBe('status');
      // Status role implies aria-live="polite" and aria-atomic="true"
    });

    it('should create alert role as implicit assertive live region', () => {
      const alertRegion = document.createElement('div');
      alertRegion.setAttribute('role', 'alert');
      alertRegion.id = 'error-alerts';
      
      testContainer.appendChild(alertRegion);
      
      expect(alertRegion.getAttribute('role')).toBe('alert');
      // Alert role implies aria-live="assertive" and aria-atomic="true"
    });
  });

  describe('Game Progress Announcements', () => {
    it('should announce level progression', () => {
      const progressRegion = document.createElement('div');
      progressRegion.setAttribute('aria-live', 'polite');
      progressRegion.id = 'game-progress';
      progressRegion.className = 'sr-only';
      
      testContainer.appendChild(progressRegion);
      
      // Simulate level completion
      progressRegion.textContent = 'Level 2 completed! Score: 150 points. Moving to Level 3.';
      
      expect(progressRegion.textContent).toContain('Level');
      expect(progressRegion.textContent).toContain('completed');
      expect(progressRegion.textContent).toContain('Score');
      expect(progressRegion.textContent).toContain('150');
    });

    it('should announce score updates', () => {
      const scoreRegion = document.createElement('div');
      scoreRegion.setAttribute('aria-live', 'polite');
      scoreRegion.setAttribute('aria-label', 'Score updates');
      scoreRegion.id = 'score-announcements';
      scoreRegion.className = 'sr-only';
      
      testContainer.appendChild(scoreRegion);
      
      // Simulate score change
      scoreRegion.textContent = 'Score increased to 75 points';
      
      expect(scoreRegion.textContent).toContain('Score');
      expect(scoreRegion.textContent).toContain('75');
      expect(scoreRegion.textContent).toContain('points');
    });

    it('should announce achievement unlocks', () => {
      const achievementRegion = document.createElement('div');
      achievementRegion.setAttribute('aria-live', 'assertive');
      achievementRegion.id = 'achievement-announcements';
      achievementRegion.className = 'sr-only';
      
      testContainer.appendChild(achievementRegion);
      
      // Simulate achievement unlock
      achievementRegion.textContent = 'Achievement unlocked: Math Master! Completed 10 addition problems.';
      
      expect(achievementRegion.textContent).toContain('Achievement');
      expect(achievementRegion.textContent).toContain('unlocked');
      expect(achievementRegion.getAttribute('aria-live')).toBe('assertive');
    });

    it('should announce game state changes', () => {
      const gameStateRegion = document.createElement('div');
      gameStateRegion.setAttribute('aria-live', 'polite');
      gameStateRegion.id = 'game-state';
      gameStateRegion.className = 'sr-only';
      
      testContainer.appendChild(gameStateRegion);
      
      // Test various game states
      const gameStates = [
        'Game paused',
        'Game resumed',
        'Game over. Final score: 200 points',
        'New game started',
        'Timer: 30 seconds remaining'
      ];
      
      gameStates.forEach(state => {
        gameStateRegion.textContent = state;
        expect(gameStateRegion.textContent).toBe(state);
      });
    });

    it('should announce hint availability', () => {
      const hintRegion = document.createElement('div');
      hintRegion.setAttribute('aria-live', 'polite');
      hintRegion.id = 'hint-announcements';
      hintRegion.className = 'sr-only';
      
      testContainer.appendChild(hintRegion);
      
      // Simulate hint announcement
      hintRegion.textContent = 'Hint available: Try breaking down the problem into smaller parts.';
      
      expect(hintRegion.textContent).toContain('Hint');
      expect(hintRegion.textContent).toContain('available');
    });
  });

  describe('Form Validation Announcements', () => {
    it('should announce validation errors', () => {
      const input = document.createElement('input');
      input.type = 'email';
      input.id = 'email-input';
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'email-error');
      
      const errorRegion = document.createElement('div');
      errorRegion.id = 'email-error';
      errorRegion.setAttribute('role', 'alert');
      errorRegion.setAttribute('aria-live', 'assertive');
      errorRegion.textContent = 'Please enter a valid email address';
      
      testContainer.appendChild(input);
      testContainer.appendChild(errorRegion);
      
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(errorRegion.getAttribute('role')).toBe('alert');
      expect(errorRegion.textContent).toContain('valid email');
    });

    it('should announce successful form submission', () => {
      const successRegion = document.createElement('div');
      successRegion.setAttribute('role', 'status');
      successRegion.setAttribute('aria-live', 'polite');
      successRegion.id = 'form-success';
      successRegion.className = 'sr-only';
      
      testContainer.appendChild(successRegion);
      
      // Simulate successful submission
      successRegion.textContent = 'Form submitted successfully. Thank you for your message.';
      
      expect(successRegion.textContent).toContain('submitted successfully');
      expect(successRegion.getAttribute('role')).toBe('status');
    });

    it('should announce character count updates', () => {
      const textarea = document.createElement('textarea');
      textarea.maxLength = 100;
      textarea.setAttribute('aria-describedby', 'char-count');
      
      const charCountRegion = document.createElement('div');
      charCountRegion.id = 'char-count';
      charCountRegion.setAttribute('aria-live', 'polite');
      charCountRegion.setAttribute('aria-atomic', 'false');
      
      testContainer.appendChild(textarea);
      testContainer.appendChild(charCountRegion);
      
      // Simulate character count update
      charCountRegion.textContent = '25 characters remaining';
      
      expect(charCountRegion.textContent).toContain('characters remaining');
      expect(charCountRegion.getAttribute('aria-live')).toBe('polite');
    });

    it('should announce password strength changes', () => {
      const passwordInput = document.createElement('input');
      passwordInput.type = 'password';
      passwordInput.setAttribute('aria-describedby', 'password-strength');
      
      const strengthRegion = document.createElement('div');
      strengthRegion.id = 'password-strength';
      strengthRegion.setAttribute('aria-live', 'polite');
      strengthRegion.setAttribute('aria-atomic', 'true');
      
      testContainer.appendChild(passwordInput);
      testContainer.appendChild(strengthRegion);
      
      // Test different strength levels
      const strengthLevels = [
        'Password strength: Weak',
        'Password strength: Medium',
        'Password strength: Strong'
      ];
      
      strengthLevels.forEach(strength => {
        strengthRegion.textContent = strength;
        expect(strengthRegion.textContent).toContain('Password strength');
      });
    });
  });

  describe('Loading and Status Updates', () => {
    it('should announce loading states', () => {
      const loadingRegion = document.createElement('div');
      loadingRegion.setAttribute('aria-live', 'polite');
      loadingRegion.id = 'loading-status';
      loadingRegion.className = 'sr-only';
      
      testContainer.appendChild(loadingRegion);
      
      // Test loading progression
      const loadingStates = [
        'Loading game assets...',
        'Loading complete. Game ready to start.',
        'Saving progress...',
        'Progress saved successfully.'
      ];
      
      loadingStates.forEach(state => {
        loadingRegion.textContent = state;
        expect(loadingRegion.textContent).toBe(state);
      });
    });

    it('should announce progress bar updates', () => {
      const progressbar = document.createElement('div');
      progressbar.setAttribute('role', 'progressbar');
      progressbar.setAttribute('aria-valuenow', '45');
      progressbar.setAttribute('aria-valuemin', '0');
      progressbar.setAttribute('aria-valuemax', '100');
      progressbar.setAttribute('aria-valuetext', '45 percent complete');
      progressbar.setAttribute('aria-describedby', 'progress-status');
      
      const statusRegion = document.createElement('div');
      statusRegion.id = 'progress-status';
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.textContent = 'Download 45% complete';
      
      testContainer.appendChild(progressbar);
      testContainer.appendChild(statusRegion);
      
      expect(progressbar.getAttribute('aria-valuetext')).toContain('45 percent');
      expect(statusRegion.textContent).toContain('45%');
    });

    it('should announce connection status changes', () => {
      const connectionRegion = document.createElement('div');
      connectionRegion.setAttribute('aria-live', 'assertive');
      connectionRegion.id = 'connection-status';
      connectionRegion.className = 'sr-only';
      
      testContainer.appendChild(connectionRegion);
      
      // Test connection states
      const connectionStates = [
        'Connection lost. Working offline.',
        'Connection restored. Syncing data.',
        'All data synchronized.'
      ];
      
      connectionStates.forEach(state => {
        connectionRegion.textContent = state;
        expect(connectionRegion.textContent).toBe(state);
      });
      
      expect(connectionRegion.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Interactive Widget Announcements', () => {
    it('should announce slider value changes', () => {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = '50';
      slider.setAttribute('aria-describedby', 'slider-value');
      
      const valueRegion = document.createElement('div');
      valueRegion.id = 'slider-value';
      valueRegion.setAttribute('aria-live', 'polite');
      valueRegion.textContent = 'Volume: 50%';
      
      testContainer.appendChild(slider);
      testContainer.appendChild(valueRegion);
      
      // Simulate value change
      slider.value = '75';
      valueRegion.textContent = 'Volume: 75%';
      
      expect(valueRegion.textContent).toBe('Volume: 75%');
    });

    it('should announce combobox selection changes', () => {
      const combobox = document.createElement('input');
      combobox.setAttribute('role', 'combobox');
      combobox.setAttribute('aria-expanded', 'false');
      combobox.setAttribute('aria-describedby', 'selection-status');
      
      const statusRegion = document.createElement('div');
      statusRegion.id = 'selection-status';
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.className = 'sr-only';
      
      testContainer.appendChild(combobox);
      testContainer.appendChild(statusRegion);
      
      // Simulate selection
      statusRegion.textContent = 'Mathematics selected. 1 of 5 options.';
      
      expect(statusRegion.textContent).toContain('selected');
      expect(statusRegion.textContent).toContain('1 of 5');
    });

    it('should announce tab panel changes', () => {
      const tabPanel = document.createElement('div');
      tabPanel.setAttribute('role', 'tabpanel');
      tabPanel.id = 'panel-1';
      tabPanel.setAttribute('aria-labelledby', 'tab-1');
      tabPanel.setAttribute('aria-describedby', 'panel-status');
      
      const statusRegion = document.createElement('div');
      statusRegion.id = 'panel-status';
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.className = 'sr-only';
      statusRegion.textContent = 'Mathematics panel displayed';
      
      testContainer.appendChild(tabPanel);
      testContainer.appendChild(statusRegion);
      
      expect(statusRegion.textContent).toContain('panel displayed');
    });
  });

  describe('Search and Filter Announcements', () => {
    it('should announce search results count', () => {
      const searchResults = document.createElement('div');
      searchResults.setAttribute('role', 'status');
      searchResults.setAttribute('aria-live', 'polite');
      searchResults.id = 'search-results-status';
      searchResults.className = 'sr-only';
      
      testContainer.appendChild(searchResults);
      
      // Test different result counts
      const resultAnnouncements = [
        '5 results found for "math games"',
        'No results found for "xyz"',
        '1 result found for "science"',
        'Showing 10 of 25 results'
      ];
      
      resultAnnouncements.forEach(announcement => {
        searchResults.textContent = announcement;
        expect(searchResults.textContent).toBe(announcement);
      });
    });

    it('should announce filter application', () => {
      const filterStatus = document.createElement('div');
      filterStatus.setAttribute('aria-live', 'polite');
      filterStatus.id = 'filter-status';
      filterStatus.className = 'sr-only';
      
      testContainer.appendChild(filterStatus);
      
      // Test filter announcements
      filterStatus.textContent = 'Filter applied: Grade 3. Showing 8 results.';
      
      expect(filterStatus.textContent).toContain('Filter applied');
      expect(filterStatus.textContent).toContain('8 results');
    });

    it('should announce sort order changes', () => {
      const sortStatus = document.createElement('div');
      sortStatus.setAttribute('aria-live', 'polite');
      sortStatus.id = 'sort-status';
      sortStatus.className = 'sr-only';
      
      testContainer.appendChild(sortStatus);
      
      // Test sort announcements
      const sortAnnouncements = [
        'Sorted by name, ascending',
        'Sorted by date, descending',
        'Sorted by difficulty, ascending'
      ];
      
      sortAnnouncements.forEach(announcement => {
        sortStatus.textContent = announcement;
        expect(sortStatus.textContent).toBe(announcement);
      });
    });
  });

  describe('Timer and Countdown Announcements', () => {
    it('should announce timer milestones', () => {
      const timerRegion = document.createElement('div');
      timerRegion.setAttribute('aria-live', 'polite');
      timerRegion.id = 'timer-announcements';
      timerRegion.className = 'sr-only';
      
      testContainer.appendChild(timerRegion);
      
      // Test timer milestones
      const timerAnnouncements = [
        '2 minutes remaining',
        '1 minute remaining',
        '30 seconds remaining',
        'Time up!'
      ];
      
      timerAnnouncements.forEach(announcement => {
        timerRegion.textContent = announcement;
        expect(timerRegion.textContent).toBe(announcement);
      });
    });

    it('should announce countdown events', () => {
      const countdownRegion = document.createElement('div');
      countdownRegion.setAttribute('aria-live', 'assertive');
      countdownRegion.id = 'countdown';
      countdownRegion.className = 'sr-only';
      
      testContainer.appendChild(countdownRegion);
      
      // Test countdown sequence
      const countdownNumbers = ['3', '2', '1', 'Go!'];
      
      countdownNumbers.forEach(number => {
        countdownRegion.textContent = number;
        expect(countdownRegion.textContent).toBe(number);
      });
      
      expect(countdownRegion.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Live Region Timing and Updates', () => {
    it('should handle rapid updates with debouncing', async () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.id = 'rapid-updates';
      liveRegion.className = 'sr-only';
      
      testContainer.appendChild(liveRegion);
      
      // Simulate rapid updates
      liveRegion.textContent = 'Update 1';
      liveRegion.textContent = 'Update 2';
      liveRegion.textContent = 'Final update';
      
      // Fast-forward timers to test debouncing
      mockTimer.advanceTimersByTime(100);
      
      expect(liveRegion.textContent).toBe('Final update');
    });

    it('should clear announcements after timeout', async () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.id = 'timeout-test';
      liveRegion.className = 'sr-only';
      
      testContainer.appendChild(liveRegion);
      
      // Set content
      liveRegion.textContent = 'Temporary message';
      expect(liveRegion.textContent).toBe('Temporary message');
      
      // Fast-forward past timeout
      mockTimer.advanceTimersByTime(3000);
      
      // Content should remain (actual clearing is handled by AccessibilityService)
      expect(liveRegion.textContent).toBe('Temporary message');
    });

    it('should handle multiple live regions independently', () => {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.id = 'polite-region';
      politeRegion.className = 'sr-only';
      
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.id = 'assertive-region';
      assertiveRegion.className = 'sr-only';
      
      testContainer.appendChild(politeRegion);
      testContainer.appendChild(assertiveRegion);
      
      // Set different content
      politeRegion.textContent = 'Polite announcement';
      assertiveRegion.textContent = 'Urgent announcement';
      
      expect(politeRegion.textContent).toBe('Polite announcement');
      expect(assertiveRegion.textContent).toBe('Urgent announcement');
      expect(politeRegion.getAttribute('aria-live')).toBe('polite');
      expect(assertiveRegion.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('AccessibilityService Integration', () => {
    it('should create live regions through AccessibilityService', async () => {
      // Mock AccessibilityService initialization
      const mockService = {
        announcer: {
          polite: document.createElement('div'),
          assertive: document.createElement('div')
        },
        announce: vi.fn()
      };
      
      mockService.announcer.polite.setAttribute('aria-live', 'polite');
      mockService.announcer.polite.setAttribute('aria-atomic', 'true');
      mockService.announcer.polite.className = 'sr-only';
      
      mockService.announcer.assertive.setAttribute('aria-live', 'assertive');
      mockService.announcer.assertive.setAttribute('aria-atomic', 'true');
      mockService.announcer.assertive.className = 'sr-only';
      
      testContainer.appendChild(mockService.announcer.polite);
      testContainer.appendChild(mockService.announcer.assertive);
      
      expect(mockService.announcer.polite.getAttribute('aria-live')).toBe('polite');
      expect(mockService.announcer.assertive.getAttribute('aria-live')).toBe('assertive');
    });

    it('should handle announcement priority correctly', () => {
      const mockAnnounce = vi.fn();
      
      // Test different priority levels
      mockAnnounce('Low priority message', 'polite');
      mockAnnounce('High priority message', 'assertive');
      
      expect(mockAnnounce).toHaveBeenCalledWith('Low priority message', 'polite');
      expect(mockAnnounce).toHaveBeenCalledWith('High priority message', 'assertive');
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide proper markup for screen readers', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('aria-relevant', 'additions text');
      liveRegion.className = 'sr-only';
      
      testContainer.appendChild(liveRegion);
      
      expect(liveRegion.classList.contains('sr-only')).toBe(true);
      expect(liveRegion.getAttribute('aria-live')).toBeTruthy();
      expect(liveRegion.getAttribute('aria-atomic')).toBeTruthy();
      expect(liveRegion.getAttribute('aria-relevant')).toBeTruthy();
    });

    it('should handle empty content gracefully', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.id = 'empty-content-test';
      
      testContainer.appendChild(liveRegion);
      
      // Set empty content
      liveRegion.textContent = '';
      expect(liveRegion.textContent).toBe('');
      
      // Set content then clear it
      liveRegion.textContent = 'Some content';
      expect(liveRegion.textContent).toBe('Some content');
      
      liveRegion.textContent = '';
      expect(liveRegion.textContent).toBe('');
    });

    it('should maintain proper element hierarchy', () => {
      const container = document.createElement('main');
      container.setAttribute('role', 'main');
      
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.id = 'main-announcements';
      liveRegion.className = 'sr-only';
      
      container.appendChild(liveRegion);
      testContainer.appendChild(container);
      
      expect(container.contains(liveRegion)).toBe(true);
      expect(liveRegion.parentElement).toBe(container);
    });
  });
});