# Makefile for Learnimals Project
.PHONY: help install test lint build docker-build docker-run docker-stop deploy-staging deploy-production clean

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := 18
DOCKER_IMAGE := learnimals
DOCKER_TAG := latest
PORT := 8080

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

## help: Display this help message
help:
	@echo "${CYAN}Learnimals Project Makefile${NC}"
	@echo ""
	@echo "${GREEN}Available targets:${NC}"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  ${CYAN}%-20s${NC} %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

## install: Install project dependencies
install:
	@echo "${YELLOW}Installing dependencies...${NC}"
	npm ci
	@echo "${GREEN}✓ Dependencies installed${NC}"

## test: Run all tests
test:
	@echo "${YELLOW}Running tests...${NC}"
	npm test
	@echo "${GREEN}✓ Tests completed${NC}"

## test-watch: Run tests in watch mode
test-watch:
	@echo "${YELLOW}Running tests in watch mode...${NC}"
	npm run test:watch

## test-coverage: Run tests with coverage report
test-coverage:
	@echo "${YELLOW}Running tests with coverage...${NC}"
	npm run test:coverage
	@echo "${GREEN}✓ Coverage report generated${NC}"

## lint: Run ESLint on source code
lint:
	@echo "${YELLOW}Running ESLint...${NC}"
	npm run lint
	@echo "${GREEN}✓ Linting completed${NC}"

## lint-fix: Run ESLint with auto-fix
lint-fix:
	@echo "${YELLOW}Running ESLint with auto-fix...${NC}"
	npm run lint:fix
	@echo "${GREEN}✓ Linting with fixes completed${NC}"

## docker-build: Build Docker image
docker-build:
	@echo "${YELLOW}Building Docker image...${NC}"
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "${GREEN}✓ Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)${NC}"

## docker-run: Run Docker container locally
docker-run:
	@echo "${YELLOW}Starting Docker container...${NC}"
	docker-compose up -d
	@echo "${GREEN}✓ Application running at http://localhost:$(PORT)${NC}"
	@echo "${GREEN}✓ Prometheus running at http://localhost:9090${NC}"
	@echo "${GREEN}✓ Grafana running at http://localhost:3000${NC}"

## docker-stop: Stop Docker containers
docker-stop:
	@echo "${YELLOW}Stopping Docker containers...${NC}"
	docker-compose down
	@echo "${GREEN}✓ Containers stopped${NC}"

## docker-logs: View Docker container logs
docker-logs:
	@echo "${YELLOW}Showing container logs...${NC}"
	docker-compose logs -f learnimals-app

## docker-shell: Access Docker container shell
docker-shell:
	@echo "${YELLOW}Accessing container shell...${NC}"
	docker exec -it learnimals-app /bin/sh

## security-scan: Run security vulnerability scan
security-scan:
	@echo "${YELLOW}Running security scan...${NC}"
	npm audit --audit-level moderate
	@echo "${GREEN}✓ Security scan completed${NC}"

## lighthouse: Run Lighthouse performance test
lighthouse:
	@echo "${YELLOW}Running Lighthouse test...${NC}"
	@if [ ! -f "server.pid" ]; then \
		python3 -m http.server $(PORT) & echo $$! > server.pid; \
		sleep 2; \
	fi
	npx lighthouse http://localhost:$(PORT) --view
	@if [ -f "server.pid" ]; then \
		kill $$(cat server.pid) && rm server.pid; \
	fi
	@echo "${GREEN}✓ Lighthouse test completed${NC}"

## dev: Start Vite development server (modern)
dev:
	@echo "${YELLOW}Starting Vite development server...${NC}"
	npm run dev

## dev-server: Start local development server (legacy/compatibility)
dev-server:
	@echo "${YELLOW}Starting legacy development server...${NC}"
	python3 -m http.server $(PORT)

## build: Build project with Vite
build:
	@echo "${YELLOW}Building project with Vite...${NC}"
	npm run build
	@echo "${GREEN}✓ Build completed${NC}"

## preview: Preview production build
preview:
	@echo "${YELLOW}Starting preview server...${NC}"
	npm run preview

## generate-subjects: Generate new subject pages
generate-subjects:
	@echo "${YELLOW}Generating subject pages...${NC}"
	npm run generate-subjects
	@echo "${GREEN}✓ Subject pages generated${NC}"

## deploy-staging: Deploy to staging environment (requires setup)
deploy-staging:
	@echo "${YELLOW}Deploying to staging...${NC}"
	@echo "${CYAN}Triggering GitHub Actions deployment workflow...${NC}"
	gh workflow run deploy-rolling.yml -f environment=staging
	@echo "${GREEN}✓ Staging deployment initiated${NC}"

## deploy-production: Deploy to production environment (requires approval)
deploy-production:
	@echo "${RED}⚠️  Production deployment requires manual approval${NC}"
	@echo "${YELLOW}Deploying to production...${NC}"
	@echo "${CYAN}Triggering GitHub Actions deployment workflow...${NC}"
	gh workflow run deploy-rolling.yml -f environment=production
	@echo "${GREEN}✓ Production deployment initiated (pending approval)${NC}"

## validate-k8s: Validate Kubernetes manifests
validate-k8s:
	@echo "${YELLOW}Validating Kubernetes manifests...${NC}"
	@for file in k8s/**/*.yaml; do \
		echo "Validating $$file..."; \
		kubectl --dry-run=client apply -f $$file || exit 1; \
	done
	@echo "${GREEN}✓ All Kubernetes manifests are valid${NC}"

## clean: Clean build artifacts and temporary files
clean:
	@echo "${YELLOW}Cleaning build artifacts...${NC}"
	rm -rf node_modules
	rm -rf coverage
	rm -rf dist
	rm -f server.pid
	docker-compose down -v
	@echo "${GREEN}✓ Cleanup completed${NC}"

## setup: Initial project setup
setup: install
	@echo "${YELLOW}Setting up project...${NC}"
	@if [ ! -f ".env" ]; then \
		echo "${CYAN}Creating .env file...${NC}"; \
		echo "NODE_ENV=development" > .env; \
		echo "PORT=$(PORT)" >> .env; \
	fi
	@echo "${GREEN}✓ Project setup completed${NC}"

## check-node: Check Node.js version
check-node:
	@echo "${YELLOW}Checking Node.js version...${NC}"
	@NODE_CURRENT=$$(node -v | cut -d'v' -f2 | cut -d'.' -f1); \
	if [ "$$NODE_CURRENT" != "$(NODE_VERSION)" ]; then \
		echo "${RED}✗ Node.js version $$NODE_CURRENT detected. Please use version $(NODE_VERSION)${NC}"; \
		echo "${CYAN}Run 'nvm use' if you have nvm installed${NC}"; \
		exit 1; \
	else \
		echo "${GREEN}✓ Node.js version $(NODE_VERSION) detected${NC}"; \
	fi

## pr-check: Run all checks before creating a PR
pr-check: check-node lint test security-scan
	@echo "${GREEN}✓ All PR checks passed!${NC}"

## monitor-health: Monitor application health
monitor-health:
	@echo "${YELLOW}Monitoring application health...${NC}"
	@while true; do \
		curl -s http://localhost:$(PORT)/health > /dev/null && \
		echo "${GREEN}✓ Health check passed - $$(date)${NC}" || \
		echo "${RED}✗ Health check failed - $$(date)${NC}"; \
		sleep 10; \
	done