#!/bin/bash

# Run migrations for product gallery features
# Usage: ./deploy-gallery-migration.sh

echo "🚀 Deploying Product Gallery Migration..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null
then
    echo "❌ Error: wrangler is not installed"
    echo "Please install it: npm install -g wrangler"
    exit 1
fi

# Check if CLOUDFLARE_ACCOUNT_ID is set
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Error: CLOUDFLARE_ACCOUNT_ID is not set"
    echo "Please set it: export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    exit 1
fi

# Get database name from wrangler.toml or use default
DB_NAME="asri-digital-db"

echo "📊 Running migration: 0007_add_product_gallery.sql"
echo ""

# Run migration
npx wrangler d1 execute $DB_NAME \
  --remote \
  --file migrations/0007_add_product_gallery.sql \
  2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📝 New columns added to products table:"
    echo "   - gallery_images (JSON array of image URLs)"
    echo "   - gallery_videos (JSON array of video URLs)"
    echo "   - video_embed_url (YouTube/Vimeo embed URL)"
    echo "   - features (JSON array of product features)"
    echo "   - specs (JSON object with product specifications)"
    echo "   - faq (JSON array of FAQ objects)"
    echo ""
    echo "📚 Example data format:"
    echo '   gallery_images: ["[\"/images/product-1.jpg\", \"/images/product-2.jpg\"]"'
    echo '   features: \'[{"icon": "sparkles", "title": "Fitur 1", "description": "Deskripsi"}]\''
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi