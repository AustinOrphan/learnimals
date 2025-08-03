# Learnimals Technical Quick Reference

## 🚨 **CRITICAL: Infrastructure Broken - Fix First**

### Current Critical Issues
```bash
# Tests don't work
npm test  # ERROR: Cannot find module 'es-errors/syntax.js'

# Code quality broken  
npm run lint  # 200+ errors

# CI/CD failing
# GitHub Actions broken due to above issues
```

### **URGENT Fix Command Sequence**
```bash
# 1. Fix dependencies (5 minutes)
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm install --save-dev es-errors@latest

# 2. Fix most lint errors (30 seconds)
npm run lint:fix

# 3. Verify improvements
npm test    # Should run without crashing
npm run lint  # Should show <50 errors vs 200+
```

## 🏗️ **Technical Architecture**

### Current Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties
- **Testing**: Vitest + jsdom (currently broken)
- **Linting**: ESLint (currently 200+ errors)
- **Build**: No build process (static files)
- **Hosting**: GitHub Pages (currently broken deployment)

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic elements (Card, Modal)
│   ├── layout/         # Layout components (navbar)
│   └── forms/          # Form components
├── features/           # Feature-based organization
│   ├── subjects/       # Subject-specific (math, science, etc.)
│   ├── games/          # Game implementations
│   └── progress/       # Progress tracking
├── utils/              # Utility functions
├── styles/             # CSS organization
└── pages/              # Main application pages

public/                 # Static assets
tests/                  # Test files (currently broken)
docs/                   # Documentation
```

## 🔧 **Development Commands**

### **Working Commands**
```bash
# Development server
python3 -m http.server 8080
# or
make dev-server

# Subject generation
npm run generate-subjects
npm run list-templates
```

### **Broken Commands (Need Fixing)**
```bash
npm test                # ERROR: es-errors missing
npm run lint            # 200+ errors
npm run test:coverage   # Broken due to test issues
npm run test:ui         # Missing dependencies
```

### **Fix Progress Commands**
```bash
# Check dependency status
npm list es-errors      # Should show version after fix

# Check lint error count
npm run lint 2>&1 | grep "problems" | tail -1

# Test basic functionality
npm run dev             # Should start server
curl http://localhost:8080/src/pages/index.html  # Should return HTML
```

## 📦 **Dependencies Status**

### Critical Missing Dependencies
- `es-errors` - **MISSING** - Required for testing framework
- Potential other transitive dependency issues

### Package Management
```bash
# Current Node version requirement
cat .nvmrc  # Node 18

# Install dependencies (current method)
npm install  # Works but incomplete

# Recommended fix method
rm -rf node_modules package-lock.json
npm install
npm install --save-dev es-errors@latest
```

## 🧪 **Testing Framework**

### Current Status: **BROKEN**
```bash
# Error when running tests
npm test
# ERROR: Cannot find module 'es-errors/syntax.js'
```

### Test Configuration
```javascript
// vitest.config.js - Current configuration
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: '@vitest/coverage-v8'
    }
  }
};
```

### Test Structure
```
tests/
├── unit/               # Unit tests (broken)
├── integration/        # Integration tests (broken)
├── components/         # Component tests (broken)
├── navigation/         # Navigation tests (broken)
└── security/           # Security tests (broken)
```

### Fix Required
1. Install missing `es-errors` dependency
2. Update Vitest configuration
3. Create test setup files
4. Verify tests run without crashing

## 🎯 **ESLint Configuration**

### Current Status: **200+ Errors**
```bash
npm run lint
# ✖ 200 problems (199 errors, 1 warning)
```

### Error Categories
- **~150 errors**: Indentation (6 spaces vs 4 spaces)
- **~20 errors**: Quote style (double vs single quotes)
- **~15 errors**: Unused variables
- **~10 errors**: Various rule violations

### ESLint Config Location
```javascript
// eslint.config.mjs
export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    rules: {
      'indent': ['error', 2],  // 2-space indentation
      'quotes': ['error', 'single'],  // Single quotes
      'semi': ['error', 'always'],  // Semicolons required
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
    }
  }
];
```

### Auto-Fix Command
```bash
npm run lint:fix  # Fixes ~178 errors automatically
```

## 🚀 **CI/CD Pipeline**

### Current Status: **BROKEN**
- GitHub Actions workflow exists (`.github/workflows/ci.yml`)
- Fails due to test and lint issues
- Deployment to GitHub Pages not working

### CI Workflow Issues
1. `npm ci` fails due to package-lock.json sync issues
2. ESLint step fails with 200+ errors
3. Test step fails due to missing dependencies
4. Build step may be affected

### Fix Required
1. Fix dependencies to allow `npm ci` to work
2. Resolve ESLint errors
3. Fix test framework
4. Update workflow configuration if needed

## 🌐 **Deployment**

### Current Setup
- **Target**: GitHub Pages
- **Source**: Static files (no build process)
- **Status**: Broken due to CI issues

### Deployment Process
```bash
# Manual deployment (if needed)
# 1. Fix all issues first
# 2. Ensure src/pages/index.html works locally
# 3. Push to main branch
# 4. GitHub Actions should deploy automatically
```

## 🎮 **Game Architecture**

### Existing Games
```javascript
// Games that exist but may need updates
src/features/games/
├── bubble-pop/         # Math bubble popping game
├── word-scramble/      # Word unscrambling game
├── element-match/      # Science element matching
├── sentence-builder/   # Reading sentence construction
├── color-palette/      # Art color mixing
├── pizza-party/        # Math fractions game
└── number-line-jump/   # Math number line game
```

### Base Game Class
```javascript
// src/components/games/BaseGame.js - Base class for all games
class BaseGame {
  constructor(containerId, config = {}) {
    this.container = document.getElementById(containerId);
    this.config = config;
    this.state = { score: 0, level: 1 };
  }
  
  init() { /* Setup game */ }
  start() { /* Start game loop */ }
  end() { /* End game, save progress */ }
}
```

## 📊 **Progress Tracking**

### Current Implementation
```javascript
// src/features/progress/ProgressTracker.js - Currently placeholder
export default class ProgressTracker {
  constructor() {
    this.progress = {};
  }
  
  track(data) {
    // Placeholder method - needs implementation
  }
}
```

### Required Implementation
- XP and leveling system
- Achievement tracking
- Daily streak monitoring
- LocalStorage persistence
- Progress visualization

## 🎨 **Styling System**

### CSS Architecture
```
src/styles/
├── base/               # Foundation styles
│   ├── styles.css      # Main stylesheet
│   └── responsive.css  # Mobile responsive
├── components/         # Component-specific styles
│   ├── navbar.css
│   ├── components.css
│   └── feedback/       # Feedback component styles
└── themes/             # Theme-related styles (future)
```

### Theme Variables
```css
/* CSS Custom Properties for theming */
:root {
  --text-primary: #333;
  --bg-card: #fff;
  --accent-primary: #4ECDC4;
  /* More theme variables... */
}
```

## 🔍 **Debugging & Troubleshooting**

### Quick Health Check
```bash
# 1. Check Node version
node --version  # Should be 18+

# 2. Check if dependencies install
npm install  # Should complete without errors

# 3. Check if server starts
python3 -m http.server 8080  # Should start on port 8080

# 4. Check if page loads
curl -I http://localhost:8080/src/pages/index.html  # Should return 200
```

### Common Issues
```bash
# Issue: Port 8080 in use
lsof -ti:8080 | xargs kill -9

# Issue: Permission errors
sudo chown -R $(whoami) node_modules/

# Issue: Cache problems
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📈 **Performance Considerations**

### Current Performance Status
- **Load Time**: Unknown (needs baseline)
- **Bundle Size**: Minimal (no bundling)
- **Mobile Performance**: Untested
- **Offline Support**: Partial (PWA manifest exists)

### Performance TODO
1. Establish baseline measurements
2. Implement lazy loading for games
3. Optimize image assets
4. Test on low-end devices

## 🔐 **Security Considerations**

### Current Security Status
- **XSS Prevention**: Some utilities exist
- **COPPA Compliance**: Planned but not implemented
- **Data Collection**: Minimal (localStorage only)
- **Authentication**: Not implemented yet

### Security Files
```
src/utils/
├── htmlEscape.js       # XSS prevention utilities
└── logger.js           # Logging utilities

tests/security/
└── xss-prevention.test.js  # Security tests (broken)
```

## 🚀 **Getting Started (After Fixes)**

### Setup Process (Post-Stabilization)
```bash
# 1. Clone repository
git clone <repo-url>
cd learnimals

# 2. Install dependencies
npm install

# 3. Verify everything works
npm test     # Should pass
npm run lint # Should show 0 errors

# 4. Start development
npm run dev  # Start server
```

### Development Workflow (Post-Stabilization)
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes with live reload
npm run dev  # Keep running in background

# 3. Run tests and lint
npm test
npm run lint

# 4. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# 5. Create PR via GitHub interface
```

## 📞 **Emergency Contacts**

### When Things Break
1. **Technical Issues**: Contact technical lead
2. **Process Issues**: Contact project manager
3. **Urgent Bugs**: Create GitHub issue with `urgent` label

### Key Repository Links
- **Main Repo**: [GitHub Repository URL]
- **Issues**: [GitHub Issues URL]
- **Actions**: [GitHub Actions URL]
- **Pages**: [GitHub Pages URL] (currently broken)

---

**⚠️ REMEMBER**: Fix the critical infrastructure issues (dependencies, tests, linting) before attempting any feature development. The 5-day stabilization plan must be completed first.