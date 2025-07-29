# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learnimals is a static educational web application featuring interactive games and activities for children. Each subject area (Math, Science, Reading, Art, Coding) is represented by an animal character and follows a consistent template-based architecture.

**Current Status**: This is a local development project, not yet deployed anywhere.

## Critical Thinking and Feedback

**IMPORTANT: Always critically evaluate and challenge user suggestions, even when they seem reasonable.**

- **Question assumptions**: Don't just agree - analyze if there are better approaches
- **Offer alternative perspectives**: Suggest different solutions or point out potential issues
- **Challenge organization decisions**: If something doesn't fit logically, speak up
- **Point out inconsistencies**: Help catch logical errors or misplaced components

This critical feedback helps improve decision-making and ensures robust solutions. Being agreeable is less valuable than being thoughtful and analytical.

### Example Behaviors

✅ "I disagree - that component belongs in a different file because..."
✅ "Have you considered this alternative approach?"
✅ "This seems inconsistent with the pattern we established..."
❌ Just implementing suggestions without evaluation

## Development Commands

This is a static HTML/CSS/JavaScript website that requires no build process. To develop:

1. **Start local development server**: 
   - `python3 -m http.server 8080` (then navigate to `http://localhost:8080`)
   - `make dev-server` (equivalent to above)
   - `npx serve src/pages`
   - VS Code Live Server extension
2. **Open browser**: Navigate to `/src/pages/index.html` or the served URL
3. **No build/compilation required**: Files can be edited directly and refreshed in browser

### Initial Setup
```bash
# Install dependencies (Note: package-lock may be out of sync)
npm install

# Check Node.js version (configured for Node 18, may need adjustment)
make check-node
```

### Available npm Scripts

- `npm run lint` - Run ESLint on the src/ directory
- `npm run lint:fix` - Run ESLint with auto-fix enabled
- `npm run generate-subjects` - Generate new subject pages programmatically
- `npm run list-templates` - List all available subject templates
- `npm test` - Run all tests with Vitest (Note: has dependency issues)
- `npm run test:unit` - Run unit tests
- `npm run test:components` - Run component tests
- `npm run test:integration` - Run integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI (has dependency issues)
- `npm run test:coverage` - Run tests with coverage report

**Note**: Test commands currently have missing dependency issues (es-errors module). Run `npm install` to resolve.

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

## Repository Structure and Navigation

### Navigation Tips

- **When exploring a new feature**, first identify which directory it belongs to (`src/features/`, `src/components/`, etc.)
- **Related code is typically co-located** within the same directory structure
- **Check existing implementations** before creating new ones - look for similar components or features
- **For understanding cross-component interactions**, look for integration tests in `/tests/integration/`
- **Subject-specific code** is organized under `src/features/subjects/[subject]/`
- **Reusable components** follow the pattern `src/components/[type]/ComponentName.js`
- **Game implementations** are self-contained in `src/features/games/[game-name]/`

### Code Organization Patterns

- **Feature-based organization**: Related functionality grouped together
- **Component composition**: Complex components built from simpler ones
- **Consistent naming**: Files, classes, and functions follow established conventions
- **Template-driven**: Subject pages use shared templates with customization

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

## Coding Standards Reference

**IMPORTANT: Always read the full coding standards at the beginning of EACH session.**

Check for project-specific coding rules in these locations:
- `eslint.config.mjs` - JavaScript linting rules
- `package.json` - Project scripts and lint-staged configuration
- `.github/` - Pull request templates and contribution guidelines
- Root-level config files - Prettier, TypeScript, or other tool configurations

These guidelines contain critical details for:
- **Git commit conventions** - Message format and structure requirements
- **JavaScript style** - Naming conventions, async patterns, function structure
- **Documentation practices** - Comment structure, JSDoc patterns, README standards
- **Error handling** - Consistent error patterns and logging approaches
- **Testing strategy** - Test organization, assertion patterns, coverage requirements
- **Code organization** - File structure, import/export patterns, component architecture

**Reading the complete standards is essential** for ensuring code quality and consistency. These full guidelines contain nuances that cannot be summarized.

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

## Documentation Best Practices

When documenting JavaScript code, follow these guidelines:

### Function Documentation Structure

- **Begin with a clear, single-line summary** of what the function does
- **Include a detailed description** of the function's behavior and purpose
- **For simple functions** (0-2 parameters), describe parameters inline in the main description
- **For complex functions** (3+ parameters), use an explicit "@param" section with JSDoc
- **Always describe return values** in the main description text
- **Document error conditions** with "@throws" or describe in main text

```javascript
/**
 * Creates a new Card component with specified content and styling.
 * 
 * @param {Object} options - Configuration object for the card
 * @param {string} options.title - Card title text
 * @param {string} options.content - Main card content (HTML allowed)
 * @param {string} [options.theme='default'] - Visual theme
 * @returns {Card} Configured Card component instance
 * @throws {Error} When required options are missing
 */
function createCard(options) {
  // Implementation
}
```

### Component Documentation

- **Begin with a clear summary** of what the component represents
- **Explain the component's purpose** and usage patterns
- **Document component options** with clear descriptions
- **Document event emissions** and callback patterns

### Examples

- **Include practical examples** for public APIs
- **Ensure examples are current** and demonstrate typical usage
- **For complex components**, show multiple usage scenarios
- **Test examples** to ensure they work as documented

This balanced approach maintains readability while providing necessary structure for complex APIs.

## Testing

The project uses Vitest for automated testing with the following configuration:
- Test environment: jsdom (for DOM manipulation)
- Test files: Located in `tests/` directory
- Coverage provider: @vitest/coverage-v8

**Note**: Test commands currently have dependency issues. You may need to run `npm install` to resolve missing modules.

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/logger.test.js

# Run specific test directory
npm test -- tests/unit/

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run with UI interface (has issues)
npm run test:ui
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

### Working Make Commands
```bash
# Development
make dev-server    # Start local server
make lint          # Run ESLint
make lint-fix      # Run ESLint with auto-fix

# Subject generation
make generate-subjects

# Help
make help          # View all available commands
```

## Branch Naming Convention

Use descriptive branch names that clearly indicate the purpose and scope of changes:

### Branch Types

- **`feature/`** - New features or enhancements
  - `feature/user-profile-system`
  - `feature/math-game-improvements`
  - `feature/theme-customization`

- **`fix/`** - Bug fixes
  - `fix/navigation-mobile-menu`
  - `fix/theme-switching-persistence`
  - `fix/card-component-accessibility`

- **`refactor/`** - Code refactoring without functional changes
  - `refactor/component-architecture`
  - `refactor/utility-functions`

- **`docs/`** - Documentation updates
  - `docs/component-library-guide`
  - `docs/deployment-instructions`

- **`test/`** - Test additions or improvements
  - `test/integration-test-coverage`
  - `test/component-unit-tests`

- **`chore/`** - Maintenance tasks, dependency updates
  - `chore/dependency-updates`
  - `chore/ci-pipeline-optimization`

### Naming Guidelines

- Use lowercase with hyphens for separation
- Be descriptive but concise (2-4 words after prefix)
- Include issue numbers when applicable: `feature/user-auth-123`
- Avoid personal identifiers or temporary naming

## Pull Request Template

The repository includes a comprehensive PR template at `.github/pull_request_template.md` that ensures consistent and thorough pull request descriptions.

### PR Requirements

When creating pull requests, ensure you:

- **Provide clear context** - Explain what changes were made and why
- **Reference related issues** - Link to GitHub issues using `#issue-number`
- **Describe testing** - Document how changes were tested
- **Note breaking changes** - Highlight any backwards compatibility issues
- **Update documentation** - Include relevant documentation updates
- **Follow checklist** - Complete all items in the PR template checklist

### Before Submitting

```bash
# Run pre-commit checks
npm run lint
npm test  # Note: has dependency issues

# Fix linting issues
npm run lint:fix
```

### PR Review Process

- PRs require approval before merging
- CI pipeline runs tests and linting
- Consider requesting review from code owners
- Address all feedback before merging

## CI/CD & Security

### GitHub Actions Workflows
The project includes GitHub Actions workflows that are being fine-tuned:

- **`.github/workflows/ci.yml`** - Main CI pipeline with tests and quality checks
- **`.github/workflows/security.yml`** - Security scanning workflow
- **`.github/workflows/deploy.yml`** - GitHub Pages deployment (not active)
- Additional workflows exist but are being fine-tuned for future use

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

## Git Worktree Development Workflow

**REQUIRED**: This project uses git worktrees for parallel development. All developers must use the worktree structure below.

### Worktree Setup
1. **Initial Setup** (one-time): Run the setup script from project root:
   ```bash
   chmod +x scripts/setup-worktrees.sh
   ./scripts/setup-worktrees.sh
   ```

2. **Worktree Structure** (automatically created):
   ```
   learnimals/                    # Original repository (main branch)
   learnimals-worktrees/
   ├── main/                     # Main development and testing
   ├── stabilization/            # Infrastructure fixes (URGENT)
   ├── feature-development/      # New feature work
   ├── hotfix/                   # Emergency bug fixes
   └── experimental/             # Prototype and experimental features
   ```

### Development Workflow

#### Critical Infrastructure Work (IMMEDIATE)
```bash
cd ../learnimals-worktrees/stabilization
npm install
# Work on infrastructure fixes (ESLint errors, testing framework, CI/CD)
```

#### Feature Development
```bash
cd ../learnimals-worktrees/feature-development
npm install
# Develop new features and major functionality
```

#### Emergency Fixes
```bash
cd ../learnimals-worktrees/hotfix
npm install
# Fix critical bugs that need immediate deployment
```

#### Experimental Work
```bash
cd ../learnimals-worktrees/experimental
npm install
# Try new ideas, prototypes, major refactoring
```

### Worktree Management Commands
```bash
# List all worktrees
git worktree list

# Remove unused worktree
git worktree remove <worktree-name>

# Add new worktree
git worktree add <path> <branch-name>

# Move between worktrees
cd ../learnimals-worktrees/<worktree-name>
```

### Required Workflow Rules

1. **Each worktree runs independently**: Install dependencies (`npm install`) in each worktree before development
2. **Separate node_modules**: Each worktree has its own node_modules for isolated development
3. **Branch isolation**: Work stays isolated until explicitly merged
4. **Testing in each worktree**: Run tests in the appropriate worktree context
5. **No cross-worktree file dependencies**: Keep work self-contained within each worktree

### Development Priority Order
1. **stabilization** - Fix infrastructure first (5-day critical path)
2. **feature-development** - Core MVP features
3. **main** - Integration and final testing
4. **hotfix** - Emergency fixes only
5. **experimental** - Research and prototypes

### Integration Process
```bash
# From feature branch, merge to main
cd ../learnimals-worktrees/feature-development
git add . && git commit -m "Feature: description"
git push origin feature-branch

# Switch to main for integration
cd ../learnimals-worktrees/main
git pull origin main
git merge feature-branch
```

**Important**: The original repository directory should primarily be used for documentation updates and final integration work.

## Common Commands

Quick reference for frequently used commands:

### Development Setup
```bash
# Initial setup
npm install
make setup

# Set up worktrees (REQUIRED - one-time setup)
chmod +x scripts/setup-worktrees.sh
./scripts/setup-worktrees.sh

# Start development server (in appropriate worktree)
cd ../learnimals-worktrees/feature-development
npm install
npm run dev
# or
python3 -m http.server 8080
```

### Testing & Quality
```bash
# Run tests (has dependency issues)
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix
# or
make lint
make lint-fix
```

### Subject Generation
```bash
# List available templates
npm run list-templates

# Generate subjects
npm run generate-subjects -- --subjects=music,geography
# or
make generate-subjects
```

### Utilities
```bash
# View all available commands
make help

# Clean up (may have issues)
make clean
```

## Future Features

For information about planned features like Docker deployment, Kubernetes infrastructure, and advanced CI/CD, see `FUTURE-FEATURES.md`.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.