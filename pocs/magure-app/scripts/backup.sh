#!/bin/bash

# MagLabs Backup Script
# Usage: ./scripts/backup.sh [options]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BACKUP_TYPE="full"
RETENTION_DAYS=30
COMPRESS=true
UPLOAD_TO_S3=false
ENVIRONMENT="production"

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
  --type TYPE           Backup type: full, database, media (default: full)
  --retention DAYS      Retention period in days (default: 30)
  --no-compress         Don't compress backup files
  --upload-s3          Upload backup to S3
  --environment ENV    Environment: development, staging, production (default: production)
  --help               Show this help message

Examples:
  $0                                    # Full backup with default settings
  $0 --type database --retention 7     # Database backup with 7 days retention
  $0 --type media --upload-s3          # Media backup with S3 upload
EOF
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --no-compress)
                COMPRESS=false
                shift
                ;;
            --upload-s3)
                UPLOAD_TO_S3=true
                shift
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
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
    
    # Create backup directory
    mkdir -p postgres/backups
    mkdir -p backups/media
    mkdir -p backups/logs
    
    # Check S3 configuration if upload is requested
    if [[ "$UPLOAD_TO_S3" == "true" ]]; then
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

# Function to create database backup
backup_database() {
    print_info "Creating database backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="postgres/backups/db_backup_${timestamp}.sql"
    
    # Get database credentials from environment
    source .env
    
    # Create database dump
    docker-compose exec -T postgres pg_dump \
        -U "${DB_USER}" \
        -h localhost \
        -p 5432 \
        --verbose \
        --clean \
        --create \
        --if-exists \
        "${DB_NAME}" > "$backup_file"
    
    if [[ "$COMPRESS" == "true" ]]; then
        print_info "Compressing database backup..."
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
    fi
    
    # Calculate file size
    local file_size=$(du -h "$backup_file" | cut -f1)
    
    print_success "Database backup created: $backup_file ($file_size)"
    
    # Upload to S3 if requested
    if [[ "$UPLOAD_TO_S3" == "true" ]]; then
        upload_to_s3 "$backup_file" "database/"
    fi
    
    echo "$backup_file"
}

# Function to create media backup
backup_media() {
    print_info "Creating media backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backups/media/media_backup_${timestamp}.tar"
    
    # Check if media volume exists
    if ! docker volume ls | grep -q "maglabs.*media"; then
        print_warning "No media volume found to backup"
        return
    fi
    
    # Create media backup using temporary container
    docker run --rm \
        -v "$(docker volume ls -q | grep maglabs.*media | head -1)":/source:ro \
        -v "$(pwd)/backups/media":/backup \
        alpine:latest \
        tar -czf "/backup/media_backup_${timestamp}.tar.gz" -C /source .
    
    backup_file="backups/media/media_backup_${timestamp}.tar.gz"
    
    # Calculate file size
    local file_size=$(du -h "$backup_file" | cut -f1)
    
    print_success "Media backup created: $backup_file ($file_size)"
    
    # Upload to S3 if requested
    if [[ "$UPLOAD_TO_S3" == "true" ]]; then
        upload_to_s3 "$backup_file" "media/"
    fi
    
    echo "$backup_file"
}

# Function to create application logs backup
backup_logs() {
    print_info "Creating logs backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backups/logs/logs_backup_${timestamp}.tar.gz"
    
    # Create logs backup
    tar -czf "$backup_file" \
        backend/logs/ \
        nginx/logs/ \
        2>/dev/null || true
    
    if [[ -f "$backup_file" ]]; then
        local file_size=$(du -h "$backup_file" | cut -f1)
        print_success "Logs backup created: $backup_file ($file_size)"
        
        # Upload to S3 if requested
        if [[ "$UPLOAD_TO_S3" == "true" ]]; then
            upload_to_s3 "$backup_file" "logs/"
        fi
        
        echo "$backup_file"
    else
        print_warning "No logs found to backup"
    fi
}

# Function to upload file to S3
upload_to_s3() {
    local file_path="$1"
    local s3_prefix="$2"
    
    print_info "Uploading $file_path to S3..."
    
    local s3_key="${s3_prefix}$(basename "$file_path")"
    
    aws s3 cp "$file_path" "s3://${AWS_BACKUP_BUCKET}/${s3_key}" \
        --storage-class STANDARD_IA \
        --metadata "environment=${ENVIRONMENT},backup-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    print_success "Uploaded to s3://${AWS_BACKUP_BUCKET}/${s3_key}"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Cleanup local backups
    find postgres/backups/ -name "*.sql*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find backups/media/ -name "*.tar*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find backups/logs/ -name "*.tar*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Cleanup S3 backups if configured
    if [[ "$UPLOAD_TO_S3" == "true" ]] && command -v aws &> /dev/null; then
        print_info "Cleaning up S3 backups older than $RETENTION_DAYS days..."
        
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        
        aws s3api list-objects-v2 \
            --bucket "$AWS_BACKUP_BUCKET" \
            --query "Contents[?LastModified<='${cutoff_date}'].Key" \
            --output text | \
        while read -r key; do
            if [[ -n "$key" && "$key" != "None" ]]; then
                aws s3 rm "s3://${AWS_BACKUP_BUCKET}/${key}"
                print_info "Deleted old S3 backup: $key"
            fi
        done
    fi
    
    print_success "Cleanup completed"
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    print_info "Verifying backup integrity: $backup_file"
    
    case "$backup_file" in
        *.sql.gz)
            # Verify gzip integrity
            if gzip -t "$backup_file"; then
                print_success "Database backup integrity verified"
            else
                print_error "Database backup integrity check failed"
                return 1
            fi
            ;;
        *.sql)
            # Check if SQL file is valid
            if grep -q "PostgreSQL database dump" "$backup_file"; then
                print_success "Database backup integrity verified"
            else
                print_error "Database backup integrity check failed"
                return 1
            fi
            ;;
        *.tar.gz)
            # Verify tar.gz integrity
            if tar -tzf "$backup_file" &>/dev/null; then
                print_success "Archive backup integrity verified"
            else
                print_error "Archive backup integrity check failed"
                return 1
            fi
            ;;
    esac
}

# Function to create backup manifest
create_manifest() {
    local backup_files=("$@")
    local manifest_file="backups/backup_manifest_$(date +%Y%m%d_%H%M%S).json"
    
    print_info "Creating backup manifest..."
    
    cat > "$manifest_file" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "backup_type": "$BACKUP_TYPE",
  "files": [
EOF
    
    local first=true
    for file in "${backup_files[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$manifest_file"
        fi
        
        local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        local checksum=$(sha256sum "$file" | cut -d' ' -f1)
        
        cat >> "$manifest_file" << EOF
    {
      "path": "$file",
      "size": $size,
      "checksum": "$checksum"
    }EOF
    done
    
    cat >> "$manifest_file" << EOF

  ]
}
EOF
    
    print_success "Backup manifest created: $manifest_file"
}

# Main backup function
main() {
    print_info "Starting backup process (type: $BACKUP_TYPE)"
    
    # Parse command line arguments
    parse_args "$@"
    
    # Check prerequisites
    check_prerequisites
    
    # Array to store created backup files
    local backup_files=()
    
    # Perform backup based on type
    case "$BACKUP_TYPE" in
        "database")
            backup_files+=($(backup_database))
            ;;
        "media")
            backup_files+=($(backup_media))
            ;;
        "logs")
            backup_files+=($(backup_logs))
            ;;
        "full")
            backup_files+=($(backup_database))
            backup_files+=($(backup_media))
            backup_files+=($(backup_logs))
            ;;
        *)
            print_error "Invalid backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # Verify backup integrity
    for file in "${backup_files[@]}"; do
        if [[ -f "$file" ]]; then
            verify_backup "$file"
        fi
    done
    
    # Create backup manifest
    if [[ ${#backup_files[@]} -gt 0 ]]; then
        create_manifest "${backup_files[@]}"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    print_success "Backup process completed successfully!"
    
    # Show backup summary
    print_info "Backup summary:"
    for file in "${backup_files[@]}"; do
        if [[ -f "$file" ]]; then
            local size=$(du -h "$file" | cut -f1)
            print_info "  $file ($size)"
        fi
    done
}

# Handle script interruption
trap 'print_error "Backup interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"