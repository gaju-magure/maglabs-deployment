#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(pwd)"
NGINX_CONF_SOURCE="$PROJECT_DIR/nginx.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_CONF_TARGET="$NGINX_SITES_AVAILABLE/maglabs-local"
NGINX_CONF_LINK="$NGINX_SITES_ENABLED/maglabs-local"

# Homebrew nginx.conf path (typical on Apple Silicon)
HOMEBREW_NGINX_CONF="/opt/homebrew/etc/nginx/nginx.conf"

echo "📂 Starting NGINX setup..."

# 1. Validate source config file
if [ ! -f "$NGINX_CONF_SOURCE" ]; then
  echo "❌ nginx.conf not found in $PROJECT_DIR"
  exit 1
fi

# 2. Ensure /etc/nginx dirs exist
if [ ! -d "$NGINX_SITES_AVAILABLE" ]; then
  echo "📁 Creating $NGINX_SITES_AVAILABLE..."
  sudo mkdir -p "$NGINX_SITES_AVAILABLE"
fi

if [ ! -d "$NGINX_SITES_ENABLED" ]; then
  echo "📁 Creating $NGINX_SITES_ENABLED..."
  sudo mkdir -p "$NGINX_SITES_ENABLED"
fi

# 3. Copy nginx.conf to sites-available
echo "📄 Copying config to $NGINX_CONF_TARGET..."
sudo cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_TARGET"
echo "✅ Copied successfully."

# 4. Symlink into sites-enabled (replace if broken or missing)
if [ -L "$NGINX_CONF_LINK" ] && [ ! -e "$NGINX_CONF_LINK" ]; then
  echo "🧹 Removing broken symlink..."
  sudo rm "$NGINX_CONF_LINK"
fi

if [ ! -L "$NGINX_CONF_LINK" ]; then
  echo "🔗 Creating symlink in sites-enabled..."
  sudo ln -s "$NGINX_CONF_TARGET" "$NGINX_CONF_LINK"
else
  echo "ℹ️  Symlink already exists: $NGINX_CONF_LINK"
fi

# 5. Patch Homebrew nginx.conf to include /etc/nginx/sites-enabled/*
echo "🔧 Ensuring nginx.conf includes /etc/nginx/sites-enabled/*..."
if ! grep -q "/etc/nginx/sites-enabled/\*" "$HOMEBREW_NGINX_CONF"; then
  echo "📌 Adding include directive..."
  sudo sed -i '' '/http {/a\
    \ \ \ \ include /etc/nginx/sites-enabled/*;\
' "$HOMEBREW_NGINX_CONF"
  echo "✅ Patched nginx.conf successfully."
else
  echo "ℹ️  nginx.conf already includes correct sites-enabled include."
fi

# 6. Test nginx configuration
echo "🔍 Testing NGINX configuration..."
if ! sudo nginx -t; then
  echo "❌ NGINX config test failed. Aborting."
  exit 1
fi

# 7. Start or reload nginx
echo "🔁 Ensuring NGINX is running..."
if pgrep -x "nginx" >/dev/null; then
  echo "♻️ Reloading NGINX..."
  sudo nginx -s reload
else
  echo "🚀 Starting NGINX..."
  sudo nginx
fi

echo ""
echo "✅ NGINX is ready!"
echo "🌐 You can now visit:"
echo "   http://admin.maglabs.local"
echo "   http://magureinc.maglabs.api"
