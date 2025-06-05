# Python Backend Refactor Plan (Supabase Integration)

This document outlines the migration completed from the original Node.js/TypeScript backend to a new Python 3.12 stack (FastAPI), leveraging Supabase for authentication and database services.

**Supabase Project Details:**
- Project ID: `zsqigchbodazahqexxbo`
- Project Name: `mlabs`

## I. Architectural Overview

1.  **Framework & Runtime:**
    *   Python 3.12
    *   FastAPI (>=0.111) for its asynchronous capabilities, performance, and automatic OpenAPI documentation generation with Pydantic V2 models.
    *   Uvicorn or Hypercorn as the ASGI server.

2.  **Core Services:**
    *   **Authentication:** Supabase Auth (GoTrue) via the `supabase-py` SDK (async version). JWTs issued by Supabase will be validated by the FastAPI backend.
    *   **Database:** Supabase PostgreSQL, accessed via `supabase-py` (async).
    *   **AI Integration:** Google Gemini API (via `google-generativeai` library) for porting the `/categorize` and `/evaluate` logic.

3.  **Containerization & Operations:**
    *   Docker for creating reproducible build and runtime environments (multi-stage Dockerfile using a slim CPython 3.12 base image).
    *   Supabase CLI for local development (`supabase start` to run a local Supabase stack).
    *   GitHub Actions for Continuous Integration:
        *   Linting (Ruff, Black, isort).
        *   Type checking (Mypy).
        *   Testing (Pytest with `pytest-cov` for coverage).
        *   Docker image build and push (optional, to a container registry).

4.  **Configuration Management:**
    *   A central `config/config.py` (or `app/core/config.py`) module using `pydantic-settings` to load configurations from environment variables and `.env` files.
    *   Validation of critical environment variables (e.g., `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) at application startup.

## II. Proposed Directory Layout

```
backend-python/
├── app/                     # Main application module
│   ├── main.py              # FastAPI app initialization, global middleware, router includes
│   ├── api/                 # API versioning and route modules
│   │   └── v1/              # Version 1 of the API
│   │       ├── categorize.py  # Endpoint for POST /api/v1/categorize
│   │       ├── evaluate.py    # Endpoint for POST /api/v1/evaluate
│   │       └── ideas.py       # CRUD endpoints for ideas (e.g., POST, GET, PATCH, DELETE /api/v1/ideas)
│   │       └── __init__.py    # To make v1 a package and include routers
│   ├── core/                # Core application logic and utilities
│   │   ├── config.py        # Configuration loading (Pydantic-Settings)
│   │   ├── security.py      # Authentication and authorization (Supabase JWT verification)
│   │   └── supabase_client.py # Supabase async client initialization and factory
│   │   └── __init__.py
│   ├── models/              # Pydantic models for data representation
│   │   ├── domain.py        # Domain entities (Idea, Question, User, Enums, etc.)
│   │   └── db.py            # Database-specific models or schema notes (e.g., for SQLModel if used, or Supabase table definitions)
│   │   └── __init__.py
│   ├── services/            # Business logic services
│   │   ├── ai_service.py    # Logic for interacting with Gemini API
│   │   └── idea_service.py  # Business logic for managing ideas (CRUD operations, etc.)
│   │   └── __init__.py
│   └── __init__.py          # Makes 'app' a package
├── tests/                   # Pytest tests
│   ├── conftest.py          # Pytest fixtures and global test configurations
│   ├── test_main.py         # Tests for main application setup, health checks
│   ├── test_api_v1/         # Tests for API v1 endpoints
│   │   ├── test_categorize_api.py
│   │   ├── test_evaluate_api.py
│   │   └── test_ideas_api.py
│   │   └── __init__.py
│   └── test_services/       # Tests for service layer logic
│       ├── test_ai_service.py
│       └── __init__.py
│   └── __init__.py
├── .env.example             # Example environment variables file
├── .gitignore
├── Dockerfile               # For building the Docker image
├── pyproject.toml           # Project metadata, dependencies (Poetry), tool configurations (Ruff, Black, Mypy, Pytest)
└── README.md                # README for the Python backend
```

## III. Data Model & Database (Supabase)

*   The existing Pydantic models in `docs/data_model_20250521.py` will serve as a strong foundation and will be adapted/extended in `backend-python/app/models/domain.py`.
*   Supabase PostgreSQL will be used. Tables will include:
    *   `users` (linked to `auth.users` via `id` foreign key, storing additional profile info and app-specific roles).
    *   `ideas`
    *   `idea_tags` (or tags stored as JSONB/array within `ideas` table, depending on query needs).
    *   `questions` (if predefined, otherwise dynamic).
    *   `idea_answers`
    *   `idea_chat_messages`
    *   `idea_value_selections`
    *   (Potentially `evaluations`, `evaluation_criteria` if that part of the system is built out).
*   Database schema migrations will be managed either via Supabase Studio directly, SQL migration files run by the Supabase CLI (`supabase db push`), or a Python-based migration tool like Alembic if more complex versioning is needed.
*   Row-Level Security (RLS) policies will be configured in Supabase to ensure data access control.

## IV. Authentication Flow

1.  **Frontend:** The React SPA will use the Supabase client library (`@supabase/supabase-js`) to handle user authentication (e.g., email/password, OAuth, magic links). Upon successful authentication, the frontend receives a JWT.
2.  **API Requests:** The frontend includes this JWT in the `Authorization: Bearer <jwt>` header for all requests to the Python backend.
3.  **Backend (FastAPI):**
    *   The `app/core/security.py` module will contain a dependency (e.g., `get_current_user`).
    *   This dependency will:
        *   Extract the JWT from the `Authorization` header.
        *   Verify the JWT's signature against Supabase's public JWKS (JSON Web Key Set), fetched from `https://<your-project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
        *   Validate claims (issuer, audience, expiry).
        *   Extract user information (ID, email, roles from `app_metadata` or custom claims) from the token payload.
        *   Return an `AuthenticatedUser` Pydantic model.
    *   Endpoints will use this dependency to protect routes and get the current user's context.
4.  **Role-Based Access Control (RBAC):**
    *   User roles (e.g., `Contributor`, `Evaluator`, `Admin`) will be defined as enums.
    *   Roles will be included in the Supabase JWT (e.g., via custom claims or `app_metadata`).
    *   FastAPI dependencies (e.g., `require_role(UserRoleEnum.ADMIN)`) will be created in `security.py` to enforce role-based access on specific endpoints or operations.

## V. Porting Existing Endpoints

The primary Node.js endpoints to be ported are:

1.  **`POST /api/v1/categorize`**
    *   **Request Body:** `{ "title": "string", "description": "string" }`
    *   **Logic:** Calls `app.services.ai_service.categorize_idea()` which uses the Gemini API with the same prompt template as the original backend.
    *   **Response Body:** `{ "category": "IdeaCategoryEnum", "confidence": "float" (optional), "error": "string" (optional) }`

2.  **`POST /api/v1/evaluate`**
    *   **Request Body:** `{ "mainQuestion": Question, "userAnswerText": "string", "fullChatHistory": ChatMessage[] (optional) }`
    *   **Logic:** Calls `app.services.ai_service.evaluate_answer()` which replicates the Gemini interaction logic (PROCEED/CLARIFY markers, CLARITY_DELTA).
    *   **Database Interaction:** Chat messages and answers will be persisted in their respective Supabase tables, linked to the relevant idea and question.
    *   **Response Body:** `EvaluationResult` model (e.g., `{ "type": "'proceed' | 'clarify'", "aiResponseToUser": "string", ... }`).

3.  **CRUD for Ideas (`/api/v1/ideas`)**
    *   `POST /`: Create a new idea.
    *   `GET /`: List ideas (with pagination).
    *   `GET /{idea_id}`: Get a specific idea.
    *   `PATCH /{idea_id}`: Update an idea.
    *   `DELETE /{idea_id}`: Delete an idea.
    *   These will be implemented in `app/api/v1/ideas.py` and use `app/services/idea_service.py` to interact with Supabase.

## VI. Migration Strategy & Phases

**Phase 0: Preparation (0.5 days)**
*   Set up the Supabase project (`zsqigchbodazahqexxbo`, name `mlabs`).
*   Securely store Supabase URL, anon key, service role key, and JWT secret (e.g., in 1Password, GitHub Secrets for CI).
*   Generate TypeScript types from Supabase schema for the frontend if direct frontend-Supabase interaction is planned for some features: `supabase gen types typescript --project-id zsqigchbodazahqexxbo > types/supabase.ts`.
*   Ensure test environment configurations (`.env.test` or similar, loaded by `conftest.py`) point to the cloud Supabase instance (`zsqigchbodazahqexxbo`) for integration tests. This includes `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

**Phase 1: Greenfield Python Service - Initial Scaffolding (1.5 days) - COMPLETED**
*   Scaffold the `backend-python` directory structure with FastAPI.
*   Implement the configuration loader (`app/core/config.py`).
*   Set up the Supabase async client (`app/core/supabase_client.py`).
*   Implement JWT verification middleware/dependency (`app/core/security.py`).
*   Port the `/api/v1/categorize` and `/api/v1/evaluate` endpoints and their corresponding `ai_service.py` logic. Initially, AI calls can be mocked for focused testing of the endpoint structure.
*   Set up `pyproject.toml` with Poetry, linters (Ruff, Black), type checker (Mypy), and testing tools (Pytest).
*   Create basic unit/integration tests for the new endpoints and services.
*   Set up basic GitHub Actions workflow for linting, type checking, and running tests.
*   Create `Dockerfile`.

**Phase 2: Database Schema & Ideas CRUD (2 days)**
*   Define the PostgreSQL table schemas in Supabase Studio or as SQL migration scripts (e.g., `supabase/migrations/`). This includes tables for `users`, `ideas`, `idea_tags`, `idea_answers`, `idea_chat_messages`, etc.
*   Implement RLS policies for these tables in Supabase.
*   Develop `app/services/idea_service.py` with functions to perform CRUD operations on the `ideas` table and related tables (tags, answers, chat) using the Supabase async client.
*   Implement the `/api/v1/ideas` CRUD endpoints in `app/api/v1/ideas.py`, utilizing the `idea_service`.
*   Write comprehensive integration tests for the Ideas CRUD operations, interacting directly with the **cloud Supabase instance (`zsqigchbodazahqexxbo`)**. This requires careful test data management (e.g., prefixing test data, dedicated test schemas if possible, or robust cleanup). Local Supabase (`supabase start`) can still be used for isolated unit development and schema design before applying migrations to the cloud.

**Phase 3: Frontend Integration & Cut-over (1 day)**
*   Update the frontend application's environment configuration to point API calls to the new Python backend URL.
    *   Gradually replaced all frontend API calls from the old Node.js backend to the new Python backend, one feature or endpoint at a time. (Now complete)
*   Run both backends in parallel during the transition if necessary (e.g., using different base URLs or path-based routing at an API gateway level if applicable).
*   Conduct thorough end-to-end testing and regression testing of the frontend interacting with the new backend.

**Phase 4: Decommission Node.js Backend (0.5 days)**
*   The old Node.js backend is now fully decommissioned and removed from the repository. All documentation, build, and deployment configs reference only the Python backend (`backend-python`).

**Total Estimated Effort:** Approximately 5.5 developer-days.

## VII. Testing & Quality Assurance Plan

*   **Test-Driven Development (TDD):** Apply TDD principles where practical, especially for service layer logic and complex business rules.
*   **Unit Tests:**
    *   Use `pytest` and `pytest-asyncio`.
    *   Test individual functions and classes in services (e.g., `ai_service.py`, `idea_service.py`) with mocked dependencies (like external API calls or database interactions).
*   **Integration Tests (API Tests):**
    *   Use `httpx.AsyncClient` with the FastAPI `app` instance to test API endpoints.
    *   For database-dependent integration tests, connect directly to the **cloud Supabase instance (`zsqigchbodazahqexxbo`)**.
        *   Test environment configuration (`conftest.py` or `.env.test`) must use the cloud Supabase credentials.
        *   A strategy for test data isolation and cleanup is crucial (e.g., using specific prefixes for test-generated data, or dedicated test functions for setup/teardown of specific records).
        *   Local Supabase (`supabase start`) remains valuable for initial development and schema validation before migrations are applied to the cloud.
*   **Coverage:** Aim for a high test coverage (e.g., ≥ 90%) using `pytest-cov`. Reports can be generated in HTML and terminal formats.
*   **Contract Testing:** Ensure the OpenAPI schema (`openapi.json`) generated by FastAPI remains consistent or changes are intentionally managed, as this forms the contract with the frontend.
*   **Static Analysis:**
    *   **Linting:** Ruff (for speed, combining Flake8, isort, pyupgrade, etc.).
    *   **Formatting:** Black (enforced by Ruff's formatter).
    *   **Type Checking:** Mypy.
*   **Pre-commit Hooks:** Use `pre-commit` to run linters, formatters, and type checkers automatically before each commit.
*   **CI Pipeline (GitHub Actions):** Automate all checks: linting, formatting, type checking, unit tests, integration tests, and coverage reporting on every push and pull request.

## VIII. Environment Variables Example (`.env.example`)

```env
# Application Configuration
APP_ENV="development" # "development", "staging", "production"
LOG_LEVEL="INFO"
PYTHONPATH="."

# Supabase Configuration
SUPABASE_URL="https://zsqigchbodazahqexxbo.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE" # Keep this secret
SUPABASE_JWT_SECRET="YOUR_SUPABASE_JWT_SECRET_HERE" # From Supabase project settings

# Google Gemini API Configuration
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# CORS (Optional, defaults to permissive for dev if not set)
# BACKEND_CORS_ORIGINS='["http://localhost:5173", "http://localhost:3000"]' # JSON array as string
