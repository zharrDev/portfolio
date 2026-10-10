/**
 * Public site chrome: header (with responsive nav) and footer.
 *
 * HTML pages provide `<div id="site-header"></div>` and
 * `<div id="site-footer"></div>` placeholders; `mountPublicLayout()` fills
 * them so the markup stays in HTML while the behaviour lives in TypeScript.
 */
import { el, qs } from '@/utils/dom';
import { icon } from '@/components/icons';
import { api } from '@/api/client';
import { isSafeUrl } from '@/utils/format';
import type { SocialLink } from '@/types';

export const GITHUB_URL = 'https://github.com/zharrDev';

interface NavItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/index.html', label: 'Home', match: (p) => p === '/' || p.endsWith('/index.html') },
  { href: '/projects.html', label: 'Projects', match: (p) => p.includes('project') },
  { href: '/about.html', label: 'About', match: (p) => p.includes('about') },
  { href: '/resume.html', label: 'Resume', match: (p) => p.includes('resume') },
  { href: '/contact.html', label: 'Contact', match: (p) => p.includes('contact') },
];

function isAdmin(): boolean {
  return window.location.pathname.includes('/admin/');
}

/** True when the link points at the current page (used for aria-current). */
function isCurrent(item: NavItem): boolean {
  const path = window.location.pathname;
  if (item.href.includes('index.html')) {
    return path === '/' || path.endsWith('/index.html') || path.endsWith('/');
  }
  if (item.href.includes('projects')) return path.includes('projects') || path.includes('project-detail');
  return path.includes(item.href.replace('/index.html', '').replace('.html', '').replace('/', ''));
}

export function renderHeader(): HTMLElement {
  const nav = el('nav', { class: 'site-nav', 'aria-label': 'Navigasi utama' });

  for (const item of NAV) {
    nav.appendChild(
      el('a', { class: 'site-nav__link', href: item.href, 'aria-current': isCurrent(item) ? 'page' : undefined }, item.label),
    );
  }

  nav.appendChild(
    el(
      'a',
      { class: 'site-nav__link row', href: GITHUB_URL, target: '_blank', rel: 'noopener noreferrer' },
      icon('github', { size: 16 }),
      'GitHub',
    ),
  );

  const toggle = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--icon btn--ghost nav-toggle',
      'aria-expanded': 'false',
      'aria-controls': 'primary-nav',
      'aria-label': 'Buka menu',
      onClick: () => {
        const open = nav.dataset.open !== 'true';
        nav.dataset.open = String(open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
        toggle.textContent = '';
        toggle.appendChild(icon(open ? 'x' : 'menu', { size: 20 }));
      },
    },
    icon('menu', { size: 20 }),
  );

  const header = el(
    'header',
    { class: 'site-header', id: 'site-header-bar' },
    el(
      'div',
      { class: 'container site-header__inner' },
      el(
        'a',
        { class: 'brand', href: '/index.html', 'aria-label': 'Dzhar.dev — beranda' },
        el(
          'span',
          { class: 'brand__mark', 'aria-hidden': 'true' },
          icon('terminal', { size: 16 }),
        ),
        el('span', {}, 'dzhar', el('span', { class: 'brand__dot' }, '.dev')),
      ),
      nav,
      toggle,
    ),
  );

  // Sticky-header visual state on scroll.
  const onScroll = () => header.setAttribute('data-scrolled', String(window.scrollY > 12));
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  return header;
}

export function renderFooter(): HTMLElement {
  const footer = el(
    'footer',
    { class: 'site-footer' },
    el(
      'div',
      { class: 'container site-footer__grid' },
      el(
        'div',
        { class: 'stack stack-4', style: 'max-width:34ch' },
        el(
          'a',
          { class: 'brand', href: '/index.html' },
          el('span', { class: 'brand__mark', 'aria-hidden': 'true' }, icon('terminal', { size: 16 })),
          el('span', {}, 'dzhar', el('span', { class: 'brand__dot' }, '.dev')),
        ),
        el('p', { class: 'text-muted', id: 'footer-tagline', style: 'font-size: var(--text-sm)' }, 'Building systems. Exploring ideas.'),
      ),
      el(
        'div',
        { class: 'stack stack-3' },
        el('span', { class: 'mono text-dim' }, 'Kontak'),
        el('div', { id: 'footer-contact' }),
      ),
      el(
        'div',
        { class: 'stack stack-3' },
        el('span', { class: 'mono text-dim' }, 'Tautan'),
        el(
          'a',
          { class: 'row', href: GITHUB_URL, target: '_blank', rel: 'noopener noreferrer', style: 'font-size: var(--text-sm)' },
          icon('github', { size: 16 }),
          'github.com/zharrDev',
        ),
        el('div', { id: 'footer-links' }),
      ),
    ),
    el(
      'div',
      { class: 'container', style: 'margin-top: var(--sp-7)' },
      el('hr', { class: 'divider' }),
      el(
        'div',
        { class: 'row', style: 'justify-content: space-between; margin-top: var(--sp-4)' },
        el('span', { class: 'footer-meta' }, `© ${new Date().getFullYear()} Dzhar.dev — Izhar Harahap`),
        el('span', { class: 'footer-meta' }, 'Go · TypeScript · PostgreSQL'),
      ),
    ),
  );

  // Hydrate async pieces without blocking paint.
  void api
    .getProfile()
    .then(({ data }) => {
      const tagline = qs('#footer-tagline', footer);
      if (tagline && data.subheadline) tagline.textContent = data.subheadline;

      const contact = qs('#footer-contact', footer);
      if (contact) {
        if (data.email) {
          contact.appendChild(
            el('a', { class: 'row', href: `mailto:${data.email}`, style: 'font-size: var(--text-sm)' }, icon('mail', { size: 16 }), data.email),
          );
        }
        if (data.location) {
          contact.appendChild(el('span', { class: 'text-muted', style: 'font-size: var(--text-sm)' }, data.location));
        }
        if (!data.email && !data.location) {
          contact.appendChild(el('span', { class: 'text-dim', style: 'font-size: var(--text-sm)' }, 'Kontak belum diatur'));
        }
      }
    })
    .catch(() => {});

  void api
    .getSocialLinks()
    .then(({ data }) => {
      const container = qs('#footer-links', footer);
      if (!container) return;
      for (const link of (data as SocialLink[]).filter((l) => isSafeUrl(l.url)).slice(0, 4)) {
        container.appendChild(
          el('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer', style: 'font-size: var(--text-sm)' }, link.label),
        );
      }
    })
    .catch(() => {});

  return footer;
}

/** Fills the header/footer placeholders present on every public page. */
export function mountPublicLayout(): void {
  if (isAdmin()) return;
  const headerSlot = qs('#site-header');
  const footerSlot = qs('#site-footer');
  if (headerSlot) headerSlot.appendChild(renderHeader());
  if (footerSlot) footerSlot.appendChild(renderFooter());
}
