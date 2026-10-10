# Deployment

Panduan menjalankan dan menyebarkan Dzhar.dev.

---

## 0. Catatan keamanan penting (baca dulu)

Proyek ini **tidak memiliki halaman login/register** — sesuai permintaan pemilik
proyek, karena ini portfolio pribadi. Konsekuensinya:

> Endpoint `/api/v1/admin/*` (termasuk CRUD dan sinkronisasi GitHub)
> **tidak terlindungi autentikasi** pada build ini.

**Jangan mengekspos `/admin/` ke internet publik apa adanya.** Pilih salah satu:

1. **Autentikasi di reverse proxy** (paling cepat)

   Nginx:

   ```nginx
   location /admin/ {
       auth_basic "Restricted";
       auth_basic_user_file /etc/nginx/.htpasswd;
       try_files $uri $uri/ /admin/index.html;
   }
   location /api/v1/admin/ {
       auth_basic "Restricted";
       auth_basic_user_file /etc/nginx/.htpasswd;
       proxy_pass http://127.0.0.1:8080;
   }
   ```

   Caddy (`caddy hash-password` untuk membuat hash):

   ```caddy
   dzhar.dev {
       handle /admin/* {
           basic_auth {
               dzhar $2a$14$<hash>
           }
           root * /srv/dzhar
           try_files {path} /admin/index.html
           file_server
       }
       handle /api/v1/admin/* {
           basic_auth {
               dzhar $2a$14$<hash>
           }
           reverse_proxy 127.0.0.1:8080
       }
       handle {
           root * /srv/dzhar
           try_files {path} /index.html
           file_server
       }
       handle /api/* {
           reverse_proxy 127.0.0.1:8080
       }
   }
   ```

2. **Identity-aware proxy** (Cloudflare Access / Tailscale / oauth2-proxy).

3. **Kembalikan sesi login** — tambahkan tabel `admin_users`, login dengan
   bcrypt + cookie sesi `HttpOnly`/`Secure` + CSRF token, lalu pasang middleware
   autentikasi pada grup `/api/v1/admin`. Struktur middleware sudah disiapkan di
   `backend/internal/middleware/`, sehingga penambahannya terisolasi.

Selain itu:

- Jalankan di belakang HTTPS.
- Set `FRONTEND_ORIGIN` ke origin produksi agar CORS ketat.
- Jangan pernah menaruh `GITHUB_TOKEN` di frontend — token hanya dibaca backend.

---

## 1. Opsi A — Docker Compose (disarankan untuk VPS)

```bash
git clone https://github.com/zharrDev/portfolio.git
cd portfolio
cp .env.example .env
# edit .env: POSTGRES_PASSWORD, GITHUB_TOKEN (opsional), FRONTEND_ORIGIN

docker compose up --build -d
docker compose logs -f api
```

- PostgreSQL: volume `db_data`
- API: `http://localhost:8080`
- Migrasi dijalankan otomatis saat API start

Menaikkan versi setelah perubahan:

```bash
git pull
docker compose up --build -d
```

---

## 2. Opsi B — VPS bare-metal

**Backend**

```bash
cd backend
go build -o bin/api ./cmd/api
go build -o bin/migrate ./cmd/migrate
./bin/migrate           # sekali saja / setiap deploy
./bin/api
```

Unit systemd contoh:

```ini
[Unit]
Description=Dzhar.dev API
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/dzhar/backend
EnvironmentFile=/srv/dzhar/.env
ExecStart=/srv/dzhar/backend/bin/api
Restart=always
User=dzhar

[Install]
WantedBy=multi-user.target
```

**Frontend**

```bash
cd frontend
npm ci
npm run build          # hasil: frontend/dist
```

Salin `frontend/dist` ke web root (mis. `/srv/dzhar/public`) lalu sajikan lewat
Nginx/Caddy. Karena ini **multi-page app**, setiap halaman adalah berkas HTML
nyata (`index.html`, `projects.html`, `admin/projects.html`, …) sehingga tidak
memerlukan rewrite SPA. Cukup arahkan `/api/*` ke service Go.

---

## 3. Variabel environment produksi

| Variabel | Nilai produksi |
|---|---|
| `APP_ENV` | `production` |
| `APP_BASE_URL` | `https://dzhar.dev` |
| `FRONTEND_ORIGIN` | `https://dzhar.dev` |
| `DATABASE_URL` | `postgres://user:pass@host:5432/db?sslmode=require` |
| `GITHUB_TOKEN` | token read-only (menaikkan rate limit ke 5000/jam) |
| `GITHUB_CACHE_TTL_MINUTES` | `30` (naikkan bila token tidak dipakai) |
| `CONTACT_RATE_LIMIT_PER_MIN` | `5` |

---

## 4. Setelah deploy — checklist

```bash
curl -s https://dzhar.dev/api/v1/healthz           # {"data":{"status":"ok"}}
curl -s https://dzhar.dev/api/v1/profile | head -c 200
curl -s "https://dzhar.dev/api/v1/projects?featured=true" | head -c 200
```

- [ ] `/healthz` mengembalikan `status: ok`
- [ ] Halaman publik tampil dan tidak error di konsol browser
- [ ] `/admin/` **terlindungi** (ceklik dari jaringan luar)
- [ ] Form kontak mengembalikan `201` dan pesan muncul di `/admin/messages.html`
- [ ] Tombol "Sinkron GitHub" mengembalikan jumlah repositori
- [ ] Tombol cetak di `/resume.html` menghasilkan PDF yang rapi
- [ ] `.env` tidak pernah ikut ter-commit (`git check-ignore .env`)

---

## 5. Migrasi database

Migrasi bersifat idempotent dan dijalankan otomatis saat API start. Untuk
menjalankannya terpisah (mis. di pipeline CI):

```bash
cd backend && go run ./cmd/migrate
```

Berkas migrasi ada di `backend/migrations/` dan disematkan ke biner
(`//go:embed`), sehingga tidak perlu menyalin folder saat deploy.

Status migrasi dapat dilihat di tabel `schema_migrations`.
