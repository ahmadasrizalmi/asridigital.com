#!/bin/bash

# Setup Cloudflare D1 Database
# Run this script to create and seed the database

set -e

echo "🚀 Setting up Cloudflare D1 Database for Asri Digital..."

# Check if wrangler is installed
if ! command -v npx wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Create D1 database
echo "📦 Creating D1 database..."
DB_OUTPUT=$(npx wrangler d1 create asri-digital-db 2>&1)
echo "$DB_OUTPUT"

# Extract database ID
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "")
if [ -z "$DB_ID" ]; then
    echo "⚠️  Could not extract database ID. Please check wrangler output."
    echo "You may need to manually add the database_id to wrangler.toml"
else
    echo "✅ Database created with ID: $DB_ID"
    
    # Update wrangler.toml with database ID
    if [ -f wrangler.toml ]; then
        sed -i "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
        echo "✅ Updated wrangler.toml with database ID"
    fi
fi

# Run migrations
echo "📄 Running migrations..."
npx wrangler d1 execute asri-digital-db --file=migrations/0001_initial.sql
echo "✅ Schema created"

echo "🌱 Seeding data..."
npx wrangler d1 execute asri-digital-db --file=migrations/0002_seed.sql
echo "✅ Seed data inserted"

# Verify
echo ""
echo "🔍 Verifying database..."
npx wrangler d1 execute asri-digital-db --command="SELECT COUNT(*) as products FROM products"
npx wrangler d1 execute asri-digital-db --command="SELECT COUNT(*) as coupons FROM coupons"
npx wrangler d1 execute asri-digital-db --command="SELECT COUNT(*) as users FROM users"
npx wrangler d1 execute asri-digital-db --command="SELECT COUNT(*) as settings FROM site_settings"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with your database_id"
echo "2. Run 'npm run build' to build the project"
echo "3. Run 'npx wrangler pages deploy dist' to deploy"
echo ""
