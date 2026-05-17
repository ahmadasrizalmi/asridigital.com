#!/bin/bash

# Deploy Script for Asri Digital
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check environment
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo -e "${RED}Error: CLOUDFLARE_ACCOUNT_ID not set${NC}"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}Error: CLOUDFLARE_API_TOKEN not set${NC}"
  exit 1
fi

# Step 1: Build
echo -e "${YELLOW}Step 1: Building...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Deploy to Cloudflare Pages
echo -e "${YELLOW}Step 2: Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name=asridigital-com --commit-dirty=true

if [ $? -ne 0 ]; then
  echo -e "${RED}Deployment failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Deployment successful${NC}"

# Step 3: Verify deployment
echo -e "${YELLOW}Step 3: Verifying deployment...${NC}"
sleep 5

HEALTH_CHECK=$(curl -s https://asridigital-com.pages.dev/api/health)
if echo "$HEALTH_CHECK" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${YELLOW}⚠ Health check returned unexpected response${NC}"
fi

# Step 4: Git push
echo -e "${YELLOW}Step 4: Pushing to git...${NC}"
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" || true
git push

echo -e "${GREEN}✓ Git push successful${NC}"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "🌐 URL: https://asridigital-com.pages.dev"
echo -e "📊 Admin: https://asridigital-com.pages.dev/admin"
echo ""
