-- Migration: Hero Slides table
-- Enables dynamic homepage hero slider managed via admin panel

CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  image_desktop TEXT NOT NULL,
  image_mobile TEXT NOT NULL,
  link_type TEXT DEFAULT 'none',
  link_target TEXT,
  badge_text TEXT,
  badge_color TEXT DEFAULT 'primary',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active, sort_order);

-- Seed: 2 initial slides
INSERT INTO hero_slides (id, title, subtitle, cta_text, cta_link, image_desktop, image_mobile, link_type, link_target, badge_text, badge_color, sort_order, is_active) VALUES
('slide-promo-001', 'Custom GPT untuk Profesional Indonesia', 'Akses berbagai Custom GPT siap pakai untuk marketing, coding, bisnis, dan banyak lagi. Bayar sekali, akses seumur hidup.', 'Beli All-Access Pass', '#all-access', 'https://res.cloudinary.com/daj8fzinf/image/upload/q_auto,f_auto/v1779924707/ChatGPT_Image_May_26_2026_03_00_18_PM_lanscape_k1zocx.png', 'https://res.cloudinary.com/daj8fzinf/image/upload/q_auto,f_auto/v1779924707/ChatGPT_Image_May_26_2026_02_57_33_PM_lanscape_ja1uwr.png', 'none', NULL, '🚀 Promo Launching - Diskon 50%', 'amber', 0, 1),
('slide-product-001', 'Animasi Muslim Kids Studio', 'Buat konten animasi Islami untuk anak-anak dengan AI', 'Lihat Produk', '/product/animasi-muslim-kids-studio', 'https://res.cloudinary.com/daj8fzinf/image/upload/q_auto,f_auto/v1779924707/ChatGPT_Image_May_26_2026_02_54_48_PM_cxabqr.png', 'https://res.cloudinary.com/daj8fzinf/image/upload/q_auto,f_auto/v1779924707/ChatGPT_Image_May_26_2026_03_00_18_PM_k6k9bl.png', 'product', 'animasi-muslim-kids-studio', NULL, 'primary', 1, 1);
