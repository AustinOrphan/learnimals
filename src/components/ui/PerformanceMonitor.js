/**
 * PerformanceMonitor - Real-time performance monitoring component
 * 
 * Features:
 * - FPS monitoring with frame time tracking
 * - Memory usage monitoring (if available)
 * - Render time measurement
 * - Performance score calculation
 * - Visual performance indicators
 * - Configurable thresholds and alerts
 * 
 * Part of Phase C: Character Demo & Showcase (Issue #253)
 */

import BaseComponent from '../BaseComponent.js';

export default class PerformanceMonitor extends BaseComponent {
  constructor(options = {}) {
    super({
      tagName: 'div',
      className: 'performance-monitor',
      attributes: {
        'role': 'status',
        'aria-label': 'Performance Monitor',
        'data-component': 'performance-monitor'
      },
      ...options
    });

    // Configuration
    this.updateInterval = options.updateInterval || 1000; // Update every second
    this.maxSamples = options.maxSamples || 60; // Keep 60 samples (1 minute at 1s intervals)
    this.fpsTarget = options.fpsTarget || 60;
    this.renderTimeTarget = options.renderTimeTarget || 16; // 16ms = 60fps
    this.memoryThreshold = options.memoryThreshold || 100; // MB
    this.showVisualIndicators = options.showVisualIndicators !== false;
    
    // Performance data
    this.metrics = {
      fps: [],
      frameTime: [],
      renderTime: [],
      memoryUsage: [],
      timestamps: []
    };
    
    // Real-time data
    this.currentMetrics = {
      fps: 0,
      avgFrameTime: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      performanceScore: 100
    };
    
    // Monitoring state
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.fpsCounter = null;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    // Thresholds for performance scoring
    this.thresholds = {
      excellent: { fps: 58, renderTime: 16, memory: 50 },
      good: { fps: 45, renderTime: 22, memory: 75 },
      fair: { fps: 30, renderTime: 33, memory: 100 },
      poor: { fps: 0, renderTime: 50, memory: 150 }
    };
    
    this.init();
  }

  /**
   * Initialize the performance monitor
   */
  init() {
    // Start FPS monitoring
    this.startFPSMonitoring();
    
    // Check for Performance Observer support
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
  }

  /**
   * Generate the monitor HTML structure
   */
  generateHTML() {
    return `
      <div class="perf-monitor-header">
        <h3 class="perf-monitor-title">Performance Monitor</h3>
        <div class="perf-monitor-controls">
          <button class="perf-toggle-btn" aria-label="Toggle monitoring">
            <span class="toggle-icon">⏸️</span>
          </button>
          <button class="perf-reset-btn" aria-label="Reset metrics">
            <span class="reset-icon">🔄</span>
          </button>
        </div>
      </div>
      
      <div class="perf-monitor-metrics">
        <div class="perf-metric-group">
          <div class="perf-metric fps-metric">
            <div class="metric-header">
              <span class="metric-label">FPS</span>
              <span class="metric-indicator fps-indicator"></span>
            </div>
            <div class="metric-value fps-value">--</div>
            <div class="metric-target">Target: ${this.fpsTarget}</div>
          </div>
          
          <div class="perf-metric render-time-metric">
            <div class="metric-header">
              <span class="metric-label">Render Time</span>
              <span class="metric-indicator render-indicator"></span>
            </div>
            <div class="metric-value render-time-value">--</div>
            <div class="metric-target">Target: &lt;${this.renderTimeTarget}ms</div>
          </div>
          
          <div class="perf-metric memory-metric">
            <div class="metric-header">
              <span class="metric-label">Memory</span>
              <span class="metric-indicator memory-indicator"></span>
            </div>
            <div class="metric-value memory-value">--</div>
            <div class="metric-target">Limit: ${this.memoryThreshold}MB</div>
          </div>
          
          <div class="perf-metric score-metric">
            <div class="metric-header">
              <span class="metric-label">Score</span>
              <span class="metric-indicator score-indicator"></span>
            </div>
            <div class="metric-value score-value">100</div>
            <div class="metric-target">A+ Performance</div>
          </div>
        </div>
        
        <div class="perf-monitor-charts">
          <div class="perf-chart fps-chart">
            <canvas class="chart-canvas" width="200" height="60"></canvas>
            <div class="chart-label">FPS History</div>
          </div>
          
          <div class="perf-chart memory-chart">
            <canvas class="chart-canvas" width="200" height="60"></canvas>
            <div class="chart-label">Memory Usage</div>
          </div>
        </div>
      </div>
      
      <div class="perf-monitor-summary">
        <div class="perf-summary-item">
          <span class="summary-label">Avg FPS:</span>
          <span class="summary-value avg-fps">--</span>
        </div>
        <div class="perf-summary-item">
          <span class="summary-label">Peak Memory:</span>
          <span class="summary-value peak-memory">--</span>
        </div>
        <div class="perf-summary-item">
          <span class="summary-label">Monitoring:</span>
          <span class="summary-value monitoring-time">00:00</span>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners after rendering
   */
  attachEventListeners() {
    super.attachEventListeners();
    
    if (!this.element) return;
    
    // Toggle monitoring
    const toggleBtn = this.element.querySelector('.perf-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleMonitoring();
      });
    }
    
    // Reset metrics
    const resetBtn = this.element.querySelector('.perf-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetMetrics();
      });
    }
    
    // Start monitoring by default
    this.startMonitoring();
  }

  /**
   * Start FPS monitoring using requestAnimationFrame
   */
  startFPSMonitoring() {
    const measureFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      
      this.frameCount++;
      
      // Update FPS every second
      if (deltaTime >= 1000) {
        this.currentMetrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.currentMetrics.avgFrameTime = deltaTime / this.frameCount;
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        this.fpsCounter = requestAnimationFrame(measureFPS);
      }
    };
    
    this.fpsCounter = requestAnimationFrame(measureFPS);
  }

  /**
   * Setup Performance Observer for detailed metrics
   */
  setupPerformanceObserver() {
    try {
      // Observe paint metrics
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringStartTime = Date.now();
    
    // Update monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.updateDisplay();
    }, this.updateInterval);
    
    // Update toggle button
    const toggleBtn = this.element.querySelector('.perf-toggle-btn');
    if (toggleBtn) {
      toggleBtn.querySelector('.toggle-icon').textContent = '⏸️';
      toggleBtn.setAttribute('aria-label', 'Pause monitoring');
    }
    
    this.emit('monitoring:started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.fpsCounter) {
      cancelAnimationFrame(this.fpsCounter);
      this.fpsCounter = null;
    }
    
    // Update toggle button
    const toggleBtn = this.element.querySelector('.perf-toggle-btn');
    if (toggleBtn) {
      toggleBtn.querySelector('.toggle-icon').textContent = '▶️';
      toggleBtn.setAttribute('aria-label', 'Resume monitoring');
    }
    
    this.emit('monitoring:stopped');
  }

  /**
   * Toggle monitoring on/off
   */
  toggleMonitoring() {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics() {
    const timestamp = Date.now();
    
    // Update memory usage if available
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      this.currentMetrics.memoryUsage = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
    }
    
    // Store metrics with timestamp
    this.addMetricSample('fps', this.currentMetrics.fps, timestamp);
    this.addMetricSample('frameTime', this.currentMetrics.avgFrameTime, timestamp);
    this.addMetricSample('renderTime', this.currentMetrics.lastRenderTime, timestamp);
    this.addMetricSample('memoryUsage', this.currentMetrics.memoryUsage, timestamp);
    
    // Calculate performance score
    this.currentMetrics.performanceScore = this.calculatePerformanceScore();
  }

  /**
   * Add a metric sample to the history
   */
  addMetricSample(metric, value, timestamp) {
    if (!this.metrics[metric]) {
      this.metrics[metric] = [];
    }
    
    this.metrics[metric].push(value);
    
    // Keep only recent samples
    if (this.metrics[metric].length > this.maxSamples) {
      this.metrics[metric].shift();
    }
    
    // Update timestamps
    this.metrics.timestamps.push(timestamp);
    if (this.metrics.timestamps.length > this.maxSamples) {
      this.metrics.timestamps.shift();
    }
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore() {
    let score = 100;
    
    // FPS score (40% weight)
    const fpsScore = this.getMetricScore('fps', this.currentMetrics.fps);
    score -= (100 - fpsScore) * 0.4;
    
    // Render time score (30% weight)
    const renderScore = this.getMetricScore('renderTime', this.currentMetrics.lastRenderTime);
    score -= (100 - renderScore) * 0.3;
    
    // Memory score (30% weight)
    const memoryScore = this.getMetricScore('memory', this.currentMetrics.memoryUsage);
    score -= (100 - memoryScore) * 0.3;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Get score for a specific metric
   */
  getMetricScore(metric, value) {
    const thresholds = this.thresholds;
    
    switch (metric) {
    case 'fps':
      if (value >= thresholds.excellent.fps) return 100;
      if (value >= thresholds.good.fps) return 80;
      if (value >= thresholds.fair.fps) return 60;
      return 40;
        
    case 'renderTime':
      if (value <= thresholds.excellent.renderTime) return 100;
      if (value <= thresholds.good.renderTime) return 80;
      if (value <= thresholds.fair.renderTime) return 60;
      return 40;
        
    case 'memory':
      if (value <= thresholds.excellent.memory) return 100;
      if (value <= thresholds.good.memory) return 80;
      if (value <= thresholds.fair.memory) return 60;
      return 40;
        
    default:
      return 100;
    }
  }

  /**
   * Update the display with current metrics
   */
  updateDisplay() {
    if (!this.element) return;
    
    // Update metric values
    this.updateElement('.fps-value', `${this.currentMetrics.fps}`);
    this.updateElement('.render-time-value', `${this.currentMetrics.lastRenderTime}ms`);
    this.updateElement('.memory-value', `${this.currentMetrics.memoryUsage}MB`);
    this.updateElement('.score-value', `${this.currentMetrics.performanceScore}`);
    
    // Update indicators
    this.updateIndicator('.fps-indicator', 'fps', this.currentMetrics.fps);
    this.updateIndicator('.render-indicator', 'renderTime', this.currentMetrics.lastRenderTime);
    this.updateIndicator('.memory-indicator', 'memory', this.currentMetrics.memoryUsage);
    this.updateIndicator('.score-indicator', 'score', this.currentMetrics.performanceScore);
    
    // Update summary
    this.updateSummary();
    
    // Update charts
    this.updateCharts();
    
    // Update monitoring time
    this.updateMonitoringTime();
  }

  /**
   * Update a single element's text content
   */
  updateElement(selector, content) {
    const element = this.element.querySelector(selector);
    if (element) {
      element.textContent = content;
    }
  }

  /**
   * Update performance indicator
   */
  updateIndicator(selector, metric, value) {
    const indicator = this.element.querySelector(selector);
    if (!indicator) return;
    
    // Remove existing classes
    indicator.classList.remove('excellent', 'good', 'fair', 'poor');
    
    // Add appropriate class based on performance
    let performance = 'poor';
    
    if (metric === 'score') {
      if (value >= 90) performance = 'excellent';
      else if (value >= 75) performance = 'good';
      else if (value >= 60) performance = 'fair';
    } else {
      const score = this.getMetricScore(metric, value);
      if (score >= 90) performance = 'excellent';
      else if (score >= 75) performance = 'good';
      else if (score >= 60) performance = 'fair';
    }
    
    indicator.classList.add(performance);
  }

  /**
   * Update summary statistics
   */
  updateSummary() {
    // Average FPS
    if (this.metrics.fps.length > 0) {
      const avgFPS = Math.round(
        this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length
      );
      this.updateElement('.avg-fps', `${avgFPS}`);
    }
    
    // Peak memory
    if (this.metrics.memoryUsage.length > 0) {
      const peakMemory = Math.max(...this.metrics.memoryUsage);
      this.updateElement('.peak-memory', `${peakMemory}MB`);
    }
  }

  /**
   * Update monitoring time
   */
  updateMonitoringTime() {
    if (!this.monitoringStartTime) return;
    
    const elapsed = Date.now() - this.monitoringStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.updateElement('.monitoring-time', timeString);
  }

  /**
   * Update performance charts
   */
  updateCharts() {
    this.updateFPSChart();
    this.updateMemoryChart();
  }

  /**
   * Update FPS chart
   */
  updateFPSChart() {
    const canvas = this.element.querySelector('.fps-chart .chart-canvas');
    if (!canvas || this.metrics.fps.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw chart
    this.drawLineChart(ctx, this.metrics.fps, width, height, {
      min: 0,
      max: this.fpsTarget + 10,
      color: '#4A90E2',
      target: this.fpsTarget
    });
  }

  /**
   * Update memory chart
   */
  updateMemoryChart() {
    const canvas = this.element.querySelector('.memory-chart .chart-canvas');
    if (!canvas || this.metrics.memoryUsage.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw chart
    const maxMemory = Math.max(...this.metrics.memoryUsage, this.memoryThreshold);
    this.drawLineChart(ctx, this.metrics.memoryUsage, width, height, {
      min: 0,
      max: maxMemory + 10,
      color: '#E91E63',
      target: this.memoryThreshold
    });
  }

  /**
   * Draw a line chart on canvas
   */
  drawLineChart(ctx, data, width, height, options) {
    if (data.length < 2) return;
    
    const { min, max, color, target } = options;
    const padding = 5;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Draw target line if specified
    if (target !== undefined) {
      const targetY = padding + chartHeight - ((target - min) / (max - min)) * chartHeight;
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(padding, targetY);
      ctx.lineTo(width - padding, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / (max - min)) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      fps: [],
      frameTime: [],
      renderTime: [],
      memoryUsage: [],
      timestamps: []
    };
    
    this.currentMetrics = {
      fps: 0,
      avgFrameTime: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      performanceScore: 100
    };
    
    this.monitoringStartTime = Date.now();
    
    this.emit('metrics:reset');
  }

  /**
   * Record a render time
   */
  recordRenderTime(renderTime) {
    this.currentMetrics.lastRenderTime = Math.round(renderTime);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return { ...this.currentMetrics };
  }

  /**
   * Get metric history
   */
  getMetricHistory(metric) {
    return [...(this.metrics[metric] || [])];
  }

  /**
   * Export metrics data
   */
  exportMetrics() {
    return {
      current: this.getCurrentMetrics(),
      history: { ...this.metrics },
      config: {
        updateInterval: this.updateInterval,
        fpsTarget: this.fpsTarget,
        renderTimeTarget: this.renderTimeTarget,
        memoryThreshold: this.memoryThreshold
      },
      session: {
        startTime: this.monitoringStartTime,
        duration: Date.now() - (this.monitoringStartTime || Date.now())
      }
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopMonitoring();
    super.destroy();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
}