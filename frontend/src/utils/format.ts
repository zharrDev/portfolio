const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.round(months / 12)} tahun lalu`;
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Selesai',
  in_progress: 'Sedang dikembangkan',
  prototype: 'Prototipe',
  archived: 'Diarsipkan',
  planned: 'Direncanakan',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export const SKILL_CATEGORY_LABEL: Record<string, string> = {
  programming_languages: 'Programming Languages',
  frontend: 'Frontend Development',
  backend: 'Backend Development',
  database: 'Database',
  tools: 'Developer Tools',
  operating_systems: 'Operating Systems',
  other: 'Other Technologies',
};

export const SKILL_CATEGORY_ORDER: string[] = [
  'programming_languages',
  'frontend',
  'backend',
  'database',
  'tools',
  'operating_systems',
  'other',
];

/** Only http(s) URLs are ever rendered as links / images. */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Reads a query-string parameter (used by the project detail page). */
export function queryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}
