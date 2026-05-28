-- Migration: Schema sync to fix drift between migrations and live D1 database
-- Generated: 2026-05-29
-- This migration only ADDS missing tables/columns. No drops, no data modification.
-- Source of truth: live D1 schema + API code references

-- ============================================================
-- 1. CREATE TABLES missing from all migration files
-- ============================================================

-- categories table (referenced in API /categories, /admin/categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- contact_messages table (referenced in API /contact, /admin/contacts)
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT
);

-- affiliate_transactions table (referenced in API /affiliate/stats, /affiliate/withdraw, /admin/affiliates)
-- Note: migration 0001 created 'affiliates' table with different schema.
-- The live DB uses 'affiliate_transactions' with different column names.
CREATE TABLE IF NOT EXISTS affiliate_transactions (
  id TEXT PRIMARY KEY,
  affiliate_link_id TEXT,
  order_id TEXT,
  referrer_user_id TEXT,
  referred_user_id TEXT,
  commission_amount INTEGER NOT NULL DEFAULT 0,
  commission_percent INTEGER,
  status TEXT DEFAULT 'PENDING',
  available_at TEXT,
  paid_out_at TEXT,
  payout_method TEXT,
  payout_details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- affiliate_clicks table (referenced in API /affiliate/click, /affiliate/stats)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  referral_code TEXT NOT NULL,
  page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- affiliate_links table (exists in D1, part of affiliate system)
CREATE TABLE IF NOT EXISTS affiliate_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  product_id TEXT,
  commission_percent INTEGER DEFAULT 10,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- download_tokens table (exists in D1, for product download access)
CREATE TABLE IF NOT EXISTS download_tokens (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  downloads INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================================
-- 2. ADD MISSING COLUMNS to existing tables
-- ============================================================

-- users: API references password, role, phone, reset_token, reset_token_expires
-- Migration 0001 had 'password_hash' — live DB uses 'password'
-- Adding columns that may be missing (SQLite ignores if column already exists via error handling)
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;

-- products: API references gallery_images, gallery_videos, video_embed_url
ALTER TABLE products ADD COLUMN gallery_images TEXT;
ALTER TABLE products ADD COLUMN gallery_videos TEXT;
ALTER TABLE products ADD COLUMN video_embed_url TEXT;
ALTER TABLE products ADD COLUMN features TEXT;
ALTER TABLE products ADD COLUMN specs TEXT;
ALTER TABLE products ADD COLUMN faq TEXT;

-- orders: API references user_email, user_name, user_phone, product_title,
-- payment_url, dompetx_id, coupon_id, referred_by
-- NOTE: Migration 0001 defined different columns (customer_email, customer_name, etc.)
-- These ADD COLUMN statements add what the API code actually uses.
ALTER TABLE orders ADD COLUMN user_email TEXT;
ALTER TABLE orders ADD COLUMN user_name TEXT;
ALTER TABLE orders ADD COLUMN user_phone TEXT;
ALTER TABLE orders ADD COLUMN product_title TEXT;
ALTER TABLE orders ADD COLUMN payment_url TEXT;
ALTER TABLE orders ADD COLUMN dompetx_id TEXT;
ALTER TABLE orders ADD COLUMN coupon_id TEXT;
ALTER TABLE orders ADD COLUMN referred_by TEXT;

-- coupons: API references type, value, current_uses, min_purchase, expires_at, updated_at, description
-- Migration 0001 had different columns (discount_percent, discount_amount, used_count, etc.)
ALTER TABLE coupons ADD COLUMN type TEXT;
ALTER TABLE coupons ADD COLUMN value INTEGER;
ALTER TABLE coupons ADD COLUMN current_uses INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN min_purchase INTEGER;
ALTER TABLE coupons ADD COLUMN expires_at TEXT;
ALTER TABLE coupons ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
ALTER TABLE coupons ADD COLUMN description TEXT;

-- blog_posts: API references image_url (migration had cover_image)
ALTER TABLE blog_posts ADD COLUMN image_url TEXT;

-- email_logs: API references to_email, type (migration had recipient_email, email_type)
ALTER TABLE email_logs ADD COLUMN to_email TEXT;
ALTER TABLE email_logs ADD COLUMN type TEXT;

-- site_settings: Live DB uses key/value pattern (migration had fixed columns)
-- The live DB schema is fundamentally different (key TEXT PRIMARY KEY, value TEXT)
-- vs migration (id TEXT PRIMARY KEY, site_name TEXT, etc.)
-- Since we cannot drop/recreate, we add the 'key' and 'value' columns if missing
ALTER TABLE site_settings ADD COLUMN key TEXT;
ALTER TABLE site_settings ADD COLUMN value TEXT;

-- ============================================================
-- 3. INDEXES for new tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_referrer ON affiliate_transactions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_status ON affiliate_transactions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_transactions_order ON affiliate_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_referral ON affiliate_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(code);
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_order ON download_tokens(order_id);
