-- Add is_hot field to products table
-- Hot Products = newly launched, must be purchased individually
-- Non-hot products = available via Lifetime All-Access Pass
ALTER TABLE products ADD COLUMN is_hot INTEGER DEFAULT 0;

-- Mark existing featured products as hot by default
UPDATE products SET is_hot = 1 WHERE is_featured = 1;
