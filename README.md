# 🎮 Learnimals - Educational Games for Children

[![CI/CD Pipeline](https://github.com/AustinOrphan/learnimals/actions/workflows/ci.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/ci.yml)
[![Deploy](https://github.com/AustinOrphan/learnimals/actions/workflows/deploy.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/deploy.yml)
[![Security Scan](https://github.com/AustinOrphan/learnimals/actions/workflows/security.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/security.yml)
[![Monitoring](https://github.com/AustinOrphan/learnimals/actions/workflows/monitoring.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/monitoring.yml)
[![codecov](https://codecov.io/gh/AustinOrphan/learnimals/branch/main/graph/badge.svg)](https://codecov.io/gh/AustinOrphan/learnimals)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Learnimals is an interactive educational web application featuring fun games and activities designed to help children learn core subjects through play. Each subject area is represented by a friendly animal character, creating an engaging and memorable learning experience.

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

- Node.js 18+ (use `.nvmrc` for exact version)
- npm or yarn
- Python 3 (for local development server)
- Modern web browser (Chrome, Firefox, Edge, etc.)

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/AustinOrphan/learnimals.git
   cd learnimals
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run tests
   ```bash
   npm test
   ```

4. Start a local web server
   ```bash
   python3 -m http.server 8080
   # or use the Makefile
   make dev-server
   # or
   npx serve src/pages
   ```

5. Open `http://localhost:8080` in your browser

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **CI Pipeline**: Runs on every push and PR
  - ESLint for code quality
  - Vitest for unit testing (80% coverage threshold)
  - HTML validation
  - PWA audit with Lighthouse
  - Security scanning
  - Multi-version Node.js testing (18, 20)

- **Deployment**: Automatic deployment to GitHub Pages on main branch
- **Release Management**: Automated versioning and changelog generation
- **Dependency Updates**: Weekly automated dependency checks

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Run tests locally: `npm test`
4. Commit changes (pre-commit hooks will run)
5. Push and create a PR
6. CI pipeline will validate changes
7. Merge to main triggers deployment

### Using Make Commands

```bash
# View all available commands
make help

# Common development tasks
make install          # Install dependencies
make test            # Run tests
make lint            # Run ESLint
make dev-server      # Start development server
make docker-run      # Run with Docker
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
├── .github/workflows/      # CI/CD pipelines
├── docker/                 # Docker configurations
└── k8s/                    # Kubernetes manifests
```

### Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Testing**: Vitest, Happy DOM
- **CI/CD**: GitHub Actions, Docker, Kubernetes
- **Monitoring**: Prometheus, Grafana, Lighthouse CI
- **Security**: CodeQL, Snyk, Trivy

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm test -- tests/unit/
npm test -- tests/integration/

# Run with coverage
npm test -- --coverage
npm run test:unit
npm run test:navigation
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 🐳 Docker Support

### Local Development with Docker

```bash
# Build and run with Docker Compose
make docker-run

# Stop containers
make docker-stop

# View logs
make docker-logs
```

### Production Docker Build

```bash
# Build production image
docker build -t learnimals:latest .

# Run production container
docker run -p 8080:8080 learnimals:latest
```

## 🚀 Deployment

The project uses a **Rolling Deployment** strategy with multi-environment support:

- **Development**: Feature testing and rapid iteration
- **Staging**: Integration testing and QA
- **Production**: Live application with high availability

### Deployment Commands

```bash
# Deploy to staging
make deploy-staging

# Deploy to production (requires approval)
make deploy-production

# Validate Kubernetes manifests
make validate-k8s
```

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed deployment procedures.

## 🔒 Security

- **Continuous Security Scanning**: Daily vulnerability scans
- **Dependency Management**: Automated updates with Dependabot
- **Container Security**: Multi-stage builds with security hardening
- **Network Policies**: Kubernetes-native traffic control
- **HTTPS Only**: Enforced TLS with HSTS

## 📊 Monitoring & Performance

- **Health Checks**: Continuous application monitoring
- **Performance Metrics**: Core Web Vitals tracking
- **Accessibility**: WCAG 2.1 AA compliance
- **User Journey Testing**: Synthetic monitoring

## 🔒 Security

### Security Scanning

Our CI/CD pipeline includes comprehensive security scanning:

- **🔍 SAST Analysis**: CodeQL and Semgrep for code vulnerabilities
- **📦 Dependency Scanning**: npm audit and Snyk for package vulnerabilities  
- **🐳 Container Security**: Trivy and Grype for Docker image scanning
- **🔐 Secrets Detection**: Gitleaks and TruffleHog prevent credential leaks
- **🏗️ Infrastructure Security**: Checkov and Terrascan for IaC scanning
- **📄 License Compliance**: Automated license checking with FOSSA

### Security Features

- **Content Security Policy (CSP)** enforced via nginx
- **XSS Prevention** with input sanitization utilities
- **Security Headers** for defense in depth
- **Non-root Container** execution for reduced attack surface
- **Regular Updates** of dependencies and base images

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

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/AustinOrphan/learnimals/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AustinOrphan/learnimals/discussions)

---

Made with ❤️ for children's education