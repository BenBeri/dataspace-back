#!/bin/bash

# Reset all database connectors (DANGER: This removes all data!)
echo "⚠️  WARNING: This will delete ALL database data!"
echo "Are you sure you want to continue? (type 'yes' to confirm)"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo "🗑️  Stopping and removing all containers and volumes..."

# Stop and remove everything including volumes
docker-compose down -v

# Remove all volumes explicitly
echo "💥 Removing volumes..."
docker volume rm dataspace_postgresql_data 2>/dev/null || echo "PostgreSQL volume already removed"
docker volume rm dataspace_mongodb_data 2>/dev/null || echo "MongoDB volume already removed"
docker volume rm dataspace_mysql_data 2>/dev/null || echo "MySQL volume already removed"  
docker volume rm dataspace_redis_data 2>/dev/null || echo "Redis volume already removed"
docker volume rm dataspace_sqlite_data 2>/dev/null || echo "SQLite volume already removed"

# Remove network
echo "🌐 Removing network..."
docker network rm dataspace_network 2>/dev/null || echo "Network already removed"

echo ""
echo "✅ All databases, data, and networks have been removed!"
echo ""
echo "💡 To start fresh:"
echo "   ./start-all.sh"
echo ""
