#!/bin/bash

# 🚀 Simple EC2 Deployment Script for MagLabs
# This script deploys the application to an EC2 instance

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying MagLabs to EC2...${NC}"

# Check if environment file exists
if [ ! -f ".env.ec2" ]; then
    echo -e "${RED}❌ .env.ec2 file not found!${NC}"
    echo "Please create .env.ec2 with your EC2 configuration"
    exit 1
fi

# Copy environment file
echo -e "${BLUE}📋 Setting up environment...${NC}"
cp .env.ec2 .env

# Create data directories if they don't exist
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p postgres-data backups logs backend-static backend-media certbot/conf certbot/www
sudo chown -R $USER:$USER postgres-data backups logs backend-static backend-media certbot || true

# Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo -e "${BLUE}📥 Pulling latest changes...${NC}"
    git pull origin main || echo -e "${YELLOW}⚠️ Git pull failed or not on main branch${NC}"
fi

# Backup database before deployment (if postgres is running)
echo -e "${BLUE}💾 Backing up database...${NC}"
if docker-compose ps postgres | grep -q "Up"; then
    ./scripts/backup-db.sh || echo -e "${YELLOW}⚠️ Backup failed or script not found, continuing...${NC}"
else
    echo -e "${YELLOW}⚠️ PostgreSQL not running, skipping backup${NC}"
fi

# Stop existing services
echo -e "${BLUE}🛑 Stopping existing services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.ec2.yml down || true

# Remove old images (optional, saves space)
echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
docker image prune -f || true

# Build and start services
echo -e "${BLUE}🏗️ Building and starting services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.ec2.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.ec2.yml up -d

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

# Run database migrations
echo -e "${BLUE}🗃️ Running database migrations...${NC}"
docker-compose exec -T backend python manage.py migrate

# Collect static files
echo -e "${BLUE}📦 Collecting static files...${NC}"
docker-compose exec -T backend python manage.py collectstatic --noinput

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    docker-compose logs --tail=20
    exit 1
fi

# Show service status
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose ps

# Show access information
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/"
echo "API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/"
echo "Admin: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/admin/"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "View logs: docker-compose logs [service_name]"
echo "Restart services: docker-compose restart"
echo "Stop services: docker-compose down"
echo "Update deployment: ./deploy-ec2.sh"