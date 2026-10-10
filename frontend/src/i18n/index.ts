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
  'a11y.closeNotification': 'Tutup notifikasi',
  'lightbox.title': 'Pratinjau gambar',
  'time.justNow': 'baru saja',
  'time.minutesAgo': '{n} menit lalu',
  'time.hoursAgo': '{n} jam lalu',
  'time.daysAgo': '{n} hari lalu',
  'time.monthsAgo': '{n} bulan lalu',
  'time.yearsAgo': '{n} tahun lalu',

  /* --- home --- */
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
  'a11y.closeNotification': 'Dismiss notification',
  'lightbox.title': 'Image preview',
  'time.justNow': 'just now',
  'time.minutesAgo': '{n} minute(s) ago',
  'time.hoursAgo': '{n} hour(s) ago',
  'time.daysAgo': '{n} day(s) ago',
  'time.monthsAgo': '{n} month(s) ago',
  'time.yearsAgo': '{n} year(s) ago',

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
  const root = document.documentElement;

  if (reduced) {
    window.location.reload();
    return;
  }

  try {
    window.sessionStorage.setItem(FADE_KEY, '1');
  } catch {
    // Non-fatal: the swap still happens, just without the fade back in.
  }

  // Start from the hidden state so the fade-out is actually animated.
  root.removeAttribute('data-lang-fade');
  void document.body.offsetHeight; // flush style so the next change transitions
  root.setAttribute('data-lang-fade', 'hidden');

  window.setTimeout(() => window.location.reload(), 180);
}

/** Applies the locale to the document once the DOM is ready. */
export function initI18n(): void {
  const root = document.documentElement;
  root.lang = current;

  // A pending fade-in from the language switch. Applied before paint so the
  // new language is revealed with a transition instead of popping in.
  let pendingFade = false;
  try {
    pendingFade = window.sessionStorage.getItem(FADE_KEY) === '1';
    if (pendingFade) window.sessionStorage.removeItem(FADE_KEY);
  } catch {
    pendingFade = false;
  }

  if (pendingFade && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.setAttribute('data-lang-fade', 'hidden');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.setAttribute('data-lang-fade', 'shown'));
    });
  }

  const title = qs('title');
  if (title && title.dataset.i18nTitle) {
    document.title = t(title.dataset.i18nTitle as StringKey);
  }

  applyStaticTranslations();
}

/**
 * Translates markup written directly in the HTML files.
 *
 * `data-i18n="key"` replaces the element's text; `data-i18n-attr` carries a
 * JSON map of attribute names to keys, for labels and placeholders. Keeping
 * the copy in the HTML means the page still renders something meaningful with
 * JavaScript disabled.
 */
function applyStaticTranslations(): void {
  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(key as StringKey);
  }

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
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
}
