# Rencana Arsitektur & Copywriting Landing Page: Assalam TV (3 Bahasa)
**Lokasi Proyek:** `asridigital.com`  
**Sumber Aset Mockup:** `D:\9 KANDA\APPS Android\assalam-tv\designs\Capture screen`  
**Format:** Multi-Bahasa Independen (Bahasa Indonesia, English, العربية)

---

## DAFTAR ISI
1. [Analisa Produk & Fitur Pembeda Utama (Core USPs)](#1-analisa-produk--fitur-pembeda-utama-core-usps)
2. [Pemetaan Aset Gambar (Asset Mapping)](#2-pemetaan-aset-gambar-asset-mapping)
3. [Arsitektur Desain: Tema Warna & Orientasi](#3-arsitektur-desain-tema-warna--orientasi)
4. [Struktur Section Landing Page](#4-struktur-section-landing-page)
5. [Copywriting Lengkap - Versi Bahasa Indonesia](#5-copywriting-lengkap---versi-bahasa-indonesia)
6. [Complete Copywriting - English Version](#6-complete-copywriting---english-version)
7. [النص التسويقي الكامل - النسخة العربية](#7-النص-التسويقي-الكامل---النسخة-العربية)
8. [Panduan Implementasi Teknis di Astro (`asridigital.com`)](#8-panduan-implementasi-teknis-di-astro-asridigitalcom)

---

## 1. Analisa Produk & Fitur Pembeda Utama (Core USPs)

Berdasarkan analisa mendalam terhadap arsitektur aplikasi `Assalam TV` dan visualisasi pada folder `Capture screen`, Assalam TV memecahkan **masalah terbesar yang dialami oleh ribuan pengurus masjid (DKM)** saat menggunakan TV informasi jadwal sholat.

### Masalah Besar di Pasar (Competitor Pain Points):
1. **Transfer Media Sangat Melelahkan:** Produk sejenis mengharuskan pengurus masjid menginstal aplikasi pihak ketiga seperti **ShareIt** ke TV, mencolokkan flashdisk manual ke TV di dinding yang tinggi, atau setup FTP. Setelah file masuk, pengurus harus mencari file lewat file explorer TV menggunakan remote TV yang kaku.
2. **Ketergantungan Cloud & Langganan Bulanan:** Banyak aplikasi berbasis web atau cloud; saat internet masjid mati atau kuota habis, jadwal sholat mati atau blank. Ada juga biaya langganan bulanan/tahunan yang memberatkan kas masjid.
3. **Desain Monoton Serba Hijau:** Hampir semua display masjid di pasaran hanya bernuansa hijau tradisional dengan layout yang kaku, tidak cocok dengan interior masjid modern, masjid berarsitektur marmer, kayu jati, atau arsitektur minimalis modern.
4. **Tidak Mendukung TV Vertikal (Standing Kiosk):** Tren masjid modern banyak menggunakan TV berdiri (standing totem/kiosk) di selasar, lorong wudhu, dan pintu masuk. Display biasa rusak saat diputar ke mode vertikal.

### 5 Fitur Utama yang Diberi Sorotan Utama (Core Highlights):
1. **Transfer Media Instan Tanpa Aplikasi Pihak Ketiga (Zero ShareIt, Zero Flashdisk):**
   * *The Killer Feature:* Pengurus DKM cukup membuka aplikasi **Assalam TV Admin** di smartphone Android, pilih foto pengumuman/kajian dari galeri HP, klik kirim via Wi-Fi lokal, dan media **langsung tampil di layar TV**. 
   * TV menyimpan media secara lokal di memori internalnya. HP admin bisa langsung dimatikan dan TV tetap jalan mandiri.
2. **6 Tema Warna Elegan & Eksklusif (Bukan Hanya Hijau!):**
   * **Zamrud:** Hijau emerald klasik islami.
   * **Lazuardi:** Biru safir kerajaan yang sejuk, damai, dan tenang.
   * **Andalusia:** Nuansa hangat emas & terakota, terinspirasi kejayaan peradaban Islam Spanyol.
   * **Delima:** Merah rubi pekat yang agung, berkarakter, dan mewah.
   * **Nila:** Ungu indigo berwibawa untuk suasana hening dan kontemplatif.
   * **Obsidian:** Mode gelap (Dark Luxury) dengan aksen *champagne gold*, sempurna untuk interior arsitektur kontemporer dan hemat daya display.
3. **Fleksibilitas Orientasi: Horizontal & Vertikal Murni (Standing Kiosk/Totem):**
   * Tersedia layout **Horizontal Standard**, **Sidebar Kiri**, **Sidebar Kanan**, dan **Vertical / Portrait Mode** murni yang didesain proporsional khusus TV standing / totem digital.
4. **Multi-Bahasa Asli (Bahasa Indonesia, English, العربية):**
   * Bukan terjemahan mesin acak; antarmuka TV dan Admin dirancang secara native dalam 3 bahasa dengan tipografi dan kaligrafi yang proporsional. Siap untuk masjid lokal, masjid raya, hingga masjid internasional di mancanegara.
5. **State Mesin Sholat Cerdas & Khusyuk (Prayer State Machine):**
   * Transisi otomatis layar dari: Standby ➡️ Menjelang Sholat ➡️ Notifikasi Adzan ➡️ Hitung Mundur Iqomah ➡️ **Layar Gelap Otomatis saat Sholat Berlangsung** (agar tidak menyilaukan jamaah) ➡️ Mode Sholat Jumat & Pengingat Dhuha.
6. **100% Offline & Lisensi Sekali Bayar Selamanya:**
   * Tidak ada biaya langganan bulanan. Validasi serial number dilakukan offline langsung di perangkat tanpa perlu server lisensi eksternal.

---

## 2. Pemetaan Aset Gambar (Asset Mapping)

Semua screenshot telah dipetakan dari direktori:  
`D:\9 KANDA\APPS Android\assalam-tv\designs\Capture screen\`

| Section Landing Page | Aset Gambar Bahasa Indonesia | Aset Gambar English | Aset Gambar Arabic |
| :--- | :--- | :--- | :--- |
| **Hero Section (Device Mockup)** | `TV - Themes/03_Horizontal_Andalusia.png` & `Admin - Mobile/02_Beranda.png` | `2. English/TV - Themes/03_Horizontal_Andalusia.png` & `Admin - Mobile/02_Beranda.png` | `3. Arabic/TV - Themes/03_Horizontal_Andalusia.png` & `Admin - Mobile/02_Beranda.png` |
| **Media Transfer Comparison** | `Admin - Mobile/05_Media_Galeri.png` + `TV - Screens/08_Pairing_QR_Overlay.png` | `2. English/Admin - Mobile/05_Media_Galeri.png` | `3. Arabic/Admin - Mobile/05_Media_Galeri.png` |
| **6 Tema Warna Showcase** | `TV - Themes/01_Horizontal_Zamrud.png`<br>`TV - Themes/02_Horizontal_Lazuardi.png`<br>`TV - Themes/03_Horizontal_Andalusia.png`<br>`TV - Themes/04_Horizontal_Delima.png`<br>`TV - Themes/05_Horizontal_Nila.png`<br>`TV - Themes/06_Horizontal_Obsidian.png` | Sesuai folder `2. English/TV - Themes/` | Sesuai folder `3. Arabic/TV - Themes/` |
| **Variasi Layout Sidebar** | `TV - Themes/07_Sidebar_Zamrud.png` (Kiri)<br>`TV - Themes/14_Kanan_Lazuardi.png` (Kanan) | Sesuai folder `2. English/TV - Themes/` | Sesuai folder `3. Arabic/TV - Themes/` |
| **Dukungan TV Vertikal** | `TV - Themes Vertical/01_Vertical_Zamrud.png`<br>`TV - Themes Vertical/02_Vertical_Lazuardi.png`<br>`TV - Themes Vertical/03_Vertical_Andalusia.png`<br>`TV - Themes Vertical/04_Vertical_Delima.png`<br>`TV - Themes Vertical/05_Vertical_Nila.png` | Sesuai folder `2. English/TV - Themes Vertical/` | Sesuai folder `3. Arabic/TV - Themes Vertical/` |
| **Smart Prayer State Machine** | `TV - Screens/02_Menjelang_Sholat.png`<br>`TV - Screens/03_Notif_Adzan.png`<br>`TV - Screens/04_Hitung_Mundur_Iqomah.png`<br>`TV - Screens/05_Sholat_Berlangsung.png`<br>`TV - Screens/07_Sholat_Jumat.png`<br>`TV - Screens/06a_Countdown_Dhuha.png` | Sesuai folder `2. English/TV - Screens/` | Sesuai folder `3. Arabic/TV - Screens/` |
| **Multi-Language Feature Showcase** | Perbandingan visual screenshot ID vs EN vs AR berdampingan |
| **Admin HP Showcase** | `Admin - Mobile/01_Splash_Screen.png`<br>`Admin - Mobile/02_Beranda.png`<br>`Admin - Mobile/03_Jadwal_Sholat.png`<br>`Admin - Mobile/04_Konten_Maklumat.png`<br>`Admin - Mobile/05_Media_Galeri.png`<br>`Admin - Mobile/06_Tampilan_Tema.png` | Sesuai folder `2. English/Admin - Mobile/` | Sesuai folder `3. Arabic/Admin - Mobile/` |

---

## 3. Arsitektur Desain: Tema Warna & Orientasi

### Matriks Warna (The 6 Color Moods):
1. **Zamrud (Emerald):** Keanggunan islami abadi. Menyejukkan mata jamaah, cocok untuk masjid bernuansa hijau alami dan arsitektur kubah klasik.
2. **Lazuardi (Azure Blue):** Inspirasi kedamaian langit dan laut. Menghadirkan ketenangan spiritual, sangat cocok untuk masjid berdinding putih bersih, abu-abu modern, atau marmer terang.
3. **Andalusia (Golden Terracotta):** Mengusung estetika emas istana Alhambra. Memberikan kesan hangat, mewah, megah, dan sarat nilai sejarah peradaban Islam.
4. **Delima (Ruby Crimson):** Merah delima berwibawa. Sangat kontras dan mudah terbaca dari jarak jauh di masjid berukuran besar atau aula serbaguna.
5. **Nila (Royal Indigo):** Warna ungu pekat temaram senja yang membawa nuansa hening, kontemplatif, dan khusyuk menjelang ibadah.
6. **Obsidian (Dark Luxury Champagne):** Mode gelap premium berlatar hitam pekat dengan tipografi emas elegan. Tidak silau, hemat energi TV OLED/LED, dan sangat berkelas untuk masjid berarsitektur kontemporer.

### Matriks Layout (The 4 Orientations):
1. **Horizontal Classic:** Kartu sholat di bagian bawah, header dinamis di atas, tengah untuk slideshow maklumat DKM.
2. **Left Sidebar:** Jadwal sholat memanjang vertikal di sisi kiri, area kanan menjadi panggung utama display media/pengumuman.
3. **Right Sidebar:** Jadwal sholat di sisi kanan, proporsional bagi masjid yang meletakkan TV di sisi kiri shaf.
4. **Vertical Kiosk (Portrait 9:16):** Tata letak vertikal penuh tanpa kompromi, dioptimalkan untuk TV berdiri, totem masjid, atau standing kiosk informasi.

---

## 4. Struktur Section Landing Page

Landing page dirancang dengan 10 section berurutan untuk memaksimalkan konversi:
1. **Navbar:** Logo Assalam TV, Navigasi (Tema, Vertikal, Cara Kerja, Fitur HP, Lisensi), Pemilih Bahasa (ID / EN / AR), Tombol CTA.
2. **Hero Section:** Value proposition utama, headline emosional, trust badge, mockup TV (Horizontal & Vertikal) + HP Admin.
3. **Head-to-head Problem & Solution:** Mengapa produk lama merepotkan vs betapa mudahnya Assalam TV.
4. **The Killer Feature: Media Management via Admin HP:** Langsung dari galeri tanpa ShareIt/Flashdisk.
5. **Theme & Color Gallery (Bukan Hanya Hijau):** Showcase interaktif 6 tema warna.
6. **Orientasi Fleksibel: Dukungan TV Vertikal & Horizontal:** Bukti visual untuk standing kiosk dan wall display.
7. **Smart Prayer State Machine:** Visual transisi sholat yang menjaga kekhusyukan jamaah.
8. **Dukungan Multi-Bahasa Native:** Bukti kesiapan untuk masjid lokal hingga internasional.
9. **Kemandirian Sistem: 100% Offline & Lifetime License:** Sekali beli tanpa tagihan bulanan.
10. **CTA & FAQ:** Rangkuman pertanyaan umum dan akses pemesanan/download.

---

## 5. Copywriting Lengkap - Versi Bahasa Indonesia

### [Section 1: Navbar]
* **Brand:** Assalam TV by Asri Digital
* **Menu:** 
  * Tema & Warna
  * Tampilan Vertikal
  * Kelola via HP
  * Mode Sholat
  * Lisensi
* **CTA Button:** Dapatkan Lisensi
* **Language Switcher:** 🇮🇩 ID | 🇬🇧 EN | 🇸🇦 AR

---

### [Section 2: Hero Section]
* **Badge:** 🌟 SISTEM DISPLAY JADWAL SHOLAT GENERASI TERBARU
* **Main Headline:**
  # Transformasi TV Masjid Anda Menjadi Pusat Informasi Digital yang Megah, Khusyuk, dan 100% Mandiri
* **Subheadline:**
  Tinggalkan kerumitan transfer media pakai ShareIt atau colok flashdisk ke TV. Kelola seluruh jadwal sholat, pengumuman DKM, dan foto kajian langsung dari HP Admin melalui jaringan lokal. Bekerja 100% offline, tanpa biaya langganan, dengan pilihan tema warna mewah horizontal dan vertikal.
* **CTA Buttons:**
  * **Primer:** [Beli Lisensi Admin di Google Play — Rp 249.000]
  * **Sekunder:** [Download TV App Gratis]
* **Trust Badges:**
  * ✅ **100% Offline** (Tidak butuh internet saat operasional)
  * ✅ **Beli Sekali, Aktif Selamanya** (Bebas biaya langganan bulanan)
  * ✅ **Kompatibel Semua Android TV & STB**
  * ✅ **Transfer Media Tanpa ShareIt / Flashdisk**
* **Visual Hint:** Mockup TV Horizontal (Tema Andalusia Emas) berdampingan dengan TV Vertikal (Tema Lazuardi Biru) dan HP Admin Android.

---

### [Section 3: Problem vs Solution (Head-to-Head)]
* **Badge:** KEMUDAHAN YANG NYATA
* **Headline:**
  ## Mengapa Masih Mempertahankan Sistem Display Masjid yang Merepotkan Pengurus?
* **Subheadline:**
  Sebagian besar aplikasi display masjid di pasaran membebani pengurus DKM dengan prosedur teknis yang berbelit-belit. Assalam TV hadir menghapus seluruh kerumitan tersebut.

| Display Masjid Konvensional / Produk Lain ❌ | Solusi Cerdas Assalam TV ✅ |
| :--- | :--- |
| **Wajib instal ShareIt di HP & TV** hanya untuk kirim foto poster pengumuman. | **Kirim langsung dari galeri HP Admin** ke TV via Wi-Fi lokal dalam 3 detik. |
| **Harus manjat colok flashdisk** ke belakang TV di dinding plafon yang tinggi. | **Tanpa flashdisk sama sekali.** Semua kontrol dan kirim file cukup dari genggaman HP. |
| **Pakai remote TV yang lambat & kaku** untuk sekadar mengganti teks maklumat. | **Ketik teks maklumat di HP**, otomatis terupdate di layar TV secara real-time. |
| **Ketergantungan server cloud & langganan;** internet masjid putus, display ikut mati. | **TV adalah otak mandiri.** 100% lokal & offline. HP mati pun TV tetap berjalan sempurna. |
| **Tampilan monoton:** Hanya ada warna hijau kaku tanpa opsi vertikal. | **6 Palet Warna Mewah** (Emas, Biru, Hitam, Merah, Ungu, Hijau) + Mode Vertikal Kiosk. |

---

### [Section 4: The Killer Feature - Pengelolaan Media Tanpa ShareIt]
* **Badge:** FITUR REVOLUSIONER
* **Headline:**
  ## Kelola Poster Pengumuman & Laporan Kas Semudah Mengirim Pesan di HP
* **Subheadline:**
  **Tanpa ShareIt. Tanpa Flashdisk. Tanpa Aplikasi Tambahan.**
  Pilih foto kegiatan atau flyer kajian langsung dari galeri smartphone Anda, lalu kirim ke TV hanya dengan satu ketukan jari.
* **Poin Keunggulan:**
  1. **Pairing Instan via QR Code:** Cukup buka aplikasi Admin di HP, pindai QR yang tampil di layar TV, dan kedua perangkat langsung terhubung aman melalui jaringan Wi-Fi lokal.
  2. **Langsung dari Photo Picker HP:** Buka menu Media di HP, centang foto kajian, poster sholat gerhana, atau laporan kas masjid, lalu tekan 'Kirim'.
  3. **Tersimpan Permanen di TV:** TV secara mandiri menyimpan file gambar di memori internalnya. Setelah pengiriman selesai, HP admin bisa dibawa pulang dan TV tetap memutar slideshow tanpa henti.
  4. **Tanpa Akses Internet Masjid:** Proses transfer berjalan pada protokol LAN lokal berkecepatan tinggi, tidak menyedot kuota internet masjid sama sekali.
* **Visual Hint:** Ilustrasi alur: Smartphone Admin memilih foto ➡️ QR Pairing ➡️ TV langsung menampilkan poster kajian.

---

### [Section 5: Visual Elegance - Bukan Hanya Warna Hijau!]
* **Badge:** ESTETIKA TANPA BATAS
* **Headline:**
  ## Sesuaikan Tampilan TV dengan Karakter Arsitektur Masjid Anda
* **Subheadline:**
  Setiap masjid memiliki keunikan desain interior—mulai dari marmer putih modern, kayu jati berukir klasik, hingga arsitektur industrial kontemporer. Assalam TV memberikan **6 palet warna eksklusif** yang dapat diganti kapan saja:
* **Kartu Pilihan Warna:**
  1. **Andalusia (Golden Terracotta):**
     * *Vibe:* Megah, Hangat, & Bersejarah.
     * Sentuhan gradasi emas champagne dan terakota terinspirasi istana Islam Andalusia Spanyol.
  2. **Obsidian (Dark Luxury Champagne):**
     * *Vibe:* Eksklusif, Minimalis, & Teduh.
     * Latar hitam pekat elegan dengan font emas murni. Tidak menyilaukan mata dan sangat ramah konsumsi daya TV.
  3. **Lazuardi (Royal Azure Blue):**
     * *Vibe:* Tenang, Damai, & Sejuk.
     * Nuansa biru safir samudera yang memberikan kedamaian batin bagi jamaah yang sedang beriktikaf.
  4. **Zamrud (Classic Emerald Green):**
     * *Vibe:* Sejuk, Asri, & Tradisional Islami.
     * Warna hijau zamrud abadi yang menyatu sempurna dengan ornamen kubah dan karpet sholat masjid.
  5. **Delima (Imperial Ruby Red):**
     * *Vibe:* Agung, Tegas, & Berkarakter.
     * Merah marun delima pekat dengan keterbacaan kontras tinggi dari saf paling belakang.
  6. **Nila (Mystic Indigo Purple):**
     * *Vibe:* Khusyuk, Hening, & Kontemplatif.
     * Menghadirkan atmosfer ketenangan waktu senja dan malam hari.
* **Layout Pilihan:**
  * Horizontal Classic Bar
  * Left Sidebar (Jadwal di Sisi Kiri)
  * Right Sidebar (Jadwal di Sisi Kanan)

---

### [Section 6: Dukungan Tampilan TV Vertikal (Standing Kiosk / Totem)]
* **Badge:** MULTI-ORIENTASI
* **Headline:**
  ## Dukungan Penuh untuk TV Berdiri (Standing Kiosk & Totem Digital Masjid)
* **Subheadline:**
  Masjid Anda menggunakan TV berorientasi vertikal (portrait) di selasar, pintu masuk, atau pilar aula? Assalam TV dirancang secara presisi untuk menampilkan tata letak vertikal yang proporsional, rapi, dan estetis.
* **Fitur Utama Vertikal:**
  * **Skalabilitas Asli 9:16:** Desain tidak terpotong, font proporsional, dan penataan kartu jadwal sholat tersusun secara vertikal yang sangat nyaman dibaca pejalan kaki.
  * **Optimal untuk Selasar & Pintu Utama:** Sangat efektif menyambut jamaah dengan informasi waktu sholat, QRIS infaq digital, dan maklumat kajian harian.
  * **6 Pilihan Tema Warna Vertikal:** Semua variasi warna (Zamrud, Lazuardi, Andalusia, Delima, Nila, Obsidian) tersedia dalam mode vertikal.

---

### [Section 7: Smart Prayer State Machine - Menjaga Kekhusyukan Sholat]
* **Badge:** OTOMASI IBADAH
* **Headline:**
  ## Layar Otomatis Menyesuaikan Waktu Sholat: Transisi Cerdas & Khusyuk
* **Subheadline:**
  TV masjid bukan sekadar penunjuk waktu, melainkan pendamping ibadah yang adab dan santun terhadap jamaah. Assalam TV memiliki sistem kendali transisi otomatis:
* **Fase-Fase Cerdas:**
  1. **Mode Standby:** Menampilkan jam presisi, jadwal sholat 5 waktu, penanggalan Hijriyah, running text pesan DKM, dan carousel flyer kegiatan.
  2. **Menjelang Sholat (Pengingat Jamaah):** Peringatan visual untuk segera merapikan shaf dan meluruskan niat saat waktu sholat hampir tiba.
  3. **Notifikasi Waktu Adzan:** Tampilan visual adzan berkumandang dengan penanda waktu sholat yang sedang masuk.
  4. **Hitung Mundur Iqomah:** Timer hitung mundur detik demi detik yang akurat agar muadzin dan jamaah siap mendirikan sholat tepat waktu.
  5. **Layar Gelap Otomatis (Saat Sholat Berlangsung):** **Layar TV otomatis padam/blank** selama sholat berjamaah berlangsung agar jamaah di belakang tidak terdistraksi atau tersilaukan oleh cahaya TV.
  6. **Mode Sholat Jumat Khusus:** Tampilan khusus tata tertib dan pengingat khutbah Jumat.
  7. **Countdown & Notifikasi Dhuha:** Penanda masuknya waktu sholat sunnah Dhuha.

---

### [Section 8: Siap Skala Global - 3 Bahasa Asli (ID, EN, AR)]
* **Badge:** DUKUNGAN INTERNASIONAL
* **Headline:**
  ## Cocok untuk Masjid Lokal, Masjid Raya, hingga Komunitas Muslim Internasional
* **Subheadline:**
  Assalam TV menghadirkan dukungan multi-bahasa lengkap tanpa kompromi. Seluruh antarmuka TV maupun HP Admin dapat diatur ke dalam:
  * 🇮🇩 **Bahasa Indonesia:** Sempurna untuk ribuan masjid di seluruh pelosok Indonesia.
  * 🇬🇧 **English:** Ideal untuk masjid di pusat kota wisata, kawasan diplomatik, bandara, hotel internasional, dan komunitas muslim di luar negeri.
  * 🇸🇦 **العربية (Arabic):** Dirancang dengan tipografi kaligrafi Arab yang anggun dan kaidah penanggalan Hijriyah yang akurat untuk masjid di Timur Tengah dan dunia Arab.

---

### [Section 9: Beli Sekali, Offline Selamanya]
* **Badge:** LISENSI AMANAH
* **Headline:**
  ## Investasi Terbaik untuk Kemakmuran Masjid: Tanpa Iuran Bulanan
* **Subheadline:**
  Kami percaya dana kas masjid berasal dari infaq jamaah yang harus dikelola dengan amanah. Assalam TV menggunakan model **lisensi sekali bayar untuk seumur hidup**.
* **Keunggulan Lisensi:**
  * **Rp 249.000 / Lifetime:** Cukup beli aplikasi Admin sekali saja melalui Google Play Store.
  * **Aplikasi TV 100% Gratis:** Unduh dan pasang di TV/STB sebanyak yang Anda butuhkan tanpa biaya tambahan.
  * **Validasi Offline Mandiri:** Tidak perlu koneksi ke server lisensi eksternal. Begitu serial diaktifkan, aplikasi terkunci valid selamanya.
  * **Bebas Kuota & Tagihan:** Tidak ada biaya bulanan, tidak ada tagihan maintenance tersembunyi.

---

### [Section 10: FAQ & Call to Action]
* **FAQ Populer:**
  1. *Apakah TV masjid butuh koneksi internet setiap hari?*  
     **Tidak sama sekali.** TV hanya membutuhkan jaringan Wi-Fi lokal saat Anda ingin mengubah data dari HP. Setelah itu, TV berjalan mandiri tanpa internet selamanya.
  2. *Perangkat apa saja yang bisa digunakan?*  
     Semua Smart TV berbasis Android TV, Google TV, atau TV biasa yang dipasangi Android TV Box / STB (versi Android 7.0 ke atas).
  3. *Bagaimana jika HP pengurus berganti orang?*  
     Cukup instal aplikasi Admin di HP pengurus baru, masukkan serial number lisensi Anda, scan QR di TV, dan HP baru langsung memegang kendali.
  4. *Apakah foto pengumuman di TV bisa lebih dari satu?*  
     Ya, Anda dapat memilih banyak foto dari galeri HP. TV akan memutarnya secara otomatis dalam bentuk carousel slideshow dengan durasi yang bisa disesuaikan.
* **Final CTA Headline:**
  ## Hadirkan Keindahan & Kemudahan di Masjid Anda Hari Ini
* **Final CTA Buttons:**
  * [Beli Lisensi Admin di Google Play — Rp 249.000]
  * [Download TV App di Google Play / Sideload APK]
  * [Hubungi Kami via WhatsApp untuk Konsultasi]

---

## 6. Complete Copywriting - English Version

### [Section 1: Navbar]
* **Brand:** Assalam TV by Asri Digital
* **Menu:** 
  * Themes & Colors
  * Vertical Kiosk
  * Mobile Control
  * Prayer States
  * Pricing
* **CTA Button:** Get Lifetime License
* **Language Switcher:** 🇮🇩 ID | 🇬🇧 EN | 🇸🇦 AR

---

### [Section 2: Hero Section]
* **Badge:** 🌟 NEXT-GENERATION MOSQUE DIGITAL SIGNAGE SYSTEM
* **Main Headline:**
  # Transform Your Mosque TV into an Elegant, Reverent, and 100% Autonomous Information Center
* **Subheadline:**
  Forget the hassle of USB flash drives or cumbersome third-party file transfer apps like ShareIt. Manage prayer schedules, announcements, and event posters directly from the Admin smartphone via your local Wi-Fi. Operates 100% offline with zero monthly subscriptions, featuring rich horizontal and vertical luxury themes.
* **CTA Buttons:**
  * **Primary:** [Buy Admin License on Google Play — $19.99 / One-time]
  * **Secondary:** [Download Free TV App]
* **Trust Badges:**
  * ✅ **100% Offline** (Zero internet connection required during operation)
  * ✅ **Buy Once, Active Forever** (No recurring monthly or yearly fees)
  * ✅ **Universal Android TV & STB Compatibility**
  * ✅ **Direct Media Transfer (Zero ShareIt / Zero USB)**

---

### [Section 3: Problem vs Solution (Head-to-Head)]
* **Badge:** EFFORTLESS MANAGEMENT
* **Headline:**
  ## Why Are Mosques Still Struggling with Clunky Display Systems?
* **Subheadline:**
  Most digital signage systems on the market burden mosque caretakers with tedious technical workflows. Assalam TV eliminates every barrier.

| Traditional Mosque Displays / Competitors ❌ | Assalam TV Smart System ✅ |
| :--- | :--- |
| **Must install ShareIt on both phone & TV** just to transfer an event poster. | **Transfer directly from smartphone gallery** to TV via local Wi-Fi in 3 seconds. |
| **Climbing ladders to plug USB flash drives** behind high wall-mounted TVs. | **Completely USB-free.** Full media upload and configuration from your phone. |
| **Navigating clunky TV remotes** just to edit an announcement line. | **Type on your phone**, and the TV screen updates instantly in real time. |
| **Cloud server dependency;** internet dropouts cause blank or frozen screens. | **TV is the independent brain.** 100% local & offline. Works even when the phone is off. |
| **Monotonous visuals:** Rigid, green-only templates with zero vertical support. | **6 Luxury Palettes** (Gold, Azure, Dark Obsidian, Ruby, Indigo, Emerald) + Vertical Mode. |

---

### [Section 4: The Killer Feature - Frictionless Media Upload]
* **Badge:** REVOLUTIONARY WORKFLOW
* **Headline:**
  ## Update Announcements & Donation Reports as Easily as Sending a Text Message
* **Subheadline:**
  **No ShareIt. No USB Drives. No Third-Party Tools.**
  Pick flyer images or financial reports straight from your smartphone photo gallery and beam them directly onto the TV with a single tap.
* **Key Advantages:**
  1. **Instant QR Pairing:** Open the Admin app on your phone, scan the QR code displayed on the TV, and pair securely over your local Wi-Fi in seconds.
  2. **Native Smartphone Photo Picker:** Select multiple event flyers, Friday prayer notices, or charity banners right from your phone storage and tap 'Send'.
  3. **Permanent Local TV Storage:** The TV stores all files directly on its internal drive. Once transferred, the admin can leave, and the TV loops seamlessly.
  4. **Zero Internet Bandwidth Consumed:** Media moves over high-speed local LAN, consuming zero internet data quota.

---

### [Section 5: Visual Elegance - Beyond Just Green!]
* **Badge:** UNCOMPROMISED AESTHETICS
* **Headline:**
  ## Match Your Display to the Architectural Soul of Your Mosque
* **Subheadline:**
  Every sacred space has its own architectural identity—from pure white marble and carved teakwood to sleek contemporary arches. Assalam TV offers **6 distinct luxury color moods**:
* **Theme Catalog:**
  1. **Andalusia (Golden Terracotta):**
     * *Mood:* Majestic, Warm, & Historic.
     * Champagne gold and warm terracotta inspired by the legendary Alhambra architecture of Muslim Spain.
  2. **Obsidian (Dark Luxury Champagne):**
     * *Mood:* Ultra-Modern, Subtle, & Restful.
     * Deep black canvas with pure champagne gold typography. Zero glare, high contrast, and energy-efficient for OLED/LED screens.
  3. **Lazuardi (Royal Azure Blue):**
     * *Mood:* Serene, Peaceful, & Cool.
     * Royal ocean blue evoking spiritual stillness and focus during contemplation.
  4. **Zamrud (Classic Emerald Green):**
     * *Mood:* Lush, Reverent, & Traditional.
     * Timeless Islamic emerald green designed to harmonize with traditional dome ornamentation and prayer rugs.
  5. **Delima (Imperial Ruby Red):**
     * *Mood:* Stately, Bold, & Authoritative.
     * Rich crimson red with outstanding legibility from the farthest prayer rows.
  6. **Nila (Mystic Indigo Purple):**
     * *Mood:* Meditative, Quiet, & Contemplative.
     * Deep dusk violet that fosters solemnity and peaceful introspection.
* **Layout Variants:**
  * Horizontal Classic Dock
  * Left Sidebar (Vertical prayer list on the left)
  * Right Sidebar (Vertical prayer list on the right)

---

### [Section 6: True Vertical TV Kiosk Support (Portrait Totems)]
* **Badge:** ORIENTATION FREEDOM
* **Headline:**
  ## Native Support for Vertical TVs & Standing Digital Kiosks
* **Subheadline:**
  Does your mosque feature vertical standing kiosks in entryways, ablution walkways, or lobby corridors? Assalam TV provides a dedicated 9:16 portrait layout engineered for natural vertical readability.
* **Vertical Highlights:**
  * **Native 9:16 Responsive Layout:** Not a stretched horizontal layout. Text hierarchy, prayer timing badges, and announcements are balanced specifically for portrait screens.
  * **Ideal for Entrance Totems:** Greet worshippers at the gate with real-time prayer countdowns, digital QR donation codes, and daily hadith reminders.
  * **Full 6-Color Palette Support:** All premium color moods are fully rendered in vertical format.

---

### [Section 7: Intelligent Prayer State Machine]
* **Badge:** AUTOMATED REVERENCE
* **Headline:**
  ## A Screen that Automatically Adapts to Prayer Phases to Preserve Khushu'
* **Subheadline:**
  A mosque screen must respect worship. Assalam TV transitions automatically through every liturgical state:
* **The Smart States:**
  1. **Standby Mode:** Displays precision clocks, 5 daily prayer times, Hijri calendar, scrolling ticker, and announcement slideshow.
  2. **Pre-Prayer Warning:** Gentle reminders for worshippers to arrange rows and prepare for prayer.
  3. **Adhan Notification:** Clear visual notification when the prayer time enters.
  4. **Iqamah Countdown:** Accurate, second-by-second countdown helping congregation and imam begin prayer punctually.
  5. **Automatic Screen Blanking (During Congregational Prayer):** **The screen turns completely dark during prayer** so worshippers are never blinded or distracted by bright visuals in front of the rows.
  6. **Friday Khutbah Mode:** Dedicated Friday reminder mode for khutbah etiquette.
  7. **Dhuha Time Reminder:** Timely alerts for the voluntary mid-morning prayer.

---

### [Section 8: Global Multi-Language Architecture (EN, ID, AR)]
* **Badge:** BORDERLESS REACH
* **Headline:**
  ## Built for Neighborhood Mosques and International Islamic Centers Alike
* **Subheadline:**
  Assalam TV comes out of the box with complete, native localization across three major world languages:
  * 🇬🇧 **English:** Ideal for city center mosques, airport prayer rooms, hotel facilities, and international diaspora communities worldwide.
  * 🇮🇩 **Bahasa Indonesia:** Crafted specifically for the extensive network of mosques across Southeast Asia.
  * 🇸🇦 **العربية (Arabic):** Beautifully typeset with classic Arabic typography and astronomical Hijri date synchronization.

---

### [Section 9: Lifetime License - Zero Monthly Fees]
* **Badge:** HONEST LICENSING
* **Headline:**
  ## A One-Time Investment for Long-Term Benefit
* **Subheadline:**
  Mosque funds are sacred trust donations. We reject subscription traps and recurring server fees.
* **License Highlights:**
  * **One-Time Purchase:** Buy the Admin App once via Google Play Store.
  * **Free TV App:** Deploy to as many Android TV/STB units as your mosque needs without extra costs.
  * **Autonomous Offline Validation:** Operates indefinitely on your hardware without contacting external licensing servers.
  * **No Monthly Invoices:** No recurring cloud fees, no surprise maintenance costs.

---

### [Section 10: FAQ & Final Call to Action]
* **FAQ:**
  1. *Does the TV need daily internet access?*  
     **Not at all.** The TV only connects to your local Wi-Fi when the admin transfers new media or updates settings. It runs 100% standalone offline thereafter.
  2. *What hardware do I need?*  
     Any Android TV, Google TV, or standard TV paired with an affordable Android TV Box / STB (Android 7.0 or newer).
  3. *Can we display multiple announcements in rotation?*  
     Yes, simply select multiple flyers in the Admin app. The TV will automatically cycle through them with customizable durations.
* **Final CTA Headline:**
  ## Elevate Your Mosque's Information Display Today
* **Final CTA Buttons:**
  * [Get Admin License on Google Play]
  * [Download Free TV App]
  * [Contact Us via WhatsApp for Assistance]

---

## 7. النص التسويقي الكامل - النسخة العربية

### [القسم 1: شريط التنقل - Navbar]
* **العلامة التجارية:** السلام تي في (Assalam TV) من أصري ديجيتال
* **القائمة:**
  * السمات والألوان
  * العرض العمودي
  * التحكم من الهاتف
  * حالات الصلاة
  * الترخيص
* **زر الحث على اتخاذ إجراء:** احصل على الترخيص
* **محدد اللغة:** 🇮🇩 ID | 🇬🇧 EN | 🇸🇦 AR

---

### [القسم 2: الواجهة الرئيسية - Hero Section]
* **الشارة الترحيبية:** 🌟 الجيل الجديد من شاشات المساجد الرقمية الذكية
* **العنوان الرئيسي:**
  # حوّل شاشة مسجدك إلى منبر معلومات رقمي راقٍ، خاشع، ومستقل 100%
* **العنوان الفرعي:**
  وداعاً لتعقيدات الفلاش ميموري وتطبيقات نقل الملفات المرهقة مثل (ShareIt). تحكّم بجميع مواقيت الصلاة، وإعلانات المسجد، وجداول الدروس مباشرة من هاتف المشرف عبر شبكة الواي فاي المحلية. يعمل بالكامل دون اتصال بالإنترنت (أوفلاين)، وبدون أي اشتراكات شهرية، مع باقة فاخرة من السمات الأفقية والعمودية.
* **أزرار الإجراء:**
  * **الزر الأساسي:** [شراء ترخيص المشرف عبر متجر جوجل بلاي — دفعة واحدة مدى الحياة]
  * **الزر الثانوي:** [تحميل تطبيق الشاشة مجاناً للـ TV]
* **ميزات الثقة:**
  * ✅ **يعمل 100% بدون إنترنت** (أوفلاين بالكامل بعد الإعداد)
  * ✅ **شراء مرة واحدة وتفعيل مدى الحياة** (بدون أي اشتراكات دورية)
  * ✅ **متوافق مع جميع أجهزة Android TV و STB**
  * ✅ **نقل وسائط مباشر بدون ShareIt وبدون فلاشة**

---

### [القسم 3: المشكلة والحل (المقارنة المباشرة)]
* **الشارة:** سهولة غير مسبوقة
* **العنوان:**
  ## لماذا لا تزال المساجد تعاني مع أنظمة العرض الرقمية المعقدة؟
* **العنوان الفرعي:**
  تفرض أغلب التطبيقات المتاحة في السوق على القائمين على المساجد إجراءات تقنية شاقة ومملة. جاء تطبيق "السلام تي في" ليحل هذه المشكلات جذرياً.

| شاشات المساجد التقليدية والأنظمة السابقة ❌ | نظام السلام تي في الذكي ✅ |
| :--- | :--- |
| **ضرورة تثبيت تطبيق ShareIt على الهاتف والتلفزيون** فقط لنقل صورة إعلان بسيط. | **إرسال فوري ومباشر من معرض صور الهاتف** إلى التلفزيون عبر الواي فاي خلال 3 ثوانٍ. |
| **صعود السلالم لإدخال فلاش ميموري (USB)** خلف الشاشات المعلقة على الحائط العالي. | **بدون فلاش ميموري تماماً.** إدارة المحتوى وتحديث الإعلانات بالكامل من راحة يدك. |
| **المعاناة مع ريموت التلفزيون البطيء** لكتابة نص إعلان أو تغيير إعداد. | **كتابة النصوص من لوحة مفاتيح الهاتف** وتظهر على الشاشة فوراً في الوقت الفعلي. |
| **الاعتماد على خوادم السحابة والإنترنت؛** إذا انقطع نت المسجد انطفأت الشاشة. | **التلفزيون هو العقل المدبر المستقل.** يعمل محلياً 100% حتى لو تم إغلاق الهاتف. |
| **تصاميم مكررة:** تقتصر فقط على اللون الأخضر التقليدي دون دعم الشاشات الواقفة. | **6 لوحات ألوان ملكية فاخرة** (ذهبي أندلسي، كحلي، أزرق، أحمر، أسود، وأخضر) + دعم الشاشات الرأسية. |

---

### [القسم 4: الميزة الثورية - إدارة الوسائط بدون وسائط طرف ثالث]
* **الشارة:** نقل وسائط ثوري
* **العنوان:**
  ## حدّث إعلانات المسجد وتقارير الصندوق المالي بسهولة إرسال رسالة نصية
* **العنوان الفرعي:**
  **بدون ShareIt. بدون فلاش ميموري. بدون برامج وسيطة.**
  اختر صور الإعلانات، أو منشورات الدروس العلمية، أو بطاقات التبرع من هاتفك مباشرة، وانقلها للشاشة بنقرة زر واحدة.
* **أبرز المزايا:**
  1. **اقتران فوري عبر رمز الاستجابة السريعة (QR):** افتح تطبيق المشرف في الهاتف، وامسح رمز QR الظاهر على التلفزيون ليتم الربط الآمن فوراً عبر الشبكة المحلية.
  2. **اختيار مباشر من صور الهاتف:** حدد الملصقات الدعوية وبطاقات الجمعة من هاتفك واضغط "إرسال".
  3. **حفظ دائم في الذاكرة الداخلية للتلفزيون:** تحتفظ الشاشة بجميع الصور محلياً، ويمكن للمشرف مغادرة المسجد وتستمر الشاشة في عرض شرائح الإعلانات دون توقف.
  4. **لا يستهلك باقة إنترنت المسجد:** تتم عملية النقل عبر بروتوكول LAN فائق السرعة وبدون استهلاك للبيانات.

---

### [القسم 5: أناقة التصميم - ألوان تتجاوز النمط التقليدي!]
* **الشارة:** جماليات إسلامية أصيلة
* **العنوان:**
  ## انسجام بصري يعكس فخامة عمارة مسجدك
* **العنوان الفرعي:**
  تتميز المساجد بتباين طرازها المعماري—من الرخام الأبيض الصافي، وخشب الصاج المحفور، إلى العمارة الهندسية الحديثة. يمنحك "السلام تي في" **6 سمات لونية فاخرة** تتناغم مع كل بيئة:
* **كتالوج الألوان:**
  1. **الأندلسي (Andalusia - الذهبي الدافئ):**
     * *الطابع:* فخامة، دفء، وأصالة تاريخية.
     * تدرجات ذهبية ملكية مستوحاة من عمارة قصر الحمراء في الأندلس.
  2. **الأوبسيديان (Obsidian - الأسود الملكي الفاخر):**
     * *الطابع:* حديث، راقٍ، ومريح للأعين.
     * خلفية سوداء عميقة مع خطوط ذهبية ناصعة. خالية من التوهج المزعج وموفرة لطاقة شاشات OLED و LED.
  3. **اللازورد (Lazuardi - الأزرق الملكي):**
     * *الطابع:* سكينة، سلام، وطمأنينة.
     * أزرق محيطي هادئ يبعث على التركيز والخشوع أثناء الاعتكاف والذكر.
  4. **الزمرد (Zamrud - الأخضر الإسلامي العريق):**
     * *الطابع:* نضارة، روحانية، وأصالة.
     * الأخضر الزمردي الكلاسيكي الذي ينسجم بامتياز مع السجاد وزخارف القباب.
  5. **العقيق الأحمر (Delima - الياقوت الإمبراطوري):**
     * *الطابع:* هيبة، وضوح، وتباين عالٍ.
     * أحمر قرمزي عميق يوفر قراءة فائقة الوضوح من أبعد صفوف المسجد.
  6. **النيلي (Nila - الأرجواني الهادئ):**
     * *الطابع:* خشوع، وقار، وتأمل.
     * هدوء أرجواني يعكس سكينة أوقات الأسحار والغسق.
* **خيارات التخطيط:**
  * الشريط الأفقي الكلاسيكي (Horizontal Dock)
  * العمود الجانبي الأيسر (Left Sidebar)
  * العمود الجانبي الأيمن (Right Sidebar)

---

### [القسم 6: دعم الشاشات الرأسية (Standing Kiosks & Totems)]
* **الشارة:** مرونة الاتجاه
* **العنوان:**
  ## دعم كامل للشاشات العمودية واللافتات الرقمية الواقفة (Portrait Mode)
* **العنوان الفرعي:**
  هل يحتوي مسجدك على شاشات طولية واقفة في المداخل، ممرات الميضأة، أو أروقة المجمع؟ تم بناء تصميم "السلام تي في" العمودي بنسبة (9:16) لتقديم عرض متناسق تماماً ومريح للقراءة أثناء المرور.
* **ميزات العرض العمودي:**
  * **تصميم عمودي أصلي غير مشوّه:** ليس مجرد شاشة أفقية مقلوبة، بل تم ترتيب بطاقات الصلاة وساعة الإقامة والنصوص التذكيرية عمودياً لتناسب الوقوف.
  * **مثالي لمداخل المساجد:** استقبال المصلين بمواقيت الصلاة، تنبيهات الأنشطة، ورمز التبرع الإلكتروني السريع.
  * **متوفر بجميع الألوان الستة:** تجربة كاملة تدعم ألوان الأندلسي، الزمرد، اللازورد، والأوبسيديان.

---

### [القسم 7: آلة حالات الصلاة الذكية - لحفظ خشوع المصلين]
* **الشارة:** هيبة العبادة
* **العنوان:**
  ## شاشة ذكية تتفاعل تلقائياً مع أوقات الصلاة لحفظ خشوع المصلين
* **العنوان الفرعي:**
  شاشة المسجد يجب أن تكون عوناً على الخشوع لا مشتتة للمصلين. يتميز "السلام تي في" بنظام تحول تلقائي يحترم أوقات العبادة:
* **مراحل الصلاة التلقائية:**
  1. **الوضع الافتراضي (Standby):** عرض دقيق للساعة، مواقيت الصلوات الخمس، التاريخ الهجري والميلادي، وشريط الإعلانات المتنقل.
  2. **التذكير قبل الصلاة:** تنبيه بصري هادئ يحث على تسوية الصفوف والاستعداد لتكبيرة الإحرام.
  3. **إشعار وقت الأذان:** إشعار مرئي مهيب بدخول وقت الصلاة.
  4. **العد التنازلي للإقامة:** عد تنازلي بالدقائق والثواني لمعرفة الوقت المتبقي لرفع الإقامة بدقة.
  5. **إطفاء الشاشة تلقائياً أثناء الصلاة (Screen Blanking):** **تنطفئ الشاشة وتتحول إلى السواد تماماً طوال فترة أداء الصلاة** حتى لا ينشغل المصلون في الصفوف الأولى بنور التلفزيون أو الحركة.
  6. **وضع يوم الجمعة الخاص:** تنبيهات خاصة بآداب صلاة الجمعة والاستماع للخطبة.
  7. **تنبيه وقت صلاة الضحى:** إشعار بدخول وقت صلاة الضحى وتذكير بفضلها.

---

### [القسم 8: نظام عالمي ثلاثي اللغات (العربية، الإنجليزية، الإندونيسية)]
* **الشارة:** جاهز للمساجد العالمية
* **العنوان:**
  ## مصمم للمساجد المحلية، والمراكز الإسلامية العالمية في كل مكان
* **العنوان الفرعي:**
  يوفر التطبيق تجربة متكاملة وبناءً لغوياً محترفاً في 3 لغات عالمية:
  * 🇸🇦 **العربية:** مصممة بخطوط عربية أصيلة محاذاة لليمين مع توافق دقيق لتقويم القرى وتقاويم العالم الإسلامي.
  * 🇬🇧 **English:** الخيار الأمثل للمساجد في العواصم الغربية، مصليات المطارات، الفنادق، والمراكز الإسلامية للمغتربين.
  * 🇮🇩 **Bahasa Indonesia:** دعم مخصص للملايين في جنوب شرق آسيا وإندونيسيا.

---

### [القسم 9: ترخيص مدى الحياة بدون اشتراكات]
* **الشارة:** أمانة مالية
* **العنوان:**
  ## استثمار دائم لخدمة بيوت الله: بدون اشتراكات شهرية متكررة
* **العنوان الفرعي:**
  أموال المساجد أمانة، ونحن نرفض تحميل القائمين عليها أعباء الاشتراكات الشهرية أو تكاليف الصيانة المستمرة.
* **مزايا الترخيص:**
  * **شراء مرة واحدة:** شراء تطبيق المشرف (Admin) لمرة واحدة فقط عبر متجر Google Play.
  * **تطبيق التلفزيون مجاني بالكامل:** ثبّت تطبيق الشاشة على أي عدد تريده من أجهزة التلفزيون في المسجد دون رسوم إضافية.
  * **تحقق محلي بدون إنترنت:** يتم تفعيل الترخيص داخل الجهاز مباشرة دون الحاجة للاتصال بخوادم ترخيص خارجية.
  * **بدون فواتير متكررة:** لا توجد رسوم سحابية، ولا اشتراكات سنوية خفية.

---

### [القسم 10: الأسئلة الشائعة وخاتمة الحث على الطلب]
* **الأسئلة الأكثر شيوعاً:**
  1. *هل تتطلب الشاشة وجود اتصال بالإنترنت يومياً؟*  
     **لا، إطلاقاً.** يعمل التلفزيون مستقلاً بنسبة 100% بدون إنترنت. يلزم الاتصال بالواي فاي المحلي فقط عندما يرغب المشرف في تحديث إعلان أو تعديل إعداد من هاتفه.
  2. *ما هي الأجهزة المتوافقة مع النظام؟*  
     أي شاشة ذكية بنظام Android TV أو Google TV، أو أي شاشة عادية متصلة بجهاز ريسيفر أندرويد (Android TV Box / STB) بنظام أندرويد 7.0 أو أحدث.
  3. *هل يمكن عرض أكثر من ملصق إعلاني على الشاشة؟*  
     نعم، يمكنك اختيار مجموعة من الصور عبر تطبيق المشرف، وستقوم الشاشة بعرضها بالتناوب (Slideshow) مع تحديد مدة ظهور كل إعلان.
* **العنوان الختامي للطلب:**
  ## ارتقِ بنظام العرض في مسجدك اليوم بكل سهولة ووقار
* **أزرار الحث الختامية:**
  * [شراء ترخيص المشرف عبر Google Play]
  * [تحميل تطبيق الشاشة المجاني]
  * [تواصل معنا عبر واتساب للاستفسار والدعم]

---

## 8. Panduan Implementasi Teknis di Astro (`asridigital.com`)

### 1. Struktur URL / Routing yang Direkomendasikan
Untuk mempertahankan SEO yang kuat dan pengalaman pengguna yang natural:
* **Versi Bahasa Indonesia (Default):** `src/pages/masjid-display.astro` (URL: `asridigital.com/masjid-display`)
* **English Version:** `src/pages/en/masjid-display.astro` (URL: `asridigital.com/en/masjid-display`)
* **Arabic Version (RTL):** `src/pages/ar/masjid-display.astro` (URL: `asridigital.com/ar/masjid-display` dengan atribut `dir="rtl"` pada layout)

### 2. Komponen Interaktif Utama yang Perlu Dibuat
1. **Interactive Theme Switcher (Komponen Showcase Tema):**
   * Tab tombol 6 warna: `Andalusia`, `Obsidian`, `Lazuardi`, `Zamrud`, `Delima`, `Nila`.
   * Saat tombol diklik, gambar frame mockup TV berubah secara halus (`transition-opacity`) menampilkan screenshot tema yang bersangkutan.
2. **Orientation Toggle (Horizontal vs Vertical Preview):**
   * Toggle button sederhana untuk beralih antara melihat mockup TV Horizontal (16:9) dan Totem Vertikal (9:16).
3. **Workflow Comparison Step Visual:**
   * Komponen perbandingan grafis: "Cara Lama (Ribet pakai ShareIt & Flashdisk)" vs "Cara Assalam TV (3 Detik dari Galeri HP)".
4. **Prayer State Slider:**
   * Slider / tabs untuk memperlihatkan transisi: Normal ➡️ Adzan ➡️ Iqomah ➡️ Layar Padam Sholat ➡️ Jumat.

### 3. Pemindahan Asset Screenshot ke Folder Public
Untuk performa loading web yang cepat, aset gambar dari `D:\9 KANDA\APPS Android\assalam-tv\designs\Capture screen` disalin ke:
`public/images/assalam-tv/`
* `public/images/assalam-tv/themes/horizontal/`
* `public/images/assalam-tv/themes/vertical/`
* `public/images/assalam-tv/screens/`
* `public/images/assalam-tv/admin/`
Dan dioptimasi menggunakan tag gambar Astro / format WebP jika diperlukan.
