# 🤖 GitHub Actions CI/CD Guide

This guide explains the simplified GitHub Actions workflows we've created for automatic testing and deployment of your MagLabs application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Workflow Files](#workflow-files)
3. [Setting Up GitHub Actions](#setting-up-github-actions)
4. [Understanding the Workflows](#understanding-the-workflows)
5. [Branch Strategy](#branch-strategy)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Our GitHub Actions setup provides:

- **✅ Automated Testing** - Runs tests on every push and PR
- **🏗️ Automated Building** - Builds Docker images when tests pass
- **🚀 Automated Deployment** - Deploys to different environments based on branch
- **🔒 Security Scanning** - Scans for vulnerabilities
- **🔔 Notifications** - Alerts when deployments succeed or fail

### **Workflow Architecture**
```
📝 Code Push
    ↓
🧪 Run Tests (Frontend + Backend)
    ↓
🏗️ Build Docker Images
    ↓
🔒 Security Scan
    ↓
🚀 Deploy to Environment
    ↓
✅ Health Check
    ↓
🔔 Notify Team
```

---

## 📁 Workflow Files

We've created three simplified workflow files:

### **1. Frontend CI/CD** (`.github/workflows/frontend-ci-cd.yml`)
```yaml
# 🎯 Purpose: Test and deploy React frontend
# 🚀 Triggers: Push to main/develop/staging with frontend changes
# 📦 Actions:
#   - Run Jest tests
#   - Build Docker image
#   - Deploy to appropriate environment
```

### **2. Backend CI/CD** (`.github/workflows/backend-ci-cd.yml`)
```yaml
# 🎯 Purpose: Test and deploy Django backend
# 🚀 Triggers: Push to main/develop/staging with backend changes
# 📦 Actions:
#   - Run pytest with PostgreSQL
#   - Check code formatting
#   - Build Docker image
#   - Security scan
#   - Deploy to appropriate environment
```

### **3. AWS Deployment** (`.github/workflows/deploy-to-aws.yml`)
```yaml
# 🎯 Purpose: Deploy full stack to AWS ECS
# 🚀 Triggers: Push to main branch or manual trigger
# 📦 Actions:
#   - Build all Docker images
#   - Push to Amazon ECR
#   - Update ECS services
#   - Wait for deployment
#   - Run health checks
```

---

## ⚙️ Setting Up GitHub Actions

### **Step 1: Repository Secrets**

Go to your GitHub repository → **Settings** → **Secrets and Variables** → **Actions**

Add these repository secrets:

#### **🔑 AWS Credentials**
```bash
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
AWS_SECRET_ACCESS_KEY=abcdef1234567890/ABCDEF1234567890abcdef12
AWS_REGION=us-east-1
```

#### **🗄️ Database Credentials**
```bash
DB_PASSWORD=your-production-database-password
SECRET_KEY=your-super-long-django-secret-key-50-characters-minimum
```

#### **🔌 API Keys**
```bash
MAGLABS_API_KEY=your-production-maglabs-api-key
```

#### **🔔 Notifications (Optional)**
```bash
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
DISCORD_WEBHOOK=https://discord.com/api/webhooks/123456789/abcdef...
```

### **Step 2: Environment Protection Rules**

Create protected environments for safer deployments:

#### **Go to: Repository → Settings → Environments**

Create these environments:

1. **🟢 development**
   ```yaml
   Protection Rules: None
   Deployment Branches: Any branch
   Auto-deploy: Yes
   ```

2. **🟡 staging**
   ```yaml
   Protection Rules: None
   Deployment Branches: staging, main
   Auto-deploy: Yes
   ```

3. **🔴 production**
   ```yaml
   Protection Rules:
   ☑️ Required reviewers: [Add team members]
   ☑️ Wait timer: 0 minutes
   Deployment Branches: main only
   Auto-deploy: Requires approval
   ```

### **Step 3: Configure Container Registry**

#### **Option A: GitHub Container Registry (Recommended)**
```bash
# Uses GitHub's built-in registry
# Images stored at: ghcr.io/your-username/repo-name/image-name
# No additional setup required
```

#### **Option B: Amazon ECR**
```bash
# Create ECR repositories:
aws ecr create-repository --repository-name maglabs-backend
aws ecr create-repository --repository-name maglabs-frontend
aws ecr create-repository --repository-name maglabs-nginx

# Add ECR permissions to your AWS IAM user:
# - AmazonEC2ContainerRegistryFullAccess
```

---

## 🔍 Understanding the Workflows

### **Frontend Workflow Deep Dive**

```yaml
name: Frontend CI/CD

# 🚀 When it runs
on:
  push:
    branches: [ main, develop, staging ]
    paths: [ 'frontend/**' ]           # Only when frontend files change
  pull_request:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  # ✅ Job 1: Test the code
  test:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
      
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: 📦 Install Dependencies
        working-directory: frontend
        run: npm ci
      
      - name: 🧪 Run Tests
        working-directory: frontend
        run: npm run test -- --coverage --watchAll=false
      
      - name: 🔍 Lint Code
        working-directory: frontend
        run: npm run lint

  # 🏗️ Job 2: Build Docker image (only on push)
  build:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
      
      - name: 🔐 Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: 🐳 Build and Push Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:${{ github.ref_name }}

  # 🚀 Job 3: Deploy to environment
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'production' || github.ref_name }}
    steps:
      - name: 🚀 Deploy to ${{ github.ref_name }}
        run: |
          echo "Deploying frontend to ${{ github.ref_name }} environment"
          # Add your deployment commands here
```

### **Backend Workflow Deep Dive**

```yaml
name: Backend CI/CD

jobs:
  # ✅ Job 1: Test with real PostgreSQL database
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
      
      - name: 🐍 Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: 📦 Install Dependencies
        working-directory: backend
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-django coverage black flake8
      
      - name: 🎨 Check Code Formatting
        working-directory: backend
        run: |
          black --check .
          flake8 . --max-line-length=88
      
      - name: 🧪 Run Tests
        working-directory: backend
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
          SECRET_KEY: test-secret-key
        run: |
          coverage run -m pytest
          coverage report
      
      - name: 🔍 Check Django Configuration
        working-directory: backend
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
          SECRET_KEY: test-secret-key
        run: |
          python manage.py check
          python manage.py makemigrations --check
```

### **AWS Deployment Workflow**

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]
  workflow_dispatch:                    # Manual deployment trigger
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options: ['staging', 'production']

jobs:
  # 🏗️ Job 1: Build and push to ECR
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4
      
      - name: 🔐 Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: 🔐 Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: 🏗️ Build and Push Images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          # Build backend
          docker build -t $ECR_REGISTRY/maglabs-backend:${{ github.sha }} ./backend
          docker push $ECR_REGISTRY/maglabs-backend:${{ github.sha }}
          
          # Build frontend
          docker build -t $ECR_REGISTRY/maglabs-frontend:${{ github.sha }} ./frontend
          docker push $ECR_REGISTRY/maglabs-frontend:${{ github.sha }}

  # 🚀 Job 2: Deploy to ECS
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    steps:
      - name: 🚀 Update ECS Service
        run: |
          aws ecs update-service \
            --cluster maglabs-production \
            --service backend \
            --force-new-deployment
      
      - name: ⏳ Wait for Deployment
        run: |
          aws ecs wait services-stable \
            --cluster maglabs-production \
            --services backend
```

---

## 🌱 Branch Strategy

Our workflows use a simple but effective branching strategy:

### **Branch → Environment Mapping**
```
🌱 Git Branches:
├── main → 🔴 production (requires approval)
├── staging → 🟡 staging (auto-deploy)
├── develop → 🟢 development (auto-deploy)
└── feature/* → ✅ tests only (no deployment)
```

### **Deployment Flow**
```
📝 Developer Workflow:

1. Create feature branch
   git checkout -b feature/new-awesome-feature
   
2. Make changes and commit
   git add .
   git commit -m "Add awesome feature"
   
3. Push feature branch (runs tests only)
   git push origin feature/new-awesome-feature
   ✅ Triggers: Tests only, no deployment
   
4. Merge to develop (deploy to dev)
   git checkout develop
   git merge feature/new-awesome-feature
   git push origin develop
   ✅ Triggers: Tests + Deploy to development
   
5. Merge to staging (deploy to staging)
   git checkout staging
   git merge develop
   git push origin staging
   ✅ Triggers: Tests + Deploy to staging
   
6. Merge to main (deploy to production)
   git checkout main
   git merge staging
   git push origin main
   ✅ Triggers: Tests + Deploy to production (with approval)
```

### **Manual Deployment**
```bash
# Sometimes you need to deploy manually:
# Repository → Actions → Deploy to AWS → Run workflow

# Options available:
Environment: staging | production
Branch: main (usually)
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **🚫 Issue: Secrets Not Found**
```bash
Error: "The request could not be satisfied"
Error: "AWS credentials not configured"

Solution:
1. Go to Repository → Settings → Secrets and Variables → Actions
2. Verify all required secrets are added:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - DB_PASSWORD
   - SECRET_KEY
3. Check secret names match exactly (case-sensitive)
```

#### **🚫 Issue: Tests Failing**
```bash
Error: "Test suite failed"
Error: "Jest encountered an unexpected token"

Solution:
1. Run tests locally first:
   cd frontend && npm test
   cd backend && python -m pytest
2. Fix failing tests
3. Commit and push fixes
4. Workflow will re-run automatically
```

#### **🚫 Issue: Docker Build Failing**
```bash
Error: "Error response from daemon: No such file or directory"
Error: "COPY failed: no source files were specified"

Solution:
1. Test Docker build locally:
   docker build -t test-frontend ./frontend
   docker build -t test-backend ./backend
2. Check Dockerfile paths and file existence
3. Verify .dockerignore isn't excluding required files
```

#### **🚫 Issue: AWS ECS Deployment Stuck**
```bash
Error: "Service deployment is stuck"
Error: "Health check failed"

Solution:
1. Check ECS service health:
   aws ecs describe-services --cluster maglabs-production --services backend
2. Check CloudWatch logs:
   aws logs tail /ecs/maglabs-backend --follow
3. Verify health check endpoints:
   curl -f https://your-domain.com/health/
4. Check security group rules allow health check traffic
```

#### **🚫 Issue: Environment Protection**
```bash
Error: "Environment protection rules failed"
Error: "Required reviewers not met"

Solution:
1. Go to Repository → Settings → Environments → production
2. Check protection rules
3. Add required reviewers to the environment
4. Ensure deployer has proper permissions
```

### **Debugging Steps**

#### **1. Check Workflow Logs**
```bash
# In GitHub:
1. Repository → Actions
2. Click on failed workflow run
3. Click on failed job
4. Expand failing step
5. Read detailed error logs
```

#### **2. Local Testing**
```bash
# Test locally before pushing:

# Frontend
cd frontend
npm install
npm test
npm run build

# Backend  
cd backend
pip install -r requirements.txt
python -m pytest
python manage.py check

# Docker
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

#### **3. AWS CLI Debugging**
```bash
# Check AWS permissions:
aws sts get-caller-identity

# Check ECS cluster:
aws ecs describe-clusters --clusters maglabs-production

# Check ECR repositories:
aws ecr describe-repositories

# Check recent deployments:
aws ecs describe-services --cluster maglabs-production --services backend
```

---

## 📊 Monitoring Workflows

### **GitHub Actions Usage**
```bash
# View usage in GitHub:
Repository → Settings → Billing and plans → Plans and usage

# Usage limits:
Free tier: 2,000 minutes/month (public repos)
           500 minutes/month (private repos)
Paid: $0.008/minute beyond free tier

# Typical workflow times:
Frontend workflow: ~5 minutes
Backend workflow: ~8 minutes
AWS deployment: ~10 minutes
Total per full deployment: ~23 minutes
```

### **Workflow Analytics**
```bash
# View workflow insights:
Repository → Insights → Actions

# Metrics available:
- Workflow run frequency
- Success/failure rates
- Duration trends
- Job performance
```

### **Notifications Setup**

#### **Slack Notifications**
```yaml
# Add to workflow files:
- name: 🔔 Notify Slack
  if: always()
  run: |
    if [ "${{ job.status }}" == "success" ]; then
      curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"✅ Deployment successful: ${{ github.repository }}"}' \
        ${{ secrets.SLACK_WEBHOOK }}
    else
      curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"❌ Deployment failed: ${{ github.repository }}"}' \
        ${{ secrets.SLACK_WEBHOOK }}
    fi
```

#### **Email Notifications**
```yaml
# Built-in GitHub notifications:
Repository → Settings → Notifications
☑️ Email notifications for workflow failures
```

---

## 🎯 Best Practices

### **1. Security**
```bash
✅ Do:
- Use repository secrets for sensitive data
- Enable environment protection for production
- Use least-privilege AWS IAM permissions
- Scan Docker images for vulnerabilities

❌ Don't:
- Put secrets in workflow files
- Use admin AWS credentials
- Skip security scans
- Allow direct pushes to main branch
```

### **2. Performance**
```bash
✅ Do:
- Use caching for dependencies (npm, pip)
- Run jobs in parallel when possible
- Use specific action versions (@v4, not @main)
- Optimize Docker builds with multi-stage builds

❌ Don't:
- Install dependencies in every job
- Run unnecessary workflows on every push
- Use heavy Docker base images
- Skip test caching
```

### **3. Reliability**
```bash
✅ Do:
- Include health checks in deployments
- Use matrix builds for different environments
- Implement proper error handling
- Set appropriate timeouts

❌ Don't:
- Deploy without testing
- Skip rollback procedures
- Ignore health check failures
- Use infinite retry loops
```

---

## 🔄 Customization Examples

### **Adding Slack Notifications**
```yaml
# Add this job to any workflow:
notify:
  name: 🔔 Notify Team
  runs-on: ubuntu-latest
  needs: [test, build, deploy]
  if: always()
  steps:
    - name: Send Slack Notification
      run: |
        STATUS="✅ Success"
        if [ "${{ needs.deploy.result }}" != "success" ]; then
          STATUS="❌ Failed"
        fi
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"$STATUS: Deployment of ${{ github.repository }} to ${{ github.ref_name }}\"}" \
          ${{ secrets.SLACK_WEBHOOK }}
```

### **Adding Code Quality Checks**
```yaml
# Add to backend workflow:
code-quality:
  name: 🔍 Code Quality
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install Quality Tools
      run: |
        pip install black flake8 mypy bandit safety
    - name: Run Quality Checks
      working-directory: backend
      run: |
        black --check .
        flake8 . --max-line-length=88
        mypy . --ignore-missing-imports
        bandit -r . -f json -o bandit-report.json
        safety check
```

### **Adding Performance Testing**
```yaml
# Add to any workflow:
performance-test:
  name: 🚀 Performance Test
  runs-on: ubuntu-latest
  needs: deploy
  steps:
    - name: Run Load Test
      run: |
        # Using Artillery.js for load testing
        npx artillery quick \
          --count 10 \
          --num 25 \
          https://your-staging-domain.com
```

---

This GitHub Actions setup provides a robust, automated deployment pipeline that grows with your team and ensures consistent, reliable deployments. The workflows are designed to be simple for beginners but powerful enough for production use.

Happy automating! 🤖🚀