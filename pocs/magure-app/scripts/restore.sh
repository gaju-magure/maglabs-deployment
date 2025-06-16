#!/bin/bash

# MagLabs Restore Script
# Usage: ./scripts/restore.sh [options]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RESTORE_TYPE="full"
BACKUP_FILE=""
FROM_S3=false
CONFIRM=false
ENVIRONMENT="development"

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
Usage: $0 [options]

Options:
  --type TYPE           Restore type: database, media, logs (default: database)
  --file FILE          Backup file to restore from
  --from-s3            Download backup from S3
  --confirm            Skip confirmation prompt
  --environment ENV    Environment: development, staging, production (default: development)
  --list-backups       List available backup files
  --help               Show this help message

Examples:
  $0 --list-backups                                    # List available backups
  $0 --type database --file backup_20240616_120000.sql.gz  # Restore database
  $0 --type media --from-s3 --file media_backup_20240616.tar.gz  # Restore media from S3
EOF
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                RESTORE_TYPE="$2"
                shift 2
                ;;
            --file)
                BACKUP_FILE="$2"
                shift 2
                ;;
            --from-s3)
                FROM_S3=true
                shift
                ;;
            --confirm)
                CONFIRM=true
                shift
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --list-backups)
                list_backups
                exit 0
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

# Function to list available backups
list_backups() {
    print_info "Available backup files:"
    
    echo
    print_info "Database backups:"
    if ls postgres/backups/*.sql* 1> /dev/null 2>&1; then
        for file in postgres/backups/*.sql*; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d. -f1)
            echo "  $(basename "$file") - $size - $date"
        done
    else
        echo "  No database backups found"
    fi
    
    echo
    print_info "Media backups:"
    if ls backups/media/*.tar* 1> /dev/null 2>&1; then
        for file in backups/media/*.tar*; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d. -f1)
            echo "  $(basename "$file") - $size - $date"
        done
    else
        echo "  No media backups found"
    fi
    
    echo
    print_info "Log backups:"
    if ls backups/logs/*.tar* 1> /dev/null 2>&1; then
        for file in backups/logs/*.tar*; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(stat -c %y "$file" | cut -d. -f1)
            echo "  $(basename "$file") - $size - $date"
        done
    else
        echo "  No log backups found"
    fi
    
    # List S3 backups if configured
    if command -v aws &> /dev/null && [[ -n "$AWS_BACKUP_BUCKET" ]]; then
        echo
        print_info "S3 backups:"
        aws s3 ls "s3://${AWS_BACKUP_BUCKET}/" --recursive --human-readable | grep -E '\.(sql|tar)' || echo "  No S3 backups found"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if services are running
    if ! docker-compose ps | grep -q "Up"; then
        print_error "No running services found. Please start the application first."
        exit 1
    fi
    
    # Check if backup file is specified
    if [[ -z "$BACKUP_FILE" ]]; then
        print_error "Backup file not specified. Use --file option or --list-backups to see available files."
        exit 1
    fi
    
    # Check S3 configuration if downloading from S3
    if [[ "$FROM_S3" == "true" ]]; then
        if ! command -v aws &> /dev/null; then
            print_error "AWS CLI is not installed"
            exit 1
        fi
        
        if [[ -z "$AWS_BACKUP_BUCKET" ]]; then
            print_error "AWS_BACKUP_BUCKET environment variable is not set"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed"
}

# Function to download backup from S3
download_from_s3() {
    local s3_key="$1"
    local local_file="$2"
    
    print_info "Downloading backup from S3..."
    
    # Determine S3 prefix based on restore type
    local s3_prefix=""
    case "$RESTORE_TYPE" in
        database)
            s3_prefix="database/"
            ;;
        media)
            s3_prefix="media/"
            ;;
        logs)
            s3_prefix="logs/"
            ;;
    esac
    
    aws s3 cp "s3://${AWS_BACKUP_BUCKET}/${s3_prefix}${s3_key}" "$local_file"
    
    print_success "Downloaded backup from S3"
}

# Function to confirm restore operation
confirm_restore() {
    if [[ "$CONFIRM" == "true" ]]; then
        return 0
    fi
    
    print_warning "This will restore data from backup and may overwrite existing data!"
    print_warning "Environment: $ENVIRONMENT"
    print_warning "Restore type: $RESTORE_TYPE"
    print_warning "Backup file: $BACKUP_FILE"
    
    echo
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Restore cancelled by user"
        exit 0
    fi
}

# Function to create pre-restore backup
create_pre_restore_backup() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        print_info "Creating pre-restore backup for safety..."
        
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_file="postgres/backups/pre_restore_backup_${timestamp}.sql"
        
        # Get database credentials from environment
        source .env
        
        # Create database dump
        docker-compose exec -T postgres pg_dump \
            -U "${DB_USER}" \
            -h localhost \
            -p 5432 \
            --verbose \
            "${DB_NAME}" > "$backup_file"
        
        gzip "$backup_file"
        
        print_success "Pre-restore backup created: ${backup_file}.gz"
    fi
}

# Function to restore database
restore_database() {
    local backup_file="$1"
    
    print_info "Restoring database from: $backup_file"
    
    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Get database credentials from environment
    source .env
    
    # Stop backend services temporarily
    print_info "Stopping backend services..."
    docker-compose stop backend 2>/dev/null || true
    
    # Prepare database for restore
    print_info "Preparing database for restore..."
    
    # Create a temporary restore script
    cat > /tmp/restore_db.sh << EOF
#!/bin/bash
set -e

# Drop existing database connections
psql -U ${DB_USER} -h postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" || true

# Drop and recreate database
dropdb -U ${DB_USER} -h postgres --if-exists ${DB_NAME} || true
createdb -U ${DB_USER} -h postgres ${DB_NAME}
EOF
    
    chmod +x /tmp/restore_db.sh
    
    # Execute restore preparation
    docker-compose exec -T postgres bash < /tmp/restore_db.sh
    
    # Restore database
    if [[ "$backup_file" == *.gz ]]; then
        print_info "Decompressing and restoring database..."
        gunzip -c "$backup_file" | docker-compose exec -T postgres psql -U "${DB_USER}" -h localhost "${DB_NAME}"
    else
        print_info "Restoring database..."
        docker-compose exec -T postgres psql -U "${DB_USER}" -h localhost "${DB_NAME}" < "$backup_file"
    fi
    
    # Run migrations to ensure schema is up to date
    print_info "Running migrations..."
    docker-compose exec -T postgres psql -U "${DB_USER}" -h localhost "${DB_NAME}" -c "SELECT 1;" > /dev/null
    
    # Start backend services
    print_info "Starting backend services..."
    docker-compose start backend 2>/dev/null || true
    
    # Clean up
    rm -f /tmp/restore_db.sh
    
    print_success "Database restore completed"
}

# Function to restore media files
restore_media() {
    local backup_file="$1"
    
    print_info "Restoring media files from: $backup_file"
    
    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Get media volume name
    local media_volume=$(docker volume ls -q | grep maglabs.*media | head -1)
    
    if [[ -z "$media_volume" ]]; then
        print_error "No media volume found"
        exit 1
    fi
    
    # Create temporary restore directory
    local temp_dir="/tmp/media_restore_$$"
    mkdir -p "$temp_dir"
    
    # Extract backup
    print_info "Extracting media backup..."
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Restore media files using temporary container
    print_info "Restoring media files to volume..."
    docker run --rm \
        -v "$temp_dir":/source:ro \
        -v "$media_volume":/target \
        alpine:latest \
        sh -c "rm -rf /target/* && cp -r /source/* /target/"
    
    # Clean up
    rm -rf "$temp_dir"
    
    print_success "Media restore completed"
}

# Function to restore logs
restore_logs() {
    local backup_file="$1"
    
    print_info "Restoring logs from: $backup_file"
    
    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Create backup of current logs
    local timestamp=$(date +%Y%m%d_%H%M%S)
    if [[ -d "backend/logs" ]] || [[ -d "nginx/logs" ]]; then
        print_info "Backing up current logs..."
        tar -czf "backups/logs/current_logs_backup_${timestamp}.tar.gz" \
            backend/logs/ nginx/logs/ 2>/dev/null || true
    fi
    
    # Extract log backup
    print_info "Extracting log backup..."
    tar -xzf "$backup_file"
    
    print_success "Log restore completed"
}

# Function to verify restore
verify_restore() {
    print_info "Verifying restore operation..."
    
    case "$RESTORE_TYPE" in
        database)
            # Check if database is accessible
            if docker-compose exec -T postgres psql -U "${DB_USER:-maglabs}" -h localhost "${DB_NAME:-maglabs}" -c "SELECT 1;" > /dev/null 2>&1; then
                print_success "Database verification passed"
            else
                print_error "Database verification failed"
                return 1
            fi
            ;;
        media)
            # Check if media volume has content
            local media_volume=$(docker volume ls -q | grep maglabs.*media | head -1)
            if [[ -n "$media_volume" ]]; then
                local file_count=$(docker run --rm -v "$media_volume":/check alpine:latest find /check -type f | wc -l)
                print_success "Media verification passed (${file_count} files found)"
            else
                print_warning "Media volume not found"
            fi
            ;;
        logs)
            # Check if log directories exist
            if [[ -d "backend/logs" ]] || [[ -d "nginx/logs" ]]; then
                print_success "Log verification passed"
            else
                print_warning "Log directories not found"
            fi
            ;;
    esac
}

# Main restore function
main() {
    print_info "Starting restore process (type: $RESTORE_TYPE)"
    
    # Parse command line arguments
    parse_args "$@"
    
    # Check prerequisites
    check_prerequisites
    
    # Confirm restore operation
    confirm_restore
    
    # Determine backup file path
    local restore_file="$BACKUP_FILE"
    
    # Download from S3 if requested
    if [[ "$FROM_S3" == "true" ]]; then
        local temp_file="/tmp/$(basename "$BACKUP_FILE")"
        download_from_s3 "$BACKUP_FILE" "$temp_file"
        restore_file="$temp_file"
    else
        # Find local backup file
        case "$RESTORE_TYPE" in
            database)
                if [[ -f "postgres/backups/$BACKUP_FILE" ]]; then
                    restore_file="postgres/backups/$BACKUP_FILE"
                fi
                ;;
            media)
                if [[ -f "backups/media/$BACKUP_FILE" ]]; then
                    restore_file="backups/media/$BACKUP_FILE"
                fi
                ;;
            logs)
                if [[ -f "backups/logs/$BACKUP_FILE" ]]; then
                    restore_file="backups/logs/$BACKUP_FILE"
                fi
                ;;
        esac
    fi
    
    # Create pre-restore backup for production
    create_pre_restore_backup
    
    # Perform restore based on type
    case "$RESTORE_TYPE" in
        database)
            restore_database "$restore_file"
            ;;
        media)
            restore_media "$restore_file"
            ;;
        logs)
            restore_logs "$restore_file"
            ;;
        *)
            print_error "Invalid restore type: $RESTORE_TYPE"
            exit 1
            ;;
    esac
    
    # Verify restore
    verify_restore
    
    # Clean up temporary file if downloaded from S3
    if [[ "$FROM_S3" == "true" ]] && [[ -f "$restore_file" ]]; then
        rm -f "$restore_file"
    fi
    
    print_success "Restore process completed successfully!"
    
    # Show post-restore instructions
    case "$RESTORE_TYPE" in
        database)
            print_info "Post-restore recommendations:"
            print_info "  1. Verify application functionality"
            print_info "  2. Check user accounts and permissions"
            print_info "  3. Validate tenant data integrity"
            ;;
        media)
            print_info "Post-restore recommendations:"
            print_info "  1. Verify media files are accessible"
            print_info "  2. Check file permissions"
            ;;
    esac
}

# Handle script interruption
trap 'print_error "Restore interrupted"; exit 1' INT TERM

# Load environment variables
if [[ -f ".env" ]]; then
    source .env
fi

# Run main function with all arguments
main "$@"