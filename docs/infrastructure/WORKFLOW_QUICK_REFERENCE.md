# GitHub Actions Quick Reference Guide

## 🚀 Workflow Status Dashboard

### Current Workflows
| Workflow | Trigger | Purpose | Duration |
|----------|---------|---------|----------|
| **CI Pipeline** | Push/PR | Code quality, tests, build | ~8-12 min |
| **Lighthouse CI** | Push/PR/Schedule | Performance monitoring | ~5-8 min |
| **Security Scanning** | Push/PR/Schedule | Security vulnerability detection | ~10-15 min |
| **Accessibility Testing** | Push/PR/Schedule | WCAG compliance verification | ~6-10 min |

## ✅ Workflow Success Criteria

### CI Pipeline Requirements
```
✅ ESLint: 0 errors, 0 warnings
✅ Tests: All passing, coverage ≥80%
✅ Build: Successful compilation
✅ HTML: Valid markup
✅ PWA: Score ≥80%
```

### Performance Requirements
```
✅ Performance Score: ≥80%
✅ Accessibility Score: ≥90%
✅ Best Practices: ≥90%
✅ SEO Score: ≥90%
✅ PWA Score: ≥80%

✅ Core Web Vitals:
   - FCP: <2s
   - LCP: <2.5s
   - CLS: <0.1
   - TBT: <300ms
```

### Security Requirements
```
✅ Critical Vulnerabilities: 0
✅ High Vulnerabilities: <4
✅ OWASP ZAP: No critical findings
✅ CodeQL: No security issues
✅ COPPA Compliance: Pass
```

### Accessibility Requirements
```
✅ Axe-core: 0 critical violations
✅ Pa11y: 0 errors
✅ Keyboard Navigation: Full support
✅ Color Contrast: ≥4.5:1 (normal), ≥3:1 (large)
```

## 🔧 Common Developer Actions

### Before Creating a PR
```bash
# Run local checks
npm run lint           # Check code style
npm run lint:fix       # Auto-fix style issues
npm test              # Run unit tests
npm run build         # Verify build works

# Check specific areas
npx lighthouse http://localhost:3000 --view  # Performance
axe-core http://localhost:3000              # Accessibility
```

### Fixing Common Issues

#### Lint Failures
```bash
# Auto-fix most issues
npm run lint:fix

# Manual fixes needed for:
# - Unused variables
# - Console.log statements
# - Complex functions
# - Missing JSDoc comments
```

#### Test Failures
```bash
# Run specific test
npm test -- --testNamePattern="ComponentName"

# Run with coverage
npm test -- --coverage

# Debug failing tests
npm test -- --verbose --detectOpenHandles
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for missing dependencies
npm ls --depth=0
```

#### Performance Issues
```bash
# Check bundle size
npx webpack-bundle-analyzer dist/static/js/*.js

# Optimize images
npm run optimize:images

# Check for unused CSS
npm run analyze:css
```

#### Security Issues
```bash
# Fix npm vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for specific vulnerabilities
npm audit --audit-level high
```

#### Accessibility Issues
```bash
# Run axe-core locally
npx axe-core http://localhost:3000

# Check color contrast
# Use browser dev tools or online tools

# Test keyboard navigation
# Tab through all interactive elements
```

## 🚨 Troubleshooting Workflow Failures

### CI Pipeline Failures

#### Lint Job Fails
```bash
# Check the error output
# Common issues:
- Semicolon missing
- Unused imports
- Incorrect indentation (2 spaces required)
- Console.log statements (use logger instead)

# Fix commands:
npm run lint:fix
```

#### Test Job Fails
```bash
# Check test output for:
- Syntax errors
- Missing test files
- Timeout issues
- Memory leaks

# Debug commands:
npm test -- --verbose
npm test -- --detectOpenHandles
```

#### Build Job Fails
```bash
# Check for:
- Missing dependencies
- Import/export errors
- TypeScript errors (if applicable)
- Environment variable issues

# Fix commands:
npm ci
npm run build
```

### Lighthouse CI Failures

#### Performance Score Too Low
```bash
# Check for:
- Large JavaScript bundles
- Unoptimized images
- Blocking resources
- Slow network requests

# Optimization:
- Enable code splitting
- Compress images
- Use CDN for assets
- Implement lazy loading
```

#### Accessibility Score Too Low
```bash
# Common issues:
- Missing alt text
- Poor color contrast
- Missing ARIA labels
- Keyboard navigation issues

# Use browser dev tools:
- Lighthouse audit
- Accessibility inspector
```

### Security Scan Failures

#### npm Audit Issues
```bash
# Update vulnerable packages:
npm audit fix

# For unfixable issues:
npm audit fix --force

# Check specific vulnerability:
npm audit --json | jq '.vulnerabilities'
```

#### CodeQL Issues
```bash
# Review security findings:
- SQL injection risks
- XSS vulnerabilities
- Path traversal issues
- Insecure randomness

# Check GitHub Security tab for details
```

### Accessibility Test Failures

#### Axe-core Violations
```bash
# Common violations:
- Missing alt text: Add alt="" or alt="description"
- Color contrast: Use higher contrast colors
- Missing labels: Add aria-label or associate with label
- Keyboard access: Add tabindex="0" or use semantic elements
```

#### Pa11y Errors
```bash
# Similar to axe-core but may catch different issues:
- Heading order problems
- Form validation issues
- Language declaration missing
- Landmark roles missing
```

## 📊 Monitoring and Alerts

### GitHub Actions Dashboard
- **Location**: Repository → Actions tab
- **Check**: Workflow run status and duration
- **Review**: Failed job logs and artifacts

### Performance Monitoring
- **Lighthouse CI**: Performance trends over time
- **Core Web Vitals**: Real user metrics
- **Bundle Analysis**: Code size tracking

### Security Monitoring
- **Dependabot**: Automated dependency updates
- **Security Advisories**: GitHub security alerts
- **CodeQL**: Weekly security scans

### Accessibility Monitoring
- **Axe-core Reports**: Automated accessibility testing
- **Manual Testing**: Regular keyboard and screen reader testing
- **Compliance Tracking**: WCAG 2.1 Level AA adherence

## 🔄 Workflow Schedules

### Daily (Automatic)
- CI Pipeline on every push/PR
- Performance testing on PRs
- Security scans on pushes

### Weekly (Scheduled)
- **Monday 2 AM**: Lighthouse CI full audit
- **Monday 4 AM**: Accessibility testing
- **Monday 6 AM**: Security scanning

### Monthly (Manual)
- Dependency updates
- Performance budget review
- Security rule updates
- Workflow optimization

## 💡 Best Practices

### Code Quality
```bash
# Before committing:
1. Run npm run lint:fix
2. Run npm test
3. Check git diff for unwanted changes
4. Write descriptive commit messages
```

### Performance
```bash
# Regular checks:
1. Monitor bundle size
2. Optimize images before adding
3. Use semantic HTML
4. Minimize third-party scripts
```

### Security
```bash
# Security checklist:
1. Never commit secrets
2. Use HTTPS for all external resources
3. Validate all user inputs
4. Keep dependencies updated
```

### Accessibility
```bash
# Accessibility checklist:
1. Test with keyboard only
2. Use semantic HTML elements
3. Provide alt text for images
4. Ensure proper color contrast
5. Test with screen reader
```

## 🆘 Emergency Procedures

### Critical Build Failure
1. **Immediate**: Revert problematic commit
2. **Investigate**: Check workflow logs
3. **Fix**: Address root cause
4. **Test**: Verify fix locally
5. **Deploy**: Push corrected version

### Security Vulnerability
1. **Assess**: Review vulnerability details
2. **Patch**: Apply security updates
3. **Test**: Verify functionality intact
4. **Deploy**: Push security fix immediately
5. **Document**: Update security documentation

### Performance Regression
1. **Identify**: Compare performance metrics
2. **Isolate**: Find problematic changes
3. **Optimize**: Implement performance fixes
4. **Validate**: Test performance improvements
5. **Monitor**: Track performance metrics

## 📞 Support Contacts

### Workflow Issues
- **Primary**: Create GitHub issue with workflow logs
- **Secondary**: Contact DevOps team
- **Emergency**: Disable failing workflow temporarily

### Performance Issues
- **Tools**: Lighthouse CI, WebPageTest
- **Analysis**: Bundle analyzer, Performance profiler
- **Optimization**: Code splitting, image optimization

### Security Issues
- **Immediate**: Security team notification
- **Tools**: GitHub Security Advisory, npm audit
- **Response**: Follow incident response procedure

### Accessibility Issues
- **Testing**: Manual testing with assistive technology
- **Tools**: axe-core, Pa11y, screen readers
- **Compliance**: Review WCAG 2.1 guidelines

---

*Keep this guide handy for quick reference during development. Update as workflows evolve.*