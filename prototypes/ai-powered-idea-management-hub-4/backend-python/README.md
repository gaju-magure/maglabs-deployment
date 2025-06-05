# Python Backend for AI-Powered Idea Management Hub

This directory contains the Python 3.12 backend service, built with FastAPI, to replace the original Node.js/TypeScript backend.

## Core Technologies

- **Python Version:** 3.12+
- **Web Framework:** FastAPI (with Pydantic V2 for data validation)
- **ASGI Server:** Uvicorn (or Hypercorn)
- **Database & Auth:** Supabase (PostgreSQL, GoTrue for auth)
  - Project ID: `zsqigchbodazahqexxbo`
  - Project Name: `mlabs`
- **AI Integration:** Google Gemini API (via `google-generativeai` library)
- **Linting & Formatting:** Ruff, Black, isort
- **Type Checking:** Mypy
- **Testing:** Pytest, pytest-asyncio, httpx
- **Dependency Management:** Poetry (or PDM / Hatch) - TBD, for now `requirements.txt`
- **Containerization:** Docker

## Project Structure

```
backend-python/
├── app/                     # Main application module
│   ├── main.py              # FastAPI app initialization, global middleware, router includes
│   ├── api/                 # API versioning and route modules
│   │   └── v1/              # Version 1 of the API
│   │       ├── categorize.py  # Endpoint for /api/v1/categorize
│   │       ├── evaluate.py    # Endpoint for /api/v1/evaluate
│   │       └── ideas.py       # CRUD endpoints for ideas
│   ├── core/                # Core application logic and utilities
│   │   ├── config.py        # Configuration loading (Pydantic-Settings)
│   │   ├── security.py      # Authentication and authorization (Supabase JWT)
│   │   └── supabase_client.py # Supabase client initialization (async)
│   ├── models/              # Pydantic models for data representation
│   │   ├── domain.py        # Domain entities (Idea, Question, User, etc.)
│   │   └── db.py            # Database-specific models (e.g., SQLModel, or direct table mappings)
│   ├── services/            # Business logic services
│   │   ├── ai_service.py    # Logic for interacting with Gemini API
│   │   └── idea_service.py  # Business logic for managing ideas
│   └── __init__.py
├── tests/                   # Pytest tests
│   ├── conftest.py          # Pytest fixtures and plugins
│   ├── test_api_v1/         # Tests for API v1 endpoints
│   └── test_services/       # Tests for service layer logic
├── .env.example             # Example environment variables
├── .gitignore
├── Dockerfile               # For building the Docker image
├── pyproject.toml           # Project metadata, dependencies (Poetry/PDM), tool configurations (ruff, black, mypy)
└── README.md                # This file
```

## Setup and Running Locally

1.  **Prerequisites:**
    *   Python 3.12+
    *   Poetry (or pip for `requirements.txt` if not using Poetry)
    *   Docker (optional, for containerized development/deployment)
    *   Supabase CLI (for local development against a local Supabase stack)

2.  **Environment Variables:**
    Create a `.env` file in the `backend-python` directory by copying `.env.example` and filling in the required values (Supabase URL/keys, Gemini API key).

    ```bash
    cp .env.example .env
    # Edit .env with your credentials
    ```

3.  **Install Dependencies:**
    (Assuming Poetry)
    ```bash
    cd backend-python
    poetry install
    ```
    (If using `requirements.txt`)
    ```bash
    cd backend-python
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    ```

4.  **Run Supabase Local Stack (Optional but Recommended for Dev):**
    ```bash
    supabase start
    ```
    This will spin up local Supabase services. Note the local Supabase URL and keys provided in the output and update your `.env` file accordingly for local development.

5.  **Run Database Migrations (if applicable):**
    If using a migration tool like Alembic or Supabase's built-in migration system:
    ```bash
    # Example: supabase db push (if using Supabase CLI for schema changes)
    ```

6.  **Start the FastAPI Server:**
    (Assuming Poetry)
    ```bash
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    (If using pip/venv)
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    The API will be available at `http://localhost:8000`. The OpenAPI documentation (Swagger UI) will be at `http://localhost:8000/docs`.

## Running Tests

```bash
# (Activate virtual environment if not using Poetry)
# poetry run pytest
pytest
```

## Linting and Formatting

```bash
# Format code with Black and isort (via Ruff)
# poetry run ruff format .
ruff format .

# Lint code with Ruff
# poetry run ruff check . --fix
ruff check . --fix

# Type check with Mypy
# poetry run mypy app
mypy app
```
These commands are often configured in `pyproject.toml` and can be run via `poetry run <script_name>` if aliases are set up.

## Building Docker Image

```bash
docker build -t magure-idea-hub-backend-python .
```

## Deployment

Refer to `docs/deployment.md` in the main project repository for deployment strategies (e.g., to Railway, Fly.io, Kubernetes).
