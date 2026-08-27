-- Cloudflare D1 Migration: Product Licenses for Masjid Display & Software Products
-- Migration Number: 0009

CREATE TABLE IF NOT EXISTS product_licenses (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    mosque_name TEXT NOT NULL,
    product_code TEXT NOT NULL DEFAULT 'MASJID',
    serial_id TEXT NOT NULL UNIQUE,
    license_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'refunded'
    issued_by TEXT NOT NULL DEFAULT 'system', -- 'system', 'admin_manual', 'promo'
    note TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexing for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_product_licenses_serial_id ON product_licenses(serial_id);
CREATE INDEX IF NOT EXISTS idx_product_licenses_customer_email ON product_licenses(customer_email);
CREATE INDEX IF NOT EXISTS idx_product_licenses_order_id ON product_licenses(order_id);
CREATE INDEX IF NOT EXISTS idx_product_licenses_created_at ON product_licenses(created_at DESC);