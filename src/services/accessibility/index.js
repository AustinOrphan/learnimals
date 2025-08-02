/**
 * Accessibility Services Index
 * Main entry point for accessibility features in Learnimals
 */

import { accessibilityService } from './AccessibilityService.js';
import { accessibilityTester } from '../../utils/accessibilityTester.js';

// Initialize accessibility service when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAccessibility);
} else {
  initializeAccessibility();
}

/**
 * Initialize accessibility features
 */
async function initializeAccessibility() {
  try {
    await accessibilityService.initialize();

    // Add accessibility styles to page
    addAccessibilityStyles();

    // Set up global accessibility shortcuts
    setupGlobalShortcuts();

    // Run initial accessibility audit in development
    if (isDevelopment()) {
      setTimeout(() => runAccessibilityAudit(), 2000);
    }

    console.log('✅ Accessibility services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize accessibility services:', error);
  }
}

/**
 * Add accessibility styles to the page
 */
function addAccessibilityStyles() {
  // Check if accessibility styles are already loaded
  if (document.querySelector('link[href*="accessibility.css"]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/styles/base/accessibility.css';
  link.onerror = () => {
    console.warn('Could not load accessibility.css - styles may not be available');
  };

  document.head.appendChild(link);
}

/**
 * Set up global accessibility shortcuts
 */
function setupGlobalShortcuts() {
  document.addEventListener('keydown', e => {
    // Alt + A: Toggle accessibility panel
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      toggleAccessibilityPanel();
    }

    // Alt + T: Run accessibility test
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      runAccessibilityAudit();
    }

    // Alt + M: Toggle reduced motion
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      toggleReducedMotion();
    }

    // Alt + C: Toggle high contrast
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      toggleHighContrast();
    }
  });
}

/**
 * Toggle accessibility panel
 */
function toggleAccessibilityPanel() {
  let panel = document.getElementById('accessibility-panel');

  if (!panel) {
    panel = createAccessibilityPanel();
    document.body.appendChild(panel);
  }

  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    panel.querySelector('button').focus();
    accessibilityService.announce('Accessibility panel opened', 'polite');
  } else {
    accessibilityService.announce('Accessibility panel closed', 'polite');
  }
}

/**
 * Create accessibility control panel
 */
function createAccessibilityPanel() {
  const panel = document.createElement('div');
  panel.id = 'accessibility-panel';
  panel.className = 'accessibility-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'accessibility-panel-title');
  panel.setAttribute('aria-modal', 'false');

  const preferences = accessibilityService.getPreferences();

  panel.innerHTML = `
    <div class="accessibility-panel-content">
      <div class="accessibility-panel-header">
        <h2 id="accessibility-panel-title">Accessibility Settings</h2>
        <button class="accessibility-panel-close" aria-label="Close accessibility panel">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      
      <div class="accessibility-panel-body">
        <div class="accessibility-setting">
          <label>
            <input type="checkbox" id="reduced-motion" ${preferences.reducedMotion ? 'checked' : ''}>
            <span>Reduce motion and animations</span>
          </label>
          <p class="setting-description">Minimizes animations and transitions for those sensitive to motion.</p>
        </div>
        
        <div class="accessibility-setting">
          <label>
            <input type="checkbox" id="high-contrast" ${preferences.highContrast ? 'checked' : ''}>
            <span>High contrast mode</span>
          </label>
          <p class="setting-description">Increases contrast between text and background for better visibility.</p>
        </div>
        
        <div class="accessibility-setting">
          <label>
            <input type="checkbox" id="large-text" ${preferences.largeText ? 'checked' : ''}>
            <span>Large text</span>
          </label>
          <p class="setting-description">Increases text size across the site for better readability.</p>
        </div>
        
        <div class="accessibility-setting">
          <label>
            <input type="checkbox" id="dark-mode" ${preferences.darkMode ? 'checked' : ''}>
            <span>Dark mode</span>
          </label>
          <p class="setting-description">Uses dark colors to reduce eye strain in low light.</p>
        </div>
      </div>
      
      <div class="accessibility-panel-footer">
        <button class="btn btn-secondary" id="test-accessibility">Test Page Accessibility</button>
        <button class="btn btn-primary" id="save-preferences">Save Settings</button>
      </div>
    </div>
  `;

  // Add event listeners
  setupPanelEventListeners(panel);

  return panel;
}

/**
 * Set up event listeners for accessibility panel
 */
function setupPanelEventListeners(panel) {
  // Close button
  panel.querySelector('.accessibility-panel-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  // Preference checkboxes
  const checkboxes = panel.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      const preference = e.target.id.replace('-', '');
      const camelCase = preference.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      accessibilityService.updatePreference(camelCase, e.target.checked);
    });
  });

  // Test accessibility button
  panel.querySelector('#test-accessibility').addEventListener('click', () => {
    runAccessibilityAudit();
  });

  // Save preferences button
  panel.querySelector('#save-preferences').addEventListener('click', () => {
    accessibilityService.savePreferences();
    accessibilityService.announce('Accessibility preferences saved', 'polite');
    panel.style.display = 'none';
  });

  // Keyboard navigation
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      panel.style.display = 'none';
    }
  });
}

/**
 * Toggle reduced motion preference
 */
function toggleReducedMotion() {
  const preferences = accessibilityService.getPreferences();
  const newValue = !preferences.reducedMotion;
  accessibilityService.updatePreference('reducedMotion', newValue);
  accessibilityService.announce(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`, 'polite');
}

/**
 * Toggle high contrast preference
 */
function toggleHighContrast() {
  const preferences = accessibilityService.getPreferences();
  const newValue = !preferences.highContrast;
  accessibilityService.updatePreference('highContrast', newValue);
  accessibilityService.announce(
    `High contrast mode ${newValue ? 'enabled' : 'disabled'}`,
    'polite'
  );
}

/**
 * Run accessibility audit
 */
async function runAccessibilityAudit() {
  accessibilityService.announce('Running accessibility audit...', 'polite');

  try {
    const report = await accessibilityTester.runAudit();
    displayAuditResults(report);

    // Also run axe-core if available
    const axeResults = await accessibilityTester.runAxe();
    if (axeResults) {
      console.log('Axe accessibility results:', axeResults);
    }
  } catch (error) {
    console.error('Accessibility audit failed:', error);
    accessibilityService.announce('Accessibility audit failed', 'assertive');
  }
}

/**
 * Display audit results
 */
function displayAuditResults(report) {
  const existingResults = document.getElementById('accessibility-results');
  if (existingResults) {
    existingResults.remove();
  }

  const resultsPanel = document.createElement('div');
  resultsPanel.id = 'accessibility-results';
  resultsPanel.className = 'accessibility-results-panel';
  resultsPanel.setAttribute('role', 'dialog');
  resultsPanel.setAttribute('aria-labelledby', 'audit-results-title');

  const scoreColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'orange' : 'red';

  resultsPanel.innerHTML = `
    <div class="results-panel-content">
      <div class="results-panel-header">
        <h2 id="audit-results-title">Accessibility Audit Results</h2>
        <button class="results-panel-close" aria-label="Close results panel">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      
      <div class="results-summary">
        <div class="score-circle" style="border-color: ${scoreColor}">
          <span class="score-value" style="color: ${scoreColor}">${report.score}</span>
          <span class="score-label">Score</span>
        </div>
        
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value">${report.summary.passes}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="stat">
            <span class="stat-value">${report.summary.violations}</span>
            <span class="stat-label">Failed</span>
          </div>
          <div class="stat">
            <span class="stat-value">${report.summary.warnings}</span>
            <span class="stat-label">Warnings</span>
          </div>
        </div>
      </div>
      
      ${
        report.violations.length > 0
          ? `
        <div class="results-section">
          <h3>Issues Found</h3>
          <ul class="issues-list">
            ${report.violations
              .map(
                violation => `
              <li class="issue-item violation">
                <strong>${violation.test}:</strong> ${violation.error}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : ''
      }
      
      ${
        report.warnings.length > 0
          ? `
        <div class="results-section">
          <h3>Warnings</h3>
          <ul class="issues-list">
            ${report.warnings
              .map(
                warning => `
              <li class="issue-item warning">${warning}</li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : ''
      }
      
      <div class="results-actions">
        <button class="btn btn-secondary" id="export-results">Export Report</button>
        <button class="btn btn-primary" id="close-results">Close</button>
      </div>
    </div>
  `;

  // Add event listeners
  resultsPanel.querySelector('.results-panel-close').addEventListener('click', () => {
    resultsPanel.remove();
  });

  resultsPanel.querySelector('#close-results').addEventListener('click', () => {
    resultsPanel.remove();
  });

  resultsPanel.querySelector('#export-results').addEventListener('click', () => {
    accessibilityTester.exportReport(report);
  });

  resultsPanel.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      resultsPanel.remove();
    }
  });

  document.body.appendChild(resultsPanel);
  resultsPanel.querySelector('#close-results').focus();

  accessibilityService.announce(
    `Accessibility audit complete. Score: ${report.score} out of 100`,
    'polite'
  );
}

/**
 * Check if running in development mode
 */
function isDevelopment() {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('dev')
  );
}

/**
 * Public API for manual accessibility features
 */
window.Accessibility = {
  service: accessibilityService,
  tester: accessibilityTester,
  togglePanel: toggleAccessibilityPanel,
  runAudit: runAccessibilityAudit,
  toggleReducedMotion,
  toggleHighContrast,
};

// Export for module usage
export {
  accessibilityService,
  accessibilityTester,
  toggleAccessibilityPanel,
  runAccessibilityAudit,
  toggleReducedMotion,
  toggleHighContrast,
};
