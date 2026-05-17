-- Add gallery fields to products table
-- This allows multiple images and videos per product

-- Add gallery_images column (JSON array of image URLs)
ALTER TABLE products ADD COLUMN gallery_images TEXT;

-- Add gallery_videos column (JSON array of video URLs)
ALTER TABLE products ADD COLUMN gallery_videos TEXT;

-- Add video_embed_url column (YouTube/Vimeo embed URL)
ALTER TABLE products ADD COLUMN video_embed_url TEXT;

-- Add features column (JSON array of product features/benefits)
ALTER TABLE products ADD COLUMN features TEXT;

-- Add specs column (JSON object with product specifications)
ALTER TABLE products ADD COLUMN specs TEXT;

-- Add faq column (JSON array of FAQ objects)
ALTER TABLE products ADD COLUMN faq TEXT;