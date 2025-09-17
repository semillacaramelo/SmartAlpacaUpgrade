#!/bin/bash

# 🚀 Smart Alpaca V2.0 - Phase A Deployment Script
# Paper Trading Environment Setup

set -e  # Exit on any error

echo "🚀 Starting Smart Alpaca V2.0 - Phase A Deployment (Paper Trading)"
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm version check passed: $(npm -v)"

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    print_warning "redis-cli not found. Please ensure Redis is installed and running."
else
    if redis-cli ping &> /dev/null; then
        print_success "Redis connection check passed"
    else
        print_error "Redis is not running. Please start Redis service."
        exit 1
    fi
fi

# Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    print_warning "Production environment file not found. Creating template..."

    cat > .env.production << EOF
# Smart Alpaca V2.0 Production Environment Variables
# Phase A: Paper Trading Configuration

# Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=your_production_database_url_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Alpaca API (Paper Trading)
ALPACA_API_KEY=your_paper_api_key_here
ALPACA_API_SECRET=your_paper_api_secret_here
ALPACA_PAPER=true

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Session
SESSION_SECRET=your_secure_session_secret_here

# Logging
LOG_LEVEL=info
EOF

    print_warning "Created .env.production template. Please fill in your actual values."
    print_warning "Especially important: DATABASE_URL, ALPACA_API_KEY, ALPACA_API_SECRET, GEMINI_API_KEY"
    read -p "Press Enter after updating .env.production to continue..."
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --production=false --legacy-peer-deps

# Run tests before deployment
print_status "Running test suite..."
if npm test; then
    print_success "All tests passed!"
else
    print_error "Tests failed. Please fix issues before deployment."
    exit 1
fi

# Build the application
print_status "Building application for production..."
npm run build

# Create necessary directories
print_status "Setting up directories..."
mkdir -p logs
mkdir -p data

# Set proper permissions
print_status "Setting file permissions..."
chmod +x scripts/*.sh
chmod +x server/worker.ts

# Database migration check
print_status "Checking database connectivity..."
if npm run db:push; then
    print_success "Database schema is up to date"
else
    print_error "Database migration failed. Please check your DATABASE_URL."
    exit 1
fi

# Create systemd service files (if on Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Creating systemd service files..."

    # Server service
    cat > /tmp/smart-alpaca-server.service << EOF
[Unit]
Description=Smart Alpaca Trading Server
After=network.target redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env.production
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Worker service
    cat > /tmp/smart-alpaca-worker.service << EOF
[Unit]
Description=Smart Alpaca Trading Worker
After=network.target redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env.production
ExecStart=$(which tsx) server/worker.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    print_success "Systemd service files created in /tmp/"
    print_warning "To install services, run:"
    echo "sudo cp /tmp/smart-alpaca-server.service /etc/systemd/system/"
    echo "sudo cp /tmp/smart-alpaca-worker.service /etc/systemd/system/"
    echo "sudo systemctl daemon-reload"
    echo "sudo systemctl enable smart-alpaca-server smart-alpaca-worker"
    echo "sudo systemctl start smart-alpaca-server smart-alpaca-worker"
fi

# Health check function
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1

    print_status "Performing health check on $url..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "Health check passed for $url"
            return 0
        fi

        print_status "Health check attempt $attempt/$max_attempts failed, retrying in 2 seconds..."
        sleep 2
        ((attempt++))
    done

    print_error "Health check failed for $url after $max_attempts attempts"
    return 1
}

# Start services for testing
print_status "Starting services for validation..."

# Start server in background
NODE_ENV=production node dist/index.js &
SERVER_PID=$!

# Start worker in background
NODE_ENV=production tsx server/worker.ts &
WORKER_PID=$!

# Wait for services to start
sleep 5

# Perform health checks
if health_check "http://localhost:3000/api/system/health"; then
    print_success "Server health check passed"
else
    print_error "Server health check failed"
    kill $SERVER_PID $WORKER_PID 2>/dev/null || true
    exit 1
fi

# Test API endpoints
print_status "Testing API endpoints..."

# Test market data endpoint
if curl -f -s "http://localhost:3000/api/market-data?symbols=AAPL" > /dev/null 2>&1; then
    print_success "Market data API test passed"
else
    print_warning "Market data API test failed - this may be expected if Alpaca credentials are not set"
fi

# Test portfolio endpoint
if curl -f -s "http://localhost:3000/api/portfolio/status" > /dev/null 2>&1; then
    print_success "Portfolio API test passed"
else
    print_warning "Portfolio API test failed - this may be expected if Alpaca credentials are not set"
fi

# Stop test services
print_status "Stopping test services..."
kill $SERVER_PID $WORKER_PID 2>/dev/null || true

# Wait for processes to stop
sleep 2

# Final deployment instructions
echo ""
echo "================================================================="
print_success "🎉 Phase A Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env.production with your actual credentials"
echo "2. Start the services:"
echo "   npm run start        # Start server"
echo "   npm run start:worker # Start worker (in another terminal)"
echo ""
echo "3. Access the dashboard at: http://localhost:3000"
echo "4. Monitor system health at: http://localhost:3000/api/system/health"
echo ""
echo "📊 Monitoring Commands:"
echo "• View server logs: Check your terminal output"
echo "• View worker logs: Check the worker terminal"
echo "• System metrics: GET /api/system/metrics"
echo "• Queue status: GET /api/queue/status"
echo ""
echo "🚨 Emergency Stop:"
echo "• Stop server: Ctrl+C in server terminal"
echo "• Stop worker: Ctrl+C in worker terminal"
echo ""
print_warning "Remember: This is PAPER TRADING mode. No real money at risk."
echo "================================================================="

exit 0
