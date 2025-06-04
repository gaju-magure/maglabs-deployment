.PHONY: install configure ssl deploy clean status logs restart

# Configuration
DOMAIN := maglabs.cloud
TARGET_PORT := 3080
EMAIL := admin@$(DOMAIN)

# Default target
all: install build-modsecurity configure ssl deploy

# Install required packages
install:
	@echo "Installing required packages..."
	sudo ./scripts/install-deps.sh
	@echo "Dependencies installed successfully"

# Build ModSecurity from source
build-modsecurity:
	@echo "Building ModSecurity from source..."
	sudo ./scripts/build-modsecurity.sh
	@echo "ModSecurity built and installed successfully"

# Configure nginx and ModSecurity
configure:
	@echo "Configuring nginx and ModSecurity..."
	sudo cp config/modsecurity.conf /etc/modsecurity/modsecurity.conf
	sudo cp config/nginx.conf /etc/nginx/nginx.conf
	sudo cp config/sites/$(DOMAIN).conf /etc/nginx/sites-available/$(DOMAIN)
	sudo ln -sf /etc/nginx/sites-available/$(DOMAIN) /etc/nginx/sites-enabled/$(DOMAIN)
	sudo rm -f /etc/nginx/sites-enabled/default
	sudo mkdir -p /var/log/modsecurity
	sudo chown www-data:www-data /var/log/modsecurity
	sudo nginx -t
	@echo "Configuration applied successfully"

# Setup SSL with Let's Encrypt
ssl:
	@echo "Setting up SSL certificate for $(DOMAIN)..."
	sudo certbot --nginx -d $(DOMAIN) --email $(EMAIL) --agree-tos --non-interactive --redirect
	@echo "SSL certificate configured successfully"

# Deploy the complete setup
deploy: install build-modsecurity configure
	@echo "Deploying nginx reverse proxy..."
	sudo systemctl restart nginx
	sudo systemctl status nginx
	@echo "Deployment completed successfully"

# Deploy with SSL (full deployment)
deploy-ssl: deploy ssl
	@echo "Full deployment with SSL completed"

# Clean up configuration
clean:
	@echo "Cleaning up configuration..."
	sudo rm -f /etc/nginx/sites-enabled/$(DOMAIN)
	sudo rm -f /etc/nginx/sites-available/$(DOMAIN)
	sudo systemctl reload nginx

# Check nginx status
status:
	sudo systemctl status nginx
	sudo nginx -t

# View nginx logs
logs:
	sudo tail -f /var/log/nginx/access.log

# View error logs
error-logs:
	sudo tail -f /var/log/nginx/error.log

# View ModSecurity logs
modsec-logs:
	sudo tail -f /var/log/modsecurity/modsec_audit.log

# Restart nginx
restart:
	sudo systemctl restart nginx
	sudo systemctl status nginx

# Reload nginx configuration
reload:
	sudo nginx -t && sudo systemctl reload nginx

# Renew SSL certificates
renew-ssl:
	sudo certbot renew --dry-run

# Show certificate info
cert-info:
	sudo certbot certificates

# Test the proxy
test:
	@echo "Testing nginx configuration..."
	sudo nginx -t
	@echo "Testing SSL certificate..."
	curl -I https://$(DOMAIN)
	@echo "Testing proxy functionality..."
	curl -H "Host: $(DOMAIN)" https://$(DOMAIN)

# Setup GeoIP database updates
setup-geoip:
	@echo "Setting up GeoIP database updates..."
	sudo mkdir -p /usr/share/GeoIP
	./scripts/update-geoip.sh

# Help
help:
	@echo "Available targets:"
	@echo "  install          - Install required packages"
	@echo "  build-modsecurity - Compile ModSecurity from source"
	@echo "  configure        - Configure nginx and ModSecurity"
	@echo "  ssl              - Setup Let's Encrypt SSL"
	@echo "  deploy           - Deploy without SSL"
	@echo "  deploy-ssl       - Full deployment with SSL"
	@echo "  clean            - Remove configuration"
	@echo "  status           - Check nginx status"
	@echo "  logs             - View access logs"
	@echo "  error-logs       - View error logs"
	@echo "  modsec-logs      - View ModSecurity logs"
	@echo "  restart          - Restart nginx"
	@echo "  reload           - Reload nginx configuration"
	@echo "  renew-ssl        - Renew SSL certificates"
	@echo "  cert-info        - Show certificate information"
	@echo "  test             - Test configuration and connectivity"
	@echo "  setup-geoip      - Setup GeoIP database updates"
	@echo "  help             - Show this help message"