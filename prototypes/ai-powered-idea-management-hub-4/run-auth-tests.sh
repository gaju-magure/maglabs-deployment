#!/bin/bash

# Comprehensive Authentication Testing Script
# This script sets up and runs end-to-end authentication tests using Docker Compose

# Enable strict error handling
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
TEST_TIMEOUT=300  # 5 minutes

# Cleanup function for trap
cleanup() {
    local exit_code=$?
    log_info "Cleaning up test environment..."
    
    # Stop and remove containers
    if [ -f "$COMPOSE_FILE" ]; then
        docker compose -f "$COMPOSE_FILE" down --remove-orphans --volumes 2>/dev/null || true
    fi
    
    # Return to original directory if we changed it
    cd "$(dirname "$0")" 2>/dev/null || true
    
    if [ $exit_code -eq 0 ]; then
        log_success "Cleanup completed successfully"
    else
        log_warning "Cleanup completed after error (exit code: $exit_code)"
    fi
    
    exit $exit_code
}

# Set trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

log_info "Starting Supabase Authentication Integration Tests"
echo "============================================================"

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose is not available"
    exit 1
fi

if [ ! -f ".env.local" ]; then
    log_error ".env.local file not found - required for Supabase configuration"
    log_info "Please ensure .env.local contains:"
    log_info "  VITE_SUPABASE_URL=..."
    log_info "  VITE_SUPABASE_ANON_KEY=..."
    exit 1
fi

log_success "Prerequisites check passed"

# Load environment variables
set -a  # Automatically export all variables
source .env.local
set +a  # Stop auto-exporting

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    log_error "Required environment variables not found in .env.local"
    exit 1
fi

# Export additional variables for Docker Compose
export VITE_SUPABASE_URL
export VITE_SUPABASE_ANON_KEY
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-"dummy-service-key"}
export SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET:-"dummy-jwt-secret"}

log_success "Environment variables loaded and exported"

# Clean up any existing containers
log_info "Cleaning up existing containers..."
docker compose -f $COMPOSE_FILE down --remove-orphans --volumes 2>/dev/null || true

# Build and start services
log_info "Building and starting services..."
docker compose -f $COMPOSE_FILE build --no-cache

log_info "Starting services..."
docker compose -f $COMPOSE_FILE up -d --wait

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
timeout $TEST_TIMEOUT bash -c 'until docker compose -f docker-compose.test.yml ps | grep -q "healthy"; do sleep 5; done' || {
    log_error "Services failed to become healthy within timeout"
    log_info "Checking service logs..."
    docker compose -f $COMPOSE_FILE logs
    docker compose -f $COMPOSE_FILE down
    exit 1
}

log_success "Services are healthy"

# Install test dependencies if running locally
if [ ! -d "tests/node_modules" ]; then
    log_info "Installing test dependencies..."
    cd tests
    npm install
    cd ..
fi

# Run tests using local Node.js (faster than Docker for testing)
log_info "Running authentication tests..."
cd tests

# Set environment variables for local test execution
export FRONTEND_URL="http://localhost:3000"
export BACKEND_URL="http://localhost:8000"
export PROXY_URL="http://localhost:8080"

# Run the tests
if node auth-integration-test.js; then
    log_success "All authentication tests passed!"
    TEST_EXIT_CODE=0
else
    log_error "Some authentication tests failed"
    TEST_EXIT_CODE=1
fi

cd ..

# Show service logs if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
    log_info "Showing service logs for debugging..."
    echo "============================================================"
    log_info "Frontend logs:"
    docker compose -f $COMPOSE_FILE logs frontend | tail -20
    echo "------------------------------------------------------------"
    log_info "Backend logs:"
    docker compose -f $COMPOSE_FILE logs backend | tail -20
    echo "------------------------------------------------------------"
    log_info "Nginx logs:"
    docker compose -f $COMPOSE_FILE logs nginx_proxy | tail -20
fi

# Final status reporting
if [ $TEST_EXIT_CODE -eq 0 ]; then
    log_success "Authentication testing completed successfully!"
else
    log_error "Authentication testing completed with failures"
fi

echo "============================================================"
exit $TEST_EXIT_CODE