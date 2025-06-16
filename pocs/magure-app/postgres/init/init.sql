-- PostgreSQL Database Initialization Script
-- Creates databases and users for MagLabs with proper permissions

-- Create user if it doesn't exist
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

-- Create main database if it doesn't exist
SELECT 'CREATE DATABASE maglabs_prod OWNER maglabs_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'maglabs_prod')\gexec

-- Grant all privileges on main database to user
GRANT ALL PRIVILEGES ON DATABASE maglabs_prod TO maglabs_user;

-- Create AI database if it doesn't exist
SELECT 'CREATE DATABASE maglab_ai OWNER maglabs_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'maglab_ai')\gexec

-- Grant all privileges on AI database to user
GRANT ALL PRIVILEGES ON DATABASE maglab_ai TO maglabs_user;

-- Connect to the main database to set up additional permissions
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

-- Connect to AI database and set up permissions
\c maglab_ai

-- Grant schema permissions for AI database
GRANT ALL ON SCHEMA public TO maglabs_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maglabs_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maglabs_user;

-- Set default privileges for future objects in AI database
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO maglabs_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO maglabs_user;

-- Create extension for AI database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log completion
SELECT 'Database initialization completed successfully' AS status;