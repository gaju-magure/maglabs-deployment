# 🚀 EC2 Deployment Guide with GitHub Actions

This guide will help you deploy MagLabs to EC2 with automated GitHub Actions deployment, persistent database storage, and multi-tenant subdomain routing.

## 📋 Prerequisites

- AWS account with EC2 access
- Basic command line knowledge
- GitHub repository with Actions enabled (optional - for automated deployments)
- Domain name (optional - for custom domain setup)

## 🖥️ Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. **AMI**: Ubuntu Server 22.04 LTS
3. **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
4. **Key Pair**: Create new or use existing
5. **Security Groups**: Create new with these rules:
   - SSH (22) - Your IP
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
   - Custom (8000) - Anywhere (for testing)
6. **Storage**: 20GB gp3
7. Launch instance

### 1.2 Connect to Instance

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## 🔧 Step 2: Setup Server

### 2.1 Run Setup Script

```bash
# Clone repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Run setup script
chmod +x setup-ec2.sh
./setup-ec2.sh

# Reboot to apply docker group changes
sudo reboot
```

### 2.2 Reconnect After Reboot

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd your-repo
```

## 🚀 Step 3: Deploy Application (One Command!)

### 3.1 Single Command Deployment

```bash
# ONE COMMAND DOES EVERYTHING!
./deploy-ec2.sh
```

**This automatically:**

- ✅ **Runs configuration wizard** if needed (auto-detects EC2 IP)
- ✅ **Generates secure passwords** and Django secret keys
- ✅ **Creates database** initialization scripts
- ✅ **Chooses nginx config** (IP-based by default)
- ✅ **Builds and starts** all Docker containers
- ✅ **Sets up PostgreSQL** database and user
- ✅ **Runs migrations** and creates admin user (admin/admin123)
- ✅ **Shows access URLs** for your application

### 3.2 What the Configuration Wizard Asks


**Automatic Detection:**

- ✅ **EC2 IP Address** - Auto-detected and used as default
- ✅ **Secure Passwords** - Auto-generated for database and Django

**User Input Required:**

- **Domain Choice**: Use EC2 IP (simple) or custom domain (advanced)
- **MagLabs API Key**: Your API key (can be added later)
- **Email Settings**: SMTP settings (optional, can skip)

**💡 Recommended for first-time: Choose IP-based setup!**

## ✅ Step 4: Access Your Application

### 4.1 Verify Deployment

```bash
# Check service status
docker-compose ps

# Test health endpoint
curl http://YOUR-EC2-IP/health
```

### 4.2 Access URLs

**The deployment script shows your exact URLs:**

- 🌍 **Main Site**: `http://YOUR-EC2-IP/`
- 🔌 **API**: `http://YOUR-EC2-IP/api/`
- ⚙️ **Admin**: `http://YOUR-EC2-IP/admin/`

**Default admin login:**

- Username: `admin`
- Password: `admin123`

### 4.3 Test Your Application

```bash
# Open in browser (replace with your actual IP)
open http://YOUR-EC2-IP/

# Test API health
curl http://YOUR-EC2-IP/api/health/

# Access admin panel
open http://YOUR-EC2-IP/admin/
```

## 🤖 Step 5: Setup GitHub Actions (Optional - For Automated Deployments)

### 5.1 Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets → Actions and add:

```bash
EC2_HOST=your-ec2-public-ip
EC2_USERNAME=ubuntu
EC2_KEY=your-private-key-content  # Copy entire private key file
DEPLOY_PATH=/opt/maglabs          # Optional, defaults to /opt/maglabs
```

**✅ That's it! No more manual deployments needed.**

### 5.2 How Automated Deployments Work

**Automatic Triggers:**

- Push to `main` branch → Automatic deployment
- Pull request merge → Automatic deployment

**Manual Trigger:**

- Go to GitHub → Actions tab
- Click "Deploy to EC2" workflow
- Click "Run workflow" button

## 🌐 Step 6: Upgrade to Custom Domain (Optional - For Production)

### 6.1 When to Use Custom Domain

**Stick with IP if:**

- ✅ Testing/staging environment
- ✅ Quick demo or proof of concept
- ✅ Internal team access only

**Upgrade to domain if:**

- 🚀 Production deployment
- 🚀 Public-facing application
- 🚀 Need SSL/HTTPS
- 🚀 Multi-tenant subdomains

### 6.2 DNS Configuration

**Point these DNS records to your EC2 IP:**

```
A     yourdomain.com          → YOUR-EC2-IP
A     *.yourdomain.com        → YOUR-EC2-IP  (wildcard for subdomains)
A     api.yourdomain.com      → YOUR-EC2-IP
A     admin.yourdomain.com    → YOUR-EC2-IP
```

### 6.3 SSL Certificate Setup

```bash
# Install certbot and get wildcard SSL certificate
sudo certbot certonly --dns-route53 -d yourdomain.com -d *.yourdomain.com
# OR use manual DNS challenge
sudo certbot certonly --manual -d yourdomain.com -d *.yourdomain.com
```

### 6.4 Reconfigure for Domain

```bash
# Run configuration again to switch to domain mode
./configure-ec2.sh
# Choose "Custom Domain" option this time
# Then redeploy
./deploy-ec2.sh
```

### 6.5 Access Your Multi-Tenant Application

**Production URLs:**

- **Main Site**: `https://yourdomain.com/`
- **API Endpoint**: `https://api.yourdomain.com/api/`
- **Admin Panel**: `https://admin.yourdomain.com/`
- **Tenant Sites**: `https://tenant1.yourdomain.com/`
- **Demo Site**: `https://demo.yourdomain.com/`

## 🔄 Daily Operations (All Automated!)

### Deploying Updates

**🎯 Normal Process (Recommended):**

```bash
# Just push your changes - deployment happens automatically!
git add .
git commit -m "Your changes"
git push origin main
# ✅ GitHub Actions deploys automatically
```

**🆘 Manual Trigger (if needed):**

- Go to GitHub → Actions → "Deploy to EC2" → "Run workflow"

### Monitoring & Troubleshooting

**View Deployment Status:**

- GitHub → Actions tab → See deployment progress in real-time

**SSH for Emergency Access:**

```bash
# Only needed for troubleshooting
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /opt/maglabs

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart services (emergency only)
docker-compose restart
```

### Database Operations

**Automated Backup (recommended):**

```bash
# Create timestamped backup with compression
./scripts/backup-db.sh
```

**Manual Backup:**

```bash
# Create backup
docker-compose exec postgres pg_dump -U maglabs_user maglabs_prod > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U maglabs_user maglabs_prod
```

**View Backups:**

```bash
# List all backups
ls -la backups/

# Restore specific backup
gunzip -c backups/maglabs_backup_20240616_143022.sql.gz | docker-compose exec -T postgres psql -U maglabs_user
```

## 🆘 Emergency Manual Override

**⚠️ Only use these if GitHub Actions fails:**

### Manual Deployment

```bash
# SSH into server
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /opt/maglabs

# Manual deployment
git pull origin main
./deploy-ec2.sh
```

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
sudo systemctl status docker

# Check disk space
df -h

# Rebuild images
docker-compose build --no-cache
```

### Database Connection Issues

```bash
# Check postgres logs
docker-compose logs postgres

# Reset database (WARNING: loses data)
docker-compose down -v
./deploy-ec2.sh
```

### Can't Access Application

```bash
# Check security groups allow HTTP/HTTPS
# Check nginx status
docker-compose logs nginx

# Test internally
curl localhost
```

## 🏗️ Architecture Overview

### Multi-Tenant Subdomain Routing

```
🌐 Internet
    ↓
🔒 Nginx SSL Termination (Port 443)
    ├── yourdomain.com → Frontend
    ├── api.yourdomain.com → Django API
    ├── admin.yourdomain.com → Django Admin
    └── *.yourdomain.com → Tenant Frontend
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
💾 Host-Mounted Persistent Storage
```

### Key Features

- ✅ **Persistent Database**: Data survives container restarts
- ✅ **Automated Backups**: Timestamped, compressed backups
- ✅ **SSL/HTTPS**: Let's Encrypt certificates
- ✅ **Multi-Tenant**: Subdomain-based tenant isolation
- ✅ **GitHub Actions**: Automated deployment pipeline
- ✅ **Zero Downtime**: Rolling deployments with health checks

## 💰 Cost Estimation

**Monthly costs for t3.medium:**

- EC2 Instance: ~$30-40/month
- Storage (20GB): ~$2/month
- Data Transfer: ~$1-5/month
- **Total**: ~$35-50/month

## 🔒 Security Notes

- Always use strong passwords
- Keep system updated: `sudo apt update && sudo apt upgrade`
- Use SSH keys, not passwords
- Consider VPN for admin access
- Backup your data regularly

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify environment variables in `.env.ec2`
3. Ensure security groups are correct
4. Check disk space: `df -h`

## 🚀 Understanding Your Automated Deployment

### What Happens on Every Git Push

```
📝 You: git push origin main
     ↓
🤖 GitHub Actions:
  1. 💾 Backup existing database
  2. 🏗️ Build latest Docker images  
  3. 🚀 Deploy with zero downtime
  4. 🗃️ Run database migrations
  5. 📦 Collect static files
  6. 🏥 Health check all services
  7. ✅ Send success notification
     ↓
🌐 Your app: Updated automatically!
```

### Deployment Monitoring

**Real-time Status:**

- GitHub → Actions tab → See live deployment progress
- Get email notifications on success/failure

**Quick Health Check:**

```bash
# Check if everything is running (from anywhere)
curl https://yourdomain.com/health
curl https://api.yourdomain.com/health/
```

### Rollback Strategy

If something goes wrong:

1. **Revert your commit** in GitHub
2. **Push the revert** → Automatic rollback deployment
3. **Or trigger manual deployment** with previous working commit

---

## 🎯 What You Get

✅ **Fully Automated**: Push code → Auto-deploy (no manual work!)
✅ **Zero Downtime**: Rolling deployments with health checks
✅ **Production-Ready**: SSL, backups, monitoring
✅ **Multi-Tenant**: Subdomain-based tenant isolation
✅ **Persistent Data**: Database survives all deployments
✅ **Auto-Backups**: Every deployment backs up your data
✅ **Secure**: HTTPS, rate limiting, security headers
✅ **Scalable**: Easy to migrate to managed services

---

## 📋 Quick Summary

**🚀 Basic Setup (10 minutes):**

1. Launch EC2 instance
2. Clone repo and run `./setup-ec2.sh`
3. Run `./deploy-ec2.sh` (handles everything automatically!)
4. Access your app at `http://YOUR-EC2-IP/`

**🤖 Optional: Automated Deployments:**

- Configure GitHub secrets
- Push code → auto-deploy

**🌐 Optional: Custom Domain:**

- Set up DNS records
- Run `./configure-ec2.sh` again
- Choose domain option and redeploy

**Daily Operations:**

```bash
git push origin main  # Auto-deploys if GitHub Actions configured
# OR
./deploy-ec2.sh      # Manual deployment
```

This setup is perfect for staging and production deployments up to moderate scale. For enterprise scale, consider managed services like RDS, ELB, and ECS.
