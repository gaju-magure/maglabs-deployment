#!/bin/bash

# Dependency Installation Script for Ubuntu 24.04
# This script installs all required packages for the nginx reverse proxy setup

set -e

echo "=== Installing Dependencies for Nginx Reverse Proxy ==="
echo "Target OS: Ubuntu 24.04"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo"
   exit 1
fi

# Check Ubuntu version
if ! lsb_release -r | grep -q "24.04"; then
    echo "Warning: This script is designed for Ubuntu 24.04"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 1
    fi
fi

# Update package list
echo "Updating package list..."
apt update

# Install nginx
echo "Installing nginx..."
apt install -y nginx

# Install certbot for Let's Encrypt
echo "Installing certbot and nginx plugin..."
apt install -y certbot python3-certbot-nginx

# Install ModSecurity dependencies (will compile from source)
echo "Installing ModSecurity build dependencies..."
apt install -y gcc make build-essential autoconf automake libtool \
    libcurl4-openssl-dev liblua5.3-dev libfuzzy-dev ssdeep gettext \
    pkg-config libgeoip-dev libyajl-dev doxygen libpcre3-dev \
    libpcre2-16-0 libpcre2-dev libpcre2-posix3 zlib1g zlib1g-dev git \
    libxml2-dev libmaxminddb-dev

# Install GeoIP databases
echo "Installing GeoIP databases..."
apt install -y geoip-database || {
    echo "Standard GeoIP packages not available, will download manually"
    mkdir -p /usr/share/GeoIP
}

# OWASP Core Rule Set will be installed by ModSecurity build script
echo "Note: OWASP Core Rule Set will be installed during ModSecurity compilation"

# Install additional utilities
echo "Installing additional utilities..."
apt install -y curl wget unzip fail2ban ufw

# Create self-signed certificate for default server block
echo "Creating self-signed certificate for default server..."
mkdir -p /etc/ssl/private
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=AE/ST=Dubai/L=Dubai/O=Default/CN=default.local"

# Set up fail2ban for nginx
echo "Configuring fail2ban for nginx..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

# Configure UFW firewall
echo "Configuring UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 443

# Enable services
echo "Enabling services..."
systemctl enable nginx
systemctl enable fail2ban
systemctl start fail2ban

# Create log directories
echo "Creating log directories..."
mkdir -p /var/log/modsecurity
chown www-data:www-data /var/log/modsecurity

# Set proper permissions
echo "Setting permissions..."
chmod +x /usr/local/bin/geoipupdate 2>/dev/null || true

echo
echo "=== Installation Complete ==="
echo "Installed packages:"
echo "  ✓ nginx"
echo "  ✓ certbot with nginx plugin"
echo "  ✓ ModSecurity build dependencies"
echo "  ✓ GeoIP databases"
echo "  ✓ fail2ban"
echo "  ✓ UFW firewall"
echo
echo "Services enabled:"
echo "  ✓ nginx"
echo "  ✓ fail2ban"
echo "  ✓ ufw (firewall)"
echo
echo "Next steps:"
echo "1. Compile ModSecurity: make build-modsecurity"
echo "2. Configure nginx: make configure"
echo "3. Setup SSL: make ssl"
echo "4. Deploy: make deploy"
echo
echo "Current nginx status:"
systemctl status nginx --no-pager -l