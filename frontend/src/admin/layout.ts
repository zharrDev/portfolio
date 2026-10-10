/**
 * Admin shell.
 *
 * This is a portfolio project, so the dashboard is intentionally accessible
 * without a login screen. The backend still exposes the same endpoints, and the
 * README documents how to put the admin behind authentication if it is ever
 * deployed publicly.
 */
import { el, qs, render } from '@/utils/dom';
import { icon, IconName } from '@/components/icons';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  match: (path: string) => boolean;
}

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/index.html', label: 'Dashboard', icon: 'layout-dashboard', match: (p) => p.endsWith('/admin/') || p.endsWith('/admin/index.html') },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/projects.html', label: 'Projects', icon: 'layers', match: (p) => p.includes('admin/projects') },
      { href: '/admin/profile.html', label: 'Profile', icon: 'user', match: (p) => p.includes('admin/profile') },
      { href: '/admin/skills.html', label: 'Skills', icon: 'database', match: (p) => p.includes('admin/skills') },
      { href: '/admin/education.html', label: 'Education', icon: 'graduation-cap', match: (p) => p.includes('admin/education') },
      { href: '/admin/experience.html', label: 'Experience', icon: 'briefcase', match: (p) => p.includes('admin/experience') },
      { href: '/admin/certificates.html', label: 'Certificates', icon: 'award', match: (p) => p.includes('admin/certificates') },
      { href: '/admin/social-links.html', label: 'Social links', icon: 'link-2', match: (p) => p.includes('admin/social-links') },
    ],
  },
  {
    label: 'Inbox',
    items: [{ href: '/admin/messages.html', label: 'Messages', icon: 'inbox', match: (p) => p.includes('admin/messages') }],
  },
  {
    label: 'System',
    items: [{ href: '/admin/settings.html', label: 'Settings', icon: 'settings', match: (p) => p.includes('admin/settings') }],
  },
];

export function renderSidebar(): HTMLElement {
  const path = window.location.pathname;
  const nav = el('nav', { class: 'admin__nav', 'aria-label': 'Navigasi admin' });

  for (const group of GROUPS) {
    nav.appendChild(el('div', { class: 'admin__nav-group' }, group.label));
    for (const item of group.items) {
      nav.appendChild(
        el(
          'a',
          { class: 'admin__nav-link', href: item.href, 'aria-current': item.match(path) ? 'page' : undefined },
          icon(item.icon, { size: 16 }),
          item.label,
        ),
      );
    }
  }

  return nav;
}

export interface AdminLayoutOptions {
  title: string;
  actions?: HTMLElement[];
}

/** Fills the shared admin shell markup that each admin HTML page provides. */
export function mountAdminLayout(options: AdminLayoutOptions): HTMLElement {
  const sidebar = qs('#admin-sidebar');
  const titleSlot = qs('#admin-title');
  const actionsSlot = qs('#admin-actions');
  const content = qs('#admin-content');

  if (sidebar) {
    render(
      sidebar,
      el(
        'a',
        { class: 'brand', href: '/index.html', 'aria-label': 'Kembali ke situs' },
        el('span', { class: 'brand__mark', 'aria-hidden': 'true' }, icon('terminal', { size: 16 })),
        el('span', {}, 'dzhar', el('span', { class: 'brand__dot' }, '.dev')),
      ),
      renderSidebar(),
      el(
        'div',
        { style: 'margin-top:auto' },
        el('hr', { class: 'divider' }),
        el('div', { class: 'footer-meta', style: 'margin-top: var(--sp-4)' }, 'Portfolio admin'),
        el('a', { class: 'btn btn--sm btn--ghost', href: '/index.html', style: 'margin-top: var(--sp-3)' }, '← Lihat situs'),
      ),
    );
  }

  if (titleSlot) titleSlot.textContent = options.title;
  if (actionsSlot && options.actions) render(actionsSlot, ...options.actions);

  if (!content) throw new Error('Admin page is missing #admin-content');
  return content;
}
