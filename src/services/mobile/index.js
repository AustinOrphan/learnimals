/**
 * Mobile Optimization Services Integration
 * Main entry point for all mobile optimization features
 */

import { mobileOptimizationService } from './MobileOptimizationService.js';
import { lazyLoadManager } from '../../utils/LazyLoadManager.js';
import { bundleOptimizer } from '../../utils/BundleOptimizer.js';
import logger from '../../utils/logger.js';

// Configuration for mobile optimization
const MOBILE_CONFIG = {
  // Performance targets
  performance: {
    targetFPS: 60,
    budgetMaxSize: 250 * 1024, // 250KB
    criticalLoadTime: 1000, // 1s
    interactionDelay: 100, // 100ms
  },

  // Feature flags based on device capabilities
  features: {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableBundleOptimization: true,
    enableTouchOptimization: true,
    enableResponsiveImages: true,
    enableServiceWorker: true,
  },

  // Adaptive loading based on network conditions
  networkAdaptation: {
    '2g': {
      imageQuality: 0.6,
      enableAnimations: false,
      batchSize: 2,
      enablePrefetch: false,
    },
    '3g': {
      imageQuality: 0.7,
      enableAnimations: true,
      batchSize: 3,
      enablePrefetch: true,
    },
    '4g': {
      imageQuality: 0.8,
      enableAnimations: true,
      batchSize: 5,
      enablePrefetch: true,
    },
  },
};

// Global mobile optimization state
let isInitialized = false;
let currentConfig = { ...MOBILE_CONFIG };
let performanceObserver = null;
let networkConnection = null;

/**
 * Initialize all mobile optimization services
 */
export async function initializeMobileOptimization(customConfig = {}) {
  if (isInitialized) {
    logger.info('Mobile optimization already initialized');
    return;
  }

  try {
    logger.info('🚀 Initializing mobile optimization services...');

    // Merge custom configuration
    currentConfig = deepMerge(MOBILE_CONFIG, customConfig);

    // Detect device capabilities and adapt config
    const deviceCapabilities = await detectDeviceCapabilities();
    adaptConfigToDevice(deviceCapabilities);

    // Initialize services in dependency order
    const initPromises = [];

    // 1. Bundle optimizer (needed for efficient loading)
    if (currentConfig.features.enableBundleOptimization) {
      initPromises.push(initializeBundleOptimizer());
    }

    // 2. Mobile optimization service (core features)
    initPromises.push(initializeMobileService());

    // 3. Lazy loading manager (depends on mobile service)
    if (currentConfig.features.enableLazyLoading) {
      initPromises.push(initializeLazyLoading());
    }

    // Wait for all services to initialize
    await Promise.all(initPromises);

    // Set up cross-service integrations
    setupServiceIntegrations();

    // Start performance monitoring
    startPerformanceMonitoring();

    // Set up network adaptation
    setupNetworkAdaptation();

    // Apply device-specific optimizations
    applyDeviceOptimizations(deviceCapabilities);

    isInitialized = true;

    logger.info('✅ Mobile optimization services initialized successfully');

    // Emit initialization complete event
    emitMobileEvent('initialized', {
      config: currentConfig,
      deviceCapabilities,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('❌ Failed to initialize mobile optimization services:', error);

    // Emit initialization error event
    emitMobileEvent('initializationError', { error, timestamp: Date.now() });

    throw error;
  }
}

/**
 * Initialize bundle optimizer
 */
async function initializeBundleOptimizer() {
  const bundleConfig = {
    enableModulePrefetch: currentConfig.features.enablePrefetch !== false,
    enableCriticalCSS: true,
    maxBundleSize: currentConfig.performance.budgetMaxSize,
    enableServiceWorker: currentConfig.features.enableServiceWorker,
    loadingStrategy: 'auto',
  };

  bundleOptimizer.options = { ...bundleOptimizer.options, ...bundleConfig };
  await bundleOptimizer.initialize();

  logger.debug('Bundle optimizer initialized with config:', bundleConfig);
}

/**
 * Initialize mobile optimization service
 */
async function initializeMobileService() {
  const mobileConfig = {
    imageOptimization: {
      lazyLoadingEnabled: currentConfig.features.enableLazyLoading,
      webpSupport: await detectWebPSupport(),
      compressionQuality: 0.8,
    },
    touchOptimization: {
      enabled: currentConfig.features.enableTouchOptimization,
      minTouchTarget: 44,
      comfortableTouchTarget: 48,
    },
    performance: {
      fpsTarget: currentConfig.performance.targetFPS,
      budgetWarningThreshold: 16,
    },
  };

  mobileOptimizationService.config = {
    ...mobileOptimizationService.config,
    ...mobileConfig,
  };

  await mobileOptimizationService.initialize();

  logger.debug('Mobile optimization service initialized with config:', mobileConfig);
}

/**
 * Initialize lazy loading manager
 */
async function initializeLazyLoading() {
  const lazyConfig = {
    enableProgressiveLoading: true,
    enableBlurUpEffect: currentConfig.features.enableImageOptimization,
    enableSkeletonLoading: true,
    adaptToNetwork: true,
    batchSize: 5,
  };

  lazyLoadManager.options = { ...lazyLoadManager.options, ...lazyConfig };
  await lazyLoadManager.initialize();

  logger.debug('Lazy loading manager initialized with config:', lazyConfig);
}

/**
 * Detect device capabilities
 */
async function detectDeviceCapabilities() {
  const capabilities = {
    // Device type
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ),
    isTablet: /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent),

    // Display capabilities
    devicePixelRatio: window.devicePixelRatio || 1,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    // Hardware capabilities
    hardwareConcurrency: navigator.hardwareConcurrency || 2,
    deviceMemory: navigator.deviceMemory || 4,

    // Network capabilities
    connection: getConnectionInfo(),

    // Feature support
    features: {
      webp: await detectWebPSupport(),
      webgl: detectWebGLSupport(),
      intersectionObserver: 'IntersectionObserver' in window,
      serviceWorker: 'serviceWorker' in navigator,
      touchEvents: 'ontouchstart' in window,
      performanceObserver: 'PerformanceObserver' in window,
    },

    // Performance capabilities
    performance: {
      memory: getMemoryInfo(),
      timing: getPerformanceTiming(),
    },
  };

  logger.debug('Device capabilities detected:', capabilities);
  return capabilities;
}

/**
 * Adapt configuration based on device capabilities
 */
function adaptConfigToDevice(capabilities) {
  // Reduce features for low-end devices
  if (capabilities.deviceMemory <= 2 || capabilities.hardwareConcurrency <= 2) {
    currentConfig.features.enableAnimations = false;
    currentConfig.performance.targetFPS = 30;
    currentConfig.features.enablePrefetch = false;

    logger.info('Adapted config for low-end device');
  }

  // Adjust for mobile devices
  if (capabilities.isMobile) {
    currentConfig.features.enableTouchOptimization = true;
    currentConfig.performance.interactionDelay = 50; // Faster response on mobile

    logger.info('Adapted config for mobile device');
  }

  // Adjust for network conditions
  const connectionType = capabilities.connection?.effectiveType;
  if (connectionType && currentConfig.networkAdaptation[connectionType]) {
    const networkConfig = currentConfig.networkAdaptation[connectionType];
    Object.assign(currentConfig, networkConfig);

    logger.info(`Adapted config for ${connectionType} network`);
  }
}

/**
 * Set up integrations between services
 */
function setupServiceIntegrations() {
  // Bundle optimizer + Lazy loading integration
  bundleOptimizer.on('resourceError', event => {
    const { url } = event.detail;
    logger.warn(`Bundle optimizer detected resource error: ${url}`);

    // Retry with lazy loading if applicable
    if (url.match(/\.(jpe?g|png|gif|webp)$/)) {
      lazyLoadManager.emit('retryImage', { url });
    }
  });

  // Mobile service + Lazy loading integration
  mobileOptimizationService.on('networkChange', event => {
    const { to: networkInfo } = event.detail;

    // Update lazy loading based on network conditions
    lazyLoadManager.adaptToNetworkConditions();

    // Update bundle optimizer caching strategy
    if (networkInfo.saveData || networkInfo.effectiveType === '2g') {
      bundleOptimizer.options.enableModulePrefetch = false;
    }

    logger.debug('Adapted services to network change:', networkInfo);
  });

  // Performance monitoring integration
  mobileOptimizationService.on('performanceWarning', event => {
    const { type, value } = event.detail;

    logger.warn(`Performance warning: ${type} = ${value}`);

    // Take adaptive actions
    if (type === 'fps' && value < 30) {
      // Reduce lazy loading batch size
      lazyLoadManager.options.batchSize = Math.max(1, lazyLoadManager.options.batchSize - 1);

      // Clear bundle caches to free memory
      bundleOptimizer.clearCache();
    }
  });

  // Lazy loading + Bundle optimizer integration
  lazyLoadManager.on('componentLoaded', event => {
    const { componentName } = event.detail;

    // Preload related components
    bundleOptimizer.preloadResources([`/src/components/${componentName}Dependencies.js`]);
  });
}

/**
 * Start performance monitoring
 */
function startPerformanceMonitoring() {
  if (!('PerformanceObserver' in window)) {
    logger.warn('PerformanceObserver not supported, using fallback monitoring');
    return startPerformanceMonitoringFallback();
  }

  // eslint-disable-next-line no-undef
  performanceObserver = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
      handlePerformanceEntry(entry);
    });
  });

  try {
    performanceObserver.observe({
      entryTypes: ['navigation', 'resource', 'paint', 'layout-shift', 'largest-contentful-paint'],
    });

    logger.debug('Performance monitoring started');
  } catch (error) {
    logger.error('Failed to start performance monitoring:', error);
    startPerformanceMonitoringFallback();
  }
}

/**
 * Handle performance entries
 */
function handlePerformanceEntry(entry) {
  switch (entry.entryType) {
  case 'navigation':
    handleNavigationTiming(entry);
    break;
  case 'resource':
    handleResourceTiming(entry);
    break;
  case 'paint':
    handlePaintTiming(entry);
    break;
  case 'layout-shift':
    handleLayoutShift(entry);
    break;
  case 'largest-contentful-paint':
    handleLargestContentfulPaint(entry);
    break;
  }
}

/**
 * Handle navigation timing
 */
function handleNavigationTiming(entry) {
  const metrics = {
    domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
    loadComplete: entry.loadEventEnd - entry.loadEventStart,
    firstByte: entry.responseStart - entry.requestStart,
    domInteractive: entry.domInteractive - entry.navigationStart,
  };

  // Check against performance budgets
  if (metrics.domContentLoaded > currentConfig.performance.criticalLoadTime) {
    logger.warn(`DOM Content Loaded exceeded budget: ${metrics.domContentLoaded}ms`);
    emitMobileEvent('performanceBudgetExceeded', {
      metric: 'domContentLoaded',
      value: metrics.domContentLoaded,
      budget: currentConfig.performance.criticalLoadTime,
    });
  }

  emitMobileEvent('navigationTiming', metrics);
}

/**
 * Handle resource timing
 */
function handleResourceTiming(entry) {
  const size = entry.transferSize || entry.encodedBodySize || 0;
  const duration = entry.duration;

  // Track large resources
  if (size > 100 * 1024) {
    // 100KB
    logger.debug(`Large resource loaded: ${entry.name} (${(size / 1024).toFixed(2)}KB)`);
    emitMobileEvent('largeResourceLoaded', {
      url: entry.name,
      size,
      duration,
      type: getResourceType(entry.name),
    });
  }

  // Track slow resources
  if (duration > 1000) {
    logger.debug(`Slow resource loaded: ${entry.name} (${duration.toFixed(2)}ms)`);
    emitMobileEvent('slowResourceLoaded', {
      url: entry.name,
      size,
      duration,
      type: getResourceType(entry.name),
    });
  }
}

/**
 * Handle paint timing
 */
function handlePaintTiming(entry) {
  const metrics = { [entry.name]: entry.startTime };

  if (entry.name === 'first-contentful-paint' && entry.startTime > 1500) {
    logger.warn(`First Contentful Paint exceeded target: ${entry.startTime}ms`);
    emitMobileEvent('paintTimingWarning', {
      metric: entry.name,
      value: entry.startTime,
    });
  }

  emitMobileEvent('paintTiming', metrics);
}

/**
 * Handle layout shift
 */
function handleLayoutShift(entry) {
  if (entry.value > 0.1) {
    logger.warn(`Large layout shift detected: ${entry.value}`);
    emitMobileEvent('layoutShiftWarning', {
      value: entry.value,
      sources: entry.sources,
    });
  }
}

/**
 * Handle largest contentful paint
 */
function handleLargestContentfulPaint(entry) {
  if (entry.startTime > 2500) {
    logger.warn(`Largest Contentful Paint exceeded target: ${entry.startTime}ms`);
    emitMobileEvent('lcpWarning', { value: entry.startTime });
  }

  emitMobileEvent('largestContentfulPaint', { value: entry.startTime });
}

/**
 * Fallback performance monitoring for older browsers
 */
function startPerformanceMonitoringFallback() {
  // Use basic performance.timing API
  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = performance.timing;
      const metrics = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstByte: timing.responseStart - timing.requestStart,
      };

      emitMobileEvent('navigationTiming', metrics);
    }, 0);
  });

  logger.debug('Fallback performance monitoring started');
}

/**
 * Set up network adaptation
 */
function setupNetworkAdaptation() {
  if ('connection' in navigator) {
    networkConnection = navigator.connection;

    const handleConnectionChange = () => {
      const connectionInfo = getConnectionInfo();

      logger.debug('Network connection changed:', connectionInfo);

      // Adapt services to new network conditions
      adaptToNetworkChange(connectionInfo);

      emitMobileEvent('networkChange', connectionInfo);
    };

    networkConnection.addEventListener('change', handleConnectionChange);

    // Initial adaptation
    handleConnectionChange();
  }
}

/**
 * Adapt services to network changes
 */
function adaptToNetworkChange(connectionInfo) {
  const { effectiveType, saveData } = connectionInfo;

  // Update lazy loading settings
  if (lazyLoadManager.isInitialized) {
    lazyLoadManager.options.lowQualityMode = effectiveType === '2g' || saveData;

    if (effectiveType === '2g') {
      lazyLoadManager.options.batchSize = 1;
      lazyLoadManager.options.loadingDelay = 1000;
    } else if (effectiveType === '3g') {
      lazyLoadManager.options.batchSize = 2;
      lazyLoadManager.options.loadingDelay = 500;
    } else {
      lazyLoadManager.options.batchSize = 5;
      lazyLoadManager.options.loadingDelay = 100;
    }
  }

  // Update bundle optimizer settings
  if (bundleOptimizer.isInitialized) {
    bundleOptimizer.options.enableModulePrefetch = !(effectiveType === '2g' || saveData);
  }

  // Update mobile service settings
  if (mobileOptimizationService.isInitialized) {
    const imageQuality = currentConfig.networkAdaptation[effectiveType]?.imageQuality || 0.8;
    mobileOptimizationService.config.imageOptimization.compressionQuality = imageQuality;
  }
}

/**
 * Apply device-specific optimizations
 */
function applyDeviceOptimizations(capabilities) {
  // iOS-specific optimizations
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    applyIOSOptimizations();
  }

  // Android-specific optimizations
  if (/Android/.test(navigator.userAgent)) {
    applyAndroidOptimizations();
  }

  // Low-memory device optimizations
  if (capabilities.deviceMemory <= 2) {
    applyLowMemoryOptimizations();
  }

  // High-DPI display optimizations
  if (capabilities.devicePixelRatio > 2) {
    applyHighDPIOptimizations();
  }
}

/**
 * Apply iOS-specific optimizations
 */
function applyIOSOptimizations() {
  // Fix iOS viewport height bug
  const setVH = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  // Improve iOS scroll performance
  document.body.style.webkitOverflowScrolling = 'touch';

  logger.debug('Applied iOS-specific optimizations');
}

/**
 * Apply Android-specific optimizations
 */
function applyAndroidOptimizations() {
  // Improve Android scroll performance
  document.body.style.touchAction = 'manipulation';

  // Fix Android viewport scaling
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.content = viewport.content.replace(/user-scalable=no/g, 'user-scalable=yes');
  }

  logger.debug('Applied Android-specific optimizations');
}

/**
 * Apply low-memory device optimizations
 */
function applyLowMemoryOptimizations() {
  // Reduce cache sizes
  bundleOptimizer.options.maxCacheSize = 10;
  lazyLoadManager.options.batchSize = 1;

  // Disable non-essential features
  currentConfig.features.enableAnimations = false;

  // Add low-memory class for CSS optimizations
  document.body.classList.add('low-memory-device');

  logger.debug('Applied low-memory device optimizations');
}

/**
 * Apply high-DPI display optimizations
 */
function applyHighDPIOptimizations() {
  // Enable high-quality images for high-DPI displays
  lazyLoadManager.options.enableRetinaImages = true;

  // Optimize font rendering
  const style = document.createElement('style');
  style.textContent = `
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  document.head.appendChild(style);

  logger.debug('Applied high-DPI display optimizations');
}

/**
 * Utility functions
 */

function getConnectionInfo() {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
}

function getMemoryInfo() {
  if ('memory' in performance) {
    const memory = performance.memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

function getPerformanceTiming() {
  if ('timing' in performance) {
    const timing = performance.timing;
    return {
      navigationStart: timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
    };
  }
  return null;
}

async function detectWebPSupport() {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

function detectWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

function getResourceType(url) {
  if (url.match(/\.(css)$/)) return 'stylesheet';
  if (url.match(/\.(js)$/)) return 'script';
  if (url.match(/\.(jpe?g|png|gif|webp|svg)$/)) return 'image';
  if (url.match(/\.(woff2?|ttf|eot)$/)) return 'font';
  return 'other';
}

function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

function emitMobileEvent(eventName, data) {
  const event = new CustomEvent(`mobileOptimization:${eventName}`, {
    detail: {
      ...data,
      timestamp: Date.now(),
    },
  });
  document.dispatchEvent(event);
}

/**
 * Public API
 */

/**
 * Get mobile optimization statistics
 */
export function getMobileOptimizationStats() {
  if (!isInitialized) {
    return { error: 'Mobile optimization not initialized' };
  }

  return {
    isInitialized,
    config: currentConfig,
    services: {
      mobileService: mobileOptimizationService.getPerformanceMetrics(),
      lazyLoading: lazyLoadManager.getStats(),
      bundleOptimizer: bundleOptimizer.getMetrics(),
    },
    network: getConnectionInfo(),
    memory: getMemoryInfo(),
    timestamp: Date.now(),
  };
}

/**
 * Update mobile optimization configuration
 */
export function updateMobileConfig(updates) {
  if (!isInitialized) {
    logger.warn('Cannot update config: mobile optimization not initialized');
    return false;
  }

  currentConfig = deepMerge(currentConfig, updates);

  // Apply updates to services
  if (updates.features) {
    Object.assign(mobileOptimizationService.config, updates.features);
    Object.assign(lazyLoadManager.options, updates.features);
    Object.assign(bundleOptimizer.options, updates.features);
  }

  logger.info('Mobile optimization config updated:', updates);
  emitMobileEvent('configUpdated', { updates, newConfig: currentConfig });

  return true;
}

/**
 * Manually trigger optimization for specific elements
 */
export function optimizeElements(selector) {
  if (!isInitialized) {
    logger.warn('Cannot optimize elements: mobile optimization not initialized');
    return;
  }

  const elements = document.querySelectorAll(selector);

  elements.forEach(element => {
    // Apply touch optimization
    if (mobileOptimizationService.touchSupport) {
      element.classList.add('touch-optimized');
    }

    // Apply lazy loading if applicable
    if (element.matches('img[data-src]')) {
      lazyLoadManager.queueImageLoad(element);
    }
  });

  logger.debug(`Optimized ${elements.length} elements matching "${selector}"`);
}

/**
 * Event listener helpers
 */
export function onMobileOptimization(eventName, callback) {
  document.addEventListener(`mobileOptimization:${eventName}`, callback);
}

export function offMobileOptimization(eventName, callback) {
  document.removeEventListener(`mobileOptimization:${eventName}`, callback);
}

/**
 * Cleanup all mobile optimization services
 */
export function destroyMobileOptimization() {
  if (!isInitialized) return;

  try {
    // Destroy services
    mobileOptimizationService.destroy();
    lazyLoadManager.destroy();
    bundleOptimizer.destroy();

    // Cleanup performance monitoring
    if (performanceObserver) {
      performanceObserver.disconnect();
      performanceObserver = null;
    }

    // Cleanup network monitoring
    if (networkConnection) {
      networkConnection.removeEventListener('change', adaptToNetworkChange);
      networkConnection = null;
    }

    isInitialized = false;

    logger.info('Mobile optimization services destroyed');
    emitMobileEvent('destroyed', { timestamp: Date.now() });
  } catch (error) {
    logger.error('Error destroying mobile optimization services:', error);
  }
}

// Auto-initialize when DOM is ready (can be disabled via data attribute)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.dataset.disableAutoMobileOptimization) {
      initializeMobileOptimization().catch(error => {
        logger.error('Auto-initialization failed:', error);
      });
    }
  });
} else {
  // DOM already loaded
  if (!document.body.dataset.disableAutoMobileOptimization) {
    initializeMobileOptimization().catch(error => {
      logger.error('Auto-initialization failed:', error);
    });
  }
}

// Export services for direct access
export { mobileOptimizationService, lazyLoadManager, bundleOptimizer };
