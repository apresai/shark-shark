.PHONY: all install clean build run run-dev start test test-watch test-coverage lint deploy help

# Default target
all: install build

# Install dependencies
install:
	npm install

# Remove build artifacts and dependencies
clean:
	rm -rf .next
	rm -rf out
	rm -rf build
	rm -rf dist
	rm -rf coverage
	rm -rf node_modules
	rm -rf .turbo
	rm -f *.tsbuildinfo

# Build for production
build:
	npm run build

# Run development server
run:
	@echo "Starting development server at http://localhost:3000"
	npm run dev

# Alias for run
run-dev: run

# Run production server (requires build first)
start: build
	npm start

# Run tests
test:
	npm test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Run tests with coverage
test-coverage:
	npm run test:coverage

# Run linter
lint:
	npm run lint

# Deploy to AWS using CDK (OpenNext serverless)
# Sources .env.local for auth secrets before deploying
deploy:
	@echo "Deploying via CDK..."
	@set -a && [ -f .env.local ] && . ./.env.local; set +a && cd infra && npm run cdk deploy -- --require-approval never
	@echo "Deployment complete!"

# Show help
help:
	@echo "Available targets:"
	@echo "  make install       - Install dependencies"
	@echo "  make clean         - Remove build artifacts and node_modules"
	@echo "  make build         - Build for production"
	@echo "  make run           - Start development server"
	@echo "  make run-dev       - Alias for 'make run'"
	@echo "  make start         - Build and start production server"
	@echo "  make test          - Run tests"
	@echo "  make test-watch    - Run tests in watch mode"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make lint          - Run ESLint"
	@echo "  make deploy        - Deploy to AWS via CDK (OpenNext serverless)"
	@echo "  make help          - Show this help message"
