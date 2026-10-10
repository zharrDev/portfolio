import '@/styles';
import { el, onReady, qs } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';
import { emptyState, mountAsync, projectCardSkeleton, reveal } from '@/components/ui';
import { projectCard } from '@/components/project-card';
import { api } from '@/api/client';
import { skillCategoryLabel, SKILL_CATEGORY_ORDER } from '@/utils/format';
import { t } from '@/i18n';
import type { Education, Profile, Project, Skill } from '@/types';

function mountHero(): void {
  mountAsync<Profile>(
    qs('#hero-data') ?? document.body,
    () => api.getProfile().then((r) => r.data),
    (profile) => {
      const name = qs('#hero-name');
      if (name) name.textContent = `${profile.full_name} — ${profile.nickname}`;
      const lede = qs('#hero-lede');
      if (lede && profile.subheadline) lede.textContent = profile.subheadline;
      const university = qs('#hero-university');
      if (university && profile.university) university.textContent = profile.university;

      if (profile.availability) {
        const status = qs<HTMLElement>('#hero-status');
        if (status) {
          status.hidden = false;
          const text = qs('#hero-status-text');
          if (text) text.textContent = profile.availability;
        }
      }
      return el('span', { hidden: true });
    },
    { loading: () => el('span', { hidden: true }), error: () => el('span', { hidden: true }) },
  );
}

function mountAboutTeaser(): void {
  const host = qs('#about-teaser');
  if (!host) return;

  mountAsync<Profile>(
    host,
    () => api.getProfile().then((r) => r.data),
    (profile) => {
      if (!profile.about) {
        host.closest('section')?.setAttribute('hidden', 'true');
        return el('span', { hidden: true });
      }
      const paragraphs = profile.about.split('\n').filter(Boolean).slice(0, 2);
      return el('div', { class: 'prose', style: 'max-width:68ch' }, paragraphs.map((p) => el('p', {}, p)));
    },
    { loading: () => el('div', { class: 'skeleton', style: 'height:120px' }), error: () => el('span', { hidden: true }) },
  );
}

function mountSkills(): void {
  const host = qs('#skills-grid');
  if (!host) return;

  mountAsync<Skill[]>(
    host,
    () => api.getSkills().then((r) => r.data),
    (skills) => {
      if (skills.length === 0) {
        host.closest('section')?.setAttribute('hidden', 'true');
        return el('span', { hidden: true });
      }
      const grouped = SKILL_CATEGORY_ORDER.map((category) => ({
        category,
        items: skills.filter((s) => s.category === category).sort((a, b) => a.sort_order - b.sort_order),
      })).filter((group) => group.items.length > 0);

      return el(
        'div',
        { class: 'grid grid--3' },
        grouped.map((group, index) =>
          reveal(
            el(
              'div',
              { class: 'card' },
              el('h3', { class: 'skill-group__title' }, skillCategoryLabel(group.category)),
              el(
                'div',
                { class: 'skill-list' },
                group.items.map((s) =>
                  el(
                    'span',
                    { class: 'skill-chip', 'data-note': s.note ? 'true' : 'false', title: s.note ?? undefined },
                    el('span', { class: 'skill-chip__dot', 'aria-hidden': 'true' }),
                    s.name,
                  ),
                ),
              ),
            ),
            { delay: index * 40 },
          ),
        ),
      );
    },
    {
      loading: () =>
        el('div', { class: 'grid grid--3' }, [0, 1, 2, 3, 4, 5].map(() => el('div', { class: 'skeleton', style: 'height:110px' }))),
    },
  );
}

function mountFeaturedProjects(): void {
  const host = qs('#featured-projects');
  if (!host) return;

  mountAsync<Project[]>(
    host,
    () => api.getProjects({ featured: true, per_page: 3, sort: 'recent' }).then((r) => r.data),
    (projects) => {
      if (projects.length === 0) {
        return emptyState(t('home.emptyFeatured'), t('home.emptyFeaturedHint'));
      }
      const grid = el('div', { class: 'grid grid--3' });
      projects.forEach((project, index) => {
        const wrapper = el('div', { class: 'reveal', style: `transition-delay:${index * 60}ms` });
        wrapper.appendChild(projectCard(project));
        grid.appendChild(wrapper);
      });
      return grid;
    },
    { loading: () => el('div', { class: 'grid grid--3' }, [0, 1, 2].map(() => projectCardSkeleton())) },
  );
}

function mountEducation(): void {
  const host = qs('#education-timeline');
  if (!host) return;

  mountAsync<Education[]>(
    host,
    () => api.getEducation().then((r) => r.data),
    (educations) => {
      if (educations.length === 0) {
        host.closest('section')?.setAttribute('hidden', 'true');
        return el('span', { hidden: true });
      }
      return el(
        'div',
        { class: 'timeline stagger' },
        educations.map((edu, index) =>
          reveal(
            el(
              'div',
              { class: 'timeline__item', 'data-current': index === 0 ? 'true' : undefined },
              el('span', { class: 'timeline__marker', 'aria-hidden': 'true' }),
              el('div', { class: 'mono timeline__period' }, `${edu.start_year ?? '—'} — ${edu.end_year ?? t('common.present')}`),
              el('h3', { class: 'timeline__title' }, edu.institution),
              el('p', { class: 'timeline__sub' }, [edu.degree, edu.major].filter(Boolean).join(' · ') || '—'),
              edu.description ? el('p', { class: 'timeline__desc' }, edu.description) : null,
            ),
            { tag: 'div' },
          ),
        ),
      );
    },
    { loading: () => el('div', { class: 'stack stack-4' }, [0, 1].map(() => el('div', { class: 'skeleton', style: 'height:90px' }))) },
  );
}

onReady(() => {
  mountPublicLayout();
  mountHero();
  mountAboutTeaser();
  mountSkills();
  mountFeaturedProjects();
  mountEducation();
});
