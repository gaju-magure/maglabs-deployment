#!/bin/bash

set -e

HOSTS_FILE="/etc/hosts"

read -p "Enter subdomain (e.g. magureinc): " SUBDOMAIN

FRONTEND_DOMAIN="$SUBDOMAIN.maglabs.local"
BACKEND_DOMAIN="$SUBDOMAIN.maglabs.api"

echo "🔧 Adding entries to $HOSTS_FILE..."

for DOMAIN in "$FRONTEND_DOMAIN" "$BACKEND_DOMAIN"; do
  if ! grep -q "$DOMAIN" "$HOSTS_FILE"; then
    echo "127.0.0.1 $DOMAIN" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "✅ Added $DOMAIN"
  else
    echo "ℹ️  $DOMAIN already exists in $HOSTS_FILE"
  fi
done

echo "🏁 Host entries setup complete."
