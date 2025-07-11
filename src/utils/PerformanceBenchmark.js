/**
 * PerformanceBenchmark.js
 * 
 * Comprehensive performance benchmarking system for profile operations
 * Measures and analyzes the effectiveness of performance optimizations
 */

class PerformanceBenchmark {
  constructor(options = {}) {
    this.options = {
      maxSamples: options.maxSamples || 1000,
      warmupRuns: options.warmupRuns || 10,
      enableAutoLogging: options.enableAutoLogging !== false,
      enableMemoryTracking: options.enableMemoryTracking !== false,
      samplingInterval: options.samplingInterval || 100 // ms
    };
    
    // Benchmark data storage
    this.benchmarks = new Map();
    this.memorySnapshots = [];
    this.systemMetrics = {
      startTime: performance.now(),
      totalOperations: 0,
      averageOperationTime: 0,
      peakMemoryUsage: 0,
      currentMemoryUsage: 0
    };
    
    // Performance observers
    this.performanceObserver = null;
    this.memoryObserver = null;
    
    this.init();
  }
  
  /**
   * Initialize the benchmark system
   */
  init() {
    this.setupPerformanceObserver();
    this.setupMemoryTracking();
    this.startSystemMonitoring();
  }
  
  /**
   * Setup Performance Observer for automatic measurement
   */
  setupPerformanceObserver() {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.startsWith('learnimals:')) {
            this.recordPerformanceEntry(entry);
          }
        });
      });
      
      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e);
      }
    }
  }
  
  /**
   * Setup memory tracking if available
   */
  setupMemoryTracking() {
    if (this.options.enableMemoryTracking && performance.memory) {
      setInterval(() => {
        this.recordMemorySnapshot();
      }, this.options.samplingInterval);
    }
  }
  
  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    // Monitor frame rate
    this.frameRateMonitor = new FrameRateMonitor();
    
    // Monitor user interactions
    this.setupInteractionTracking();
  }
  
  /**
   * Setup interaction tracking for responsiveness metrics
   */
  setupInteractionTracking() {
    ['click', 'scroll', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        this.measureInteractionLatency(eventType, e);
      }, { passive: true });
    });
  }
  
  /**
   * Measure interaction latency
   */
  measureInteractionLatency(eventType, event) {
    const startTime = event.timeStamp || performance.now();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      this.recordBenchmark(`interaction:${eventType}`, {
        duration: latency,
        timestamp: startTime,
        elementType: event.target.tagName,
        elementId: event.target.id
      });
    });
  }
  
  /**
   * Create a benchmark suite for testing
   */
  createSuite(suiteName) {
    return new BenchmarkSuite(suiteName, this);
  }
  
  /**
   * Benchmark a specific operation
   */
  async benchmark(name, operation, options = {}) {
    const config = {
      runs: options.runs || 100,
      warmup: options.warmup || this.options.warmupRuns,
      async: options.async || false,
      setup: options.setup || null,
      teardown: options.teardown || null,
      ...options
    };
    
    // Warmup runs
    for (let i = 0; i < config.warmup; i++) {
      if (config.setup) await config.setup();
      if (config.async) {
        await operation();
      } else {
        operation();
      }
      if (config.teardown) await config.teardown();
    }
    
    // Actual benchmark runs
    const measurements = [];
    const startMemory = this.getCurrentMemoryUsage();
    
    for (let i = 0; i < config.runs; i++) {
      if (config.setup) await config.setup();
      
      const startTime = performance.now();
      const startMark = `${name}-start-${i}`;
      const endMark = `${name}-end-${i}`;
      
      performance.mark(startMark);
      
      if (config.async) {
        await operation();
      } else {
        operation();
      }
      
      performance.mark(endMark);
      const endTime = performance.now();
      
      performance.measure(`learnimals:${name}-${i}`, startMark, endMark);
      
      measurements.push({
        duration: endTime - startTime,
        memory: this.getCurrentMemoryUsage(),
        timestamp: startTime,
        run: i
      });
      
      if (config.teardown) await config.teardown();
      
      // Allow for garbage collection between runs
      if (i % 10 === 0) {
        await this.sleep(1);
      }
    }
    
    const endMemory = this.getCurrentMemoryUsage();
    const results = this.analyzeMeasurements(name, measurements, {
      startMemory,
      endMemory,
      config
    });
    
    this.recordBenchmark(name, results);
    return results;
  }
  
  /**
   * Compare performance of multiple implementations
   */
  async compare(comparisonName, implementations, options = {}) {
    const results = {};
    
    for (const [name, implementation] of Object.entries(implementations)) {
      console.log(`Benchmarking ${name}...`);
      results[name] = await this.benchmark(`${comparisonName}:${name}`, implementation, options);
    }
    
    return this.analyzeComparison(comparisonName, results);
  }
  
  /**
   * Benchmark profile-specific operations
   */
  async benchmarkProfileOperations() {
    const suite = this.createSuite('Profile Operations');
    
    // Mock data for testing
    const mockProfile = this.generateMockProfile();
    const mockAchievements = this.generateMockAchievements(100);
    
    // Benchmark profile loading
    await suite.add('Profile Load', () => {
      return this.mockProfileLoad(mockProfile);
    });
    
    // Benchmark profile saving
    await suite.add('Profile Save', () => {
      return this.mockProfileSave(mockProfile);
    });
    
    // Benchmark achievement filtering
    await suite.add('Achievement Filter', () => {
      return this.mockAchievementFilter(mockAchievements, 'unlocked');
    });
    
    // Benchmark XP calculation
    await suite.add('XP Calculation', () => {
      return this.mockXPCalculation(mockProfile.xp + 100);
    });
    
    // Benchmark level progress
    await suite.add('Level Progress Update', () => {
      return this.mockLevelProgressUpdate(mockProfile);
    });
    
    return suite.run();
  }
  
  /**
   * Benchmark storage operations
   */
  async benchmarkStorageOperations() {
    const suite = this.createSuite('Storage Operations');
    
    const testData = this.generateTestData();
    
    // Benchmark localStorage operations
    await suite.add('localStorage Write', () => {
      localStorage.setItem('test_key', JSON.stringify(testData));
    });
    
    await suite.add('localStorage Read', () => {
      return JSON.parse(localStorage.getItem('test_key'));
    });
    
    // Benchmark with compression (if implemented)
    const compressedData = this.compressData(testData);
    await suite.add('Compressed Storage Write', () => {
      localStorage.setItem('test_compressed', compressedData);
    });
    
    await suite.add('Compressed Storage Read', () => {
      return this.decompressData(localStorage.getItem('test_compressed'));
    });
    
    // Cleanup
    suite.teardown(() => {
      localStorage.removeItem('test_key');
      localStorage.removeItem('test_compressed');
    });
    
    return suite.run();
  }
  
  /**
   * Benchmark UI operations
   */
  async benchmarkUIOperations() {
    const suite = this.createSuite('UI Operations');
    
    // Create test container
    const container = document.createElement('div');
    container.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
    document.body.appendChild(container);
    
    // Benchmark DOM creation
    await suite.add('DOM Creation', () => {
      const element = document.createElement('div');
      element.className = 'test-element';
      element.innerHTML = '<span>Test content</span>';
      return element;
    });
    
    // Benchmark DOM manipulation
    await suite.add('DOM Manipulation', () => {
      const element = container.querySelector('.test-element') || document.createElement('div');
      element.textContent = `Updated at ${Date.now()}`;
      if (!element.parentNode) {
        container.appendChild(element);
      }
    });
    
    // Benchmark CSS animation
    await suite.add('CSS Animation', () => {
      const element = container.querySelector('.test-element');
      if (element) {
        element.style.transform = `translateX(${Math.random() * 100}px)`;
      }
    });
    
    // Cleanup
    suite.teardown(() => {
      document.body.removeChild(container);
    });
    
    return suite.run();
  }
  
  /**
   * Analyze measurements and calculate statistics
   */
  analyzeMeasurements(name, measurements, metadata = {}) {
    const durations = measurements.map(m => m.duration);
    const sorted = durations.slice().sort((a, b) => a - b);
    
    const stats = {
      name,
      timestamp: Date.now(),
      runs: measurements.length,
      
      // Time statistics
      min: Math.min(...durations),
      max: Math.max(...durations),
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: this.getPercentile(sorted, 50),
      p95: this.getPercentile(sorted, 95),
      p99: this.getPercentile(sorted, 99),
      
      // Memory statistics
      memoryDelta: metadata.endMemory - metadata.startMemory,
      avgMemoryPerOp: metadata.endMemory / measurements.length,
      
      // Variability
      variance: this.calculateVariance(durations),
      standardDeviation: 0,
      coefficientOfVariation: 0,
      
      // Outliers
      outliers: this.detectOutliers(durations),
      
      // Raw data
      measurements: measurements.slice(-50), // Keep last 50 for analysis
      metadata
    };
    
    stats.standardDeviation = Math.sqrt(stats.variance);
    stats.coefficientOfVariation = stats.standardDeviation / stats.mean;
    
    return stats;
  }
  
  /**
   * Analyze comparison results
   */
  analyzeComparison(name, results) {
    const implementations = Object.keys(results);
    const comparison = {
      name,
      timestamp: Date.now(),
      implementations,
      fastest: null,
      slowest: null,
      speedupRatios: {},
      memoryComparison: {},
      recommendation: null
    };
    
    // Find fastest and slowest
    let fastestTime = Infinity;
    let slowestTime = 0;
    
    implementations.forEach(impl => {
      const mean = results[impl].mean;
      if (mean < fastestTime) {
        fastestTime = mean;
        comparison.fastest = impl;
      }
      if (mean > slowestTime) {
        slowestTime = mean;
        comparison.slowest = impl;
      }
    });
    
    // Calculate speedup ratios
    implementations.forEach(impl => {
      comparison.speedupRatios[impl] = results[comparison.fastest].mean / results[impl].mean;
    });
    
    // Memory comparison
    implementations.forEach(impl => {
      comparison.memoryComparison[impl] = {
        delta: results[impl].memoryDelta,
        avgPerOp: results[impl].avgMemoryPerOp
      };
    });
    
    // Generate recommendation
    comparison.recommendation = this.generateRecommendation(comparison, results);
    
    return comparison;
  }
  
  /**
   * Generate performance recommendation
   */
  generateRecommendation(comparison, results) {
    const fastest = comparison.fastest;
    const fastestResult = results[fastest];
    
    let recommendation = `Use ${fastest} for best performance. `;
    
    if (fastestResult.coefficientOfVariation > 0.3) {
      recommendation += 'However, performance is inconsistent - consider optimization. ';
    }
    
    if (fastestResult.memoryDelta > 1000000) { // 1MB
      recommendation += 'Monitor memory usage as it has high memory consumption. ';
    }
    
    const secondFastest = Object.keys(comparison.speedupRatios)
      .filter(impl => impl !== fastest)
      .sort((a, b) => comparison.speedupRatios[a] - comparison.speedupRatios[b])[0];
    
    if (secondFastest && comparison.speedupRatios[secondFastest] > 0.95) {
      recommendation += `${secondFastest} is also competitive and might be preferred for stability.`;
    }
    
    return recommendation;
  }
  
  /**
   * Record a benchmark result
   */
  recordBenchmark(name, data) {
    if (!this.benchmarks.has(name)) {
      this.benchmarks.set(name, []);
    }
    
    const results = this.benchmarks.get(name);
    results.push(data);
    
    // Maintain max samples limit
    if (results.length > this.options.maxSamples) {
      results.shift();
    }
    
    this.systemMetrics.totalOperations++;
    this.updateSystemMetrics();
    
    if (this.options.enableAutoLogging) {
      console.log(`Benchmark ${name}:`, data);
    }
  }
  
  /**
   * Record performance entry from PerformanceObserver
   */
  recordPerformanceEntry(entry) {
    this.recordBenchmark(entry.name, {
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now(),
      entryType: entry.entryType
    });
  }
  
  /**
   * Record memory snapshot
   */
  recordMemorySnapshot() {
    if (!performance.memory) return;
    
    const snapshot = {
      timestamp: Date.now(),
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
    
    this.memorySnapshots.push(snapshot);
    this.systemMetrics.currentMemoryUsage = snapshot.used;
    
    if (snapshot.used > this.systemMetrics.peakMemoryUsage) {
      this.systemMetrics.peakMemoryUsage = snapshot.used;
    }
    
    // Maintain snapshots limit
    if (this.memorySnapshots.length > this.options.maxSamples) {
      this.memorySnapshots.shift();
    }
  }
  
  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    return performance.memory ? performance.memory.usedJSHeapSize : 0;
  }
  
  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    const totalTime = performance.now() - this.systemMetrics.startTime;
    this.systemMetrics.averageOperationTime = totalTime / this.systemMetrics.totalOperations;
  }
  
  /**
   * Get percentile value from sorted array
   */
  getPercentile(sorted, percentile) {
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
  
  /**
   * Calculate variance
   */
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  }
  
  /**
   * Detect outliers using IQR method
   */
  detectOutliers(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const q1 = this.getPercentile(sorted, 25);
    const q3 = this.getPercentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(v => v < lowerBound || v > upperBound);
  }
  
  /**
   * Generate mock data for testing
   */
  generateMockProfile() {
    return {
      id: 'test_profile',
      name: 'Test User',
      xp: 1250,
      level: 12,
      achievements: Array.from({ length: 50 }, (_, i) => ({
        id: `achievement_${i}`,
        unlocked: Math.random() > 0.5,
        progress: { current: Math.floor(Math.random() * 100), required: 100 }
      }))
    };
  }
  
  generateMockAchievements(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: `achievement_${i}`,
      name: `Achievement ${i}`,
      description: `Description for achievement ${i}`,
      unlocked: Math.random() > 0.5,
      rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)]
    }));
  }
  
  generateTestData() {
    return {
      profiles: this.generateMockProfile(),
      achievements: this.generateMockAchievements(100),
      settings: { theme: 'dark', sound: true },
      largeArray: new Array(1000).fill(0).map((_, i) => ({ id: i, data: `item_${i}` }))
    };
  }
  
  /**
   * Mock operations for benchmarking
   */
  mockProfileLoad(profile) {
    return JSON.parse(JSON.stringify(profile));
  }
  
  mockProfileSave(profile) {
    return JSON.stringify(profile);
  }
  
  mockAchievementFilter(achievements, filter) {
    return achievements.filter(a => filter === 'unlocked' ? a.unlocked : !a.unlocked);
  }
  
  mockXPCalculation(newXP) {
    return Math.floor(newXP / 100) + 1;
  }
  
  mockLevelProgressUpdate(profile) {
    const newXP = profile.xp + 50;
    const newLevel = Math.floor(newXP / 100) + 1;
    return { ...profile, xp: newXP, level: newLevel };
  }
  
  compressData(data) {
    return btoa(JSON.stringify(data));
  }
  
  decompressData(compressed) {
    return JSON.parse(atob(compressed));
  }
  
  /**
   * Utility methods
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get all benchmark results
   */
  getAllResults() {
    return {
      benchmarks: Object.fromEntries(this.benchmarks),
      systemMetrics: this.systemMetrics,
      memorySnapshots: this.memorySnapshots.slice(-100), // Last 100 snapshots
      frameRate: this.frameRateMonitor ? this.frameRateMonitor.getStats() : null
    };
  }
  
  /**
   * Export results for analysis
   */
  exportResults() {
    return JSON.stringify(this.getAllResults(), null, 2);
  }
  
  /**
   * Clear all benchmark data
   */
  clear() {
    this.benchmarks.clear();
    this.memorySnapshots = [];
    this.systemMetrics = {
      startTime: performance.now(),
      totalOperations: 0,
      averageOperationTime: 0,
      peakMemoryUsage: 0,
      currentMemoryUsage: 0
    };
  }
  
  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.frameRateMonitor) {
      this.frameRateMonitor.destroy();
    }
    
    this.clear();
  }
}

/**
 * BenchmarkSuite class for organizing related benchmarks
 */
class BenchmarkSuite {
  constructor(name, benchmark) {
    this.name = name;
    this.benchmark = benchmark;
    this.tests = [];
    this.setupFn = null;
    this.teardownFn = null;
  }
  
  setup(fn) {
    this.setupFn = fn;
    return this;
  }
  
  teardown(fn) {
    this.teardownFn = fn;
    return this;
  }
  
  add(testName, testFn, options = {}) {
    this.tests.push({
      name: `${this.name}:${testName}`,
      fn: testFn,
      options: {
        setup: this.setupFn,
        teardown: this.teardownFn,
        ...options
      }
    });
    return this;
  }
  
  async run() {
    const results = {};
    
    for (const test of this.tests) {
      console.log(`Running ${test.name}...`);
      results[test.name] = await this.benchmark.benchmark(test.name, test.fn, test.options);
    }
    
    return results;
  }
}

/**
 * Frame Rate Monitor for UI performance
 */
class FrameRateMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.frameRates = [];
    this.isRunning = false;
    this.rafId = null;
    
    this.start();
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.measure();
  }
  
  measure() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    this.frameCount++;
    
    const deltaTime = currentTime - this.lastTime;
    if (deltaTime >= 1000) { // Every second
      const fps = (this.frameCount * 1000) / deltaTime;
      this.frameRates.push(fps);
      
      if (this.frameRates.length > 60) { // Keep last 60 seconds
        this.frameRates.shift();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    this.rafId = requestAnimationFrame(() => this.measure());
  }
  
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
  
  getStats() {
    if (this.frameRates.length === 0) return null;
    
    const avg = this.frameRates.reduce((a, b) => a + b, 0) / this.frameRates.length;
    const min = Math.min(...this.frameRates);
    const max = Math.max(...this.frameRates);
    
    return {
      average: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      current: this.frameRates[this.frameRates.length - 1] || 0,
      samples: this.frameRates.length
    };
  }
  
  destroy() {
    this.stop();
    this.frameRates = [];
  }
}

// Create and export singleton instance
const performanceBenchmark = new PerformanceBenchmark({
  maxSamples: 500,
  warmupRuns: 5,
  enableAutoLogging: false,
  enableMemoryTracking: true,
  samplingInterval: 200
});

export default performanceBenchmark;