# 🚀 Panduan Deploy ke Cloudflare

## Prerequisites

1. **Login ke Wrangler**
```bash
cd /Users/admin/asridigital
npx wrangler login
```

2. **Cek konfigurasi**
```bash
npx wrangler d1 list
```

---

## Opsi 1: Deploy Semua Sekaligus (RECOMMENDED)

Jalankan ini untuk deploy semua perubahan:

```bash
cd /Users/admin/asridigital
./scripts/deploy-all.sh
```

Ini akan menjalankan:
- ✅ Migration database (0007)
- ✅ Update sample data gallery
- ✅ Make admin untuk email Anda
- ✅ Build project
- ✅ Deploy ke Cloudflare Pages

---

## Opsi 2: Deploy Step-by-Step

### Step 1: Database Migration

```bash
cd /Users/admin/asridigital
npx wrangler d1 execute asri-digital-db --remote --file migrations/0007_add_product_gallery.sql
```

### Step 2: Update Gallery Data

```bash
npx wrangler d1 execute asri-digital-db --remote --file scripts/0008_update_gallery_data.sql
```

### Step 3: Make Admin

```bash
npx wrangler d1 execute asri-digital-db --remote --file scripts/0009_make_admin.sql
```

Atau gunakan script:

```bash
./scripts/make-admin.sh
```

### Step 4: Build Project

```bash
npm run build
```

### Step 5: Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=asridigital-com --branch=main
```

---

## 🔍 Verifikasi

### Cek Database
```bash
# Cek tabel products
npx wrangler d1 execute asri-digital-db --remote --command "SELECT id, title, gallery_images, features FROM products LIMIT 3"

# Cek user admin
npx wrangler d1 execute asri-digital-db --remote --command "SELECT id, name, email, role FROM users WHERE email = 'ahmadasrizalmi@gmail.com'"
```

### Cek Website

1. Buka: https://asridigital.com
2. Cek apakah tombol "Detail" muncul di product card
3. Klik "Detail" pada produk apapun
4. Cek apakah halaman detail muncul

### Cek Admin Panel

1. Buka: https://asridigital.com/admin
2. Login dengan email: `ahmadasrizalmi@gmail.com`
3. Masukkan password Anda
4. Cek apakah bisa masuk dan melihat dashboard

---

## 🐛 Troubleshooting

### Error: "Not logged in"
```bash
npx wrangler login
```

### Error: "Database not found"
```bash
# Cek daftar database
npx wrangler d1 list

# Jika tidak ada, buat baru
npx wrangler d1 create asri-digital-db
```

### Error: "Build failed"
```bash
# Install dependencies
npm install

# Build lagi
npm run build
```

### Error: "Deploy failed"
```bash
# Cek project name di wrangler.toml
cat wrangler.toml

# Pastikan project name sesuai
# Jika berbeda, ganti di command deploy
```

---

## 📋 Checklist

Sebelum deploy, pastikan:

- [ ] Login ke wrangler (`npx wrangler login`)
- [ ] Database `asri-digital-db` sudah dibuat
- [ ] Git changes sudah di-commit (opsional)
- [ ] Dependencies sudah terinstall (`npm install`)
- [ ] Test build locally (`npm run build && npm run preview`)

---

## ⏱️ Estimasi Waktu

| Step | Waktu |
|------|-------|
| Login wrangler | 2 menit |
| Migration DB | 1 menit |
| Update data | 1 menit |
| Make admin | 10 detik |
| Build project | 2-3 menit |
| Deploy | 3-5 menit |
| **Total** | **~10 menit** |

---

## 📞 Support

Jika ada masalah:
1. Cek log error di terminal
2. Cek Cloudflare Dashboard → Pages
3. Cek Cloudflare Dashboard → D1
4. Hubungi support: support@asridigital.com

---

## 🎯 After Deploy

1. Clear browser cache
2. Test semua fitur baru
3. Upload gambar/video ke `public/images/` dan `public/videos/`
4. Update produk via admin panel
5. Monitor error logs di Cloudflare

---

Created: 2026-05-18
Last Updated: 2026-05-18