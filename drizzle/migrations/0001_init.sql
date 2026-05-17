-- Migration: Initial schema for Asri Digital
-- Generated from Drizzle schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT,
  is_all_access INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  gpt_url TEXT,
  image_icon TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  dompetx_ref_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  original_amount INTEGER,
  discount_amount INTEGER DEFAULT 0,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  paid_at INTEGER,
  referred_by TEXT,
  payment_method TEXT,
  payment_channel TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER NOT NULL,
  discount_amount INTEGER,
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  min_order_amount INTEGER DEFAULT 0,
  valid_from INTEGER,
  valid_until INTEGER,
  is_active INTEGER DEFAULT 1,
  applies_to TEXT DEFAULT 'all',
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
  referred_by_user_id TEXT NOT NULL REFERENCES users(id),
  referred_user_id TEXT REFERENCES users(id),
  commission_amount INTEGER NOT NULL,
  commission_percent INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'PENDING',
  available_at INTEGER,
  paid_out_at INTEGER,
  payout_method TEXT,
  payout_details TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id TEXT REFERENCES users(id),
  author_name TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT,
  is_published INTEGER DEFAULT 0,
  published_at INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  view_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT REFERENCES users(id),
  order_id TEXT REFERENCES orders(id),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SENT',
  resend_id TEXT,
  error_message TEXT,
  sent_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
  site_name TEXT DEFAULT 'Asri Digital',
  site_tagline TEXT,
  commission_percent INTEGER DEFAULT 10,
  all_access_product_id TEXT,
  maintenance_mode INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_dompetx_ref ON orders(dompetx_ref_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliates_referred_by ON affiliates(referred_by_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
