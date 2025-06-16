# Multi-stage build for Django backend
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r django && useradd -r -g django django

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base AS development

# Install development dependencies
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy project
COPY . .

# Change ownership to django user
RUN chown -R django:django /app

# Switch to django user
USER django

# Expose port
EXPOSE 8000

# Run development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Production stage
FROM base AS production

# Install gunicorn
RUN pip install gunicorn==21.2.0

# Copy project
COPY . .

# Create directories for logs and static files
RUN mkdir -p /app/logs /app/staticfiles /app/mediafiles

# Change ownership to django user
RUN chown -R django:django /app

# Switch to django user
USER django

# Collect static files
RUN python manage.py collectstatic --noinput --settings=config.settings.production

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "gevent", "--worker-connections", "1000", "--max-requests", "1000", "--max-requests-jitter", "100", "--timeout", "30", "--keep-alive", "5", "--log-level", "info", "--access-logfile", "-", "--error-logfile", "-", "config.wsgi:application"]