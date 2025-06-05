# Stage 1: Build stage (if using Poetry or other build tools that generate wheels)
# Use an official Python runtime as a parent image
FROM python:3.12-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Or your desired Poetry version
ENV POETRY_VERSION=1.8.2
ENV POETRY_HOME="/opt/poetry"
ENV POETRY_VIRTUALENVS_CREATE=false
ENV PATH="$POETRY_HOME/bin:$PATH"

# Install Poetry
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -sSL https://install.python-poetry.org | python3 - \
    && apt-get remove -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only files necessary for dependency installation first to leverage Docker cache
COPY pyproject.toml poetry.lock* /app/

# Install project dependencies using Poetry
# --no-dev: Do not install development dependencies
# --no-interaction: Do not ask any interactive questions
# --no-ansi: Disable ANSI output
# --no-root: Do not install the project itself as editable, only its dependencies
RUN poetry install --no-dev --no-interaction --no-ansi --no-root

# Export dependencies to requirements.txt for the final stage
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

# Stage 2: Final stage
FROM python:3.12-slim as final

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
# Default to production environment
ENV APP_ENV="production"

# Create a non-root user and group
RUN groupadd -r appgroup && useradd --no-log-init -r -g appgroup appuser

# Set working directory
WORKDIR /app

# Copy requirements.txt from builder stage
COPY --from=builder /app/requirements.txt /app/requirements.txt

# Install dependencies using pip
# --no-cache-dir: Disable the pip cache
# -r requirements.txt: Install from the given requirements file.
# Explicitly add supabase to ensure its modules are correctly installed by pip.
RUN pip install --no-cache-dir -r requirements.txt supabase

# Remove Poetry from the final image if it was copied and not needed
# RUN rm -rf /opt/poetry

# Copy the application code
# Ensure .dockerignore is set up to exclude unnecessary files (like .git, .venv, __pycache__)
COPY ./app/ /app/app/

# Ensure the entrypoint script (if any) is executable
# COPY ./entrypoint.sh /app/entrypoint.sh
# RUN chmod +x /app/entrypoint.sh

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application
# This will run Uvicorn with Gunicorn workers for production.
# You might need to install gunicorn if not already in dependencies: poetry add gunicorn
# CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "-w", "4", "-b", "0.0.0.0:8000"]

# Simpler CMD for Uvicorn directly (often sufficient for many PaaS)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# If using an entrypoint script:
# ENTRYPOINT ["/app/entrypoint.sh"]
