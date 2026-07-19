# Performance Optimization Guide

## Overview

This guide outlines performance optimization strategies for the Learnimals platform. Our goal is to achieve excellent performance across all devices, with special attention to mobile devices and low-bandwidth connections.

---

## Performance Targets

### Core Web Vitals Goals

| Metric                             | Target  | Mobile Target | Description           |
| ---------------------------------- | ------- | ------------- | --------------------- |
| **LCP** (Largest Contentful Paint) | < 2.5s  | < 3.0s        | Main content visible  |
| **FID** (First Input Delay)        | < 100ms | < 200ms       | Time to interactivity |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | < 0.15        | Visual stability      |
| **FCP** (First Contentful Paint)   | < 1.8s  | < 2.4s        | First content visible |
| **TTI** (Time to Interactive)      | < 3.8s  | < 5.0s        | Fully interactive     |
| **TBT** (Total Blocking Time)      | < 200ms | < 300ms       | Main thread blocking  |

### Performance Budget

```javascript
// performance.config.js
export const PERFORMANCE_BUDGET = {
  javascript: {
    main: 150, // KB
    vendor: 100, // KB
    perRoute: 50, // KB
  },
  css: {
    main: 50, // KB
    perComponent: 10, // KB
  },
  images: {
    hero: 100, // KB
    thumbnail: 30, // KB
    icon: 10, // KB
  },
  fonts: {
    total: 100, // KB
  },
  total: {
    initialLoad: 400, // KB
    cached: 100, // KB
  },
};
```

---

## Loading Performance

### Critical Rendering Path

#### Optimize Initial Load

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Preconnect to required origins -->
    <link rel="preconnect" href="https://api.learnimals.com" />
    <link rel="dns-prefetch" href="https://cdn.learnimals.com" />

    <!-- Critical CSS inline -->
    <style>
      /* Critical above-the-fold styles */
      :root {
        --color-primary: #007bff;
      }
      body {
        margin: 0;
        font-family: system-ui;
      }
      .loading {
        display: flex;
        justify-content: center;
      }
    </style>

    <!-- Preload critical resources -->
    <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin />
    <link rel="preload" href="/js/app.js" as="script" />

    <!-- Non-critical CSS -->
    <link rel="stylesheet" href="/css/main.css" media="print" onload="this.media='all'" />
  </head>
  <body>
    <!-- Initial loading state -->
    <div class="loading">Loading Learnimals...</div>

    <!-- Async load non-critical scripts -->
    <script src="/js/app.js" async></script>
  </body>
</html>
```

#### Progressive Enhancement

```javascript
// Progressive feature loading
class FeatureLoader {
  static async loadWhenIdle(featureName) {
    // Use requestIdleCallback for non-critical features
    if ('requestIdleCallback' in window) {
      return new Promise(resolve => {
        requestIdleCallback(async () => {
          const module = await import(`./features/${featureName}.js`);
          resolve(module);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      return import(`./features/${featureName}.js`);
    }
  }

  static async loadOnInteraction(selector, modulePath) {
    const element = document.querySelector(selector);
    if (!element) return;

    // Load on first interaction
    const loadModule = async () => {
      const module = await import(modulePath);
      element.removeEventListener('click', loadModule);
      element.removeEventListener('mouseenter', loadModule);
      return module;
    };

    element.addEventListener('click', loadModule, { once: true });
    element.addEventListener('mouseenter', loadModule, { once: true });
  }
}
```

### Code Splitting

#### Route-Based Splitting

```javascript
// Router with dynamic imports
class Router {
  constructor() {
    this.routes = new Map();
  }

  addRoute(path, loader) {
    this.routes.set(path, loader);
  }

  async navigate(path) {
    const loader = this.routes.get(path);
    if (!loader) return;

    // Show loading state
    this.showLoading();

    try {
      // Dynamic import
      const module = await loader();
      const component = new module.default();
      this.render(component);
    } catch (error) {
      console.error('Route loading failed:', error);
      this.showError();
    }
  }
}

// Route configuration
const router = new Router();
router.addRoute('/activities', () => import('./pages/Activities.js'));
router.addRoute('/profile', () => import('./pages/Profile.js'));
router.addRoute('/settings', () => import('./pages/Settings.js'));
```

#### Component-Based Splitting

```javascript
// Lazy load heavy components
class LazyComponent {
  constructor(loader) {
    this.loader = loader;
    this.component = null;
    this.loading = false;
  }

  async load() {
    if (this.component || this.loading) return this.component;

    this.loading = true;
    try {
      const module = await this.loader();
      this.component = module.default;
      return this.component;
    } finally {
      this.loading = false;
    }
  }

  render(container) {
    // Show skeleton while loading
    container.innerHTML = '<div class="skeleton">Loading...</div>';

    this.load().then(Component => {
      const instance = new Component();
      container.innerHTML = '';
      container.appendChild(instance.render());
    });
  }
}

// Usage
const heavyChart = new LazyComponent(() => import('./components/Chart.js'));
```

### Resource Optimization

#### Image Optimization

```javascript
// Responsive image loader
class ImageOptimizer {
  static generateSrcSet(imagePath, sizes = [320, 640, 1024, 1920]) {
    return sizes.map(size => `${imagePath}?w=${size} ${size}w`).join(', ');
  }

  static getLazyImageHTML(src, alt, sizes = '100vw') {
    return `
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3C/svg%3E"
        data-src="${src}"
        data-srcset="${this.generateSrcSet(src)}"
        sizes="${sizes}"
        alt="${alt}"
        class="lazy-image"
        loading="lazy"
      />
    `;
  }

  static observeImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.srcset = img.dataset.srcset || '';
            img.classList.remove('lazy-image');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('.lazy-image').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
}
```

#### Font Optimization

```css
/* Font loading strategy */
@font-face {
  font-family: 'LearnimalsFont';
  src:
    url('/fonts/learnimals.woff2') format('woff2'),
    url('/fonts/learnimals.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* Show fallback immediately */
}

/* System font stack fallback */
:root {
  --font-stack:
    'LearnimalsFont', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

/* Critical text uses system fonts */
.critical-text {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
```

---

## Runtime Performance

### JavaScript Optimization

#### Debouncing and Throttling

```javascript
// Debounce for search inputs
function debounce(fn, delay = 300) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle for scroll events
function throttle(fn, limit = 100) {
  let inThrottle;
  return function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Usage
const searchInput = document.querySelector('#search');
searchInput.addEventListener('input', debounce(handleSearch, 300));

window.addEventListener('scroll', throttle(handleScroll, 100));
```

#### Efficient DOM Manipulation

```javascript
// Batch DOM updates
class DOMBatcher {
  constructor() {
    this.updates = [];
    this.scheduled = false;
  }

  add(updateFn) {
    this.updates.push(updateFn);
    this.scheduleUpdate();
  }

  scheduleUpdate() {
    if (this.scheduled) return;

    this.scheduled = true;
    requestAnimationFrame(() => {
      this.flush();
    });
  }

  flush() {
    const updates = this.updates.splice(0);
    updates.forEach(update => update());
    this.scheduled = false;
  }
}

// Virtual scrolling for large lists
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleRange = { start: 0, end: 0 };

    this.init();
  }

  init() {
    // Create scroll container
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.height = `${this.items.length * this.itemHeight}px`;

    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.style.overflow = 'auto';
    this.viewport.style.height = '100%';

    this.viewport.appendChild(this.scrollContainer);
    this.container.appendChild(this.viewport);

    this.viewport.addEventListener(
      'scroll',
      throttle(() => this.render(), 10)
    );
    this.render();
  }

  render() {
    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;

    // Calculate visible range
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.ceil((scrollTop + viewportHeight) / this.itemHeight);

    // Only update if range changed
    if (start === this.visibleRange.start && end === this.visibleRange.end) {
      return;
    }

    this.visibleRange = { start, end };

    // Clear container
    this.scrollContainer.innerHTML = '';

    // Render visible items
    const fragment = document.createDocumentFragment();

    for (let i = start; i < end && i < this.items.length; i++) {
      const item = this.createItem(this.items[i], i);
      item.style.position = 'absolute';
      item.style.top = `${i * this.itemHeight}px`;
      fragment.appendChild(item);
    }

    this.scrollContainer.appendChild(fragment);
  }

  createItem(data, index) {
    const div = document.createElement('div');
    div.className = 'virtual-item';
    div.textContent = `Item ${index}: ${data}`;
    return div;
  }
}
```

### Memory Management

#### Preventing Memory Leaks

```javascript
// Event listener cleanup
class ComponentWithCleanup {
  constructor() {
    this.listeners = new Map();
    this.intervals = new Set();
    this.observers = new Set();
  }

  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);

    // Track for cleanup
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element).set(event, handler);
  }

  setInterval(fn, delay) {
    const id = setInterval(fn, delay);
    this.intervals.add(id);
    return id;
  }

  observe(observer) {
    this.observers.add(observer);
  }

  destroy() {
    // Remove event listeners
    this.listeners.forEach((events, element) => {
      events.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();

    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
```

#### Object Pooling

```javascript
// Reuse objects to reduce GC pressure
class ObjectPool {
  constructor(factory, reset, maxSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    this.pool = [];
  }

  acquire() {
    return this.pool.pop() || this.factory();
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
}

// Usage for game objects
const particlePool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, active: false }),
  particle => {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.active = false;
  }
);
```

---

## CSS Performance

### Efficient Selectors

```css
/* ✅ GOOD - Efficient selectors */
.button {
}
.card-header {
}
#main-nav {
}
[data-theme='dark'] {
}

/* ❌ BAD - Inefficient selectors */
div > ul > li > a {
} /* Deep nesting */
.container * {
} /* Universal selector */
div.container {
} /* Redundant qualifier */
```

### Animation Performance

```css
/* ✅ GOOD - GPU-accelerated properties */
.animated {
  transform: translateX(0);
  opacity: 1;
  will-change: transform, opacity;
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ❌ BAD - Triggers layout/paint */
.animated-bad {
  left: 0;
  width: 100px;
}
```

### CSS Containment

```css
/* Optimize render performance with containment */
.activity-card {
  contain: layout style paint;
}

.scrollable-list {
  contain: strict;
  height: 400px;
  overflow: auto;
}

/* Content-visibility for off-screen content */
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

---

## Network Performance

### API Optimization

```javascript
// Request batching
class APIBatcher {
  constructor(batchEndpoint, delay = 50) {
    this.batchEndpoint = batchEndpoint;
    this.delay = delay;
    this.queue = [];
    this.timeout = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.scheduleBatch();
    });
  }

  scheduleBatch() {
    if (this.timeout) return;

    this.timeout = setTimeout(() => {
      this.sendBatch();
    }, this.delay);
  }

  async sendBatch() {
    const batch = this.queue.splice(0);
    this.timeout = null;

    if (batch.length === 0) return;

    try {
      const response = await fetch(this.batchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(item => item.request),
        }),
      });

      const results = await response.json();

      batch.forEach((item, index) => {
        if (results[index].error) {
          item.reject(results[index].error);
        } else {
          item.resolve(results[index].data);
        }
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}
```

### Caching Strategy

```javascript
// Service Worker caching
const CACHE_NAME = 'learnimals-v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache-first strategy for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for static assets
  if (request.method === 'GET' && isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          // Update cache in background
          fetchAndCache(request);
          return response;
        }
        return fetchAndCache(request);
      })
    );
  }

  // Network-first for API calls
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
  }
});

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|svg|woff2?)$/.test(pathname);
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}
```

---

## Monitoring & Measurement

### Performance Observer

```javascript
// Real User Monitoring (RUM)
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    // Observe various performance metrics
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      new PerformanceObserver(list => {
        let cls = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        this.metrics.cls = cls;
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        this.metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        this.metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
        this.reportMetrics();
      }, 0);
    });
  }

  reportMetrics() {
    // Send metrics to analytics
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', JSON.stringify(this.metrics));
    }
  }
}

// Initialize monitoring
new PerformanceMonitor();
```

### Custom Performance Marks

```javascript
// Track custom metrics
class CustomMetrics {
  static mark(name) {
    if ('performance' in window) {
      performance.mark(name);
    }
  }

  static measure(name, startMark, endMark) {
    if ('performance' in window) {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      console.log(`${name}: ${measure.duration}ms`);
      return measure.duration;
    }
  }

  static async measureAsync(name, asyncFn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);
    try {
      const result = await asyncFn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      return result;
    } catch (error) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw error;
    }
  }
}

// Usage
CustomMetrics.measureAsync('fetch-user-data', async () => {
  return await api.getUserData();
});
```

---

## Performance Checklist

### Development Phase

- [ ] Enable performance budgets in build tool
- [ ] Use production builds for testing
- [ ] Test on real devices, not just DevTools
- [ ] Profile JavaScript execution
- [ ] Audit with Lighthouse regularly

### Before Deploy

- [ ] Minify all assets (JS, CSS, HTML)
- [ ] Enable compression (gzip/brotli)
- [ ] Optimize images (WebP, AVIF)
- [ ] Remove console.logs and debugging code
- [ ] Verify lazy loading works

### Monitoring

- [ ] Set up Real User Monitoring (RUM)
- [ ] Configure performance alerts
- [ ] Track Core Web Vitals
- [ ] Monitor JavaScript errors
- [ ] Review performance weekly

---

## Tools & Resources

### Performance Testing Tools

- **Lighthouse**: Automated auditing
- **WebPageTest**: Detailed performance analysis
- **Chrome DevTools**: Performance profiling
- **Bundlephobia**: Package size checker
- **Coverage Tab**: Find unused code

### Monitoring Services

- **Google Analytics**: Core Web Vitals tracking
- **Sentry**: Performance monitoring
- **SpeedCurve**: Continuous monitoring
- **Calibre**: Performance tracking

### Build Tools

- **Vite**: Fast builds with optimization
- **Terser**: JavaScript minification
- **PurgeCSS**: Remove unused CSS
- **ImageOptim**: Image optimization

---

_Performance optimization is an ongoing process. Regular monitoring and incremental improvements lead to the best results._
