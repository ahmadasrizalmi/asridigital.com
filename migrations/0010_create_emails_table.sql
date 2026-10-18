-- Migration: 0010_create_emails_table.sql
-- Create emails table for Asri Digital domain email client with anti-spam and security tracking

CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  message_id TEXT,
  in_reply_to TEXT,
  direction TEXT NOT NULL DEFAULT 'INBOUND', -- 'INBOUND' | 'OUTBOUND'
  folder TEXT NOT NULL DEFAULT 'inbox',      -- 'inbox' | 'sent' | 'spam' | 'trash' | 'archive'
  from_name TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  is_read INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  security_status TEXT DEFAULT 'VERIFIED',   -- 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS' | 'SPAM' | 'BLOCKED'
  spam_score INTEGER DEFAULT 0,
  spam_reasons TEXT,                         -- JSON array: ["JUDOL_KEYWORD:slot gacor", "SPF_FAIL"]
  spf_status TEXT DEFAULT 'none',            -- 'pass' | 'fail' | 'softfail' | 'none'
  dkim_status TEXT DEFAULT 'none',           -- 'pass' | 'fail' | 'none'
  dmarc_status TEXT DEFAULT 'none',          -- 'pass' | 'fail' | 'none'
  attachments_meta TEXT,                     -- JSON array of file metadata
  raw_headers TEXT,                          -- JSON dictionary of key security headers
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_folder_created ON emails (folder, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails (thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails (from_email);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails (folder, is_read);
