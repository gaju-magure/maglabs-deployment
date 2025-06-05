
# Deployment Strategy

This document outlines the deployment strategy for the Magure Idea Hub, considering its frontend and backend services, and the potential for Docker containerization as requested.

## 1. Overview

The application is composed of two distinct parts:
*   **Frontend:** A React Single Page Application (SPA).
*   **Backend:** A Python FastAPI service (in `backend-python/`).

This separation lends itself well to containerized deployments.

## 2. Frontend Deployment

The frontend consists of static assets (`index.html`, `index.tsx` (which browsers load as JS module), CSS (via Tailwind CDN or generated), and image assets like the logo).

**Deployment Options:**

1.  **Static Web Hosting:** Services like Vercel, Netlify, AWS S3 (with CloudFront), GitHub Pages, or Azure Static Web Apps are ideal.
    *   **Build:** While the current setup doesn't have an explicit frontend build step (relying on `esm.sh` and CDN for Tailwind), a production deployment would typically involve:
        *   Bundling JavaScript/TypeScript using Vite, Webpack, or Parcel.
        *   Generating a static CSS file from Tailwind configuration.
        *   Optimizing assets.
    *   The output would be a directory of static files (`index.html`, `assets/`, `css/`, `js/`).
2.  **Docker Container (using a web server like Nginx):**
    *   A `Dockerfile` would copy the static assets (built or as-is) into an Nginx container.
    *   Nginx would be configured to serve these static files.

**Example Dockerfile for Frontend (with Nginx):**
```dockerfile
# Stage 1: Build (if you add a build step)
# FROM node:18-alpine as builder
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm install
# COPY . .
# RUN npm run build # Assuming a build script in package.json

# Stage 2: Serve
FROM nginx:alpine
# Copy built assets from builder stage if used
# COPY --from=builder /app/dist /usr/share/nginx/html
# If no build step, copy current static files directly
COPY ./index.html /usr/share/nginx/html/
COPY ./index.tsx /usr/share/nginx/html/ 
COPY ./public/assets/Magure_Logo.png /usr/share/nginx/html/assets/Magure_Logo.png
# Add other static files like types.ts, components/, services/ if they are directly served
# and not bundled. This direct serving of .tsx/.ts is highly unusual for production.
# A build step is strongly recommended.

# (Optional) Copy custom Nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
**Note:** Serving `.tsx` files directly via Nginx is not standard for production. A build step to transpile TypeScript/JSX to JavaScript and bundle modules is highly recommended for performance and compatibility.

## 3. Backend Deployment

The backend is a Python FastAPI application (in `backend-python`).

**Deployment Options:**

1.  **Platform as a Service (PaaS):** Deploy using Python-specific platforms or Docker containers (e.g., Azure Web App for Containers, AWS Fargate, Google Cloud Run, Heroku with Python).
2.  **Docker Container:**
    *   A `Dockerfile` in `backend-python/` defines the environment (Python 3.12, poetry, dependencies, and FastAPI app startup command).
    *   Build and run via `docker build` and `docker run` from the `backend-python` directory.

**Example Dockerfile for Backend:**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend-python/pyproject.toml backend-python/poetry.lock ./
RUN pip install poetry && poetry install --no-root --only main
COPY backend-python/app ./app
CMD [ "poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" ]
```

**Environment Variables for Backend:**
*   `GEMINI_API_KEY`: The Google Gemini API key. **This must be set securely in the deployment environment.**
*   Other variables for Supabase if required (see `backend-python/app/core/config.py`).
*   `NODE_ENV=production`: Recommended for performance and disabling development-specific features.

## 4. Orchestration and Serving (Putting it Together)

When deploying both frontend and backend (especially with Docker), you'll need a way to route traffic:

*   **Reverse Proxy (e.g., Nginx, Traefik, Caddy):**
    *   A reverse proxy can sit in front of both containers.
    *   It can serve frontend static assets directly.
    *   It can route API requests (e.g., requests to `/api/*`) to the backend container.
    *   It can handle SSL termination, load balancing, etc.

**Example Nginx Configuration for Reverse Proxy (Conceptual):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        # Serve frontend static files
        root /path/to/frontend/static/files; # Or proxy to frontend container
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        # Proxy API requests to backend container
        proxy_pass http://backend-service:3001/; # 'backend-service' is the Docker network name
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

*   **Docker Compose:** For local development and simpler deployments, Docker Compose can define and run multi-container applications.

**Example `docker-compose.yml` (Conceptual):**
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: . # Assuming Dockerfile for frontend is in root
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:80" # Map host port 8080 to container port 80 (Nginx)

  backend:
    build:
      context: ./backend # Assuming Dockerfile for backend is in ./backend
      dockerfile: Dockerfile # Or specify if named differently
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - API_KEY=${API_KEY} # Pass API_KEY from host environment or .env file
    # volumes: # If .env is used by backend Dockerfile directly
    #   - ./backend/.env:/usr/src/app/.env

# To use this, you'd typically have an .env file at the docker-compose.yml level for API_KEY
# or ensure API_KEY is set in the environment where 'docker-compose up' is run.
```

## 5. Configuration Management

*   **Backend API Key:** The `API_KEY` for Gemini must be injected into the backend container as an environment variable. This is crucial for security. Do not hardcode it in the Docker image.
*   **Frontend API URL:** The frontend's `services/geminiService.ts` uses `/api` as the base URL. This assumes the reverse proxy setup correctly routes these requests. If deploying frontend and backend to different domains/ports without a unified proxy, CORS on the backend must be configured correctly, and the frontend API base URL would need to be absolute and configurable.

## 6. Logging and Monitoring

*   Standard output (console logs) from both containers should be collected by the container orchestration platform (e.g., Docker logs, Kubernetes logs).
*   Consider structured logging for easier parsing and analysis.
*   Implement health check endpoints in the backend service.

By following these strategies, the Magure Idea Hub can be deployed robustly and scalably. The key is to ensure proper build processes for both frontend and backend, secure management of the API key, and correct routing between the services.
