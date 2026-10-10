import '@/styles';
import { Child, el, onReady, qs, render } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';
import { emptyState, linkButton, openLightbox, skeleton, statusBadge, tag } from '@/components/ui';
import { api } from '@/api/client';
import { formatDate, initials, isSafeUrl, queryParam, relativeTime } from '@/utils/format';
import { t } from '@/i18n';
import type { Project } from '@/types';

function block(title: string, content: Child): HTMLElement | null {
  if (!content) return null;
  return el('section', { class: 'detail-block' }, el('h2', { class: 'detail-block__title' }, title), content);
}

function prose(text?: string | null): HTMLElement | null {
  if (!text) return null;
  return el(
    'div',
    { class: 'prose' },
    text.split('\n').filter(Boolean).map((paragraph) => el('p', {}, paragraph)),
  );
}

function bullets(text?: string | null): HTMLElement | null {
  if (!text) return null;
  const items = text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
  return el(
    'ul',
    { class: 'prose', style: 'gap: var(--sp-3)' },
    items.map((item) =>
      el(
        'li',
        { style: 'list-style:none; display:flex; gap: var(--sp-3)' },
        el('span', { style: 'color: var(--accent); font-family: var(--font-mono)' }, '→'),
        el('span', {}, item),
      ),
    ),
  );
}

function pager(all: Project[], current: Project): HTMLElement | null {
  const index = all.findIndex((p) => p.slug === current.slug);
  if (index === -1 || all.length < 2) return null;
  const prev = all[(index - 1 + all.length) % all.length];
  const next = all[(index + 1) % all.length];
  return el(
    'div',
    { class: 'container pager' },
    el(
      'a',
      { class: 'pager__link', href: `/project-detail.html?slug=${encodeURIComponent(prev.slug)}` },
      el('span', { class: 'mono text-dim' }, `← ${t('detail.prev')}`),
      el('span', { style: 'font-size: var(--text-lg)' }, prev.title),
    ),
    el(
      'a',
      { class: 'pager__link pager__link--next', href: `/project-detail.html?slug=${encodeURIComponent(next.slug)}` },
      el('span', { class: 'mono text-dim' }, `${t('detail.next')} →`),
      el('span', { style: 'font-size: var(--text-lg)' }, next.title),
    ),
  );
}

function renderDetail(project: Project, all: Project[]): void {
  const root = qs('#main');
  if (!root) return;

  const hasRepo = isSafeUrl(project.repository_url);
  const hasDemo = isSafeUrl(project.live_demo_url);
  const coverOk = Boolean(project.cover_image && isSafeUrl(project.cover_image));
  const galleryImages = project.images.filter((img) => isSafeUrl(img.image_url));

  const actions = el('div', { class: 'row' });
  if (hasRepo) actions.appendChild(linkButton(t('action.viewRepo'), project.repository_url as string, { variant: 'ghost', icon: 'github', external: true }));
  if (hasDemo) actions.appendChild(linkButton(t('action.viewDemo'), project.live_demo_url as string, { variant: 'primary', icon: 'external-link', external: true }));

  const meta = el(
    'dl',
    { class: 'detail-meta' },
    el('div', {}, el('dt', { class: 'hero__fact-label' }, t('detail.facts.language')), el('dd', { class: 'hero__fact-value' }, project.language ?? '—')),
    el('div', {}, el('dt', { class: 'hero__fact-label' }, t('detail.facts.status')), el('dd', { class: 'hero__fact-value' }, project.status)),
    el(
      'div',
      {},
      el('dt', { class: 'hero__fact-label' }, t('detail.facts.updated')),
      el('dd', { class: 'hero__fact-value' }, project.github_updated_at ? relativeTime(project.github_updated_at) : formatDate(project.updated_at)),
    ),
    typeof project.stars === 'number'
      ? el('div', {}, el('dt', { class: 'hero__fact-label' }, t('detail.facts.stars')), el('dd', { class: 'hero__fact-value' }, String(project.stars)))
      : null,
  );

  const main = el(
    'div',
    {},
    block(t('detail.summary'), prose(project.description || project.short_description)),
    block(t('detail.problem'), prose(project.problem)),
    block(t('detail.goals'), bullets(project.goals)),
    block(t('detail.features'), bullets(project.main_features)),
    block(t('detail.challenges'), prose(project.challenges)),
    block(t('detail.learnings'), prose(project.learnings)),
    block(t('detail.architecture'), prose(project.architecture)),
  );

  if (galleryImages.length > 0) {
    const gallery = el('div', { class: 'gallery' });
    galleryImages.forEach((image, index) => {
      gallery.appendChild(
        el(
          'button',
          {
            type: 'button',
            class: 'gallery__item',
            'aria-label': t('detail.zoomImage', { n: index + 1 }),
            onClick: () => openLightbox(galleryImages.map((g) => ({ url: g.image_url, caption: g.caption })), index),
          },
          el('img', { src: image.image_url, alt: image.caption || t('detail.screenshotAlt', { n: index + 1 }), loading: 'lazy', decoding: 'async' }),
        ),
      );
    });
    const galleryBlock = block(t('detail.gallery'), gallery);
    if (galleryBlock) main.appendChild(galleryBlock);
  }

  if (!project.description && !project.problem && !project.main_features) {
    main.appendChild(
      emptyState(t('detail.incomplete'), t('detail.incompleteHint')),
    );
  }

  const techList = el('div', { class: 'skill-list' });
  for (const tech of project.technologies) techList.appendChild(el('span', { class: 'skill-chip' }, tech.name));

  const aside = el(
    'aside',
    { class: 'detail-aside' },
    el(
      'div',
      { class: 'card' },
      el('h2', { class: 'mono', style: 'color: var(--accent); margin-bottom: var(--sp-4)' }, t('detail.techStack')),
      project.technologies.length > 0
        ? techList
        : el('p', { class: 'text-dim', style: 'font-size: var(--text-sm)' }, t('detail.noTech')),
    ),
    el(
      'div',
      { class: 'card stack stack-4' },
      el('h2', { class: 'mono', style: 'color: var(--accent)' }, t('detail.links')),
      hasRepo
        ? el('a', { class: 'row', href: project.repository_url as string, target: '_blank', rel: 'noopener noreferrer', style: 'font-size: var(--text-sm)' }, `${t('label.repository')} ↗`)
        : el('span', { class: 'text-dim', style: 'font-size: var(--text-sm)' }, t('detail.noRepo')),
      hasDemo
        ? el('a', { class: 'row', href: project.live_demo_url as string, target: '_blank', rel: 'noopener noreferrer', style: 'font-size: var(--text-sm)' }, `${t('label.liveDemo')} ↗`)
        : el('span', { class: 'text-dim', style: 'font-size: var(--text-sm)' }, t('detail.noDemo')),
      isSafeUrl(project.readme_url)
        ? el('a', { class: 'row', href: project.readme_url as string, target: '_blank', rel: 'noopener noreferrer', style: 'font-size: var(--text-sm)' }, 'README ↗')
        : null,
    ),
  );

  const badgeRow = el('div', { class: 'row', style: 'margin-bottom: var(--sp-4)' }, statusBadge(project.status));
  if (project.category) badgeRow.appendChild(tag(project.category));
  if (project.year) badgeRow.appendChild(tag(String(project.year)));

  const hero = el(
    'div',
    { class: 'container detail-hero' },
    linkButton(t('action.allProjects'), '/projects.html', { variant: 'ghost', size: 'sm', class: 'detail-back' }),
    el(
      'div',
      { class: 'row', style: 'justify-content: space-between; align-items: flex-start; gap: var(--sp-5)' },
      el(
        'div',
        {},
        badgeRow,
        el('h1', { class: 'page-head__title', style: 'max-width: 20ch' }, project.title),
        el('p', { class: 'page-head__lede' }, project.short_description),
      ),
      actions.childElementCount > 0 ? actions : null,
    ),
    el(
      'div',
      { class: 'detail-hero__cover' },
      coverOk
        ? el('img', { src: project.cover_image as string, alt: t('detail.coverAlt', { title: project.title }), width: '1280', height: '640' })
        : el('div', { class: 'detail-hero__placeholder', 'aria-hidden': 'true' }, initials(project.title)),
    ),
    meta,
  );

  const pagerNode = pager(all, project);

  render(
    root,
    el('div', { class: 'page' }, hero, el('div', { class: 'container detail-layout' }, main, aside), pagerNode),
  );

  document.title = `${project.title} — Dzhar.dev`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', project.short_description);
}

onReady(() => {
  mountPublicLayout();
  const root = qs('#main');
  const slug = queryParam('slug');

  if (!root) return;

  if (!slug) {
    render(
      root,
      el(
        'div',
        { class: 'container section' },
        emptyState(t('detail.noSlug'), t('detail.noSlugHint'), linkButton(t('action.allProjects'), '/projects.html', { variant: 'ghost' })),
      ),
    );
    return;
  }

  root.appendChild(el('div', { class: 'container detail-hero' }, skeleton('40px'), skeleton('90px'), skeleton('380px')));

  Promise.all([
    api.getProject(slug),
    api.getProjects({ per_page: 100, sort: 'recent' }),
  ])
    .then(([projectRes, listRes]) => {
      renderDetail(projectRes.data, listRes.data);
    })
    .catch((err: unknown) => {
      root.textContent = '';
      root.appendChild(
        el(
          'div',
          { class: 'container section' },
          emptyState(
            t('detail.notFound'),
            err instanceof Error ? err.message : t('detail.notFoundHint'),
            linkButton(t('action.allProjects'), '/projects.html', { variant: 'ghost' }),
          ),
        ),
      );
    });
});
