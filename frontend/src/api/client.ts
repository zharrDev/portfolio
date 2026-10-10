/**
 * Thin, typed REST client built on the Fetch API.
 *
 * The portfolio admin is intentionally not behind a login screen, so there is
 * no CSRF/session handling here — only clean JSON request/response handling and
 * uniform error objects.
 */
import type {
  ApiErrorBody,
  ApiMeta,
  ApiSuccess,
  Certificate,
  ContactMessage,
  ContactPayload,
  DashboardStats,
  Education,
  Experience,
  GithubRepo,
  Profile,
  Project,
  SiteSetting,
  Skill,
  SocialLink,
} from '@/types';

import { localeParam } from '@/i18n';

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';
export const API_BASE = RAW_BASE.replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error?.message || `Request gagal (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.error?.code || 'unknown_error';
    this.details = body?.error?.details;
  }
}

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

function buildUrl(path: string, query?: Query): string {
  const url = API_BASE + path;
  const params = new URLSearchParams();

  // The active locale rides on every request so the backend can return the
  // translated columns. Admin endpoints ignore it and return both languages,
  // which is what the edit forms need.
  params.set('locale', localeParam());

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, {
      error: { code: 'network_error', message: 'Tidak dapat terhubung ke server.' },
    });
  }

  if (response.status === 204) return { data: undefined as T };

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) throw new ApiError(response.status, (payload as ApiErrorBody) ?? null);

  const envelope = payload as ApiSuccess<T> | null;
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return { data: envelope.data, meta: envelope.meta };
  }
  return { data: payload as T };
}

export const api = {
  /* -------------------- Public -------------------- */
  getProfile: () => request<Profile>('/profile'),
  getEducation: () => request<Education[]>('/education'),
  getSkills: () => request<Skill[]>('/skills'),
  getExperience: () => request<Experience[]>('/experience'),
  getCertificates: () => request<Certificate[]>('/certificates'),
  getSocialLinks: () => request<SocialLink[]>('/social-links'),
  getSettings: () => request<SiteSetting[]>('/settings'),

  getProjects: (query?: {
    search?: string;
    language?: string;
    category?: string;
    status?: string;
    featured?: boolean;
    sort?: string;
    page?: number;
    per_page?: number;
  }) => request<Project[]>('/projects', { query: query as Query }),

  getProject: (slug: string) => request<Project>(`/projects/${encodeURIComponent(slug)}`),
  getGithubRepos: () => request<GithubRepo[]>('/github/repositories'),
  sendContact: (payload: ContactPayload) =>
    request<{ id: number }>('/contact', { method: 'POST', body: payload }),

  /* -------------------- Admin -------------------- */
  dashboard: () => request<DashboardStats>('/admin/dashboard'),

  getAdminProfile: () => request<Profile>('/admin/profile'),
  updateAdminProfile: (payload: unknown) =>
    request<Profile>('/admin/profile', { method: 'PUT', body: payload }),

  list: <T>(resource: string, query?: Query) => request<T[]>(`/admin/${resource}`, { query }),
  create: <T>(resource: string, body: unknown) =>
    request<T>(`/admin/${resource}`, { method: 'POST', body }),
  update: <T>(resource: string, id: number, body: unknown) =>
    request<T>(`/admin/${resource}/${id}`, { method: 'PUT', body }),
  remove: (resource: string, id: number) =>
    request<null>(`/admin/${resource}/${id}`, { method: 'DELETE' }),

  listMessages: (query?: Query) => request<ContactMessage[]>('/admin/messages', { query }),
  updateMessage: (id: number, body: { is_read: boolean }) =>
    request<ContactMessage>(`/admin/messages/${id}`, { method: 'PATCH', body }),
  deleteMessage: (id: number) => request<null>(`/admin/messages/${id}`, { method: 'DELETE' }),

  syncGithub: () =>
    request<{ imported: number; updated: number; total: number }>('/admin/github/sync', { method: 'POST' }),
};
