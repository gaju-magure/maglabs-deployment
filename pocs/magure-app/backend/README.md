Here’s an extended version of your **README** that incorporates your local development enhancements — including the automated `/etc/hosts` entry and NGINX reverse proxy setup scripts.

---

# Magure Backend (Django Tenant)

This is the backend service for the Magure application, built with Django and designed for multi-tenant support.

## Features

* Django-based backend
* Multi-tenant architecture
* PostgreSQL database
* Bootstrap step (`bootstrap.py`) runs before app start
* Docker and docker-compose support
* Local subdomain proxying with NGINX and automatic host setup scripts

---

## Prerequisites

* Python 3.11+
* PostgreSQL 15+
* Homebrew (on macOS for local NGINX via brew)
* (Recommended) Docker & docker-compose
* Local `nginx` installed and accessible via `brew services start nginx` or `/opt/homebrew/bin/nginx`

---

## Local Domain & NGINX Setup (for subdomain simulation)

This project supports simulating tenant-based subdomains (e.g., `magureinc.maglabs.api`) via local NGINX proxying and host mapping.

### 🛠 1. Add Host Entries

Run this script to add tenant domains to your local `/etc/hosts` file:

```bash
./scripts/add-local-host-entry.sh
```

You'll be prompted to enter a subdomain name (e.g., `magureinc`) — this will add entries like:

```
127.0.0.1 magureinc.maglabs.local
127.0.0.1 magureinc.maglabs.api
```

---

### 🌐 2. Set Up Local NGINX Reverse Proxy

To simulate backend/frontend separation with wildcard subdomains:

```bash
../setup-maglab-local.sh
```

This script:

* Copies your project’s `nginx.conf` into `/etc/nginx/sites-available`
* Symlinks it to `/etc/nginx/sites-enabled`
* Patches the global `nginx.conf` (Homebrew path) to include that directory
* Tests config and starts/reloads nginx

#### Sample nginx.conf:

```nginx
# Proxy for frontend
server {
    listen 80;
    server_name *.maglabs.local;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Proxy for backend API
server {
    listen 80;
    server_name *.maglabs.api;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

> Ensure the frontend runs on `localhost:8080` and the backend on `localhost:8000`.

---

## Local Development (Backend)

1. **Navigate to backend directory:**

   ```bash
   cd pocs/magure-app/backend
   ```

2. **Set up and activate virtual environment:**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure `.env`:**
   Copy `.env.example` → `.env` and edit DB settings.

5. **Run bootstrap + migrate:**

   ```bash
   chmod +x ../add_hosts.sh ../setup-maglabs-local.sh
   python manage.py migrate
   python bootstrap.py 
   ```

   This will add super admin cred for admin.maglabs.local
   Use this creds from bootstrap file to login into UI

   Use this creds for testing
   ```
   ADMIN_URL="http://admin.maglabs.local"
   SUPERADMIN_USERNAME = "superadmin@admin.maglabs.api"
   SUPERADMIN_PASSWORD = "ChangeMe123!"

   TENANT_URL = "magureinc.maglabs.local"
   TENANT_ADMIN_EMAIL = "admin@magureinc.maglabs.api"
   TENANT_ADMIN_PASSWORD = "TenantAdmin123!"
   ```

   Additionaly run the script in magure-app/add_hosts with
   ```
   ./add_hosts 
   Enter subdomain (e.g. magureinc): admin
   ```

   This needs to be repeated for every subdomain/Tenant added

6. **Start backend server:**

   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## Scripts Directory

* `root/pocs/magure-app/setup-maglab-local.sh`   — Sets up NGINX reverse proxy using wildcard domains | one time
* `root/pocs/magure-app/add-hosts.sh` — Adds entries to `/etc/hosts` for frontend/backend domains | Need to run after creating tenant

---

## Running with Docker

See previous instructions in this README under Docker & Compose.

---

## Production Notes

In production, subdomains (like `tenant.maglabs.com`, `tenant-api.maglabs.com`) will be pointed via DNS and reverse-proxied via a proper SSL-enabled NGINX server or load balancer.

These local scripts are only for development convenience and not intended for production automation.

---