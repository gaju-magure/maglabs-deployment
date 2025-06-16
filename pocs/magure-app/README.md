# MagLabs - Multi-Tenant Django React Application

Minimalist deployment-ready version of MagLabs with automated EC2 deployment.

## Quick Deploy

### Local Development
```bash
./deploy.sh local
```
Access: http://localhost (admin: admin/admin123, demo: demo/demo123)

### EC2 Production
```bash
EC2_IP=your.ip.address ./deploy.sh ec2
```

## Architecture

- **Backend**: Django with django-tenants (multi-tenant)
- **Frontend**: React with Vite
- **Database**: PostgreSQL with tenant isolation
- **Proxy**: Nginx with subdomain routing
- **Deployment**: Docker Compose + GitHub Actions

## Subdomain Routing

- `admin.{domain}` → Admin interface
- `demo.{domain}` → Demo tenant
- `{domain}` → Main application

## GitHub Actions Setup

1. Add repository secrets:
   - `EC2_SSH_KEY`: Your EC2 private key content
2. Push to main branch or manually trigger workflow
3. Optionally specify custom EC2 IP in workflow dispatch

## Environment Variables

Key variables in `.env`:
- `POSTGRES_*`: Database configuration
- `SECRET_KEY`: Django secret (auto-generated)
- `ALLOWED_HOSTS`: Comma-separated domains
- `DOMAIN_NAME`: Base domain for tenants

## File Structure

```
├── deploy.sh              # Unified deployment script
├── docker-compose.yml     # Service orchestration
├── backend/               # Django application
├── frontend/              # React application
├── nginx/conf.d/          # Nginx configuration
├── postgres/init/         # Database initialization
└── .github/workflows/     # GitHub Actions
```

## Requirements

- Docker & Docker Compose
- SSH access to EC2 instance
- Ports 80, 443 open on EC2

## Troubleshooting

- Check logs: `docker-compose logs [service]`
- Health checks: `curl http://your-domain/health`
- Reset: `docker-compose down -v && ./deploy.sh`