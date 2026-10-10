-- ============================================================================
-- Dzhar.dev — seed data
--
-- IMPORTANT: only verifiable information is seeded here. Contact details,
-- phone numbers, certificates, work experience and achievements are NOT
-- invented — they must be added by the owner through the admin dashboard.
--
-- Idempotent: every insert is guarded so re-running is safe.
-- ============================================================================

INSERT INTO profiles (full_name, nickname, brand, headline, subheadline, about, university, major,
                      previous_school, previous_major, current_focus, availability)
SELECT
  'Izhar Harahap',
  'Dzhar',
  'Dzhar.dev',
  'Backend & Web Developer · Accounting Student',
  'Accounting student by education. Developer by passion.',
  E'Saya adalah mahasiswa Akuntansi yang mengembangkan minat di bidang software development, khususnya backend dan web development.\nLatar belakang Akuntansi memberi saya pemahaman tentang alur data, proses bisnis, dan aturan pelaporan keuangan — hal yang sangat berguna ketika merancang perangkat lunak.\nSaya belajar dengan membangun proyek nyata: menulis kode, membaca dokumentasi resmi, menguji hasilnya, lalu memperbaiki apa yang belum bekerja. Saat ini saya fokus mendalami Go, TypeScript, PostgreSQL, dan teknologi keuangan.',
  'Universitas Nasional Pasim',
  'Akuntansi',
  'SMKS Swadaya',
  'Akuntansi',
  'Backend Development, Web Development, Database Engineering, Financial Technology',
  'Sedang belajar & membangun proyek'
WHERE NOT EXISTS (SELECT 1 FROM profiles);

INSERT INTO educations (institution, degree, major, start_year, end_year, description, sort_order)
SELECT * FROM (VALUES
  ('Universitas Nasional Pasim', 'S1', 'Akuntansi', 2024, NULL, 'Menempuh pendidikan sarjana Akuntansi sambil mengembangkan kemampuan software development secara mandiri.', 1),
  ('SMKS Swadaya', 'SMK', 'Akuntansi', NULL, 2024, 'Menyelesaikan pendidikan menengah kejuruan pada jurusan Akuntansi.', 2)
) AS seed(institution, degree, major, start_year, end_year, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM educations);

INSERT INTO skills (name, category, sort_order)
SELECT name, category, sort_order FROM (VALUES
  ('Go',                  'programming_languages', 1),
  ('TypeScript',          'programming_languages', 2),
  ('JavaScript',          'programming_languages', 3),
  ('Java',                'programming_languages', 4),
  ('SQL',                 'programming_languages', 5),
  ('C',                   'programming_languages', 6),
  ('HTML5',               'frontend',              1),
  ('CSS3',                'frontend',              2),
  ('React',               'frontend',              3),
  ('SvelteKit',           'frontend',              4),
  ('Vite',                'frontend',              5),
  ('Go (net/http, Chi)',  'backend',               1),
  ('REST API',            'backend',               2),
  ('JWT',                 'backend',               3),
  ('Hono',                'backend',               4),
  ('PostgreSQL',          'database',              1),
  ('SQLite',              'database',              2),
  ('Redis',               'database',              3),
  ('Git',                 'tools',                 1),
  ('Docker',              'tools',                 2),
  ('Docker Compose',      'tools',                 3),
  ('Visual Studio Code',  'tools',                 4),
  ('Neovim',              'tools',                 5),
  ('Debian Linux',        'operating_systems',     1),
  ('Tailwind CSS',        'other',                 1),
  ('Supabase',            'other',                 2),
  ('Midtrans (Sandbox)',  'other',                 3)
) AS seed(name, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM skills);

INSERT INTO social_links (label, url, icon, sort_order)
SELECT * FROM (VALUES
  ('GitHub', 'https://github.com/zharrDev', 'github', 1)
) AS seed(label, url, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM social_links);

INSERT INTO site_settings (key, value)
SELECT * FROM (VALUES
  ('site_title',       'Dzhar.dev — Izhar Harahap'),
  ('site_description', 'Portfolio Izhar "Dzhar" Harahap — backend & web developer.'),
  ('github_username',  'zharrDev'),
  ('footer_note',      'Go · TypeScript · PostgreSQL')
) AS seed(key, value)
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- ---------------------------------------------------------------------------
-- Initial curated projects (verified from the public repositories)
-- ---------------------------------------------------------------------------
INSERT INTO technologies (name)
SELECT DISTINCT name FROM (VALUES
  ('React'),('TypeScript'),('Vite'),('Tailwind CSS'),('Hono'),('Supabase'),('JWT'),
  ('Go'),('SvelteKit'),('Redis'),('Docker Compose'),('SQLite'),('Midtrans'),('PostgreSQL')
) AS seed(name)
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (
  slug, title, short_description, description, category,
  repository_url, live_demo_url, status, is_featured, published,
  problem, goals, main_features, challenges, learnings, year, language, source, sort_order, published_at
)
SELECT
  'ledgerflow',
  'LedgerFlow',
  'Aplikasi web akuntansi untuk pencatatan jurnal, buku besar, dan laporan keuangan secara terstruktur.',
  'LedgerFlow adalah aplikasi akuntansi dan pembukuan berbasis web yang dirancang untuk membantu usaha mengelola keuangan secara digital: pencatatan jurnal, buku besar, laporan keuangan (Laba Rugi, Neraca, Arus Kas), chart of accounts, manajemen periode, dan multi-perusahaan.',
  'web',
  'https://github.com/zharrDev/LedgerFlow',
  'https://ledger-flow-frontend-azure.vercel.app/',
  'in_progress', true, true,
  'Pencatatan keuangan manual menyulitkan pemilik usaha memantau posisi keuangan secara cepat dan konsisten, terutama ketika volume transaksi bertambah.',
  E'Menyediakan pencatatan jurnal yang mengikuti kaidah akuntansi berpasangan.\nMenyajikan laporan keuangan yang dapat ditelusuri kembali ke transaksi sumbernya.\nMendukung lebih dari satu perusahaan dalam satu akun.',
  E'Autentikasi pengguna dan pembatasan akses berdasarkan peran.\nChart of accounts dan jurnal umum dengan validasi keseimbangan debit–kredit.\nLaporan Laba Rugi, Neraca, dan Arus Kas.\nManajemen periode dan multi-perusahaan.',
  'Menjaga konsistensi aturan akuntansi pada lapisan API sekaligus memastikan laporan tetap akurat ketika data bertambah banyak.',
  'Latihan terbaik dalam menerjemahkan aturan bisnis akuntansi menjadi validasi teknis dan struktur data yang konsisten.',
  2026, 'TypeScript', 'manual', 1, now()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'ledgerflow');

INSERT INTO projects (
  slug, title, short_description, description, category,
  repository_url, status, is_featured, published,
  problem, goals, main_features, challenges, learnings, year, language, source, sort_order, published_at
)
SELECT
  'printku',
  'PrintKu',
  'Platform e-commerce untuk toko ATK dan jasa print/fotocopy online, dibangun dengan Go dan SvelteKit.',
  'PrintKu menggabungkan dua kebutuhan: toko online alat tulis kantor serta jasa print, fotocopy, jilid, laminating, dan scan dokumen. Pelanggan mengunggah file, memilih spesifikasi, dan sistem menghitung harga dari jumlah halaman yang diparsing di sisi server.',
  'web',
  'https://github.com/zharrDev/PrintKu',
  'in_progress', true, true,
  'Pemesanan jasa cetak umumnya masih dilakukan secara manual sehingga estimasi harga dan status pesanan sulit dilacak pelanggan.',
  E'Digitalisasi pemesanan jasa print dengan kalkulasi harga otomatis.\nMenyediakan pelacakan status pesanan yang jelas.\nMenyatukan penjualan produk ATK dan jasa cetak dalam satu platform.',
  E'Upload file dengan parsing jumlah halaman server-side.\nKalkulasi harga berdasarkan spesifikasi cetak.\nPelacakan status pesanan.\nAutentikasi berbasis JWT dan dashboard admin.\nPembayaran melalui Midtrans dalam mode sandbox.',
  'Menangani unggahan dan parsing dokumen dengan aman, serta menjaga konsistensi status pesanan antara backend dan frontend.',
  'Pengalaman membangun REST API dengan Go, mengelola state aplikasi, dan mengintegrasikan layanan pembayaran pihak ketiga.',
  2026, 'Go', 'manual', 2, now()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'printku');

-- Link technologies to the seeded projects.
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id
FROM projects p
JOIN technologies t ON t.name IN ('React','TypeScript','Vite','Tailwind CSS','Hono','Supabase','JWT')
WHERE p.slug = 'ledgerflow'
ON CONFLICT DO NOTHING;

INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id
FROM projects p
JOIN technologies t ON t.name IN ('Go','SvelteKit','Redis','Docker Compose','SQLite','JWT','Midtrans','PostgreSQL')
WHERE p.slug = 'printku'
ON CONFLICT DO NOTHING;
