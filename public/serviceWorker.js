// Service Worker for Learnimals PWA
const CACHE_NAME = 'learnimals-cache-v5';
const ASSETS_TO_CACHE = [
  // HTML pages (only cache existing pages)
  '/src/pages/index.html',
  '/src/features/subjects/math/math.html',
  '/src/features/subjects/shared/bubblepop.html',
  
  // CSS files (only cache existing CSS)
  '/src/styles/base/styles.css',
  '/src/styles/components/navbar.css',
  '/src/styles/components/bubblepop.css',
  '/src/features/subjects/math/math.css',
  '/src/features/subjects/science/science.css',
  '/src/features/subjects/reading/reading.css',
  '/src/features/subjects/art/art.css',
  
  // JavaScript files (only cache existing JS)
  '/src/config.js',
  '/src/main.js',
  '/src/themeInitializer.js',
  '/src/features/subjects/math/math.js',
  '/src/features/subjects/science/science.js',
  '/src/features/subjects/art/art.js',
  '/src/features/games/bubble-pop/bubblepop.js',
  '/src/features/games/bubble-pop/Bubble.js',
  '/src/features/games/word-scramble/wordScramble.js',
  '/src/utils/common.js',
  '/src/utils/themeManager.js',
  '/src/utils/themeManagerUtils.js',
  '/src/utils/themeRegistry.js',
  '/src/components/layout/navigation.js',
  '/src/components/layout/navbarLoader.js',
  '/src/components/layout/themeSwitcher.js',
  '/src/components/ui/Card.js',
  '/src/components/ui/Modal.js',
  
  // Images (core images only)
  './images/logo.png',
  './images/math-shark.png',
  './images/science-parrot.png',
  './images/science-parrot2.png',
  './images/reading-panda.png',
  './images/art-lion.png',
  './images/mango-swimming.png',
  './images/rocket.png',
  './images/cody-cat2.png',
  
  // Components
  '/src/components/layout/navbar.html'
];

// Install event - Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
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
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
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

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(error => {
          // If offline and requesting an HTML page, show offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./offline.html');
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
  const sendPromises = pendingForms.map(async (formData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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