-- Migration: Add role column to users table
-- Date: 2026-05-17

-- Add role column
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Create admin user (demo@asridigital.com with demo123)
-- Note: Password hash should be updated with proper PBKDF2 hash
UPDATE users SET role = 'admin' WHERE email = 'demo@asridigital.com';

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
