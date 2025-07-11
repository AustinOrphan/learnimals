/**
 * AnimationManager.js
 * 
 * Central animation control system that builds on existing animation infrastructure
 * Provides performance monitoring, configuration management, and enhanced control
 */

import animationHelpers from './animationHelpers.js';
import debouncedOperations from './debouncedOperations.js';
import performanceBenchmark from './PerformanceBenchmark.js';

class AnimationManager {
  constructor() {
    // Core animation system
    this.helpers = animationHelpers;
    
    // Animation configuration
    this.config = {
      globalEnabled: true,
      respectReducedMotion: true,
      performanceMode: 'auto', // 'auto', 'performance', 'quality'
      debugMode: false,
      maxConcurrentAnimations: 10,
      defaultDuration: {
        fast: 200,
        normal: 400,
        slow: 800
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    };
    
    // Performance tracking
    this.activeAnimations = new Map();
    this.animationStats = {
      totalAnimations: 0,
      completedAnimations: 0,
      droppedFrames: 0,
      averageDuration: 0,
      performanceScore: 100
    };
    
    // Animation queues with priority
    this.queues = {
      immediate: [],
      high: [],
      normal: [],
      low: []
    };
    
    this.isProcessing = false;
    this.frameRate = 60;
    this.lastFrameTime = 0;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the animation manager
   */
  init() {
    this.setupPerformanceMonitoring();
    this.setupReducedMotionDetection();
    this.setupGlobalEventListeners();
    this.optimizeForDevice();
    
    if (this.config.debugMode) {
      this.enableDebugMode();
    }
  }
  
  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.frameRate = Math.round(frameCount * 1000 / (currentTime - lastTime));
        
        // Adjust performance mode based on frame rate
        if (this.config.performanceMode === 'auto') {
          if (this.frameRate < 45) {
            this.enablePerformanceMode();
          } else if (this.frameRate > 55) {
            this.enableQualityMode();
          }
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
    
    // Monitor memory usage for animations
    if (performance.memory) {
      setInterval(() => {
        const memoryUsage = performance.memory.usedJSHeapSize;
        if (memoryUsage > 50 * 1024 * 1024) { // 50MB threshold
          this.enablePerformanceMode();
        }
      }, 5000);
    }
  }
  
  /**
   * Setup reduced motion detection
   */
  setupReducedMotionDetection() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotionChange = (e) => {
      if (this.config.respectReducedMotion) {
        this.config.globalEnabled = !e.matches;
        
        if (e.matches) {
          this.clearAllQueues();
          this.stopAllAnimations();
        }
        
        this.log('Reduced motion preference changed:', e.matches ? 'enabled' : 'disabled');
      }
    };
    
    mediaQuery.addListener(handleReducedMotionChange);
    handleReducedMotionChange(mediaQuery);
  }
  
  /**
   * Setup global event listeners
   */
  setupGlobalEventListeners() {
    // Pause animations when page is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllAnimations();
      } else {
        this.resumeAllAnimations();
      }
    });
    
    // Optimize for page focus
    window.addEventListener('focus', () => {
      this.resumeAllAnimations();
    });
    
    window.addEventListener('blur', () => {
      if (this.config.performanceMode !== 'quality') {
        this.pauseAllAnimations();
      }
    });
  }
  
  /**
   * Optimize for current device
   */
  optimizeForDevice() {
    // Check device capabilities
    const deviceCapabilities = {
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isLowEnd: navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4,
      hasLimitedMemory: navigator.deviceMemory && navigator.deviceMemory < 4,
      supportsWillChange: CSS.supports('will-change', 'transform'),
      supportsTransform3d: CSS.supports('transform', 'translateZ(0)')
    };
    
    // Auto-adjust settings based on device
    if (deviceCapabilities.isMobile || deviceCapabilities.isLowEnd || deviceCapabilities.hasLimitedMemory) {
      this.enablePerformanceMode();
    }
    
    // Store capabilities for future reference
    this.deviceCapabilities = deviceCapabilities;
    
    this.log('Device capabilities detected:', deviceCapabilities);
  }
  
  /**
   * Enable performance mode (reduced animations)
   */
  enablePerformanceMode() {
    this.config.performanceMode = 'performance';
    this.config.maxConcurrentAnimations = 5;
    this.config.defaultDuration.normal = 200;
    this.config.defaultDuration.slow = 400;
    
    // Disable heavy animations
    document.documentElement.classList.add('performance-mode');
    
    this.log('Performance mode enabled');
  }
  
  /**
   * Enable quality mode (full animations)
   */
  enableQualityMode() {
    this.config.performanceMode = 'quality';
    this.config.maxConcurrentAnimations = 15;
    this.config.defaultDuration.normal = 400;
    this.config.defaultDuration.slow = 800;
    
    document.documentElement.classList.remove('performance-mode');
    
    this.log('Quality mode enabled');
  }
  
  /**
   * Create a managed animation
   */
  createAnimation(element, options = {}) {
    if (!this.shouldAnimate()) {
      return Promise.resolve();
    }
    
    const animationId = this.generateAnimationId();
    const config = this.normalizeAnimationConfig(options);
    
    // Track animation
    const animationData = {
      id: animationId,
      element,
      config,
      startTime: null,
      endTime: null,
      status: 'pending'
    };
    
    this.activeAnimations.set(animationId, animationData);
    
    // Queue based on priority
    const queueName = config.priority || 'normal';
    if (this.queues[queueName]) {
      this.queues[queueName].push(animationData);
    } else {
      this.queues.normal.push(animationData);
    }
    
    this.processQueues();
    
    return new Promise((resolve, reject) => {
      animationData.resolve = resolve;
      animationData.reject = reject;
    });
  }
  
  /**
   * Process animation queues
   */
  async processQueues() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    const queueOrder = ['immediate', 'high', 'normal', 'low'];
    
    for (const queueName of queueOrder) {
      const queue = this.queues[queueName];
      
      while (queue.length > 0 && this.activeAnimations.size < this.config.maxConcurrentAnimations) {
        const animationData = queue.shift();
        await this.executeAnimation(animationData);
      }
    }
    
    this.isProcessing = false;
    
    // Continue processing if more animations are queued
    if (this.hasQueuedAnimations()) {
      setTimeout(() => this.processQueues(), 16); // Next frame
    }
  }
  
  /**
   * Execute a single animation
   */
  async executeAnimation(animationData) {
    const { id, element, config } = animationData;
    
    try {
      animationData.status = 'running';
      animationData.startTime = performance.now();
      
      // Performance monitoring
      const startMark = `animation-${id}-start`;
      const endMark = `animation-${id}-end`;
      
      performance.mark(startMark);
      
      // Execute animation based on type
      let result;
      switch (config.type) {
      case 'entrance':
        result = await this.helpers.animateIn(element, config.animation, config.options);
        break;
      case 'exit':
        result = await this.helpers.animateOut(element, config.animation, config.options);
        break;
      case 'number':
        result = await this.helpers.animateNumber(element, config.from, config.to, config.options);
        break;
      case 'progress':
        result = await this.helpers.animateProgress(element, config.target, config.options);
        break;
      case 'xp':
        result = await this.helpers.animateXPGain(element, config.amount, config.options);
        break;
      case 'celebration':
        result = await this.helpers.celebrateLevelUp(element, config.options);
        break;
      case 'stagger':
        result = await this.helpers.staggerAnimation(config.elements, config.animation, config.options);
        break;
      default:
        result = await this.helpers.animateIn(element, config.animation, config.options);
      }
      
      performance.mark(endMark);
      performance.measure(`animation-${id}`, startMark, endMark);
      
      animationData.status = 'completed';
      animationData.endTime = performance.now();
      
      // Update stats
      this.updateAnimationStats(animationData);
      
      // Resolve promise
      if (animationData.resolve) {
        animationData.resolve(result);
      }
      
    } catch (error) {
      animationData.status = 'error';
      animationData.error = error;
      
      this.log('Animation error:', error);
      
      if (animationData.reject) {
        animationData.reject(error);
      }
    } finally {
      // Clean up
      this.activeAnimations.delete(id);
    }
  }
  
  /**
   * Normalize animation configuration
   */
  normalizeAnimationConfig(options) {
    const defaults = {
      type: 'entrance',
      animation: 'fadeIn',
      priority: 'normal',
      respectPerformanceMode: true,
      options: {}
    };
    
    const config = { ...defaults, ...options };
    
    // Adjust for performance mode
    if (config.respectPerformanceMode && this.config.performanceMode === 'performance') {
      config.options.duration = Math.min(config.options.duration || this.config.defaultDuration.normal, 300);
      
      // Simplify complex animations in performance mode
      if (['bounceIn', 'wiggle', 'float'].includes(config.animation)) {
        config.animation = 'fadeIn';
      }
    }
    
    return config;
  }
  
  /**
   * Update animation statistics
   */
  updateAnimationStats(animationData) {
    this.animationStats.totalAnimations++;
    
    if (animationData.status === 'completed') {
      this.animationStats.completedAnimations++;
      
      const duration = animationData.endTime - animationData.startTime;
      this.animationStats.averageDuration = 
        (this.animationStats.averageDuration * (this.animationStats.completedAnimations - 1) + duration) 
        / this.animationStats.completedAnimations;
    }
    
    // Calculate performance score
    const completionRate = this.animationStats.completedAnimations / this.animationStats.totalAnimations;
    this.animationStats.performanceScore = Math.round(completionRate * 100);
    
    // Log to performance benchmark if available
    if (animationData.endTime && animationData.startTime) {
      const duration = animationData.endTime - animationData.startTime;
      performanceBenchmark.recordBenchmark(`animation:${animationData.config.type}:${animationData.config.animation}`, {
        duration,
        timestamp: animationData.startTime,
        element: animationData.element?.tagName || 'unknown',
        config: animationData.config
      });
    }
  }
  
  /**
   * Convenience methods for common animations
   */
  
  // Entrance animations
  fadeIn(element, options = {}) {
    return this.createAnimation(element, {
      type: 'entrance',
      animation: 'fadeIn',
      options,
      priority: options.priority || 'normal'
    });
  }
  
  slideInUp(element, options = {}) {
    return this.createAnimation(element, {
      type: 'entrance',
      animation: 'fadeInUp',
      options,
      priority: options.priority || 'normal'
    });
  }
  
  bounceIn(element, options = {}) {
    return this.createAnimation(element, {
      type: 'entrance',
      animation: 'bounceIn',
      options,
      priority: options.priority || 'normal'
    });
  }
  
  // Progress animations
  animateProgress(element, targetPercent, options = {}) {
    return this.createAnimation(element, {
      type: 'progress',
      target: targetPercent,
      options,
      priority: options.priority || 'high'
    });
  }
  
  // Number animations
  countUp(element, from, to, options = {}) {
    return this.createAnimation(element, {
      type: 'number',
      from,
      to,
      options,
      priority: options.priority || 'normal'
    });
  }
  
  // XP animations
  showXPGain(container, amount, options = {}) {
    return this.createAnimation(container, {
      type: 'xp',
      amount,
      options,
      priority: 'high'
    });
  }
  
  // Celebration animations
  celebrateLevelUp(element, options = {}) {
    return this.createAnimation(element, {
      type: 'celebration',
      options,
      priority: 'immediate'
    });
  }
  
  // Stagger animations
  staggerIn(elements, animationType = 'fadeInUp', options = {}) {
    return this.createAnimation(null, {
      type: 'stagger',
      elements,
      animation: animationType,
      options,
      priority: options.priority || 'normal'
    });
  }
  
  /**
   * Enhanced hover and interaction effects with debouncing
   */
  addInteractionEffects(element, effects = {}) {
    const {
      hover = 'lift',
      click = 'shrink',
      focus = true
    } = effects;
    
    if (hover) {
      this.helpers.addHoverEffect(element, hover);
    }
    
    if (click) {
      this.helpers.addClickEffect(element, click);
    }
    
    if (focus && element.matches('input, button, select, textarea, [tabindex]')) {
      const debouncedFocus = debouncedOperations.ui.validation(() => {
        element.classList.add('focus-glow');
      });
      
      const debouncedBlur = debouncedOperations.ui.validation(() => {
        element.classList.remove('focus-glow');
      });
      
      element.addEventListener('focus', debouncedFocus);
      element.addEventListener('blur', debouncedBlur);
    }
  }
  
  /**
   * Loading states with performance optimization
   */
  showLoadingState(element, type = 'spinner', options = {}) {
    // Debounce loading states to prevent flicker
    const debouncedShow = debouncedOperations.ui.modal(() => {
      this.helpers.showLoading(element, type, options);
    });
    
    return debouncedShow();
  }
  
  hideLoadingState(element) {
    const debouncedHide = debouncedOperations.ui.modal(() => {
      this.helpers.hideLoading(element);
    });
    
    return debouncedHide();
  }
  
  /**
   * Utility methods
   */
  
  shouldAnimate() {
    return this.config.globalEnabled && this.helpers.shouldAnimate();
  }
  
  hasQueuedAnimations() {
    return Object.values(this.queues).some(queue => queue.length > 0);
  }
  
  generateAnimationId() {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  pauseAllAnimations() {
    this.activeAnimations.forEach(animation => {
      if (animation.element && animation.element.style) {
        animation.element.style.animationPlayState = 'paused';
      }
    });
  }
  
  resumeAllAnimations() {
    this.activeAnimations.forEach(animation => {
      if (animation.element && animation.element.style) {
        animation.element.style.animationPlayState = 'running';
      }
    });
  }
  
  stopAllAnimations() {
    this.activeAnimations.forEach(animation => {
      if (animation.element) {
        // Remove all animation classes
        animation.element.className = animation.element.className.replace(/animate-\S+/g, '');
        animation.element.style.animation = '';
      }
    });
    
    this.activeAnimations.clear();
    this.clearAllQueues();
  }
  
  clearAllQueues() {
    Object.keys(this.queues).forEach(key => {
      this.queues[key] = [];
    });
  }
  
  /**
   * Configuration methods
   */
  
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.debugMode !== undefined) {
      if (newConfig.debugMode) {
        this.enableDebugMode();
      } else {
        this.disableDebugMode();
      }
    }
  }
  
  getConfig() {
    return { ...this.config };
  }
  
  getStats() {
    return {
      ...this.animationStats,
      frameRate: this.frameRate,
      activeAnimations: this.activeAnimations.size,
      queuedAnimations: Object.values(this.queues).reduce((total, queue) => total + queue.length, 0),
      deviceCapabilities: this.deviceCapabilities
    };
  }
  
  /**
   * Debug mode
   */
  enableDebugMode() {
    this.config.debugMode = true;
    
    // Add visual debug indicators
    document.documentElement.classList.add('animation-debug');
    
    // Log all animations
    this.originalCreateAnimation = this.createAnimation;
    this.createAnimation = (element, options) => {
      this.log('Creating animation:', { element, options });
      return this.originalCreateAnimation.call(this, element, options);
    };
    
    this.log('Animation debug mode enabled');
  }
  
  disableDebugMode() {
    this.config.debugMode = false;
    
    document.documentElement.classList.remove('animation-debug');
    
    if (this.originalCreateAnimation) {
      this.createAnimation = this.originalCreateAnimation;
      delete this.originalCreateAnimation;
    }
    
    this.log('Animation debug mode disabled');
  }
  
  log(...args) {
    if (this.config.debugMode) {
      console.log('[AnimationManager]', ...args);
    }
  }
  
  /**
   * Performance analysis
   */
  async analyzePerformance() {
    const stats = this.getStats();
    
    const analysis = {
      overall: 'good',
      frameRate: stats.frameRate >= 55 ? 'excellent' : stats.frameRate >= 45 ? 'good' : 'poor',
      completionRate: stats.performanceScore >= 95 ? 'excellent' : stats.performanceScore >= 85 ? 'good' : 'poor',
      recommendations: []
    };
    
    if (stats.frameRate < 45) {
      analysis.recommendations.push('Consider enabling performance mode');
    }
    
    if (stats.queuedAnimations > 20) {
      analysis.recommendations.push('High animation queue - consider reducing concurrent animations');
    }
    
    if (stats.averageDuration > 1000) {
      analysis.recommendations.push('Long animation durations detected - consider shortening for better UX');
    }
    
    return analysis;
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.stopAllAnimations();
    this.clearAllQueues();
    
    // Remove event listeners would go here if we stored references
    
    this.log('AnimationManager destroyed');
  }
}

// Create and export singleton instance
const animationManager = new AnimationManager();

export default animationManager;