/**
 * CSS Performance Monitor
 * Tracks CSS load timing, cache metrics, and performance characteristics
 * for the component modularization system.
 * 
 * Requirements: FR-3.5, NFR-1.1, NFR-1.4
 */

import logger from './logger.js';
import { PerformanceMonitor } from './performanceUtils.js';

/**
 * CSS Performance Monitor for comprehensive CSS performance tracking
 * Monitors load timing, cache efficiency, and bundling metrics
 */
export class CSSPerformanceMonitor {
  constructor() {
    // Core metrics storage
    this.metrics = {
      loadTimes: new Map(),           // CSS file path -> load time data
      cacheHits: 0,                   // Cache hit counter
      cacheMisses: 0,                 // Cache miss counter
      bundleSize: 0,                  // Total CSS bundle size
      criticalPathDelay: 0,           // Delay in critical CSS loading
      totalRequests: 0,               // Total CSS requests made
      failedRequests: 0,              // Failed CSS requests
    };

    // Performance tracking
    this.loadingOperations = new Map(); // Track ongoing loads
    this.performanceHistory = [];        // Historical performance data
    this.thresholds = {
      slowLoadWarning: 100,            // Warn if CSS load > 100ms
      cacheHitRateTarget: 0.85,        // Target 85% cache hit rate
      maxAllowableIncrease: 0.10,      // Max 10% load time increase
    };

    // Integration with existing performance monitoring
    this.performanceMonitor = new PerformanceMonitor();
    this.isEnabled = true;
    
    // Initialize baseline performance data
    this.baselineMetrics = null;
    this.establishBaseline();
  }

  /**
   * Establish baseline performance metrics for comparison
   */
  establishBaseline() {
    // In a real implementation, this would load historical data
    // For now, we establish reasonable defaults
    this.baselineMetrics = {
      averageLoadTime: 50,     // 50ms baseline
      cacheHitRate: 0.75,      // 75% baseline cache hit rate
      bundleSize: 0,           // Will be established on first measurement
    };
    
    logger.debug('CSS Performance Monitor initialized with baseline metrics', this.baselineMetrics);
  }

  /**
   * Start tracking a CSS loading operation
   * @param {string} cssPath - Path to the CSS file being loaded
   * @param {Object} options - Additional tracking options
   * @returns {string} Operation ID for later reference
   */
  startLoadTracking(cssPath, options = {}) {
    if (!this.isEnabled) return null;

    const operationId = `${cssPath}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const startTime = performance.now();

    this.loadingOperations.set(operationId, {
      cssPath,
      startTime,
      isCritical: options.isCritical || false,
      size: options.size || null,
      fromCache: options.fromCache || false,
    });

    // Use the performance monitor for detailed tracking
    this.performanceMonitor.start(`css_load_${operationId}`);
    
    logger.debug(`Started CSS load tracking: ${cssPath}`, { operationId, isCritical: options.isCritical });
    
    return operationId;
  }

  /**
   * End tracking a CSS loading operation
   * @param {string} operationId - Operation ID from startLoadTracking
   * @param {Object} result - Load operation result
   */
  endLoadTracking(operationId, result = {}) {
    if (!this.isEnabled || !operationId) return;

    const operation = this.loadingOperations.get(operationId);
    if (!operation) {
      logger.warn(`No CSS load operation found for ID: ${operationId}`);
      return;
    }

    const endTime = performance.now();
    const loadTime = endTime - operation.startTime;
    
    // End the detailed performance tracking
    const detailedDuration = this.performanceMonitor.end(`css_load_${operationId}`);

    // Record the load time metrics
    this.recordLoadTime(operation.cssPath, operation.startTime, endTime, {
      isCritical: operation.isCritical,
      fromCache: operation.fromCache,
      size: result.size || operation.size,
      success: result.success !== false,
    });

    // Update cache metrics
    if (operation.fromCache) {
      this.recordCacheHit(operation.cssPath);
    } else {
      this.recordCacheMiss(operation.cssPath);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(operation.cssPath, loadTime, operation.isCritical);

    // Clean up
    this.loadingOperations.delete(operationId);
    
    logger.perf(`CSS load completed: ${operation.cssPath} in ${loadTime.toFixed(2)}ms`, {
      fromCache: operation.fromCache,
      isCritical: operation.isCritical,
      detailedDuration,
    });
  }

  /**
   * Record CSS load timing data
   * @param {string} cssPath - Path to the CSS file
   * @param {number} startTime - Load start time
   * @param {number} endTime - Load end time
   * @param {Object} metadata - Additional load metadata
   */
  recordLoadTime(cssPath, startTime, endTime, metadata = {}) {
    const loadTime = endTime - startTime;
    
    // Store detailed load time data
    const loadData = {
      loadTime,
      startTime,
      endTime,
      timestamp: Date.now(),
      isCritical: metadata.isCritical || false,
      fromCache: metadata.fromCache || false,
      size: metadata.size || null,
      success: metadata.success !== false,
    };

    this.metrics.loadTimes.set(cssPath, loadData);
    this.metrics.totalRequests++;

    if (!metadata.success) {
      this.metrics.failedRequests++;
    }

    // Update performance history for trend analysis
    this.performanceHistory.push({
      cssPath,
      loadTime,
      timestamp: Date.now(),
      fromCache: metadata.fromCache,
      isCritical: metadata.isCritical,
    });

    // Keep performance history manageable (last 100 loads)
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    // Update bundle size if provided
    if (metadata.size) {
      this.metrics.bundleSize += metadata.size;
    }

    // Track critical path delays
    if (metadata.isCritical && loadTime > 50) {
      this.metrics.criticalPathDelay += loadTime - 50;
    }
  }

  /**
   * Record a cache hit
   * @param {string} cssPath - Path to the cached CSS file
   */
  recordCacheHit(cssPath) {
    this.metrics.cacheHits++;
    logger.debug(`CSS cache hit: ${cssPath}`);
  }

  /**
   * Record a cache miss
   * @param {string} cssPath - Path to the CSS file that missed cache
   */
  recordCacheMiss(cssPath) {
    this.metrics.cacheMisses++;
    logger.debug(`CSS cache miss: ${cssPath}`);
  }

  /**
   * Check if current performance meets defined thresholds
   * @param {string} cssPath - Path to the CSS file
   * @param {number} loadTime - Load time in milliseconds
   * @param {boolean} isCritical - Whether this is critical CSS
   */
  checkPerformanceThresholds(cssPath, loadTime, isCritical) {
    // Check for slow loads
    if (loadTime > this.thresholds.slowLoadWarning) {
      logger.warn(`Slow CSS load detected: ${cssPath} took ${loadTime.toFixed(2)}ms`, {
        threshold: this.thresholds.slowLoadWarning,
        isCritical,
      });
    }

    // Check cache hit rate (NFR-1.4: must exceed 85%)
    const currentCacheHitRate = this.getCacheHitRate();
    if (currentCacheHitRate < this.thresholds.cacheHitRateTarget) {
      logger.warn(`CSS cache hit rate below target: ${(currentCacheHitRate * 100).toFixed(1)}%`, {
        target: `${(this.thresholds.cacheHitRateTarget * 100).toFixed(1)}%`,
        totalRequests: this.metrics.cacheHits + this.metrics.cacheMisses,
      });
    }

    // Check for performance regression (NFR-1.1: must not increase by more than 10%)
    this.checkPerformanceRegression(loadTime);
  }

  /**
   * Check for performance regression against baseline
   * @param {number} currentLoadTime - Current load time to check
   */
  checkPerformanceRegression(currentLoadTime) {
    if (!this.baselineMetrics) return;

    const averageLoadTime = this.getAverageLoadTime();
    const baselineTime = this.baselineMetrics.averageLoadTime;
    
    if (averageLoadTime > baselineTime) {
      const increase = (averageLoadTime - baselineTime) / baselineTime;
      
      if (increase > this.thresholds.maxAllowableIncrease) {
        logger.error(`CSS load time regression detected: ${(increase * 100).toFixed(1)}% increase`, {
          currentAverage: `${averageLoadTime.toFixed(2)}ms`,
          baseline: `${baselineTime.toFixed(2)}ms`,
          threshold: `${(this.thresholds.maxAllowableIncrease * 100).toFixed(1)}%`,
        });
      }
    }
  }

  /**
   * Get current cache hit rate
   * @returns {number} Cache hit rate as a decimal (0-1)
   */
  getCacheHitRate() {
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    return totalCacheRequests > 0 ? this.metrics.cacheHits / totalCacheRequests : 0;
  }

  /**
   * Get average CSS load time
   * @returns {number} Average load time in milliseconds
   */
  getAverageLoadTime() {
    const loadTimes = Array.from(this.metrics.loadTimes.values()).map(data => data.loadTime);
    return loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;
  }

  /**
   * Get comprehensive performance statistics
   * @returns {Object} Complete performance statistics
   */
  getStats() {
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = this.getCacheHitRate();
    const averageLoadTime = this.getAverageLoadTime();
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests 
      : 1;

    return {
      // Basic metrics
      ...this.metrics,
      
      // Calculated metrics
      cacheHitRate,
      averageLoadTime,
      successRate,
      totalCacheRequests,
      
      // Performance indicators
      performanceIndicators: {
        cacheHitRateHealthy: cacheHitRate >= this.thresholds.cacheHitRateTarget,
        loadTimeHealthy: averageLoadTime <= this.thresholds.slowLoadWarning,
        withinRegressionThreshold: this.baselineMetrics 
          ? (averageLoadTime - this.baselineMetrics.averageLoadTime) / this.baselineMetrics.averageLoadTime <= this.thresholds.maxAllowableIncrease
          : true,
      },
      
      // Recent performance trends
      recentTrends: this.getRecentTrends(),
      
      // Baseline comparison
      baselineComparison: this.baselineMetrics ? {
        loadTimeChange: averageLoadTime - this.baselineMetrics.averageLoadTime,
        loadTimeChangePercent: ((averageLoadTime - this.baselineMetrics.averageLoadTime) / this.baselineMetrics.averageLoadTime) * 100,
        cacheHitRateChange: cacheHitRate - this.baselineMetrics.cacheHitRate,
      } : null,
    };
  }

  /**
   * Get recent performance trends
   * @returns {Object} Recent performance trend data
   */
  getRecentTrends() {
    if (this.performanceHistory.length < 10) {
      return { insufficient_data: true };
    }

    const recent = this.performanceHistory.slice(-10);
    const older = this.performanceHistory.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.loadTime, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, item) => sum + item.loadTime, 0) / older.length 
      : recentAvg;

    return {
      recentAverageLoadTime: recentAvg,
      trend: recentAvg > olderAvg ? 'slower' : recentAvg < olderAvg ? 'faster' : 'stable',
      changePercent: olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0,
    };
  }

  /**
   * Get performance summary for logging
   * @returns {Object} Summary suitable for logging
   */
  getPerformanceSummary() {
    const stats = this.getStats();
    
    return {
      totalRequests: stats.totalRequests,
      averageLoadTime: `${stats.averageLoadTime.toFixed(2)}ms`,
      cacheHitRate: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
      successRate: `${(stats.successRate * 100).toFixed(1)}%`,
      bundleSize: `${(stats.bundleSize / 1024).toFixed(2)}KB`,
      criticalPathDelay: `${stats.criticalPathDelay.toFixed(2)}ms`,
      performanceHealth: {
        cacheEfficient: stats.performanceIndicators.cacheHitRateHealthy,
        loadTimesHealthy: stats.performanceIndicators.loadTimeHealthy,
        noRegression: stats.performanceIndicators.withinRegressionThreshold,
      },
    };
  }

  /**
   * Log performance summary to console
   */
  logPerformanceSummary() {
    if (!this.isEnabled) return;

    const summary = this.getPerformanceSummary();
    logger.perf('CSS Performance Summary', summary);
  }

  /**
   * Reset all metrics (useful for testing or new measurement periods)
   */
  reset() {
    this.metrics = {
      loadTimes: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      bundleSize: 0,
      criticalPathDelay: 0,
      totalRequests: 0,
      failedRequests: 0,
    };
    
    this.loadingOperations.clear();
    this.performanceHistory = [];
    this.performanceMonitor.clear();
    
    logger.debug('CSS Performance Monitor metrics reset');
  }

  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.performanceMonitor.setEnabled(enabled);
    logger.debug(`CSS Performance Monitor ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update performance thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.debug('CSS Performance Monitor thresholds updated', this.thresholds);
  }

  /**
   * Export metrics for external analysis
   * @returns {Object} Exportable metrics data
   */
  exportMetrics() {
    return {
      metrics: { ...this.metrics },
      performanceHistory: [...this.performanceHistory],
      thresholds: { ...this.thresholds },
      baselineMetrics: this.baselineMetrics ? { ...this.baselineMetrics } : null,
      timestamp: Date.now(),
    };
  }

  /**
   * Import metrics from external source
   * @param {Object} importedData - Previously exported metrics data
   */
  importMetrics(importedData) {
    if (importedData.metrics) {
      this.metrics = { ...importedData.metrics };
    }
    if (importedData.performanceHistory) {
      this.performanceHistory = [...importedData.performanceHistory];
    }
    if (importedData.baselineMetrics) {
      this.baselineMetrics = { ...importedData.baselineMetrics };
    }
    
    logger.debug('CSS Performance Monitor metrics imported', {
      timestamp: importedData.timestamp,
      metricsCount: this.performanceHistory.length,
    });
  }
}

// Create singleton instance for global use
export const cssPerformanceMonitor = new CSSPerformanceMonitor();

// Make available globally for debugging in development
if (typeof window !== 'undefined' && (typeof process === 'undefined' || process.env?.NODE_ENV === 'development')) {
  window.cssPerformanceMonitor = cssPerformanceMonitor;
}

export default cssPerformanceMonitor;