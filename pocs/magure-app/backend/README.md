# Magure Backend (Django Tenant)

This is the backend service for the Magure application, built with Django and designed for multi-tenant support.

## Features

- Django-based backend
- Multi-tenant architecture
- PostgreSQL database
- Bootstrap step (`bootstrap.py`) runs before app start
- Docker and docker-compose support

---

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- (Recommended) Docker & docker-compose

---

## Local Development

1. **Clone the repository and navigate to backend:**
   ```bash
   cd pocs/magure-app/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Copy `.env.example` to `.env` and update as needed (if `.env.example` exists).
   - Ensure your `.env` contains correct PostgreSQL connection details.

5. **Run the bootstrap step:**
   ```bash
   python bootstrap.py
   ```

6. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Run the development server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

---

## Running with Docker

1. **Build the Docker image:**
   ```bash
   docker build -t magure-backend .
   ```

2. **Run the container (ensure Postgres is running and accessible):**
   ```bash
   docker run --env-file .env -p 8000:8000 magure-backend
   ```

   > The container will automatically run `bootstrap.py` and migrations before starting Django.

---

## Running with Docker Compose (Recommended)

The project root contains a `docker-compose.yml` that orchestrates backend, frontend, and Postgres.

1. **Navigate to the project root:**
   ```bash
   cd pocs/magure-app
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
   - Postgres: localhost:5432

3. **Environment variables:**
   - Backend uses `backend/.env` for configuration.
   - Database connection is set to the `postgres` service.

---

## Database Configuration

- Default DB: `maglab`
- User: `postgres`
- Password: `postgres`
- Host: `postgres` (when using docker-compose)
- Port: `5432`

---

## Bootstrap Step

The `bootstrap.py` script is executed before the Django server starts (automatically in Docker).  
Use this script to perform any initialization required before migrations or app start.

---

## Useful Commands

- Run tests:  
  ```bash
  python manage.py test
  ```
- Create superuser:  
  ```bash
  python manage.py createsuperuser
  ```

---

## Troubleshooting

- Ensure Postgres is running and accessible with the credentials above.
- Check `.env` for correct DB settings.
- For Docker issues, rebuild images:  
  ```bash
  docker-compose build --no-cache
  ```

---

## License

[MIT] or as specified in the project root.
