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

# Check if environment file exists and is configured
if [ ! -f ".env.ec2" ]; then
    echo -e "${YELLOW}⚠️ .env.ec2 file not found!${NC}"
    echo "Running configuration setup..."
    ./configure-ec2.sh
elif grep -q "your-secure-database-password-here\|your-domain.com\|your-very-long-secret-key" ".env.ec2"; then
    echo -e "${YELLOW}⚠️ .env.ec2 has placeholder values!${NC}"
    echo "Running configuration setup..."
    ./configure-ec2.sh
fi

# Verify configuration was successful
if [ ! -f ".env.ec2" ] || grep -q "your-secure-database-password-here\|your-domain.com\|your-very-long-secret-key" ".env.ec2"; then
    echo -e "${RED}❌ Configuration incomplete!${NC}"
    echo "Please run: ./configure-ec2.sh"
    exit 1
fi

# Copy environment file
echo -e "${BLUE}📋 Setting up environment...${NC}"
cp .env.ec2 .env

# Source environment to get configuration values
source .env

# Create data directories if they don't exist
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p postgres-data backups logs backend-static backend-media certbot/conf certbot/www postgres/init
sudo chown -R $USER:$USER postgres-data backups logs backend-static backend-media certbot postgres || true

# Update database password in initialization script
echo -e "${BLUE}🔐 Updating database configuration...${NC}"
sed -i "s/placeholder_password/${DB_PASSWORD}/g" postgres/init/01-init-database.sql

# Choose nginx configuration based on domain type
echo -e "${BLUE}🌐 Configuring nginx...${NC}"
if [ "${USE_CUSTOM_DOMAIN}" = "true" ]; then
    echo "Using domain-based nginx configuration for: ${DOMAIN_NAME}"
    # Use the domain-based config and substitute variables
    envsubst '${DOMAIN_NAME}' < nginx/conf.d/ec2.conf > /tmp/nginx-ec2.conf
    cp /tmp/nginx-ec2.conf nginx/conf.d/default.conf
else
    echo "Using IP-based nginx configuration for: ${DOMAIN_NAME}"
    # Use the simple IP-based config
    cp nginx/conf.d/ec2-ip.conf nginx/conf.d/default.conf
fi

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

# Wait for database to be fully ready
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${BLUE}🗃️ Running database migrations...${NC}"
docker-compose exec -T backend python manage.py migrate

# Create Django superuser if it doesn't exist
echo -e "${BLUE}👤 Setting up Django superuser...${NC}"
docker-compose exec -T backend python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@localhost', 'admin123')
    print("Created superuser: admin/admin123")
else:
    print("Superuser already exists")
EOF
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

# Source environment again to get latest values
source .env

if [ "${USE_CUSTOM_DOMAIN}" = "true" ]; then
    if [ "${SSL_ENABLED}" = "true" ]; then
        echo "🌍 Main Site: https://${DOMAIN_NAME}/"
        echo "🔌 API: https://api.${DOMAIN_NAME}/api/"
        echo "⚙️ Admin: https://admin.${DOMAIN_NAME}/"
        echo ""
        echo -e "${YELLOW}💡 SSL Setup Required:${NC}"
        echo "Run: sudo certbot --nginx -d ${DOMAIN_NAME} -d *.${DOMAIN_NAME}"
    else
        echo "🌍 Main Site: http://${DOMAIN_NAME}/"
        echo "🔌 API: http://${DOMAIN_NAME}/api/"
        echo "⚙️ Admin: http://${DOMAIN_NAME}/admin/"
    fi
else
    echo "🌍 Main Site: http://${DOMAIN_NAME}/"
    echo "🔌 API: http://${DOMAIN_NAME}/api/"
    echo "⚙️ Admin: http://${DOMAIN_NAME}/admin/"
fi

echo ""
echo -e "${BLUE}👤 Default Admin Login:${NC}"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "View logs: docker-compose logs [service_name]"
echo "Restart services: docker-compose restart"
echo "Stop services: docker-compose down"
echo "Update deployment: ./deploy-ec2.sh"
echo "Backup database: ./scripts/backup-db.sh"
