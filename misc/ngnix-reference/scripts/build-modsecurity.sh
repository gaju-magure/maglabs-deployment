#!/bin/bash

# ModSecurity Compilation Script for Ubuntu 24.04
# This script compiles ModSecurity v3 and the nginx connector from source

set -e

BUILD_DIR="/opt/modsecurity-build"
NGINX_VERSION=""
MODSECURITY_DIR="/opt/ModSecurity"
CONNECTOR_DIR="/opt/ModSecurity-nginx"

echo "=== ModSecurity v3 Compilation Script ==="
echo "Target: Ubuntu 24.04 with Nginx"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo"
   exit 1
fi

# Get nginx version
if ! command -v nginx &> /dev/null; then
    echo "Error: nginx is not installed. Please install nginx first."
    exit 1
fi

NGINX_VERSION=$(nginx -v 2>&1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
echo "Detected nginx version: $NGINX_VERSION"

# Create build directory
mkdir -p $BUILD_DIR
cd $BUILD_DIR

echo
echo "=== Step 1: Compiling ModSecurity Library ==="

# Remove existing directory if it exists
if [ -d "$MODSECURITY_DIR" ]; then
    echo "Removing existing ModSecurity directory..."
    rm -rf $MODSECURITY_DIR
fi

# Clone ModSecurity
echo "Cloning ModSecurity repository..."
git clone --depth 1 https://github.com/owasp-modsecurity/ModSecurity.git $MODSECURITY_DIR
cd $MODSECURITY_DIR

# Initialize and update submodules
echo "Initializing submodules..."
git submodule init
git submodule update

# Build ModSecurity
echo "Building ModSecurity library..."
./build.sh
./configure --with-pcre2
make -j$(nproc)
make install

# Update library cache
ldconfig

echo "✓ ModSecurity library compiled and installed"

echo
echo "=== Step 2: Compiling ModSecurity-nginx Connector ==="

cd $BUILD_DIR

# Remove existing connector directory if it exists
if [ -d "$CONNECTOR_DIR" ]; then
    echo "Removing existing connector directory..."
    rm -rf $CONNECTOR_DIR
fi

# Clone ModSecurity-nginx connector
echo "Cloning ModSecurity-nginx connector..."
git clone --depth 1 https://github.com/owasp-modsecurity/ModSecurity-nginx.git $CONNECTOR_DIR

# Download nginx source
echo "Downloading nginx source v$NGINX_VERSION..."
wget -q https://nginx.org/download/nginx-$NGINX_VERSION.tar.gz
tar -xzf nginx-$NGINX_VERSION.tar.gz
cd nginx-$NGINX_VERSION

# Get nginx configure arguments and filter out problematic ones
echo "Getting nginx build configuration..."
NGINX_ARGS=$(nginx -V 2>&1 | grep "configure arguments:" | sed "s/configure arguments://" | \
    sed 's/--with-cc-opt=[^ ]*//' | \
    sed 's/--with-ld-opt=[^ ]*//' | \
    sed 's/-O[0-9]//' | \
    sed 's/-g//')

# Configure nginx with ModSecurity module (use minimal config for module building)
echo "Configuring nginx with ModSecurity module..."
./configure --with-compat --add-dynamic-module=$CONNECTOR_DIR

# Build only the modules
echo "Building ModSecurity module..."
make modules -j$(nproc)

# Install the module
echo "Installing ModSecurity module..."
cp objs/ngx_http_modsecurity_module.so /usr/lib/nginx/modules/
chmod 644 /usr/lib/nginx/modules/ngx_http_modsecurity_module.so

echo "✓ ModSecurity-nginx module compiled and installed"

echo
echo "=== Step 3: Installing OWASP Core Rule Set ==="

CRS_DIR="/etc/nginx/modsecurity-crs"
mkdir -p $CRS_DIR

# Download OWASP CRS
echo "Downloading OWASP Core Rule Set..."
cd $BUILD_DIR
wget -q https://github.com/coreruleset/coreruleset/archive/refs/heads/main.zip -O crs.zip
unzip -q crs.zip
mv coreruleset-main/* $CRS_DIR/
rm -rf coreruleset-main crs.zip

# Setup CRS configuration
cd $CRS_DIR
cp crs-setup.conf.example crs-setup.conf

echo "✓ OWASP Core Rule Set installed"

echo
echo "=== Step 4: Setting up ModSecurity Configuration ==="

# Copy recommended configuration
echo "Setting up ModSecurity configuration..."
cp $MODSECURITY_DIR/modsecurity.conf-recommended /etc/nginx/modsecurity.conf
cp $MODSECURITY_DIR/unicode.mapping /etc/nginx/unicode.mapping

# Enable ModSecurity
sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/nginx/modsecurity.conf

# Set proper ownership
chown -R root:root /etc/nginx/modsecurity*
chown -R root:root $CRS_DIR

# Create ModSecurity log directory
mkdir -p /var/log/modsecurity
chown www-data:www-data /var/log/modsecurity

echo "✓ ModSecurity configuration completed"

echo
echo "=== Step 5: Creating nginx module configuration ==="

# Create module configuration file
cat > /etc/nginx/modules-available/50-mod-http-modsecurity.conf << 'EOF'
# ModSecurity dynamic module
load_module modules/ngx_http_modsecurity_module.so;
EOF

# Enable the module
ln -sf /etc/nginx/modules-available/50-mod-http-modsecurity.conf /etc/nginx/modules-enabled/

echo "✓ nginx module configuration created"

echo
echo "=== Step 6: Testing Configuration ==="

# Test nginx configuration
echo "Testing nginx configuration..."
if nginx -t; then
    echo "✓ nginx configuration test passed"
else
    echo "✗ nginx configuration test failed"
    exit 1
fi

# Clean up build directory
echo "Cleaning up build files..."
rm -rf $BUILD_DIR/nginx-$NGINX_VERSION*
rm -rf $BUILD_DIR/*.zip

echo
echo "=== ModSecurity Compilation Complete ==="
echo
echo "Installation Summary:"
echo "  ✓ ModSecurity v3 library compiled and installed"
echo "  ✓ ModSecurity-nginx module built and installed"
echo "  ✓ OWASP Core Rule Set v4 installed"
echo "  ✓ Configuration files created"
echo "  ✓ nginx module enabled"
echo
echo "Module location: /usr/lib/nginx/modules/ngx_http_modsecurity_module.so"
echo "Configuration: /etc/nginx/modsecurity.conf"
echo "CRS Rules: /etc/nginx/modsecurity-crs/"
echo "Logs: /var/log/modsecurity/"
echo
echo "Next steps:"
echo "1. Configure your nginx sites to use ModSecurity"
echo "2. Restart nginx: systemctl restart nginx"
echo "3. Check logs: tail -f /var/log/modsecurity/modsec_audit.log"
echo
echo "Build completed successfully!"