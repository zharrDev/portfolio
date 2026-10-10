-- ============================================================================
-- Dzhar.dev — two more sample projects
--
-- The original seed only carried two projects, so the home "featured" grid
-- rendered a half-empty row. These two extra entries fill it out to a tidy
-- three-to-four card grid.
--
-- NOTE: these are DEMO placeholders so the layout can be seen. Edit or delete
-- them from the admin dashboard (Projects) before publishing — replace the copy
-- with real work.
--
-- Idempotent: each insert is guarded on its slug, so re-running is safe.
-- ============================================================================

INSERT INTO technologies (name)
SELECT DISTINCT name FROM (VALUES
  ('Gin'),('Chart.js'),('Nginx'),('GitHub Actions')
) AS seed(name)
ON CONFLICT (name) DO NOTHING;

-- --- Project 3: KasirKu (featured) -----------------------------------------
INSERT INTO projects (
  slug, title, title_en, short_description, short_description_en,
  description, description_en, category,
  repository_url, status, is_featured, published,
  problem, problem_en, goals, goals_en, main_features, main_features_en,
  challenges, challenges_en, learnings, learnings_en,
  year, language, source, sort_order, published_at
)
SELECT
  'kasirku',
  'KasirKu',
  'KasirKu',
  'Aplikasi kasir (point of sale) ringan untuk UMKM: transaksi, stok, dan laporan penjualan harian.',
  'A lightweight point-of-sale application for small businesses: transactions, stock and daily sales reports.',
  'KasirKu adalah aplikasi point of sale sederhana untuk warung dan toko kecil. Kasir dapat membuat transaksi dengan cepat, stok berkurang otomatis, dan pemilik melihat ringkasan penjualan harian tanpa perlu membuka spreadsheet.',
  'KasirKu is a simple point-of-sale application for small shops. Cashiers can create transactions quickly, stock is reduced automatically, and owners see a daily sales summary without opening a spreadsheet.',
  'web',
  'https://github.com/zharrDev/KasirKu',
  'in_progress', true, true,
  'Pencatatan penjualan dan stok secara manual rawan selisih dan menyulitkan pemilik memantau penjualan harian.',
  'Recording sales and stock by hand is error-prone and makes it hard for owners to track daily sales.',
  E'Mempercepat proses transaksi di kasir.\nMenjaga stok tetap akurat setelah setiap transaksi.\nMenyajikan ringkasan penjualan harian yang mudah dibaca.',
  E'Speed up the checkout process.\nKeep stock accurate after every transaction.\nPresent a daily sales summary that is easy to read.',
  E'Transaksi cepat dengan pencarian produk.\nPengurangan stok otomatis dalam satu transaksi database.\nRingkasan penjualan harian dan produk terlaris.\nManajemen produk dan kategori.',
  E'Fast checkout with product search.\nAutomatic stock deduction within a single database transaction.\nDaily sales summary and best-selling products.\nProduct and category management.',
  'Menjaga konsistensi stok saat beberapa transaksi terjadi bersamaan tanpa mengunci database terlalu lama.',
  'Keeping stock consistent when several transactions happen at once, without locking the database for too long.',
  'Praktik langsung penggunaan transaksi database dan pemodelan data untuk alur bisnis nyata.',
  'Hands-on practice with database transactions and data modelling for a real business flow.',
  2026, 'Go', 'manual', 3, now()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'kasirku');

-- --- Project 4: NotaKu ------------------------------------------------------
INSERT INTO projects (
  slug, title, title_en, short_description, short_description_en,
  description, description_en, category,
  repository_url, status, is_featured, published,
  problem, problem_en, goals, goals_en, main_features, main_features_en,
  challenges, challenges_en, learnings, learnings_en,
  year, language, source, sort_order, published_at
)
SELECT
  'notaku',
  'NotaKu',
  'NotaKu',
  'Pembuat nota dan invoice otomatis untuk UMKM, lengkap dengan ekspor PDF dan rekap pemasukan.',
  'An automatic receipt and invoice generator for small businesses, with PDF export and income recaps.',
  'NotaKu membantu usaha kecil membuat nota dan invoice yang rapi dalam hitungan detik. Data pelanggan disimpan, nomor nota berurutan otomatis, dan pemasukan direkap per bulan.',
  'NotaKu helps small businesses produce clean receipts and invoices in seconds. Customer data is stored, receipt numbers run in sequence automatically, and income is recapped per month.',
  'web',
  'https://github.com/zharrDev/NotaKu',
  'prototype', false, true,
  'Membuat nota manual memakan waktu dan mudah salah nomor maupun salah hitung.',
  'Writing receipts by hand is slow and prone to numbering and arithmetic mistakes.',
  E'Membuat nota rapi dalam hitungan detik.\nMenomori nota secara otomatis dan berurutan.\nMerekap pemasukan per bulan.',
  E'Produce a clean receipt in seconds.\nNumber receipts automatically and in sequence.\nRecap income per month.',
  E'Template nota dengan pratinjau langsung.\nNomor nota otomatis per tahun.\nEkspor PDF dan cetak.\nRekap pemasukan bulanan.',
  E'Receipt templates with live preview.\nAutomatic receipt numbers per year.\nPDF export and printing.\nMonthly income recap.',
  'Menghasilkan PDF yang konsisten lintas browser tanpa menambah dependensi berat di frontend.',
  'Producing consistent PDFs across browsers without adding a heavy frontend dependency.',
  'Belajar menyusun dokumen cetak yang rapi dan konsisten dari data terstruktur.',
  'Learning to lay out clean, consistent printable documents from structured data.',
  2026, 'TypeScript', 'manual', 4, now()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'notaku');

-- --- Link technologies ------------------------------------------------------
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id
FROM projects p
JOIN technologies t ON t.name IN ('Go','PostgreSQL','Gin','SQLite','Nginx')
WHERE p.slug = 'kasirku'
ON CONFLICT DO NOTHING;

INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id
FROM projects p
JOIN technologies t ON t.name IN ('TypeScript','Vite','PostgreSQL','Chart.js')
WHERE p.slug = 'notaku'
ON CONFLICT DO NOTHING;
