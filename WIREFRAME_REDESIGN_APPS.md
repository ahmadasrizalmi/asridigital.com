# RANCANGAN WIREFRAME LOW-FIDELITY & ARSITEKTUR REDESIGN ASRIDIGITAL.COM
**Proyek:** Redesign Asri Digital (Software House & App Studio)  
**Dokumen:** Arsitektur Halaman & Wireframe Section Apps  
**Lokasi Simpan:** `D:\kanda-project\asridigital.com\WIREFRAME_REDESIGN_APPS.md`  

---

## 1. Konsep Penyajian Section "Apps" di Halaman Beranda (`/`)

Di halaman depan, section **Aplikasi Unggulan (Our Native Apps)** ditempatkan setelah *About/Keunggulan Kami* dan sebelum *Layanan Jasa*. 
Setiap aplikasi disajikan dalam bentuk **Interactive Showcase Card (2 Kolom di Desktop)** yang memadukan mock-up perangkat, ringkasan fitur, bukti sosial (rating & download), serta aksi ganda (Download Play Store & Buka Landing Page).

### Wireframe ASCII (Homepage Section: #apps)

```text
+-----------------------------------------------------------------------------------------+
|                                    KARYA & PRODUK KAMI                                  |
|                            Aplikasi Android Resmi di Google Play                        |
|   Kami tidak hanya menawarkan jasa, tapi juga membangun dan memelihara produk software  |
|   mandiri yang digunakan oleh ribuan pengguna aktif di Indonesia dan internasional.      |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [ CARD APLIKASI 1: MASJID DISPLAY ]          [ CARD APLIKASI 2: JAPANESE PDF TO WORD ] |
|  +---------------------------------------+    +---------------------------------------+ |
|  | [Badge: Android TV & Mobile]          |    | [Badge: Utility & Education]          | |
|  |                                       |    |                                       | |
|  |  +---------+   Masjid Display         |    |  +---------+   Japanese PDF to Word   | |
|  |  | [ICON]  |   Sistem Informasi TV &  |    |  | [ICON]  |   Konverter PDF Jepang ke| |
|  |  | 64x64   |   Remote Takmir Offline  |    |  | 64x64   |   Word (Furigana Edition)| |
|  |  +---------+                          |    |  +---------+                          | |
|  |                                       |    |                                       | |
|  |  * Rating: 5.0 (100+ DKM Masjid)      |    |  * Rating: 4.9 (500+ Pelajar & Guru)  | |
|  |  * 100% Offline Tanpa Cloud           |    |  * Native Word Ruby (<w:ruby>)        | |
|  |  * Kontrol via Wi-Fi Lokal HP         |    |  * 100% Offline & Aman di Perangkat   | |
|  |                                       |    |                                       | |
|  |  [ PREVIEW MOCKUP TV & SMARTPHONE ]   |    |  [ PREVIEW 2x SMARTPHONE MOCKUP ]     | |
|  |  (Screenshot Tampilan TV Masjid)      |    |  (Mockup Goldie HP + DOCX Word View)  | |
|  |                                       |    |                                       | |
|  |  -----------------------------------  |    |  -----------------------------------  | |
|  |  [ > Google Play ] [ Detail Apps -> ] |    |  [ > Google Play ] [ Detail Apps -> ] | |
|  +---------------------------------------+    +---------------------------------------+ |
|                                                                                         |
|                    [ Tombol: Lihat Seluruh Portofolio Aplikasi -> (/apps) ]             |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Halaman Induk Portofolio Aplikasi (`/apps`)

Halaman ini berfungsi sebagai **Katalog Resmi Aplikasi Asri Digital** (App Hub).
- Mengelompokkan aplikasi berdasarkan kategori (*Android TV*, *Education / Productivity*, *Business Tools*).
- Menampilkan changelog rilis terbaru, status platform, dan tombol unduh APK langsung bagi perangkat tanpa Play Store (misal Android TV Box STB).

---

## 3. Wireframe Landing Page Khusus Aplikasi (`/apps/japanese-pdf-to-word`)

Halaman ini dirancang khusus untuk memenuhi standar Google Play Store dan memaksimalkan konversi unduhan pengguna.

### Wireframe ASCII (Landing Page Aplikasi)

```text
+-----------------------------------------------------------------------------------------+
| [NAVBAR] Asri Digital > Apps > Japanese PDF to Word                                    |
+-----------------------------------------------------------------------------------------+
| [1. HERO SECTION]                                                                       |
|   Badge: Versi 1.0.0 Resmi Dirilis                                                      |
|   Headline: Konversi PDF Bahasa Jepang ke Word (.docx) Tanpa Merusak Furigana           |
|   Subhead: 100% Offline langsung di HP Anda. Mempertahankan susunan kanji, bacaan       |
|            furigana di atas kanji, dan tabel multi-kolom secara presisi.                |
|                                                                                         |
|   [ Tombol: Get it on Google Play ]   [ Tombol: Download APK Langsung (.apk) ]          |
|                                                                                         |
|   [ MOCKUP HP UTAMA DENGAN TAMPILAN APLIKASI ]                                          |
+-----------------------------------------------------------------------------------------+
| [2. PROBLEM VS SOLUTION]                                                                |
|   * Masalah: Teks kanji di PDF saat di-copy ke Word furigana-nya berantakan / hilang.   |
|   * Solusi Kami: Menghasilkan struktur dokumen Word OpenXML dengan tag Furigana asli.   |
+-----------------------------------------------------------------------------------------+
| [3. FITUR UNGGULAN (4 GRID CARD)]                                                       |
|   [Card 1] Furigana Asli Word         |  [Card 2] Deteksi Multi-Kolom Kosakata          |
|   Bacaan otomatis di atas kanji.      |  Daftar kata 2/3 kolom terurut atas-ke-bawah.   |
|   ------------------------------------+---------------------------------------------|
|   [Card 3] 100% Offline & Privat      |  [Card 4] Opsi Freemium & PRO                   |
|   File tidak pernah diunggah ke server|  3 halaman gratis per file atau beli putus PRO. |
+-----------------------------------------------------------------------------------------+
| [4. GALERI SCREENSHOT MOCKUP GOOGLE PLAY] (Hasil Render Goldie)                         |
|   [01. Pilih PDF] [02. Opsi Furigana] [03. Progress 68%] [04. Sukses] [05. Hasil Word]  |
+-----------------------------------------------------------------------------------------+
| [5. PRICING / SKEMA AKSES]                                                              |
|   - Gratis: 3 Halaman Pertama per dokumen                                               |
|   - Nonton Video: +10 Halaman Tambahan                                                  |
|   - Lisensi PRO Seumur Hidup: Rp 49.000 (Sekali bayar tanpa langganan)                  |
+-----------------------------------------------------------------------------------------+
| [6. LEGAL & DUKUNGAN]                                                                   |
|   -> Kebijakan Privasi Resmi: /apps/japanese-pdf-to-word/privacy                        |
|   -> Syarat & Ketentuan: /terms                                                         |
|   -> Panduan Penggunaan: /guide                                                         |
|   -> Email Support: support@asridigital.com / WhatsApp                                  |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Halaman Kebijakan Privasi Resmi (`/apps/japanese-pdf-to-word/privacy`)

Halaman ini diformat bersih, cepat dimuat, dan langsung memenuhi verifikasi Google Play Console:
* **URL Permanen:** `https://asridigital.com/apps/japanese-pdf-to-word/privacy`
* **Poin Utama Kebijakan:**
  1. Jaminan Pemrosesan 100% Lokal & Offline (Zero Cloud Storage).
  2. Integrasi Iklan Berhadiah Google AdMob & Advertising ID.
  3. Sistem Pembayaran Resmi Google Play In-App Billing.
  4. Hak Pengguna & Kontak Pengembang Resmi.

---

## 5. Rangkuman Integrasi Menu Navbar Utama (`Header.astro`)

```text
[ LOGO ASRI DIGITAL ]       [ Jasa Software ]  [ Aplikasi Android ]  [ Produk Digital ]  [ Blog ]       [ Konsultasi WhatsApp ]
```
- **Jasa Software** -> Scroll ke `#services` di beranda.
- **Aplikasi Android** -> Menuju ke `/apps` (atau dropdown: *Masjid Display* & *Japanese PDF to Word*).
- **Produk Digital** -> Menuju ke `/products` (Katalog marketplace digital).
