import '@/styles';
import { el, onReady, qs } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';
import { emptyState, mountAsync, projectCardSkeleton, tag } from '@/components/ui';
import { projectCard } from '@/components/project-card';
import { api } from '@/api/client';
import { isSafeUrl, relativeTime } from '@/utils/format';
import { t } from '@/i18n';
import type { GithubRepo, Project } from '@/types';

interface FilterState {
  search: string;
  language: string;
  category: string;
  status: string;
  sort: string;
  featuredOnly: boolean;
}

const state: FilterState = {
  search: '',
  language: '',
  category: '',
  status: '',
  sort: 'recent',
  featuredOnly: false,
};

let allProjects: Project[] = [];

function sortProjects(list: Project[]): Project[] {
  const sorted = [...list];
  switch (state.sort) {
    case 'oldest':
      sorted.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'featured':
      sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
      break;
    default:
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }
  return sorted;
}

function applyFilters(): Project[] {
  const needle = state.search.trim().toLowerCase();
  const filtered = allProjects.filter((p) => {
    if (state.featuredOnly && !p.is_featured) return false;
    if (state.language && p.language !== state.language) return false;
    if (state.category && p.category !== state.category) return false;
    if (state.status && p.status !== state.status) return false;
    if (needle) {
      const haystack = `${p.title} ${p.short_description} ${p.technologies.map((t) => t.name).join(' ')}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
  return sortProjects(filtered);
}

function renderGrid(): void {
  const host = qs('#projects-grid');
  const count = qs('#results-count');
  const resetButton = qs<HTMLButtonElement>('#reset-filters');
  if (!host) return;

  const filtered = applyFilters();
  const hasFilters = Boolean(state.search || state.language || state.category || state.status || state.featuredOnly);

  if (count) count.textContent = t('projects.resultsFound', { count: filtered.length });
  if (resetButton) resetButton.hidden = !hasFilters;

  host.textContent = '';
  if (filtered.length === 0) {
    host.appendChild(
      emptyState(
        hasFilters ? t('projects.empty') : t('projects.emptyNone'),
        hasFilters ? t('projects.emptyHint') : t('projects.emptyNoneHint'),
      ),
    );
    return;
  }

  const grid = el('div', { class: 'grid grid--auto' });
  filtered.forEach((project, index) => {
    const wrapper = el('div', { class: 'reveal', style: `transition-delay:${Math.min(index, 5) * 50}ms` });
    wrapper.appendChild(projectCard(project));
    grid.appendChild(wrapper);
  });
  host.appendChild(grid);

  // Newly added reveal nodes need observing.
  import('@/utils/dom').then(({ observeReveals }) => observeReveals(host));
}

function populateFilters(): void {
  const languages = Array.from(new Set(allProjects.map((p) => p.language).filter(Boolean) as string[])).sort();
  const categories = Array.from(new Set(allProjects.map((p) => p.category).filter(Boolean) as string[])).sort();

  const languageSelect = qs<HTMLSelectElement>('#filter-language');
  const categorySelect = qs<HTMLSelectElement>('#filter-category');

  for (const value of languages) languageSelect?.appendChild(el('option', { value }, value));
  for (const value of categories) categorySelect?.appendChild(el('option', { value }, value));
}

function wireControls(): void {
  const search = qs<HTMLInputElement>('#project-search');
  const language = qs<HTMLSelectElement>('#filter-language');
  const category = qs<HTMLSelectElement>('#filter-category');
  const status = qs<HTMLSelectElement>('#filter-status');
  const sort = qs<HTMLSelectElement>('#filter-sort');
  const featured = qs<HTMLInputElement>('#filter-featured');
  const reset = qs<HTMLButtonElement>('#reset-filters');

  let debounce: ReturnType<typeof setTimeout> | undefined;
  search?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.search = search.value;
      renderGrid();
    }, 220);
  });
  language?.addEventListener('change', () => { state.language = language.value; renderGrid(); });
  category?.addEventListener('change', () => { state.category = category.value; renderGrid(); });
  status?.addEventListener('change', () => { state.status = status.value; renderGrid(); });
  sort?.addEventListener('change', () => { state.sort = sort.value; renderGrid(); });
  featured?.addEventListener('change', () => { state.featuredOnly = featured.checked; renderGrid(); });

  reset?.addEventListener('click', () => {
    state.search = '';
    state.language = '';
    state.category = '';
    state.status = '';
    state.featuredOnly = false;
    if (search) search.value = '';
    if (language) language.value = '';
    if (category) category.value = '';
    if (status) status.value = '';
    if (featured) featured.checked = false;
    renderGrid();
  });
}

function repoRow(repo: GithubRepo): HTMLElement {
  const topics = el('div', { class: 'chip-list', style: 'margin-top: var(--sp-3)' });
  for (const topic of repo.topics.slice(0, 5)) topics.appendChild(tag(topic));

  const links = el('div', { class: 'row', style: 'margin-top: var(--sp-4)' });
  links.appendChild(
    el('a', { class: 'btn btn--ghost btn--sm', href: repo.html_url, target: '_blank', rel: 'noopener noreferrer' }, t('label.repository')),
  );
  if (isSafeUrl(repo.homepage)) {
    links.appendChild(
      el('a', { class: 'btn btn--ghost btn--sm', href: repo.homepage as string, target: '_blank', rel: 'noopener noreferrer' }, t('label.liveDemo')),
    );
  }

  return el(
    'article',
    { class: 'card card--interactive' },
    el(
      'div',
      { class: 'row', style: 'justify-content: space-between; align-items: flex-start' },
      el('h3', { style: 'font-size: var(--text-lg)' }, el('a', { href: repo.html_url, target: '_blank', rel: 'noopener noreferrer' }, repo.name)),
      repo.language ? el('span', { class: 'mono text-dim' }, repo.language) : null,
    ),
    repo.description
      ? el('p', { class: 'text-muted', style: 'font-size: var(--text-sm); margin-top: var(--sp-3)' }, repo.description)
      : el('p', { class: 'text-dim', style: 'font-size: var(--text-sm); margin-top: var(--sp-3)' }, t('projects.noDescription')),
    repo.topics.length > 0 ? topics : null,
    el(
      'div',
      { class: 'row', style: 'margin-top: var(--sp-4); gap: var(--sp-5)' },
      el('span', { class: 'mono text-dim' }, `★ ${repo.stargazers_count}`),
      el('span', { class: 'mono text-dim' }, `⑂ ${repo.forks_count}`),
      el('span', { class: 'mono text-dim' }, repo.updated_at ? relativeTime(repo.updated_at) : '—'),
      repo.is_imported ? tag(t('projects.imported'), true) : null,
    ),
    links,
  );
}

function mountRepos(): void {
  const host = qs('#repos-host');
  const toggle = qs<HTMLButtonElement>('#toggle-repos');
  if (!host || !toggle) return;

  let loaded = false;

  toggle.addEventListener('click', () => {
    const show = host.hidden;
    host.hidden = !show;
    toggle.setAttribute('aria-expanded', String(show));
    toggle.textContent = show ? t('action.hide') : t('action.show');

    if (!show || loaded) return;
    loaded = true;

    mountAsync<GithubRepo[]>(
      host,
      () => api.getGithubRepos().then((r) => r.data),
      (repos) => {
        const others = repos.filter((r) => !r.is_imported);
        if (others.length === 0) {
          return emptyState(t('projects.noOtherRepos'), t('projects.noOtherReposHint'));
        }
        return el(
          'div',
          {},
          el(
            'p',
            { class: 'mono text-dim', style: 'margin-bottom: var(--sp-5)' },
            t('projects.reposNote'),
          ),
          el('div', { class: 'grid grid--2' }, others.map(repoRow)),
        );
      },
      {
        loading: () => el('div', { class: 'grid grid--2' }, [0, 1, 2, 3].map(() => el('div', { class: 'skeleton', style: 'height:180px' }))),
      },
    );
  });
}

onReady(() => {
  mountPublicLayout();
  wireControls();
  mountRepos();

  const host = qs('#projects-grid');
  if (host) {
    host.appendChild(el('div', { class: 'grid grid--auto' }, [0, 1, 2, 3].map(() => projectCardSkeleton())));
  }

  api
    .getProjects({ per_page: 100, sort: 'recent' })
    .then(({ data }) => {
      allProjects = data;
      populateFilters();
      renderGrid();
    })
    .catch((err: unknown) => {
      if (!host) return;
      host.textContent = '';
      host.appendChild(
        emptyState(t('projects.loadFailed'), err instanceof Error ? err.message : t('state.error')),
      );
      const count = qs('#results-count');
      if (count) count.textContent = t('projects.loadFailed');
    });
});
