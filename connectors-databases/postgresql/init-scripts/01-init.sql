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

-- Create test users table for multi-database connection testing
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT INTO users (email, first_name, last_name, is_active) VALUES
    ('john.doe@example.com', 'John', 'Doe', true),
    ('jane.smith@example.com', 'Jane', 'Smith', true),
    ('bob.wilson@example.com', 'Bob', 'Wilson', false),
    ('alice.brown@example.com', 'Alice', 'Brown', true)
ON CONFLICT (email) DO NOTHING;

-- Create a simple products table for more testing options
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    category VARCHAR(100),
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test products
INSERT INTO products (name, price, category, in_stock) VALUES
    ('Laptop Computer', 999.99, 'Electronics', true),
    ('Office Chair', 249.50, 'Furniture', true),
    ('Coffee Mug', 12.99, 'Kitchen', true),
    ('Wireless Mouse', 29.99, 'Electronics', false),
    ('Desk Lamp', 45.00, 'Furniture', true)
ON CONFLICT DO NOTHING;
