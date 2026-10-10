/**
 * Declarative configuration for the admin CRUD screens.
 *
 * Describing the shape as data (rather than bespoke forms per resource) lets a
 * single generic editor render every resource while remaining fully typed.
 */
import { skillCategoryLabel, SKILL_CATEGORY_ORDER, statusLabel } from '@/utils/format';

export type FieldType = 'text' | 'textarea' | 'number' | 'url' | 'checkbox' | 'select' | 'tags' | 'lines' | 'date';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  full?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  format?: (row: Row) => string;
}

export type Row = Record<string, unknown>;

export interface ResourceDef {
  key: string;
  title: string;
  singular: string;
  description: string;
  columns: ColumnDef[];
  fields: FieldDef[];
}

const statusOptions = ['completed', 'in_progress', 'prototype', 'planned', 'archived'].map((s) => ({
  value: s,
  label: statusLabel(s),
}));

export const RESOURCES: Record<string, ResourceDef> = {
  projects: {
    key: 'projects',
    title: 'Projects',
    singular: 'Proyek',
    description: 'Kelola proyek portfolio: metadata, cerita, teknologi, dan tautan.',
    columns: [
      { key: 'title', label: 'Judul' },
      { key: 'slug', label: 'Slug' },
      { key: 'status', label: 'Status', format: (r) => statusLabel(String(r.status)) },
      { key: 'is_featured', label: 'Featured', format: (r) => (r.is_featured ? 'Ya' : '—') },
      { key: 'published', label: 'Publikasi', format: (r) => (r.published ? 'Terbit' : 'Draf') },
      { key: 'year', label: 'Tahun', format: (r) => String(r.year ?? '—') },
    ],
    fields: [
      { name: 'title', label: 'Judul', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, hint: 'URL-friendly, contoh: ledgerflow' },
      { name: 'short_description', label: 'Deskripsi singkat', type: 'text', required: true, full: true },
      { name: 'description', label: 'Deskripsi lengkap', type: 'textarea', full: true },
      { name: 'category', label: 'Kategori', type: 'text', placeholder: 'web, backend, akademik…' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
      { name: 'year', label: 'Tahun', type: 'number' },
      { name: 'language', label: 'Bahasa utama', type: 'text', placeholder: 'Go, TypeScript…' },
      { name: 'repository_url', label: 'Repository URL', type: 'url' },
      { name: 'live_demo_url', label: 'Live demo URL', type: 'url' },
      { name: 'readme_url', label: 'README URL', type: 'url' },
      { name: 'cover_image', label: 'Cover image URL', type: 'url', full: true },
      { name: 'problem', label: 'Masalah yang diselesaikan', type: 'textarea', full: true },
      { name: 'goals', label: 'Tujuan (satu per baris)', type: 'textarea', full: true },
      { name: 'main_features', label: 'Fitur utama (satu per baris)', type: 'textarea', full: true },
      { name: 'challenges', label: 'Tantangan teknis', type: 'textarea', full: true },
      { name: 'learnings', label: 'Pembelajaran', type: 'textarea', full: true },
      { name: 'architecture', label: 'Arsitektur', type: 'textarea', full: true },
      { name: 'technologies', label: 'Teknologi (pisahkan dengan koma)', type: 'tags', full: true, placeholder: 'Go, SvelteKit, PostgreSQL' },
      { name: 'images', label: 'Gallery (format: url | caption, satu per baris)', type: 'lines', full: true },
      { name: 'is_featured', label: 'Featured', type: 'checkbox' },
      { name: 'published', label: 'Terbitkan', type: 'checkbox' },
    ],
  },

  skills: {
    key: 'skills',
    title: 'Skills',
    singular: 'Skill',
    description: 'Daftar teknologi, dikelompokkan per kategori.',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'category', label: 'Kategori', format: (r) => skillCategoryLabel(String(r.category)) },
      { key: 'sort_order', label: 'Urutan' },
    ],
    fields: [
      { name: 'name', label: 'Nama', type: 'text', required: true },
      {
        name: 'category',
        label: 'Kategori',
        type: 'select',
        required: true,
        options: SKILL_CATEGORY_ORDER.map((c) => ({ value: c, label: skillCategoryLabel(c) })),
      },
      { name: 'note', label: 'Catatan (opsional)', type: 'text', full: true },
      { name: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },

  education: {
    key: 'education',
    title: 'Education',
    singular: 'Pendidikan',
    description: 'Riwayat pendidikan yang tampil di timeline.',
    columns: [
      { key: 'institution', label: 'Institusi' },
      { key: 'major', label: 'Jurusan' },
      { key: 'start_year', label: 'Mulai', format: (r) => String(r.start_year ?? '—') },
      { key: 'end_year', label: 'Selesai', format: (r) => String(r.end_year ?? 'Sekarang') },
    ],
    fields: [
      { name: 'institution', label: 'Institusi', type: 'text', required: true },
      { name: 'degree', label: 'Jenjang', type: 'text', placeholder: 'S1, SMK…' },
      { name: 'major', label: 'Jurusan', type: 'text' },
      { name: 'start_year', label: 'Tahun mulai', type: 'number' },
      { name: 'end_year', label: 'Tahun selesai', type: 'number', hint: 'Kosongkan jika masih berjalan' },
      { name: 'description', label: 'Deskripsi', type: 'textarea', full: true },
      { name: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },

  experience: {
    key: 'experience',
    title: 'Experience',
    singular: 'Pengalaman',
    description: 'Pengalaman kerja, organisasi, atau kegiatan. Tersembunyi di situs bila kosong.',
    columns: [
      { key: 'role', label: 'Peran' },
      { key: 'organization', label: 'Organisasi' },
      { key: 'start_date', label: 'Mulai' },
      { key: 'end_date', label: 'Selesai', format: (r) => (r.end_date ? String(r.end_date) : 'Sekarang') },
    ],
    fields: [
      { name: 'organization', label: 'Organisasi', type: 'text', required: true },
      { name: 'role', label: 'Peran / posisi', type: 'text', required: true },
      { name: 'type', label: 'Jenis', type: 'text', placeholder: 'full-time, internship, volunteer…' },
      { name: 'start_date', label: 'Mulai', type: 'date' },
      { name: 'end_date', label: 'Selesai', type: 'date', hint: 'Kosongkan jika masih berjalan' },
      { name: 'description', label: 'Deskripsi', type: 'textarea', full: true },
      { name: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },

  certificates: {
    key: 'certificates',
    title: 'Certificates',
    singular: 'Sertifikat',
    description: 'Sertifikat, kursus, dan pencapaian. Tersembunyi di situs bila kosong.',
    columns: [
      { key: 'name', label: 'Nama' },
      { key: 'issuer', label: 'Penerbit' },
      { key: 'issued_date', label: 'Tanggal' },
    ],
    fields: [
      { name: 'name', label: 'Nama sertifikat', type: 'text', required: true },
      { name: 'issuer', label: 'Penerbit', type: 'text' },
      { name: 'issued_date', label: 'Tanggal terbit', type: 'date' },
      { name: 'credential_url', label: 'URL kredensial', type: 'url', full: true },
      { name: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },

  'social-links': {
    key: 'social-links',
    title: 'Social links',
    singular: 'Tautan sosial',
    description: 'Tautan sosial yang tampil di footer.',
    columns: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'URL' },
      { key: 'sort_order', label: 'Urutan' },
    ],
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'url', required: true },
      { name: 'icon', label: 'Ikon (opsional)', type: 'text', placeholder: 'github, linkedin…' },
      { name: 'sort_order', label: 'Urutan', type: 'number' },
    ],
  },
};

export type FormValues = Record<string, string | boolean>;

/** Converts an API record into flat form values. */
export function toFormValues(resource: ResourceDef, record: Row): FormValues {
  const values: FormValues = {};
  for (const field of resource.fields) {
    const raw = record[field.name];
    switch (field.type) {
      case 'checkbox':
        values[field.name] = Boolean(raw);
        break;
      case 'tags':
        values[field.name] = Array.isArray(raw)
          ? (raw as (string | { name: string })[]).map((t) => (typeof t === 'string' ? t : t.name)).join(', ')
          : '';
        break;
      case 'lines':
        values[field.name] = Array.isArray(raw)
          ? (raw as { image_url: string; caption?: string | null }[])
              .map((img) => `${img.image_url}${img.caption ? ` | ${img.caption}` : ''}`)
              .join('\n')
          : '';
        break;
      default:
        values[field.name] = raw === null || raw === undefined ? '' : String(raw);
    }
  }
  return values;
}

/** Converts flat form values into the API payload. */
export function toPayload(resource: ResourceDef, values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of resource.fields) {
    const value = values[field.name];
    switch (field.type) {
      case 'checkbox':
        payload[field.name] = Boolean(value);
        break;
      case 'tags':
        payload[field.name] = String(value ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case 'lines':
        payload[field.name] = String(value ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [url, ...rest] = line.split('|');
            return { image_url: url.trim(), caption: rest.join('|').trim() || null };
          })
          .filter((img) => img.image_url.length > 0);
        break;
      case 'number':
        payload[field.name] = value === '' || value === undefined ? null : Number(value);
        break;
      default:
        payload[field.name] = value === '' ? null : value;
    }
  }
  return payload;
}

export function emptyValues(resource: ResourceDef): FormValues {
  const values: FormValues = {};
  for (const field of resource.fields) {
    values[field.name] = field.type === 'checkbox' ? false : '';
  }
  return values;
}
