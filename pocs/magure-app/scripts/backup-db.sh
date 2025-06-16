#!/bin/bash

# 💾 Database Backup Script for MagLabs
# Creates timestamped backups of the PostgreSQL database

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="maglabs_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Database configuration from environment
if [ -f ".env" ]; then
    source .env
elif [ -f ".env.ec2" ]; then
    source .env.ec2
else
    echo -e "${RED}❌ No environment file found!${NC}"
    exit 1
fi

# Ensure backup directory exists
mkdir -p ${BACKUP_DIR}

echo -e "${BLUE}💾 Starting database backup...${NC}"
echo "Database: ${DB_NAME:-maglabs_prod}"
echo "User: ${DB_USER:-maglabs_user}"
echo "Backup file: ${BACKUP_PATH}"

# Check if PostgreSQL container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ PostgreSQL container is not running!${NC}"
    exit 1
fi

# Create database backup
echo -e "${BLUE}📦 Creating backup...${NC}"
docker-compose exec -T postgres pg_dump \
    -U "${DB_USER:-maglabs_user}" \
    -d "${DB_NAME:-maglabs_prod}" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain > "${BACKUP_PATH}"

# Check if backup was successful
if [ $? -eq 0 ] && [ -s "${BACKUP_PATH}" ]; then
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo "File: ${BACKUP_PATH}"
    echo "Size: $(du -h "${BACKUP_PATH}" | cut -f1)"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    rm -f "${BACKUP_PATH}"
    exit 1
fi

# Compress backup for space efficiency
echo -e "${BLUE}🗜️ Compressing backup...${NC}"
gzip "${BACKUP_PATH}"
COMPRESSED_PATH="${BACKUP_PATH}.gz"

echo -e "${GREEN}✅ Backup compressed!${NC}"
echo "Compressed file: ${COMPRESSED_PATH}"
echo "Compressed size: $(du -h "${COMPRESSED_PATH}" | cut -f1)"

# Clean up old backups (keep last 7 days)
echo -e "${BLUE}🧹 Cleaning up old backups...${NC}"
find ${BACKUP_DIR} -name "maglabs_backup_*.sql.gz" -mtime +7 -delete
REMAINING_BACKUPS=$(find ${BACKUP_DIR} -name "maglabs_backup_*.sql.gz" | wc -l)
echo "Remaining backups: ${REMAINING_BACKUPS}"

# Show backup info
echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Backup Information:${NC}"
echo "File: ${COMPRESSED_PATH}"
echo "Database: ${DB_NAME:-maglabs_prod}"
echo "Timestamp: ${TIMESTAMP}"
echo "Size: $(du -h "${COMPRESSED_PATH}" | cut -f1)"
echo ""
echo -e "${BLUE}📝 To restore this backup:${NC}"
echo "1. Stop the application: docker-compose down"
echo "2. Start only postgres: docker-compose up -d postgres"
echo "3. Restore: gunzip -c ${COMPRESSED_PATH} | docker-compose exec -T postgres psql -U ${DB_USER:-maglabs_user}"
echo "4. Start application: docker-compose up -d"