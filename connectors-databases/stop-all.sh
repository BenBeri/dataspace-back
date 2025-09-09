#!/bin/bash

# Stop all database connectors for Dataspace multi-tenant system
echo "🛑 Stopping all database connectors..."

# Stop all services
docker-compose down

echo ""
echo "✅ All databases have been stopped!"
echo ""
echo "💡 To completely remove all data (reset everything):"
echo "   ./reset-all.sh"
echo ""
echo "💡 To start again:"
echo "   ./start-all.sh"
echo ""
