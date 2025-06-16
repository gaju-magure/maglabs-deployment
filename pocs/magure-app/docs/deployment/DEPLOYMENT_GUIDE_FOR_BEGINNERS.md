# 🚀 Complete Deployment Guide for Beginners

This guide will walk you through deploying your MagLabs multi-tenant application step by step, from local development to AWS production. Don't worry if you're new to this - we'll explain everything!

## 📋 Table of Contents

1. [Understanding the Files](#understanding-the-files)
2. [Local Development Setup](#local-development-setup)
3. [Understanding Docker Compose](#understanding-docker-compose)
4. [Production Deployment](#production-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## 🎯 Understanding the Files

Before we start deploying, let's understand what each file does:

### **Docker Files**
```
📁 pocs/magure-app/
├── 🐳 docker-compose.yml           # Main development setup
├── 🐳 docker-compose.production.yml # Production overrides
├── 🐳 docker-compose.aws.yml       # AWS-specific settings
├── 📁 frontend/
│   └── 🐳 Dockerfile              # Frontend build instructions
├── 📁 backend/
│   └── 🐳 Dockerfile              # Backend build instructions
└── 📁 nginx/
    ├── nginx.conf                 # Nginx main configuration
    └── 📁 conf.d/
        ├── default.conf           # Development routing
        ├── production.conf.example # Production routing
        └── aws.conf.example       # AWS routing
```

### **Environment Files**
```
📁 pocs/magure-app/
├── ⚙️ .env.development     # Local development settings
├── ⚙️ .env.staging         # Staging environment settings
├── ⚙️ .env.production      # Production environment settings
└── ⚙️ .env                 # Active environment (created by you)
```

### **Scripts**
```
📁 scripts/
├── 🔧 deploy.sh           # Automated deployment script
├── 💾 backup.sh           # Database backup script
└── 🔄 restore.sh          # Database restore script
```

---

## 🖥️ Local Development Setup

### **Step 1: Prerequisites**

First, make sure you have these installed:

```bash
# Check if Docker is installed
docker --version
# Should show: Docker version 20.10.x or higher

# Check if Docker Compose is installed
docker-compose --version
# Should show: docker-compose version 2.x.x or higher

# Check if Git is installed
git --version
# Should show: git version 2.x.x
```

**If you don't have them:**
- **Docker**: Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Git**: Download from [git-scm.com](https://git-scm.com/)

### **Step 2: Clone and Navigate**

```bash
# Clone your repository (replace with your actual repo URL)
git clone <your-repository-url>
cd pocs/magure-app
```

### **Step 3: Set Up Environment**

```bash
# Copy the development environment file
cp .env.development .env

# Edit the environment file if needed
nano .env  # or use any text editor
```

**What's in the .env file:**
```bash
# Environment type
ENVIRONMENT=development
DEBUG=true

# Database settings (PostgreSQL)
DB_NAME=maglabs                    # Database name
DB_USER=maglabs                    # Database username
DB_PASSWORD=maglabs123             # Database password
DB_HOST=postgres                   # Database container name
DB_PORT=5432                       # Database port

# Django settings
SECRET_KEY=dev-secret-key-change-in-production-very-long-and-random
ALLOWED_HOSTS=localhost,127.0.0.1,backend,*.maglabs.local,*.maglabs.api

# Your API settings
MAGLABS_API_URL=http://localhost:8001
MAGLABS_API_KEY=dev-api-key
```

### **Step 4: Set Up Local Domains**

For multi-tenant development, add these to your `/etc/hosts` file:

```bash
# On Mac/Linux - edit /etc/hosts file
sudo nano /etc/hosts

# Add these lines at the end:
127.0.0.1 tenant1.maglabs.local
127.0.0.1 tenant2.maglabs.local
127.0.0.1 demo.maglabs.local
127.0.0.1 tenant1.maglabs.api
127.0.0.1 tenant2.maglabs.api
127.0.0.1 demo.maglabs.api
```

**On Windows:**
- Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
- Add the same lines

### **Step 5: Deploy Locally**

```bash
# Option 1: Use our deployment script (recommended)
./scripts/deploy.sh development

# Option 2: Manual deployment
docker-compose up -d
```

**What happens when you run this:**
1. 🐳 Docker downloads required images (PostgreSQL, Nginx, etc.)
2. 🏗️ Builds your frontend and backend containers
3. 🗄️ Creates a PostgreSQL database
4. 🌐 Starts Nginx reverse proxy
5. 🚀 Launches all services

### **Step 6: Access Your Application**

Once deployment finishes (2-5 minutes), open your browser:

```
✅ Frontend: http://tenant1.maglabs.local
✅ API: http://tenant1.maglabs.api/api/
✅ Admin: http://tenant1.maglabs.api/admin/
```

---

## 🐳 Understanding Docker Compose

### **What is Docker Compose?**

Docker Compose lets you run multiple containers (services) together. Think of it like this:

```
🏠 Your Application = Multiple Rooms (Services)
├── 🏪 Frontend (React App)
├── 🏭 Backend (Django API)
├── 🗄️ Database (PostgreSQL)
└── 🚪 Gateway (Nginx)
```

### **Main docker-compose.yml Explained**

```yaml
version: '3.8'  # Docker Compose file version

services:  # All the containers we want to run

  # 🗄️ DATABASE CONTAINER
  postgres:
    image: postgres:15-alpine          # Use PostgreSQL version 15
    container_name: maglabs_postgres   # Name for easy reference
    environment:                       # Environment variables
      POSTGRES_DB: ${DB_NAME:-maglabs}       # Database name
      POSTGRES_USER: ${DB_USER:-maglabs}     # Database user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-maglabs123}  # Database password
    volumes:                          # Persistent storage
      - postgres_data:/var/lib/postgresql/data  # Database files
    ports:
      - "5432:5432"                   # Expose database port
    networks:
      - maglabs_network               # Internal network

  # 🏭 BACKEND CONTAINER
  backend:
    build:                            # Build from our Dockerfile
      context: ./backend              # Build context directory
      dockerfile: Dockerfile          # Dockerfile name
      target: development             # Build stage (development/production)
    container_name: maglabs_backend
    environment:                      # Environment variables for Django
      - DB_HOST=postgres              # Connect to postgres container
      - DB_NAME=${DB_NAME:-maglabs}   # Database settings
      - DB_USER=${DB_USER:-maglabs}
      - DB_PASSWORD=${DB_PASSWORD:-maglabs123}
      - DEBUG=true                    # Enable debug mode
      - SECRET_KEY=${SECRET_KEY:-dev-secret-key}
      - ALLOWED_HOSTS=localhost,127.0.0.1,backend,*.maglabs.local
    volumes:                          # Mount directories
      - ./backend:/app                # Live code reloading
      - backend_static:/app/staticfiles     # Static files
      - backend_media:/app/mediafiles       # Media files
    ports:
      - "8000:8000"                   # Expose backend port
    depends_on:                       # Wait for database
      postgres:
        condition: service_healthy    # Only start when DB is ready
    networks:
      - maglabs_network

  # 🏪 FRONTEND CONTAINER
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: maglabs_frontend
    environment:
      - REACT_APP_API_URL=http://localhost/api    # API endpoint
    volumes:
      - ./frontend:/app               # Live code reloading
      - frontend_build:/app/build     # Build output
    ports:
      - "3000:3000"
    networks:
      - maglabs_network

  # 🚪 NGINX GATEWAY
  nginx:
    image: nginx:alpine
    container_name: maglabs_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf           # Main config
      - ./nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf  # Routing rules
      - backend_static:/var/www/static                     # Serve static files
      - backend_media:/var/www/media                       # Serve media files
    ports:
      - "80:80"                       # HTTP port
      - "443:443"                     # HTTPS port (for production)
    depends_on:
      - backend
      - frontend
    networks:
      - maglabs_network

# 💾 PERSISTENT STORAGE
volumes:
  postgres_data:        # Database files survive container restarts
    driver: local
  backend_static:       # Static files (CSS, JS, images)
    driver: local
  backend_media:        # User uploaded files
    driver: local
  frontend_build:       # Built frontend files
    driver: local

# 🌐 NETWORKING
networks:
  maglabs_network:      # Internal network for containers to communicate
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16  # Private IP range
```

### **Production Overrides (docker-compose.production.yml)**

```yaml
version: '3.8'

services:
  # 🗄️ PRODUCTION DATABASE SETTINGS
  postgres:
    environment:
      POSTGRES_HOST_AUTH_METHOD: md5    # More secure authentication
    command: >                          # Optimized PostgreSQL settings
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c max_connections=200            # Handle more connections
      -c shared_buffers=256MB           # More memory for caching
      -c effective_cache_size=1GB       # Optimize for server RAM
    ports: []                           # Don't expose port externally
    deploy:                            # Resource limits
      resources:
        limits:
          memory: 2G                    # Max 2GB RAM
          cpus: '1.0'                   # Max 1 CPU core

  # 🏭 PRODUCTION BACKEND SETTINGS
  backend:
    build:
      target: production                # Use production build stage
    environment:
      - DEBUG=false                     # Disable debug mode
      - USE_S3=true                    # Use AWS S3 for file storage
    command: >                          # Production WSGI server
      gunicorn
      --bind 0.0.0.0:8000
      --workers 4                       # 4 worker processes
      --worker-class gevent             # Async worker type
      --timeout 30                      # Request timeout
      config.wsgi:application
    ports: []                           # Don't expose port externally
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  # 🏪 PRODUCTION FRONTEND SETTINGS
  frontend:
    build:
      target: production
      args:
        REACT_APP_ENVIRONMENT: production
    ports: []                           # Nginx will serve this

  # 🚪 PRODUCTION NGINX SETTINGS
  nginx:
    volumes:
      - ./nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/ssl:/etc/nginx/ssl      # SSL certificates
    environment:
      - NGINX_WORKER_PROCESSES=auto     # Auto-scale workers
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

---

## 🏭 Production Deployment

### **Step 1: Prepare Production Environment**

```bash
# Copy production environment template
cp .env.production .env

# Edit with your real values
nano .env
```

**Critical values to change:**
```bash
# 🔐 SECURITY - Generate new values!
SECRET_KEY=CHANGE_ME_PRODUCTION_SECRET_KEY_VERY_LONG_AND_RANDOM_STRING
DB_PASSWORD=CHANGE_ME_PRODUCTION_DB_PASSWORD

# 🌐 DOMAINS - Your actual domain
ALLOWED_HOSTS=yourdomain.com,*.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com

# 🔑 API KEYS - Your real API key
MAGLABS_API_KEY=CHANGE_ME_PRODUCTION_MAGLABS_API_KEY
```

### **Step 2: Set Up SSL Certificates**

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option 1: Use Let's Encrypt (recommended)
# Install certbot first, then:
certbot certonly --dns-route53 -d '*.yourdomain.com'
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/yourdomain.com.crt
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/yourdomain.com.key

# Option 2: Use your own certificates
# Copy your .crt and .key files to nginx/ssl/
```

### **Step 3: Configure Production Nginx**

```bash
# Copy production nginx config
cp nginx/conf.d/production.conf.example nginx/conf.d/production.conf

# Edit with your domain
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx/conf.d/production.conf
```

### **Step 4: Deploy to Production**

```bash
# Deploy using our script
./scripts/deploy.sh production

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
```

### **Step 5: Set Up DNS**

In your domain registrar (GoDaddy, Namecheap, etc.):

```dns
# A Records
*.yourdomain.com    → YOUR_SERVER_IP
yourdomain.com      → YOUR_SERVER_IP

# Example:
*.example.com       → 203.0.113.10
example.com         → 203.0.113.10
```

---

## ☁️ AWS Deployment

### **Understanding AWS Components**

```
🌐 Internet
    ↓
📍 Route53 (DNS)
    ↓
⚖️ Application Load Balancer (ALB)
    ↓
🐳 ECS Fargate Tasks (Your App)
    ↓
🗄️ RDS PostgreSQL (Database)
    ↓
💾 S3 + CloudFront (File Storage)
```

### **Step 1: AWS Prerequisites**

**Create these AWS resources first:**

1. **🏗️ VPC (Virtual Private Cloud)**
   ```
   Purpose: Isolated network for your resources
   Settings: 
   - CIDR: 10.0.0.0/16
   - Subnets: Public (2) + Private (2)
   - Internet Gateway: Yes
   - NAT Gateway: Yes (for private subnets)
   ```

2. **🗄️ RDS PostgreSQL Database**
   ```
   Purpose: Managed PostgreSQL database
   Settings:
   - Engine: PostgreSQL 15
   - Instance: db.t3.micro (for testing) or db.t3.small (production)
   - Storage: 20GB minimum
   - Multi-AZ: Yes (for production)
   - VPC: Your created VPC
   - Security Group: Allow port 5432 from ECS
   ```

3. **🐳 ECS Cluster**
   ```
   Purpose: Container orchestration
   Settings:
   - Type: Fargate
   - Name: maglabs-production
   - VPC: Your created VPC
   ```

4. **⚖️ Application Load Balancer**
   ```
   Purpose: Route traffic to containers
   Settings:
   - Type: Application Load Balancer
   - Scheme: Internet-facing
   - VPC: Your created VPC
   - Subnets: Public subnets
   - Security Group: Allow HTTP/HTTPS from internet
   ```

5. **📍 Route53 Hosted Zone**
   ```
   Purpose: DNS management
   Settings:
   - Domain: yourdomain.com
   - Type: Public hosted zone
   ```

### **Step 2: Configure AWS Environment**

```bash
# Copy AWS environment template
cp .env.production .env

# Edit with AWS-specific values
nano .env
```

**AWS-specific settings:**
```bash
# 🗄️ RDS Database (replace with your RDS endpoint)
AWS_RDS_HOST=maglabs-prod.cluster-xyz.us-east-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DB_NAME=maglabs_prod
AWS_RDS_USERNAME=maglabs_prod
AWS_RDS_PASSWORD=CHANGE_ME_AWS_RDS_PASSWORD

# 💾 S3 Storage (replace with your bucket name)
AWS_STORAGE_BUCKET_NAME=maglabs-production-bucket
AWS_S3_REGION_NAME=us-east-1
USE_S3=true

# 🔑 AWS Credentials
AWS_ACCESS_KEY_ID=CHANGE_ME_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=CHANGE_ME_AWS_SECRET_KEY
AWS_DEFAULT_REGION=us-east-1

# 🌐 Load Balancer (replace with your ALB DNS)
AWS_ALB_DNS=maglabs-alb-123456789.us-east-1.elb.amazonaws.com
```

### **Step 3: Understanding docker-compose.aws.yml**

```yaml
version: '3.8'

services:
  # ❌ DISABLE LOCAL DATABASE
  postgres:
    profiles:
      - disabled              # Don't start this service

  # 🏭 BACKEND FOR AWS
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    environment:
      # 🗄️ Connect to RDS instead of local PostgreSQL
      - DB_HOST=${AWS_RDS_HOST}                    # RDS endpoint
      - DB_NAME=${AWS_RDS_DB_NAME}                 # RDS database name
      - DB_USER=${AWS_RDS_USERNAME}                # RDS username
      - DB_PASSWORD=${AWS_RDS_PASSWORD}            # RDS password
      
      # 💾 Use S3 for file storage
      - USE_S3=true
      - AWS_STORAGE_BUCKET_NAME=${AWS_STORAGE_BUCKET_NAME}
      - AWS_S3_REGION_NAME=${AWS_S3_REGION_NAME}
      
      # 📊 AWS CloudWatch logging
    logging:
      driver: awslogs
      options:
        awslogs-group: "/ecs/maglabs-backend"      # CloudWatch log group
        awslogs-region: ${AWS_DEFAULT_REGION}
        awslogs-stream-prefix: "ecs"
    
    # 🏗️ ECS Fargate resource limits
    deploy:
      resources:
        limits:
          memory: 2G                               # Max memory per task
          cpus: '1.0'                              # Max CPU per task

  # 🏪 FRONTEND FOR AWS
  frontend:
    build:
      context: ./frontend
      target: production
      args:
        REACT_APP_API_URL: ${FRONTEND_API_URL}     # API endpoint through ALB
        REACT_APP_ENVIRONMENT: production
    logging:
      driver: awslogs
      options:
        awslogs-group: "/ecs/maglabs-frontend"
        awslogs-region: ${AWS_DEFAULT_REGION}

  # 🚪 NGINX FOR AWS ALB
  nginx:
    volumes:
      - ./nginx/conf.d/aws.conf:/etc/nginx/conf.d/default.conf  # AWS-specific config
    environment:
      - AWS_ALB_DNS=${AWS_ALB_DNS}               # Load balancer DNS
      - PRIMARY_DOMAIN=${PRIMARY_DOMAIN}         # Your domain
    logging:
      driver: awslogs
      options:
        awslogs-group: "/ecs/maglabs-nginx"

volumes:
  # ❌ DISABLE LOCAL STORAGE - Use S3/EFS instead
  postgres_data:
    profiles:
      - disabled
  backend_static:
    profiles:
      - disabled              # Use S3 for static files
  backend_media:
    profiles:
      - disabled              # Use S3 for media files
```

### **Step 4: Deploy to AWS**

**Option 1: Using AWS ECS (Recommended)**

```bash
# 1. Build and tag images for ECR
docker-compose -f docker-compose.yml -f docker-compose.aws.yml build

# 2. Create ECR repositories
aws ecr create-repository --repository-name maglabs-backend
aws ecr create-repository --repository-name maglabs-frontend
aws ecr create-repository --repository-name maglabs-nginx

# 3. Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 4. Tag and push images
docker tag maglabs-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest

# Repeat for frontend and nginx...

# 5. Create ECS task definitions and services
# (This requires creating JSON task definition files)
```

**Option 2: Using EC2 with Docker Compose**

```bash
# 1. Launch EC2 instance
# - AMI: Amazon Linux 2
# - Instance Type: t3.medium or larger
# - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
# - Storage: 20GB+

# 2. SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# 3. Install Docker and Docker Compose
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone your repository
git clone <your-repo-url>
cd pocs/magure-app

# 5. Set up environment
cp .env.production .env
# Edit .env with your AWS RDS details

# 6. Deploy
./scripts/deploy.sh aws
```

### **Step 5: Configure Load Balancer Routing**

In AWS ALB, create these target groups and rules:

```
🎯 Target Groups:
├── maglabs-backend (Port 8000)
│   └── Health Check: /health/
├── maglabs-frontend (Port 3000)
│   └── Health Check: /
└── maglabs-nginx (Port 80)
    └── Health Check: /health

🔀 Listener Rules (Port 80/443):
├── Host: *.yourdomain.com → Forward to nginx target group
├── Path: /api/* → Forward to backend target group
└── Default → Forward to frontend target group
```

### **Step 6: Set Up Route53 DNS**

```bash
# Create A record pointing to ALB
aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "*.yourdomain.com",
      "Type": "A",
      "AliasTarget": {
        "DNSName": "your-alb-dns-name.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": false,
        "HostedZoneId": "Z123456789ALB"
      }
    }
  }]
}'
```

---

## 🔧 Troubleshooting Common Issues

### **Issue 1: Containers Won't Start**

```bash
# Check container status
docker-compose ps

# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs postgres

# Common fixes:
# 1. Port conflicts
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 2. Permission issues
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh

# 3. Environment variables
cat .env | grep -v '^#'
```

### **Issue 2: Database Connection Failed**

```bash
# Check if database is running
docker-compose exec postgres psql -U maglabs -d maglabs -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose exec backend python manage.py migrate

# Check database logs
docker-compose logs postgres
```

### **Issue 3: Can't Access Application**

```bash
# Check /etc/hosts file
cat /etc/hosts | grep maglabs

# Should show:
# 127.0.0.1 tenant1.maglabs.local
# 127.0.0.1 tenant2.maglabs.local

# Test nginx routing
curl -H "Host: tenant1.maglabs.local" http://localhost/

# Check nginx logs
docker-compose logs nginx
```

### **Issue 4: SSL Certificate Issues**

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/yourdomain.com.crt -text -noout

# Test nginx configuration
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t

# Renew Let's Encrypt certificate
certbot renew --dry-run
```

### **Issue 5: AWS Deployment Issues**

```bash
# Check ECS service status
aws ecs describe-services --cluster maglabs-production --services backend

# Check CloudWatch logs
aws logs describe-log-streams --log-group-name "/ecs/maglabs-backend"

# Check RDS connectivity
# From EC2 instance:
telnet your-rds-endpoint.amazonaws.com 5432

# Check security groups
aws ec2 describe-security-groups --group-ids sg-12345678
```

---

## 🎉 Success Checklist

Once deployed, verify everything works:

### **Local Development:**
- [ ] ✅ `docker-compose ps` shows all services as "Up"
- [ ] ✅ http://tenant1.maglabs.local loads the frontend
- [ ] ✅ http://tenant1.maglabs.api/api/ shows API documentation
- [ ] ✅ http://tenant1.maglabs.api/admin/ loads Django admin
- [ ] ✅ Database migrations completed successfully
- [ ] ✅ Can create and login to admin user

### **Production Deployment:**
- [ ] ✅ Domain resolves to your server IP
- [ ] ✅ HTTPS certificate is valid and working
- [ ] ✅ Multi-tenant routing works (tenant1.yourdomain.com, tenant2.yourdomain.com)
- [ ] ✅ Static files load correctly
- [ ] ✅ Database is accessible and persistent
- [ ] ✅ Backups are working

### **AWS Deployment:**
- [ ] ✅ ECS tasks are running and healthy
- [ ] ✅ Load balancer health checks pass
- [ ] ✅ RDS database is accessible
- [ ] ✅ S3 bucket stores files correctly
- [ ] ✅ CloudWatch logs are being collected
- [ ] ✅ Route53 DNS routing works
- [ ] ✅ Auto-scaling is configured

---

## 🤖 Automated Deployment with GitHub Actions

We've included simplified GitHub Actions workflows that automatically test and deploy your application when you push code.

### **Understanding the Workflows**

#### **📁 .github/workflows/frontend-ci-cd.yml**
```yaml
# 🚀 What it does:
# 1. Runs tests when you push frontend changes
# 2. Builds and pushes Docker images to registry
# 3. Deploys to development/staging/production automatically

# 🔄 When it runs:
on:
  push:
    branches: [ main, develop, staging ]    # Runs on these branches
    paths: [ 'frontend/**' ]               # Only when frontend changes
```

#### **📁 .github/workflows/backend-ci-cd.yml**
```yaml
# 🚀 What it does:
# 1. Tests Django code with a real PostgreSQL database
# 2. Checks code formatting (black, flake8)
# 3. Builds and pushes backend Docker images
# 4. Runs security scans
# 5. Deploys to environments

# 🔄 When it runs:
on:
  push:
    branches: [ main, develop, staging ]    # Runs on these branches
    paths: [ 'backend/**' ]                # Only when backend changes
```

#### **📁 .github/workflows/deploy-to-aws.yml**
```yaml
# 🚀 What it does:
# 1. Builds all Docker images
# 2. Pushes to Amazon ECR
# 3. Updates ECS services
# 4. Waits for deployment to complete
# 5. Runs health checks

# 🔄 When it runs:
on:
  push:
    branches: [ main ]                     # Only deploy from main branch
  workflow_dispatch:                       # Manual deployment option
```

### **Setting Up GitHub Actions**

#### **Step 1: Configure Repository Secrets**

Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add these secrets:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Database Passwords
DB_PASSWORD=your-production-db-password
SECRET_KEY=your-django-secret-key

# API Keys
MAGLABS_API_KEY=your-production-api-key

# Notification URLs (optional)
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

#### **Step 2: Configure Environment Protection**

```bash
# Go to: Repository → Settings → Environments

# Create environments:
# 1. development (auto-deploy)
# 2. staging (auto-deploy)  
# 3. production (require manual approval)

# For production environment:
☑️ Required reviewers: [Add team members]
☑️ Wait timer: 0 minutes
☑️ Deployment branches: main only
```

#### **Step 3: Customize Deployment Commands**

Edit the workflow files to match your deployment setup:

**For Docker Compose deployment:**
```yaml
# In deploy step, replace with:
- name: 🚀 Deploy to Production
  run: |
    # SSH to your server
    ssh user@your-server.com "
      cd /path/to/app &&
      git pull origin main &&
      ./scripts/deploy.sh production
    "
```

**For AWS ECS deployment:**
```yaml
# Already configured in deploy-to-aws.yml
# Just update the service names and cluster names
```

### **Branch Strategy for Auto-Deployment**

```
🌱 Branch Strategy:
├── main (production) → Deploys to production (manual approval)
├── staging → Deploys to staging automatically  
├── develop → Deploys to development automatically
└── feature/* → Runs tests only (no deployment)
```

### **Workflow Triggers Explained**

```yaml
# Example: How workflows are triggered

# 1. Push to develop branch with frontend changes
git add frontend/src/components/NewComponent.tsx
git commit -m "Add new component"
git push origin develop
# ✅ Triggers: frontend-ci-cd.yml → deploy to development

# 2. Push to main branch with backend changes  
git add backend/apps/api/views.py
git commit -m "Add new API endpoint"
git push origin main
# ✅ Triggers: backend-ci-cd.yml → deploy to production (with approval)

# 3. Push to main branch (any changes)
git push origin main
# ✅ Triggers: deploy-to-aws.yml → full AWS deployment
```

### **Monitoring Deployment Progress**

#### **GitHub Actions UI**
```bash
# View running workflows:
# Repository → Actions tab

# What you'll see:
✅ Tests passing
🏗️ Building Docker images  
🚀 Deploying to environment
✅ Health checks passed
```

#### **Slack Notifications (Optional)**
```yaml
# Add to workflow files for notifications:
- name: 🔔 Notify Slack
  if: always()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"🚀 Deployment completed for ${{ github.repository }}"}' \
      ${{ secrets.SLACK_WEBHOOK }}
```

### **Troubleshooting GitHub Actions**

#### **Common Issues**

**Issue 1: Secrets Not Available**
```bash
# Error: "AWS credentials not found"
# Solution: Check repository secrets are properly set
# Go to: Repository → Settings → Secrets and Variables → Actions
```

**Issue 2: Tests Failing**
```bash
# Error: Test failures block deployment
# Solution: Fix tests before deploying
git add .
git commit -m "Fix failing tests"
git push
```

**Issue 3: Docker Build Failing**
```bash
# Error: "Error building Docker image"
# Solution: Test locally first
docker build -t test-image ./backend
docker build -t test-image ./frontend
```

#### **Debugging Workflow Runs**

```bash
# View detailed logs:
# 1. Go to repository → Actions
# 2. Click on failed workflow run
# 3. Click on failed job
# 4. Expand failing step to see detailed logs

# Common debugging steps:
# - Check environment variables
# - Verify Docker images build locally
# - Test database connections
# - Validate AWS permissions
```

### **Manual Deployment Override**

```bash
# Sometimes you need to deploy manually:
# Repository → Actions → Deploy to AWS → Run workflow

# Options:
Environment: [staging/production]
Branch: [main]
```

### **Cost Considerations**

```bash
# GitHub Actions usage:
# - 2,000 minutes/month free for public repos
# - 500 minutes/month free for private repos  
# - Additional minutes: $0.008/minute

# Typical usage:
# - Frontend workflow: ~5 minutes
# - Backend workflow: ~8 minutes  
# - AWS deployment: ~10 minutes
# Total per deployment: ~23 minutes

# Monthly estimate (10 deployments): ~230 minutes ($1.84)
```

---

## 📞 Getting Help

If you run into issues:

1. **Check the logs first:**
   ```bash
   docker-compose logs --tail=100 [service-name]
   ```

2. **Verify your environment:**
   ```bash
   docker-compose config
   ```

3. **Test individual components:**
   ```bash
   # Test database
   docker-compose exec postgres psql -U maglabs
   
   # Test backend
   docker-compose exec backend python manage.py check
   
   # Test nginx config
   docker-compose exec nginx nginx -t
   ```

4. **Common commands for debugging:**
   ```bash
   # Enter a container
   docker-compose exec backend bash
   
   # Restart a service
   docker-compose restart backend
   
   # Rebuild a service
   docker-compose up -d --build backend
   
   # View resource usage
   docker stats
   ```

Remember: This is a complex system, and it's normal to encounter issues when learning. Take it step by step, and don't hesitate to check the logs when something doesn't work as expected!

---

## 🔄 Next Steps

After successful deployment:

1. **Set up monitoring** with CloudWatch/Grafana
2. **Configure automated backups** using the provided scripts
3. **Set up CI/CD pipelines** with GitHub Actions
4. **Implement proper logging** and error tracking
5. **Scale your infrastructure** based on usage

Good luck with your deployment! 🚀