# Dockerfile for Django backend with bootstrap step

FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Set environment variables (override in docker-compose if needed)
ENV PYTHONUNBUFFERED=1

# Run bootstrap.py before starting Django
CMD ["sh", "-c", "python manage.py migrate && python bootstrap.py && python manage.py runserver 0.0.0.0:8000"]
