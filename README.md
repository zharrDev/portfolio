# Dzhar.dev — Personal Portfolio & Project Showcase

Portfolio profesional untuk **Izhar "Dzhar" Harahap** — mahasiswa Akuntansi yang
membangun sistem, backend, dan aplikasi web.

- **Frontend**: HTML5 + CSS3 + **TypeScript (vanilla)** — *tanpa* framework UI
  (tanpa React/Preact/Vue/Svelte/Angular/Next.js/Tailwind), dibangun dengan
  **Vite** sebagai dev server & bundler (multi-page app).
- **Backend**: **Go** (net/http + Chi), REST API JSON.
- **Database**: **PostgreSQL** dengan SQL migrations.
- **Infrastruktur**: Docker & Docker Compose, Makefile, `.env.example`.

> Desain dan arah visual didokumentasikan di [`docs/design-direction.md`](docs/design-direction.md).
> Kontrak API ada di [`docs/api.md`](docs/api.md).

---

## 1. Fitur

**Halaman publik**

| Halaman | Berkas | Isi |
|---|---|---|
| Home | `index.html` | Hero, tentang, skills, featured projects, pendidikan, CTA kontak |
| About | `about.html` | Profil, pendidikan (timeline), pengalaman, sertifikat, skills |
| Projects | `projects.html` | Pencarian, filter (bahasa/kategori/status), sorting, featured-only, daftar repo GitHub |
| Project detail | `project-detail.html?slug=…` | Cover, gallery + lightbox, masalah→solusi, tech stack, tautan, next/prev |
| Resume / CV | `resume.html` | Layout editorial + **print stylesheet** & tombol unduh PDF |
| Contact | `contact.html` | Form validasi, loading state, notifikasi, honeypot — pesan disimpan di PostgreSQL, email opsional lewat SMTP |
| 404 | `404.html` | Empty state bergaya terminal |

**Dashboard admin** (`/admin/*.html`) — CRUD penuh terhadap profil, projects,
skills, education, experience, certificates, social links, pesan kontak,
pengaturan situs, plus **sinkronisasi GitHub**.

Per bagian yang kosong (experience / certificates) otomatis **disembunyikan**
di halaman publik — tidak ada data palsu. Informasi yang belum tersedia
(email, telepon, sertifikat, pengalaman) sengaja dibiarkan kosong.

---

## 2. Struktur proyek

```
portfolio/
├── frontend/                  # Vanilla TS + Vite (multi-page)
│   ├── index.html  about.html  projects.html  project-detail.html
│   ├── resume.html contact.html 404.html
│   ├── admin/                 # Dashboard (index, projects, profile, skills, …)
│   ├── assets/css/            # tokens, base, layout, components, pages, admin, print
│   ├── public/                # favicon, og-image, robots.txt, sitemap.xml
│   └── src/
│       ├── api/               # REST client
│       ├── components/        # DOM builder, icons, UI, layout, cards, form
│       ├── pages/             # one controller per public page
│       ├── admin/             # admin layout, CRUD, dashboard, messages, settings
│       ├── types/             # shared domain types
│       └── utils/             # dom.ts, format.ts
├── backend/                   # Go REST API
│   ├── cmd/api  cmd/migrate
│   ├── internal/{config,database,model,repository,service,handler,middleware}
│   ├── migrations/            # 0001_init.sql, 0002_seed.sql
│   └── Dockerfile
├── docs/{design-direction.md,api.md,audit-report.md,deployment.md}
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## 3. Menjalankan

### Prasyarat

- **Node.js 18+** dan npm
- **Go 1.23+**
- **PostgreSQL 14+** — atau Docker (cara termudah)

### 3.1 Cepat dengan Docker

```bash
cp .env.example .env      # opsional: sesuaikan nilai
make up                   # PostgreSQL + Go API
# API berjalan di http://localhost:8080
```

Migrasi + seed dijalankan **otomatis saat API start**.

### 3.2 Manual (tanpa Docker)

```bash
cp .env.example .env
# Pastikan PostgreSQL berjalan, lalu buat database sesuai POSTGRES_DB.

# Backend
cd backend
go mod download
go run ./cmd/migrate      # buat tabel + seed
go run ./cmd/api          # http://localhost:8080

# Frontend (terminal lain)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Selama dev, Vite mem-proxy `/api` ke `http://localhost:8080`, jadi frontend
memakai permintaan same-origin.

### 3.3 Build produksi

```bash
make build-frontend       # hasil di frontend/dist (17 halaman HTML)
make build-backend        # binari di backend/bin
```

Sajikan `frontend/dist` melalui reverse proxy (Nginx/Caddy) dan arahkan
`/api/*` ke service Go.

---

## 4. Perintah Make

```bash
make help            # daftar target
make install         # npm install
make dev-frontend    # Vite dev server
make typecheck       # tsc --noEmit
make build-frontend  # build frontend
make run-backend     # jalankan API
make test            # go test ./...
make vet             # go vet ./...
make migrate         # terapkan migrasi
make up / down       # docker compose
make check           # typecheck + test + vet
```

---

## 5. Konfigurasi

Semua variabel didokumentasikan di [`.env.example`](.env.example).
Yang paling penting:

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL |
| `GITHUB_USERNAME` | Akun GitHub yang disinkronkan (default `zharrDev`) |
| `GITHUB_TOKEN` | Opsional — menaikkan rate limit. **Hanya di backend.** |
| `GITHUB_CACHE_TTL_MINUTES` | Lama cache metadata repo (default 30) |
| `CONTACT_RATE_LIMIT_PER_MIN` | Rate limit form kontak |
| `FRONTEND_ORIGIN` | Origin yang diizinkan CORS |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM` | Notifikasi email ke `CONTACT_NOTIFY_TO` saat pesan kontak masuk. **Opsional** — bila `SMTP_HOST` kosong, email tidak dikirim dan pesan tetap tersimpan di PostgreSQL. |
| `CONTACT_NOTIFY_TO` | Alamat penerima notifikasi pesan kontak |

`.env` **tidak pernah** ikut ter-commit (lihat `.gitignore`).

---

## 6. Integrasi GitHub

- Metadata repository diambil lewat REST API GitHub **dari backend**; token
  tidak pernah dikirim ke browser.
- Hasil disimpan di tabel `github_repos` sebagai cache **dan** fallback bila
  GitHub tidak tersedia / rate limit.
- Sinkronisasi dipicu manual dari dashboard admin (`POST /api/v1/admin/github/sync`)
  dan hanya membuat project **draft** (`published = false`) — tidak ada
  repository yang otomatis dipublikasikan.
- Hanya repository publik; repository tanpa deskripsi diberi teks netral.

---

## 7. Keamanan & catatan penting

- **Tidak ada halaman login/register** — sesuai permintaan pemilik proyek
  (portfolio pribadi). Endpoint `/api/v1/admin/*` karenanya **tanpa autentikasi**
  pada build ini.
  → **Sebelum menaruh dashboard di internet publik**, lindungi dengan
  reverse-proxy auth atau kembalikan login bersesi. Lihat
  [`docs/deployment.md`](docs/deployment.md).
- Query SQL selalu berparameter; input divalidasi di service layer.
- Rate limiting pada endpoint kontak; honeypot menangkap bot.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` diset oleh API.
- Hanya URL `http(s)` yang dirender sebagai tautan/gambar di frontend.
- Debug/internal error tidak pernah dibocorkan ke client.

---

## 7b. Belum diimplementasikan (jujur, bukan klaim)

Beberapa hal sengaja **belum** dibuat agar tidak ada dokumentasi yang berbohong:

| Hal | Status | Alternatif yang dipakai sekarang |
|---|---|---|
| Unggah berkas gambar | ❌ belum ada endpoint upload | Cover & screenshot proyek dikelola lewat **URL** (`cover_image`, `images[].image_url`). Variabel `UPLOAD_DIR`/`MAX_UPLOAD_MB` disiapkan untuk pengembangan berikutnya. |
| PDF server-side | ❌ belum ada | Tombol CV memakai **print stylesheet** + dialog cetak browser → “Save as PDF”. |
| Preview iframe live demo | ❌ sengaja tidak | Jika demo memblokir framing (`X-Frame-Options`/CSP) iframe akan kosong; jadi selalu ditampilkan cover/gambar + tombol **Open Live Demo**. |
| Autentikasi admin | ❌ sesuai permintaan pemilik | Lihat peringatan di §7 dan `docs/deployment.md`. |

Notifikasi email kontak **sudah** berfungsi (opsional via SMTP).

---

## 8. Pengujian

```bash
# Backend — unit + HTTP tests
cd backend && go test ./... && go vet ./...

# Frontend — type check & build
cd frontend && npm run typecheck && npm run build

# End-to-end (butuh backend + PostgreSQL berjalan dan dist sudah di-build)
cd frontend && npm run build && npm run smoke -- http://localhost:8080
```

**Cakupan test backend**: validasi (contact/project/education/skills), slug,
hashing IP, GitHub client (sukses, rate limit, server error, JSON rusak,
timeout), router (404/405/CORS/security headers), dan rate limiter.

**`npm run smoke`** memuat bundel hasil build di dalam lingkungan DOM (jsdom),
mengarahkan permintaan ke API yang benar-benar berjalan, lalu memeriksa bahwa
halaman benar-benar merender data: skills, featured projects, timeline
pendidikan, filter proyek (bahasa + empty state), halaman detail proyek,
CV, validasi form kontak, dashboard admin, tabel CRUD, modal editor, dan 404.
Ini membuktikan logika TypeScript berjalan — bukan sekadar berhasil dikompilasi.

---

## 9. Lisensi & kredit

Kode ditulis untuk portfolio pribadi. Geometri ikon mengikuti
[Lucide](https://lucide.dev) (ISC) dan disematkan langsung sebagai SVG.
Inspirasi desain: [Awwwards](https://www.awwwards.com/) — tanpa menyalin aset
atau konten apa pun.
