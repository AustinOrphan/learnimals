# Contributing to Learnimals

Thank you for your interest in contributing to Learnimals! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm (comes with Node.js)
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/learnimals.git
   cd learnimals
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Code Standards

- **ESLint**: All JavaScript must pass ESLint rules
- **Testing**: Maintain minimum 80% code coverage
- **Commits**: Use conventional commit messages (feat:, fix:, docs:, etc.)

### Pre-commit Hooks

The project uses Husky for Git hooks:
- **Pre-commit**: Runs ESLint and related tests
- **Pre-push**: Runs full test suite

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:components
npm run test:integration
```

### Code Style

- Use 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Follow existing patterns in the codebase

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure code coverage doesn't drop below 80%
5. Submit PR with clear description

### PR Title Format

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## CI/CD Pipeline

All PRs trigger the CI pipeline which runs:

1. **Linting**: ESLint checks
2. **Testing**: Vitest with coverage
3. **Build**: Verify build process
4. **HTML Validation**: Check HTML syntax
5. **PWA Audit**: Lighthouse checks
6. **Security**: Dependency scanning

## Release Process

Releases are managed automatically:

1. Merge to main branch
2. If commit contains `[release]`, version is bumped
3. Changelog is generated
4. GitHub release is created
5. Site is deployed to GitHub Pages

### Version Bumping

- `fix:` commits → patch version (1.0.0 → 1.0.1)
- `feat:` commits → minor version (1.0.0 → 1.1.0)
- Breaking changes → major version (1.0.0 → 2.0.0)

## Project Structure

```
learnimals/
├── src/                    # Source code
│   ├── pages/              # HTML pages
│   ├── components/         # Reusable components
│   ├── features/           # Feature modules
│   ├── styles/             # CSS files
│   └── utils/              # Utilities
├── tests/                  # Test files
├── public/                 # Static assets
├── scripts/                # Build scripts
└── .github/                # GitHub Actions
```

## Getting Help

- Check existing issues
- Read the documentation
- Ask in discussions
- Contact maintainers

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.