// Progress Charts Component
// Visual charts for progress tracking using Chart.js

/* global Chart */

import BaseComponent from '../../components/BaseComponent.js';

class ProgressCharts extends BaseComponent {
  constructor(options = {}) {
    super('progress-charts', {
      // Chart configuration
      chartTypes: ['overview', 'subjects', 'weekly', 'comparison'],
      colors: {
        primary: '#3498db',
        secondary: '#e74c3c',
        success: '#27ae60',
        warning: '#f39c12',
        info: '#9b59b6'
      },
      animations: true,
      responsive: true,
      ...options
    });

    this.progressData = options.progressData || {};
    this.user = options.user || {};
    this.charts = new Map();
    this.chartInstances = new Map();
    this.isChartJSLoaded = false;
  }

  async init() {
    try {
      // Load Chart.js if not already loaded
      await this.loadChartJS();
      return this;
    } catch (error) {
      console.error('Failed to initialize progress charts:', error);
      throw error;
    }
  }

  async loadChartJS() {
    if (window.Chart) {
      this.isChartJSLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = () => {
        this.isChartJSLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Chart.js'));
      };
      document.head.appendChild(script);
    });
  }

  generateHTML() {
    if (!this.isChartJSLoaded) {
      return `
        <div class="progress-charts loading">
          <div class="loading-message">Loading charts...</div>
        </div>
      `;
    }

    return `
      <div class="progress-charts">
        <!-- Chart Navigation -->
        <div class="chart-navigation">
          <button class="chart-tab active" data-chart="overview">Overview</button>
          <button class="chart-tab" data-chart="subjects">Subjects</button>
          <button class="chart-tab" data-chart="weekly">Weekly</button>
          <button class="chart-tab" data-chart="comparison">Comparison</button>
        </div>

        <!-- Chart Container -->
        <div class="chart-container">
          <div class="chart-panel active" id="overview-chart">
            <canvas id="overview-canvas"></canvas>
          </div>
          <div class="chart-panel" id="subjects-chart">
            <canvas id="subjects-canvas"></canvas>
          </div>
          <div class="chart-panel" id="weekly-chart">
            <canvas id="weekly-canvas"></canvas>
          </div>
          <div class="chart-panel" id="comparison-chart">
            <canvas id="comparison-canvas"></canvas>
          </div>
        </div>

        <!-- Chart Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${this.options.colors.primary};"></span>
            <span>Progress</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${this.options.colors.success};"></span>
            <span>Completed</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${this.options.colors.warning};"></span>
            <span>In Progress</span>
          </div>
        </div>
      </div>
    `;
  }

  async attachEventListeners() {
    // Chart tab navigation
    const chartTabs = this.element.querySelectorAll('.chart-tab');
    chartTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const chartType = e.target.getAttribute('data-chart');
        this.switchChart(chartType);
      });
    });

    // Initialize all charts
    await this.initializeCharts();
  }

  async initializeCharts() {
    if (!this.isChartJSLoaded) {
      console.warn('Chart.js not loaded, skipping chart initialization');
      return;
    }

    try {
      // Initialize overview chart
      await this.createOverviewChart();
      
      // Initialize subjects chart
      await this.createSubjectsChart();
      
      // Initialize weekly chart
      await this.createWeeklyChart();
      
      // Initialize comparison chart
      await this.createComparisonChart();

    } catch (error) {
      console.error('Failed to initialize charts:', error);
    }
  }

  async createOverviewChart() {
    const canvas = this.element.querySelector('#overview-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const data = this.prepareOverviewData();
    
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            this.options.colors.primary,
            this.options.colors.success,
            this.options.colors.warning,
            this.options.colors.info,
            this.options.colors.secondary
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Overall Progress Distribution'
          },
          legend: {
            position: 'bottom'
          }
        },
        animation: {
          animateRotate: this.options.animations
        }
      }
    });

    this.chartInstances.set('overview', chart);
  }

  async createSubjectsChart() {
    const canvas = this.element.querySelector('#subjects-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const data = this.prepareSubjectsData();
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Current Level',
            data: data.levels,
            backgroundColor: this.options.colors.primary,
            borderColor: this.options.colors.primary,
            borderWidth: 1
          },
          {
            label: 'XP Earned',
            data: data.xp,
            backgroundColor: this.options.colors.success,
            borderColor: this.options.colors.success,
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Subject Progress Comparison'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Level'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'XP'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        animation: {
          duration: this.options.animations ? 1000 : 0
        }
      }
    });

    this.chartInstances.set('subjects', chart);
  }

  async createWeeklyChart() {
    const canvas = this.element.querySelector('#weekly-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const data = this.prepareWeeklyData();
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Daily XP',
            data: data.xp,
            borderColor: this.options.colors.primary,
            backgroundColor: this.options.colors.primary + '20',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Activities Completed',
            data: data.activities,
            borderColor: this.options.colors.success,
            backgroundColor: this.options.colors.success + '20',
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Weekly Progress Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count'
            }
          }
        },
        animation: {
          duration: this.options.animations ? 1500 : 0
        }
      }
    });

    this.chartInstances.set('weekly', chart);
  }

  async createComparisonChart() {
    const canvas = this.element.querySelector('#comparison-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Prepare data
    const data = this.prepareComparisonData();
    
    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Current User',
            data: data.userScores,
            borderColor: this.options.colors.primary,
            backgroundColor: this.options.colors.primary + '30',
            pointBackgroundColor: this.options.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Average User',
            data: data.averageScores,
            borderColor: this.options.colors.warning,
            backgroundColor: this.options.colors.warning + '20',
            pointBackgroundColor: this.options.colors.warning,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Performance Comparison'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        },
        animation: {
          duration: this.options.animations ? 2000 : 0
        }
      }
    });

    this.chartInstances.set('comparison', chart);
  }

  // Data preparation methods
  prepareOverviewData() {
    const subjects = this.progressData.subjects || {};
    const labels = [];
    const values = [];

    Object.entries(subjects).forEach(([subject, data]) => {
      labels.push(this.capitalizeFirst(subject));
      values.push(data.xp || 0);
    });

    return { labels, values };
  }

  prepareSubjectsData() {
    const subjects = this.progressData.subjects || {};
    const labels = [];
    const levels = [];
    const xp = [];

    Object.entries(subjects).forEach(([subject, data]) => {
      labels.push(this.capitalizeFirst(subject));
      levels.push(data.level || 1);
      xp.push(data.xp || 0);
    });

    return { labels, levels, xp };
  }

  prepareWeeklyData() {
    // Generate sample weekly data (in a real app, this would come from stored activity data)
    const labels = [];
    const xp = [];
    const activities = [];
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      
      // Simulate data (replace with real data)
      xp.push(Math.floor(Math.random() * 50) + 10);
      activities.push(Math.floor(Math.random() * 5) + 1);
    }

    return { labels, xp, activities };
  }

  prepareComparisonData() {
    const subjects = this.progressData.subjects || {};
    const labels = [];
    const userScores = [];
    const averageScores = [];

    Object.entries(subjects).forEach(([subject, data]) => {
      labels.push(this.capitalizeFirst(subject));
      
      // Convert level to percentage score
      const userScore = Math.min((data.level || 1) * 20, 100);
      userScores.push(userScore);
      
      // Simulate average scores (replace with real analytics data)
      averageScores.push(Math.floor(Math.random() * 40) + 40);
    });

    return { labels, userScores, averageScores };
  }

  // Navigation and interaction methods
  switchChart(chartType) {
    // Update active tab
    const tabs = this.element.querySelectorAll('.chart-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-chart') === chartType);
    });

    // Update active panel
    const panels = this.element.querySelectorAll('.chart-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `${chartType}-chart`);
    });

    // Trigger chart animation if animations are enabled
    const chart = this.chartInstances.get(chartType);
    if (chart && this.options.animations) {
      chart.update('active');
    }
  }

  // Update chart data
  async updateData(newProgressData) {
    this.progressData = newProgressData;
    
    // Update all charts with new data
    for (const [chartType, chart] of this.chartInstances) {
      try {
        let newData;
        
        switch (chartType) {
        case 'overview':
          newData = this.prepareOverviewData();
          chart.data.labels = newData.labels;
          chart.data.datasets[0].data = newData.values;
          break;
            
        case 'subjects':
          newData = this.prepareSubjectsData();
          chart.data.labels = newData.labels;
          chart.data.datasets[0].data = newData.levels;
          chart.data.datasets[1].data = newData.xp;
          break;
            
        case 'weekly':
          newData = this.prepareWeeklyData();
          chart.data.labels = newData.labels;
          chart.data.datasets[0].data = newData.xp;
          chart.data.datasets[1].data = newData.activities;
          break;
            
        case 'comparison':
          newData = this.prepareComparisonData();
          chart.data.labels = newData.labels;
          chart.data.datasets[0].data = newData.userScores;
          chart.data.datasets[1].data = newData.averageScores;
          break;
        }
        
        chart.update();
      } catch (error) {
        console.error(`Failed to update ${chartType} chart:`, error);
      }
    }
  }

  // Utility methods
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Export chart as image
  exportChart(chartType, format = 'png') {
    const chart = this.chartInstances.get(chartType);
    if (!chart) return null;

    const url = chart.toBase64Image('image/' + format, 1.0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${chartType}-chart.${format}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return url;
  }

  // Cleanup
  destroy() {
    // Destroy all chart instances
    for (const chart of this.chartInstances.values()) {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    }
    this.chartInstances.clear();

    // Call parent destroy
    super.destroy();
  }

  // Static factory method
  static async create(options = {}) {
    const charts = new ProgressCharts(options);
    await charts.init();
    return charts;
  }
}

export default ProgressCharts;