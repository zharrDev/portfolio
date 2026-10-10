# Dzhar.dev — REST API

Base URL: `http://localhost:8080/api/v1` (configurable via `APP_PORT` / `APP_BASE_URL`).

## Conventions

- **Format**: JSON, UTF-8.
- **Success envelope**: `{ "data": <payload> }` (optionally with `"meta"`).
- **Error envelope**:

  ```json
  { "error": { "code": "validation_error", "message": "Data yang dikirim tidak valid.", "details": { "email": "Format email tidak valid." } } }
  ```

- **Status codes**: `200` OK · `201` Created · `204` No Content · `400` Bad Request ·
  `404` Not Found · `405` Method Not Allowed · `422` Validation Failed ·
  `429` Too Many Requests · `500` Internal Error · `503` Upstream Unavailable.
- **Pagination / filtering** (list endpoints): `page`, `per_page` (max 200).
- All SQL uses parameterised queries; inputs are validated in the service layer.

---

## Public endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | Liveness + database connectivity |
| `GET` | `/api/v1/profile` | Owner profile |
| `GET` | `/api/v1/education` | Education entries (ordered) |
| `GET` | `/api/v1/skills` | Skills with `category` |
| `GET` | `/api/v1/experience` | Experience entries |
| `GET` | `/api/v1/certificates` | Certificates |
| `GET` | `/api/v1/social-links` | Footer social links |
| `GET` | `/api/v1/settings` | Public site settings (key/value) |
| `GET` | `/api/v1/projects` | Published projects |
| `GET` | `/api/v1/projects/{slug}` | Single published project |
| `GET` | `/api/v1/github/repositories` | Cached GitHub repository metadata |
| `POST` | `/api/v1/contact` | Submit the contact form |

### `GET /api/v1/projects`

Query parameters:

| Name | Type | Notes |
|---|---|---|
| `search` | string | Matches title, short description, description |
| `language` | string | Exact match on `language` |
| `category` | string | Exact match on `category` |
| `status` | string | `completed`, `in_progress`, `prototype`, `archived`, `planned` |
| `featured` | bool | `true` to return only featured projects |
| `sort` | string | `recent` (default), `oldest`, `title`, `featured` |
| `page`, `per_page` | int | Pagination (per_page max 200) |

Only `published = true` projects are returned.

Each project includes nested `technologies` and `images` arrays.

### `POST /api/v1/contact`

```json
{
  "name": "Budi",
  "email": "budi@example.com",
  "subject": "Kolaborasi",
  "message": "Halo, saya ingin berdiskusi tentang proyek.",
  "website": ""
}
```

- `website` is a **honeypot**: it must remain empty. Any value is rejected.
- Rate limited per IP (`CONTACT_RATE_LIMIT_PER_MIN`, default 5/min) → `429`.
- Validation errors return `422` with `error.details` per field.
- The message is **always** persisted to `contact_messages`. When SMTP is
  configured (`SMTP_HOST` + `CONTACT_NOTIFY_TO`), a notification email is also
  sent in the background; a mail failure is logged and never fails the request.
  Header values are stripped of CR/LF to prevent header injection.

Response: `201 Created` → `{ "data": { "id": 12 } }`

### `GET /api/v1/github/repositories`

Returns repository metadata cached in PostgreSQL.

- The GitHub API is called **server-side only**; `GITHUB_TOKEN` never reaches the browser.
- Results are cached for `GITHUB_CACHE_TTL_MINUTES` (default 30).
- If GitHub is unreachable or rate limited, the cached database rows are returned
  as a fallback. If no cache exists, the endpoint responds `503`.

---

## Admin endpoints

> **Authentication note.** This is a personal portfolio project and, per the
> project brief, the dashboard deliberately has **no login page**. The admin
> routes below are therefore unauthenticated in this build. Before deploying the
> admin publicly, put it behind authentication (e.g. a reverse-proxy basic auth,
> an identity-aware proxy, or re-introduce a session-based login) — see
> `docs/deployment.md`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Aggregate stats + recent messages |
| `GET` | `/api/v1/admin/profile` | Profile for editing |
| `PUT` | `/api/v1/admin/profile` | Update profile |
| `GET/POST` | `/api/v1/admin/projects` | List / create project |
| `PUT/DELETE` | `/api/v1/admin/projects/{id}` | Update / delete project |
| `GET/POST` | `/api/v1/admin/skills` | List / create skill |
| `PUT/DELETE` | `/api/v1/admin/skills/{id}` | Update / delete skill |
| `GET/POST` | `/api/v1/admin/education` | List / create education |
| `PUT/DELETE` | `/api/v1/admin/education/{id}` | Update / delete education |
| `GET/POST` | `/api/v1/admin/experience` | List / create experience |
| `PUT/DELETE` | `/api/v1/admin/experience/{id}` | Update / delete experience |
| `GET/POST` | `/api/v1/admin/certificates` | List / create certificate |
| `PUT/DELETE` | `/api/v1/admin/certificates/{id}` | Update / delete certificate |
| `GET/POST` | `/api/v1/admin/social-links` | List / create social link |
| `PUT/DELETE` | `/api/v1/admin/social-links/{id}` | Update / delete social link |
| `GET` | `/api/v1/admin/settings` | List site settings |
| `PUT` | `/api/v1/admin/settings/{id}` | Update a setting value |
| `GET` | `/api/v1/admin/messages` | List contact messages |
| `PATCH` | `/api/v1/admin/messages/{id}` | Mark read/unread |
| `DELETE` | `/api/v1/admin/messages/{id}` | Delete message |
| `POST` | `/api/v1/admin/github/sync` | Force-refresh GitHub metadata |

### `POST /api/v1/admin/github/sync`

Fetches public repository metadata and upserts it into `github_repos` and
`projects` (as non-published drafts, so nothing is auto-published).

Response: `200 OK` → `{ "data": { "imported": 17, "updated": 0, "total": 17 } }`

### Project payload

`technologies` is an array of names; `images` is an array of
`{ "image_url": "https://…", "caption": "…" }`. Both replace the existing
relations for that project.

```json
{
  "slug": "ledgerflow",
  "title": "LedgerFlow",
  "short_description": "Aplikasi akuntansi berbasis web.",
  "status": "in_progress",
  "is_featured": true,
  "published": true,
  "repository_url": "https://github.com/zharrDev/LedgerFlow",
  "live_demo_url": "https://ledger-flow-frontend-azure.vercel.app/",
  "technologies": ["React", "TypeScript", "Supabase"],
  "images": []
}
```

---

## Verification

```bash
curl -s http://localhost:8080/healthz
curl -s http://localhost:8080/api/v1/profile | head -c 400
curl -s "http://localhost:8080/api/v1/projects?featured=true&per_page=3"
curl -s -X POST http://localhost:8080/api/v1/admin/github/sync
```
