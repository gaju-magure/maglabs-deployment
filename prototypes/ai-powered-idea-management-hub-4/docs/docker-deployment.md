# Docker Deployment Guide

This guide explains how to deploy the Idea Management Hub using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- Supabase project set up

## Environment Setup

### Frontend Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration for Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Backend Environment Variables

Create a `.env` file in the `backend-python/` directory:

```bash
# Supabase Configuration for Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Backend Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]
```

## Deployment Options

### Option 1: Full Stack with Reverse Proxy (Recommended)

This deploys both frontend and backend with an nginx reverse proxy:

```bash
# Build and start all services
docker compose up -d

# Access the application
open http://localhost:8080
```

Services:
- **Frontend**: React app served by nginx (internal port 80)
- **Backend**: FastAPI Python app (port 8000)
- **Nginx Proxy**: Routes requests (port 8080)
  - `/api/*` → Backend service
  - `/*` → Frontend service

### Option 2: Frontend Only

To deploy just the frontend:

```bash
# Build frontend image
docker build -f Dockerfile.frontend -t idea-hub-frontend .

# Run frontend container
docker run -d \
  --name idea-hub-frontend \
  -p 3000:80 \
  -e VITE_SUPABASE_URL="https://your-project.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="your-anon-key" \
  idea-hub-frontend

# Access the application
open http://localhost:3000
```

### Option 3: Backend Only

To deploy just the backend:

```bash
# Navigate to backend directory
cd backend-python

# Build and run backend
docker build -t idea-hub-backend .
docker run -d \
  --name idea-hub-backend \
  -p 8000:8000 \
  --env-file .env \
  idea-hub-backend

# Access the API
open http://localhost:8000/docs
```

## Environment Variable Injection

The frontend Docker image supports runtime environment variable injection:

1. **Build Time**: Environment variables from `.env.local` are baked into `config.js`
2. **Runtime**: Environment variables passed to the container override build-time values

This allows the same Docker image to be deployed to different environments.

## Health Checks

### Frontend Health Check
```bash
curl http://localhost:3000/config.js
# Should return: window.ENV = { "VITE_SUPABASE_URL": "...", ... }
```

### Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### Full Stack Health Check
```bash
# Through reverse proxy
curl http://localhost:8080/api/health
curl http://localhost:8080/config.js
```

## Troubleshooting

### Frontend Issues

1. **Environment variables not loading**:
   ```bash
   docker logs <frontend-container-name>
   # Check for "Generating runtime environment configuration..." message
   ```

2. **Check config.js generation**:
   ```bash
   docker exec <frontend-container-name> cat /usr/share/nginx/html/config.js
   ```

### Backend Issues

1. **Database connection errors**:
   - Verify Supabase URL and keys in backend `.env`
   - Check network connectivity from container

2. **CORS errors**:
   - Update `BACKEND_CORS_ORIGINS` in backend `.env`
   - Ensure frontend URL is included

### Nginx Proxy Issues

1. **API routing problems**:
   - Check `nginx.conf` configuration
   - Verify service names match docker-compose.yml

## Production Considerations

1. **Security**:
   - Use Docker secrets for sensitive environment variables
   - Enable HTTPS with SSL certificates
   - Configure proper CORS origins

2. **Performance**:
   - Use multi-stage builds to minimize image size
   - Enable gzip compression in nginx
   - Configure health checks and restart policies

3. **Monitoring**:
   - Set up log aggregation
   - Monitor container resource usage
   - Configure alerts for service failures

## Commands Reference

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Stop services
docker compose down

# Rebuild and restart
docker compose down && docker compose up -d --build

# Clean up
docker compose down -v --remove-orphans
docker system prune -f
```