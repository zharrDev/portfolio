# Tahap 1 — Audit & Perencanaan

Laporan kondisi awal workspace, referensi yang berhasil diakses, repository yang
dapat diverifikasi, serta rencana implementasi.

Tanggal: 11 Oktober 2026 · Environment: Debian 12 (bookworm), x86_64.

---

## 1. Kondisi awal workspace

| Item | Temuan |
|---|---|
| Isi repositori | Hanya `README.md` (`# Portfolio`) + folder `.freebuff/` |
| Riwayat git | 1 commit, working tree bersih |
| Remote | `https://github.com/zharrDev/portfolio.git` |
| Struktur | Belum ada frontend, backend, docs, atau konfigurasi infra |

Kesimpulan: proyek dibangun dari nol; tidak ada berkas lama yang perlu
dipertahankan, sehingga tidak ada risiko menimpa pekerjaan yang sudah ada.

## 2. Tooling yang tersedia

| Tool | Status | Catatan |
|---|---|---|
| Node.js | ✅ `v18.20.4` | cukup untuk Vite 5 |
| npm | ✅ `9.2.0` | |
| Git | ✅ `2.39.5` | |
| Python 3 | ✅ `3.11.2` | dipakai untuk inspeksi JSON GitHub API |
| Go | ❌ → ✅ | tidak terpasang; **dipasang lokal** ke `~/.local/go` (go1.27.2) |
| Docker | ❌ | tidak tersedia, tanpa sudo |
| PostgreSQL | ❌ | tidak tersedia, tanpa sudo |
| `sudo` | ❌ | password diminta → tidak tersedia |

**Konsekuensi:** backend di-build & diuji dengan toolchain Go lokal. Stack
Docker dan database PostgreSQL tidak dapat dijalankan di environment ini, jadi
file `docker-compose.yml`/`Dockerfile` disediakan dan didokumentasikan, tetapi
**tidak diklaim telah dijalankan**. Verifikasi backend dilakukan lewat build,
`go vet`, dan unit/HTTP test.

## 3. Referensi desain yang berhasil diakses

| URL | HTTP | Dipakai |
|---|---|---|
| `https://www.awwwards.com/` | 200 | ✅ |
| `https://www.awwwards.com/websites/` | 200 | ✅ |
| `https://www.awwwards.com/websites/single-page-1/` | 200 | ✅ |
| `https://www.awwwards.com/websites/portfolio/` | 200 | ✅ |
| `https://www.awwwards.com/awwwards/favorites/` | 301 | redirect (kurasi/login) — tidak dipakai sebagai acuan konten |

Tidak ada halaman yang diklaim telah diperiksa tanpa benar-benar diakses.
Keputusan visual lengkap ada di [`design-direction.md`](design-direction.md).

## 4. Repository GitHub yang terverifikasi

Data diambil langsung dari GitHub REST API (`/users/zharrDev/repos`).
Ditemukan **17 repository publik**. Ringkasan:

| Repository | Bahasa | Deskripsi (dari GitHub) | Live demo |
|---|---|---|---|
| LedgerFlow | TypeScript | Accounting platform — journal, laporan, AI insights | led…vercel.app |
| PrintKu | Go | E-commerce ATK & jasa print (Go + Svelte + PostgreSQL) | — |
| Banking-System-Java | TypeScript | Spring Boot + React + PostgreSQL | — |
| QuestLearn-javaTS | Java | E-learning platform | — |
| Evenify | Java | Event management platform | — |
| dzharfinance | CSS | Personal finance platform | dzharfinance.vercel.app |
| TaskFlow-TS | TypeScript | Task management | — |
| projekan | JavaScript | Web projects collection | projekan-five.vercel.app |
| UTS-ReactJS | JavaScript | React front-end task | uts-reactt.vercel.app |
| uts-ReactJS-lanjutan | JavaScript | React advanced | — |
| JavaScript | JavaScript | JS learning projects | tugas-2-dzhar.vercel.app |
| banking-system-c | C | Banking system (C) | — |
| SIA-DistributorCompony-s | C | Inventory & distributor | — |
| Tugas-Java-Pertemuan-1 | Java | Java coursework | — |
| zhardeb12-linux | Shell | Debian setup | — |
| zharrDev | — | Profile README | — |
| portfolio | — | Repositori ini | — |

**README yang benar-benar dibaca** (untuk menghindari klaim palsu): `LedgerFlow`
dan `PrintKu`. Fitur yang ditulis di portfolio hanya yang tercantum sebagai
selesai di README/repository — fitur yang masih di roadmap tidak ditampilkan
sebagai fitur jadi.

## 5. Data profil yang belum tersedia (placeholder)

Tidak diisi dengan informasi karangan:

- Email dan nomor telepon → `NULL` sampai diisi lewat admin.
- Alamat/lokasi → `NULL`.
- Sertifikat, pengalaman kerja, prestasi → tidak ada; bagiannya otomatis
  tersembunyi sampai diisi.
- Statistik kontribusi / tahun pengalaman / jumlah pengguna → **tidak dibuat**.
- URL demo PrintKu → tidak ada, karena repository tidak menyebutkannya.

## 6. Rencana implementasi

| Tahap | Isi | Status |
|---|---|---|
| 1 | Audit, referensi, design direction, skema DB/API | ✅ selesai |
| 2 | Design system + frontend vanilla TS (MPA) | ✅ selesai |
| 3 | Backend Go, PostgreSQL, migrasi, REST API | ✅ selesai |
| 4 | Integrasi GitHub (cache + fallback), project showcase, detail page | ✅ selesai |
| 5 | Dashboard admin + halaman CV/cetak + contact form | ✅ selesai |
| 6 | Pengujian, dokumentasi, perbaikan | ✅ selesai (lihat README §8) |

Catatan revisi: instruksi awal menyebut penggunaan Preact; atas permintaan
pemilik proyek, frontend **diganti menjadi TypeScript vanilla** (tanpa framework
UI) dan **halaman login/register dihapus** karena ini proyek portfolio pribadi.
