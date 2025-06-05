# Nginx Reverse Proxy with ModSecurity and GeoIP

A complete nginx reverse proxy setup with ModSecurity WAF, GeoIP-based country blocking, and Let's Encrypt SSL automation for Ubuntu 24.04.

## Features

- **Reverse Proxy**: Proxies HTTPS traffic to backend service on port 3080
- **SSL/TLS**: Automated Let's Encrypt certificate management
- **GeoIP Blocking**: Restricts access to UAE (AE) country only
- **ModSecurity WAF**: Web Application Firewall with OWASP Core Rule Set
- **Security Headers**: Comprehensive security header implementation
- **Rate Limiting**: API and login endpoint protection
- **Monitoring**: Health checks and logging

## Quick Start

1. **Install dependencies**:
   ```bash
   sudo ./scripts/install-deps.sh
   ```

2. **Build ModSecurity from source** (required for Ubuntu 24.04):
   ```bash
   make build-modsecurity
   ```

3. **Deploy the complete setup**:
   ```bash
   make deploy-ssl
   ```

4. **Check status**:
   ```bash
   make status
   make test
   ```

## Configuration

### Domain and Backend

- **Domain**: `maglabs.cloud`
- **Backend**: `http://127.0.0.1:3080`
- **SSL**: Let's Encrypt with auto-renewal

### Security Features

- **GeoIP**: Only allows traffic from UAE (AE)
- **ModSecurity**: OWASP CRS with custom rules
- **Rate Limiting**: 
  - General: 10 req/s with burst of 20
  - API endpoints: 10 req/s with burst of 10
  - Login: 1 req/s with burst of 5
- **Security Headers**: HSTS, CSP, XSS protection, etc.

## Make Commands

| Command | Description |
|---------|-------------|
| `make install` | Install required packages |
| `make build-modsecurity` | Compile ModSecurity from source |
| `make configure` | Configure nginx and ModSecurity |
| `make ssl` | Setup Let's Encrypt SSL |
| `make deploy` | Deploy without SSL |
| `make deploy-ssl` | Full deployment with SSL |
| `make status` | Check nginx status |
| `make logs` | View access logs |
| `make error-logs` | View error logs |
| `make modsec-logs` | View ModSecurity logs |
| `make restart` | Restart nginx |
| `make test` | Test configuration |
| `make help` | Show all commands |

## Scripts

- `scripts/install-deps.sh` - Install all dependencies for Ubuntu 24.04
- `scripts/build-modsecurity.sh` - Compile ModSecurity v3 from source
- `scripts/ssl-setup.sh` - Setup Let's Encrypt SSL
- `scripts/update-geoip.sh` - Update GeoIP databases
- `scripts/health-check.sh` - Comprehensive health check

## File Structure

```
├── Makefile                    # Main deployment commands
├── README.md                   # This file
├── CLAUDE.md                   # Claude Code guidance
├── config/
│   ├── nginx.conf             # Main nginx configuration
│   ├── modsecurity.conf       # ModSecurity rules
│   └── sites/
│       └── maglabs.cloud.conf # Site-specific configuration
└── scripts/
    ├── install-deps.sh        # Dependency installation for Ubuntu 24.04
    ├── build-modsecurity.sh   # ModSecurity v3 compilation from source
    ├── ssl-setup.sh          # SSL certificate setup
    ├── update-geoip.sh       # GeoIP database updates
    └── health-check.sh       # Health monitoring
```

## Security Considerations

1. **GeoIP Blocking**: Only UAE traffic allowed on port 443
2. **ModSecurity**: Protects against common web attacks
3. **Rate Limiting**: Prevents DDoS and brute force attacks
4. **SSL/TLS**: Strong cipher suites and HSTS enabled
5. **Firewall**: UFW configured to allow only necessary ports
6. **Fail2ban**: Automatic IP blocking for repeated failures

## Monitoring and Logs

- **Access logs**: `/var/log/nginx/maglabs.cloud.access.log`
- **Error logs**: `/var/log/nginx/maglabs.cloud.error.log`
- **ModSecurity logs**: `/var/log/modsecurity/modsec_audit.log`
- **Health check logs**: `/var/log/nginx-health-check.log`

## Maintenance

### SSL Certificate Renewal
Automatic renewal is configured via systemd timer. Manual renewal:
```bash
make renew-ssl
```

### GeoIP Database Updates
```bash
make setup-geoip
./scripts/update-geoip.sh
```

### Health Checks
```bash
./scripts/health-check.sh
```

## Troubleshooting

1. **Check nginx configuration**:
   ```bash
   sudo nginx -t
   ```

2. **View recent errors**:
   ```bash
   make error-logs
   ```

3. **Check SSL certificate**:
   ```bash
   make cert-info
   ```

4. **Test connectivity**:
   ```bash
   make test
   ```

## Requirements

- Ubuntu 24.04 LTS
- Root or sudo access
- Domain pointing to server IP
- Backend service running on port 3080

## Support

For issues or questions, check the logs and run the health check script for diagnostic information.