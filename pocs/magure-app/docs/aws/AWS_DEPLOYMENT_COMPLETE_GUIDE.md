# ☁️ Complete AWS Deployment Guide

This guide will walk you through deploying your MagLabs multi-tenant application to AWS from scratch. We'll set up everything step by step, even if you've never used AWS before.

## 📋 Table of Contents

1. [AWS Account Setup](#aws-account-setup)
2. [Understanding AWS Services](#understanding-aws-services)
3. [Step-by-Step AWS Infrastructure Setup](#step-by-step-aws-infrastructure-setup)
4. [Preparing Your Application](#preparing-your-application)
5. [Deployment Process](#deployment-process)
6. [Domain and SSL Setup](#domain-and-ssl-setup)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)
9. [Cost Optimization](#cost-optimization)

---

## 🔧 AWS Account Setup

### **Step 1: Create AWS Account**

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the signup process (you'll need a credit card)
4. **Important**: Enable MFA (Multi-Factor Authentication) for security

### **Step 2: Create IAM User for Deployment**

**Why**: Never use your root account for deployments. Create a separate user with limited permissions.

```bash
# 1. Go to AWS Console → IAM → Users → Create User
# 2. User name: "maglabs-deployer"
# 3. Select "Provide user access to the AWS Management Console"
# 4. Attach these policies:
#    - AmazonECS_FullAccess
#    - AmazonEC2ContainerRegistryFullAccess
#    - AmazonRDSFullAccess
#    - AmazonVPCFullAccess
#    - AmazonRoute53FullAccess
#    - ElasticLoadBalancingFullAccess
#    - CloudWatchFullAccess
#    - AmazonS3FullAccess
```

### **Step 3: Install AWS CLI**

```bash
# On Mac
brew install awscli

# On Linux
sudo apt-get install awscli

# On Windows
# Download from: https://awscli.amazonaws.com/AWSCLIV2.msi

# Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID: [from IAM user]
# - AWS Secret Access Key: [from IAM user]
# - Default region: us-east-1
# - Default output format: json
```

---

## 🏗️ Understanding AWS Services

Before we build, let's understand what each AWS service does:

### **🌐 Our Architecture**
```
Internet Users
    ↓
📍 Route53 (DNS) - "Phone book that finds your website"
    ↓
🔒 Certificate Manager (SSL) - "Security guard that encrypts traffic"
    ↓
⚖️ Application Load Balancer (ALB) - "Traffic director"
    ↓
🐳 ECS Fargate (Containers) - "Your application running in the cloud"
    ↓
🗄️ RDS PostgreSQL - "Your database"
    ↓
💾 S3 + CloudFront - "File storage and global delivery"
```

### **Service Explanations**

| Service | What it does | Why we need it |
|---------|-------------|---------------|
| **🌐 Route53** | DNS service | Converts yourapp.com → IP address |
| **🔒 ACM** | SSL certificates | Makes your site HTTPS (secure) |
| **⚖️ ALB** | Load balancer | Distributes traffic, handles SSL |
| **🐳 ECS** | Container orchestration | Runs your Docker containers |
| **🗄️ RDS** | Managed database | PostgreSQL without server management |
| **💾 S3** | File storage | Stores images, static files |
| **📊 CloudWatch** | Monitoring | Logs, metrics, alerts |
| **🌍 CloudFront** | CDN | Fast file delivery worldwide |

---

## 🔨 Step-by-Step AWS Infrastructure Setup

### **Phase 1: Network Setup (VPC)**

**What we're building**: A private network in AWS for your application.

#### **Step 1.1: Create VPC**

```bash
# Go to AWS Console → VPC → Create VPC

# Settings:
Name: maglabs-vpc
IPv4 CIDR: 10.0.0.0/16
IPv6 CIDR: No IPv6
Tenancy: Default
```

**What this means**: You've created a private network that can hold up to 65,536 IP addresses (10.0.0.1 to 10.0.255.254).

#### **Step 1.2: Create Subnets**

**Why subnets**: We need public subnets (internet-accessible) for load balancers and private subnets (secure) for our application.

```bash
# Create 4 subnets (2 public, 2 private for high availability)

# Public Subnet 1
Name: maglabs-public-1
VPC: maglabs-vpc
Availability Zone: us-east-1a
IPv4 CIDR: 10.0.1.0/24

# Public Subnet 2
Name: maglabs-public-2
VPC: maglabs-vpc
Availability Zone: us-east-1b
IPv4 CIDR: 10.0.2.0/24

# Private Subnet 1
Name: maglabs-private-1
VPC: maglabs-vpc
Availability Zone: us-east-1a
IPv4 CIDR: 10.0.10.0/24

# Private Subnet 2
Name: maglabs-private-2
VPC: maglabs-vpc
Availability Zone: us-east-1b
IPv4 CIDR: 10.0.20.0/24
```

#### **Step 1.3: Create Internet Gateway**

```bash
# AWS Console → VPC → Internet Gateways → Create
Name: maglabs-igw

# Attach to VPC:
Actions → Attach to VPC → Select maglabs-vpc
```

**What this does**: Allows your public subnets to access the internet.

#### **Step 1.4: Create NAT Gateway**

```bash
# AWS Console → VPC → NAT Gateways → Create
Name: maglabs-nat
Subnet: maglabs-public-1
Connectivity: Public
Allocate Elastic IP: Yes
```

**What this does**: Allows your private subnets to access the internet for downloads, but prevents inbound internet access.

#### **Step 1.5: Configure Route Tables**

```bash
# Public Route Table
Name: maglabs-public-rt
VPC: maglabs-vpc
Routes:
  - 10.0.0.0/16 → Local
  - 0.0.0.0/0 → maglabs-igw
Associate with: maglabs-public-1, maglabs-public-2

# Private Route Table
Name: maglabs-private-rt
VPC: maglabs-vpc
Routes:
  - 10.0.0.0/16 → Local
  - 0.0.0.0/0 → maglabs-nat
Associate with: maglabs-private-1, maglabs-private-2
```

### **Phase 2: Database Setup (RDS)**

#### **Step 2.1: Create Database Subnet Group**

```bash
# AWS Console → RDS → Subnet Groups → Create
Name: maglabs-db-subnet-group
Description: Database subnets for MagLabs
VPC: maglabs-vpc
Availability Zones: us-east-1a, us-east-1b
Subnets: maglabs-private-1, maglabs-private-2
```

#### **Step 2.2: Create Security Group for Database**

```bash
# AWS Console → EC2 → Security Groups → Create
Name: maglabs-db-sg
Description: Database security group
VPC: maglabs-vpc

# Inbound Rules:
Type: PostgreSQL
Port: 5432
Source: Custom (10.0.0.0/16)  # Only from our VPC
```

#### **Step 2.3: Create RDS Database**

```bash
# AWS Console → RDS → Databases → Create Database

# Engine Options:
Engine: PostgreSQL
Version: 15.4

# Templates:
Choose: Production (for production) or Dev/Test (for testing)

# Settings:
DB Instance Identifier: maglabs-db
Master Username: maglabs_admin
Master Password: [Create a strong password - save it!]

# Instance Configuration:
DB Instance Class: db.t3.micro (for testing) or db.t3.small (for production)

# Storage:
Storage Type: gp3
Allocated Storage: 20 GB
Enable Storage Autoscaling: Yes
Maximum Storage: 100 GB

# Connectivity:
VPC: maglabs-vpc
Subnet Group: maglabs-db-subnet-group
Security Groups: maglabs-db-sg
Publicly Accessible: No

# Additional Configuration:
Initial Database Name: maglabs_prod
Backup Retention: 7 days
Enable Enhanced Monitoring: Yes
```

**Important**: Save the database endpoint! You'll need it later. It looks like: `maglabs-db.abc123.us-east-1.rds.amazonaws.com`

### **Phase 3: Container Registry (ECR)**

#### **Step 3.1: Create ECR Repositories**

```bash
# Using AWS CLI (easier):
aws ecr create-repository --repository-name maglabs-backend --region us-east-1
aws ecr create-repository --repository-name maglabs-frontend --region us-east-1
aws ecr create-repository --repository-name maglabs-nginx --region us-east-1

# Or via Console: AWS Console → ECR → Repositories → Create
```

### **Phase 4: Container Orchestration (ECS)**

#### **Step 4.1: Create ECS Cluster**

```bash
# AWS Console → ECS → Clusters → Create

# Cluster Configuration:
Cluster Name: maglabs-production
Infrastructure: AWS Fargate (serverless)
```

#### **Step 4.2: Create Security Group for ECS**

```bash
# AWS Console → EC2 → Security Groups → Create
Name: maglabs-ecs-sg
Description: ECS tasks security group
VPC: maglabs-vpc

# Inbound Rules:
Type: HTTP
Port: 80
Source: Custom (10.0.0.0/16)

Type: Custom TCP
Port: 8000
Source: Custom (10.0.0.0/16)

Type: Custom TCP
Port: 3000
Source: Custom (10.0.0.0/16)
```

### **Phase 5: Load Balancer Setup**

#### **Step 5.1: Create Security Group for Load Balancer**

```bash
# AWS Console → EC2 → Security Groups → Create
Name: maglabs-alb-sg
Description: Application Load Balancer security group
VPC: maglabs-vpc

# Inbound Rules:
Type: HTTP
Port: 80
Source: Anywhere IPv4 (0.0.0.0/0)

Type: HTTPS
Port: 443
Source: Anywhere IPv4 (0.0.0.0/0)
```

#### **Step 5.2: Create Application Load Balancer**

```bash
# AWS Console → EC2 → Load Balancers → Create

# Basic Configuration:
Load Balancer Type: Application Load Balancer
Name: maglabs-alb
Scheme: Internet-facing
IP Address Type: IPv4

# Network Mapping:
VPC: maglabs-vpc
Mappings: maglabs-public-1, maglabs-public-2

# Security Groups:
Security Groups: maglabs-alb-sg

# Listeners:
Protocol: HTTP
Port: 80
Default Action: Forward to... (we'll create target groups next)
```

#### **Step 5.3: Create Target Groups**

```bash
# Create Backend Target Group
Name: maglabs-backend-tg
Target Type: IP
Protocol: HTTP
Port: 8000
VPC: maglabs-vpc
Health Check Path: /health/

# Create Frontend Target Group
Name: maglabs-frontend-tg
Target Type: IP
Protocol: HTTP
Port: 3000
VPC: maglabs-vpc
Health Check Path: /

# Create Nginx Target Group
Name: maglabs-nginx-tg
Target Type: IP
Protocol: HTTP
Port: 80
VPC: maglabs-vpc
Health Check Path: /health
```

### **Phase 6: File Storage (S3)**

#### **Step 6.1: Create S3 Bucket**

```bash
# AWS Console → S3 → Create Bucket

# General Configuration:
Bucket Name: maglabs-prod-files-[random-string]  # Must be globally unique
Region: us-east-1

# Object Ownership:
ACLs Disabled (recommended)

# Block Public Access:
Block all public access: ☐ (uncheck)
Warning: ☑ I acknowledge...

# Bucket Versioning:
Enable

# Default Encryption:
Server-side encryption: Enable
Encryption type: Amazon S3 managed keys (SSE-S3)
```

#### **Step 6.2: Create CloudFront Distribution (Optional)**

```bash
# AWS Console → CloudFront → Create Distribution

# Origin:
Origin Domain: your-s3-bucket-name.s3.amazonaws.com
Origin Access: Origin access control settings
Create control setting: Yes

# Default Cache Behavior:
Viewer Protocol Policy: Redirect HTTP to HTTPS
Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
Cache Key and Origin Requests: Cache policy and origin request policy (recommended)

# Settings:
Price Class: Use Only North America and Europe
Alternate Domain Names: cdn.yourdomain.com (optional)
```

---

## 🔧 Preparing Your Application

### **Step 1: Update Environment Variables**

Create a production environment file:

```bash
cd /path/to/your/project/pocs/magure-app
cp .env.production .env.aws
```

Edit `.env.aws` with your AWS resources:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false

# AWS RDS Database (use your actual RDS endpoint)
DB_HOST=maglabs-db.abc123.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=maglabs_prod
DB_USER=maglabs_admin
DB_PASSWORD=your-strong-rds-password

# Django Settings
SECRET_KEY=your-super-long-secret-key-generate-new-one
ALLOWED_HOSTS=yourdomain.com,*.yourdomain.com,your-alb-dns.elb.amazonaws.com

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com

# MagLabs API
MAGLABS_API_URL=https://api.maglabs.com
MAGLABS_API_KEY=your-production-api-key

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=maglabs-prod-files-xyz
AWS_S3_REGION_NAME=us-east-1
USE_S3=true

# Frontend Configuration
FRONTEND_API_URL=https://yourdomain.com/api
FRONTEND_WS_URL=wss://yourdomain.com/ws

# Security Settings
SECURE_SSL_REDIRECT=true
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=true
```

### **Step 2: Create ECS Task Definitions**

#### **Backend Task Definition**

Create `aws/backend-task-definition.json`:

```json
{
  "family": "maglabs-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR-ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR-ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "DEBUG", "value": "false"},
        {"name": "DB_HOST", "value": "maglabs-db.abc123.us-east-1.rds.amazonaws.com"},
        {"name": "DB_NAME", "value": "maglabs_prod"},
        {"name": "DB_USER", "value": "maglabs_admin"},
        {"name": "USE_S3", "value": "true"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT:secret:rds-db-credentials"
        },
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT:secret:django-secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/maglabs-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## 🚀 Deployment Process

### **Step 1: Build and Push Docker Images**

```bash
# 1. Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# 2. Build images
docker-compose -f docker-compose.yml -f docker-compose.aws.yml build

# 3. Tag images for ECR
docker tag maglabs-backend:latest YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest
docker tag maglabs-frontend:latest YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-frontend:latest
docker tag maglabs-nginx:latest YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-nginx:latest

# 4. Push images
docker push YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-backend:latest
docker push YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-frontend:latest
docker push YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/maglabs-nginx:latest
```

### **Step 2: Create IAM Roles**

#### **ECS Task Execution Role**

```bash
# Create execution role (allows ECS to pull images and write logs)
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

#### **ECS Task Role**

```bash
# Create task role (allows your app to access AWS services)
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Create custom policy for S3 access
aws iam create-policy \
  --policy-name MagLabsS3AccessPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::maglabs-prod-files-xyz/*",
          "arn:aws:s3:::maglabs-prod-files-xyz"
        ]
      }
    ]
  }'

# Attach policy to task role
aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::YOUR-ACCOUNT:policy/MagLabsS3AccessPolicy
```

### **Step 3: Create ECS Services**

#### **Register Task Definition**

```bash
aws ecs register-task-definition --cli-input-json file://aws/backend-task-definition.json
```

#### **Create ECS Service**

```bash
aws ecs create-service \
  --cluster maglabs-production \
  --service-name backend \
  --task-definition maglabs-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-abc123,subnet-def456],
    securityGroups=[sg-abc123],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:YOUR-ACCOUNT:targetgroup/maglabs-backend-tg/abc123,containerName=backend,containerPort=8000"
```

### **Step 4: Configure Load Balancer Rules**

```bash
# AWS Console → EC2 → Load Balancers → maglabs-alb → Listeners

# Create listener rules for routing:
# Rule 1: If Host = *.yourdomain.com AND Path = /api/* → Forward to backend target group
# Rule 2: If Host = *.yourdomain.com AND Path = /admin/* → Forward to backend target group
# Rule 3: If Host = *.yourdomain.com → Forward to frontend target group (default)
```

---

## 🌐 Domain and SSL Setup

### **Step 1: Request SSL Certificate**

```bash
# AWS Console → Certificate Manager → Request Certificate

# Certificate Type: Request a public certificate
# Domain Names: 
#   - yourdomain.com
#   - *.yourdomain.com
# Validation Method: DNS validation
# Key Algorithm: RSA 2048
```

### **Step 2: Validate Certificate**

```bash
# ACM will show DNS records to add to your domain
# Add these CNAME records to your domain registrar:

Name: _abc123def456.yourdomain.com
Value: _def456abc123.validation.acm.amazonaws.com
```

### **Step 3: Update Load Balancer for HTTPS**

```bash
# AWS Console → EC2 → Load Balancers → maglabs-alb → Listeners

# Add HTTPS Listener:
Protocol: HTTPS
Port: 443
Default Actions: Forward to frontend target group
Security Policy: ELBSecurityPolicy-TLS-1-2-2017-01
Certificate: Select your ACM certificate

# Update HTTP Listener:
Protocol: HTTP
Port: 80
Default Actions: Redirect to HTTPS
```

### **Step 4: Configure Route53**

```bash
# AWS Console → Route53 → Hosted Zones → Create Hosted Zone
Domain Name: yourdomain.com

# Create A record:
Record Name: (blank for root domain)
Record Type: A
Alias: Yes
Route Traffic To: Application Load Balancer
Region: US East (N. Virginia)
Load Balancer: maglabs-alb

# Create wildcard A record:
Record Name: *
Record Type: A
Alias: Yes
Route Traffic To: Application Load Balancer
Region: US East (N. Virginia)
Load Balancer: maglabs-alb
```

---

## 📊 Monitoring and Logging

### **Step 1: Create CloudWatch Log Groups**

```bash
aws logs create-log-group --log-group-name /ecs/maglabs-backend
aws logs create-log-group --log-group-name /ecs/maglabs-frontend
aws logs create-log-group --log-group-name /ecs/maglabs-nginx
```

### **Step 2: Set Up CloudWatch Alarms**

```bash
# High CPU Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MagLabs-High-CPU" \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database Connection Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "MagLabs-DB-Connections" \
  --alarm-description "Alarm when DB connections exceed 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### **Step 3: Set Up CloudWatch Dashboard**

```bash
# AWS Console → CloudWatch → Dashboards → Create Dashboard
Dashboard Name: MagLabs Production

# Add widgets for:
# - ECS CPU/Memory utilization
# - RDS performance metrics
# - ALB request counts and latency
# - S3 bucket metrics
```

---

## 🔧 Troubleshooting

### **Common Issues and Solutions**

#### **Issue 1: ECS Tasks Won't Start**

```bash
# Check task definition
aws ecs describe-task-definition --task-definition maglabs-backend

# Check service events
aws ecs describe-services --cluster maglabs-production --services backend

# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/maglabs-backend \
  --log-stream-name ecs/backend/task-id
```

**Common causes:**
- Wrong IAM permissions
- Incorrect environment variables
- Database connection issues
- Image pull failures

#### **Issue 2: Load Balancer Health Checks Failing**

```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-abc123

# Test connectivity from ALB to ECS
# Your health check endpoint should return 200 OK
```

#### **Issue 3: Database Connection Issues**

```bash
# Check security group allows PostgreSQL (port 5432)
# Check subnet routing
# Verify database is in same VPC
# Test connection from ECS task:

aws ecs execute-command \
  --cluster maglabs-production \
  --task task-id \
  --container backend \
  --interactive \
  --command "/bin/bash"

# Inside container:
psql -h maglabs-db.abc123.us-east-1.rds.amazonaws.com -U maglabs_admin -d maglabs_prod
```

#### **Issue 4: SSL Certificate Issues**

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:...

# Verify DNS validation records are correct
dig _validation.yourdomain.com CNAME

# Check load balancer listener configuration
aws elbv2 describe-listeners --load-balancer-arn arn:aws:elasticloadbalancing:...
```

### **Useful Debugging Commands**

```bash
# View ECS service details
aws ecs describe-services --cluster maglabs-production --services backend

# List running tasks
aws ecs list-tasks --cluster maglabs-production --service-name backend

# Get task details
aws ecs describe-tasks --cluster maglabs-production --tasks task-arn

# View logs in real-time
aws logs tail /ecs/maglabs-backend --follow

# Check load balancer target health
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

---

## 💰 Cost Optimization

### **Cost Breakdown (Monthly Estimates)**

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| **ECS Fargate** | 2 tasks × 0.5 vCPU × 1GB RAM | $35-50 |
| **RDS t3.micro** | Single AZ | $15-25 |
| **Application Load Balancer** | Always on | $18-25 |
| **NAT Gateway** | 1 gateway | $45-60 |
| **S3** | 100GB storage + transfers | $5-15 |
| **Route53** | Hosted zone + queries | $1-5 |
| **Data Transfer** | Depends on traffic | $10-50 |
| **Total** | | **$129-230/month** |

### **Cost Optimization Tips**

1. **Use Spot Instances for Development**
   ```bash
   # In ECS service, use Fargate Spot
   "capacityProviderStrategy": [
     {
       "capacityProvider": "FARGATE_SPOT",
       "weight": 100
     }
   ]
   ```

2. **Right-size Your Resources**
   ```bash
   # Start small and scale up:
   # - Use t3.micro for RDS initially
   # - Use 256 CPU / 512 MB for ECS tasks
   # - Monitor and adjust based on CloudWatch metrics
   ```

3. **Enable S3 Intelligent Tiering**
   ```bash
   # Automatically moves files to cheaper storage classes
   aws s3api put-bucket-intelligent-tiering-configuration \
     --bucket maglabs-prod-files-xyz \
     --id EntireBucket \
     --intelligent-tiering-configuration Id=EntireBucket,Status=Enabled,Filter={},Tierings=[{Days=1,AccessTier=ARCHIVE_ACCESS},{Days=90,AccessTier=DEEP_ARCHIVE_ACCESS}]
   ```

4. **Use Reserved Instances for Production**
   ```bash
   # For predictable workloads, buy 1-year Reserved Instances
   # Can save 30-50% compared to on-demand pricing
   ```

5. **Set Up Billing Alerts**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name "Billing-Alert" \
     --alarm-description "Alert when monthly bill exceeds $200" \
     --metric-name EstimatedCharges \
     --namespace AWS/Billing \
     --statistic Maximum \
     --period 86400 \
     --threshold 200 \
     --comparison-operator GreaterThanThreshold
   ```

---

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] AWS account created and configured
- [ ] IAM user with proper permissions
- [ ] VPC and subnets created
- [ ] RDS database running and accessible
- [ ] ECR repositories created
- [ ] ECS cluster created
- [ ] Load balancer configured
- [ ] SSL certificate validated
- [ ] Domain DNS configured

### **During Deployment**
- [ ] Docker images built and pushed to ECR
- [ ] ECS task definitions registered
- [ ] ECS services created and running
- [ ] Load balancer health checks passing
- [ ] Database migrations completed
- [ ] Static files uploaded to S3

### **Post-Deployment**
- [ ] Application accessible via domain
- [ ] HTTPS working correctly
- [ ] Multi-tenant routing functioning
- [ ] Database connections working
- [ ] File uploads working (S3)
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented

### **Testing Checklist**
- [ ] Frontend loads: https://tenant1.yourdomain.com
- [ ] API responds: https://yourdomain.com/api/health/
- [ ] Admin panel: https://yourdomain.com/admin/
- [ ] File uploads work
- [ ] Database operations function
- [ ] SSL certificate valid
- [ ] Load balancer distributing traffic
- [ ] Auto-scaling working (optional)

---

## 🆘 Getting Help

### **AWS Support Resources**
- **AWS Documentation**: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- **AWS Support Center**: In AWS Console → Support
- **AWS Community Forums**: [forums.aws.amazon.com](https://forums.aws.amazon.com)
- **Stack Overflow**: Tag questions with `amazon-web-services`

### **Common Support Cases**
1. **ECS Service Won't Start**: Usually IAM permissions or networking
2. **Database Connection Issues**: Security groups and VPC configuration
3. **SSL Certificate Problems**: DNS validation or load balancer configuration
4. **High Costs**: Resource optimization and billing analysis

### **Emergency Procedures**
```bash
# Stop all ECS services (emergency shutdown)
aws ecs update-service --cluster maglabs-production --service backend --desired-count 0

# Scale down RDS (stop database)
aws rds stop-db-instance --db-instance-identifier maglabs-db

# Check current costs
aws ce get-cost-and-usage --time-period Start=2024-06-01,End=2024-06-30 --granularity MONTHLY --metrics BlendedCost
```

Remember: AWS deployments are complex, but this guide covers everything step by step. Take your time, follow each step carefully, and don't hesitate to use AWS support if you get stuck!

---

## 🔄 Next Steps

After successful deployment:

1. **Set up automated backups**
2. **Implement blue-green deployments**
3. **Configure auto-scaling**
4. **Set up development/staging environments**
5. **Implement proper monitoring and alerting**
6. **Optimize costs based on usage patterns**

Good luck with your AWS deployment! 🚀