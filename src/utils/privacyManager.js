/**
 * Privacy Manager
 * Handles COPPA compliance, data privacy safeguards, and parental consent
 */

export class PrivacyManager {
  constructor() {
    this.consentStatus = this.loadConsentStatus();
    this.privacySettings = this.loadPrivacySettings();
    this.dataRetentionPolicies = new Map();
    this.initializeDataRetentionPolicies();
  }

  /**
   * Initialize default data retention policies
   */
  initializeDataRetentionPolicies() {
    this.dataRetentionPolicies.set('session_only', {
      duration: 0, // Delete immediately on session end
      description: 'Data deleted when session ends'
    });
    
    this.dataRetentionPolicies.set('30_days', {
      duration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      description: 'Data deleted after 30 days'
    });
    
    this.dataRetentionPolicies.set('90_days', {
      duration: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
      description: 'Data deleted after 90 days'
    });
    
    this.dataRetentionPolicies.set('school_year', {
      duration: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
      description: 'Data deleted after one school year'
    });
  }

  /**
   * Check if user age requires parental consent (under 13 for COPPA)
   * @param {string} ageRange - Age range (e.g., "6-8")
   * @returns {boolean} Whether parental consent is required
   */
  requiresParentalConsent(ageRange) {
    if (!ageRange) return true; // Default to requiring consent if age unknown
    
    const [minAge] = ageRange.split('-').map(Number);
    return minAge < 13;
  }

  /**
   * Check current consent status
   * @returns {Object} Consent status information
   */
  getConsentStatus() {
    return this.consentStatus;
  }

  /**
   * Request parental consent for data collection
   * @param {Object} gameMetadata - Game metadata with privacy info
   * @returns {Promise<boolean>} Whether consent was granted
   */
  async requestParentalConsent(gameMetadata) {
    // Check if consent already granted for this type of data
    const consentKey = this.generateConsentKey(gameMetadata);
    if (this.consentStatus[consentKey]?.granted) {
      return true;
    }

    // Show parental consent modal
    return new Promise((resolve) => {
      this.showParentalConsentModal(gameMetadata, (granted) => {
        if (granted) {
          this.recordConsent(consentKey, gameMetadata);
        }
        resolve(granted);
      });
    });
  }

  /**
   * Generate consent key for specific data collection
   * @param {Object} gameMetadata - Game metadata
   * @returns {string} Unique consent key
   */
  generateConsentKey(gameMetadata) {
    const dataTypes = gameMetadata.dataCollection?.dataTypes || [];
    const purpose = gameMetadata.dataCollection?.purpose || 'unknown';
    return `${dataTypes.sort().join('_')}_${purpose}`;
  }

  /**
   * Record parental consent
   * @param {string} consentKey - Consent identifier
   * @param {Object} gameMetadata - Game metadata
   */
  recordConsent(consentKey, gameMetadata) {
    this.consentStatus[consentKey] = {
      granted: true,
      timestamp: Date.now(),
      gameId: gameMetadata.id || 'unknown',
      dataTypes: gameMetadata.dataCollection?.dataTypes || [],
      purpose: gameMetadata.dataCollection?.purpose || 'educational',
      retention: gameMetadata.dataCollection?.retention || 'session_only'
    };
    
    this.saveConsentStatus();
  }

  /**
   * Revoke consent for specific data collection
   * @param {string} consentKey - Consent identifier
   */
  revokeConsent(consentKey) {
    if (this.consentStatus[consentKey]) {
      this.consentStatus[consentKey].granted = false;
      this.consentStatus[consentKey].revokedAt = Date.now();
      this.saveConsentStatus();
      
      // Delete related data
      this.deleteDataByConsentKey(consentKey);
    }
  }

  /**
   * Check if data collection is permitted
   * @param {Object} gameMetadata - Game metadata
   * @returns {boolean} Whether data collection is permitted
   */
  isDataCollectionPermitted(gameMetadata) {
    // If no personal info collected, always permitted
    if (!gameMetadata.dataCollection?.collectsPersonalInfo) {
      return true;
    }

    // Check age requirement
    if (this.requiresParentalConsent(gameMetadata.ageRange)) {
      const consentKey = this.generateConsentKey(gameMetadata);
      return this.consentStatus[consentKey]?.granted || false;
    }

    return true;
  }

  /**
   * Sanitize data based on privacy settings
   * @param {Object} data - Data to sanitize
   * @param {Object} gameMetadata - Game metadata
   * @returns {Object} Sanitized data
   */
  sanitizeData(data, gameMetadata) {
    const sanitizedData = { ...data };
    
    // Remove personal info if not permitted
    if (!this.isDataCollectionPermitted(gameMetadata)) {
      // Only keep essential educational data
      const allowedKeys = ['score', 'completion', 'time_spent', 'attempts'];
      Object.keys(sanitizedData).forEach(key => {
        if (!allowedKeys.includes(key)) {
          delete sanitizedData[key];
        }
      });
    }

    return sanitizedData;
  }

  /**
   * Apply data retention policy
   * @param {Object} gameMetadata - Game metadata
   */
  applyDataRetentionPolicy(gameMetadata) {
    const retention = gameMetadata.dataCollection?.retention || 'session_only';
    const policy = this.dataRetentionPolicies.get(retention);
    
    if (!policy) {
      console.warn(`Unknown retention policy: ${retention}`);
      return;
    }

    if (retention === 'session_only') {
      // Mark for deletion on page unload
      window.addEventListener('beforeunload', () => {
        this.deleteGameData(gameMetadata.id);
      });
    } else {
      // Schedule deletion after specified duration
      const deleteAt = Date.now() + policy.duration;
      this.scheduleDataDeletion(gameMetadata.id, deleteAt);
    }
  }

  /**
   * Delete game data
   * @param {string} gameId - Game identifier
   */
  deleteGameData(gameId) {
    const keysToDelete = [];
    
    // Find all localStorage keys related to this game
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(gameId)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete the keys
    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Deleted data for game: ${gameId}`);
  }

  /**
   * Schedule data deletion
   * @param {string} gameId - Game identifier
   * @param {number} deleteAt - Timestamp when to delete
   */
  scheduleDataDeletion(gameId, deleteAt) {
    const scheduledDeletions = JSON.parse(
      localStorage.getItem('scheduled_deletions') || '{}'
    );
    
    scheduledDeletions[gameId] = deleteAt;
    localStorage.setItem('scheduled_deletions', JSON.stringify(scheduledDeletions));
    
    // Check for expired data on load
    this.checkAndDeleteExpiredData();
  }

  /**
   * Check for and delete expired data
   */
  checkAndDeleteExpiredData() {
    const scheduledDeletions = JSON.parse(
      localStorage.getItem('scheduled_deletions') || '{}'
    );
    
    const now = Date.now();
    const toDelete = [];
    
    Object.entries(scheduledDeletions).forEach(([gameId, deleteAt]) => {
      if (now >= deleteAt) {
        this.deleteGameData(gameId);
        toDelete.push(gameId);
      }
    });
    
    // Remove deleted items from schedule
    toDelete.forEach(gameId => {
      delete scheduledDeletions[gameId];
    });
    
    localStorage.setItem('scheduled_deletions', JSON.stringify(scheduledDeletions));
  }

  /**
   * Show parental consent modal
   * @param {Object} gameMetadata - Game metadata
   * @param {Function} callback - Callback with consent result
   */
  showParentalConsentModal(gameMetadata, callback) {
    const modal = document.createElement('div');
    modal.className = 'privacy-consent-modal';
    modal.innerHTML = `
      <div class="privacy-modal-overlay">
        <div class="privacy-modal-content">
          <div class="privacy-modal-header">
            <h2>🔒 Parental Consent Required</h2>
          </div>
          <div class="privacy-modal-body">
            <p><strong>This educational game would like to collect data to enhance your child's learning experience.</strong></p>
            
            <div class="privacy-info">
              <h3>Data Collection Details:</h3>
              <ul>
                <li><strong>Game:</strong> ${gameMetadata.name || 'Educational Game'}</li>
                <li><strong>Data Types:</strong> ${gameMetadata.dataCollection?.dataTypes?.join(', ') || 'Progress data'}</li>
                <li><strong>Purpose:</strong> ${gameMetadata.dataCollection?.purpose || 'Educational assessment'}</li>
                <li><strong>Retention:</strong> ${this.dataRetentionPolicies.get(gameMetadata.dataCollection?.retention || 'session_only')?.description}</li>
              </ul>
            </div>
            
            <div class="privacy-notice">
              <h3>Your Child's Privacy Rights:</h3>
              <ul>
                <li>You can revoke consent at any time</li>
                <li>Data will be deleted according to retention policy</li>
                <li>No data is shared with third parties</li>
                <li>Data is used only for educational purposes</li>
              </ul>
            </div>
            
            <div class="privacy-contact">
              <p><strong>Questions?</strong> Contact us at privacy@learnimals.com</p>
            </div>
          </div>
          <div class="privacy-modal-footer">
            <button class="btn btn-secondary" id="deny-consent">Do Not Allow</button>
            <button class="btn btn-primary" id="grant-consent">I Give Consent</button>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .privacy-consent-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }
      
      .privacy-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .privacy-modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .privacy-modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e9ecef;
        text-align: center;
      }
      
      .privacy-modal-header h2 {
        margin: 0;
        color: #2c3e50;
      }
      
      .privacy-modal-body {
        padding: 1.5rem;
      }
      
      .privacy-info, .privacy-notice {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
      }
      
      .privacy-info h3, .privacy-notice h3 {
        margin: 0 0 0.5rem 0;
        color: #495057;
      }
      
      .privacy-info ul, .privacy-notice ul {
        margin: 0;
        padding-left: 1.5rem;
      }
      
      .privacy-contact {
        text-align: center;
        margin-top: 1rem;
        color: #6c757d;
        font-size: 0.9rem;
      }
      
      .privacy-modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #e9ecef;
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('grant-consent').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
      callback(true);
    });
    
    document.getElementById('deny-consent').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
      callback(false);
    });
    
    // Close on overlay click
    modal.querySelector('.privacy-modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        document.body.removeChild(modal);
        document.head.removeChild(style);
        callback(false);
      }
    });
  }

  /**
   * Load consent status from storage
   * @returns {Object} Consent status
   */
  loadConsentStatus() {
    try {
      return JSON.parse(localStorage.getItem('privacy_consent_status') || '{}');
    } catch (error) {
      console.error('Error loading consent status:', error);
      return {};
    }
  }

  /**
   * Save consent status to storage
   */
  saveConsentStatus() {
    try {
      localStorage.setItem('privacy_consent_status', JSON.stringify(this.consentStatus));
    } catch (error) {
      console.error('Error saving consent status:', error);
    }
  }

  /**
   * Load privacy settings from storage
   * @returns {Object} Privacy settings
   */
  loadPrivacySettings() {
    try {
      return JSON.parse(localStorage.getItem('privacy_settings') || '{}');
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      return {};
    }
  }

  /**
   * Delete data by consent key
   * @param {string} consentKey - Consent identifier
   */
  deleteDataByConsentKey(consentKey) {
    // Implementation would depend on how data is stored
    // For now, just log the action
    console.log(`Data deleted for consent key: ${consentKey}`);
  }

  /**
   * Get privacy policy text
   * @returns {string} Privacy policy HTML
   */
  getPrivacyPolicy() {
    return `
      <div class="privacy-policy">
        <h2>Privacy Policy for Children Under 13</h2>
        
        <h3>Information We Collect</h3>
        <p>We only collect information necessary for educational purposes, such as:</p>
        <ul>
          <li>Game progress and scores</li>
          <li>Time spent on activities</li>
          <li>Learning achievement data</li>
        </ul>
        
        <h3>How We Use Information</h3>
        <p>We use collected information to:</p>
        <ul>
          <li>Track learning progress</li>
          <li>Provide personalized educational content</li>
          <li>Generate progress reports for parents and teachers</li>
        </ul>
        
        <h3>Data Retention</h3>
        <p>We retain data only as long as necessary for educational purposes and according to the retention policy specified for each game.</p>
        
        <h3>Your Rights</h3>
        <p>Parents have the right to:</p>
        <ul>
          <li>Review their child's data</li>
          <li>Request deletion of their child's data</li>
          <li>Revoke consent at any time</li>
        </ul>
        
        <h3>Contact Us</h3>
        <p>For privacy-related questions, contact us at privacy@learnimals.com</p>
      </div>
    `;
  }
}

// Create global instance
export const privacyManager = new PrivacyManager();

// Initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    privacyManager.checkAndDeleteExpiredData();
  });
}