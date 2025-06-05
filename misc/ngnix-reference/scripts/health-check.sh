#!/bin/bash

# Health Check Script for Nginx Reverse Proxy
# This script performs comprehensive health checks

set -e

DOMAIN="maglabs.cloud"
TARGET_PORT="3080"
LOG_FILE="/var/log/nginx-health-check.log"

echo "=== Nginx Reverse Proxy Health Check ==="
echo "Domain: $DOMAIN"
echo "Target Port: $TARGET_PORT"
echo "Timestamp: $(date)"
echo

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check nginx service status
echo "1. Checking nginx service status..."
if systemctl is-active --quiet nginx; then
    log_message "✓ Nginx service is running"
else
    log_message "✗ Nginx service is not running"
    echo "Starting nginx..."
    sudo systemctl start nginx
fi

# Check nginx configuration
echo "2. Checking nginx configuration..."
if nginx -t 2>/dev/null; then
    log_message "✓ Nginx configuration is valid"
else
    log_message "✗ Nginx configuration has errors"
    nginx -t
fi

# Check SSL certificate
echo "3. Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_message "✓ SSL certificate exists"
    
    # Check certificate expiry
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
        log_message "✓ SSL certificate valid for $DAYS_UNTIL_EXPIRY days"
    elif [ $DAYS_UNTIL_EXPIRY -gt 0 ]; then
        log_message "⚠ SSL certificate expires in $DAYS_UNTIL_EXPIRY days - renewal recommended"
    else
        log_message "✗ SSL certificate has expired"
    fi
else
    log_message "✗ SSL certificate not found"
fi

# Check target service
echo "4. Checking target service on port $TARGET_PORT..."
if nc -z localhost $TARGET_PORT 2>/dev/null; then
    log_message "✓ Target service is responding on port $TARGET_PORT"
else
    log_message "✗ Target service is not responding on port $TARGET_PORT"
fi

# Check HTTP to HTTPS redirect
echo "5. Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L http://$DOMAIN/health 2>/dev/null || echo "000")
if [ "$HTTP_RESPONSE" = "200" ]; then
    log_message "✓ HTTP to HTTPS redirect working"
else
    log_message "✗ HTTP redirect failed (status: $HTTP_RESPONSE)"
fi

# Check HTTPS response
echo "6. Testing HTTPS response..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_message "✓ HTTPS endpoint responding correctly"
else
    log_message "✗ HTTPS endpoint failed (status: $HTTPS_RESPONSE)"
fi

# Check ModSecurity
echo "7. Checking ModSecurity..."
if [ -f "/var/log/modsecurity/modsec_audit.log" ]; then
    log_message "✓ ModSecurity audit log exists"
    RECENT_BLOCKS=$(tail -n 100 /var/log/modsecurity/modsec_audit.log 2>/dev/null | grep -c "ModSecurity" || echo "0")
    log_message "ℹ ModSecurity recent activity: $RECENT_BLOCKS entries"
else
    log_message "⚠ ModSecurity audit log not found"
fi

# Check GeoIP functionality
echo "8. Checking GeoIP database..."
if [ -f "/usr/share/GeoIP/GeoIP.dat" ] || [ -f "/usr/share/GeoIP/GeoLite2-Country.mmdb" ]; then
    log_message "✓ GeoIP database found"
else
    log_message "✗ GeoIP database not found"
fi

# Check disk space
echo "9. Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    log_message "✓ Disk usage is healthy ($DISK_USAGE%)"
elif [ $DISK_USAGE -lt 90 ]; then
    log_message "⚠ Disk usage is high ($DISK_USAGE%)"
else
    log_message "✗ Disk usage is critical ($DISK_USAGE%)"
fi

# Check memory usage
echo "10. Checking memory usage..."
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -lt 80 ]; then
    log_message "✓ Memory usage is healthy ($MEM_USAGE%)"
elif [ $MEM_USAGE -lt 90 ]; then
    log_message "⚠ Memory usage is high ($MEM_USAGE%)"
else
    log_message "✗ Memory usage is critical ($MEM_USAGE%)"
fi

# Check recent errors in nginx logs
echo "11. Checking recent nginx errors..."
ERROR_COUNT=$(tail -n 100 /var/log/nginx/error.log 2>/dev/null | wc -l || echo "0")
if [ $ERROR_COUNT -eq 0 ]; then
    log_message "✓ No recent nginx errors"
else
    log_message "⚠ Found $ERROR_COUNT recent error log entries"
fi

# Summary
echo
echo "=== Health Check Summary ==="
echo "Check completed at: $(date)"
echo "Log file: $LOG_FILE"
echo
echo "Quick status check:"
systemctl status nginx --no-pager -l | head -5

# Return appropriate exit code
if grep -q "✗" $LOG_FILE; then
    echo "⚠ Some checks failed - review the log for details"
    exit 1
else
    echo "✓ All checks passed successfully"
    exit 0
fi