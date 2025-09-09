// MongoDB initialization script for dataspace application
// This script runs when MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('dataspace_db');

// Create application user
db.createUser({
  user: 'dataspace_user',
  pwd: 'dataspace_password123',
  roles: [{ role: 'readWrite', db: 'dataspace_db' }],
});

// Create test collections and insert sample data

// Users collection
db.users.insertMany([
  {
    id: 1,
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    email: 'bob.wilson@example.com',
    first_name: 'Bob',
    last_name: 'Wilson',
    is_active: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    email: 'alice.brown@example.com',
    first_name: 'Alice',
    last_name: 'Brown',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
]);

// Products collection
db.products.insertMany([
  {
    id: 1,
    name: 'Laptop Computer',
    price: 999.99,
    category: 'Electronics',
    in_stock: true,
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'Office Chair',
    price: 249.5,
    category: 'Furniture',
    in_stock: true,
    created_at: new Date(),
  },
  {
    id: 3,
    name: 'Coffee Mug',
    price: 12.99,
    category: 'Kitchen',
    in_stock: true,
    created_at: new Date(),
  },
  {
    id: 4,
    name: 'Wireless Mouse',
    price: 29.99,
    category: 'Electronics',
    in_stock: false,
    created_at: new Date(),
  },
  {
    id: 5,
    name: 'Desk Lamp',
    price: 45.0,
    category: 'Furniture',
    in_stock: true,
    created_at: new Date(),
  },
]);

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ is_active: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ in_stock: 1 });

print('MongoDB initialization completed successfully');
