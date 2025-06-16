# MagLabs Multi-Tenant Deployment Guide

This guide provides comprehensive instructions for deploying the MagLabs multi-tenant application using Docker Compose with proper domain routing on AWS and other environments.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Domain Setup](#domain-setup)
5. [Deployment Commands](#deployment-commands)
6. [AWS Deployment](#aws-deployment)
7. [Multi-Tenant Configuration](#multi-tenant-configuration)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Backup & Restore](#backup--restore)
10. [Monitoring & Logging](#monitoring--logging)
11. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Git
- 4GB+ RAM for development, 8GB+ for production

### Development Tools (Optional)
- AWS CLI (for AWS deployment)
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Domain Requirements
- **Development**: `*.maglabs.local` domains configured in `/etc/hosts`
- **Production**: Wildcard SSL certificate for `*.yourdomain.com`
- **AWS**: Route53 hosted zone for domain management

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd pocs/magure-app
```

### 2. Configure Environment
```bash
# Copy environment file
cp .env.development .env

# Edit configuration (see Environment Configuration section)
nano .env
```

### 3. Setup Local Domains (Development)
Add to `/etc/hosts`:
```
127.0.0.1 tenant1.maglabs.local
127.0.0.1 tenant2.maglabs.local
127.0.0.1 demo.maglabs.local
127.0.0.1 tenant1.maglabs.api
127.0.0.1 tenant2.maglabs.api
127.0.0.1 demo.maglabs.api
```

### 4. Deploy
```bash
# Development deployment
./scripts/deploy.sh development

# Production deployment
./scripts/deploy.sh production
```

### 5. Access Application
- **Frontend**: http://tenant1.maglabs.local
- **API**: http://tenant1.maglabs.api/api/
- **Admin**: http://tenant1.maglabs.api/admin/

## ⚙️ Environment Configuration

### Available Environment Files

| File | Purpose | Usage |
|------|---------|-------|
| `.env.development` | Local development | `cp .env.development .env` |
| `.env.staging` | Staging environment | For staging deployments |
| `.env.production` | Production environment | For production deployments |

### Key Configuration Variables

#### Database Settings
```bash
DB_NAME=maglabs
DB_USER=maglabs
DB_PASSWORD=your-secure-password
DB_HOST=postgres  # or AWS RDS endpoint
DB_PORT=5432
```

#### Multi-Tenant Domains
```bash
# Development
ALLOWED_HOSTS=localhost,127.0.0.1,*.maglabs.local,*.maglabs.api
CORS_ALLOWED_ORIGINS=http://*.maglabs.local

# Production
ALLOWED_HOSTS=yourdomain.com,*.yourdomain.com
CORS_ALLOWED_ORIGINS=https://*.yourdomain.com
```

#### MagLabs API Integration
```bash
MAGLABS_API_URL=https://api.maglabs.com
MAGLABS_API_KEY=your-api-key
```

#### AWS Configuration (Production)
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-s3-bucket
AWS_S3_REGION_NAME=us-east-1
USE_S3=true
```

## 🌐 Domain Setup

### Development Setup

#### Method 1: /etc/hosts (Linux/Mac)
```bash
sudo bash -c 'cat >> /etc/hosts << EOF
127.0.0.1 tenant1.maglabs.local
127.0.0.1 tenant2.maglabs.local
127.0.0.1 demo.maglabs.local
127.0.0.1 tenant1.maglabs.api
127.0.0.1 tenant2.maglabs.api
127.0.0.1 demo.maglabs.api
EOF'
```

#### Method 2: dnsmasq (Mac)
```bash
# Install dnsmasq
brew install dnsmasq

# Configure wildcard domains
echo 'address=/.maglabs.local/127.0.0.1' >> /opt/homebrew/etc/dnsmasq.conf
echo 'address=/.maglabs.api/127.0.0.1' >> /opt/homebrew/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq

# Configure macOS to use dnsmasq
sudo mkdir -p /etc/resolver
echo 'nameserver 127.0.0.1' | sudo tee /etc/resolver/maglabs.local
echo 'nameserver 127.0.0.1' | sudo tee /etc/resolver/maglabs.api
```

### Production Setup

#### DNS Configuration
1. Create wildcard A record: `*.yourdomain.com → your-server-ip`
2. Create wildcard CNAME for API: `*.api.yourdomain.com → yourdomain.com`

#### SSL Certificate
```bash
# Using Let's Encrypt with Certbot
certbot certonly --dns-route53 -d '*.yourdomain.com'

# Copy certificates to nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/yourdomain.com.crt
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/yourdomain.com.key
```

## 🚢 Deployment Commands

### Using Deployment Script

#### Basic Deployment
```bash
# Development
./scripts/deploy.sh development

# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh production

# AWS
./scripts/deploy.sh aws
```

#### Advanced Options
```bash
# Force rebuild all images
./scripts/deploy.sh production --force-rebuild

# Skip database migrations
./scripts/deploy.sh production --skip-migration

# Skip health checks
./scripts/deploy.sh production --skip-health

# Verbose output
./scripts/deploy.sh production --verbose
```

### Manual Docker Compose

#### Development
```bash
docker-compose up -d
```

#### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

#### AWS
```bash
docker-compose -f docker-compose.yml -f docker-compose.aws.yml up -d
```

## ☁️ AWS Deployment

### Architecture Overview
```
Internet → Route53 → ALB → ECS Tasks
                      ↓
                     RDS
                      ↓
                   S3 + CloudFront
```

### Prerequisites

#### 1. AWS Infrastructure
```bash
# Create VPC, subnets, security groups
# Setup RDS PostgreSQL instance
# Create ECS cluster
# Setup Application Load Balancer
# Configure Route53 hosted zone
```

#### 2. Environment Variables
Update `.env.production` with AWS endpoints:
```bash
# RDS Database
AWS_RDS_HOST=your-rds-endpoint.rds.amazonaws.com
AWS_RDS_DB_NAME=maglabs_prod
AWS_RDS_USERNAME=maglabs_prod
AWS_RDS_PASSWORD=your-rds-password

# S3 Storage
AWS_STORAGE_BUCKET_NAME=your-s3-bucket
AWS_CLOUDFRONT_DOMAIN=cdn.yourdomain.com
```

### Deployment Steps

#### 1. Build and Push Images
```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.aws.yml build

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

docker tag maglabs-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest
```

#### 2. Deploy to ECS
```bash
# Update ECS service
aws ecs update-service --cluster maglabs-production --service backend --force-new-deployment
aws ecs update-service --cluster maglabs-production --service frontend --force-new-deployment
```

#### 3. Configure ALB
- Target groups for backend (port 8000) and frontend (port 3000)
- Host-based routing rules for multi-tenant domains
- SSL certificate from ACM

## 🏢 Multi-Tenant Configuration

### Django Multi-Tenant Setup

#### 1. Tenant Model
The application uses django-tenants for schema-based multi-tenancy:
- Each tenant gets its own database schema
- Shared apps store global data
- Tenant-specific apps store isolated data

#### 2. Domain Routing
Nginx extracts tenant name from subdomain:
```nginx
# Extract tenant from subdomain
map $host $tenant_name {
    ~^(?<tenant>[^.]+)\.yourdomain\.com$ $tenant;
    default "public";
}

# Set tenant header for Django
proxy_set_header X-Tenant-Name $tenant_name;
```

#### 3. Tenant Creation
```bash
# Create new tenant via Django admin
docker-compose exec backend python manage.py shell << EOF
from django_tenants.models import TenantMixin
from apps.tenants.models import Tenant

tenant = Tenant(
    domain_url='newtenant.yourdomain.com',
    schema_name='newtenant',
    name='New Tenant'
)
tenant.save()
EOF
```

### Adding New Tenants

#### 1. DNS Configuration
Add DNS record: `newtenant.yourdomain.com → your-server-ip`

#### 2. Database Schema
```bash
# Create tenant schema
docker-compose exec backend python manage.py migrate_schemas --tenant=newtenant
```

#### 3. Nginx Configuration
The nginx configuration automatically handles new subdomains through wildcard matching.

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Frontend CI/CD (`.github/workflows/frontend-ci-cd.yml`)
- **Triggers**: Push to main/develop/staging, PRs
- **Jobs**: Test → Build → Security Scan → Deploy
- **Environments**: Development, Staging, Production

#### 2. Backend CI/CD (`.github/workflows/backend-ci-cd.yml`)
- **Triggers**: Push to main/develop/staging, PRs
- **Jobs**: Test → Lint → Security → Migration Check → Deploy
- **Features**: Coverage reporting, migration validation

#### 3. Infrastructure (`.github/workflows/infrastructure.yml`)
- **Triggers**: Infrastructure changes, manual dispatch
- **Jobs**: Validate configs → Security scan → Deploy
- **Features**: Docker Compose validation, Nginx config testing

### Deployment Environments

#### Development
- **Trigger**: Push to `develop` branch
- **Target**: Development environment
- **Auto-deploy**: Yes

#### Staging
- **Trigger**: Push to `staging` branch
- **Target**: Staging environment
- **Manual approval**: Optional

#### Production
- **Trigger**: Push to `main` branch
- **Target**: Production environment
- **Manual approval**: Required

### Required Secrets

#### GitHub Repository Secrets
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
SLACK_WEBHOOK=your-slack-webhook-url
```

#### Environment-Specific Secrets
```bash
# Production
SECRET_KEY=production-secret-key
DB_PASSWORD=production-db-password
MAGLABS_API_KEY=production-api-key

# Staging
STAGING_SECRET_KEY=staging-secret-key
STAGING_DB_PASSWORD=staging-db-password
```

## 💾 Backup & Restore

### Backup Operations

#### Automated Backup Script
```bash
# Full backup (database + media + logs)
./scripts/backup.sh

# Database only
./scripts/backup.sh --type database

# Upload to S3
./scripts/backup.sh --upload-s3

# Custom retention
./scripts/backup.sh --retention 7
```

#### Scheduled Backups
Add to crontab:
```bash
# Daily full backup at 2 AM
0 2 * * * cd /path/to/maglabs && ./scripts/backup.sh --upload-s3

# Hourly database backup during business hours
0 9-17 * * 1-5 cd /path/to/maglabs && ./scripts/backup.sh --type database
```

### Restore Operations

#### List Available Backups
```bash
./scripts/restore.sh --list-backups
```

#### Restore Database
```bash
# From local backup
./scripts/restore.sh --type database --file backup_20240616_120000.sql.gz

# From S3
./scripts/restore.sh --type database --from-s3 --file backup_20240616_120000.sql.gz

# Skip confirmation
./scripts/restore.sh --type database --file backup.sql.gz --confirm
```

#### Restore Media Files
```bash
./scripts/restore.sh --type media --file media_backup_20240616.tar.gz
```

### Backup Storage

#### Local Storage Structure
```
postgres/backups/          # Database backups
├── db_backup_20240616_120000.sql.gz
└── pre_restore_backup_20240616_140000.sql.gz

backups/media/             # Media file backups
├── media_backup_20240616_120000.tar.gz
└── media_backup_20240615_120000.tar.gz

backups/logs/              # Application log backups
├── logs_backup_20240616_120000.tar.gz
└── backup_manifest_20240616_120000.json
```

#### S3 Storage Structure
```
s3://your-backup-bucket/
├── database/
│   ├── db_backup_20240616_120000.sql.gz
│   └── db_backup_20240615_120000.sql.gz
├── media/
│   ├── media_backup_20240616_120000.tar.gz
│   └── media_backup_20240615_120000.tar.gz
└── logs/
    ├── logs_backup_20240616_120000.tar.gz
    └── logs_backup_20240615_120000.tar.gz
```

## 📊 Monitoring & Logging

### Application Monitoring

#### Health Checks
- **Nginx**: `http://your-domain/health`
- **Backend**: `http://your-domain/api/health/`
- **Frontend**: `http://your-domain/frontend-health`

#### Service Status
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend
docker-compose logs --tail=100 nginx

# Follow logs in real-time
docker-compose logs -f
```

### Log Management

#### Log Locations
```
backend/logs/
├── gunicorn-access.log      # HTTP access logs
└── gunicorn-error.log       # Application errors

nginx/logs/
├── access.log               # Nginx access logs
└── error.log                # Nginx error logs
```

#### Log Rotation
```bash
# Configure logrotate for log management
sudo nano /etc/logrotate.d/maglabs

/path/to/maglabs/*/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
    create 644 root root
}
```

### AWS CloudWatch Integration

#### Log Streams (for ECS deployment)
- `/ecs/maglabs-backend`
- `/ecs/maglabs-frontend`
- `/ecs/maglabs-nginx`

#### Custom Metrics
```bash
# Application metrics
aws logs put-metric-filter \
    --log-group-name "/ecs/maglabs-backend" \
    --filter-name "error-count" \
    --filter-pattern "ERROR" \
    --metric-transformations \
        metricName=ErrorCount,metricNamespace=MagLabs,metricValue=1
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Errors
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER pocs/magure-app/
chmod +x scripts/*.sh
```

#### 2. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

#### 3. Database Connection Issues
```bash
# Check database container
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U maglabs -d maglabs -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose exec backend python manage.py migrate_schemas --shared
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/yourdomain.com.crt -text -noout

# Test SSL configuration
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

#### 5. Multi-Tenant Routing Issues
```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# Test tenant extraction
curl -H "Host: tenant1.yourdomain.com" http://localhost/api/health/

# Check tenant headers in logs
docker-compose logs nginx | grep "X-Tenant-Name"
```

### Debug Mode

#### Enable Debug Logging
```bash
# Update environment
echo "LOG_LEVEL=DEBUG" >> .env

# Restart services
docker-compose restart backend

# View debug logs
docker-compose logs -f backend | grep DEBUG
```

#### Django Debug
```bash
# Enable Django debug mode (development only)
echo "DEBUG=true" >> .env

# Access Django shell
docker-compose exec backend python manage.py shell

# Check tenant schemas
docker-compose exec backend python manage.py list_schemas
```

### Performance Tuning

#### Database Optimization
```bash
# Analyze slow queries
docker-compose exec postgres psql -U maglabs -d maglabs -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# Optimize database settings
# Edit docker-compose.production.yml postgres command
```

#### Resource Monitoring
```bash
# Monitor container resources
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 📚 Additional Resources

### Documentation Links
- [Django Multi-Tenant Documentation](https://django-tenants.readthedocs.io/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)

### Support Contacts
- **Development Team**: dev-team@yourdomain.com
- **DevOps Team**: devops@yourdomain.com
- **Emergency Contact**: emergency@yourdomain.com

### Version Information
- **Docker Compose Version**: 3.8
- **Python Version**: 3.11
- **Node.js Version**: 18
- **PostgreSQL Version**: 15
- **Nginx Version**: Alpine

---

## 🎉 Deployment Complete!

Your MagLabs multi-tenant application is now ready for deployment. Follow the quick start guide for immediate setup, or refer to specific sections for advanced configuration.

For support, please check the troubleshooting section or contact the development team.