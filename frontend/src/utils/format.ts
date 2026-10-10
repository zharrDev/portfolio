import { getLocale, t, type StringKey } from '@/i18n';

/** Calendar abbreviations per locale. */
const MONTHS: Record<string, string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function months(): string[] {
  return MONTHS[getLocale()] ?? MONTHS.id;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${months()[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${months()[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minutesAgo', { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t('time.hoursAgo', { n: hours });
  const days = Math.round(hours / 24);
  if (days < 30) return t('time.daysAgo', { n: days });
  const monthsAgo = Math.round(days / 30);
  if (monthsAgo < 12) return t('time.monthsAgo', { n: monthsAgo });
  return t('time.yearsAgo', { n: Math.round(monthsAgo / 12) });
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

const STATUS_KEY: Record<string, StringKey> = {
  completed: 'status.completed',
  in_progress: 'status.in_progress',
  prototype: 'status.prototype',
  archived: 'status.archived',
  planned: 'status.planned',
};

export function statusLabel(status: string): string {
  const key = STATUS_KEY[status];
  return key ? t(key) : status;
}

const CATEGORY_KEY: Record<string, StringKey> = {
  programming_languages: 'category.programming_languages',
  frontend: 'category.frontend',
  backend: 'category.backend',
  database: 'category.database',
  tools: 'category.tools',
  operating_systems: 'category.operating_systems',
  other: 'category.other',
};

/** Translated heading for a skill category, falling back to the raw value. */
export function skillCategoryLabel(category: string): string {
  const key = CATEGORY_KEY[category];
  return key ? t(key) : category;
}

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
