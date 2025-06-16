-- Create separate database for MagLabs AI service
-- This will run when PostgreSQL container starts

CREATE DATABASE maglab_ai;
GRANT ALL PRIVILEGES ON DATABASE maglab_ai TO postgres;

-- Create extension for AI database if needed
\c maglab_ai;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";