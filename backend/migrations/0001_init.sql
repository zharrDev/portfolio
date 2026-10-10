-- ============================================================================
-- Dzhar.dev — initial schema
--
-- Applied by the built-in migration runner (internal/database/migrate.go).
-- Every statement is idempotent so the file can be re-run safely.
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id                BIGSERIAL PRIMARY KEY,
    full_name         TEXT        NOT NULL,
    nickname          TEXT        NOT NULL DEFAULT '',
    brand             TEXT        NOT NULL DEFAULT '',
    headline          TEXT        NOT NULL DEFAULT '',
    subheadline       TEXT,
    bio               TEXT,
    about             TEXT,
    avatar_url        TEXT,
    location          TEXT,
    email             TEXT,
    phone             TEXT,
    university        TEXT,
    major             TEXT,
    previous_school   TEXT,
    previous_major    TEXT,
    current_focus     TEXT,
    availability      TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS educations (
    id            BIGSERIAL PRIMARY KEY,
    institution   TEXT        NOT NULL,
    degree        TEXT,
    major         TEXT,
    start_year    INTEGER,
    end_year      INTEGER,
    description   TEXT,
    sort_order    INTEGER     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_educations_sort ON educations (sort_order);

CREATE TABLE IF NOT EXISTS skills (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    category    TEXT        NOT NULL,
    note        TEXT,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT skills_category_check CHECK (category IN (
        'programming_languages','frontend','backend','database','tools','operating_systems','other'
    )),
    CONSTRAINT skills_name_category_unique UNIQUE (name, category)
);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category, sort_order);

CREATE TABLE IF NOT EXISTS technologies (
    id    BIGSERIAL PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS projects (
    id                 BIGSERIAL PRIMARY KEY,
    slug               TEXT        NOT NULL UNIQUE,
    title              TEXT        NOT NULL,
    short_description  TEXT        NOT NULL,
    description        TEXT,
    category           TEXT,
    repository_url     TEXT,
    live_demo_url      TEXT,
    readme_url         TEXT,
    cover_image        TEXT,
    status             TEXT        NOT NULL DEFAULT 'in_progress',
    is_featured        BOOLEAN     NOT NULL DEFAULT false,
    published          BOOLEAN     NOT NULL DEFAULT true,
    problem            TEXT,
    goals              TEXT,
    main_features      TEXT,
    challenges         TEXT,
    learnings          TEXT,
    architecture       TEXT,
    year               INTEGER,
    language           TEXT,
    stars              INTEGER,
    forks              INTEGER,
    github_updated_at  TIMESTAMPTZ,
    source             TEXT        NOT NULL DEFAULT 'manual',
    sort_order         INTEGER     NOT NULL DEFAULT 0,
    published_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT projects_status_check CHECK (status IN ('completed','in_progress','prototype','archived','planned')),
    CONSTRAINT projects_source_check CHECK (source IN ('manual','github'))
);
CREATE INDEX IF NOT EXISTS idx_projects_featured   ON projects (is_featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_published  ON projects (published, year);
CREATE INDEX IF NOT EXISTS idx_projects_language   ON projects (language);

CREATE TABLE IF NOT EXISTS project_technologies (
    project_id     BIGINT NOT NULL REFERENCES projects (id)     ON DELETE CASCADE,
    technology_id  BIGINT NOT NULL REFERENCES technologies (id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, technology_id)
);
CREATE INDEX IF NOT EXISTS idx_project_tech_project ON project_technologies (project_id);

CREATE TABLE IF NOT EXISTS project_images (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT      NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    image_url   TEXT        NOT NULL,
    caption     TEXT,
    sort_order  INTEGER     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images (project_id, sort_order);

CREATE TABLE IF NOT EXISTS experiences (
    id            BIGSERIAL PRIMARY KEY,
    organization  TEXT        NOT NULL,
    role          TEXT        NOT NULL,
    type          TEXT,
    start_date    DATE,
    end_date      DATE,
    description   TEXT,
    sort_order    INTEGER     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_experiences_sort ON experiences (sort_order);

CREATE TABLE IF NOT EXISTS certificates (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT        NOT NULL,
    issuer          TEXT,
    issued_date     DATE,
    credential_url  TEXT,
    sort_order      INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificates_sort ON certificates (sort_order);

CREATE TABLE IF NOT EXISTS social_links (
    id          BIGSERIAL PRIMARY KEY,
    label       TEXT        NOT NULL,
    url         TEXT        NOT NULL,
    icon        TEXT,
    sort_order  INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    subject     TEXT        NOT NULL,
    message     TEXT        NOT NULL,
    is_read     BOOLEAN     NOT NULL DEFAULT false,
    ip_hash     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread  ON contact_messages (is_read);

CREATE TABLE IF NOT EXISTS site_settings (
    id     BIGSERIAL PRIMARY KEY,
    key    TEXT NOT NULL UNIQUE,
    value  TEXT NOT NULL DEFAULT ''
);

-- Cached GitHub repository metadata. Acts as the fallback source when the
-- GitHub API is unavailable or rate limited.
CREATE TABLE IF NOT EXISTS github_repos (
    id                BIGSERIAL PRIMARY KEY,
    owner             TEXT        NOT NULL,
    name              TEXT        NOT NULL,
    full_name         TEXT        NOT NULL UNIQUE,
    description       TEXT,
    html_url          TEXT        NOT NULL,
    homepage          TEXT,
    language          TEXT,
    topics            TEXT[]      NOT NULL DEFAULT '{}',
    stargazers_count  INTEGER     NOT NULL DEFAULT 0,
    forks_count       INTEGER     NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ,
    pushed_at         TIMESTAMPTZ,
    archived          BOOLEAN     NOT NULL DEFAULT false,
    is_fork           BOOLEAN     NOT NULL DEFAULT false,
    synced_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS github_sync_logs (
    id            BIGSERIAL PRIMARY KEY,
    status        TEXT        NOT NULL,
    message       TEXT,
    repos_found   INTEGER     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
