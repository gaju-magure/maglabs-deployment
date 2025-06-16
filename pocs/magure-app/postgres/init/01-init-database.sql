-- PostgreSQL Database Initialization Script
-- This script ensures the database and user exist with proper permissions

-- Create user if it doesn't exist (PostgreSQL 9.1+)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles 
      WHERE rolname = 'maglabs_user') THEN
      
      CREATE USER maglabs_user WITH PASSWORD 'placeholder_password';
   END IF;
END
$do$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE maglabs_prod OWNER maglabs_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'maglabs_prod')\gexec

-- Grant all privileges on database to user
GRANT ALL PRIVILEGES ON DATABASE maglabs_prod TO maglabs_user;

-- Connect to the new database to set up additional permissions
\c maglabs_prod

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO maglabs_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maglabs_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maglabs_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO maglabs_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO maglabs_user;

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log completion
SELECT 'Database initialization completed successfully' AS status;