// Service Worker for Learnimals PWA
// Served at the site root (see /serviceWorker.js shim) so its scope is '/',
// which covers the whole app (pages live under /). All asset paths below
// are root-absolute so they resolve correctly regardless of where this script
// is loaded from.
const CACHE_NAME = 'learnimals-cache-v7';
const OFFLINE_URL = '/pages/offline.html';
const ASSETS_TO_CACHE = [
  // HTML pages (only cache existing pages). Use '/index.html' (not a bare '/')
  // so the Pages subpath rewrite can anchor on the index.html segment; both
  // resolve to the homepage under a root deploy and under /learnimals/.
  '/index.html',
  OFFLINE_URL,
  '/subjects/math/',
  '/games/bubble-pop/',

  // CSS files (only cache existing CSS)
  '/styles/base/styles.css',
  '/styles/components/navbar.css',
  '/styles/components/bubblepop.css',
  '/subjects/math/math.css',
  '/subjects/science/science.css',
  '/subjects/reading/reading.css',
  '/subjects/art/art.css',

  // JavaScript files (only cache existing JS)
  '/config.js',
  '/main.js',
  '/themeInitializer.js',
  '/subjects/math/math.js',
  '/subjects/science/science.js',
  '/subjects/art/art.js',
  '/games/bubble-pop/BubblePopGameTemplate.js',
  '/games/bubble-pop/Bubble.js',
  '/games/word-scramble/wordScramble.js',
  '/utils/common.js',
  '/utils/themeManager.js',
  '/utils/themeManagerUtils.js',
  '/utils/themeRegistry.js',
  '/components/layout/navigation.js',
  '/components/layout/navbarLoader.js',
  '/components/layout/themeSwitcher.js',
  '/components/ui/Card.js',
  '/components/ui/Modal.js',

  // Images (core images only)
  '/public/images/logo.png',
  '/public/images/math-shark.png',
  '/public/images/science-parrot.png',
  '/public/images/science-parrot2.png',
  '/public/images/reading-panda.png',
  '/public/images/art-lion.png',
  '/public/images/mango-swimming.png',
  '/public/images/rocket.png',
  '/public/images/cody-cat2.png',

  // Components
  '/components/layout/navbar.html',
];

// Install event - Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');

        // Cache files individually to handle failures gracefully
        const cachePromises = ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(error => {
            console.warn(`Failed to cache ${url}:`, error);
            // Don't fail the entire installation for missing files
            return null;
          });
        });

        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('Service worker installation complete');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Serve from cache, fallback to network with caching
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(response => {
          // Don't cache non-successful responses or non-GET requests
          if (!response || response.status !== 200 || event.request.method !== 'GET') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(error => {
          // If offline and requesting an HTML page, show the offline page.
          const accept = event.request.headers.get('accept') || '';
          if (event.request.mode === 'navigate' || accept.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }

          console.error('Fetching failed:', error);
          throw error;
        });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForm());
  }
});

// Helper function to sync contact form data
async function syncContactForm() {
  const db = await openDB();
  const pendingForms = await db.getAll('pending-forms');

  // Send each pending form data
  const sendPromises = pendingForms.map(async formData => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await db.delete('pending-forms', formData.id);
      }
    } catch (error) {
      console.error('Form sync failed:', error);
    }
  });

  await Promise.all(sendPromises);
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('learnimals-offline-db', 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore('pending-forms', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}
