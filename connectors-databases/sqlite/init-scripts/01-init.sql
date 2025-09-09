-- SQLite initialization script for dataspace application
-- This script runs when the SQLite container starts

-- Create test users table for multi-database connection testing
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT OR IGNORE INTO users (email, first_name, last_name, is_active) VALUES
    ('john.doe@example.com', 'John', 'Doe', 1),
    ('jane.smith@example.com', 'Jane', 'Smith', 1),
    ('bob.wilson@example.com', 'Bob', 'Wilson', 0),
    ('alice.brown@example.com', 'Alice', 'Brown', 1);

-- Create a simple products table for more testing options
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL,
    category TEXT,
    in_stock INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test products
INSERT OR IGNORE INTO products (name, price, category, in_stock) VALUES
    ('Laptop Computer', 999.99, 'Electronics', 1),
    ('Office Chair', 249.50, 'Furniture', 1),
    ('Coffee Mug', 12.99, 'Kitchen', 1),
    ('Wireless Mouse', 29.99, 'Electronics', 0),
    ('Desk Lamp', 45.00, 'Furniture', 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(in_stock);
