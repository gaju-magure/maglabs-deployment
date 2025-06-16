#!/bin/bash

# 🔧 EC2 Configuration Script for MagLabs
# This script configures environment variables for EC2 deployment

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 MagLabs EC2 Configuration Setup${NC}"
echo "This script will configure your environment for EC2 deployment."
echo ""

# Check if .env.ec2 exists and has real values
ENV_FILE=".env.ec2"
NEEDS_CONFIG=false

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️ .env.ec2 not found, will create it${NC}"
    NEEDS_CONFIG=true
elif grep -q "your-secure-database-password-here\|your-domain.com\|your-very-long-secret-key" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️ .env.ec2 has placeholder values, will update it${NC}"
    NEEDS_CONFIG=true
else
    echo -e "${GREEN}✅ .env.ec2 appears to be configured${NC}"
    read -p "Do you want to reconfigure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        NEEDS_CONFIG=true
    fi
fi

if [ "$NEEDS_CONFIG" = false ]; then
    echo -e "${GREEN}✅ Configuration is ready!${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📋 Configuration Setup${NC}"

# Auto-detect EC2 public IP
echo -e "${BLUE}🌐 Detecting EC2 public IP...${NC}"
EC2_IP=""

# Simple EC2 IP detection
echo "Attempting to get EC2 public IP..."

# Test if metadata service is accessible first
if curl -s --connect-timeout 3 http://169.254.169.254/ >/dev/null 2>&1; then
    echo "✅ Metadata service is accessible"
    EC2_IP=$(curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
    echo "Debug: Raw response: '${EC2_IP}'"
    echo "Debug: Response length: ${#EC2_IP}"
    
    # Clean up any whitespace/newlines
    EC2_IP=$(echo "$EC2_IP" | tr -d '\n\r' | xargs 2>/dev/null)
    echo "Debug: Cleaned response: '${EC2_IP}'"
else
    echo "❌ Cannot access EC2 metadata service"
    EC2_IP=""
fi

# Validate IP format
if [ -n "$EC2_IP" ] && [[ $EC2_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${GREEN}✅ Detected EC2 IP: ${EC2_IP}${NC}"
else
    if [ -n "$EC2_IP" ]; then
        echo -e "${YELLOW}⚠️ Got response but not valid IP: '${EC2_IP}'${NC}"
    else
        echo -e "${YELLOW}⚠️ Could not auto-detect EC2 IP${NC}"
    fi
    echo "This might happen if:"
    echo "- Not running on EC2"
    echo "- Network connectivity issues"
    echo "- Instance metadata service disabled"
    echo "- IMDSv2 tokens required"
    EC2_IP=""
fi

# Domain configuration
echo ""
echo -e "${BLUE}🌍 Domain Configuration${NC}"
echo "You can use either:"
echo "1. EC2 IP address (simple, for testing) - Recommended for first time"
echo "2. Custom domain (requires DNS setup)"
echo ""

DOMAIN_NAME=""
USE_CUSTOM_DOMAIN=""

if [ -n "$EC2_IP" ]; then
    echo "Detected IP: $EC2_IP"
    read -p "Use EC2 IP address for now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        DOMAIN_NAME="$EC2_IP"
        USE_CUSTOM_DOMAIN="false"
        echo -e "${GREEN}✅ Using IP-based configuration: ${EC2_IP}${NC}"
    else
        # User chose not to use IP, ask for custom domain
        echo "Enter your custom domain name (e.g., yourdomain.com):"
        read -p "Domain: " DOMAIN_NAME
        USE_CUSTOM_DOMAIN="true"
        
        if [ -z "$DOMAIN_NAME" ]; then
            echo -e "${RED}❌ Domain name is required${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Using custom domain: ${DOMAIN_NAME}${NC}"
    fi
else
    # No EC2 IP detected, ask user for input
    echo -e "${YELLOW}Could not auto-detect EC2 IP.${NC}"
    echo "Please choose:"
    echo "1. Enter your EC2 public IP manually"
    echo "2. Enter a custom domain name"
    echo ""
    read -p "Enter IP address or domain name: " DOMAIN_NAME
    
    if [ -z "$DOMAIN_NAME" ]; then
        echo -e "${RED}❌ Domain or IP address is required${NC}"
        exit 1
    fi
    
    # Check if it looks like an IP address
    if [[ $DOMAIN_NAME =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        USE_CUSTOM_DOMAIN="false"
        echo -e "${GREEN}✅ Using IP-based configuration: ${DOMAIN_NAME}${NC}"
    else
        USE_CUSTOM_DOMAIN="true"
        echo -e "${GREEN}✅ Using custom domain: ${DOMAIN_NAME}${NC}"
    fi
fi

# Generate secure passwords and keys
echo ""
echo -e "${BLUE}🔐 Generating secure credentials...${NC}"

# Generate database password (20 chars, alphanumeric)
DB_PASSWORD=$(openssl rand -base64 20 | tr -d "=+/" | cut -c1-20)

# Generate Django secret key (50 chars)
SECRET_KEY=$(openssl rand -base64 75 | tr -d "=+/" | cut -c1-50)

# MagLabs API Key
echo ""
echo -e "${BLUE}🤖 MagLabs API Configuration${NC}"
read -p "Enter your MagLabs API key (or press Enter to skip for now): " MAGLABS_API_KEY
if [ -z "$MAGLABS_API_KEY" ]; then
    MAGLABS_API_KEY="your-maglabs-api-key-here"
    echo -e "${YELLOW}⚠️ You can update MAGLABS_API_KEY in .env.ec2 later${NC}"
fi

# Email configuration (optional)
echo ""
echo -e "${BLUE}📧 Email Configuration (Optional)${NC}"
read -p "Enter SMTP email host (or press Enter to skip): " EMAIL_HOST
if [ -z "$EMAIL_HOST" ]; then
    EMAIL_HOST="smtp.gmail.com"
    EMAIL_HOST_USER="your-email@gmail.com"
    EMAIL_HOST_PASSWORD="your-app-password"
    DEFAULT_FROM_EMAIL="noreply@localhost"
    echo -e "${YELLOW}⚠️ Using default email settings (update .env.ec2 later if needed)${NC}"
else
    read -p "Email username: " EMAIL_HOST_USER
    read -s -p "Email password: " EMAIL_HOST_PASSWORD
    echo
    read -p "From email address: " DEFAULT_FROM_EMAIL
fi

# Set up CORS and allowed hosts based on domain type
if [ "$USE_CUSTOM_DOMAIN" = "true" ]; then
    ALLOWED_HOSTS="localhost,127.0.0.1,${DOMAIN_NAME},*.${DOMAIN_NAME},api.${DOMAIN_NAME},admin.${DOMAIN_NAME}"
    CORS_ORIGINS="http://localhost,https://localhost,http://${DOMAIN_NAME},https://${DOMAIN_NAME},https://api.${DOMAIN_NAME},https://admin.${DOMAIN_NAME}"
    FRONTEND_API_URL="https://${DOMAIN_NAME}/api"
    FRONTEND_WS_URL="wss://${DOMAIN_NAME}/ws"
    SSL_ENABLED="true"
    SECURE_SSL_REDIRECT="true"
else
    # IP-based configuration (no SSL for simplicity)
    ALLOWED_HOSTS="localhost,127.0.0.1,${DOMAIN_NAME}"
    CORS_ORIGINS="http://localhost,http://${DOMAIN_NAME},http://${DOMAIN_NAME}:80"
    FRONTEND_API_URL="http://${DOMAIN_NAME}/api"
    FRONTEND_WS_URL="ws://${DOMAIN_NAME}/ws"
    SSL_ENABLED="false"
    SECURE_SSL_REDIRECT="false"
fi

# Create .env.ec2 file
echo ""
echo -e "${BLUE}📝 Creating configuration file...${NC}"

cat > "$ENV_FILE" << EOF
# EC2 Environment Configuration - Generated $(date)
# This file contains actual values, not placeholders

# Environment
ENVIRONMENT=production
DEBUG=false

# Database Configuration
DB_NAME=maglabs_prod
DB_USER=maglabs_user
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=postgres
DB_PORT=5432

# Domain Configuration
DOMAIN_NAME=${DOMAIN_NAME}
USE_CUSTOM_DOMAIN=${USE_CUSTOM_DOMAIN}

# Django Settings
SECRET_KEY=${SECRET_KEY}
ALLOWED_HOSTS=${ALLOWED_HOSTS}

# CORS Configuration
CORS_ALLOWED_ORIGINS=${CORS_ORIGINS}

# MagLabs AI API Configuration
MAGLABS_API_URL=http://localhost:8001
MAGLABS_API_KEY=${MAGLABS_API_KEY}

# Frontend Configuration
FRONTEND_API_URL=${FRONTEND_API_URL}
FRONTEND_WS_URL=${FRONTEND_WS_URL}

# Email Configuration
EMAIL_HOST=${EMAIL_HOST}
EMAIL_PORT=587
EMAIL_HOST_USER=${EMAIL_HOST_USER}
EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
EMAIL_USE_TLS=true
DEFAULT_FROM_EMAIL=${DEFAULT_FROM_EMAIL}

# File Storage (local for EC2)
USE_S3=false

# Logging
LOG_LEVEL=INFO

# Multi-tenant Configuration
TENANT_DOMAINS=${DOMAIN_NAME}

# SSL Configuration
SSL_ENABLED=${SSL_ENABLED}
SECURE_SSL_REDIRECT=${SECURE_SSL_REDIRECT}
SECURE_HSTS_SECONDS=31536000
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https

# Session Security
SESSION_COOKIE_SECURE=${SSL_ENABLED}
CSRF_COOKIE_SECURE=${SSL_ENABLED}
EOF

echo -e "${GREEN}✅ Configuration file created: ${ENV_FILE}${NC}"

# Show summary
echo ""
echo -e "${GREEN}🎉 Configuration Summary:${NC}"
echo "Domain: ${DOMAIN_NAME}"
echo "SSL Enabled: ${SSL_ENABLED}"
echo "Database Password: ${DB_PASSWORD:0:4}****${DB_PASSWORD: -4}"
echo "Django Secret: ${SECRET_KEY:0:8}****"
echo ""

if [ "$USE_CUSTOM_DOMAIN" = "true" ]; then
    echo -e "${BLUE}📋 Next Steps for Custom Domain:${NC}"
    echo "1. Point your DNS records to this EC2 IP:"
    if [ -n "$EC2_IP" ]; then
        echo "   A    ${DOMAIN_NAME}     -> ${EC2_IP}"
        echo "   A    *.${DOMAIN_NAME}  -> ${EC2_IP}"
    else
        echo "   A    ${DOMAIN_NAME}     -> YOUR_EC2_IP"
        echo "   A    *.${DOMAIN_NAME}  -> YOUR_EC2_IP"
    fi
    echo "2. Run: ./deploy-ec2.sh"
    echo "3. Set up SSL: sudo certbot --nginx -d ${DOMAIN_NAME} -d *.${DOMAIN_NAME}"
else
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Run: ./deploy-ec2.sh"
    echo "2. Access your app at: http://${DOMAIN_NAME}/"
    echo ""
    echo -e "${YELLOW}💡 To upgrade to custom domain later:${NC}"
    echo "   Run this script again and choose custom domain option"
fi

echo ""
echo -e "${GREEN}✅ Configuration complete! Ready for deployment.${NC}"