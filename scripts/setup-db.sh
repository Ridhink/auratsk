#!/bin/bash

echo "🚀 Setting up AuraTask database..."

# Check if database already exists
if psql -lqt | cut -d \| -f 1 | grep -qw auratask; then
    echo "✅ Database 'auratask' already exists"
else
    echo "📦 Creating database 'auratask'..."
    createdb auratask
    
    if [ $? -eq 0 ]; then
        echo "✅ Database 'auratask' created successfully"
    else
        echo "❌ Failed to create database. Make sure PostgreSQL is running."
        echo "   Try: brew services start postgresql@15 (macOS)"
        exit 1
    fi
fi

echo ""
echo "📝 Next steps:"
echo "1. Add this to your .env.local file:"
echo "   DATABASE_URL=postgresql://$(whoami)@localhost:5432/auratask"
echo ""
echo "2. Run: npm run db:push"
echo ""

