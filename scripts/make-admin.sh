#!/bin/bash

# Script to make ahmadasrizalmi@gmail.com an admin
# Usage: ./make-admin.sh

echo "👤 Updating user role to admin..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null
then
    echo "❌ Error: wrangler is not installed"
    echo "Please install it: npm install -g wrangler"
    exit 1
fi

# Database name
DB_NAME="asri-digital-db"

# Target email
TARGET_EMAIL="ahmadasrizalmi@gmail.com"

echo "📧 Target email: $TARGET_EMAIL"
echo "🗄️  Database: $DB_NAME"
echo ""

echo "⏳ Executing query..."
echo ""

# Execute the SQL
npx wrangler d1 execute $DB_NAME --remote --command "UPDATE users SET role = 'admin' WHERE email = '$TARGET_EMAIL'" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ User role updated successfully!"
    echo ""
    
    # Verify the update
    echo "🔍 Verifying update..."
    echo ""
    npx wrangler d1 execute $DB_NAME --remote --command "SELECT id, name, email, role, is_all_access FROM users WHERE email = '$TARGET_EMAIL'" 2>&1
    
    echo ""
    echo "🎉 $TARGET_EMAIL is now an admin!"
    echo ""
    echo "📝 You can now access the admin panel at: https://asridigital.com/admin"
    echo "🔐 Login with your email and password"
else
    echo ""
    echo "❌ Failed to update user role!"
    exit 1
fi