import { el } from '@/utils/dom';
import { icon } from '@/components/icons';
import { statusBadge, tag } from '@/components/ui';
import { initials, isSafeUrl } from '@/utils/format';
import type { Project } from '@/types';

function cover(project: Project): HTMLElement {
  if (project.cover_image && isSafeUrl(project.cover_image)) {
    return el('img', {
      src: project.cover_image,
      alt: `Pratinjau ${project.title}`,
      loading: 'lazy',
      decoding: 'async',
      width: '640',
      height: '400',
    });
  }
  return el('div', { class: 'project-card__placeholder', 'aria-hidden': 'true' }, initials(project.title));
}

export function projectCard(project: Project): HTMLElement {
  const hasRepo = isSafeUrl(project.repository_url);
  const hasDemo = isSafeUrl(project.live_demo_url);

  const links = el('div', { class: 'project-card__links' });
  if (hasRepo) {
    links.appendChild(
      el(
        'a',
        { class: 'project-card__link', href: project.repository_url as string, target: '_blank', rel: 'noopener noreferrer' },
        icon('github', { size: 14 }),
        'Source',
      ),
    );
  }
  if (hasDemo) {
    links.appendChild(
      el(
        'a',
        { class: 'project-card__link', href: project.live_demo_url as string, target: '_blank', rel: 'noopener noreferrer' },
        icon('external-link', { size: 14 }),
        'Live demo',
      ),
    );
  }
  if (typeof project.stars === 'number' && project.stars > 0) {
    links.appendChild(
      el('span', { class: 'project-card__link', 'aria-label': `${project.stars} bintang` }, icon('star', { size: 14 }), String(project.stars)),
    );
  }

  const thumbMeta = el('div', { class: 'project-card__thumb-meta' });
  if (project.is_featured) thumbMeta.appendChild(tag('Featured', true));
  if (project.year) thumbMeta.appendChild(tag(String(project.year)));

  const tech = el('div', { class: 'project-card__tech' });
  for (const t of project.technologies.slice(0, 4)) tech.appendChild(tag(t.name));

  const detailHref = `/project-detail.html?slug=${encodeURIComponent(project.slug)}`;

  return el(
    'article',
    { class: 'project-card' },
    el(
      'a',
      { class: 'project-card__thumb', href: detailHref, 'aria-label': `Buka detail ${project.title}` },
      thumbMeta,
      cover(project),
    ),
    el(
      'div',
      { class: 'project-card__body' },
      el(
        'div',
        { class: 'row', style: 'justify-content: space-between' },
        statusBadge(project.status),
        project.language ? el('span', { class: 'mono text-dim' }, project.language) : null,
      ),
      el(
        'h3',
        { class: 'project-card__title' },
        el('a', { href: detailHref }, project.title),
        icon('arrow-up-right', { size: 18 }),
      ),
      el('p', { class: 'project-card__desc' }, project.short_description),
      tech.childElementCount > 0 ? tech : null,
      links.childElementCount > 0 ? links : null,
    ),
  );
}

/** Renders a responsive grid of project cards (or skeletons while loading). */
export function projectGrid(projects: Project[]): HTMLElement {
  const grid = el('div', { class: 'grid grid--3' });
  projects.forEach((project, index) => {
    const card = projectCard(project);
    const wrapper = el('div', {
      class: 'reveal',
      style: `transition-delay:${Math.min(index, 5) * 50}ms`,
    });
    wrapper.appendChild(card);
    grid.appendChild(wrapper);
  });
  return grid;
}
