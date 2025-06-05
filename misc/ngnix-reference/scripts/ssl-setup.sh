#!/bin/bash

# SSL Setup Script for Let's Encrypt
# Usage: ./ssl-setup.sh [domain] [email]

set -e

DOMAIN=${1:-maglabs.cloud}
EMAIL=${2:-admin@$DOMAIN}
WEBROOT="/var/www/html"

echo "=== Let's Encrypt SSL Setup Script ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo"
   exit 1
fi

# Check if domain is reachable
echo "Checking if domain $DOMAIN is reachable..."
if ! nslookup $DOMAIN > /dev/null 2>&1; then
    echo "Warning: Domain $DOMAIN may not be properly configured in DNS"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 1
    fi
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily for standalone mode if needed
systemctl stop nginx

# Create temporary nginx config for challenge
mkdir -p $WEBROOT
cat > /etc/nginx/sites-available/temp-ssl << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

ln -sf /etc/nginx/sites-available/temp-ssl /etc/nginx/sites-enabled/temp-ssl
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/$DOMAIN

# Start nginx with temporary config
systemctl start nginx

# Get SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

# Remove temporary config
rm -f /etc/nginx/sites-enabled/temp-ssl

# Enable the main site config
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

# Test nginx configuration
nginx -t

# Restart nginx with SSL config
systemctl restart nginx

# Set up automatic renewal
echo "Setting up automatic SSL renewal..."
cat > /etc/systemd/system/certbot-renewal.service << EOF
[Unit]
Description=Certbot Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

cat > /etc/systemd/system/certbot-renewal.timer << EOF
[Unit]
Description=Run certbot renewal twice daily
Requires=certbot-renewal.service

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable certbot-renewal.timer
systemctl start certbot-renewal.timer

echo
echo "=== SSL Setup Complete ==="
echo "Certificate installed for: $DOMAIN"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Automatic renewal enabled via systemd timer"
echo
echo "Testing SSL configuration..."
if curl -s -I https://$DOMAIN | grep -q "200 OK"; then
    echo "✓ SSL is working correctly"
else
    echo "⚠ SSL test failed - please check manually"
fi

echo
echo "Certificate information:"
certbot certificates -d $DOMAIN