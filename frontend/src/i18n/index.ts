/**
 * Tiny i18n runtime — no framework, no build step, no runtime dependency.
 *
 * Indonesian is the source language. Every key must exist in both dictionaries;
 * `t()` falls back to Indonesian (then to the key itself) so a missing English
 * string degrades to readable text rather than an empty label.
 *
 * Switching locale persists the choice and reloads the page. That is a
 * deliberate trade: the site is a multi-page app whose views are assembled once
 * on load, so a reload guarantees that async content, document title and every
 * literal all change together. A partial in-place swap would risk a page that
 * is half one language and half the other.
 */
import { qs } from '@/utils/dom';

export type Locale = 'id' | 'en';
export type StringKey = keyof typeof id;

/** Locale display order and metadata. */
export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: 'id', label: 'Bahasa Indonesia', short: 'ID' },
  { code: 'en', label: 'English', short: 'EN' },
];

const STORAGE_KEY = 'dzhar.locale';
const FADE_KEY = 'dzhar.langFade';
const SCROLL_KEY = 'dzhar.langScroll';

const id = {
  /* --- chrome --- */
  'nav.home': 'Home',
  'nav.projects': 'Proyek',
  'nav.about': 'Tentang',
  'nav.resume': 'Résumé',
  'nav.contact': 'Kontak',
  'nav.github': 'GitHub',
  'nav.open': 'Buka menu',
  'nav.close': 'Tutup menu',
  'skip.link': 'Lompat ke konten utama',
  'footer.contact': 'Kontak',
  'footer.links': 'Tautan',
  'footer.tagline': 'Building systems. Exploring ideas.',
  'footer.notSet': 'Kontak belum diatur',
  'footer.note': 'Go · TypeScript · PostgreSQL',
  'footer.rights': '© {year} Dzhar.dev — Izhar Harahap',
  'lang.switch': 'Ganti bahasa',
  'lang.current': 'Bahasa saat ini',

  /* --- shared actions --- */
  'action.reload': 'Muat ulang',
  'action.back': 'Kembali',
  'action.allProjects': 'Semua proyek',
  'action.viewRepo': 'Lihat repo',
  'action.viewDemo': 'Buka demo',
  'action.printCv': 'Cetak / Simpan PDF',
  'action.downloadCv': 'Unduh CV',
  'action.downloadPdf': 'Unduh CV PDF',
  'action.showMore': 'Tampilkan ({count})',
  'action.hide': 'Sembunyikan',

  /* --- states --- */
  'state.loading': 'Memuat…',
  'state.loadFailed': 'Gagal memuat data',
  'state.empty': 'Belum ada data',
  'state.retry': 'Coba lagi',
  'state.error': 'Terjadi kesalahan.',
  'state.offline': 'Tidak dapat terhubung ke server.',
  'state.requestFailed': 'Permintaan gagal ({status})',
  'a11y.closeNotification': 'Tutup notifikasi',
  'lightbox.title': 'Pratinjau gambar',
  'time.justNow': 'baru saja',
  'time.minutesAgo': '{n} menit lalu',
  'time.hoursAgo': '{n} jam lalu',
  'time.daysAgo': '{n} hari lalu',
  'time.monthsAgo': '{n} bulan lalu',
  'time.yearsAgo': '{n} tahun lalu',

  /* --- home --- */
  'home.hero.title': 'Membangun sistem. <em>Menjelajahi ide.</em> Mengubah kode jadi solusi.',
  'home.hero.titleLead': 'Membangun sistem.',
  'home.hero.titleEm': 'Menjelajahi ide.',
  'home.hero.titleTail': 'Mengubah kode jadi solusi.',
  'home.hero.lede': 'Mahasiswa Akuntansi secara pendidikan, pengembang secara kegemaran. Saya membangun aplikasi web, backend, dan sistem data dengan Go, TypeScript, dan PostgreSQL.',
  'home.hero.ctaProjects': 'Lihat proyek',
  'home.hero.ctaResume': 'Baca CV',
  'home.hero.focus': 'Fokus',
  'home.hero.studying': 'Sedang studi',
  'home.hero.environment': 'Lingkungan',
  'home.hero.terminal': 'Sesi terminal menampilkan profil Dzhar',
  'home.about.eyebrow': '01 / Tentang',
  'home.about.title': 'Dari Akuntansi ke baris kode',
  'home.about.more': 'Selengkapnya',
  'home.skills.eyebrow': '02 / Keahlian',
  'home.skills.title': 'Teknologi yang saya gunakan',
  'home.skills.note': 'Dikelompokkan berdasarkan kategori — tanpa persentase yang dibuat-buat.',
  'home.projects.eyebrow': '03 / Proyek',
  'home.projects.title': 'Proyek pilihan',
  'home.projects.all': 'Semua proyek',
  'home.education.eyebrow': '04 / Pendidikan',
  'home.education.title': 'Latar belakang pendidikan',
  'home.cta.title': 'Punya pertanyaan atau ingin berkolaborasi?',
  'home.cta.body': 'Kirim pesan melalui formulir kontak — pesan tersimpan langsung di database.',
  'home.cta.button': 'Hubungi saya',
  'home.availability': 'Status',
  'home.aboutTitle': 'Tentang saya',
  'home.skillsTitle': 'Keahlian',
  'home.featuredTitle': 'Proyek unggulan',
  'home.educationTitle': 'Pendidikan',
  'home.emptyFeatured': 'Belum ada proyek unggulan',
  'home.emptyFeaturedHint': 'Proyek unggulan dapat dipilih melalui dashboard admin.',
  'home.emptyEducation': 'Belum ada data pendidikan',
  'home.emptyEducationHint': 'Tambahkan melalui dashboard admin.',
  'home.viewAllProjects': 'Lihat semua proyek',

  /* --- projects --- */
  'projects.title': 'Proyek',
  'projects.lede': 'Kurasi proyek nyata — dari akuntansi sampai infrastruktur cetak on-demand.',
  'projects.filterSearch': 'Cari proyek…',
  'projects.filterLanguage': 'Bahasa',
  'projects.filterAllLanguages': 'Semua bahasa',
  'projects.results': '{count} proyek',
  'projects.empty': 'Tidak ada proyek yang cocok',
  'projects.emptyHint': 'Coba ubah kata kunci atau hapus filter.',
  'projects.otherRepos': 'Repository lain dari GitHub',
  'projects.otherReposHint': 'Repository publik yang belum dikurasi sebagai proyek unggulan dapat ditampilkan di sini.',
  'projects.githubUnavailable': 'Data GitHub tidak tersedia',
  'projects.noOtherRepos': 'Tidak ada repository lain',
  'projects.noOtherReposHint': 'Semua repository publik sudah tampil di portfolio.',
  'projects.syncedViaAdmin': 'Sinkron via admin',
  'projects.cachedFromGithub': 'Diambil dari GitHub API dengan caching di backend',

  /* --- project detail --- */
  'detail.problem': 'Masalah yang diselesaikan',
  'detail.goals': 'Tujuan',
  'detail.features': 'Fitur utama',
  'detail.challenges': 'Tantangan',
  'detail.learnings': 'Pelajaran',
  'detail.architecture': 'Arsitektur',
  'detail.techStack': 'Teknologi',
  'detail.gallery': 'Galeri',
  'detail.notFound': 'Proyek tidak ditemukan',
  'detail.notFoundHint': 'Proyek ini mungkin belum dipublikasikan atau tautannya salah.',
  'detail.prev': 'Sebelumnya',
  'detail.next': 'Berikutnya',
  'detail.facts.year': 'Tahun',
  'detail.facts.language': 'Bahasa',
  'detail.facts.status': 'Status',
  'detail.facts.updated': 'Diperbarui',
  'detail.facts.stars': 'Stars',
  'lightbox.close': 'Tutup pratinjau',
  'lightbox.prev': 'Sebelumnya',
  'lightbox.next': 'Berikutnya',

  /* --- about --- */
  'about.title': 'Tentang',
  'about.lede': 'Cara saya belajar, bekerja, dan membangun.',
  'about.facts': 'Fakta singkat',
  'about.skills': 'Keahlian',
  'about.education': 'Pendidikan',
  'about.experience': 'Pengalaman',
  'about.certificates': 'Sertifikat & kursus',
  'about.learning': 'Cara saya belajar',
  'about.noExperience': 'Belum ada pengalaman yang dicatat',
  'about.noExperienceHint': 'Bagian ini muncul setelah diisi melalui dashboard admin.',
  'about.noCertificates': 'Belum ada sertifikat',
  'about.noCertificatesHint': 'Bagian ini muncul setelah diisi melalui dashboard admin.',

  /* --- resume --- */
  'resume.eyebrow': 'Curriculum Vitae',
  'resume.summary': 'Ringkasan',
  'resume.education': 'Pendidikan',
  'resume.experience': 'Pengalaman',
  'resume.skills': 'Keahlian',
  'resume.projects': 'Proyek pilihan',
  'resume.certificates': 'Sertifikat',
  'resume.pdfTitle': 'Butuh versi PDF?',
  'resume.pdfHint': 'Gunakan tombol cetak — dialog cetak browser memungkinkan menyimpan halaman sebagai PDF dengan stylesheet cetak khusus (layout rapi, tanpa navigasi).',
  'resume.noProjects': 'Belum ada proyek unggulan',

  /* --- contact --- */
  'contact.title': 'Kontak',
  'contact.lede': 'Punya ide, proyek, atau sekadar ingin menyapa? Kirim pesan.',
  'contact.info': 'Informasi',
  'contact.formTitle': 'Kirim pesan',
  'contact.name': 'Nama',
  'contact.email': 'Email',
  'contact.subject': 'Subjek',
  'contact.message': 'Pesan',
  'contact.namePlaceholder': 'Nama lengkap kamu',
  'contact.emailPlaceholder': 'nama@email.com',
  'contact.subjectPlaceholder': 'Topik pembicaraan',
  'contact.messagePlaceholder': 'Tulis pesanmu di sini…',
  'contact.send': 'Kirim pesan',
  'contact.sending': 'Mengirim…',
  'contact.sent': 'Pesan terkirim. Terima kasih!',
  'contact.failed': 'Pesan gagal dikirim. Coba lagi.',
  'contact.error.name': 'Nama wajib diisi.',
  'contact.error.email': 'Email wajib diisi.',
  'contact.error.emailInvalid': 'Format email tidak valid.',
  'contact.error.subject': 'Subjek wajib diisi.',
  'contact.error.message': 'Pesan wajib diisi.',
  'contact.error.messageShort': 'Pesan minimal 10 karakter.',
  'contact.emailLabel': 'Email',
  'contact.locationLabel': 'Lokasi',

  /* --- 404 --- */
  'notFound.title': 'Halaman tidak ditemukan',
  'notFound.hint': 'Alamat {path} tidak ada di situs ini.',
  'notFound.home': 'Kembali ke beranda',

  /* --- status labels --- */
  'status.completed': 'Selesai',
  'status.in_progress': 'Sedang dikerjakan',
  'status.prototype': 'Prototipe',
  'status.archived': 'Diarsipkan',
  'status.planned': 'Direncanakan',
  'source.github': 'GitHub',
  'source.manual': 'Manual',

  /* --- skill categories --- */
  'category.programming_languages': 'Bahasa Pemrograman',
  'category.frontend': 'Frontend',
  'category.backend': 'Backend',
  'category.database': 'Basis Data',
  'category.tools': 'Perkakas',
  'category.operating_systems': 'Sistem Operasi',
  'category.other': 'Lainnya',

  /* --- contact page --- */
  'contact.page.eyebrow': 'Kontak',
  'contact.page.title': 'Mari terhubung',
  'contact.page.lede': 'Punya pertanyaan, ide kolaborasi, atau ingin berdiskusi soal backend dan teknologi keuangan? Kirim pesan melalui formulir di samping.',
  'contact.page.how': 'Bagaimana pesan diproses',
  'contact.page.how1': 'Pesan divalidasi di frontend dan backend.',
  'contact.page.how2': 'Disimpan di PostgreSQL melalui REST API Go.',
  'contact.page.how3': 'Dilindungi honeypot dan rate limiting.',
  'contact.page.how4': 'Dibaca melalui dashboard admin.',

  /* --- projects page --- */
  'projects.page.eyebrow': 'Project showcase',
  'projects.page.title': 'Karya & eksperimen',
  'projects.page.lede': 'Setiap proyek di bawah dikurasi dari database portfolio dan dapat ditautkan ke repository GitHub-nya. Gunakan pencarian dan filter untuk menelusuri berdasarkan bahasa, kategori, atau status.',
  'projects.page.searchLabel': 'Cari proyek',
  'projects.page.searchPlaceholder': 'Nama, deskripsi, teknologi…',
  'projects.page.category': 'Kategori',
  'projects.page.status': 'Status',
  'projects.page.sort': 'Urutkan',
  'projects.page.all': 'Semua',
  'projects.page.sortRecent': 'Terbaru',
  'projects.page.sortOldest': 'Terlama',
  'projects.page.sortTitle': 'Judul (A–Z)',
  'projects.page.sortFeatured': 'Featured dulu',
  'projects.page.featuredOnly': 'Featured saja',

  /* --- about page --- */
  'about.page.eyebrow': 'Tentang',
  'about.page.lede': 'Saya percaya bahwa proses bisnis dan software saling melengkapi. Latar belakang Akuntansi membantu saya memahami alur data dan aturan bisnis; pemrograman memberi saya alat untuk membangunnya menjadi sistem yang nyata.',
  'about.page.skills': 'Keahlian & teknologi',
  'about.page.education': 'Pendidikan',
  'about.page.experience': 'Pengalaman',
  'about.page.certificates': 'Sertifikat',
  'about.page.learning': 'Cara saya belajar',
  'about.page.learningBody': 'Membangun proyek nyata, membaca dokumentasi resmi, dan memverifikasi hasilnya dengan pengujian — bukan sekadar mengikuti tutorial.',
  'about.page.viewCv': 'Lihat CV',

  /* --- resume page --- */
  'resume.page.summary': 'Ringkasan profesional',
  'resume.page.featuredProjects': 'Proyek pilihan',

  /* --- 404 page --- */
  'notFound.page.hint': 'Rute yang kamu tuju tidak ada, atau sudah dipindahkan. Kembali ke beranda atau telusuri proyek.',
  'notFound.page.home': 'Beranda',
  'notFound.page.projects': 'Lihat proyek',

  /* --- page titles (data-i18n-title on <title>) --- */
  'meta.title.home': 'Dzhar.dev — Izhar Harahap · Backend & Web Developer',
  'meta.title.projects': 'Proyek — Dzhar.dev',
  'meta.title.about': 'Tentang — Dzhar.dev',
  'meta.title.resume': 'Résumé — Dzhar.dev',
  'meta.title.contact': 'Kontak — Dzhar.dev',
  'meta.title.notFound': '404 — Halaman tidak ditemukan · Dzhar.dev',

  /* --- v2: chrome, cards, states, detail --- */
  'nav.primary': 'Navigasi utama',
  'brand.home': 'Dzhar.dev — beranda',
  'common.present': 'Sekarang',

  'action.show': 'Tampilkan',

  'card.source': 'Kode',
  'card.demo': 'Demo langsung',
  'card.featured': 'Unggulan',
  'card.coverAlt': 'Pratinjau {title}',
  'card.openDetail': 'Buka detail {title}',
  'card.stars': '{count} bintang',

  'label.repository': 'Repository',
  'label.liveDemo': 'Demo langsung',

  'projects.resultsFound': '{count} proyek ditemukan',
  'projects.emptyNone': 'Belum ada proyek',
  'projects.emptyNoneHint': 'Proyek dapat ditambahkan melalui dashboard admin atau disinkronkan dari GitHub.',
  'projects.reset': 'Reset filter',
  'projects.loadFailed': 'Gagal memuat proyek',
  'projects.reposEyebrow': 'Repositori publik',
  'projects.reposNote': 'Diambil dari GitHub API melalui backend, dengan caching dan fallback database.',
  'projects.noDescription': 'Tanpa deskripsi.',
  'projects.imported': 'Di portfolio',

  'about.fact.name': 'Nama',
  'about.fact.nickname': 'Panggilan',
  'about.fact.education': 'Pendidikan',
  'about.fact.previous': 'Sebelumnya',
  'about.fact.location': 'Lokasi',
  'about.fact.focus': 'Fokus saat ini',
  'about.photo': 'Foto profil',
  'about.photoHint': 'Dapat diunggah melalui dashboard admin',
  'about.noStory': 'Cerita profil belum diisi',
  'about.noStoryHint': 'Bagian ini dapat diisi melalui dashboard admin → Profile.',
  'about.viewCredential': 'Lihat kredensial',
  'about.empty.education': 'Belum ada data pendidikan',
  'about.page.titleLead': 'Mahasiswa Akuntansi secara pendidikan.',
  'about.page.titleTail': 'Developer karena kegemaran.',
  'about.page.card2Title': 'Akuntansi × Software',
  'about.page.card2Body': 'Jurnal, laporan keuangan, dan kontrol data memberi konteks nyata untuk merancang aplikasi yang benar secara aturan bisnis.',
  'about.page.card3Title': 'Fokus berikutnya',
  'about.page.card3Body': 'Backend engineering, database, dan financial technology — membangun sistem yang rapi, aman, dan mudah dirawat.',

  'resume.contact.email': 'Email',
  'resume.contact.location': 'Lokasi',
  'resume.empty.education': 'Belum ada data pendidikan',
  'resume.empty.skills': 'Belum ada data keahlian',
  'resume.empty.addViaAdmin': 'Tambahkan melalui dashboard admin.',
  'resume.repoLink': 'repo ↗',

  'contact.infoNotSet': 'Informasi kontak belum diatur.',
  'contact.rateLimited': 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
  'contact.privacyNote': 'Pesan disimpan di database. Tidak ada data yang dibagikan ke pihak ketiga.',
  'contact.error.nameShort': 'Nama minimal 2 karakter.',
  'contact.error.nameLong': 'Nama maksimal 100 karakter.',
  'contact.error.subjectLong': 'Subjek maksimal 150 karakter.',
  'contact.error.messageLong': 'Pesan maksimal 5000 karakter.',

  'detail.summary': 'Ringkasan',
  'detail.links': 'Tautan',
  'detail.noRepo': 'Repository tidak tersedia',
  'detail.noDemo': 'Demo langsung tidak tersedia',
  'detail.noTech': 'Belum ada teknologi tercatat.',
  'detail.incomplete': 'Detail proyek belum lengkap',
  'detail.incompleteHint': 'Cerita proyek dapat dilengkapi melalui dashboard admin.',
  'detail.noSlug': 'Proyek tidak ditentukan',
  'detail.noSlugHint': 'Buka sebuah proyek dari daftar proyek.',
  'detail.coverAlt': 'Sampul {title}',
  'detail.screenshotAlt': 'Tangkapan layar {n}',
  'detail.zoomImage': 'Perbesar gambar {n}',
  'lightbox.imageAlt': 'Pratinjau proyek',
} as const;

const en: Record<StringKey, string> = {
  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.about': 'About',
  'nav.resume': 'Resume',
  'nav.contact': 'Contact',
  'nav.github': 'GitHub',
  'nav.open': 'Open menu',
  'nav.close': 'Close menu',
  'skip.link': 'Skip to main content',
  'footer.contact': 'Contact',
  'footer.links': 'Links',
  'footer.tagline': 'Building systems. Exploring ideas.',
  'footer.notSet': 'Contact not set yet',
  'footer.note': 'Go · TypeScript · PostgreSQL',
  'footer.rights': '© {year} Dzhar.dev — Izhar Harahap',
  'lang.switch': 'Change language',
  'lang.current': 'Current language',

  'action.reload': 'Reload',
  'action.back': 'Back',
  'action.allProjects': 'All projects',
  'action.viewRepo': 'View repo',
  'action.viewDemo': 'Open demo',
  'action.printCv': 'Print / Save PDF',
  'action.downloadCv': 'Download CV',
  'action.downloadPdf': 'Download CV (PDF)',
  'action.showMore': 'Show ({count})',
  'action.hide': 'Hide',

  'state.loading': 'Loading…',
  'state.loadFailed': 'Failed to load data',
  'state.empty': 'No data yet',
  'state.retry': 'Try again',
  'state.error': 'Something went wrong.',
  'state.offline': 'Cannot reach the server.',
  'state.requestFailed': 'Request failed ({status})',
  'a11y.closeNotification': 'Dismiss notification',
  'lightbox.title': 'Image preview',
  'time.justNow': 'just now',
  'time.minutesAgo': '{n} minute(s) ago',
  'time.hoursAgo': '{n} hour(s) ago',
  'time.daysAgo': '{n} day(s) ago',
  'time.monthsAgo': '{n} month(s) ago',
  'time.yearsAgo': '{n} year(s) ago',

  'home.hero.title': 'Building systems. <em>Exploring ideas.</em> Turning code into solutions.',
  'home.hero.titleLead': 'Building systems.',
  'home.hero.titleEm': 'Exploring ideas.',
  'home.hero.titleTail': 'Turning code into solutions.',
  'home.hero.lede': 'An accounting student by education, a developer by passion. I build web applications, backends and data systems with Go, TypeScript and PostgreSQL.',
  'home.hero.ctaProjects': 'View projects',
  'home.hero.ctaResume': 'Read CV',
  'home.hero.focus': 'Focus',
  'home.hero.studying': 'Studying',
  'home.hero.environment': 'Environment',
  'home.hero.terminal': 'Terminal session showing the Dzhar profile',
  'home.about.eyebrow': '01 / About',
  'home.about.title': 'From Accounting to the first line of code',
  'home.about.more': 'Read more',
  'home.skills.eyebrow': '02 / Skills',
  'home.skills.title': 'Technologies I work with',
  'home.skills.note': 'Grouped by category — no made-up percentages.',
  'home.projects.eyebrow': '03 / Projects',
  'home.projects.title': 'Selected projects',
  'home.projects.all': 'All projects',
  'home.education.eyebrow': '04 / Education',
  'home.education.title': 'Education background',
  'home.cta.title': 'Got a question, or want to collaborate?',
  'home.cta.body': 'Send a message through the contact form — it is stored straight in the database.',
  'home.cta.button': 'Get in touch',
  'home.availability': 'Status',
  'home.aboutTitle': 'About me',
  'home.skillsTitle': 'Skills',
  'home.featuredTitle': 'Featured projects',
  'home.educationTitle': 'Education',
  'home.emptyFeatured': 'No featured projects yet',
  'home.emptyFeaturedHint': 'Featured projects can be picked from the admin dashboard.',
  'home.emptyEducation': 'No education entries yet',
  'home.emptyEducationHint': 'Add them from the admin dashboard.',
  'home.viewAllProjects': 'View all projects',

  'projects.title': 'Projects',
  'projects.lede': 'A curated selection of real work — from accounting to on-demand print infrastructure.',
  'projects.filterSearch': 'Search projects…',
  'projects.filterLanguage': 'Language',
  'projects.filterAllLanguages': 'All languages',
  'projects.results': '{count} projects',
  'projects.empty': 'No matching projects',
  'projects.emptyHint': 'Try a different keyword or clear the filters.',
  'projects.otherRepos': 'Other repositories from GitHub',
  'projects.otherReposHint': 'Public repositories that are not curated as featured projects can be listed here.',
  'projects.githubUnavailable': 'GitHub data is unavailable',
  'projects.noOtherRepos': 'No other repositories',
  'projects.noOtherReposHint': 'Every public repository already appears in the portfolio.',
  'projects.syncedViaAdmin': 'Synced via admin',
  'projects.cachedFromGithub': 'Fetched from the GitHub API, cached in the backend',

  'detail.problem': 'Problem it solves',
  'detail.goals': 'Goals',
  'detail.features': 'Key features',
  'detail.challenges': 'Challenges',
  'detail.learnings': 'Learnings',
  'detail.architecture': 'Architecture',
  'detail.techStack': 'Tech stack',
  'detail.gallery': 'Gallery',
  'detail.notFound': 'Project not found',
  'detail.notFoundHint': 'This project may be unpublished, or the link is wrong.',
  'detail.prev': 'Previous',
  'detail.next': 'Next',
  'detail.facts.year': 'Year',
  'detail.facts.language': 'Language',
  'detail.facts.status': 'Status',
  'detail.facts.updated': 'Updated',
  'detail.facts.stars': 'Stars',
  'lightbox.close': 'Close preview',
  'lightbox.prev': 'Previous',
  'lightbox.next': 'Next',

  'about.title': 'About',
  'about.lede': 'How I learn, work, and build.',
  'about.facts': 'Quick facts',
  'about.skills': 'Skills',
  'about.education': 'Education',
  'about.experience': 'Experience',
  'about.certificates': 'Certificates & courses',
  'about.learning': 'How I learn',
  'about.noExperience': 'No experience recorded yet',
  'about.noExperienceHint': 'This section appears once it is filled in from the admin dashboard.',
  'about.noCertificates': 'No certificates yet',
  'about.noCertificatesHint': 'This section appears once it is filled in from the admin dashboard.',

  'resume.eyebrow': 'Curriculum Vitae',
  'resume.summary': 'Summary',
  'resume.education': 'Education',
  'resume.experience': 'Experience',
  'resume.skills': 'Skills',
  'resume.projects': 'Selected projects',
  'resume.certificates': 'Certificates',
  'resume.pdfTitle': 'Need a PDF version?',
  'resume.pdfHint': 'Use the print button — the browser print dialog can save this page as a PDF with a dedicated print stylesheet (clean layout, no navigation).',
  'resume.noProjects': 'No featured projects yet',

  'contact.title': 'Contact',
  'contact.lede': 'Got an idea, a project, or just want to say hello? Send a message.',
  'contact.info': 'Information',
  'contact.formTitle': 'Send a message',
  'contact.name': 'Name',
  'contact.email': 'Email',
  'contact.subject': 'Subject',
  'contact.message': 'Message',
  'contact.namePlaceholder': 'Your full name',
  'contact.emailPlaceholder': 'name@example.com',
  'contact.subjectPlaceholder': "What's this about?",
  'contact.messagePlaceholder': 'Write your message here…',
  'contact.send': 'Send message',
  'contact.sending': 'Sending…',
  'contact.sent': 'Message sent. Thank you!',
  'contact.failed': 'Could not send the message. Please try again.',
  'contact.error.name': 'Name is required.',
  'contact.error.email': 'Email is required.',
  'contact.error.emailInvalid': 'That email address is not valid.',
  'contact.error.subject': 'Subject is required.',
  'contact.error.message': 'Message is required.',
  'contact.error.messageShort': 'Message must be at least 10 characters.',
  'contact.emailLabel': 'Email',
  'contact.locationLabel': 'Location',

  'notFound.title': 'Page not found',
  'notFound.hint': 'There is no page at {path} on this site.',
  'notFound.home': 'Back to home',

  'status.completed': 'Completed',
  'status.in_progress': 'In progress',
  'status.prototype': 'Prototype',
  'status.archived': 'Archived',
  'status.planned': 'Planned',
  'source.github': 'GitHub',
  'source.manual': 'Manual',

  'category.programming_languages': 'Programming Languages',
  'category.frontend': 'Frontend',
  'category.backend': 'Backend',
  'category.database': 'Databases',
  'category.tools': 'Tools',
  'category.operating_systems': 'Operating Systems',
  'category.other': 'Other',

  /* --- contact page --- */
  'contact.page.eyebrow': 'Contact',
  'contact.page.title': "Let's connect",
  'contact.page.lede': 'Got a question, an idea to collaborate on, or want to talk backend and financial technology? Send a message through the form.',
  'contact.page.how': 'How messages are handled',
  'contact.page.how1': 'Messages are validated on both the frontend and the backend.',
  'contact.page.how2': 'Stored in PostgreSQL through a Go REST API.',
  'contact.page.how3': 'Protected by a honeypot and rate limiting.',
  'contact.page.how4': 'Read through the admin dashboard.',

  /* --- projects page --- */
  'projects.page.eyebrow': 'Project showcase',
  'projects.page.title': 'Work & experiments',
  'projects.page.lede': 'Every project below is curated from the portfolio database and links to its GitHub repository. Use the search and filters to browse by language, category or status.',
  'projects.page.searchLabel': 'Search projects',
  'projects.page.searchPlaceholder': 'Name, description, technology…',
  'projects.page.category': 'Category',
  'projects.page.status': 'Status',
  'projects.page.sort': 'Sort',
  'projects.page.all': 'All',
  'projects.page.sortRecent': 'Newest',
  'projects.page.sortOldest': 'Oldest',
  'projects.page.sortTitle': 'Title (A–Z)',
  'projects.page.sortFeatured': 'Featured first',
  'projects.page.featuredOnly': 'Featured only',

  /* --- about page --- */
  'about.page.eyebrow': 'About',
  'about.page.lede': 'I believe business processes and software complement each other. An Accounting background helps me understand data flow and business rules; programming gives me the tools to turn that into working systems.',
  'about.page.skills': 'Skills & technologies',
  'about.page.education': 'Education',
  'about.page.experience': 'Experience',
  'about.page.certificates': 'Certificates',
  'about.page.learning': 'How I learn',
  'about.page.learningBody': 'Building real projects, reading the official documentation and verifying the result with tests — not just following tutorials.',
  'about.page.viewCv': 'View CV',

  /* --- resume page --- */
  'resume.page.summary': 'Professional summary',
  'resume.page.featuredProjects': 'Featured projects',

  /* --- 404 page --- */
  'notFound.page.hint': 'The route you followed does not exist, or it has moved. Head back home or browse the projects.',
  'notFound.page.home': 'Home',
  'notFound.page.projects': 'View projects',

  'meta.title.home': 'Dzhar.dev — Izhar Harahap · Backend & Web Developer',
  'meta.title.projects': 'Projects — Dzhar.dev',
  'meta.title.about': 'About — Dzhar.dev',
  'meta.title.resume': 'Resume — Dzhar.dev',
  'meta.title.contact': 'Contact — Dzhar.dev',
  'meta.title.notFound': '404 — Page not found · Dzhar.dev',

  'nav.primary': 'Primary navigation',
  'brand.home': 'Dzhar.dev — home',
  'common.present': 'Present',

  'action.show': 'Show',

  'card.source': 'Source',
  'card.demo': 'Live demo',
  'card.featured': 'Featured',
  'card.coverAlt': 'Preview of {title}',
  'card.openDetail': 'Open details for {title}',
  'card.stars': '{count} stars',

  'label.repository': 'Repository',
  'label.liveDemo': 'Live demo',

  'projects.resultsFound': '{count} projects found',
  'projects.emptyNone': 'No projects yet',
  'projects.emptyNoneHint': 'Projects can be added from the admin dashboard or synced from GitHub.',
  'projects.reset': 'Reset filters',
  'projects.loadFailed': 'Failed to load projects',
  'projects.reposEyebrow': 'Public repositories',
  'projects.reposNote': 'Fetched from the GitHub API through the backend, with caching and a database fallback.',
  'projects.noDescription': 'No description.',
  'projects.imported': 'In portfolio',

  'about.fact.name': 'Name',
  'about.fact.nickname': 'Goes by',
  'about.fact.education': 'Education',
  'about.fact.previous': 'Previously',
  'about.fact.location': 'Location',
  'about.fact.focus': 'Current focus',
  'about.photo': 'Profile photo',
  'about.photoHint': 'Can be uploaded from the admin dashboard',
  'about.noStory': 'The profile story has not been written yet',
  'about.noStoryHint': 'This section can be filled in from admin dashboard → Profile.',
  'about.viewCredential': 'View credential',
  'about.empty.education': 'No education entries yet',
  'about.page.titleLead': 'Accounting student by education.',
  'about.page.titleTail': 'Developer by passion.',
  'about.page.card2Title': 'Accounting × Software',
  'about.page.card2Body': 'Journals, financial statements and data controls give real context for designing applications that are correct by business rules.',
  'about.page.card3Title': 'Next focus',
  'about.page.card3Body': 'Backend engineering, databases and financial technology — building systems that are clean, safe and easy to maintain.',

  'resume.contact.email': 'Email',
  'resume.contact.location': 'Location',
  'resume.empty.education': 'No education entries yet',
  'resume.empty.skills': 'No skills recorded yet',
  'resume.empty.addViaAdmin': 'Add them from the admin dashboard.',
  'resume.repoLink': 'repo ↗',

  'contact.infoNotSet': 'Contact information is not set yet.',
  'contact.rateLimited': 'Too many attempts. Please try again in a moment.',
  'contact.privacyNote': 'Messages are stored in the database. No data is shared with third parties.',
  'contact.error.nameShort': 'Name must be at least 2 characters.',
  'contact.error.nameLong': 'Name must be at most 100 characters.',
  'contact.error.subjectLong': 'Subject must be at most 150 characters.',
  'contact.error.messageLong': 'Message must be at most 5000 characters.',

  'detail.summary': 'Summary',
  'detail.links': 'Links',
  'detail.noRepo': 'Repository unavailable',
  'detail.noDemo': 'Live demo unavailable',
  'detail.noTech': 'No technologies recorded yet.',
  'detail.incomplete': 'Project details are incomplete',
  'detail.incompleteHint': 'The project story can be completed from the admin dashboard.',
  'detail.noSlug': 'No project specified',
  'detail.noSlugHint': 'Open a project from the project list.',
  'detail.coverAlt': 'Cover {title}',
  'detail.screenshotAlt': 'Screenshot {n}',
  'detail.zoomImage': 'Zoom image {n}',
  'lightbox.imageAlt': 'Project preview',
};

const dictionaries: Record<Locale, Record<string, string>> = { id, en };

function readStored(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'id' || stored === 'en') return stored;
  } catch {
    // Storage can be blocked (private mode, disabled cookies). Fall through.
  }
  return 'id';
}

let current: Locale = readStored();

/** Returns the active locale. */
export function getLocale(): Locale {
  return current;
}

/** Returns the active locale as the value the API expects. */
export function localeParam(): Locale {
  return current;
}

/**
 * Translates `key`, substituting `{placeholders}` from `vars`.
 * Falls back to Indonesian, then to the key itself, so a gap is visible but
 * never renders an empty label.
 */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const raw = dictionaries[current][key] ?? dictionaries.id[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/**
 * Persists the choice and reloads so every view, literal and async field is
 * rebuilt in the new language. The fade is applied before navigating away so
 * the swap reads as a transition rather than a hard cut.
 */
export function setLocale(next: Locale): void {
  if (next === current) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Non-fatal: the page still reloads in the chosen language for this visit.
  }
  current = next;
  document.documentElement.lang = next;
  crossfadeReload();
}

/**
 * Fades the page out, flags the reload so the next paint fades back in, then
 * navigates. Honours reduced-motion preferences by skipping both fades.
 */
function crossfadeReload(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Remember where the reader is: a reload snaps to the top, which is jarring
  // when the switch happens in the middle of a long page. Restored in initI18n.
  try {
    window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  } catch {
    // Non-fatal: worst case the page reloads at the top.
  }

  if (reduced) {
    window.location.reload();
    return;
  }

  try {
    window.sessionStorage.setItem(FADE_KEY, '1');
  } catch {
    // Non-fatal: the swap still happens, just without the fade back in.
  }

  // A dedicated veil rather than animating `body`: it composites on its own
  // layer, so the fade never repaints the whole document frame by frame.
  const veil = document.createElement('div');
  veil.className = 'lang-veil';
  document.documentElement.appendChild(veil);
  window.requestAnimationFrame(() => veil.classList.add('is-on'));

  window.setTimeout(() => window.location.reload(), 220);
}

/** Applies the locale to the document once the DOM is ready. */
export function initI18n(): void {
  const root = document.documentElement;
  root.lang = current;

  // A pending fade-in / scroll restore from the language switch.
  let pendingFade = false;
  let restoreScroll = 0;
  try {
    pendingFade = window.sessionStorage.getItem(FADE_KEY) === '1';
    if (pendingFade) window.sessionStorage.removeItem(FADE_KEY);
    restoreScroll = Number(window.sessionStorage.getItem(SCROLL_KEY) ?? '0') || 0;
    if (restoreScroll) window.sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    pendingFade = false;
    restoreScroll = 0;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (restoreScroll > 0) {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const restore = () => window.scrollTo({ top: restoreScroll, behavior: 'auto' });
    // Once now, once after `load` — async sections grow the page in between.
    window.requestAnimationFrame(restore);
    window.addEventListener('load', restore, { once: true });
  }

  if (pendingFade && !reduced) {
    const veil = document.createElement('div');
    veil.className = 'lang-veil is-on';
    document.documentElement.appendChild(veil);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        veil.classList.remove('is-on');
        window.setTimeout(() => veil.remove(), 260);
      });
    });
  }

  const title = qs('title');
  if (title && title.dataset.i18nTitle) {
    document.title = t(title.dataset.i18nTitle as StringKey);
  }

  translateTree();
}

/**
 * Translates markup written directly in the HTML files.
 *
 * `data-i18n="key"` replaces the element's text; `data-i18n-attr` carries a
 * JSON map of attribute names to keys, for labels and placeholders. Keeping
 * the copy in the HTML means the page still renders something meaningful with
 * JavaScript disabled.
 *
 * Exported so content assembled *after* `initI18n()` — async sections, grids
 * rebuilt by filters, modals — can be translated too. Without this, any
 * `data-i18n` node created at runtime would keep showing its raw fallback text
 * in the wrong language. It is idempotent, so calling it again is safe.
 */
export function translateTree(root: ParentNode = document): void {
  for (const node of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(key as StringKey);
  }

  for (const node of root.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
    let spec: Record<string, string>;
    try {
      spec = JSON.parse(node.dataset.i18nAttr ?? '{}');
    } catch {
      continue;
    }
    for (const [attribute, key] of Object.entries(spec)) {
      node.setAttribute(attribute, t(key as StringKey));
    }
  }

  // A `<title data-i18n-title>` element carries a key in the attribute rather
  // than its text, so it needs its own pass.
  for (const node of root.querySelectorAll<HTMLTitleElement>('title[data-i18n-title]')) {
    const key = node.dataset.i18nTitle;
    if (key) node.textContent = t(key as StringKey);
  }
}
