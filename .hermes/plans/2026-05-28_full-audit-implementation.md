# Asridigital.com — Full Audit Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix all critical security, performance, design consistency, and feature gaps found in the full site audit.

**Architecture:** Astro 5.x static site + Cloudflare Pages Functions + D1 database. All API endpoints in single catch-all router `functions/api/[[route]].ts`. Admin panel at `/admin/*` with 10 pages. Design system: Plus Jakarta Sans, Carbon #1c1c1c + Emerald #10b981 + Slate palette.

**Tech Stack:** Astro, Tailwind CSS, Cloudflare Pages, D1, TypeScript

---

## ═══════════════════════════════════════
## PHASE 1: CRITICAL SECURITY & STABILITY (Week 1)
## ═══════════════════════════════════════

### Task 1: Remove hardcoded admin credentials endpoint

**Objective:** Eliminate the `/admin/update-credentials` endpoint that allows anyone to reset admin password with a hardcoded header string.

**Files:**
- Modify: `functions/api/[[route]].ts` — remove lines ~2385-2430 (the `/admin/update-credentials` POST handler)

**Steps:**
1. Read the endpoint at line 2385 in `[[route]].ts`
2. Delete the entire `if (route === '/admin/update-credentials' && method === 'POST')` block
3. Build: `npx astro build` → verify 0 errors
4. Commit: `git commit -m "security: remove exposed admin credentials endpoint"`

**Verify:** `curl -X POST https://asridigital.com/api/admin/update-credentials -H "Authorization: *UPDATE_ADMIN_NOW*" -d '{}'` returns 404 (not 200).

---

### Task 2: Require JWT_SECRET env var (no hardcoded fallback)

**Objective:** Remove all 13 instances of `|| 'asri-digital-default-jwt-secret-key-2026'` fallback.

**Files:**
- Modify: `functions/api/[[route]].ts` — lines 148, 194, 245, 549, 1549

**Steps:**
1. Search-replace all `env.JWT_SECRET || 'asri-digital-default-jwt-secret-key-2026'` → `env.JWT_SECRET`
2. Add early check at top of `onRequest`: if `!env.JWT_SECRET`, return 500 error
3. Ensure `JWT_SECRET` is set in CF Pages environment variables (Settings → Environment Variables)
4. Build + commit

**Verify:** Login still works, admin pages load, API returns data.

---

### Task 3: Sanitize blog content (prevent XSS)

**Objective:** Blog content rendered via `marked.parse()` + `innerHTML` can execute malicious JS.

**Files:**
- Modify: `src/pages/blog/[slug].astro` — sanitize before innerHTML
- Modify: `package.json` — add `isomorphic-dompurify` dependency

**Steps:**
1. `pnpm add isomorphic-dompurify`
2. In `blog/[slug].astro`, after `marked.parse(post.content)`, pipe through `DOMPurify.sanitize()`
3. Build + commit

**Verify:** Create a test blog post with `<script>alert('xss')</script>` in content → verify it renders as text, not executes.

---

### Task 4: Fix rate limiting (use Cloudflare KV or remove)

**Objective:** In-memory `Map()` rate limiting is non-functional on Cloudflare Workers (stateless).

**Files:**
- Modify: `functions/api/[[route]].ts` — lines 14-36 (rateLimitStore, checkRateLimit)

**Steps:**
**Option A (Quick — remove rate limiting):**
1. Delete the rate limit checks at lines 324-340 (auth endpoints) and 331-340 (checkout)
2. Keep the general rate limit but make it a no-op or remove entirely

**Option B (Proper — use KV):**
1. Add `RATE_LIMITER` KV namespace binding in Cloudflare dashboard
2. Rewrite `checkRateLimit()` to use `env.RATE_LIMITER.get/put` with TTL
3. Update `wrangler.toml` or CF Pages settings

**Recommendation:** Option A for now, add KV later when traffic justifies it.

**Commit:** `git commit -m "fix: remove non-functional in-memory rate limiting"`

---

### Task 5: Fix `/products/` route returning 404

**Objective:** `/products` redirects to `/products/` which shows "Halaman Tidak Ditemukan".

**Files:**
- Create or check: `src/pages/products.astro` or `src/pages/products/index.astro`

**Steps:**
1. Check if `src/pages/products.astro` or `src/pages/products/index.astro` exists
2. If not, create a products catalog page that:
   - Fetches `/api/products?limit=100`
   - Renders product grid with category filter tabs
   - Has search bar
   - Matches homepage card style
3. Build + commit

**Verify:** `curl -s -o /dev/null -w "%{http_code}" https://asridigital.com/products/` returns 200.

---

## ═══════════════════════════════════════
## PHASE 2: PERFORMANCE FIXES (Week 1-2)
## ═══════════════════════════════════════

### Task 6: Add Cache-Control headers to API responses

**Objective:** All API calls return `cf-cache-status: DYNAMIC` — every request hits origin. Add caching.

**Files:**
- Modify: `functions/api/[[route]].ts` — modify `jsonResponse()` helper (line 268)

**Steps:**
1. In `jsonResponse()`, add `Cache-Control` header for public GET endpoints:
   ```
   /api/products → 'public, s-maxage=60, stale-while-revalidate=300'
   /api/products/featured → 'public, s-maxage=60, stale-while-revalidate=300'
   /api/site-settings → 'public, s-maxage=120, stale-while-revalidate=600'
   /api/hero-slides → 'public, s-maxage=120, stale-while-revalidate=600'
   /api/recent-sales → 'public, s-maxage=30, stale-while-revalidate=60'
   /api/tracking-config → 'public, s-maxage=3600'
   ```
2. Do NOT cache admin endpoints (keep `no-store`)
3. Do NOT cache POST/PUT/DELETE responses
4. Build + commit

**Verify:** `curl -sI https://asridigital.com/api/products | grep cache-control` shows `s-maxage=60`.

---

### Task 7: Optimize Cloudinary images

**Objective:** Product images are 336KB and 403KB PNGs. Total image weight ~1.2MB.

**Files:**
- Modify: `src/components/ProductCard.astro` — add `f_auto,w_800` to Cloudinary URLs
- Modify: `src/components/HeroSlider.astro` — add transforms
- Modify: `src/components/Header.astro` — logo too large (87KB)
- Modify: D1 `products` table — update image URLs to include transforms

**Steps:**
1. In all components that render Cloudinary URLs, inject `/f_auto,w_800/q_auto` before `/v1` in the URL path
2. For logo: `/f_auto,w_200/q_auto` 
3. For hero: `/f_auto,w_1200/q_auto`
4. For product cards: `/f_auto,w_600/q_auto`
5. Create a helper function `cloudinaryTransform(url, width)` in `src/lib/cloudinary.ts`
6. Build + commit

**Verify:** Check page total image size drops from ~1.2MB to <300KB.

---

### Task 8: Lazy-load FOMO toast + reduce API calls

**Objective:** Homepage makes 6 API calls on load. FOMO toast polls every 30s immediately.

**Files:**
- Modify: `src/pages/index.astro` — delay FOMO init
- Modify: `functions/api/[[route]].ts` — inline site-settings into SSR

**Steps:**
1. In FOMO toast JavaScript: wrap `setInterval` in `setTimeout(() => { ... }, 10000)` — delay 10s
2. In `index.astro`: use Astro's `Astro.glob` or `fetch` at build time to inline `site_settings` data into the HTML (eliminate 2 client-side API calls)
3. In `HeroSlider.astro`: fetch hero slides server-side during build
4. Build + commit

**Verify:** Homepage client-side API calls reduced from 6 to 3 or fewer.

---

### Task 9: Async font loading (eliminate render-blocking)

**Objective:** Google Fonts `<link>` blocks rendering until fonts download.

**Files:**
- Modify: `src/layouts/BaseLayout.astro` — change font loading strategy

**Steps:**
1. Change font `<link>` to:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:..." rel="stylesheet" media="print" onload="this.media='all'">
   <noscript><link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet"></noscript>
   ```
2. Build + commit

**Verify:** Lighthouse render-blocking resources reduced.

---

## ═══════════════════════════════════════
## PHASE 3: ICON & DESIGN CONSISTENCY (Week 2)
## ═══════════════════════════════════════

### Task 10: Add 10 missing icons to Icon.astro

**Objective:** 10 icons used in pages don't exist in `Icon.astro` → silently fallback to `info` icon. Contact page social media icons are ALL wrong.

**Files:**
- Modify: `src/components/ui/Icon.astro` — add missing icon SVG paths

**Missing icons to add:**
| Name | Style | SVG Path Source |
|---|---|---|
| `camera` | Lucide stroke | Instagram camera icon |
| `twitter` | Lucide stroke | Twitter bird |
| `music` | Lucide stroke | TikTok music note |
| `award` | Lucide stroke | Trophy/award |
| `scale` | Lucide stroke | Balance scale |
| `alert-triangle` | Lucide stroke | Warning triangle |
| `lightbulb` | Lucide stroke | Idea bulb |
| `edit` | Lucide stroke | Pencil edit |
| `heart` | Lucide stroke | Heart outline |
| `rocket` | Lucide stroke | Rocket launch |
| `eye` | Lucide stroke | Eye open |
| `eye-off` | Lucide stroke | Eye with line |

**Steps:**
1. Copy SVG paths from Lucide icons (https://lucide.dev)
2. Add each to the icon map in `Icon.astro` following existing pattern (`fill="none"`, `stroke="currentColor"`, `stroke-width="2"`)
3. Remove duplicate entries (lines 75-117 reportedly have duplicates)
4. Build + commit

**Verify:** Visit `/contact` → Instagram/Twitter/TikTok icons should show correct icons (not "i"). Visit `/about` → lightbulb, edit, heart icons should render correctly.

---

### Task 11: Fix product detail page icons (score: 3/10 → 8/10)

**Objective:** Product detail page uses ALL inline SVGs with mixed fill/stroke styles. Should use `Icon.astro`.

**Files:**
- Modify: `src/pages/[slug].astro` — replace inline SVGs with `<Icon>` component

**Steps:**
1. Add `import Icon from '../components/ui/Icon.astro'`
2. Replace inline SVGs:
   - Breadcrumb chevrons → `<Icon name="chevron-right" size={14} />` (change from filled to stroke)
   - Star ratings → keep filled SVG (different from Lucide stroke — this is intentional for ratings)
   - Cart icon → `<Icon name="shopping-cart" />`
   - Lock icon → `<Icon name="lock" />`
   - Crown icon → `<Icon name="crown" />`
   - Check marks → `<Icon name="check" />`
   - Arrow left → `<Icon name="arrow-left" />`
3. Build + commit

**Verify:** Visit a product detail page → all icons should be Lucide stroke style, consistent with other pages.

---

### Task 12: Fix blog post page (score: 4/10 → 8/10)

**Objective:** Blog post page uses emojis for share buttons, inline styles instead of Tailwind, custom color #5C7A36.

**Files:**
- Modify: `src/pages/blog/[slug].astro`

**Steps:**
1. Replace emoji share buttons with `<Icon>` component:
   - 💬 → `<Icon name="message-circle" />` (WhatsApp)
   - 🐦 → `<Icon name="twitter" />` (Twitter)
   - 📋 → `<Icon name="copy" />` (Copy link)
   - ✅ → `<Icon name="check" />` (Copied feedback)
2. Replace `#5C7A36` reading progress bar color with `#10b981` (emerald)
3. Replace inline `style=""` attributes with Tailwind classes where possible
4. Build + commit

**Verify:** Visit a blog post → share buttons show Lucide icons, progress bar is emerald green.

---

### Task 13: Fix Footer icons (score: 5/10 → 8/10)

**Objective:** Footer uses inline SVGs for social icons instead of `Icon.astro`.

**Files:**
- Modify: `src/components/Footer.astro`

**Steps:**
1. Import `Icon` component
2. Replace inline LinkedIn, X/Twitter, Send SVGs with `<Icon name="linkedin" />`, `<Icon name="twitter" />`, `<Icon name="send" />`
3. Build + commit

---

### Task 14: Unify design tokens (eliminate dual system)

**Objective:** Homepage uses `text-slate-900`, inner pages use `text-primary`. Same colors, different syntax.

**Files:**
- Modify: `src/pages/index.astro` — replace raw Tailwind with semantic tokens
- Modify: `src/components/ProductCard.astro` — align card borders

**Mapping:**
| Raw Tailwind | Semantic Token |
|---|---|
| `text-slate-900` | `text-text-primary` |
| `text-slate-500` | `text-text-secondary` |
| `text-slate-400` | `text-text-muted` |
| `bg-slate-50` | `bg-background` |
| `bg-white` | `bg-surface` |
| `border-slate-200` | `border-border` |

**Steps:**
1. In `index.astro`, search-replace each raw class → semantic token
2. In `ProductCard.astro`, align `border-slate-200` → `border-slate-100` to match `.card` class
3. Build + commit

---

### Task 15: Add missing footer to profile/reset-password/success

**Objective:** 3 pages have no footer — breaks navigation expectation.

**Files:**
- Modify: `src/pages/profile.astro`
- Modify: `src/pages/reset-password.astro`
- Modify: `src/pages/success.astro`

**Steps:**
1. Add `import Footer from '../components/Footer.astro'` to each page
2. Add `<Footer />` before closing `</BaseLayout>` in each
3. Build + commit

---

### Task 16: Add btn-danger to global CSS + fix password eye toggles

**Objective:** `btn-danger` class used in profile.astro but not defined. Eye toggles use inline SVG.

**Files:**
- Modify: `src/styles/global.css` — add `.btn-danger` class
- Modify: `src/pages/profile.astro` — use defined class
- Modify: `src/pages/dashboard.astro` — replace inline eye SVGs with `<Icon>`
- Modify: `src/pages/reset-password.astro` — replace inline eye SVGs with `<Icon>`

**Steps:**
1. Add to global.css:
   ```css
   .btn-danger {
     @apply bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors;
   }
   ```
2. Replace `document.querySelector` eye toggle inline SVGs with `<Icon name="eye" />` / `<Icon name="eye-off" />`
3. Build + commit

---

## ═══════════════════════════════════════
## PHASE 4: BLOG & CONTENT IMPROVEMENTS (Week 2-3)
## ═══════════════════════════════════════

### Task 17: Add "Artikel Terbaru" section to homepage

**Objective:** Blog has zero presence on homepage. Add a "Latest Articles" section.

**Files:**
- Modify: `src/pages/index.astro` — add blog section after PromoCard
- Create: `src/components/BlogCard.astro` — blog preview card

**Steps:**
1. Create `BlogCard.astro` with: thumbnail, category badge, title, excerpt, date, "Baca →" link
2. Style matching ProductCard (rounded-2xl, shadow, hover-lift)
3. In `index.astro`, add section:
   ```astro
   <section class="py-16">
     <h2>Artikel Terbaru</h2>
     <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
       <!-- 3 BlogCard components fetched from /api/blog/posts?limit=3 -->
     </div>
   </section>
   ```
4. Fetch data client-side from `/api/blog/posts?limit=3`
5. Build + commit

---

### Task 18: Add rich text toolbar to blog admin editor

**Objective:** Blog editor is a plain `<textarea>`. Products have a Markdown toolbar — blog should too.

**Files:**
- Modify: `src/pages/admin/blog.astro` — add toolbar above content textarea

**Steps:**
1. Copy the toolbar HTML+JS pattern from `admin/products.astro` (lines ~440-470)
2. Adapt for blog context (same buttons: Bold, Italic, H2, H3, Bullet, Numbered, Checklist)
3. Add live preview toggle
4. Build + commit

---

### Task 19: Add blog SEO metadata

**Objective:** Blog posts have no per-post meta description or structured data.

**Files:**
- Modify: `src/pages/blog/[slug].astro` — add dynamic meta tags

**Steps:**
1. In the `<head>` section, add:
   ```html
   <meta name="description" content={post.excerpt || post.title}>
   <meta property="og:title" content={post.title}>
   <meta property="og:description" content={post.excerpt}>
   <meta property="og:image" content={post.image_url}>
   ```
2. Add Article structured data (JSON-LD)
3. Build + commit

---

### Task 20: Fix blog build-time fetch (posts not appearing until deploy)

**Objective:** Blog pages fetch at build time via `getStaticPaths()`. New posts don't appear until next deploy.

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/[slug].astro`

**Steps:**
**Option A (Quick — client-side only):**
1. Make blog listing fully client-side (fetch from API on page load, not build time)
2. Keep `[slug].astro` static but add a "If post not found, fetch from API" fallback

**Option B (Proper — SSR for blog):**
1. Add Cloudflare adapter (memory says never use it, but for blog only it might be needed)
2. Or: use Cloudflare Workers KV to cache blog posts and serve from edge

**Recommendation:** Option A — make blog listing client-side only.

---

## ═══════════════════════════════════════
## PHASE 5: DATABASE & SCHEMA (Week 3)
## ═══════════════════════════════════════

### Task 21: Create consolidated migration

**Objective:** Schema drift — many columns/tables used in API but not in migrations.

**Files:**
- Create: `migrations/0008_consolidated_schema.sql`

**Missing from migrations:**
- `categories` table
- `hero_slides` table  
- `contact_messages` table
- `coupons.description` column
- `orders.referred_by` column
- `email_logs.error_message` column
- `affiliate_transactions` — wrong schema (API uses different columns than migration)

**Steps:**
1. Query actual D1 schema: `SELECT sql FROM sqlite_master WHERE type='table'`
2. Compare with migration files
3. Create `0008_consolidated_schema.sql` with all missing `ALTER TABLE` / `CREATE TABLE` statements
4. Apply to D1 via `wrangler d1 execute`
5. Commit

---

### Task 22: Add admin search/pagination for orders

**Objective:** `GET /api/orders` returns LIMIT 100 with no search, no pagination, no date filter.

**Files:**
- Modify: `functions/api/[[route]].ts` — add query params to orders endpoint
- Modify: `src/pages/admin/orders.astro` — add search bar + pagination UI

**Steps:**
1. In API, add params: `?page=1&limit=20&search=xxx&status=PAID&from=2026-01-01&to=2026-12-31`
2. In admin page, add: search input, status filter dropdown, date range picker, pagination controls
3. Build + commit

---

## ═══════════════════════════════════════
## PHASE 6: PRODUCT DISCOVERY & SCALING (Week 3-4)
## ═══════════════════════════════════════

### Task 23: Add product search bar to frontend

**Objective:** API supports `?search=` but no search UI exists on frontend.

**Files:**
- Modify: `src/pages/index.astro` — add search bar above product grid
- Or Create: `src/components/ProductSearch.astro`

**Steps:**
1. Add search input with debounced API call (300ms)
2. Show results in product grid (replace current listing)
3. Add "X results found" counter
4. Add "Clear search" button
5. Build + commit

---

### Task 24: Add product sorting options

**Objective:** Products only sort by `sort_order ASC`. No price/date/popularity sorting.

**Files:**
- Modify: `functions/api/[[route]].ts` — add `?sort=` param to products endpoint
- Modify: `src/pages/index.astro` — add sort dropdown

**Steps:**
1. API: accept `?sort=price_asc|price_desc|newest|popular`
2. Frontend: dropdown above product grid
3. Build + commit

---

### Task 25: Add product price range filter

**Objective:** Only category filter exists. No price range filtering.

**Files:**
- Modify: `functions/api/[[route]].ts` — add `?min_price=&max_price=` params
- Modify: `src/pages/index.astro` — add price range inputs or slider

**Steps:**
1. API: accept `?min_price=10000&max_price=100000`
2. Frontend: simple min/max input fields (or range slider)
3. Build + commit

---

### Task 26: Add load more / pagination for products

**Objective:** Public API returns LIMIT 20. Need "Load More" or pagination for 100+ products.

**Files:**
- Modify: `src/pages/index.astro` — add "Load More" button
- Or: modify product grid to use infinite scroll

**Steps:**
1. Track current page, show "Load More" button
2. On click, fetch `/api/products?page=2&limit=20&...` and append
3. Hide button when no more results
4. Build + commit

---

## ═══════════════════════════════════════
## PHASE 7: ANALYTICS & TRACKING (Week 4)
## ═══════════════════════════════════════

### Task 27: Fire conversion events after checkout

**Objective:** `/api/tracking-config` returns GTM/pixel IDs but no conversion events fire.

**Files:**
- Modify: `src/pages/success.astro` — fire purchase event

**Steps:**
1. On success page load, fetch `/api/tracking-config`
2. Fire `gtag('event', 'purchase', { transaction_id, value, currency: 'IDR' })`
3. Fire Meta Pixel `fbq('track', 'Purchase', { value, currency: 'IDR' })`
4. Build + commit

---

### Task 28: Add sitemap.xml and RSS feed for blog

**Objective:** No sitemap or RSS → poor SEO for blog content.

**Files:**
- Create: `src/pages/sitemap.xml.ts` — dynamic sitemap
- Create: `src/pages/blog/rss.xml.ts` — RSS feed

**Steps:**
1. Generate sitemap with all static pages + product pages + blog posts
2. Generate RSS 2.0 feed for blog posts
3. Add `<link rel="sitemap">` and `<link rel="alternate" type="application/rss+xml">` to `<head>`
4. Build + commit

---

## ═══════════════════════════════════════
## PHASE 8: NICE-TO-HAVE (Backlog)
## ═══════════════════════════════════════

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| 29 | Wishlist/favorites system | Medium | Low |
| 30 | User reviews/ratings | Large | Low |
| 31 | Product comparison page | Large | Low |
| 32 | Quick view modal for products | Small | Medium |
| 33 | Recently viewed products (cookie) | Small | Medium |
| 34 | "Sering Dibeli Bersama" cross-sell | Medium | Low |
| 35 | Bulk admin operations | Medium | Low |
| 36 | Admin order email notifications | Small | Medium |
| 37 | Contact form → email to admin | Small | Medium |
| 38 | Blog draft preview | Small | Medium |
| 39 | Admin audit trail (order status changes) | Medium | Low |
| 40 | Token in httpOnly cookie (not URL fragment) | Small | Medium |

---

## ═══════════════════════════════════════
## EXECUTION SUMMARY
## ═══════════════════════════════════════

| Phase | Tasks | Est. Time | Impact |
|---|---|---|---|
| 1: Security & Stability | 1-5 | 2-3 hours | 🔴 Critical |
| 2: Performance | 6-9 | 2-3 hours | 🔴 Speed fix |
| 3: Icon & Design | 10-16 | 3-4 hours | 🟡 Visual consistency |
| 4: Blog & Content | 17-20 | 2-3 hours | 🟡 Content growth |
| 5: Database & Schema | 21-22 | 1-2 hours | 🟡 Data integrity |
| 6: Product Discovery | 23-26 | 3-4 hours | 🟢 UX improvement |
| 7: Analytics | 27-28 | 1-2 hours | 🟢 Business intelligence |
| 8: Backlog | 29-40 | Ongoing | 🟢 Nice-to-have |

**Total estimated: 14-21 hours of focused implementation**

**Recommended execution order:** Phase 1 → Phase 2 → Phase 3 → rest as needed.
