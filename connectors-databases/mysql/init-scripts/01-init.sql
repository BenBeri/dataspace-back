-- MySQL initialization script for dataspace application
-- This script runs automatically when the MySQL container starts for the first time

-- Create test users table for multi-database connection testing
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT IGNORE INTO users (email, first_name, last_name, is_active) VALUES
    ('john.doe@example.com', 'John', 'Doe', TRUE),
    ('jane.smith@example.com', 'Jane', 'Smith', TRUE),
    ('bob.wilson@example.com', 'Bob', 'Wilson', FALSE),
    ('alice.brown@example.com', 'Alice', 'Brown', TRUE);

-- Create a simple products table for more testing options
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    category VARCHAR(100),
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test products
INSERT IGNORE INTO products (name, price, category, in_stock) VALUES
    ('Laptop Computer', 999.99, 'Electronics', TRUE),
    ('Office Chair', 249.50, 'Furniture', TRUE),
    ('Coffee Mug', 12.99, 'Kitchen', TRUE),
    ('Wireless Mouse', 29.99, 'Electronics', FALSE),
    ('Desk Lamp', 45.00, 'Furniture', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(in_stock);
