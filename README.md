# 🎮 Learnimals - Educational Games for Children

[![CI/CD Pipeline](https://github.com/AustinOrphan/learnimals/actions/workflows/ci.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/ci.yml)
[![Security Scan](https://github.com/AustinOrphan/learnimals/actions/workflows/security.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/security.yml)
[![Monitoring](https://github.com/AustinOrphan/learnimals/actions/workflows/monitoring.yml/badge.svg)](https://github.com/AustinOrphan/learnimals/actions/workflows/monitoring.yml)

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

### Installation

```bash
# Clone the repository
git clone https://github.com/AustinOrphan/learnimals.git
cd learnimals

# Install dependencies
npm install

# Start local development server
python3 -m http.server 8080
# or use the Makefile
make dev-server
```

Visit `http://localhost:8080` to see the application.

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