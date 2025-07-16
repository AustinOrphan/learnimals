/**
 * Debug script to test navbarLoader import behavior
 */

// Set up minimal test environment
global.window = {
  location: { hostname: 'localhost' },
  createLogger: () => ({
    debug: (...args) => console.log('[DEBUG]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    info: (...args) => console.info('[INFO]', ...args),
  })
};

global.document = {
  currentScript: {
    src: 'http://localhost:3000/src/components/layout/navbarLoader.js'
  },
  getElementById: (id) => {
    console.log(`Getting element: ${id}`);
    if (id === 'navbar-placeholder') {
      return {
        innerHTML: '',
        set innerHTML(value) {
          console.log('Setting innerHTML:', value.slice(0, 100) + '...');
        }
      };
    }
    return null;
  },
  dispatchEvent: (event) => {
    console.log('Dispatching event:', event.type);
  }
};

global.fetch = async (url) => {
  console.log('Fetch called for:', url);
  return {
    ok: true,
    text: () => {
      console.log('Returning mock navbar HTML');
      return Promise.resolve('<nav>Mock navbar</nav>');
    }
  };
};

global.CustomEvent = function(type) {
  this.type = type;
  console.log('CustomEvent created:', type);
};

console.log('About to import navbarLoader...');
const start = Date.now();

import('./src/components/layout/navbarLoader.js')
  .then(() => {
    const end = Date.now();
    console.log(`Import completed in ${end - start}ms`);
  })
  .catch((error) => {
    const end = Date.now();
    console.log(`Import failed in ${end - start}ms:`, error);
  });

// Wait and see if it completes
setTimeout(() => {
  console.log('Timeout reached - import may be hanging');
  process.exit(1);
}, 5000);