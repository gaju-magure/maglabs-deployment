# MagLabs AWS EC2 Deployment Guide

## Quick Deployment Steps

### 1. Local Setup and Push
```bash
# From your local machine in pocs/magure-app directory
git checkout -b staging
git add .
git commit -m "feat: AWS EC2 deployment ready"
git push origin staging
```

### 2. Deploy to EC2
```bash
# SSH into EC2 instance
ssh -i ./maglasb-app-ssh.pem ubuntu@3.108.58.153

# Clone or update repository
cd /home/ubuntu
git clone -b staging https://github.com/magurelabs/maglabs-ideation.git maglabs-staging
# OR if already exists:
# cd maglabs-ideation && git fetch origin && git checkout staging && git pull origin staging

# Navigate to application directory
cd /home/ubuntu/maglabs-ideation/pocs/magure-app

# Deploy application
docker-compose down -v
docker-compose up -d --build

# Wait for services to start (2-3 minutes)
sleep 180

# Run bootstrap to create tenants and users
docker-compose exec backend python bootstrap.py
```

### 3. Access Application
- **Main Site**: http://3.108.58.153
- **Admin Panel**: http://admin.3.108.58.153/admin/
- **Demo Tenant**: http://demo.3.108.58.153

### Default Credentials
- **Admin**: admin / admin123
- **Demo**: demo / demo123

## Architecture
- **Backend**: Django with django-tenants (multi-tenant)
- **Frontend**: React with Vite
- **Database**: PostgreSQL with tenant isolation
- **Proxy**: Nginx with subdomain routing

## Troubleshooting
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Restart specific service
docker-compose restart [service_name]

# Full reset
docker-compose down -v && docker-compose up -d --build
```

## Environment Configuration
The application uses `.env.ec2` for EC2-specific configuration:
- Database: `maglabs_prod` database
- User: `maglabs_user` 
- Django settings: `config.settings.prod`
- Domain: Based on EC2 IP address