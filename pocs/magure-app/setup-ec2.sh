#!/bin/bash

# 🚀 Simple EC2 Setup Script for MagLabs
# This script sets up a fresh Ubuntu EC2 instance for Docker deployment

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up EC2 instance for MagLabs deployment...${NC}"

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo -e "${BLUE}🔧 Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER

# Install additional tools
echo -e "${BLUE}🛠️ Installing additional tools...${NC}"
sudo apt install -y git nginx certbot python3-certbot-nginx unzip

# Create application directory
echo -e "${BLUE}📁 Creating application directory...${NC}"
sudo mkdir -p /opt/maglabs
sudo chown $USER:$USER /opt/maglabs

# Configure firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create swap file (helps with small instances)
echo -e "${BLUE}💾 Creating swap file...${NC}"
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Install Node.js (for frontend builds if needed)
echo -e "${BLUE}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo -e "${GREEN}✅ EC2 setup complete!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Clone your repository to /opt/maglabs/"
echo "2. Configure your .env.ec2 file"
echo "3. Run ./deploy-ec2.sh"
echo ""
echo -e "${BLUE}💡 Don't forget to:${NC}"
echo "- Configure your domain DNS to point to this instance"
echo "- Run 'sudo certbot --nginx' for SSL certificates"
echo "- Reboot to ensure docker group takes effect: sudo reboot"