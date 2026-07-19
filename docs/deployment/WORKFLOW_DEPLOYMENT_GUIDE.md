# GitHub Actions Workflow Deployment Guide

This guide provides step-by-step procedures to complete the GitHub Actions workflow implementation for the Learnimals project.

## Overview

The following workflows have been implemented and are ready for deployment:

- ✅ CI Pipeline (`ci.yml`)
- ✅ Lighthouse CI (`lighthouse.yml`)
- ✅ Security Scanning (`security.yml`)
- ✅ Accessibility Testing (`accessibility.yml`)
- ✅ Configuration files and documentation

## Required Next Steps

### Step 1: Push Workflows to GitHub Repository

#### Procedure

1. **Commit all workflow files**:

   ```bash
   git add .github/workflows/
   git add lighthouserc.json lighthouse-budget.json .zap/ .nvmrc
   git add docs/WORKFLOW_DEPLOYMENT_GUIDE.md

   git commit -m "feat: implement comprehensive GitHub Actions workflows

   - Add CI pipeline with lint, test, build, and validation
   - Add Lighthouse CI for performance monitoring
   - Add security scanning with npm audit, CodeQL, and OWASP ZAP
   - Add accessibility testing with axe-core and Pa11y
   - Add configuration files and documentation

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

2. **Push to remote repository**:

   ```bash
   git push origin main
   ```

3. **Verify workflows are detected**:
   - Navigate to your GitHub repository
   - Go to the "Actions" tab
   - Confirm all 4 workflows appear in the workflow list

#### Expected Outcome

- Workflows will trigger automatically on the next push/PR
- GitHub Actions dashboard will show workflow runs
- Initial runs may fail due to missing secrets (expected)

---

### Step 2: Configure Repository Secrets

#### Required Secrets

##### 2.1 Codecov Token (Optional but Recommended)

**Purpose**: Upload test coverage reports to Codecov

**Procedure**:

1. **Sign up for Codecov** (if not already done):
   - Visit [codecov.io](https://codecov.io)
   - Sign in with your GitHub account
   - Add your repository

2. **Get Codecov token**:
   - Go to your repository on Codecov
   - Navigate to Settings → General
   - Copy the "Repository Upload Token"

3. **Add to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: [Your Codecov token]
   - Click "Add secret"

##### 2.2 Lighthouse CI GitHub App Token (Optional)

**Purpose**: Enhanced Lighthouse CI integration with PR comments

**Procedure**:

1. **Install Lighthouse CI GitHub App**:
   - Visit [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
   - Click "Install" and select your repository
   - Follow the installation prompts

2. **Get the token**:
   - The app will provide a token during installation
   - Or visit the app settings to generate a new token

3. **Add to GitHub Secrets**:
   - Name: `LHCI_GITHUB_APP_TOKEN`
   - Value: [Your Lighthouse CI token]

#### Verification

```bash
# Check if secrets are configured (from repository settings)
# You should see the secrets listed (values hidden)
```

---

### Step 3: Set Up Branch Protection Rules

#### Purpose

Enforce workflow checks before merging to main branch

#### Detailed Procedure

##### 3.1 Access Branch Protection Settings

1. Navigate to your GitHub repository
2. Go to Settings → Branches
3. Click "Add rule" next to "Branch protection rules"
4. Enter `main` as the branch name pattern

##### 3.2 Configure Protection Rules

**Required Status Checks**:

```
☑️ Require status checks to pass before merging
☑️ Require branches to be up to date before merging

Select the following status checks:
☑️ lint
☑️ test (ubuntu-latest, 18)
☑️ test (ubuntu-latest, 20)
☑️ build
☑️ validate-html
☑️ security-scan
☑️ dependency-scan
☑️ axe-core-testing
☑️ pa11y-testing
```

**Pull Request Reviews**:

```
☑️ Require a pull request before merging
☑️ Require approvals: 1
☑️ Dismiss stale PR approvals when new commits are pushed
☑️ Require review from code owners (if CODEOWNERS file exists)
```

**Additional Restrictions**:

```
☑️ Restrict pushes that create files that exceed 100 MB
☑️ Do not allow bypassing the above settings
☑️ Allow force pushes: ❌ (unchecked)
☑️ Allow deletions: ❌ (unchecked)
```

##### 3.3 Advanced Configuration (Optional)

Create a `.github/CODEOWNERS` file for automatic reviewer assignment:

```
# Global code owners
* @your-username

# Workflow-specific owners
.github/workflows/ @your-username @devops-team
docs/ @your-username @documentation-team
src/components/ @your-username @frontend-team
```

#### Verification

- Try creating a test PR
- Verify that status checks are required
- Confirm merge is blocked until checks pass

---

### Step 4: Test and Validate Workflows

#### 4.1 Initial Workflow Testing

**Test CI Pipeline**:

1. **Create a test branch**:

   ```bash
   git checkout -b test/workflow-validation
   ```

2. **Make a small change**:

   ```bash
   echo "/* Test comment */" >> src/styles/base/global.css
   git add . && git commit -m "test: validate CI workflow"
   git push origin test/workflow-validation
   ```

3. **Create Pull Request**:
   - Go to GitHub and create a PR from the test branch
   - Observe workflow execution in the "Checks" tab
   - Verify all jobs complete successfully

**Expected Results**:

- ✅ Lint job passes
- ✅ Test jobs pass (Node 18 & 20)
- ✅ Build job passes
- ✅ HTML validation passes
- ✅ PWA audit runs
- ✅ Security scan completes

#### 4.2 Performance Testing Validation

**Test Lighthouse CI**:

1. **Check Lighthouse results**:
   - In the PR checks, find "Lighthouse CI"
   - Review performance scores
   - Check for any budget violations

2. **Expected Lighthouse Scores**:

   ```
   Performance: ≥80%
   Accessibility: ≥90%
   Best Practices: ≥90%
   SEO: ≥90%
   PWA: ≥80%
   ```

3. **Review artifacts**:
   - Download Lighthouse reports from Actions artifacts
   - Review detailed performance metrics

#### 4.3 Security Testing Validation

**Test Security Workflows**:

1. **Review security scan results**:
   - Check npm audit results
   - Review CodeQL analysis
   - Examine OWASP ZAP scan results

2. **Expected Security Results**:

   ```
   Critical vulnerabilities: 0
   High vulnerabilities: <4
   OWASP ZAP: No critical findings
   Content security: Pass
   Child safety compliance: Pass
   ```

#### 4.4 Accessibility Testing Validation

**Test Accessibility Workflows**:

1. **Review accessibility results**:
   - Check axe-core test results
   - Review Pa11y findings
   - Examine keyboard navigation tests
   - Verify color contrast results

2. **Expected Accessibility Results**:

   ```
   Axe-core violations: 0 critical, <5 serious
   Pa11y errors: 0
   Keyboard navigation: Pass
   Color contrast: All ratios ≥4.5:1 (normal) or ≥3:1 (large)
   ```

#### 4.5 Comprehensive Testing Checklist

**Pre-merge Validation**:

- [ ] All required status checks pass
- [ ] Performance budgets are met
- [ ] No critical security vulnerabilities
- [ ] No critical accessibility violations
- [ ] Test coverage maintained or improved
- [ ] Build artifacts generated successfully

**Post-merge Validation**:

- [ ] Scheduled workflows run correctly
- [ ] Artifacts are preserved appropriately
- [ ] Notification systems work (if configured)
- [ ] Performance trends are tracked

---

### Step 5: Monitor and Maintain Workflows

#### 5.1 Regular Monitoring Tasks

**Weekly Tasks**:

- Review scheduled workflow results
- Check for new security vulnerabilities
- Monitor performance trend data
- Review accessibility compliance

**Monthly Tasks**:

- Update workflow dependencies
- Review and adjust performance budgets
- Analyze workflow execution times
- Update security scanning rules

#### 5.2 Workflow Maintenance

**Dependency Updates**:

```bash
# Update GitHub Actions
# Edit workflow files and update action versions:
# actions/checkout@v4 → actions/checkout@v5 (when available)
# actions/setup-node@v4 → actions/setup-node@v5 (when available)
```

**Performance Budget Adjustments**:

```json
// lighthouse-budget.json
// Adjust budgets based on application growth:
{
  "path": "/*",
  "timings": [
    {
      "metric": "first-contentful-paint",
      "budget": 2000 // Adjust as needed
    }
  ]
}
```

**Security Rule Updates**:

```
# .zap/rules.tsv
# Add new security rules as needed
# Remove false positive rules
```

#### 5.3 Troubleshooting Common Issues

**Workflow Failures**:

1. **Check workflow logs**:
   - Go to Actions tab → Failed workflow → Job details
   - Review error messages and stack traces

2. **Common fixes**:

   ```bash
   # Update Node.js version
   echo "20" > .nvmrc

   # Fix dependency issues
   npm audit fix

   # Update outdated packages
   npm update
   ```

**Performance Issues**:

1. **Lighthouse fails**:
   - Check server startup delays
   - Verify URL accessibility
   - Review performance budget thresholds

2. **Slow workflows**:
   - Optimize npm caching
   - Reduce test scope for faster feedback
   - Parallelize independent jobs

**Security Scan Issues**:

1. **False positives**:
   - Update `.zap/rules.tsv` to exclude
   - Add comments explaining exclusions

2. **Dependency vulnerabilities**:
   - Run `npm audit fix`
   - Update vulnerable packages
   - Consider alternative packages

---

## Implementation Timeline

### Phase 1: Immediate (Day 1)

1. ✅ Push workflows to repository
2. ✅ Configure basic secrets (Codecov)
3. ✅ Set up branch protection rules
4. ✅ Run initial workflow tests

### Phase 2: Optimization (Week 1)

1. Fine-tune performance budgets
2. Adjust accessibility thresholds
3. Configure additional secrets
4. Set up monitoring dashboards

### Phase 3: Enhancement (Week 2-4)

1. Add custom notification systems
2. Implement advanced reporting
3. Create workflow metrics dashboard
4. Document team procedures

## Success Criteria

### Technical Metrics

- [ ] All workflows run successfully
- [ ] Code coverage ≥80%
- [ ] Performance scores meet targets
- [ ] Zero critical security vulnerabilities
- [ ] WCAG 2.1 Level AA compliance

### Process Metrics

- [ ] PR merge time <24 hours
- [ ] Workflow execution time <15 minutes
- [ ] False positive rate <5%
- [ ] Developer satisfaction with CI/CD

## Support and Resources

### Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [OWASP ZAP Documentation](https://owasp.org/www-project-zap/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

### Troubleshooting

- Check workflow logs in GitHub Actions
- Review artifact downloads for detailed reports
- Consult individual tool documentation
- Create GitHub issues for persistent problems

### Team Training

- Conduct workflow overview session
- Create quick reference guides
- Establish escalation procedures
- Document team-specific configurations

---

_This deployment guide ensures a smooth transition to automated quality assurance for the Learnimals project. Follow each step carefully to maintain the highest standards of code quality, security, and accessibility._
