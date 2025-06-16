# 📚 MagLabs Documentation

Welcome to the comprehensive documentation for the MagLabs multi-tenant application. This documentation is organized into different sections to help you understand, develop, and deploy the application.

## 📂 Documentation Structure

```
📁 docs/
├── 📖 README.md                          # This file - documentation index
├── 📁 deployment/                        # Deployment guides
│   ├── 🚀 DEPLOYMENT_GUIDE_FOR_BEGINNERS.md    # Complete beginner's guide
│   ├── 🚀 DEPLOYMENT_README.md                 # Technical deployment reference
│   └── 🚀 DEPLOYMENT.md                        # Legacy deployment docs
├── 📁 aws/                               # AWS-specific guides
│   └── ☁️ AWS_DEPLOYMENT_COMPLETE_GUIDE.md     # Step-by-step AWS deployment
├── 📁 architecture/                      # System architecture
│   ├── 🏗️ BACKEND_DATABASE_STORAGE_ARCHITECTURE.md  # Database design
│   └── 🔄 UI_TO_VLLM_PARAMETER_MAPPING.md           # API parameter mapping
├── 📁 development/                       # Development guides
│   ├── 👨‍💻 DEVELOPER_REFERENCE.md               # Comprehensive dev guide
│   └── 👤 USER_GUIDE.md                        # End-user guide
└── 📁 other/                            # Additional documentation
    ├── 💬 AI_CHAT_README.md                    # Chat system documentation
    ├── 🗣️ CONVERSATION_TYPES_EXPLAINED.md     # Conversation types
    ├── 📋 CHATGPT_IMPLEMENTATION_PLAN.md       # Implementation plan
    ├── 🐛 MAGLABS_API_ERROR_REPORT.md          # API error reports
    └── 📝 MAGLABS_API_FIXES_SUMMARY.md         # API fixes summary
```

---

## 🚀 Quick Start Guides

### **For Beginners**
Start here if you're new to Docker, AWS, or deployment:

1. **[📖 Complete Deployment Guide for Beginners](deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md)**
   - Step-by-step local development setup
   - Docker Compose explained in detail
   - Production deployment guide
   - GitHub Actions automation
   - Troubleshooting common issues

### **For AWS Deployment**
Step-by-step AWS infrastructure setup:

2. **[☁️ AWS Deployment Complete Guide](aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md)**
   - AWS account setup and IAM configuration
   - Infrastructure components (VPC, RDS, ECS, etc.)
   - Complete deployment process
   - Cost optimization tips
   - Monitoring and troubleshooting

### **For Developers**
Technical reference for development:

3. **[👨‍💻 Developer Reference](development/DEVELOPER_REFERENCE.md)**
   - Technology stack overview
   - Codebase structure
   - Development workflows
   - Testing strategies
   - Debugging guides

---

## 📋 Documentation by Use Case

### **🔧 Setting Up Development Environment**
```
1. Prerequisites → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#prerequisites
2. Local setup → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#local-development-setup
3. Docker guide → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#understanding-docker-compose
4. Dev workflows → development/DEVELOPER_REFERENCE.md#docker-development-workflow
```

### **🚀 Deploying to Production**
```
1. Environment prep → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#production-deployment
2. Docker setup → deployment/DEPLOYMENT_README.md#deployment-commands
3. Domain/SSL → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#domain-and-ssl-setup
4. Monitoring → deployment/DEPLOYMENT_README.md#monitoring--logging
```

### **☁️ AWS Cloud Deployment**
```
1. AWS account → aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#aws-account-setup
2. Infrastructure → aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#step-by-step-aws-infrastructure-setup
3. Application prep → aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#preparing-your-application
4. Deployment → aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#deployment-process
5. Monitoring → aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#monitoring-and-logging
```

### **🤖 Setting Up CI/CD**
```
1. GitHub Actions → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#automated-deployment-with-github-actions
2. Repository secrets → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#step-1-configure-repository-secrets
3. Environment protection → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#step-2-configure-environment-protection
4. Troubleshooting → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#troubleshooting-github-actions
```

### **🏗️ Understanding the Architecture**
```
1. System overview → architecture/BACKEND_DATABASE_STORAGE_ARCHITECTURE.md
2. Database design → architecture/BACKEND_DATABASE_STORAGE_ARCHITECTURE.md#django-models-structure
3. API mapping → architecture/UI_TO_VLLM_PARAMETER_MAPPING.md
4. Multi-tenancy → development/DEVELOPER_REFERENCE.md#multi-tenant-implementation
```

### **🐛 Troubleshooting Issues**
```
1. Common problems → deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#troubleshooting-common-issues
2. Docker issues → development/DEVELOPER_REFERENCE.md#debugging-guide
3. AWS problems → aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#troubleshooting
4. API errors → other/MAGLABS_API_ERROR_REPORT.md
```

---

## 🎯 Documentation by Skill Level

### **🟢 Beginner Level**
New to Docker, AWS, or web deployment:

- **Start with:** [Deployment Guide for Beginners](deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md)
- **Key sections:**
  - Understanding the Files
  - Local Development Setup
  - Understanding Docker Compose
  - Troubleshooting Common Issues

### **🟡 Intermediate Level**
Some experience with Docker and cloud deployment:

- **Start with:** [Deployment README](deployment/DEPLOYMENT_README.md)
- **Also read:** [AWS Deployment Complete Guide](aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md)
- **Key sections:**
  - Production Deployment
  - AWS Infrastructure Setup
  - GitHub Actions CI/CD

### **🔴 Advanced Level**
Experienced developers and DevOps engineers:

- **Start with:** [Developer Reference](development/DEVELOPER_REFERENCE.md)
- **Also read:** [Backend Architecture](architecture/BACKEND_DATABASE_STORAGE_ARCHITECTURE.md)
- **Key sections:**
  - Performance Optimization
  - Security Considerations
  - Multi-tenant Implementation
  - Cost Optimization

---

## 🔍 Quick Reference

### **Common Commands**
```bash
# Local development
./scripts/deploy.sh development
docker-compose ps
docker-compose logs backend

# Production deployment
./scripts/deploy.sh production
./scripts/backup.sh
./scripts/restore.sh --list-backups

# AWS deployment
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin
aws ecs update-service --cluster maglabs-production --service backend --force-new-deployment
```

### **Important URLs**
```bash
# Local development
http://tenant1.maglabs.local      # Frontend
http://tenant1.maglabs.api/api/   # API
http://tenant1.maglabs.api/admin/ # Admin

# Production
https://tenant1.yourdomain.com      # Frontend
https://yourdomain.com/api/         # API
https://yourdomain.com/admin/       # Admin
```

### **Key Environment Variables**
```bash
# Database
DB_HOST=postgres                    # Local: postgres, AWS: RDS endpoint
DB_NAME=maglabs                     # Database name
DB_USER=maglabs                     # Database user
DB_PASSWORD=secure-password         # Database password

# Django
SECRET_KEY=very-long-secret-key     # Django secret key
DEBUG=false                         # Disable in production
ALLOWED_HOSTS=yourdomain.com        # Your domain

# AWS (if using)
AWS_ACCESS_KEY_ID=AKIA...           # AWS access key
AWS_SECRET_ACCESS_KEY=secret...     # AWS secret key
AWS_STORAGE_BUCKET_NAME=bucket      # S3 bucket name
USE_S3=true                         # Enable S3 storage
```

---

## 📞 Getting Help

### **Where to Find Answers**

1. **First:** Check the relevant documentation section above
2. **Local Issues:** [Troubleshooting Common Issues](deployment/DEPLOYMENT_GUIDE_FOR_BEGINNERS.md#troubleshooting-common-issues)
3. **AWS Issues:** [AWS Troubleshooting](aws/AWS_DEPLOYMENT_COMPLETE_GUIDE.md#troubleshooting)
4. **Development Issues:** [Debugging Guide](development/DEVELOPER_REFERENCE.md#debugging-guide)

### **Documentation Update Process**

If you find errors or want to improve the documentation:

1. **Create an issue** describing the problem or improvement
2. **Submit a pull request** with your changes
3. **Follow the documentation style** (clear headings, code examples, step-by-step instructions)

### **Support Contacts**

- **Development Team**: dev-team@yourdomain.com
- **DevOps Team**: devops@yourdomain.com
- **Emergency Contact**: emergency@yourdomain.com

---

## 🔄 Document Versions

| Document | Last Updated | Version | Notes |
|----------|-------------|---------|-------|
| Deployment Guide for Beginners | 2024-06-16 | v2.0 | Added GitHub Actions, simplified |
| AWS Complete Guide | 2024-06-16 | v1.0 | New comprehensive AWS guide |
| Developer Reference | 2024-06-16 | v2.0 | Removed Redis/Celery, updated |
| Backend Architecture | 2024-06-16 | v1.1 | Updated for PostgreSQL-only |

---

## 🎉 Welcome to MagLabs!

This documentation is designed to get you up and running quickly, whether you're:

- 👨‍💻 **A developer** setting up the local environment
- 🚀 **A DevOps engineer** deploying to production
- ☁️ **A cloud architect** setting up AWS infrastructure
- 👤 **An end user** learning how to use the application

Choose your path above and get started! The documentation is organized to minimize complexity while providing comprehensive coverage of all deployment scenarios.

Happy coding! 🚀