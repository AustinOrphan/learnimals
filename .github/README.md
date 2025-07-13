# GitHub Actions Workflows

This directory contains automated workflows for the Learnimals project. These workflows ensure code quality, security, performance, and accessibility standards are maintained.

## Available Workflows

### 1. CI Pipeline (`ci.yml`)
**Trigger**: Push to main, Pull requests to main
**Purpose**: Core continuous integration checks

**Jobs**:
- **Lint**: ESLint code quality checks
- **Test**: Unit tests across Node.js versions 18 & 20
- **Build**: Project build verification
- **HTML Validation**: HTML markup validation
- **PWA Audit**: Progressive Web App compliance
- **Security Scan**: Basic npm audit and dependency scanning

**Artifacts**:
- Build files (retained 30 days)
- Test coverage reports (uploaded to Codecov)
- Lighthouse audit results

### 2. Lighthouse CI (`lighthouse.yml`)
**Trigger**: Push to main, Pull requests to main, Weekly schedule
**Purpose**: Performance monitoring and Core Web Vitals tracking

**Jobs**:
- **Lighthouse**: Desktop performance testing
- **Performance Regression**: Compare PR performance vs main
- **Mobile Performance**: Mobile-specific performance tests
- **Web Vitals**: Core Web Vitals measurement

**Performance Targets**:
- Performance: 80%
- Accessibility: 90%
- Best Practices: 90%
- SEO: 90%
- PWA: 80%

**Key Metrics**:
- First Contentful Paint: <2s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Total Blocking Time: <300ms
- Speed Index: <3s

### 3. Security Scanning (`security.yml`)
**Trigger**: Push to main, Pull requests to main, Weekly schedule
**Purpose**: Comprehensive security analysis

**Jobs**:
- **Dependency Scan**: npm audit for vulnerabilities
- **CodeQL Analysis**: GitHub's semantic code analysis
- **OWASP ZAP Scan**: Dynamic application security testing
- **Content Security Scan**: Static analysis for security issues
- **Child Safety Scan**: COPPA compliance checks
- **Security Headers**: HTTP security headers validation

**Security Standards**:
- Zero critical vulnerabilities
- <4 high vulnerabilities
- OWASP Top 10 compliance
- COPPA compliance for children's education
- Proper security headers implementation

### 4. Accessibility Testing (`accessibility.yml`)
**Trigger**: Push to main, Pull requests to main, Weekly schedule
**Purpose**: WCAG 2.1 Level AA compliance verification

**Jobs**:
- **Axe Core Testing**: Automated accessibility testing
- **Pa11y Testing**: Command-line accessibility testing
- **Keyboard Navigation**: Keyboard accessibility verification
- **Color Contrast**: Color contrast ratio testing

**Accessibility Standards**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios: 4.5:1 (normal), 3:1 (large text)
- Focus indicators for all interactive elements

## Configuration Files

### `lighthouserc.json`
Lighthouse CI configuration defining:
- Test URLs
- Performance budgets
- Assertion thresholds
- Upload targets

### `lighthouse-budget.json`
Performance budget definitions:
- Timing budgets (FCP, LCP, SI, TBT, CLS)
- Resource size budgets (JS, CSS, images, fonts)

### `.zap/rules.tsv`
OWASP ZAP scanning rules configuration:
- Security vulnerability detection rules
- Warning levels and thresholds
- Scan scope definitions

### `.nvmrc`
Node.js version specification for consistent environments

## Workflow Status Requirements

### Required Checks (Block PR merges)
- ✅ Lint checks pass
- ✅ Unit tests pass
- ✅ Build succeeds
- ✅ No critical security vulnerabilities
- ✅ No critical accessibility violations

### Advisory Checks (Warn but don't block)
- ⚠️ Performance regression
- ⚠️ High security vulnerabilities (if <4)
- ⚠️ Accessibility warnings (if <10)
- ⚠️ PWA audit issues

## Setting Up Workflows

### Required Secrets
Add these secrets to your GitHub repository:

1. **CODECOV_TOKEN**: For test coverage reporting
2. **LHCI_GITHUB_APP_TOKEN**: For Lighthouse CI GitHub integration

### Optional Secrets
1. **SLACK_WEBHOOK**: For workflow notifications
2. **GITHUB_TOKEN**: Automatically provided by GitHub

### Branch Protection Rules
Recommended branch protection settings for `main`:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "ci/lint",
      "ci/test", 
      "ci/build",
      "security/dependency-scan",
      "accessibility/axe-core-testing"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null
}
```

## Local Development

### Running Tests Locally
```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests
npm test

# Run lighthouse locally
npx lighthouse http://localhost:3000 --view
```

### Pre-commit Hooks
Consider setting up pre-commit hooks to run checks locally:

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## Troubleshooting

### Common Issues

**1. Workflow fails with "Module not found"**
- Ensure all dependencies are listed in `package.json`
- Check that `npm ci` is used instead of `npm install`

**2. Lighthouse tests timeout**
- Increase timeout in workflow
- Check server startup delays
- Verify localhost URLs are accessible

**3. Accessibility tests fail**
- Review axe-core violations
- Check color contrast ratios
- Verify keyboard navigation

**4. Security scans report false positives**
- Update `.zap/rules.tsv` to exclude false positives
- Review and update npm dependencies
- Add security exceptions if needed

### Performance Tips

1. **Caching**: Workflows use npm cache for faster builds
2. **Parallel Jobs**: Independent jobs run in parallel
3. **Conditional Steps**: Steps skip when not needed
4. **Artifacts**: Important results are preserved

## Monitoring and Alerts

### Workflow Monitoring
- GitHub Actions dashboard shows workflow status
- Failed workflows trigger email notifications
- Artifacts are retained for debugging

### Performance Monitoring
- Lighthouse CI tracks performance over time
- Performance budgets prevent regressions
- Core Web Vitals are measured continuously

### Security Monitoring
- Weekly security scans catch new vulnerabilities
- CodeQL analysis identifies potential issues
- Dependency scanning catches known vulnerabilities

## Contributing

When adding new workflows:

1. Follow existing naming conventions
2. Add appropriate documentation
3. Include failure handling
4. Test thoroughly before merging
5. Update this README

## Support

For workflow issues:
1. Check workflow logs in GitHub Actions
2. Review artifact outputs
3. Consult the troubleshooting section
4. Create an issue with workflow details

---

*These workflows are designed to maintain the highest standards of quality, security, and accessibility for the Learnimals educational platform.*