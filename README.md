# Asri Digital

Custom GPT Marketplace untuk Profesional Indonesia

**URL:** https://asridigital.com

## 🚀 Tech Stack

- **Framework:** Astro (Static Site Generation)
- **Styling:** Tailwind CSS 3
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1
- **API:** Cloudflare Pages Functions

## 📁 Project Structure

```
asri-digital/
├── functions/
│   └── api/
│       └── [[route]].ts    # 30+ API endpoints
├── migrations/
│   ├── 0001_initial.sql
│   ├── 0002_seed.sql
│   └── 0003_add_reset_token.sql
├── public/
│   ├── _headers
│   ├── _redirects
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── deploy.sh
│   └── setup-d1.sh
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   ├── pages/              # 19 pages
│   └── types/
├── astro.config.mjs
├── tailwind.config.mjs
└── wrangler.toml
```

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Start Dev Server
```bash
npm run dev
```
Open http://localhost:4321

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 🚀 Deployment

### Automatic (GitHub Actions)
Push to `main` branch will auto-deploy to Cloudflare Pages.

### Manual Deployment
```bash
# Set environment variables
export CLOUDFLARE_ACCOUNT_ID=your-account-id
export CLOUDFLARE_API_TOKEN=your-api-token

# Deploy
npx wrangler pages deploy dist --project-name=asridigital-com --branch=main
```

### Using Deploy Script
```bash
./scripts/deploy.sh
```

## 🗄️ Database Setup

### Create D1 Database
```bash
npx wrangler d1 create asri-digital-db
```

### Run Migrations
```bash
# Initial schema
npx wrangler d1 execute asri-digital-db --remote --file migrations/0001_initial.sql

# Seed data
npx wrangler d1 execute asri-digital-db --remote --file migrations/0002_seed.sql

# Add reset token columns
npx wrangler d1 execute asri-digital-db --remote --file migrations/0003_add_reset_token.sql
```

### Or use setup script
```bash
./scripts/setup-d1.sh
```

## 🔐 Environment Variables

Configure in Cloudflare Pages Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `APP_URL` | https://asridigital.com |
| `JWT_SECRET` | Strong secret for JWT tokens |
| `DOMPETX_API_KEY` | DompetX payment API key |
| `DOMPETX_WEBHOOK_SECRET` | DompetX webhook secret |
| `RESEND_API_KEY` | Resend email API key |

### D1 Database Binding

| Variable | Database |
|----------|----------|
| `DB` | asri-digital-db |

## 📄 Pages

### Public Pages
- `/` - Homepage
- `/blog/` - Blog listing
- `/blog/[slug]` - Blog detail
- `/checkout` - Checkout
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/success` - Payment success
- `/forgot-password` - Forgot password
- `/reset-password` - Reset password
- `/404` - Not found

### Admin Pages
- `/admin` - Dashboard
- `/admin/products` - Products CRUD
- `/admin/orders` - Orders management
- `/admin/coupons` - Coupons CRUD
- `/admin/blog` - Blog management
- `/admin/affiliates` - Affiliate management
- `/admin/settings` - Site settings

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `PATCH /api/auth/profile`

### Products
- `GET /api/products`
- `GET /api/products/featured`
- `GET /api/products/:slug`

### Checkout
- `POST /api/checkout`
- `POST /api/coupon/validate`

### Orders
- `GET /api/orders`
- `GET /api/orders/:id`

### Blog
- `GET /api/blog/posts`
- `GET /api/blog/:slug`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `PUT /api/admin/coupons/:id`
- `DELETE /api/admin/coupons/:id`
- `GET /api/admin/blog`
- `POST /api/admin/blog`
- `PUT /api/admin/blog/:id`
- `DELETE /api/admin/blog/:id`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `PUT /api/admin/orders/:id/status`

### Other
- `GET /api/health`
- `GET /api/recent-sales`
- `GET /api/settings`
- `POST /api/webhook/dompetx`

## 🧪 Testing

### Health Check
```bash
curl https://asridigital.com/api/health
```

### Get Products
```bash
curl https://asridigital.com/api/products
```

### Register
```bash
curl -X POST https://asridigital.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123", "name": "Test User"}'
```

### Login
```bash
curl -X POST https://asridigital.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@asridigital.com", "password": "demo123"}'
```

## 📚 Documentation

- [FINAL_SUMMARY.md](../FINAL_SUMMARY.md) - Complete summary
- [LAUNCH_CHECKLIST.md](../LAUNCH_CHECKLIST.md) - Launch steps
- [SETUP_ENV_VARS.md](../SETUP_ENV_VARS.md) - Environment setup
- [CONNECT_DOMAIN.md](../CONNECT_DOMAIN.md) - Domain connection guide
- [PRD](../PRD_Asri_Digital_v2.1_Comprehensive_Blueprint.md) - Original PRD

## 🔗 Links

- **Production:** https://asridigital.com
- **Admin Panel:** https://asridigital.com/admin
- **GitHub:** https://github.com/ahmadasrizalmi/asridigital.com

## 📧 Support

- Email: support@asridigital.com
- GitHub Issues: https://github.com/ahmadasrizalmi/asridigital.com/issues

## 📄 License

MIT License

---

Built with ❤️ using Astro, Tailwind CSS, and Cloudflare Pages
