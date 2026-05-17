-- Seed Products
INSERT OR IGNORE INTO products (id, title, slug, description, short_description, price, compare_at_price, gpt_url, image_icon, category, tags, is_active, is_featured, sort_order) VALUES
('ALL-ACCESS', 'Lifetime All-Access Pass', 'lifetime-all-access-pass', 
 'Akses seluruh Custom GPT yang ada saat ini dan semua update di masa depan. Bayar sekali, akses seumur hidup!',
 'Akses unlimited ke semua Custom GPT. Sekali bayar, seumur hidup.',
 299000, 599000, NULL, '/images/all-access-banner.jpg', 'membership', 
 '["all-access","premium","best-value"]', 1, 1, 0),

('gpt-animasi-muslim', 'Animasi Muslim Kids Studio', 'animasi-muslim-kids-studio',
 'GPT khusus untuk membuat konten animasi Islami untuk anak-anak. Cocok untuk konten YouTube, Instagram, dan media pembelajaran.',
 'Buat konten animasi Islami untuk anak-anak dengan AI',
 99000, 149000, 'https://chatgpt.com/g/g-6a06bc1c2e5481918d9767aa00048789-animasi-muslim-kids-studio',
 '/images/animasi-muslim.jpg', 'kreatif', 
 '["animasi","islami","anak","youtube"]', 1, 1, 1),

('gpt-sahabat-guru', 'Sahabat Guru PAUD Islami', 'sahabat-guru-paud-islami',
 'GPT asisten untuk guru PAUD Islami. Bantu buat RPP, materi pembelajaran, dan evaluasi.',
 'Asisten AI untuk guru PAUD Islami',
 79000, NULL, 'https://chatgpt.com/g/g-6a06d28370f4819189acb6d1815a5df6-sahabat-guru-paud-islami',
 '/images/sahabat-guru.jpg', 'pendidikan', 
 '["guru","paud","islami","pendidikan"]', 1, 0, 2),

('gpt-content-creator', 'Content Creator Pro', 'content-creator-pro',
 'GPT untuk membuat konten marketing yang engaging. Cocok untuk social media manager dan content creator.',
 'Buat konten marketing viral dengan AI',
 89000, 129000, '#', '/images/content-creator.jpg', 'marketing', 
 '["content","marketing","social-media","instagram"]', 1, 0, 3),

('gpt-copywriter', 'Copywriter AI', 'copywriter-ai',
 'GPT untuk menulis copywriting yang menjual. Cocok untuk sales page, ads, dan email marketing.',
 'Tulis copywriting yang menjual dengan AI',
 79000, 119000, '#', '/images/copywriter.jpg', 'marketing', 
 '["copywriting","sales","ads","email"]', 1, 0, 4),

('gpt-code-helper', 'Code Helper Pro', 'code-helper-pro',
 'GPT untuk membantu coding dan debugging. Support berbagai bahasa pemrograman.',
 'Asisten coding dan debugging AI',
 99000, 149000, '#', '/images/code-helper.jpg', 'coding', 
 '["coding","programming","debug","developer"]', 1, 0, 5);

-- Seed Coupons
INSERT OR IGNORE INTO coupons (id, code, type, value, min_purchase, max_uses, current_uses, is_active, expires_at) VALUES
('coupon-launch50', 'LAUNCH50', 'PERCENTAGE', 50, 50000, 100, 0, 1, '2026-12-31 23:59:59'),
('coupon-diskon20k', 'DISKON20K', 'FIXED', 20000, 50000, 50, 0, 1, '2026-12-31 23:59:59'),
('coupon-welcome10', 'WELCOME10', 'PERCENTAGE', 10, NULL, 1000, 0, 1, NULL);

-- Seed Admin User (password: admin123)
INSERT OR IGNORE INTO users (id, name, email, password, is_all_access) VALUES
('user-admin', 'Admin', 'admin@asridigital.com', 
 'jZae727KPxQOynBGErVKnJPFo0wFCkqNJKVe3HhBsfY=', -- SHA256 of 'admin123'
 1);

-- Seed Site Settings
INSERT OR IGNORE INTO site_settings (key, value) VALUES
('site_name', 'Asri Digital'),
('site_description', 'Custom GPT untuk Profesional Indonesia'),
('site_url', 'https://asridigital-com.pages.dev'),
('contact_email', 'support@asridigital.com'),
('whatsapp_number', '628123456789'),
('currency', 'IDR'),
('dompetx_merchant_id', ''),
('affiliate_default_commission', '10'),
('affiliate_minimum_withdrawal', '50000'),
('fomo_enabled', 'true'),
('fomo_interval', '30000');

-- Seed Blog Posts
INSERT OR IGNORE INTO blog_posts (id, title, slug, content, excerpt, category, tags, is_published, published_at, author_name) VALUES
('blog-1', 'Cara Memaksimalkan Custom GPT untuk Bisnis', 'cara-memaksimalkan-custom-gpt-untuk-bisnis',
 '# Cara Memaksimalkan Custom GPT untuk Bisnis

Custom GPT telah menjadi game-changer dalam dunia bisnis digital. Dengan kemampuan AI yang terus berkembang, Anda bisa memanfaatkan Custom GPT untuk meningkatkan produktivitas hingga 10x lipat.

## Apa itu Custom GPT?

Custom GPT adalah versi khusus dari ChatGPT yang telah dioptimalkan untuk tugas tertentu. Tidak seperti ChatGPT biasa, Custom GPT memiliki:

- **Pengetahuan spesifik** tentang domain tertentu
- **Instruksi khusus** yang membuatnya lebih fokus
- **Kemampuan tambahan** sesuai kebutuhan Anda

## 5 Cara Menggunakan Custom GPT untuk Bisnis

### 1. Customer Service Otomatis
Gunakan Custom GPT untuk menjawab pertanyaan pelanggan secara otomatis 24/7.

### 2. Content Creation
Buat konten marketing, blog post, dan social media dalam hitungan menit.

### 3. Market Research
Analisis tren pasar dan kompetitor dengan cepat dan akurat.

### 4. Email Marketing
Tulis email yang converting dengan bahasa yang persuasif.

### 5. Data Analysis
Analisis data bisnis dan dapatkan insight yang actionable.

## Kesimpulan

Custom GPT bukan hanya tools, tapi partner bisnis yang bisa membantu Anda scale up dengan efisien.',
 'Pelajari bagaimana Custom GPT dapat meningkatkan produktivitas bisnis Anda hingga 10x lipat...',
 'AI', '["ai","bisnis","productivity","custom-gpt"]', 1, '2026-05-17 10:00:00', 'Admin'),

('blog-2', '5 Tips Menggunakan AI untuk Content Creation', '5-tips-menggunakan-ai-untuk-content-creation',
 '# 5 Tips Menggunakan AI untuk Content Creation

Content creation bisa lebih mudah dengan bantuan AI. Berikut 5 tips yang bisa Anda terapkan.

## 1. Gunakan AI sebagai Starting Point

Jangan gunakan AI untuk membuat konten 100%. Gunakan sebagai draft awal, lalu edit sesuai gaya Anda.

## 2. Berikan Context yang Jelas

Semakin jelas prompt yang Anda berikan, semakin bagus hasilnya.

## 3. Review dan Edit

Selalu review hasil AI sebelum publish. Pastikan fakta akurat dan sesuai brand voice Anda.

## 4. Kombinasikan dengan Data

Gunakan data analytics untuk mengetahui konten apa yang diminati audience Anda.

## 5. Konsisten

Konsistensi adalah kunci. Gunakan AI untuk maintain jadwal posting yang konsisten.',
 'Content creation bisa lebih mudah dengan bantuan AI. Berikut 5 tips yang bisa Anda terapkan...',
 'Productivity', '["ai","content","tips","productivity"]', 1, '2026-05-15 10:00:00', 'Admin');
