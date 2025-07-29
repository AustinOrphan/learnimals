# 🎮 Learnimals - Educational Games for Children

[![CI/CD Pipeline](https://github.com/AustinOrphan/learnimals/actions/workflows/ci.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/ci.yml)
[![Security Scan](https://github.com/AustinOrphan/learnimals/actions/workflows/security.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Learnimals is an interactive educational web application featuring fun games and activities designed to help children learn core subjects through play. Each subject area is represented by a friendly animal character, creating an engaging and memorable learning experience.

**Note**: This is a static HTML/CSS/JavaScript application currently used for local development only. See [FUTURE-FEATURES.md](FUTURE-FEATURES.md) for planned deployment and infrastructure features.

## 🌟 Features

- **🦁 Art with Leo the Lion** - Creative activities and drawing games
- **🦜 Math with Max the Parrot** - Number games and mathematical concepts
- **🐼 Reading with Ruby the Panda** - Vocabulary and reading comprehension
- **🧬 Science with Sam the Shark** - Scientific exploration and experiments
- **💻 Coding with Cody the Cat** - Introduction to programming concepts
- **🎵 Music with Melody the Songbird** - Musical theory and rhythm games
- **🌍 Geography with Geo the Eagle** - World exploration and map skills
- **🍕 Pizza Maker Game** - Fun cooking game with drag-and-drop mechanics
- **🎯 Bubble Pop Game** - Engaging arcade-style educational game
- **📝 Word Scramble** - Vocabulary building through word puzzles

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Python 3 (for local development server) or any static file server
- Modern web browser

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/AustinOrphan/learnimals.git
   cd learnimals
   ```

2. Install dependencies
   ```bash
   npm install
   # Note: npm ci currently fails due to package-lock.json sync issues
   ```

3. Run tests
   ```bash
   npm test
   # Note: Tests may fail with "Cannot find module 'es-errors/type'" error
   # This is a known dependency issue that needs resolution
   ```

4. Start a local web server
   ```bash
   python3 -m http.server 8080
   # or use the Makefile
   make dev-server
   # or
   npx serve src/pages
   ```

5. Open `http://localhost:8080/src/pages/index.html` in your browser

### CI/CD Pipeline

This project includes GitHub Actions workflows that are currently being fine-tuned:

- **CI Pipeline**: Runs on every push and PR
  - ESLint for code quality
  - Vitest for unit testing (though tests have dependency issues)
  - Security scanning
  - Multi-version Node.js testing (18, 20)

- **Other Workflows**: Various workflows exist for security, accessibility, and deployment but are not yet fully configured

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Run linting: `make lint` or `npm run lint`
4. Commit changes (pre-commit hooks will run)
5. Push and create a PR
6. CI pipeline will attempt validation
7. Merge to main when ready

### Using Make Commands

```bash
# View all available commands
make help

# Working development commands
make dev-server      # Start development server
make lint            # Run ESLint (shows ~200 errors)
make lint-fix        # Run ESLint with auto-fix
make generate-subjects  # Generate new subject pages

# Commands with issues
make install         # Fails - use npm install instead
make test            # Fails - missing es-errors module
```

## 🏗️ Architecture

### Project Structure

```
learnimals/
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── features/           # Feature-specific code
│   │   ├── subjects/       # Subject pages (math, science, etc.)
│   │   └── games/          # Game implementations
│   ├── styles/             # CSS organization
│   ├── utils/              # Utility functions
│   └── pages/              # Main application pages
├── public/                 # Static assets
├── tests/                  # Test files
├── .github/workflows/      # CI/CD pipelines (being fine-tuned)
├── docker/                 # Docker configurations (not currently used)
└── k8s/                    # Kubernetes manifests (not currently used)
```

### Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Testing**: Vitest with jsdom environment (has dependency issues)
- **Code Quality**: ESLint
- **CI/CD**: GitHub Actions (workflows being fine-tuned)
- **Local Development**: Python HTTP server or npx serve

## 🧪 Testing

**Note**: Tests currently fail due to missing `es-errors` module dependency. This needs to be resolved before tests can run properly.

```bash
# Run all tests (currently fails)
npm test

# Available test commands (when working):
npm run test:watch          # Run tests in watch mode
npm run test:unit           # Run unit tests
npm run test:components     # Run component tests
npm run test:integration    # Run integration tests
npm run test:coverage       # Generate coverage report
```


## 🔒 Security

The project includes security configurations in GitHub Actions workflows (still being fine-tuned):

- **Security Scanning**: Various security scanning tools configured but not fully operational
- **XSS Prevention**: Input sanitization utilities in the codebase
- **Dependency Management**: npm audit available via `npm audit`

### Reporting Security Issues

Please see our [Security Policy](docs/SECURITY.md) for details on reporting vulnerabilities.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See our [PR template](.github/pull_request_template.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- All the children who inspire us to create better educational tools
- The open-source community for amazing tools and libraries
- Contributors who help make Learnimals better

## 📞 Support

- **Documentation**: See CLAUDE.md for development guidance
- **Issues**: [GitHub Issues](https://github.com/AustinOrphan/learnimals/issues)

---

Made with ❤️ for children's education