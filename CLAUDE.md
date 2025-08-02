# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learnimals is a static educational web application featuring interactive games and activities for children. Each subject area (Math, Science, Reading, Art, Coding) is represented by an animal character and follows a consistent template-based architecture.

## Development Commands

This is a static HTML/CSS/JavaScript website that requires no build process. To develop:

1. **Start local development server**: Use any local web server (Python's `python -m http.server`, Node's `npx serve`, VS Code Live Server, etc.)
2. **Open browser**: Navigate to `/src/pages/index.html`
3. **No build/compilation required**: Files can be edited directly and refreshed in browser

### Available npm Scripts

- `npm run lint` - Run ESLint on the src/ directory
- `npm run lint:fix` - Run ESLint with auto-fix enabled
- `npm run generate-subjects` - Generate new subject pages programmatically
- `npm run list-templates` - List all available subject templates
- `npm test` - Run all tests with Vitest
- `npm run test:unit` - Run unit tests
- `npm run test:components` - Run component tests
- `npm run test:integration` - Run integration tests

### Subject Generation System

The project includes a powerful subject generation system:

```bash
# Generate specific subjects
npm run generate-subjects -- --subjects=music,geography

# List all available templates
npm run list-templates

# Generate from batch file
node scripts/generateSubjects.js --batch-file=subjects.json
```

Available subject templates: music, geography, history, language, physics, cooking, environment

## Architecture

### Modern Component-Based System

- **Reusable Components**: Located in `src/components/` organized by type (ui/, layout/, forms/)
- **Feature-Based Organization**: Subject-specific code grouped in `src/features/subjects/`
- **Template System**: Subject pages use a shared template (`src/templates/subject.html`) with dynamic content loading
- **Theme Management**: Centralized theming system with light/dark mode support and multiple color themes

### File Structure

```
├── src/                     # All source code
│   ├── components/          # Reusable UI components by type
│   │   ├── ui/              # Basic elements (Card, Modal, etc.)
│   │   ├── layout/          # Layout components (navbar, navigation)
│   │   └── forms/           # Form components
│   ├── features/            # Feature-based organization
│   │   ├── subjects/        # Subject-specific functionality
│   │   │   ├── math/        # Math-specific files
│   │   │   ├── science/     # Science-specific files
│   │   │   └── shared/      # Shared subject pages/examples
│   │   ├── games/           # Game features
│   │   │   ├── bubble-pop/  # Bubble Pop game
│   │   │   └── word-scramble/ # Word Scramble game
│   │   └── user/            # User-related functionality
│   ├── styles/              # Modern CSS organization
│   │   ├── base/            # Foundation styles
│   │   ├── components/      # Component-specific styles
│   │   └── themes/          # Theme-related styles
│   ├── utils/               # Utility functions
│   ├── templates/           # HTML templates
│   └── pages/               # Main application pages
├── public/                  # Static assets served directly
│   ├── images/              # Images and icons
│   ├── manifest.json        # PWA manifest
│   └── serviceWorker.js     # Service worker
└── docs/                    # Documentation
```

### Key Systems

#### Subject Template System

- Uses `SubjectTemplateLoader` to maintain consistency across subject pages
- Template placeholders: `{{subjectName}}`, `{{characterName}}`, `{{heroSubtitle}}`, etc.
- Supports both static HTML fallback and dynamic Card.js component rendering

#### Theme System

- **themeRegistry.js**: Central theme definitions and color sets
- **themeManager.js**: Core theme switching logic
- **themeSwitcher.js**: UI component for theme selection
- **Semantic CSS variables**: Use `--text-primary`, `--bg-card`, `--accent-primary` instead of direct colors

#### Component Library

- **Card Component**: Creates consistent card layouts with support for linked and static cards
- **Modal Component**: Standardized dialog boxes with customizable content
- **Form Component**: Validated forms with local storage integration
- **UI Utilities**: Common patterns like toast notifications and tab interfaces

## Development Guidelines

### Adding New Subject Pages

1. Use the template system via `SubjectTemplateLoader.renderTemplate()`
2. Define subject-specific options (character, colors, features)
3. Provide both `featureCards` (HTML fallback) and `featureCardsData` (Card.js array)
4. Create corresponding CSS file in `src/features/subjects/[subject]/[subject].css`
5. Place subject JavaScript in `src/features/subjects/[subject]/[subject].js`

### Working with Components

- Import components from appropriate `src/components/` subdirectories
- Use semantic CSS variables for theming
- Follow the component documentation in `docs/components.md`
- Test components in both light and dark modes

### Styling Guidelines

- Use semantic CSS variables: `--text-primary`, `--bg-card`, `--accent-primary`, etc.
- Subject-specific styles go in `src/features/subjects/[subject]/[subject].css`
- Component styles go in `src/styles/components/`
- Follow BEM naming convention for CSS classes

### Configuration

- Global app settings in `src/config.js`
- Game configurations (speed, dimensions, timeouts) centralized in config
- Theme settings and API endpoint definitions included

## PWA Features

- Service worker enabled for offline functionality (`serviceWorker.js`)
- Manifest file for app-like behavior (`manifest.json`)
- Caching strategy for static assets

## Games Architecture

- Self-contained game modules in `src/features/games/`
- Canvas-based rendering for performance (Bubble Pop game)
- Touch and mouse input support
- Score tracking and progress saving

## Code Standards

### ESLint Configuration

- **Indentation**: 2 spaces (enforced)
- **Quotes**: Single quotes (enforced)
- **Semicolons**: Required (enforced)
- **Variables**: Prefer const for non-reassigned variables
- **Unused variables**: Allowed if prefixed with underscore
- **Console**: console.log allowed for development/debugging

### JavaScript Guidelines

- Use ES6+ features (modules, arrow functions, async/await)
- Follow semantic CSS variable naming: `--text-primary`, `--bg-card`, `--accent-primary`
- Component imports should use relative paths from `src/components/`
- All components should extend or integrate with the theme system
- Use the Modal component for user interactions rather than native alerts

### File Organization

- Subject-specific files: `src/features/subjects/[subject]/[subject].js|css|html`
- Reusable components: `src/components/[type]/ComponentName.js`
- Utilities: `src/utils/utilityName.js`
- Templates: `src/templates/templateName.html`

## Testing

The project uses Vitest for automated testing with the following configuration:

- Test environment: jsdom (for DOM manipulation)
- Test files: Located in `tests/` directory
- Coverage provider: @vitest/coverage-v8

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/logger.test.js

# Run with coverage
npm test -- --coverage
```

### Test Structure

- `tests/unit/` - Unit tests for individual modules
- `tests/integration/` - Integration tests for system components
- `tests/navigation/` - Navigation system tests
- `tests/security/` - Security and XSS prevention tests
- `tests/utils/` - Utility module tests

### Manual Testing

Additionally, perform manual testing by:

1. Loading pages in different browsers
2. Testing responsive design on mobile devices
3. Verifying theme switching functionality
4. Testing offline capabilities (PWA features)
5. Running `npm run lint` to check code quality

## CI/CD & Security

### GitHub Actions Workflows

The project includes comprehensive CI/CD pipelines:

- **`.github/workflows/ci.yml`** - Main CI pipeline with security scans, quality gates, and tests
- **`.github/workflows/security.yml`** - Dedicated security scanning workflow
- **`.github/workflows/deploy-rolling.yml`** - Rolling deployment workflow for multiple environments
- **`.github/workflows/monitoring.yml`** - Production monitoring and alerts

### Security Scanning Configuration

#### Secrets Detection

- **`.gitleaks.toml`** - Gitleaks configuration with rules and allowlists
- **`.gitleaksignore`** - Legacy ignore file for backward compatibility
- **`.trufflehogignore`** - TruffleHog exclusion patterns

These files prevent false positives in:

- Test files with mock credentials
- Documentation with example API keys
- Base64 encoded images
- Localhost URLs and example domains

#### Container Security

- **`.trivyignore`** - Trivy container vulnerability scanner exclusions
- **`Dockerfile`** - Multi-stage build with security hardening
  - Uses specific Alpine versions for reproducibility
  - Runs as non-root user (appuser:appgroup)
  - Includes health checks

### Docker Configuration

- **`docker/nginx.conf`** - Main nginx configuration with security headers
- **`docker/default.conf`** - Site-specific nginx configuration
- **`docker/healthcheck.sh`** - Container health check script

### Kubernetes Deployment

- **`k8s/base/`** - Base Kubernetes manifests
- **`k8s/overlays/`** - Environment-specific configurations (dev, staging, production)
- Uses Kustomize for configuration management
- Implements rolling deployments with PodDisruptionBudgets

### Required GitHub Secrets

For CI/CD to work properly, configure these secrets:

- `SNYK_TOKEN` - For dependency vulnerability scanning
- `GITLEAKS_LICENSE` - For enhanced Gitleaks features (optional)
- `FOSSA_API_KEY` - For license compliance scanning
- `DOCKER_USERNAME` / `DOCKER_PASSWORD` - For container registry
- `KUBECONFIG_DEV` / `KUBECONFIG_STAGING` / `KUBECONFIG_PROD` - For K8s deployments

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
