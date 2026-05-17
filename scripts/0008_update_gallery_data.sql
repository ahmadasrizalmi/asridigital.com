-- Update sample products with gallery data
-- This adds example gallery images, videos, features, specs, and FAQ

-- Update Animasi Muslim Kids Studio
UPDATE products SET
  gallery_images = '["/images/animasi-muslim.jpg", "/images/animasi-muslim-2.jpg", "/images/animasi-muslim-3.jpg"]',
  gallery_videos = '["/videos/animasi-demo.mp4"]',
  video_embed_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  features = '[{"icon":"sparkles","title":"100+ Template Animasi","description":"Template siap pakai untuk konten YouTube dan Instagram"},{"icon":"zap","title":"Generate Cepat","description":"Hasilkan animasi dalam hitungan detik"},{"icon":"shield","title":"100% Islami","description":"Konten sesuai syariat Islam"}]',
  specs = '{"Format":"MP4, MOV","Resolusi":"1080p, 720p","Durasi":"5-60 detik","Lisensi":"Komersial","Update":"Seumur hidup"}',
  faq = '[{"question":"Apakah lisensi komersial?","answer":"Ya, Anda bisa menggunakan untuk konten komersial YouTube, Instagram, dll."},{"question":"Format apa saja?","answer":"Video dalam format MP4 dan MOV dengan resolusi 1080p dan 720p."}]'
WHERE id = 'gpt-animasi-muslim';

-- Update Sahabat Guru PAUD Islami
UPDATE products SET
  gallery_images = '["/images/sahabat-guru.jpg", "/images/sahabat-guru-2.jpg"]',
  features = '[{"icon":"book","title":"RPP Siap Pakai","description":"RPP lengkap sesuai kurikulum"},{"icon":"users","title":"Materi Interaktif","description":"Materi pembelajaran yang menarik untuk anak"},{"icon":"check-circle","title":"Evaluasi Otomatis","description":"Buat soal dan evaluasi dengan mudah"}]',
  specs = '{"Kurikulum":"PAUD, TK","Usia":"3-6 tahun","Jenis Materi":"RPP, LKP, Media","Format":"PDF, DOCX"}',
  faq = '[{"question":"Apakah sesuai kurikulum?","answer":"Ya, materi disusun sesuai kurikulum PAUD nasional."},{"question":"Bisa untuk usia berapa?","answer":"Materi dirancang khusus untuk anak usia 3-6 tahun."}]'
WHERE id = 'gpt-sahabat-guru';

-- Update Content Creator Pro
UPDATE products SET
  gallery_images = '["/images/content-creator.jpg", "/images/content-creator-2.jpg", "/images/content-creator-3.jpg"]',
  gallery_videos = '["/videos/content-creator-demo.mp4"]',
  video_embed_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  features = '[{"icon":"sparkles","title":"50+ Template Caption","description":"Template caption untuk Instagram, TikTok, Facebook"},{"icon":"trending-up","title":"Trend Analyzer","description":"Analisis tren konten terkini"},{"icon":"zap","title":"Generate Viral","description":"Buat konten yang berpotensi viral"}]',
  specs = '{"Platform":"Instagram, TikTok, Facebook, Twitter","Jenis Konten":"Caption, Script, Ide","Bahasa":"Indonesia, Inggris","Output":"Siap publish"}',
  faq = '[{"question":"Platform apa saja?","answer":"Mendukung Instagram, TikTok, Facebook, dan Twitter."},{"question":"Bahasa apa yang didukung?","answer":"Indonesia dan Inggris dengan variasi gaya bahasa."}]'
WHERE id = 'gpt-content-creator';

-- Update Copywriter AI
UPDATE products SET
  gallery_images = '["/images/copywriter.jpg", "/images/copywriter-2.jpg"]',
  features = '[{"icon":"sparkles","title":"30+ Framework Copy","description":"Framework AIDA, PAS, FAB, dan lainnya"},{"icon":"target","title":"Targeted Copy","description":"Copy sesuai target audience"},{"icon":"trending-up","title":"High Converting","description":"Copy yang terbukti meningkatkan konversi"}]',
  specs = '{"Framework":"AIDA, PAS, FAB, BAB, STPB","Jenis Copy":"Sales page, Ads, Email, Landing Page","Bahasa":"Indonesia, Inggris","Output":"Siap publish"}',
  faq = '[{"question":"Framework apa saja?","answer":"AIDA, PAS, FAB, BAB, STPB dan framework copywriting lainnya."},{"question":"Untuk apa saja?","answer":"Sales page, iklan, email marketing, landing page, dan lainnya."}]'
WHERE id = 'gpt-copywriter';

-- Update Code Helper Pro
UPDATE products SET
  gallery_images = '["/images/code-helper.jpg", "/images/code-helper-2.jpg", "/images/code-helper-3.jpg"]',
  gallery_videos = '["/videos/code-helper-demo.mp4"]',
  video_embed_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  features = '[{"icon":"code","title":"Support 20+ Bahasa","description":"Python, JavaScript, PHP, Java, C++, dan lainnya"},{"icon":"zap","title":"Debug Cepat","description":"Temukan dan perbaiki bug dalam hitungan detik"},{"icon":"check-circle","title":"Code Review","description":"Review dan optimasi kode otomatis"}]',
  specs = '{"Bahasa":"Python, JS, PHP, Java, C++, Go, Rust, Swift","Fitur":"Debug, Refactor, Generate, Explain","Output":"Siap pakai"}',
  faq = '[{"question":"Bahasa apa saja?","answer":"Python, JavaScript, PHP, Java, C++, Go, Rust, Swift, dan 12+ lainnya."},{"question":"Bisa debug kode?","answer":"Ya, bisa menganalisis dan memperbaiki bug dalam kode Anda."}]'
WHERE id = 'gpt-code-helper';

-- Update Lifetime All-Access Pass
UPDATE products SET
  gallery_images = '["/images/all-access-banner.jpg", "/images/all-access-2.jpg"]',
  features = '[{"icon":"crown","title":"Akses Semua Produk","description":"Semua Custom GPT saat ini dan yang akan datang"},{"icon":"refresh-cw","title":"Update Gratis","description":"Dapatkan update produk seumur hidup"},{"icon":"users","title":"Support Priority","description":"Support prioritas via WhatsApp dan Email"}]',
  specs = '{"Akses":"Semua produk (lifetime)","Update":"Gratis seumur hidup","Support":"Priority via WhatsApp & Email","Lisensi":"Personal + Komersial"}',
  faq = '[{"question":"Produk apa saja yang didapat?","answer":"Semua Custom GPT yang ada saat ini dan semua produk baru di masa depan."},{"question":"Apakah ada biaya tambahan?","answer":"Tidak, sekali bayar, akses seumur hidup tanpa biaya tambahan."}]'
WHERE id = 'ALL-ACCESS';