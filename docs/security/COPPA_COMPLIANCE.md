# COPPA Compliance Implementation

## Overview

This document outlines the COPPA (Children's Online Privacy Protection Act) compliance implementation for the Learnimals educational platform. The implementation ensures that educational data collection from children under 13 follows strict privacy safeguards.

## Key Components

### 1. PrivacyManager (`src/utils/privacyManager.js`)

The central privacy management system that handles:

- **Age-based consent checking**: Automatically determines if parental consent is required based on the target age range
- **Parental consent workflow**: Modal-based consent process with detailed information about data collection
- **Data retention policies**: Configurable retention periods (`session_only`, `30_days`, `90_days`, `school_year`)
- **Data sanitization**: Removes personal information when consent is not granted
- **Automatic data deletion**: Scheduled deletion based on retention policies

### 2. Educational Metadata Schema (`src/config/educationalMetadataSchema.js`)

Defines required privacy-related metadata for educational games:

```javascript
{
  ageRange: "6-8",           // COPPA-relevant for determining consent requirements
  dataCollection: {
    collectsPersonalInfo: false,
    dataTypes: ["progress", "scores"],
    purpose: "educational_assessment",
    retention: "session_only"
  }
}
```

### 3. Educational Template Integration (`src/templates/educational.js`)

Privacy-aware educational template that:

- Checks consent before initializing data collection
- Sanitizes data before saving
- Respects privacy settings for data export
- Applies retention policies on cleanup

## Privacy Workflow

### For Children Under 13

1. **Age Detection**: System checks the `ageRange` metadata to determine if the game targets children under 13
2. **Consent Request**: If targeting under-13 users, a parental consent modal is displayed
3. **Consent Modal Content**:
   - Game name and purpose
   - Types of data collected
   - Data retention policy
   - Contact information for privacy questions
   - Clear "Allow" and "Do Not Allow" options
4. **Data Handling**: Based on consent:
   - **Consent Granted**: Full data collection with applied retention policies
   - **Consent Denied**: Limited data collection (scores, completion status only)

### For Users 13 and Over

1. **Simplified Check**: Basic permission check without parental consent requirement
2. **Standard Data Collection**: Normal educational data collection applies
3. **Retention Policies**: Still subject to data retention policies

## Data Retention Policies

### Available Policies

- **`session_only`**: Data deleted when browser session ends
- **`30_days`**: Data deleted after 30 days
- **`90_days`**: Data deleted after 90 days
- **`school_year`**: Data deleted after one year

### Implementation

```javascript
// Data is automatically scheduled for deletion
privacyManager.applyDataRetentionPolicy(gameMetadata);

// Cleanup happens on page load
privacyManager.checkAndDeleteExpiredData();
```

## Data Sanitization

When consent is not granted or for enhanced privacy:

```javascript
const sanitizedData = privacyManager.sanitizeData(sessionData, gameMetadata);
```

**Allowed Data Types** (without consent):

- Basic scores
- Completion status
- Time spent (general)
- Number of attempts

**Removed Data Types**:

- Personal identifiers
- Detailed learning analytics
- Behavioral patterns
- Performance trends

## Parental Rights

Parents have the right to:

1. **Review**: Access their child's collected data
2. **Revoke**: Withdraw consent at any time
3. **Delete**: Request immediate deletion of data
4. **Contact**: Reach privacy team at <privacy@learnimals.com>

## Technical Implementation Details

### Consent Storage

```javascript
// Consent is stored with detailed metadata
{
  "progress_scores_educational": {
    "granted": true,
    "timestamp": 1642780800000,
    "gameId": "math-adventure",
    "dataTypes": ["progress", "scores"],
    "purpose": "educational_assessment",
    "retention": "30_days"
  }
}
```

### Integration Example

```javascript
import { privacyManager } from '../utils/privacyManager.js';

// In educational template
async checkPrivacyConsent() {
  const requiresConsent = privacyManager.requiresParentalConsent(this.gameConfig.ageRange);

  if (requiresConsent) {
    this.privacyConsent = await privacyManager.requestParentalConsent(this.gameConfig);
    this.dataCollectionPermitted = this.privacyConsent;
  }

  if (this.dataCollectionPermitted) {
    privacyManager.applyDataRetentionPolicy(this.gameConfig);
  }
}
```

## Compliance Checklist

- ✅ Age-based consent determination
- ✅ Parental consent modal with required information
- ✅ Data collection limitation without consent
- ✅ Configurable data retention policies
- ✅ Automatic data deletion
- ✅ Data sanitization for privacy protection
- ✅ Consent revocation mechanism
- ✅ Privacy policy integration
- ✅ Contact information for privacy inquiries

## Privacy Policy Integration

The system includes a built-in privacy policy accessible via:

```javascript
const policyHTML = privacyManager.getPrivacyPolicy();
```

This policy covers:

- Information collection practices
- Data usage purposes
- Retention policies
- Parental rights
- Contact information

## Best Practices

1. **Default to No Collection**: When in doubt, don't collect data
2. **Minimal Data**: Collect only what's necessary for educational purposes
3. **Clear Communication**: Explain data practices in simple terms
4. **Regular Cleanup**: Automated deletion prevents data accumulation
5. **Audit Trail**: Log consent decisions and data handling actions

## Monitoring and Maintenance

- Regular review of consent records
- Monitoring of data retention policy effectiveness
- Updates to privacy notices as needed
- Testing of consent workflows
- Performance monitoring of privacy checks

This implementation ensures Learnimals meets COPPA requirements while maintaining educational effectiveness.
