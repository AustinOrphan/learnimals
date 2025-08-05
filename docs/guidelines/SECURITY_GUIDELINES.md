# Security Best Practices and Guidelines

## Overview

This document outlines security best practices for the Learnimals educational platform. Given our audience includes children, security and privacy are paramount concerns that influence all development decisions.

---

## Core Security Principles

### 1. Privacy by Design
- Collect minimal data necessary for functionality
- Store data locally when possible
- Encrypt sensitive data at rest and in transit
- Provide clear data retention and deletion policies

### 2. Defense in Depth
- Multiple layers of security controls
- Assume any single control might fail
- Regular security audits and updates
- Incident response planning

### 3. Least Privilege
- Components get minimal necessary permissions
- Users have role-based access controls
- API endpoints restricted by authentication
- File system access strictly controlled

---

## Client-Side Security

### Input Validation and Sanitization

#### Never Trust User Input
```javascript
// BAD - Direct innerHTML usage
element.innerHTML = userInput;

// GOOD - Text content or sanitized HTML
element.textContent = userInput;
// OR
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### Validation Patterns
```javascript
// Input Validation Helper
class InputValidator {
  static email(input) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(input);
  }

  static username(input) {
    // Alphanumeric, 3-20 chars
    const pattern = /^[a-zA-Z0-9]{3,20}$/;
    return pattern.test(input);
  }

  static sanitizeText(input) {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML
      .trim()
      .substring(0, 1000); // Limit length
  }
}
```

### Content Security Policy (CSP)

#### Implementation
```html
<!-- Meta tag for development -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-RANDOM_NONCE';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' https://api.learnimals.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

#### Nonce Generation
```javascript
// Generate nonce for inline scripts
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array));
}

// Apply nonce to script
const nonce = generateNonce();
script.setAttribute('nonce', nonce);
```

### Secure Storage

#### Local Storage Guidelines
```javascript
// NEVER store sensitive data in localStorage
// BAD
localStorage.setItem('password', userPassword);
localStorage.setItem('apiKey', secretKey);

// GOOD - Only non-sensitive data
localStorage.setItem('theme', 'dark');
localStorage.setItem('language', 'en');
```

#### IndexedDB Encryption
```javascript
// Encrypt sensitive data before storage
class SecureStorage {
  async encrypt(data) {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  async decrypt(encryptedData) {
    const key = await this.getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.data)
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}
```

### XSS Prevention

#### Template Literals Safety
```javascript
// DANGEROUS - XSS vulnerable
const html = `<div>${userInput}</div>`;

// SAFE - Use textContent
const div = document.createElement('div');
div.textContent = userInput;

// SAFE - Sanitize if HTML needed
const sanitized = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
});
```

#### Event Handler Safety
```javascript
// BAD - Inline event handlers
element.innerHTML = `<button onclick="${userCode}">Click</button>`;

// GOOD - addEventListener
const button = document.createElement('button');
button.textContent = 'Click';
button.addEventListener('click', handleClick);
```

---

## Authentication & Authorization

### User Authentication

#### Secure Password Handling
```javascript
// NEVER store passwords client-side
// NEVER log passwords
// NEVER send passwords in URLs

// Password strength requirements
class PasswordValidator {
  static validate(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    return {
      valid: password.length >= minLength && 
             hasUpperCase && 
             hasLowerCase && 
             hasNumbers && 
             hasSpecialChar,
      errors: {
        length: password.length < minLength,
        uppercase: !hasUpperCase,
        lowercase: !hasLowerCase,
        numbers: !hasNumbers,
        special: !hasSpecialChar
      }
    };
  }
}
```

### Session Management

#### Secure Session Handling
```javascript
class SessionManager {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.warningTime = 5 * 60 * 1000; // 5 minute warning
  }

  startSession(token) {
    // Store session token securely
    sessionStorage.setItem('sessionToken', token);
    this.resetTimeout();
  }

  resetTimeout() {
    clearTimeout(this.timeoutId);
    clearTimeout(this.warningId);
    
    this.warningId = setTimeout(() => {
      this.showTimeoutWarning();
    }, this.sessionTimeout - this.warningTime);
    
    this.timeoutId = setTimeout(() => {
      this.endSession();
    }, this.sessionTimeout);
  }

  endSession() {
    sessionStorage.removeItem('sessionToken');
    window.location.href = '/login';
  }
}
```

### Role-Based Access Control

```javascript
class RBAC {
  constructor() {
    this.roles = {
      student: ['view', 'play', 'submit'],
      parent: ['view', 'play', 'submit', 'viewReports'],
      teacher: ['view', 'play', 'submit', 'viewReports', 'manage']
    };
  }

  can(userRole, action) {
    return this.roles[userRole]?.includes(action) || false;
  }

  requirePermission(action) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = function(...args) {
        if (!this.rbac.can(this.currentUser.role, action)) {
          throw new Error('Insufficient permissions');
        }
        return originalMethod.apply(this, args);
      };
    };
  }
}
```

---

## API Security

### Request Security

#### CSRF Protection
```javascript
class CSRFProtection {
  static getToken() {
    return sessionStorage.getItem('csrfToken');
  }

  static async fetchWithCSRF(url, options = {}) {
    const token = this.getToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': token
      },
      credentials: 'same-origin'
    });
  }
}
```

#### API Rate Limiting
```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(endpoint) {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests
    const validRequests = requests.filter(
      time => now - time < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    return true;
  }
}
```

### Data Transmission

#### Encryption in Transit
```javascript
// Always use HTTPS
if (location.protocol !== 'https:' && !location.hostname.includes('localhost')) {
  location.protocol = 'https:';
}

// Verify SSL certificates in production
class SecureAPI {
  static async request(endpoint, options) {
    // Only allow HTTPS endpoints
    if (!endpoint.startsWith('https://')) {
      throw new Error('Only HTTPS endpoints allowed');
    }
    
    return fetch(endpoint, {
      ...options,
      mode: 'cors',
      credentials: 'include',
      headers: {
        ...options.headers,
        'Strict-Transport-Security': 'max-age=31536000'
      }
    });
  }
}
```

---

## Child Safety & Privacy

### COPPA Compliance

#### Age Verification
```javascript
class AgeVerification {
  static isUnder13(birthDate) {
    const age = this.calculateAge(birthDate);
    return age < 13;
  }

  static requiresParentalConsent(birthDate) {
    return this.isUnder13(birthDate);
  }

  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}
```

#### Data Collection Restrictions
```javascript
class ChildDataPolicy {
  static canCollectData(dataType, userAge, hasConsent) {
    const restrictedData = [
      'location',
      'photo',
      'video',
      'audio',
      'contact_info',
      'social_media'
    ];
    
    if (userAge < 13) {
      if (restrictedData.includes(dataType)) {
        return hasConsent;
      }
    }
    
    return true;
  }

  static anonymizeChildData(data) {
    // Remove or hash identifying information
    const anonymized = { ...data };
    delete anonymized.email;
    delete anonymized.fullName;
    delete anonymized.address;
    
    if (anonymized.username) {
      anonymized.username = this.hashUsername(anonymized.username);
    }
    
    return anonymized;
  }
}
```

### Content Filtering

```javascript
class ContentFilter {
  constructor() {
    this.bannedWords = new Set([
      // Load from secure configuration
    ]);
  }

  filterUserContent(text) {
    let filtered = text;
    
    // Remove URLs
    filtered = filtered.replace(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
      '[link removed]'
    );
    
    // Remove email addresses
    filtered = filtered.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[email removed]'
    );
    
    // Remove phone numbers
    filtered = filtered.replace(
      /(\+?1?\d{9,15})/g,
      '[phone removed]'
    );
    
    // Check banned words
    this.bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    return filtered;
  }
}
```

---

## Error Handling & Logging

### Secure Error Messages

```javascript
class SecureErrorHandler {
  static handle(error, context) {
    // Log detailed error internally
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Return generic message to user
    return this.getUserMessage(error);
  }

  static getUserMessage(error) {
    // Never expose sensitive information
    const errorMap = {
      'NetworkError': 'Connection error. Please try again.',
      'ValidationError': 'Please check your input.',
      'AuthenticationError': 'Please log in again.',
      'AuthorizationError': 'You don\'t have permission for this action.'
    };
    
    return errorMap[error.name] || 'Something went wrong. Please try again.';
  }
}
```

### Security Logging

```javascript
class SecurityLogger {
  static log(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: this.sanitizeDetails(details),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to secure logging endpoint
    this.sendLog(logEntry);
  }

  static sanitizeDetails(details) {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    return sanitized;
  }

  static logSecurityEvent(eventType, metadata) {
    const securityEvents = [
      'login_attempt',
      'login_success',
      'login_failure',
      'permission_denied',
      'suspicious_activity',
      'data_access'
    ];
    
    if (securityEvents.includes(eventType)) {
      this.log(eventType, metadata);
    }
  }
}
```

---

## Development Security Practices

### Dependency Management

```javascript
// package.json security scripts
{
  "scripts": {
    "security:audit": "npm audit",
    "security:fix": "npm audit fix",
    "security:check": "npm audit --production",
    "security:update": "npm update && npm audit fix"
  }
}
```

### Environment Variables

```javascript
// NEVER commit sensitive data
// .env.example (commit this)
API_URL=https://api.example.com
PUBLIC_KEY=your_public_key_here

// .env (never commit - add to .gitignore)
API_URL=https://api.learnimals.com
API_KEY=actual_secret_key_here
```

### Code Review Checklist

```markdown
## Security Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] All user input is validated and sanitized
- [ ] No use of innerHTML with user data
- [ ] CSP headers are properly configured
- [ ] HTTPS is enforced
- [ ] Authentication checks are in place
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] No console.log of sensitive data
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention measures in place
- [ ] CSRF tokens implemented
- [ ] Rate limiting configured
- [ ] Child privacy requirements met
```

---

## Incident Response

### Security Incident Plan

1. **Detection**
   - Monitor security logs
   - Set up alerts for suspicious activity
   - Regular security audits

2. **Response**
   - Isolate affected systems
   - Assess scope of breach
   - Preserve evidence

3. **Recovery**
   - Patch vulnerabilities
   - Reset affected credentials
   - Restore from clean backups

4. **Communication**
   - Notify affected users
   - Report to authorities if required
   - Document lessons learned

### Contact Information

```javascript
const SECURITY_CONTACTS = {
  internal: 'security@learnimals.com',
  emergency: 'emergency@learnimals.com',
  ciso: 'ciso@learnimals.com'
};
```

---

## Regular Security Tasks

### Daily
- Monitor security logs
- Check for failed login attempts
- Review error logs

### Weekly
- Run dependency audits
- Review user permissions
- Check for security updates

### Monthly
- Security training review
- Penetration testing
- Update security documentation

### Quarterly
- Full security audit
- Review and update policies
- Incident response drill

---

## Tools and Resources

### Recommended Security Tools
- **OWASP ZAP**: Web application security testing
- **ESLint Security Plugin**: Static code analysis
- **npm audit**: Dependency vulnerability scanning
- **Lighthouse**: Performance and security audit
- **CSP Evaluator**: Content Security Policy testing

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [COPPA Guidelines](https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions)
- [Web.dev Security](https://web.dev/secure/)

---

*This security guide is a living document and should be updated regularly as new threats emerge and best practices evolve.*