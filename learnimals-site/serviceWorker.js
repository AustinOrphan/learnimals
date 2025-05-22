// Service Worker for Learnimals PWA
const CACHE_NAME = 'learnimals-cache-v2';
const ASSETS_TO_CACHE = [
  // HTML pages
  './',
  './index.html',
  './about.html',
  './contact.html',
  './subjects/math.html',
  './subjects/science.html',
  './subjects/reading.html',
  './subjects/art.html',
  './subjects/bubblepop.html',
  './offline.html',
  
  // CSS files
  './css/styles.css',
  './css/navbar.css',
  './css/math.css',
  './css/bubblepop.css',
  './css/subjects/art.css',
  './css/subjects/reading.css',
  './css/subjects/science.css',
  
  // JavaScript files
  './js/config.js',
  './js/main.js',
  './js/math.js',
  './js/science.js',
  './js/art.js',
  './js/bubblepop.js',
  './js/games/Bubble.js',
  './js/games/wordScramble.js',
  './js/utils/common.js',
  './js/utils/themeManager.js',
  './js/components/navigation.js',
  './js/components/navbarLoader.js',
  './js/components/themeSwitcher.js',
  
  // Images
  './assets/images/logo.png',
  './assets/images/favicon.ico',
  './assets/images/icon-192.png',
  './assets/images/math-shark.png',
  './assets/images/science-parrot.png',
  './assets/images/reading-panda.png',
  './assets/images/art-lion.png',
  './assets/images/mango-swimming.png',
  './assets/images/rocket.png',
  
  // Components
  './components/navbar.html'
];

// Install event - Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
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