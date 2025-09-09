#!/bin/bash

# Start all database connectors for Dataspace multi-tenant system
echo "🚀 Starting all database connectors for Dataspace..."

# Create the shared network first
echo "📡 Creating shared network..."
docker network create dataspace_network 2>/dev/null || echo "Network already exists"

# Create all volumes first
echo "💾 Creating volumes..."
docker volume create dataspace_postgresql_data 2>/dev/null || echo "PostgreSQL volume already exists"
docker volume create dataspace_mongodb_data 2>/dev/null || echo "MongoDB volume already exists"  
docker volume create dataspace_mysql_data 2>/dev/null || echo "MySQL volume already exists"
docker volume create dataspace_redis_data 2>/dev/null || echo "Redis volume already exists"
docker volume create dataspace_sqlite_data 2>/dev/null || echo "SQLite volume already exists"

# Start all databases
echo "🔧 Starting all databases..."
docker-compose up -d

echo ""
echo "✅ All databases are starting up! Here are the connection details:"
echo ""
echo "📊 PostgreSQL:"
echo "   Host: localhost:5432"
echo "   Database: dataspace_db"
echo "   User: dataspace_user"
echo "   Password: dataspace_password123"
echo "   SSL: Enabled"
echo ""
echo "🍃 MongoDB:"
echo "   Host: localhost:27017"  
echo "   Database: dataspace_db"
echo "   User: dataspace_user"
echo "   Password: dataspace_password123"
echo "   Auth Database: admin"
echo ""
echo "🐬 MySQL:"
echo "   Host: localhost:3306"
echo "   Database: dataspace_db"
echo "   User: dataspace_user"
echo "   Password: dataspace_password123"
echo "   SSL: Required"
echo ""
echo "⚡ Redis:"
echo "   Host: localhost:6379"
echo "   Password: dataspace_password123"
echo ""
echo "📁 SQLite:"
echo "   File: /data/dataspace.db (in container)"
echo "   Volume: dataspace_sqlite_data"
echo ""
echo "🔍 Check status with: docker-compose ps"
echo "📋 View logs with: docker-compose logs [service_name]"
echo ""
