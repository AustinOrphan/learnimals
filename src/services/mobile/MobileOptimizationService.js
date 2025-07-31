/**
 * Mobile Optimization Service
 * Comprehensive mobile performance optimization and responsive design enhancements
 */

import { memoryMonitor, fpsMonitor } from '../../utils/performanceUtils.js';
import logger from '../../utils/logger.js';

export class MobileOptimizationService {
  constructor() {
    this.isInitialized = false;
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.touchSupport = this.detectTouchSupport();
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.networkInfo = this.getNetworkInfo();
    this.performanceMetrics = new Map();
    
    // Configuration
    this.config = {
      imageOptimization: {
        lazyLoadingEnabled: true,
        webpSupport: this.supportsWebP(),
        retinaSuffix: '@2x',
        compressionQuality: 0.8
      },
      touchOptimization: {
        minTouchTarget: 44, // iOS HIG minimum
        comfortableTouchTarget: 48,
        scrollThreshold: 10,
        swipeThreshold: 50
      },
      performance: {
        fpsTarget: 60,
        budgetWarningThreshold: 16, // ms per frame
        memoryWarningThreshold: 50 * 1024 * 1024, // 50MB
        networkTimeout: 5000
      },
      responsive: {
        breakpoints: {
          xs: 0,
          sm: 640,
          md: 768,
          lg: 1024,
          xl: 1280,
          '2xl': 1536
        },
        containerMaxWidths: {
          sm: '100%',
          md: '100%',
          lg: '1024px',
          xl: '1280px'
        }
      }
    };

    // Event listeners and observers
    this.observers = new Map();
    this.eventListeners = new Map();
    this.optimizedImages = new Set();
    this.lazyLoadQueue = new Set();
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
  }

  /**
   * Initialize mobile optimization service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing mobile optimization service...');

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Initialize responsive design enhancements
      this.initializeResponsiveDesign();

      // Initialize touch optimizations
      this.initializeTouchOptimizations();

      // Initialize image optimization
      await this.initializeImageOptimization();

      // Initialize network optimization
      this.initializeNetworkOptimization();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize viewport optimizations
      this.initializeViewportOptimizations();

      // Apply device-specific optimizations
      this.applyDeviceOptimizations();

      this.isInitialized = true;
      logger.info('✅ Mobile optimization service initialized');

      // Log device and performance info
      this.logDeviceInfo();

    } catch (error) {
      logger.error('❌ Failed to initialize mobile optimization service:', error);
      throw error;
    }
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    if (this.isMobile || this.isTablet) {
      // Start FPS monitoring for mobile devices
      fpsMonitor.start();
      
      // Take initial memory snapshot
      memoryMonitor.snapshot('mobile-init');

      // Monitor critical performance metrics
      this.monitorCriticalMetrics();
    }
  }

  /**
   * Monitor critical performance metrics
   */
  monitorCriticalMetrics() {
    const checkMetrics = () => {
      // Check FPS
      const currentFPS = fpsMonitor.getFPS();
      if (currentFPS < this.config.performance.fpsTarget * 0.8) {
        logger.warn(`Low FPS detected: ${currentFPS}fps`);
        this.handleLowPerformance('fps', currentFPS);
      }

      // Check memory usage
      const memorySnapshot = memoryMonitor.snapshot('periodic-check');
      if (memorySnapshot && memorySnapshot.used > this.config.performance.memoryWarningThreshold) {
        logger.warn(`High memory usage: ${(memorySnapshot.used / 1024 / 1024).toFixed(2)}MB`);
        this.handleLowPerformance('memory', memorySnapshot.used);
      }

      // Schedule next check
      setTimeout(checkMetrics, 5000); // Check every 5 seconds
    };

    // Start monitoring after a delay
    setTimeout(checkMetrics, 2000);
  }

  /**
   * Handle low performance situations
   */
  handleLowPerformance(type, value) {
    switch (type) {
    case 'fps':
      // Reduce animation complexity
      this.reduceAnimationComplexity();
      break;
    case 'memory':
      // Trigger garbage collection hints
      this.optimizeMemoryUsage();
      break;
    }

    // Emit performance warning event
    this.emit('performanceWarning', { type, value });
  }

  /**
   * Reduce animation complexity for better performance
   */
  reduceAnimationComplexity() {
    document.body.classList.add('reduced-animations');
    
    // Disable complex animations
    const style = document.createElement('style');
    style.textContent = `
      .reduced-animations * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      .reduced-animations .complex-animation {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    logger.info('Reduced animation complexity due to low FPS');
  }

  /**
   * Optimize memory usage
   */
  optimizeMemoryUsage() {
    // Clean up unused DOM elements
    this.cleanupUnusedElements();
    
    // Clear image caches
    this.clearImageCaches();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    logger.info('Optimized memory usage due to high memory consumption');
  }

  /**
   * Initialize responsive design enhancements
   */
  initializeResponsiveDesign() {
    // Set up responsive breakpoint detection
    this.setupBreakpointDetection();
    
    // Initialize fluid typography
    this.initializeFluidTypography();
    
    // Set up responsive images
    this.setupResponsiveImages();
    
    // Initialize container queries fallback
    this.initializeContainerQueries();
  }

  /**
   * Set up breakpoint detection
   */
  setupBreakpointDetection() {
    const breakpoints = this.config.responsive.breakpoints;
    this.currentBreakpoint = this.getCurrentBreakpoint();

    // Create media query listeners
    Object.entries(breakpoints).forEach(([_name, width]) => {
      if (width > 0) {
        const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
        mediaQuery.addListener(() => {
          const newBreakpoint = this.getCurrentBreakpoint();
          if (newBreakpoint !== this.currentBreakpoint) {
            this.handleBreakpointChange(this.currentBreakpoint, newBreakpoint);
            this.currentBreakpoint = newBreakpoint;
          }
        });
      }
    });
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    const breakpoints = this.config.responsive.breakpoints;

    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }

  /**
   * Handle breakpoint changes
   */
  handleBreakpointChange(oldBreakpoint, newBreakpoint) {
    document.body.className = document.body.className
      .replace(new RegExp(`\\bbp-${oldBreakpoint}\\b`, 'g'), '')
      .trim();
    document.body.classList.add(`bp-${newBreakpoint}`);

    // Emit breakpoint change event
    this.emit('breakpointChange', { from: oldBreakpoint, to: newBreakpoint });

    logger.debug(`Breakpoint changed: ${oldBreakpoint} → ${newBreakpoint}`);
  }

  /**
   * Initialize fluid typography
   */
  initializeFluidTypography() {
    // Only apply on mobile/tablet for better performance
    if (!this.isMobile && !this.isTablet) return;

    const style = document.createElement('style');
    style.textContent = `
      :root {
        --fluid-min-width: 320;
        --fluid-max-width: 1024;
        --fluid-screen: 100vw;
        --fluid-bp: calc(
          (var(--fluid-screen) - var(--fluid-min-width) / 16 * 1rem) /
          (var(--fluid-max-width) - var(--fluid-min-width))
        );
      }

      @media screen and (max-width: 1024px) {
        .fluid-text {
          font-size: calc(
            var(--f-0-min, 1rem) + 
            (var(--f-0-max, 1.25rem) - var(--f-0-min, 1rem)) * 
            var(--fluid-bp)
          );
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize touch optimizations
   */
  initializeTouchOptimizations() {
    if (!this.touchSupport) return;

    // Enhance touch targets
    this.enhanceTouchTargets();
    
    // Initialize gesture support
    this.initializeGestureSupport();
    
    // Optimize scroll behavior
    this.optimizeScrollBehavior();
    
    // Set up touch feedback
    this.setupTouchFeedback();
  }

  /**
   * Enhance touch targets
   */
  enhanceTouchTargets() {
    const minSize = this.config.touchOptimization.minTouchTarget;
    // const comfortableSize = this.config.touchOptimization.comfortableTouchTarget;

    // Find and enhance small interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]'
    );

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width < minSize || rect.height < minSize) {
        element.classList.add('enhanced-touch-target');
        
        // Apply minimum touch target size
        if (rect.width < minSize) {
          element.style.setProperty('--touch-width', `${minSize}px`);
        }
        if (rect.height < minSize) {
          element.style.setProperty('--touch-height', `${minSize}px`);
        }
      }
    });

    // Add touch target enhancement styles
    this.addTouchTargetStyles();
  }

  /**
   * Add touch target enhancement styles
   */
  addTouchTargetStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .enhanced-touch-target {
        position: relative;
        min-width: var(--touch-width, auto);
        min-height: var(--touch-height, auto);
        touch-action: manipulation;
      }

      .enhanced-touch-target::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: ${this.config.touchOptimization.minTouchTarget}px;
        min-height: ${this.config.touchOptimization.minTouchTarget}px;
        z-index: -1;
      }

      @media (hover: none) and (pointer: coarse) {
        .enhanced-touch-target {
          padding: max(8px, (${this.config.touchOptimization.minTouchTarget}px - 100%) / 2);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize gesture support
   */
  initializeGestureSupport() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleGesture(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: true });
  }

  /**
   * Handle gesture recognition
   */
  handleGesture(startX, startY, endX, endY) {
    const threshold = this.config.touchOptimization.swipeThreshold;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Detect swipe gestures
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      let direction;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      this.emit('swipe', { direction, deltaX, deltaY });
    }
  }

  /**
   * Initialize image optimization
   */
  async initializeImageOptimization() {
    if (!this.config.imageOptimization.lazyLoadingEnabled) return;

    // Set up intersection observer for lazy loading
    this.setupLazyLoading();
    
    // Optimize existing images
    this.optimizeExistingImages();
    
    // Set up responsive image loading
    this.setupResponsiveImageLoading();
  }

  /**
   * Set up lazy loading with Intersection Observer
   */
  setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.setupLazyLoadingFallback();
      return;
    }

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    // eslint-disable-next-line no-undef
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          lazyImageObserver.unobserve(img);
        }
      });
    }, options);

    // Observe all lazy images
    this.observeLazyImages(lazyImageObserver);
    this.observers.set('lazyImages', lazyImageObserver);
  }

  /**
   * Observe lazy images
   */
  observeLazyImages(observer) {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    lazyImages.forEach(img => {
      observer.observe(img);
      this.lazyLoadQueue.add(img);
    });
  }

  /**
   * Load image with optimization
   */
  async loadImage(img) {
    return new Promise((resolve, reject) => {
      const src = img.dataset.src || img.src;
      if (!src) {
        reject(new Error('No image source found'));
        return;
      }

      // Create optimized source URL
      const optimizedSrc = this.getOptimizedImageSrc(src);
      
      const tempImg = new Image();
      tempImg.onload = () => {
        // Use RAF to avoid layout thrashing
        requestAnimationFrame(() => {
          img.src = optimizedSrc;
          img.classList.add('loaded');
          img.removeAttribute('data-src');
          this.optimizedImages.add(img);
          resolve(img);
        });
      };
      
      tempImg.onerror = () => {
        // Fallback to original source
        img.src = src;
        reject(new Error(`Failed to load optimized image: ${optimizedSrc}`));
      };
      
      tempImg.src = optimizedSrc;
    });
  }

  /**
   * Get optimized image source
   */
  getOptimizedImageSrc(originalSrc) {
    // Apply device pixel ratio optimization
    if (this.devicePixelRatio > 1) {
      const extension = originalSrc.split('.').pop();
      const baseName = originalSrc.replace(`.${extension}`, '');
      const retinaVersion = `${baseName}${this.config.imageOptimization.retinaSuffix}.${extension}`;
      
      // Check if retina version exists (this would need server-side support)
      return retinaVersion;
    }

    return originalSrc;
  }

  /**
   * Initialize network optimization
   */
  initializeNetworkOptimization() {
    // Set up connection monitoring
    this.monitorNetworkConnection();
    
    // Implement adaptive loading based on connection
    this.setupAdaptiveLoading();
    
    // Prefetch critical resources
    this.prefetchCriticalResources();
  }

  /**
   * Monitor network connection
   */
  monitorNetworkConnection() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      connection.addEventListener('change', this.handleNetworkChange);
      this.eventListeners.set('networkChange', connection);
    }
  }

  /**
   * Handle network changes
   */
  handleNetworkChange() {
    const connection = navigator.connection;
    const oldInfo = { ...this.networkInfo };
    
    this.networkInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };

    // Adapt based on connection quality
    this.adaptToNetworkConditions(oldInfo, this.networkInfo);
    
    this.emit('networkChange', { from: oldInfo, to: this.networkInfo });
  }

  /**
   * Adapt to network conditions
   */
  adaptToNetworkConditions(oldInfo, newInfo) {
    // Reduce image quality on slow connections
    if (newInfo.effectiveType === '2g' || newInfo.saveData) {
      this.enableDataSaverMode();
    } else if (oldInfo.effectiveType === '2g' && newInfo.effectiveType !== '2g') {
      this.disableDataSaverMode();
    }

    // Adjust lazy loading threshold
    this.adjustLazyLoadingThreshold(newInfo.effectiveType);
  }

  /**
   * Enable data saver mode
   */
  enableDataSaverMode() {
    document.body.classList.add('data-saver-mode');
    
    // Pause non-essential animations
    document.body.classList.add('reduced-animations');
    
    // Reduce image quality
    this.config.imageOptimization.compressionQuality = 0.6;
    
    logger.info('Enabled data saver mode due to slow connection');
  }

  /**
   * Initialize viewport optimizations
   */
  initializeViewportOptimizations() {
    // Set optimal viewport meta tag
    this.setOptimalViewport();
    
    // Prevent zoom on form inputs (iOS)
    this.preventFormZoom();
    
    // Handle safe area insets
    this.handleSafeAreaInsets();
  }

  /**
   * Set optimal viewport meta tag
   */
  setOptimalViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // Optimal viewport for mobile web apps
    const viewportContent = [
      'width=device-width',
      'initial-scale=1.0',
      'viewport-fit=cover'
    ];

    // Prevent zoom on iOS for better UX
    if (this.isMobile) {
      viewportContent.push('user-scalable=no');
    }

    viewport.content = viewportContent.join(', ');
  }

  /**
   * Prevent form zoom on iOS
   */
  preventFormZoom() {
    if (!this.isMobile) return;

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      // Ensure font-size is at least 16px to prevent zoom
      if (getComputedStyle(input).fontSize < '16px') {
        input.style.fontSize = '16px';
      }
    });
  }

  /**
   * Handle safe area insets for notched devices
   */
  handleSafeAreaInsets() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }

      .safe-area-inset {
        padding-top: var(--safe-area-inset-top);
        padding-right: var(--safe-area-inset-right);
        padding-bottom: var(--safe-area-inset-bottom);
        padding-left: var(--safe-area-inset-left);
      }

      .safe-area-top {
        padding-top: var(--safe-area-inset-top);
      }

      .safe-area-bottom {
        padding-bottom: var(--safe-area-inset-bottom);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Apply device-specific optimizations
   */
  applyDeviceOptimizations() {
    // Add device classes to body
    document.body.classList.add(this.isMobile ? 'mobile-device' : 'desktop-device');
    if (this.isTablet) document.body.classList.add('tablet-device');
    if (this.touchSupport) document.body.classList.add('touch-device');

    // Apply iOS-specific fixes
    if (this.isIOS()) {
      this.applyIOSOptimizations();
    }

    // Apply Android-specific fixes
    if (this.isAndroid()) {
      this.applyAndroidOptimizations();
    }
  }

  /**
   * Apply iOS-specific optimizations
   */
  applyIOSOptimizations() {
    document.body.classList.add('ios-device');

    // Fix iOS viewport bug
    const fixViewportHeight = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    fixViewportHeight();
    window.addEventListener('resize', fixViewportHeight);
    window.addEventListener('orientationchange', fixViewportHeight);

    // Fix iOS rubber band scrolling
    document.body.style.overscrollBehavior = 'none';
  }

  /**
   * Apply Android-specific optimizations
   */
  applyAndroidOptimizations() {
    document.body.classList.add('android-device');

    // Improve scroll performance on Android
    document.body.style.touchAction = 'manipulation';
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.eventListeners.set('resize', this.handleResize);
    this.eventListeners.set('orientationchange', this.handleOrientationChange);
    this.eventListeners.set('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Debounce resize handling
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      const newBreakpoint = this.getCurrentBreakpoint();
      if (newBreakpoint !== this.currentBreakpoint) {
        this.handleBreakpointChange(this.currentBreakpoint, newBreakpoint);
        this.currentBreakpoint = newBreakpoint;
      }

      // Update viewport height for iOS
      if (this.isIOS()) {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      }

      this.emit('resize', { width: window.innerWidth, height: window.innerHeight });
    }, 150);
  }

  /**
   * Handle orientation change
   */
  handleOrientationChange() {
    setTimeout(() => {
      const orientation = screen.orientation?.angle === 0 || screen.orientation?.angle === 180 ? 'portrait' : 'landscape';
      document.body.className = document.body.className.replace(/\b(portrait|landscape)\b/g, '').trim();
      document.body.classList.add(orientation);

      this.emit('orientationChange', { orientation });
    }, 100); // Small delay to ensure orientation has changed
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Pause performance monitoring when page is hidden
      fpsMonitor.stop();
      this.emit('pageHidden');
    } else {
      // Resume monitoring when page becomes visible
      if (this.isMobile || this.isTablet) {
        fpsMonitor.start();
      }
      this.emit('pageVisible');
    }
  }

  /**
   * Device detection methods
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  detectTablet() {
    return /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent) ||
           (window.innerWidth > 768 && window.innerWidth <= 1024 && 'ontouchstart' in window);
  }

  detectTouchSupport() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
  }

  /**
   * Utility methods
   */
  cleanupUnusedElements() {
    // Remove elements that are not visible and not needed
    const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');
    hiddenElements.forEach(element => {
      if (!element.dataset.keepHidden) {
        element.remove();
      }
    });
  }

  clearImageCaches() {
    this.optimizedImages.clear();
    this.lazyLoadQueue.clear();
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return {
      fps: fpsMonitor.getFPS(),
      averageFPS: fpsMonitor.getAverageFPS(),
      memory: memoryMonitor.getSnapshots(),
      networkInfo: this.networkInfo,
      deviceInfo: {
        isMobile: this.isMobile,
        isTablet: this.isTablet,
        touchSupport: this.touchSupport,
        devicePixelRatio: this.devicePixelRatio
      },
      currentBreakpoint: this.currentBreakpoint
    };
  }

  /**
   * Log device information
   */
  logDeviceInfo() {
    const info = {
      device: this.isMobile ? 'Mobile' : this.isTablet ? 'Tablet' : 'Desktop',
      touchSupport: this.touchSupport,
      devicePixelRatio: this.devicePixelRatio,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      currentBreakpoint: this.currentBreakpoint,
      networkInfo: this.networkInfo
    };

    logger.info('📱 Device Information:', info);
  }

  /**
   * Event emitter methods
   */
  emit(eventName, data) {
    const event = new CustomEvent(`mobileOptimization:${eventName}`, { detail: data });
    document.dispatchEvent(event);
  }

  on(eventName, callback) {
    document.addEventListener(`mobileOptimization:${eventName}`, callback);
  }

  off(eventName, callback) {
    document.removeEventListener(`mobileOptimization:${eventName}`, callback);
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Stop performance monitoring
    fpsMonitor.stop();

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Remove event listeners
    this.eventListeners.forEach((listener, event) => {
      if (event === 'networkChange' && 'connection' in navigator) {
        navigator.connection.removeEventListener('change', listener);
      } else {
        window.removeEventListener(event, listener);
      }
    });
    this.eventListeners.clear();

    // Clear timeouts
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Clear caches
    this.clearImageCaches();

    this.isInitialized = false;
    logger.info('Mobile optimization service destroyed');
  }
}

// Create and export singleton instance
export const mobileOptimizationService = new MobileOptimizationService();
export default mobileOptimizationService;