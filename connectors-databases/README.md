# Database Connectors for Dataspace Multi-Tenant System

This directory contains Docker configurations for all supported database types in the Dataspace multi-tenant system. Each database comes pre-configured with SSL support, test data, and ready-to-use connection settings.

## 🏗️ Architecture

```
connectors-databases/
├── docker-compose.yml          # Main orchestrator (starts all databases)
├── start-all.sh               # Quick start script
├── stop-all.sh                # Stop all databases
├── reset-all.sh               # Reset all data (DANGER!)
├── README.md                  # This file
├── postgresql/                # PostgreSQL 15 with SSL
│   ├── docker-compose.yml
│   ├── init-scripts/01-init.sql
│   └── ssl-certs/             # Auto-generated SSL certificates
├── mongodb/                   # MongoDB 7
│   ├── docker-compose.yml
│   └── init-scripts/01-init.js
├── mysql/                     # MySQL 8.0 with SSL
│   ├── docker-compose.yml
│   └── init-scripts/01-init.sql
├── redis/                     # Redis 7 with password auth
│   └── docker-compose.yml
└── sqlite/                    # SQLite (file-based)
    ├── docker-compose.yml
    └── init-scripts/01-init.sql
```

## 🚀 Quick Start

### Start All Databases

```bash
cd connectors-databases
./start-all.sh
```

### Start Individual Database

```bash
cd connectors-databases/postgresql  # or mongodb, mysql, redis, sqlite
docker-compose up -d
```

### Stop All Databases

```bash
cd connectors-databases
./stop-all.sh
```

### Reset Everything (⚠️ Deletes all data)

```bash
cd connectors-databases
./reset-all.sh
```

## 📊 Connection Details

### PostgreSQL

- **Host**: `localhost:5432`
- **Database**: `dataspace_db`
- **Username**: `dataspace_user`
- **Password**: `dataspace_password123`
- **SSL**: Enabled (self-signed certificate for development)
- **Container**: `dataspace_postgresql`

### MongoDB

- **Host**: `localhost:27017`
- **Database**: `dataspace_db`
- **Username**: `dataspace_user`
- **Password**: `dataspace_password123`
- **Auth Database**: `admin`
- **Container**: `dataspace_mongodb`

### MySQL

- **Host**: `localhost:3306`
- **Database**: `dataspace_db`
- **Username**: `dataspace_user`
- **Password**: `dataspace_password123`
- **SSL**: Required
- **Container**: `dataspace_mysql`

### Redis

- **Host**: `localhost:6379`
- **Password**: `dataspace_password123`
- **Container**: `dataspace_redis`

### SQLite

- **Database File**: `/data/dataspace.db` (inside container)
- **Volume**: `dataspace_sqlite_data`
- **Container**: `dataspace_sqlite`

## 🗃️ Test Data

Each database comes pre-populated with the same test data:

### Users Table/Collection

- John Doe (john.doe@example.com) - Active
- Jane Smith (jane.smith@example.com) - Active
- Bob Wilson (bob.wilson@example.com) - Inactive
- Alice Brown (alice.brown@example.com) - Active

### Products Table/Collection

- Laptop Computer ($999.99, Electronics) - In Stock
- Office Chair ($249.50, Furniture) - In Stock
- Coffee Mug ($12.99, Kitchen) - In Stock
- Wireless Mouse ($29.99, Electronics) - Out of Stock
- Desk Lamp ($45.00, Furniture) - In Stock

## 🔧 Configuration for Your Application

Add these data source configurations to your Dataspace application:

### PostgreSQL Data Source

```json
{
  "name": "PostgreSQL Development",
  "configuration": {
    "host": "localhost",
    "port": 5432,
    "database": "dataspace_db",
    "username": "dataspace_user",
    "password": "dataspace_password123",
    "ssl": true
  }
}
```

### MongoDB Data Source

```json
{
  "name": "MongoDB Development",
  "configuration": {
    "connectionString": "mongodb://dataspace_user:dataspace_password123@localhost:27017/dataspace_db?authSource=admin",
    "database": "dataspace_db"
  }
}
```

### MySQL Data Source

```json
{
  "name": "MySQL Development",
  "configuration": {
    "host": "localhost",
    "port": 3306,
    "database": "dataspace_db",
    "username": "dataspace_user",
    "password": "dataspace_password123",
    "ssl": true
  }
}
```

### Redis Data Source

```json
{
  "name": "Redis Development",
  "configuration": {
    "host": "localhost",
    "port": 6379,
    "password": "dataspace_password123",
    "db": 0
  }
}
```

## 🧪 Testing Queries

### PostgreSQL/MySQL/SQLite

```sql
-- Test basic connection
SELECT 1 as test;

-- Query users (parameter conversion ? → $1 is automatic for PostgreSQL)
SELECT * FROM users WHERE id = ?;

-- Query products by category
SELECT * FROM products WHERE category = ?;
```

### MongoDB

```javascript
// Test basic connection
db.users.findOne();

// Query by ID
db.users.findOne({ id: 1 });

// Query by category
db.products.find({ category: 'Electronics' });
```

### Redis

```bash
# Test connection
redis-cli -a dataspace_password123 ping

# Set/Get data
redis-cli -a dataspace_password123 set test_key "test_value"
redis-cli -a dataspace_password123 get test_key
```

## 🔍 Monitoring & Debugging

### Check Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgresql
docker-compose logs mongodb
```

### Direct Database Access

```bash
# PostgreSQL
docker exec -it dataspace_postgresql psql -U dataspace_user -d dataspace_db

# MongoDB
docker exec -it dataspace_mongodb mongosh -u dataspace_user -p dataspace_password123 --authenticationDatabase admin dataspace_db

# MySQL
docker exec -it dataspace_mysql mysql -u dataspace_user -p dataspace_db

# Redis
docker exec -it dataspace_redis redis-cli -a dataspace_password123

# SQLite
docker exec -it dataspace_sqlite sqlite3 /data/dataspace.db
```

## 🔒 Security Notes

- **Development Only**: These configurations are for development/testing
- **Self-Signed SSL**: PostgreSQL uses self-signed certificates
- **Default Passwords**: Change passwords for production use
- **Network Isolation**: All databases share the `dataspace_network`

## 📚 Adding New Database Types

To add a new database type:

1. Create a new folder: `connectors-databases/new-database/`
2. Add `docker-compose.yml` with the database configuration
3. Create `init-scripts/` with initialization files
4. Update the main `docker-compose.yml` to include the new service
5. Update the helper scripts and this README

## 🆘 Troubleshooting

### Port Conflicts

If ports are already in use, modify the port mappings in the individual docker-compose files.

### Permission Issues

```bash
# Fix Docker permissions (macOS/Linux)
sudo chown -R $(whoami):$(whoami) connectors-databases/
```

### Volume Issues

```bash
# Remove and recreate volumes
./reset-all.sh
./start-all.sh
```

### SSL Certificate Issues

```bash
# Regenerate PostgreSQL SSL certificates
docker exec dataspace_postgresql rm -rf /var/lib/postgresql/ssl
docker-compose restart postgresql
```
