# Dzhar.dev — Design Direction

> Dokumen ini mencatat keputusan desain untuk portfolio pribadi **Izhar "Dzhar" Harahap**
> (`Dzhar.dev`). Referensi dipakai sebagai *inspirasi*, bukan template yang disalin.

---

## 1. Konteks & Tujuan

Portfolio ini harus terasa seperti seorang **creative developer** yang punya latar
belakang **Akuntansi** dan sedang menekuni **software / backend / fintech** — bukan
landing page dashboard admin, bukan pula template portfolio generik.

Sasaran desain:
1. Identitas visual yang khas (dark, editorial, monospace accent).
2. Menonjolkan **project showcase** sebagai pusat perhatian.
3. Animasi halus yang mendukung cerita, bukan dekorasi.
4. Terasa cepat, terbaca, dan bisa diakses (a11y & performa).

---

## 2. Referensi yang Berhasil Diakses

Saat membangun proyek ini (environment Linux, Debian 12), halaman berikut berhasil
diakses (HTTP 200) dan dipakai sebagai bahan analisis pola:

| Referensi | Status | Pola yang dipelajari |
|---|---|---|
| `https://www.awwwards.com/` | 200 | Ritme grid, tipografi display besar, micro-label kecil |
| `https://www.awwwards.com/websites/` | 200 | Variasi komposisi single-page vs multi-page |
| `https://www.awwwards.com/websites/single-page-1/` | 200 | Alur scroll vertikal, section anchoring |
| `https://www.awwwards.com/websites/portfolio/` | 200 | Daftar portfolio: thumbnail besar, nama, label kecil |
| `https://www.awwwards.com/awwwards/favorites/` | 301→redirect | Perlu login/kurasi; tidak dipakai sebagai acuan konten |

Halaman yang **tidak** berhasil diakses secara bermakna tidak diklaim sudah diperiksa.
Tidak ada aset, logo, atau konten berhak cipta dari situs referensi yang disalin.

**Karakteristik umum portfolio pemenang Awwwards yang diobservasi:**
- Tipografi display sangat besar (clamp besar, sering uppercase).
- Kontras tinggi antara headline besar dan micro-label monospace kecil.
- Banyak whitespace, grid editorial, sesekali komposisi asimetris.
- Project card dengan thumbnail dominan + hover reveal (meta, tahun, kategori).
- Transisi halaman cepat; animasi scroll reveal ringan (fade + translate kecil).
- Navigasi sederhana, sering dengan indikator "current" yang halus.
- Aksen warna tunggal yang kuat di atas latar netral gelap.

---

## 3. Arah Visual (Keputusan)

Keputusan desain dibuat **sendiri** untuk Dzhar.dev, menurunkan pola di atas menjadi
identitas tersendiri:

- **Mood**: "ledger meets terminal" — presisi & keteraturan seorang akuntan
  bertemu rasa technical seorang developer.
- **Latar**: dark navy / hitam kebiruan (bukan hitam pekat) untuk memberi kedalaman.
- **Aksen**: electric blue / cyan **secukupnya** — hanya untuk elemen interaktif,
  status, dan penanda aktif. Bukan membanjiri halaman.
- **Tipografi**: display editorial tegas + body netral + monospace untuk label,
  angka, dan detail teknis. Monospace menjadi penanda identitas "sistem".
- **Grid**: grid 12 kolom untuk konten utama, dengan beberapa blok yang sengaja
  keluar kolom (asimetris) pada hero dan project showcase.
- **Motif dekoratif**: garis "ledger" tipis, tick angka, dan cursor blok terminal —
  relevan dengan akuntansi & sistem. Tanpa gambar stok.

### Palet (design tokens)

| Token | Nilai | Peran |
|---|---|---|
| `--bg` | `#060910` | Latar utama (dark navy-hitam) |
| `--bg-elev` | `#0b1120` | Permukaan / card |
| `--bg-elev-2` | `#111a2e` | Hover / permukaan lebih tinggi |
| `--line` | `rgba(148,163,184,.14)` | Garis/border halus |
| `--fg` | `#e6edf6` | Teks utama |
| `--fg-muted` | `#8aa0bd` | Teks sekunder |
| `--fg-dim` | `#5b6f8c` | Teks tersier / label |
| `--accent` | `#38bdf8` | Aksen utama (electric blue) |
| `--accent-2` | `#22d3ee` | Aksen sekunder (cyan) |
| `--success` | `#34d399` | Status sukses |
| `--danger` | `#f87171` | Status gagal / error |
| `--warning` | `#fbbf24` | Status peringatan |

Semua warna diuji rasio kontrasnya untuk teks normal ≥ 4.5:1 pada latar gelap.

### Tipografi

| Peran | Font | Fallback |
|---|---|---|
| Display / heading | **Space Grotesk** | system sans |
| Body / UI | **Inter** | system sans |
| Mono / label / angka | **JetBrains Mono** | ui-monospace |

Dimuat dari Google Fonts dengan `preconnect` dan `display=swap`. Ukuran display
memakai `clamp()` agar tetap tegas di desktop dan terbaca di mobile.

### Skala & spacing

- Spacing mengikuti kelipatan 4px; section padding vertikal `clamp(5rem, 12vh, 9rem)`.
- Radius sudut kecil (6–14px) untuk kesan teknis dan presisi.
- Lebar konten maksimum 1200px, dengan "bleed" untuk hero.

---

## 4. Prinsip Interaksi & Animasi

- **Scroll reveal**: fade + translateY(16px), durasi 400–600ms, `ease-out`.
- **Hover project card**: thumbnail zoom halus (scale 1.03), meta muncul, border
  aksen, underline judul bergerak.
- **Micro-interaction tombol**: perubahan background/border + sedikit translasi,
  fokus ring yang jelas.
- **Transisi halaman**: fade singkat saat mount, tanpa efek berat.
- **Loading**: skeleton untuk daftar (projects, skills, dsb).
- **Cursor terminal**: elemen dekoratif pada hero (blok berkedip), bukan pointer
  kustom global (agar tetap mobile-friendly).
- **`prefers-reduced-motion: reduce`** dimatikan seluruh animasi non-esensial.

Animasi diimplementasikan dengan **CSS transitions & keyframes** dan
`IntersectionObserver`. Tidak ada library animasi berat. Semua tombol berfungsi.

---

## 5. Prinsip Per Halaman

- **Home**: hero editorial + terminal motif; ringkasan about; skills ringkas;
  featured projects dari database; education timeline; contact.
- **Projects**: grid besar, pencarian, filter (bahasa/kategori/status),
  sorting, featured-only, empty state jelas.
- **Project detail**: cover besar, gallery + lightbox, narasi masalah→solusi,
  tech stack, status, link repo/demo (hanya bila URL tersedia), next/prev.
- **Resume**: layout editorial + **print stylesheet** khusus & tombol unduh PDF.
- **Admin**: fungsional, dua-panel (sidebar + konten), kontras nyaman untuk kerja
  lama, bukan mengikuti gaya "postaer" halaman publik.
- **404**: pesan terminal yang sesuai identitas, plus navigasi kembali.

---

## 6. Aksesibilitas & Performa

- Semantic HTML (`header`, `nav`, `main`, `section`, `article`, `footer`).
- Label ARIA, `focus-visible` states, navigasi keyboard penuh, skip-link.
- Kontras warna memadai; tidak mengandalkan warna saja untuk menyampaikan status.
- Gambar `loading="lazy"` + `decoding="async"`; dimensi diset untuk mencegah CLS.
- Lazy-load halaman berat; hindari permintaan API berulang (cache di service layer).
- Target Lighthouse yang baik: LCP ringan, CLS mendekati nol.

---

## 7. Yang Sengaja Dihindari

- Menyalin layout/aset berhak cipta dari Awwwards atau proyek lain.
- Statistik palsu (jumlah proyek, tahun pengalaman, jumlah pengguna).
- Efek berat (partikel 3D, video besar, WebGL) yang mengorbankan performa mobile.
- Menampilkan fitur/proyek sebagai "selesai" tanpa verifikasi repository.
- Menjadikan halaman publik terasa seperti dashboard admin.
