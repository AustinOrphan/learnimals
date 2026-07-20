// Progress Reports Component
// Generates comprehensive progress reports and analytics

import BaseComponent from '../components/BaseComponent.js';
import Modal from '../components/ui/Modal.js';
import { getRepository } from '../config/storage.js';

class ProgressReports extends BaseComponent {
  constructor(options = {}) {
    super('progress-reports', {
      // Report types
      reportTypes: ['weekly', 'monthly', 'subject', 'comparison'],

      // Report configuration
      includeCharts: true,
      includeRecommendations: true,
      includeGoals: true,

      // Export options
      exportFormats: ['pdf', 'json', 'csv'],

      ...options,
    });

    this.progressData = options.progressData || {};
    this.user = options.user || {};
    this.repository = null;
    this.currentReport = null;
    this.reportData = {};
  }

  async init() {
    try {
      this.repository = await getRepository();
      await this.generateReportData();
      return this;
    } catch (error) {
      console.error('Failed to initialize progress reports:', error);
      throw error;
    }
  }

  async generateReportData() {
    this.reportData = {
      weekly: await this.generateWeeklyReport(),
      monthly: await this.generateMonthlyReport(),
      subject: await this.generateSubjectReport(),
      comparison: await this.generateComparisonReport(),
    };
  }

  async generateWeeklyReport() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Calculate weekly metrics
    const weeklyStats = {
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      },
      summary: {
        totalXP: this.calculateWeeklyXP(),
        activitiesCompleted: this.calculateWeeklyActivities(),
        timeSpent: this.calculateWeeklyTime(),
        streakDays: Math.min(this.progressData.streakDays || 0, 7),
        subjectsStudied: this.getActiveSubjectsThisWeek(),
      },
      daily: this.generateDailyBreakdown(),
      subjects: this.generateWeeklySubjectBreakdown(),
      achievements: this.getWeeklyAchievements(),
      goals: this.getWeeklyGoalProgress(),
      insights: this.generateWeeklyInsights(),
    };

    return weeklyStats;
  }

  async generateMonthlyReport() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyStats = {
      period: {
        start: monthStart.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
      summary: {
        totalXP: this.progressData.totalXP || 0,
        activitiesCompleted: this.getTotalActivities(),
        timeSpent: this.progressData.totalTimeSpent || 0,
        longestStreak: this.progressData.longestStreak || 0,
        averageDaily: this.calculateAverageDailyStats(),
      },
      weekly: this.generateWeeklyTrends(),
      subjects: this.generateMonthlySubjectAnalysis(),
      achievements: this.getMonthlyAchievements(),
      goals: this.getMonthlyGoalSummary(),
      insights: this.generateMonthlyInsights(),
    };

    return monthlyStats;
  }

  async generateSubjectReport() {
    const subjects = this.progressData.subjects || {};

    const subjectReport = Object.entries(subjects).map(([subject, data]) => ({
      name: subject,
      displayName: this.capitalizeFirst(subject),
      level: data.level || 1,
      xp: data.xp || 0,
      activitiesCompleted: data.activitiesCompleted || 0,
      timeSpent: data.timeSpent || 0,
      averageScore: data.averageScore || 0,
      lastActivity: data.lastActivity,
      progress: this.calculateSubjectProgress(data),
      strengths: this.identifySubjectStrengths(subject, data),
      recommendations: this.generateSubjectRecommendations(subject, data),
    }));

    return {
      subjects: subjectReport,
      overall: {
        favoriteSubject: this.getFavoriteSubject(subjectReport),
        mostImproved: this.getMostImprovedSubject(subjectReport),
        needsAttention: this.getSubjectsNeedingAttention(subjectReport),
      },
      insights: this.generateSubjectInsights(subjectReport),
    };
  }

  async generateComparisonReport() {
    // This would typically compare with other users or historical data
    // For now, we'll create simulated comparison data

    const userStats = {
      overallLevel: this.progressData.overallLevel || 1,
      totalXP: this.progressData.totalXP || 0,
      activitiesCompleted: this.getTotalActivities(),
      streakDays: this.progressData.streakDays || 0,
    };

    const averageStats = {
      overallLevel: 3,
      totalXP: 500,
      activitiesCompleted: 25,
      streakDays: 5,
    };

    return {
      user: userStats,
      average: averageStats,
      comparison: {
        levelRank: this.calculatePercentile(userStats.overallLevel, averageStats.overallLevel),
        xpRank: this.calculatePercentile(userStats.totalXP, averageStats.totalXP),
        activityRank: this.calculatePercentile(
          userStats.activitiesCompleted,
          averageStats.activitiesCompleted
        ),
        streakRank: this.calculatePercentile(userStats.streakDays, averageStats.streakDays),
      },
      insights: this.generateComparisonInsights(userStats, averageStats),
    };
  }

  // Report generation helpers
  calculateWeeklyXP() {
    // Simulate weekly XP calculation
    return Math.floor((this.progressData.totalXP || 0) * 0.3);
  }

  calculateWeeklyActivities() {
    // Simulate weekly activities
    return Math.floor(this.getTotalActivities() * 0.4);
  }

  calculateWeeklyTime() {
    // Simulate weekly time
    return Math.floor((this.progressData.totalTimeSpent || 0) * 0.25);
  }

  getActiveSubjectsThisWeek() {
    return Object.keys(this.progressData.subjects || {}).length;
  }

  generateDailyBreakdown() {
    const daily = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      daily.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        xp: Math.floor(Math.random() * 50) + 10,
        activities: Math.floor(Math.random() * 3) + 1,
        timeSpent: Math.floor(Math.random() * 45) + 15,
        hasActivity: Math.random() > 0.2,
      });
    }

    return daily;
  }

  generateWeeklySubjectBreakdown() {
    const subjects = this.progressData.subjects || {};

    return Object.entries(subjects).map(([subject, data]) => ({
      name: subject,
      displayName: this.capitalizeFirst(subject),
      xpEarned: Math.floor((data.xp || 0) * 0.3),
      activitiesCompleted: Math.floor((data.activitiesCompleted || 0) * 0.4),
      timeSpent: Math.floor((data.timeSpent || 0) * 0.25),
    }));
  }

  getWeeklyAchievements() {
    // Simulate weekly achievements
    return [
      {
        name: 'Consistent Learner',
        description: 'Completed activities for 5 days this week',
        icon: '🔥',
        unlockedThisWeek: true,
      },
    ];
  }

  generateWeeklyInsights() {
    const insights = [];
    const weeklyActivities = this.calculateWeeklyActivities();

    if (weeklyActivities >= 10) {
      insights.push({
        type: 'positive',
        icon: '🎉',
        title: 'Great Week!',
        message: `You completed ${weeklyActivities} activities this week. Keep up the excellent work!`,
      });
    } else if (weeklyActivities < 5) {
      insights.push({
        type: 'suggestion',
        icon: '💡',
        title: 'Room for Growth',
        message: 'Try to complete at least one activity per day to build a strong learning habit.',
      });
    }

    if (this.progressData.streakDays >= 7) {
      insights.push({
        type: 'achievement',
        icon: '🏆',
        title: 'Streak Champion!',
        message: `Amazing! You've maintained a ${this.progressData.streakDays}-day learning streak.`,
      });
    }

    return insights;
  }

  getTotalActivities() {
    return Object.values(this.progressData.subjects || {}).reduce(
      (sum, subject) => sum + (subject.activitiesCompleted || 0),
      0
    );
  }

  calculateAverageDailyStats() {
    const daysThisMonth = new Date().getDate();

    return {
      xp: Math.round((this.progressData.totalXP || 0) / daysThisMonth),
      activities: Math.round(this.getTotalActivities() / daysThisMonth),
      timeSpent: Math.round((this.progressData.totalTimeSpent || 0) / daysThisMonth),
    };
  }

  getFavoriteSubject(subjectReport) {
    return subjectReport.reduce((favorite, subject) =>
      subject.timeSpent > (favorite?.timeSpent || 0) ? subject : favorite
    );
  }

  getMostImprovedSubject(subjectReport) {
    // This would require historical data to calculate improvement
    // For now, return the subject with highest level
    return subjectReport.reduce((improved, subject) =>
      subject.level > (improved?.level || 0) ? subject : improved
    );
  }

  calculatePercentile(userValue, averageValue) {
    const ratio = userValue / averageValue;
    return Math.min(Math.round(ratio * 50 + 50), 100);
  }

  showReportsModal() {
    const modal = new Modal({
      title: 'Progress Reports',
      content: this.generateReportsModalHTML(),
      size: 'large',
      showConfirmButton: false,
      showCancelButton: false,
    });

    const modalInstance = modal.create();
    modalInstance.open();

    // Initialize modal interactions
    setTimeout(() => {
      this.initializeReportsModal(modalInstance.element);
    }, 100);
  }

  generateReportsModalHTML() {
    return `
      <div class="progress-reports-modal">
        <!-- Report Type Selector -->
        <div class="report-selector">
          <button class="report-tab active" data-report="weekly">Weekly Report</button>
          <button class="report-tab" data-report="monthly">Monthly Report</button>
          <button class="report-tab" data-report="subject">Subject Analysis</button>
          <button class="report-tab" data-report="comparison">Performance Comparison</button>
        </div>

        <!-- Report Content -->
        <div class="report-content" id="report-content">
          ${this.generateWeeklyReportHTML()}
        </div>

        <!-- Report Actions -->
        <div class="report-actions">
          <button class="btn btn--outline" id="export-report">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 12l-4-4h3V1h2v7h3l-4 4z" fill="currentColor"/>
            </svg>
            Export Report
          </button>
          <button class="btn btn--primary" id="print-report">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M2 6V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M2 10v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" stroke-width="2"/>
              <rect x="2" y="6" width="12" height="4" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            Print Report
          </button>
        </div>
      </div>
    `;
  }

  generateWeeklyReportHTML() {
    const report = this.reportData.weekly;

    return `
      <div class="weekly-report">
        <div class="report-header">
          <h3>Weekly Progress Report</h3>
          <p class="report-period">${this.formatDateRange(report.period.start, report.period.end)}</p>
        </div>

        <!-- Summary Stats -->
        <div class="report-summary">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon">⭐</div>
              <div class="summary-content">
                <span class="summary-value">${report.summary.totalXP}</span>
                <span class="summary-label">XP Earned</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">📚</div>
              <div class="summary-content">
                <span class="summary-value">${report.summary.activitiesCompleted}</span>
                <span class="summary-label">Activities</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">⏰</div>
              <div class="summary-content">
                <span class="summary-value">${report.summary.timeSpent}m</span>
                <span class="summary-label">Time Spent</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">🔥</div>
              <div class="summary-content">
                <span class="summary-value">${report.summary.streakDays}</span>
                <span class="summary-label">Streak Days</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Breakdown -->
        <div class="daily-breakdown">
          <h4>Daily Activity</h4>
          <div class="daily-chart">
            ${report.daily
              .map(
                day => `
              <div class="daily-bar" title="${day.dayName}: ${day.xp} XP, ${day.activities} activities">
                <div class="bar-fill" style="height: ${(day.xp / 50) * 100}%"></div>
                <span class="bar-label">${day.dayName}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Subject Breakdown -->
        <div class="subject-breakdown">
          <h4>Subject Progress</h4>
          <div class="subject-list">
            ${report.subjects
              .map(
                subject => `
              <div class="subject-item">
                <div class="subject-name">${subject.displayName}</div>
                <div class="subject-stats">
                  <span>${subject.xpEarned} XP</span>
                  <span>${subject.activitiesCompleted} activities</span>
                  <span>${subject.timeSpent}m</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Insights -->
        <div class="report-insights">
          <h4>This Week's Insights</h4>
          <div class="insights-list">
            ${report.insights
              .map(
                insight => `
              <div class="insight-item ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                  <h5>${insight.title}</h5>
                  <p>${insight.message}</p>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  generateSubjectReportHTML() {
    const report = this.reportData.subject;

    return `
      <div class="subject-report">
        <div class="report-header">
          <h3>Subject Analysis Report</h3>
          <p class="report-description">Detailed breakdown of your progress across all subjects</p>
        </div>

        <!-- Subject Grid -->
        <div class="subjects-analysis">
          ${report.subjects
            .map(
              subject => `
            <div class="subject-analysis-card">
              <div class="subject-header">
                <h4>${subject.displayName}</h4>
                <span class="subject-level">Level ${subject.level}</span>
              </div>
              
              <div class="subject-metrics">
                <div class="metric">
                  <span class="metric-label">XP Earned</span>
                  <span class="metric-value">${subject.xp}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Activities</span>
                  <span class="metric-value">${subject.activitiesCompleted}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Time Spent</span>
                  <span class="metric-value">${subject.timeSpent}m</span>
                </div>
              </div>

              ${
                subject.recommendations.length > 0
                  ? `
                <div class="subject-recommendations">
                  <h5>Recommendations</h5>
                  <ul>
                    ${subject.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
                </div>
              `
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Overall Analysis -->
        <div class="overall-analysis">
          <h4>Overall Analysis</h4>
          <div class="analysis-items">
            <div class="analysis-item">
              <strong>Favorite Subject:</strong> ${report.overall.favoriteSubject?.displayName || 'None yet'}
            </div>
            <div class="analysis-item">
              <strong>Most Improved:</strong> ${report.overall.mostImproved?.displayName || 'None yet'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeReportsModal(modalElement) {
    // Tab switching
    const reportTabs = modalElement.querySelectorAll('.report-tab');
    reportTabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const reportType = e.target.getAttribute('data-report');
        this.switchReport(reportType, modalElement);

        // Update active tab
        reportTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Export button
    const exportBtn = modalElement.querySelector('#export-report');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCurrentReport());
    }

    // Print button
    const printBtn = modalElement.querySelector('#print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printCurrentReport());
    }
  }

  switchReport(reportType, modalElement) {
    const contentContainer = modalElement.querySelector('#report-content');

    switch (reportType) {
      case 'weekly':
        contentContainer.innerHTML = this.generateWeeklyReportHTML();
        break;
      case 'monthly':
        contentContainer.innerHTML = this.generateMonthlyReportHTML();
        break;
      case 'subject':
        contentContainer.innerHTML = this.generateSubjectReportHTML();
        break;
      case 'comparison':
        contentContainer.innerHTML = this.generateComparisonReportHTML();
        break;
    }

    this.currentReport = reportType;
  }

  exportCurrentReport() {
    const reportData = this.reportData[this.currentReport || 'weekly'];
    const jsonData = JSON.stringify(reportData, null, 2);

    // Create download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `learnimals-${this.currentReport || 'weekly'}-report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  printCurrentReport() {
    window.print();
  }

  // Utility methods
  formatDateRange(startDate, endDate) {
    const start = new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Additional report generation methods would go here...
  generateMonthlyReportHTML() {
    return '<div class="monthly-report"><h3>Monthly Report (Coming Soon)</h3></div>';
  }

  generateComparisonReportHTML() {
    return '<div class="comparison-report"><h3>Comparison Report (Coming Soon)</h3></div>';
  }

  // Placeholder methods for missing functionality
  generateWeeklyTrends() {
    return [];
  }

  generateMonthlySubjectAnalysis() {
    return [];
  }

  getMonthlyAchievements() {
    return [];
  }

  getMonthlyGoalSummary() {
    return {};
  }

  generateMonthlyInsights() {
    return [];
  }

  calculateSubjectProgress(data) {
    return {
      currentLevel: data.level || 1,
      nextLevel: (data.level || 1) + 1,
      progressToNext: (((data.xp || 0) % 100) / 100) * 100,
    };
  }

  identifySubjectStrengths(subject, data) {
    const strengths = [];
    if ((data.averageScore || 0) > 80) {
      strengths.push('High accuracy');
    }
    if ((data.activitiesCompleted || 0) > 10) {
      strengths.push('Consistent practice');
    }
    return strengths;
  }

  generateSubjectRecommendations(subject, data) {
    const recommendations = [];
    if ((data.timeSpent || 0) < 30) {
      recommendations.push(`Spend more time practicing ${subject}`);
    }
    if ((data.activitiesCompleted || 0) < 5) {
      recommendations.push(`Complete more ${subject} activities`);
    }
    return recommendations;
  }

  getSubjectsNeedingAttention(subjectReport) {
    return subjectReport.filter(
      subject => subject.timeSpent < 30 || subject.activitiesCompleted < 5
    );
  }

  generateSubjectInsights(_subjectReport) {
    return [];
  }

  generateComparisonInsights(_userStats, _averageStats) {
    return [];
  }

  getWeeklyGoalProgress() {
    return {};
  }

  // Update data method
  async updateData(newProgressData) {
    this.progressData = newProgressData;
    await this.generateReportData();
  }

  // Static factory method
  static async create(options = {}) {
    const reports = new ProgressReports(options);
    await reports.init();
    return reports;
  }
}

export default ProgressReports;
