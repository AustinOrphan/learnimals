# Security Policy

## Supported Versions

Currently supporting security updates for:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to: [security@learnimals.com]
3. Include detailed steps to reproduce the vulnerability
4. Allow up to 48 hours for an initial response

## Security Measures

### Application Security

#### Content Security Policy (CSP)
- Strict CSP headers configured in `docker/nginx.conf`
- No inline scripts or styles allowed
- External resources restricted to same origin

#### XSS Prevention
- All user inputs are escaped using utility functions
- Template rendering uses safe interpolation
- Modal and dynamic content creation sanitizes inputs

#### Authentication & Authorization
- Currently a static site with no authentication
- Future features will implement secure session management

### Infrastructure Security

#### Container Security
- Multi-stage Docker builds minimize attack surface
- Runs as non-root user (appuser:appgroup)
- Regular base image updates (nginx:1.25-alpine3.19)
- Security scanning with Trivy and Grype

#### Secrets Management
- No secrets stored in code
- Environment variables for sensitive configuration
- GitHub secrets for CI/CD credentials
- Regular scanning with Gitleaks and TruffleHog

#### Dependency Security
- Regular npm audit checks
- Snyk integration for vulnerability scanning
- Automated dependency updates via Dependabot
- License compliance scanning with FOSSA

### CI/CD Security

#### Workflow Permissions
- Minimal permissions principle
- Explicit permissions in workflow files:
  ```yaml
  permissions:
    contents: read
    security-events: write
    actions: read
    pull-requests: write
  ```

#### Security Scanning Pipeline
1. **SAST Analysis** - CodeQL and Semgrep
2. **Dependency Scanning** - npm audit and Snyk
3. **Container Scanning** - Trivy and Grype
4. **Secrets Detection** - Gitleaks and TruffleHog
5. **Infrastructure Scanning** - Checkov and Terrascan
6. **License Compliance** - license-checker and FOSSA

### Security Configuration Files

#### `.gitleaks.toml`
- Custom rules for project-specific patterns
- Allowlists for false positives
- Excludes test files and documentation

#### `.trivyignore`
- Container vulnerability exclusions
- Documents accepted risks

#### `.trufflehogignore`
- Path-based exclusions for secrets scanning
- Prevents scanning of test and documentation files

### Best Practices

1. **Keep Dependencies Updated**
   ```bash
   npm audit fix
   npm update
   ```

2. **Run Security Scans Locally**
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Run ESLint security rules
   npm run lint
   ```

3. **Container Security**
   ```bash
   # Scan Docker image locally
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image learnimals:latest
   ```

4. **Pre-commit Checks**
   - Use gitleaks pre-commit hook
   - Run linting before commits
   - Check for sensitive data

### Security Headers

The application implements these security headers via nginx:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self';" always;
```

### Monitoring & Incident Response

1. **Security Alerts**
   - GitHub Security Advisories
   - Dependabot alerts
   - CI/CD scan results

2. **Incident Response**
   - Immediate assessment of impact
   - Patch development and testing
   - Coordinated disclosure if needed
   - Post-incident review

### Compliance

- OWASP Top 10 considerations
- COPPA compliance for children's privacy
- Accessibility standards (WCAG 2.1 AA)

## Security Checklist for Contributors

- [ ] No hardcoded secrets or credentials
- [ ] All user inputs are properly escaped
- [ ] Dependencies are up to date
- [ ] Security scans pass in CI/CD
- [ ] Docker image uses latest secure base
- [ ] No sensitive data in logs
- [ ] Proper error handling without info leakage