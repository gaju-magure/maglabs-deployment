#!/bin/bash

# MagLabs Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]
# Environments: development, staging, production, aws

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
FORCE_REBUILD=false
SKIP_MIGRATION=false
SKIP_HEALTH_CHECK=false
VERBOSE=false

# Function to print colored output
print_info() {
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

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [environment] [options]

Environments:
  development    Deploy to local development environment
  staging        Deploy to staging environment
  production     Deploy to production environment
  aws           Deploy to AWS ECS environment

Options:
  --force-rebuild    Force rebuild of all Docker images
  --skip-migration   Skip database migrations
  --skip-health      Skip health checks
  --verbose         Enable verbose output
  --help            Show this help message

Examples:
  $0 development
  $0 production --force-rebuild
  $0 aws --skip-migration --verbose
EOF
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            development|staging|production|aws)
                ENVIRONMENT="$1"
                shift
                ;;
            --force-rebuild)
                FORCE_REBUILD=true
                shift
                ;;
            --skip-migration)
                SKIP_MIGRATION=true
                shift
                ;;
            --skip-health)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        print_error "Environment file .env.${ENVIRONMENT} not found"
        print_info "Please copy from .env.${ENVIRONMENT} and configure it"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to prepare environment
prepare_environment() {
    print_info "Preparing environment: $ENVIRONMENT"
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" .env
    
    # Create necessary directories
    mkdir -p nginx/logs
    mkdir -p backend/logs
    mkdir -p postgres/backups
    
    # Set appropriate permissions
    chmod +x backend/docker-entrypoint.sh
    
    print_success "Environment prepared"
}

# Function to build images
build_images() {
    print_info "Building Docker images..."
    
    local build_args=""
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        build_args="--no-cache"
    fi
    
    case $ENVIRONMENT in
        development)
            docker-compose build $build_args
            ;;
        staging|production)
            docker-compose -f docker-compose.yml -f docker-compose.production.yml build $build_args
            ;;
        aws)
            docker-compose -f docker-compose.yml -f docker-compose.aws.yml build $build_args
            ;;
    esac
    
    print_success "Images built successfully"
}

# Function to start services
start_services() {
    print_info "Starting services..."
    
    case $ENVIRONMENT in
        development)
            docker-compose up -d
            ;;
        staging|production)
            docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
            ;;
        aws)
            docker-compose -f docker-compose.yml -f docker-compose.aws.yml up -d
            ;;
    esac
    
    print_success "Services started"
}

# Function to run migrations
run_migrations() {
    if [[ "$SKIP_MIGRATION" == "true" ]]; then
        print_warning "Skipping database migrations"
        return
    fi
    
    print_info "Running database migrations..."
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    docker-compose exec -T backend python manage.py migrate_schemas --shared
    docker-compose exec -T backend python manage.py migrate_schemas
    
    print_success "Database migrations completed"
}

# Function to collect static files
collect_static() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        return
    fi
    
    print_info "Collecting static files..."
    docker-compose exec -T backend python manage.py collectstatic --noinput
    print_success "Static files collected"
}

# Function to run health checks
run_health_checks() {
    if [[ "$SKIP_HEALTH_CHECK" == "true" ]]; then
        print_warning "Skipping health checks"
        return
    fi
    
    print_info "Running health checks..."
    
    # Wait for services to be fully ready
    sleep 30
    
    # Check backend health
    if ! docker-compose exec -T backend curl -f http://localhost:8000/health/ &> /dev/null; then
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if ! docker-compose exec -T frontend curl -f http://localhost:3000/health &> /dev/null; then
        print_error "Frontend health check failed"
        return 1
    fi
    
    # Check nginx health
    if ! docker-compose exec -T nginx curl -f http://localhost/health &> /dev/null; then
        print_error "Nginx health check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Function to show deployment status
show_status() {
    print_info "Deployment status:"
    docker-compose ps
    
    print_info "Service logs (last 10 lines):"
    docker-compose logs --tail=10
}

# Function to create backup (for production)
create_backup() {
    if [[ "$ENVIRONMENT" != "production" ]]; then
        return
    fi
    
    print_info "Creating backup before deployment..."
    
    # Create database backup
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U ${DB_USER:-maglabs_prod} ${DB_NAME:-maglabs_prod} > "postgres/backups/$BACKUP_FILE"
    
    print_success "Backup created: $BACKUP_FILE"
}

# Function to cleanup old images
cleanup() {
    print_info "Cleaning up old Docker images..."
    docker image prune -f
    docker volume prune -f
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    print_info "Starting deployment to $ENVIRONMENT environment"
    
    # Parse command line arguments
    parse_args "$@"
    
    # Run deployment steps
    check_prerequisites
    prepare_environment
    create_backup
    build_images
    start_services
    run_migrations
    collect_static
    run_health_checks
    show_status
    cleanup
    
    print_success "Deployment to $ENVIRONMENT completed successfully!"
    
    # Show access information
    case $ENVIRONMENT in
        development)
            print_info "Access your application at:"
            print_info "  Frontend: http://tenant1.maglabs.local"
            print_info "  API: http://tenant1.maglabs.api/api/"
            print_info "  Admin: http://tenant1.maglabs.api/admin/"
            ;;
        staging)
            print_info "Access your staging application at:"
            print_info "  Frontend: https://tenant1.staging.yourdomain.com"
            print_info "  API: https://tenant1.staging.yourdomain.com/api/"
            ;;
        production)
            print_info "Access your production application at:"
            print_info "  Frontend: https://tenant1.yourdomain.com"
            print_info "  API: https://tenant1.yourdomain.com/api/"
            ;;
    esac
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"