-- Migration: Add reset_token columns to users table
-- Date: 2026-05-17

ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;
ALTER TABLE users ADD COLUMN phone TEXT;

-- Add index for reset token lookup
CREATE INDEX idx_users_reset_token ON users(reset_token);
