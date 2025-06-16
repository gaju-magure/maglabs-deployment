# 📚 MagLabs Documentation

Welcome to the simplified documentation for the MagLabs multi-tenant application. This documentation focuses on getting you up and running quickly.

## 📂 Documentation Structure

```
📁 docs/
├── 📖 README.md                          # This file - documentation index  
├── 🚀 EC2_DEPLOYMENT.md                  # Simple EC2 deployment guide
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

## 🚀 Quick Start

### **For Staging Deployment**
Get MagLabs running on EC2 for testing:

1. **[🚀 EC2 Deployment Guide](EC2_DEPLOYMENT.md)**
   - Launch EC2 instance
   - Simple setup script
   - One-command deployment
   - Access your staging environment

### **For Local Development**
Run MagLabs locally with Docker:

```bash
# Clone and setup
git clone <repository>
cd magure-app

# Copy environment file
cp .env.development .env

# Start services
docker-compose up -d

# Access application
open http://localhost
```

### **For Developers**
Technical reference for development:

2. **[👨‍💻 Developer Reference](development/DEVELOPER_REFERENCE.md)**
   - Technology stack overview
   - Codebase structure
   - Development workflows
   - Testing strategies
   - Debugging guides

---

## 📋 Common Tasks

### **🔧 Local Development**
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Stop services
docker-compose down
```

### **🚀 EC2 Staging Deployment**
```bash
# Initial setup (run once)
./setup-ec2.sh

# Deploy application
./deploy-ec2.sh

# View service status
docker-compose ps
```

### **🗃️ Database Operations**
```bash
# Create backup
docker-compose exec postgres pg_dump -U maglabs maglabs > backup.sql

# Run migrations
docker-compose exec backend python manage.py migrate

# Access admin
http://your-domain/admin/
```

---

## 🏗️ Architecture Overview

### **Simple Deployment Architecture**
```
🌐 Internet
    ↓
🔒 Nginx (Port 80/443)
    ↓
┌─────────────────┬─────────────────┐
│  🏪 React       │  🏭 Django      │
│  Frontend       │  Backend        │
│  (Container)    │  (Container)    │
└─────────────────┴─────────────────┘
         │                │
         ▼                ▼
🗄️ PostgreSQL Container
         │
         ▼
💾 Local File Storage
```

### **Key Components**
- **Frontend**: React with Vite
- **Backend**: Django with PostgreSQL
- **Database**: PostgreSQL in container
- **Reverse Proxy**: Nginx
- **Deployment**: Docker Compose on single EC2 instance

---

## 🔍 Quick Reference

### **Environment Files**
- `.env.development` - Local development
- `.env.ec2` - EC2 staging deployment
- `.env.production` - Production settings

### **Docker Compose Files**
- `docker-compose.yml` - Base configuration
- `docker-compose.ec2.yml` - EC2 overrides
- `docker-compose.production.yml` - Production overrides

### **Scripts**
- `setup-ec2.sh` - Initial EC2 server setup
- `deploy-ec2.sh` - Deploy application to EC2

### **Important URLs**
```bash
# Local development
Frontend:    http://localhost:3000
API:         http://localhost:8000/api/
Admin:       http://localhost:8000/admin/

# EC2 staging
Frontend:    http://your-ec2-ip/
API:         http://your-ec2-ip/api/
Admin:       http://your-ec2-ip/admin/
```

---

## 📞 Getting Help

### **Common Issues**
1. **Docker not starting**: Check if Docker daemon is running
2. **Database connection**: Verify environment variables
3. **Port conflicts**: Ensure ports 80, 443, 8000, 3000 are available
4. **Permission errors**: Check file permissions and Docker group membership

### **Troubleshooting**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart

# Reset everything (WARNING: loses data)
docker-compose down -v
./deploy-ec2.sh
```

---

## 🎯 What's Different

This simplified approach:
- ✅ **No complex CI/CD** - Simple deployment scripts
- ✅ **No AWS complexity** - Single EC2 instance
- ✅ **No multi-environment configs** - Just development and staging
- ✅ **Easy to understand** - Minimal moving parts
- ✅ **Quick to deploy** - Ready in 30 minutes
- ✅ **Migration ready** - Easy to move to Azure later

Perfect for staging environments and getting users access to test the application quickly!