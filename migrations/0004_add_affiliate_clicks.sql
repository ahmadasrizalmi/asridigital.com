-- Migration: Add affiliate_clicks table for click tracking
-- Date: 2026-05-17

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  referral_code TEXT NOT NULL,
  page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_affiliate_clicks_referral ON affiliate_clicks(referral_code);
CREATE INDEX idx_affiliate_clicks_created ON affiliate_clicks(created_at);

-- Update affiliate stats query to include clicks
-- This will be used in the API
