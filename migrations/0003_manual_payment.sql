-- ============================================================
-- Migration 0003: Manual Payment Mode
-- Adds columns for manual payment confirmation flow
-- (DompetX gateway is shutting down - fallback to manual)
-- Run: npx wrangler d1 execute asri-digital-db --remote --file=migrations/0003_manual_payment.sql
-- ============================================================

-- When the customer clicked "Saya sudah bayar" (manual confirmation)
ALTER TABLE orders ADD COLUMN payment_confirmed_at TEXT;

-- Optional manual payment reference (bank transfer reference, etc.)
ALTER TABLE orders ADD COLUMN payment_reference TEXT;

-- Payment settings for manual mode
INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES ('payment_mode', 'manual', datetime('now'));
INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES ('bank_name', '', datetime('now'));
INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES ('bank_account_number', '', datetime('now'));
INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES ('bank_account_holder', '', datetime('now'));
INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES ('qris_image_url', '', datetime('now'));
