// Root-scoped Service Worker entry point for the Learnimals PWA.
//
// A service worker can only control pages at or below the path it is served
// from (unless the server sends a Service-Worker-Allowed header, which the
// static dev server does not). The app's pages live under /, so the worker
// must be served from the site root to obtain scope '/' and control them.
//
// The actual worker logic lives in /public/serviceWorker.js and is loaded here
// via importScripts, so there is a single source of truth. Because this script
// runs at the root, self.location resolves to '/', which is why the imported
// worker uses only root-absolute asset paths.
importScripts('/public/serviceWorker.js');
