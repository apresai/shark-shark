.PHONY: all install clean build run-dev start test test-watch test-coverage lint help

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
run-dev:
	npm run dev

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

# Show help
help:
	@echo "Available targets:"
	@echo "  make install       - Install dependencies"
	@echo "  make clean         - Remove build artifacts and node_modules"
	@echo "  make build         - Build for production"
	@echo "  make run-dev       - Start development server"
	@echo "  make start         - Build and start production server"
	@echo "  make test          - Run tests"
	@echo "  make test-watch    - Run tests in watch mode"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make lint          - Run ESLint"
	@echo "  make help          - Show this help message"
