#!/bin/bash

# Complete deployment script for all changes
# Usage: ./deploy-all.sh

echo "🚀 DEPLOYING ALL CHANGES TO CLOUDFLARE"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database name
DB_NAME="asri-digital-db"

# Check if wrangler is logged in
echo "🔐 Checking wrangler auth..."
npx wrangler whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Not logged in to wrangler${NC}"
    echo "Please run: npx wrangler login"
    exit 1
fi
echo -e "${GREEN}✅ Logged in to wrangler${NC}"
echo ""

# Step 1: Run migration for product gallery
echo "📊 Step 1: Running migration 0007_add_product_gallery.sql..."
npx wrangler d1 execute $DB_NAME --remote --file migrations/0007_add_product_gallery.sql 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration 0007 completed${NC}"
else
    echo -e "${RED}❌ Migration 0007 failed${NC}"
    exit 1
fi
echo ""

# Step 2: Update gallery data
echo "📸 Step 2: Updating product gallery data..."
npx wrangler d1 execute $DB_NAME --remote --file scripts/0008_update_gallery_data.sql 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Gallery data updated${NC}"
else
    echo -e "${YELLOW}⚠️  Gallery data update failed (optional)${NC}"
fi
echo ""

# Step 3: Make user admin
echo "👤 Step 3: Making ahmadasrizalmi@gmail.com an admin..."
npx wrangler d1 execute $DB_NAME --remote --file scripts/0009_make_admin.sql 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ User role updated to admin${NC}"
else
    echo -e "${YELLOW}⚠️  Admin role update failed (optional)${NC}"
fi
echo ""

# Step 4: Build project
echo "🔨 Step 4: Building project..."
npm run build 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Deploy to Cloudflare Pages
echo "🚀 Step 5: Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=asridigital-com --branch=main 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployed successfully!${NC}"
else
    echo -e "${RED}❌ Deploy failed${NC}"
    exit 1
fi
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "📋 Changes deployed:"
echo "  ✅ Product gallery database migration"
echo "  ✅ Sample product gallery data"
echo "  ✅ Admin role for ahmadasrizalmi@gmail.com"
echo "  ✅ Product detail page (/product/[slug])"
echo "  ✅ Updated product card with detail button"
echo "  ✅ New icons (play-circle, play, list, help-circle)"
echo "  ✅ Admin panel connected to API"
echo ""
echo "🔗 URLs to check:"
echo "  🏠 Website: https://asridigital.com"
echo "  👤 Admin Panel: https://asridigital.com/admin"
echo "  📦 Product Detail: https://asridigital.com/product/animasi-muslim-kids-studio"
echo ""
echo "📝 Next steps:"
echo "  1. Login to admin panel with ahmadasrizalmi@gmail.com"
echo "  2. Check if product cards have 'Detail' button"
echo "  3. Test product detail page"
echo ""
echo -e "${YELLOW}⚠️  Note: Images and videos need to be uploaded manually to public/images/ and public/videos/${NC}"
echo "======================================"