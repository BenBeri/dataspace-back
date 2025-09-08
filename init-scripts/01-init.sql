-- Initial database setup for dataspace application
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Create extensions that might be useful for your NestJS app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a separate schema for your application (optional but recommended)
CREATE SCHEMA IF NOT EXISTS dataspace_schema;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON SCHEMA dataspace_schema TO dataspace_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dataspace_schema TO dataspace_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dataspace_schema TO dataspace_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA dataspace_schema GRANT ALL ON TABLES TO dataspace_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA dataspace_schema GRANT ALL ON SEQUENCES TO dataspace_user;
