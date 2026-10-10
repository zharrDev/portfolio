/**
 * Shared domain types for Dzhar.dev.
 *
 * These mirror the JSON contract exposed by the Go backend (`/api/v1`).
 * See docs/api.md for the full endpoint reference.
 */

export interface Profile {
  id: number;
  full_name: string;
  nickname: string;
  brand: string;
  headline: string;
  subheadline: string | null;
  bio: string | null;
  about: string | null;
  avatar_url: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  university: string | null;
  major: string | null;
  previous_school: string | null;
  previous_major: string | null;
  current_focus: string | null;
  availability: string | null;
  updated_at: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string | null;
  major: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SkillCategory =
  | 'programming_languages'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'tools'
  | 'operating_systems'
  | 'other';

export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'completed' | 'in_progress' | 'prototype' | 'archived' | 'planned';

export interface ProjectImage {
  id: number;
  project_id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export interface Technology {
  id: number;
  name: string;
  projects_count?: number;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  description: string | null;
  category: string | null;
  repository_url: string | null;
  live_demo_url: string | null;
  readme_url: string | null;
  cover_image: string | null;
  status: ProjectStatus;
  is_featured: boolean;
  published: boolean;
  problem: string | null;
  goals: string | null;
  main_features: string | null;
  challenges: string | null;
  learnings: string | null;
  architecture: string | null;
  year: number | null;
  language: string | null;
  stars: number | null;
  forks: number | null;
  github_updated_at: string | null;
  source: 'manual' | 'github';
  sort_order: number;
  technologies: Technology[];
  images: ProjectImage[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GithubRepo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string | null;
  pushed_at: string | null;
  archived: boolean;
  fork: boolean;
  is_imported: boolean;
};

export interface Experience {
  id: number;
  organization: string;
  role: string;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: number;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  credential_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: number;
  label: string;
  url: string;
  icon: string | null;
  sort_order: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SiteSetting {
  id: number;
  key: string;
  value: string;
}

export interface DashboardStats {
  projects_total: number;
  projects_featured: number;
  projects_published: number;
  messages_total: number;
  messages_unread: number;
  skills_total: number;
  educations_total: number;
  certificates_total: number;
  experiences_total: number;
  github_repos_total: number;
  last_github_sync: string | null;
  recent_messages: ContactMessage[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

/* ------------------------------------------------------------------ */
/* API envelopes                                                       */
/* ------------------------------------------------------------------ */

export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
  message?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // honeypot — must stay empty
}

export interface LoginPayload {
  email: string;
  password: string;
}
