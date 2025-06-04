#!/bin/bash

# GeoIP Database Update Script
# This script downloads and updates GeoIP databases

set -e

GEOIP_DIR="/usr/share/GeoIP"
TEMP_DIR="/tmp/geoip-update"
BACKUP_DIR="/usr/share/GeoIP/backup"

echo "=== GeoIP Database Update Script ==="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo"
   exit 1
fi

# Create directories
mkdir -p $GEOIP_DIR
mkdir -p $TEMP_DIR
mkdir -p $BACKUP_DIR

# Backup existing databases
echo "Backing up existing databases..."
if [ -f "$GEOIP_DIR/GeoIP.dat" ]; then
    cp "$GEOIP_DIR/GeoIP.dat" "$BACKUP_DIR/GeoIP.dat.$(date +%Y%m%d)"
fi

if [ -f "$GEOIP_DIR/GeoLiteCity.dat" ]; then
    cp "$GEOIP_DIR/GeoLiteCity.dat" "$BACKUP_DIR/GeoLiteCity.dat.$(date +%Y%m%d)"
fi

cd $TEMP_DIR

# Download GeoLite2 Country database (free)
echo "Downloading GeoLite2 Country database..."
# Try package manager first
if apt install -y geoip-database 2>/dev/null; then
    echo "Installed GeoIP database from package manager"
else
    echo "Package manager failed, downloading free GeoIP database..."
    # Download free legacy GeoIP database
    wget -q "https://github.com/maxmind/geoip-api-c/raw/main/data/GeoIP.dat" -O $GEOIP_DIR/GeoIP.dat || {
        echo "Warning: Could not download GeoIP database"
        echo "Manual setup may be required for GeoIP functionality"
        return 0
    }
fi

# Extract and install (only if we downloaded an archive)
if [ -f "GeoLite2-Country.tar.gz" ]; then
    echo "Installing GeoIP databases from archive..."
    tar -xzf GeoLite2-Country.tar.gz
    find . -name "*.mmdb" -exec cp {} $GEOIP_DIR/ \;
fi

# Convert to legacy format if needed
if command -v geoipupdate &> /dev/null; then
    echo "Running geoipupdate..."
    geoipupdate
fi

# Set permissions
chown -R root:root $GEOIP_DIR
chmod -R 644 $GEOIP_DIR/*.dat 2>/dev/null || true
chmod -R 644 $GEOIP_DIR/*.mmdb 2>/dev/null || true

# Clean up
rm -rf $TEMP_DIR

echo "GeoIP databases updated successfully"
echo "Available databases in $GEOIP_DIR:"
ls -la $GEOIP_DIR/

# Test nginx configuration
if command -v nginx &> /dev/null; then
    echo "Testing nginx configuration..."
    nginx -t && echo "✓ Nginx configuration is valid"
fi

echo
echo "=== Update Complete ==="
echo "Remember to reload nginx: systemctl reload nginx"