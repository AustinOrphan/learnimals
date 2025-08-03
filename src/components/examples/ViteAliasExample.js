/**
 * Example component demonstrating Vite alias usage
 * 
 * This component shows how to use the configured path aliases
 * for cleaner, more maintainable imports.
 */

// Using aliases for cleaner imports
import { logger } from '@utils/logger.js';
import { Modal } from '@components/ui/Modal.js';
import { themeManager } from '@utils/themeManager.js';
import config from '@config';

/**
 * Example component that demonstrates Vite alias usage
 * 
 * Before aliases:
 * import { logger } from '../../utils/logger.js';
 * import { Modal } from '../ui/Modal.js';
 * 
 * After aliases:
 * import { logger } from '@utils/logger.js';
 * import { Modal } from '@components/ui/Modal.js';
 */
export class ViteAliasExample {
  constructor(element) {
    this.element = element;
    this.modal = null;
    this.init();
  }

  init() {
    logger.info('ViteAliasExample: Initializing component');
    
    // Create a demo button
    this.createDemoButton();
    
    // Show current configuration
    this.displayConfig();
  }

  createDemoButton() {
    const button = document.createElement('button');
    button.textContent = 'Test Vite Aliases';
    button.className = 'btn btn-primary';
    button.addEventListener('click', () => this.showAliasDemo());
    
    this.element.appendChild(button);
  }

  displayConfig() {
    const configDiv = document.createElement('div');
    configDiv.className = 'config-display';
    configDiv.innerHTML = `
      <h3>Current Configuration</h3>
      <p><strong>App Name:</strong> ${config.appName || 'Learnimals'}</p>
      <p><strong>Version:</strong> ${config.version || '1.0.0'}</p>
      <p><strong>Environment:</strong> ${config.environment || 'development'}</p>
    `;
    
    this.element.appendChild(configDiv);
  }

  showAliasDemo() {
    logger.info('ViteAliasExample: Showing alias demo');
    
    // Use the Modal component from @components/ui/Modal.js
    this.modal = new Modal({
      title: 'Vite Aliases Working!',
      content: this.createDemoContent(),
      onClose: () => {
        logger.info('ViteAliasExample: Demo modal closed');
      }
    });
    
    this.modal.open();
  }

  createDemoContent() {
    return `
      <div class="alias-demo-content">
        <h4>✅ Path Aliases Working</h4>
        <p>This modal was imported using:</p>
        <code>import { Modal } from '@components/ui/Modal.js';</code>
        
        <h4>Available Aliases:</h4>
        <ul>
          <li><code>@</code> → <code>./src</code></li>
          <li><code>@components</code> → <code>./src/components</code></li>
          <li><code>@utils</code> → <code>./src/utils</code></li>
          <li><code>@services</code> → <code>./src/services</code></li>
          <li><code>@features</code> → <code>./src/features</code></li>
          <li><code>@styles</code> → <code>./src/styles</code></li>
          <li><code>@pages</code> → <code>./src/pages</code></li>
          <li><code>@templates</code> → <code>./src/templates</code></li>
          <li><code>@config</code> → <code>./src/config.js</code></li>
          <li><code>@public</code> → <code>./public</code></li>
        </ul>
        
        <h4>Benefits:</h4>
        <ul>
          <li>Cleaner, more readable imports</li>
          <li>No more relative path confusion</li>
          <li>Easier refactoring and file moves</li>
          <li>IDE auto-completion support</li>
          <li>Consistent across development and testing</li>
        </ul>
        
        <p><strong>Current Theme:</strong> ${themeManager.getCurrentTheme()}</p>
      </div>
    `;
  }

  destroy() {
    if (this.modal) {
      this.modal.close();
    }
    logger.info('ViteAliasExample: Component destroyed');
  }
}

// Example of how to use in HTML pages
export function initViteAliasExample() {
  const containers = document.querySelectorAll('[data-component="vite-alias-example"]');
  
  containers.forEach(container => {
    new ViteAliasExample(container);
  });
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViteAliasExample);
} else {
  initViteAliasExample();
}