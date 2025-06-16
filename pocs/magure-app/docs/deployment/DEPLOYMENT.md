# Magure-App AWS Deployment Guide

A comprehensive guide to deploy the multi-tenant Django + React application to AWS.

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [AWS Infrastructure Setup](#aws-infrastructure-setup)
3. [Domain & DNS Configuration](#domain--dns-configuration)
4. [Container & ECR Setup](#container--ecr-setup)
5. [Database Migration & Tenant Setup](#database-migration--tenant-setup)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Process](#deployment-process)
8. [Domain Mapping Verification](#domain-mapping-verification)
9. [Monitoring & Logging Setup](#monitoring--logging-setup)
10. [Post-Deployment Checklist](#post-deployment-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites & Setup

### Required AWS Services
- **VPC** - Virtual Private Cloud for network isolation
- **RDS** - PostgreSQL database for django-tenants
- **ECS** - Container orchestration service
- **ECR** - Container registry
- **ALB** - Application Load Balancer for routing
- **Route 53** - DNS management and wildcard domains
- **ACM** - SSL certificate management
- **Secrets Manager** - Secure credential storage
- **CloudWatch** - Monitoring and logging

### Domain Requirements
- **Domain ownership**: You must own a domain (e.g., `maglabs.com`)
- **Route 53 management**: Domain must be managed by Route 53
- **Wildcard support**: Ability to create wildcard subdomains

### Local Development Tools
```bash
# Install required tools
brew install awscli docker terraform # macOS
# or
sudo apt-get install awscli docker.io terraform # Ubuntu

# Verify installations
aws --version
docker --version
terraform --version
```

### AWS CLI Configuration
```bash
# Configure AWS CLI with your credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Verify access
aws sts get-caller-identity
```

### Prerequisites Checklist
- [ ] AWS account with programmatic access
- [ ] Domain registered and managed by Route 53
- [ ] AWS CLI configured with appropriate permissions
- [ ] Docker installed and running
- [ ] Local development environment working

---

## AWS Infrastructure Setup

### 1. VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=magure-app-vpc}]'

# Note the VPC ID from output
export VPC_ID="vpc-xxxxxxxxx"

# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=magure-app-igw}]'

export IGW_ID="igw-xxxxxxxxx"

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID

# Create Public Subnets (2 AZs for ALB)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=magure-app-public-1a}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=magure-app-public-1b}]'

# Create Private Subnets for ECS and RDS
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=magure-app-private-1a}]'

aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=magure-app-private-1b}]'
```

### 2. Security Groups

```bash
# ALB Security Group (Allow HTTP/HTTPS from internet)
aws ec2 create-security-group \
  --group-name magure-app-alb-sg \
  --description "Security group for Magure App ALB" \
  --vpc-id $VPC_ID

export ALB_SG_ID="sg-xxxxxxxxx"

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# ECS Security Group (Allow traffic from ALB)
aws ec2 create-security-group \
  --group-name magure-app-ecs-sg \
  --description "Security group for Magure App ECS tasks" \
  --vpc-id $VPC_ID

export ECS_SG_ID="sg-xxxxxxxxx"

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 8000 \
  --source-group $ALB_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group $ALB_SG_ID

# RDS Security Group (Allow access from ECS)
aws ec2 create-security-group \
  --group-name magure-app-rds-sg \
  --description "Security group for Magure App RDS" \
  --vpc-id $VPC_ID

export RDS_SG_ID="sg-xxxxxxxxx"

aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $ECS_SG_ID
```

### 3. RDS PostgreSQL Setup

```bash
# Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name magure-app-subnet-group \
  --db-subnet-group-description "Subnet group for Magure App RDS" \
  --subnet-ids subnet-xxxxxxxxx subnet-yyyyyyyyy

# Create RDS Instance
aws rds create-db-instance \
  --db-instance-identifier magure-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name magure-app-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted \
  --deletion-protection

# Wait for RDS to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier magure-app-db

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier magure-app-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

---

## Domain & DNS Configuration

### 1. Route 53 Hosted Zone Setup

```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
  --name maglabs.com \
  --caller-reference $(date +%s)

# Get hosted zone ID
export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name maglabs.com \
  --query 'HostedZones[0].Id' \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
```

### 2. SSL Certificate Request

```bash
# Request wildcard certificate
aws acm request-certificate \
  --domain-name "*.maglabs.com" \
  --subject-alternative-names "maglabs.com" "*.maglabs.api" \
  --validation-method DNS

# Get certificate ARN
export CERT_ARN=$(aws acm list-certificates \
  --query 'CertificateSummaryList[?DomainName==`*.maglabs.com`].CertificateArn' \
  --output text)

# Get DNS validation records
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --query 'Certificate.DomainValidationOptions'
```

> **Important**: Add the DNS validation records to your Route 53 hosted zone before proceeding.

### 3. Application Load Balancer Setup

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name magure-app-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application

export ALB_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/magure-app-alb/xxxxxxxxx"
export ALB_DNS_NAME="magure-app-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com"

# Create target groups
# Backend target group
aws elbv2 create-target-group \
  --name magure-app-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id $VPC_ID \
  --health-check-path "/health/" \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

export BACKEND_TG_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/magure-app-backend-tg/xxxxxxxxx"

# Frontend target group
aws elbv2 create-target-group \
  --name magure-app-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --health-check-path "/" \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

export FRONTEND_TG_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/magure-app-frontend-tg/xxxxxxxxx"

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=fixed-response,FixedResponseConfig='{MessageBody="Not Found",StatusCode="404",ContentType="text/plain"}'

export LISTENER_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/magure-app-alb/xxxxxxxxx/yyyyyyyyy"

# Create routing rules
# Rule for API domains (*.maglabs.api)
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 100 \
  --conditions Field=host-header,Values="*.maglabs.api" \
  --actions Type=forward,TargetGroupArn=$BACKEND_TG_ARN

# Rule for frontend domains (*.maglabs.com)
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 200 \
  --conditions Field=host-header,Values="*.maglabs.com" \
  --actions Type=forward,TargetGroupArn=$FRONTEND_TG_ARN
```

### 4. DNS Records

```bash
# Create wildcard A records pointing to ALB
cat > /tmp/change-batch.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "*.maglabs.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "$ALB_DNS_NAME",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "*.maglabs.api",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "$ALB_DNS_NAME",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z35SXDOTRQ7X7K"
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file:///tmp/change-batch.json
```

---

## Container & ECR Setup

### 1. ECR Repository Creation

```bash
# Create ECR repositories
aws ecr create-repository --repository-name magure-app/backend
aws ecr create-repository --repository-name magure-app/frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

### 2. Backend Docker Optimization

Create `backend/Dockerfile.prod`:

```dockerfile
# Multi-stage build for production
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health/ || exit 1

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "config.wsgi:application"]
```

### 3. Frontend Docker Optimization

Create `frontend/Dockerfile.prod`:

```dockerfile
# Multi-stage build
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Build and Push Images

```bash
# Backend
cd backend
docker build -f Dockerfile.prod -t magure-app-backend .
docker tag magure-app-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/magure-app/backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/magure-app/backend:latest

# Frontend
cd ../frontend
docker build -f Dockerfile.prod -t magure-app-frontend .
docker tag magure-app-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/magure-app/frontend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/magure-app/frontend:latest
```

---

## Database Migration & Tenant Setup

### 1. Create Health Check Endpoint

Create `backend/health/views.py`:

```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """Health check endpoint for load balancer"""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

Add to `backend/config/urls.py`:

```python
from health.views import health_check

urlpatterns = [
    path('health/', health_check, name='health_check'),
    # ... other patterns
]
```

### 2. Update Domain Configuration

Update `backend/config/domain_config.py`:

```python
class DomainConfig:
    def __init__(self):
        self.env = os.environ.get('DJANGO_ENV', 'dev')
        
        self.configs = {
            'prod': {
                'api_domain': 'maglabs.api',
                'user_domain': 'maglabs.com',
                'protocol': 'https',
                'cors_origins': [
                    'https://*.maglabs.com',
                    'https://*.maglabs.api'
                ]
            },
            'staging': {
                'api_domain': 'staging.maglabs.api',
                'user_domain': 'staging.maglabs.com',
                'protocol': 'https',
                'cors_origins': [
                    'https://*.staging.maglabs.com',
                    'https://*.staging.maglabs.api'
                ]
            }
        }
```

### 3. Update Production Settings

Update `backend/config/settings/prod.py`:

```python
from .base import *
import os

DEBUG = False
ALLOWED_HOSTS = ['.maglabs.com', '.maglabs.api', '.amazonaws.com']

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': os.environ.get('DB_NAME', 'magure_prod'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

# Static files (S3)
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
STATICFILES_STORAGE = 'storages.backends.s3boto3.StaticS3Boto3Storage'

STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# Enhanced CORS for subdomains
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://*.maglabs.com',
    'https://*.maglabs.api',
]
CORS_ALLOW_CREDENTIALS = True

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

---

## Environment Configuration

### 1. AWS Secrets Manager

```bash
# Create secret for database credentials
aws secretsmanager create-secret \
  --name "magure-app/database" \
  --description "Database credentials for Magure App" \
  --secret-string '{
    "username": "postgres",
    "password": "YourSecurePassword123!",
    "host": "magure-app-db.xxxxxxxxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "dbname": "magure_prod"
  }'

# Create secret for Django settings
aws secretsmanager create-secret \
  --name "magure-app/django" \
  --description "Django configuration for Magure App" \
  --secret-string '{
    "secret_key": "your-super-secret-django-key-here",
    "openai_api_key": "your-openai-api-key"
  }'
```

### 2. ECS Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "magure-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/magure-app/backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DJANGO_ENV",
          "value": "prod"
        },
        {
          "name": "DJANGO_SETTINGS_MODULE",
          "value": "config.settings.prod"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:magure-app/database:password::"
        },
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:magure-app/database:host::"
        },
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:magure-app/django:secret_key::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/magure-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/magure-app/frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/magure-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
```

### 3. ECS Cluster and Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name magure-app-cluster

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/magure-app

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster magure-app-cluster \
  --service-name magure-app-service \
  --task-definition magure-app:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx,subnet-yyyyyyyyy],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$BACKEND_TG_ARN,containerName=backend,containerPort=8000" \
  --load-balancers "targetGroupArn=$FRONTEND_TG_ARN,containerName=frontend,containerPort=80"
```

---

## Deployment Process

### 1. Database Migration

```bash
# Run migrations via ECS task
aws ecs run-task \
  --cluster magure-app-cluster \
  --task-definition magure-app:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [
      {
        "name": "backend",
        "command": ["python", "manage.py", "migrate_schemas"]
      }
    ]
  }'

# Create initial tenant
aws ecs run-task \
  --cluster magure-app-cluster \
  --task-definition magure-app:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [
      {
        "name": "backend",
        "command": ["python", "bootstrap.py"]
      }
    ]
  }'
```

### 2. Frontend Environment Configuration

Update `frontend/src/lib/utils.ts`:

```typescript
export function getBaseUrl(): string {
  const hostname = window.location.hostname;
  
  // Production environment detection
  if (hostname.endsWith('.maglabs.com')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const tenant = parts[0];
      return `https://${tenant}.maglabs.api`;
    }
  }
  
  // Staging environment
  if (hostname.endsWith('.staging.maglabs.com')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const tenant = parts[0];
      return `https://${tenant}.staging.maglabs.api`;
    }
  }
  
  // Development fallback
  return 'http://magureinc.maglabs.api';
}
```

---

## Domain Mapping Verification

### 1. DNS Resolution Tests

```bash
# Test DNS resolution
dig tenant1.maglabs.com
dig tenant1.maglabs.api
dig admin.maglabs.com

# Verify all resolve to ALB
nslookup tenant1.maglabs.com
nslookup tenant1.maglabs.api
```

### 2. SSL Certificate Verification

```bash
# Test SSL certificates
openssl s_client -connect tenant1.maglabs.com:443 -servername tenant1.maglabs.com
openssl s_client -connect tenant1.maglabs.api:443 -servername tenant1.maglabs.api
```

### 3. Application Health Checks

```bash
# Test backend health
curl -H "Host: tenant1.maglabs.api" https://your-alb-dns-name/health/

# Test frontend
curl -H "Host: tenant1.maglabs.com" https://your-alb-dns-name/

# Test CORS
curl -H "Origin: https://tenant1.maglabs.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://tenant1.maglabs.api/api/v1/
```

### 4. Multi-Tenant Verification

```bash
# Create test tenant via API
curl -X POST https://admin.maglabs.api/api/v1/tenants/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Company",
    "schema_name": "testcompany",
    "domain": "testcompany.maglabs.com"
  }'

# Test tenant isolation
curl https://testcompany.maglabs.api/api/v1/ideas/
curl https://anothertenant.maglabs.api/api/v1/ideas/
```

---

## Monitoring & Logging Setup

### 1. CloudWatch Dashboards

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "magure-app-dashboard" \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/magure-app-alb/xxxxxxxxx"],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/magure-app-alb/xxxxxxxxx"]
          ],
          "period": 300,
          "stat": "Sum",
          "region": "us-east-1",
          "title": "ALB Metrics"
        }
      }
    ]
  }'
```

### 2. CloudWatch Alarms

```bash
# Create high error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "magure-app-high-error-rate" \
  --alarm-description "High 5xx error rate" \
  --metric-name HTTPCode_ELB_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/magure-app-alb/xxxxxxxxx \
  --evaluation-periods 2

# Create database connection alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "magure-app-db-connections" \
  --alarm-description "High database connections" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=magure-app-db \
  --evaluation-periods 2
```

---

## Post-Deployment Checklist

### Security Validation
- [ ] SSL certificates are valid and cover all subdomains
- [ ] Security groups follow principle of least privilege
- [ ] Database encryption is enabled
- [ ] Secrets are stored in AWS Secrets Manager
- [ ] WAF rules are configured (optional but recommended)

### Performance Testing
- [ ] Load testing completed with expected user volumes
- [ ] Database query performance optimized
- [ ] CDN cache headers configured correctly
- [ ] Auto-scaling policies tested

### Backup Verification
- [ ] RDS automated backups enabled
- [ ] S3 bucket versioning enabled
- [ ] Cross-region backup replication configured
- [ ] Recovery procedures documented and tested

### Monitoring Setup
- [ ] CloudWatch dashboards created
- [ ] Critical alarms configured
- [ ] Log aggregation working correctly
- [ ] Cost monitoring alerts set up

---

## Troubleshooting

### Common Issues

#### 1. Domain Resolution Problems
```bash
# Check DNS propagation
dig +trace tenant1.maglabs.com

# Check Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn $CERT_ARN

# Validate certificate covers subdomains
openssl s_client -connect tenant1.maglabs.com:443 -servername tenant1.maglabs.com | openssl x509 -noout -text
```

#### 3. Database Connection Issues
```bash
# Test database connectivity from ECS
aws ecs run-task \
  --cluster magure-app-cluster \
  --task-definition magure-app:1 \
  --launch-type FARGATE \
  --overrides '{
    "containerOverrides": [
      {
        "name": "backend",
        "command": ["python", "manage.py", "dbshell"]
      }
    ]
  }'
```

#### 4. CORS Issues
Check CORS configuration in Django settings:
```python
# Verify CORS origins in settings/prod.py
CORS_ALLOWED_ORIGINS = [
    'https://*.maglabs.com',
    'https://*.maglabs.api',
]
```

#### 5. Load Balancer Health Check Failures
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn $BACKEND_TG_ARN

# Check ECS service events
aws ecs describe-services --cluster magure-app-cluster --services magure-app-service
```

### Debug Commands
```bash
# View ECS service logs
aws logs filter-log-events \
  --log-group-name /ecs/magure-app \
  --start-time $(date -d '1 hour ago' +%s)000

# Check ALB access logs (if enabled)
aws s3 ls s3://your-alb-logs-bucket/

# Monitor database performance
aws rds describe-db-log-files --db-instance-identifier magure-app-db
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster magure-app-cluster \
  --service magure-app-service \
  --task-definition magure-app:1  # previous version

# Scale down if needed
aws ecs update-service \
  --cluster magure-app-cluster \
  --service magure-app-service \
  --desired-count 0
```

#### Database Recovery
```bash
# Restore from point-in-time backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier magure-app-db \
  --target-db-instance-identifier magure-app-db-restore \
  --restore-time 2023-12-01T10:00:00.000Z
```

---

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor CloudWatch metrics and logs daily
- Review security groups and access patterns weekly
- Update container images monthly
- Perform database maintenance during low-traffic periods
- Review and optimize costs quarterly

### Scaling Considerations
- Configure ECS auto-scaling based on CPU/memory metrics
- Set up RDS read replicas for read-heavy workloads
- Implement CloudFront CDN for static assets
- Consider multi-region deployment for disaster recovery

### Security Updates
- Enable AWS Security Hub for compliance monitoring
- Set up AWS GuardDuty for threat detection
- Regularly rotate database passwords and API keys
- Review IAM permissions quarterly

---

This deployment guide provides a comprehensive walkthrough for deploying the Magure-App multi-tenant system to AWS. Follow each section carefully and verify each step before proceeding to the next.