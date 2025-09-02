.PHONY: generate dev build test clean

# Generate TypeScript SDK from Go backend
generate:
	@echo "🔧 Generating TypeScript SDK..."
	go run cmd/generate/main.go

# Run the backend in development mode
dev:
	@echo "🚀 Starting Go backend..."
	go run main.go

# Build the backend binary
build:
	@echo "🔨 Building Go binary..."
	go build -o budget-zero-backend main.go

# Run tests
test:
	@echo "🧪 Running tests..."
	go test ./...

# Format Go code
fmt:
	@echo "✨ Formatting Go code..."
	go fmt ./...

# Vet Go code
vet:
	@echo "🔍 Vetting Go code..."
	go vet ./...

# Tidy Go modules
mod:
	@echo "🧹 Tidying Go modules..."
	go mod tidy

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -f budget-zero-backend

# Install dependencies
deps:
	@echo "📦 Installing Go dependencies..."
	go mod download

# Full setup: install deps, generate SDK, and start dev server
setup: deps generate dev
