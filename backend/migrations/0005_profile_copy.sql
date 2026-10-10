-- ============================================================================
-- Dzhar.dev — profile copy refresh
--
-- Repositions the home hero lede, the About prose, the availability badge and
-- the current-focus line as a fresh-graduate introduction ("here is who I am,
-- what I build, and what I am looking for"), in both languages.
--
-- Runs once (recorded in schema_migrations). Edit the wording from the admin
-- dashboard afterwards if you prefer your own voice — this only sets the seed.
-- ============================================================================

UPDATE profiles SET
  headline = 'Backend & Web Developer · Accounting Graduate',
  headline_en = 'Backend & Web Developer · Accounting Graduate',

  subheadline = 'Lulusan Akuntansi yang menekuni pengembangan backend dan web. Terbiasa membangun aplikasi dengan Go, TypeScript, dan PostgreSQL — dan siap bekerja penuh waktu.',
  subheadline_en = 'An Accounting graduate focused on backend and web development. Comfortable building applications with Go, TypeScript and PostgreSQL — and ready for a full-time role.',

  about = 'Saya lulusan Akuntansi yang menekuni pengembangan software, khususnya backend dan web. Saya belajar dengan membangun proyek nyata: menulis kode, membaca dokumentasi resmi, menguji hasilnya, lalu memperbaiki yang belum berjalan.'
          || E'\n' || 'Latar belakang akuntansi memberi saya pemahaman tentang alur data, proses bisnis, dan aturan pelaporan keuangan — semuanya berguna saat merancang perangkat lunak.'
          || E'\n' || 'Saat ini saya mencari peran pertama sebagai backend/web developer, sambil terus memperdalam Go, TypeScript, PostgreSQL, dan rekayasa data.',
  about_en = 'I am an Accounting graduate who focuses on software development, especially backend and web. I learn by building real projects: writing code, reading the official documentation, testing the result and fixing what does not work yet.'
             || E'\n' || 'My accounting background gives me an understanding of data flow, business processes and financial reporting rules — all of which are useful when designing software.'
             || E'\n' || 'I am now looking for my first role as a backend/web developer, while going deeper into Go, TypeScript, PostgreSQL and data engineering.',

  availability = 'Terbuka untuk peluang kerja',
  availability_en = 'Open to opportunities',

  current_focus = 'Backend Development, Web Development, Database, Peluang kerja pertama',
  current_focus_en = 'Backend Development, Web Development, Databases, First full-time role'
WHERE id = (SELECT MIN(id) FROM profiles);
