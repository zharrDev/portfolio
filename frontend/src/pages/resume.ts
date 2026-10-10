import '@/styles';
import { el, onReady, qs } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';
import { emptyState, mountAsync } from '@/components/ui';
import { api } from '@/api/client';
import { formatMonthYear, isSafeUrl, skillCategoryLabel, SKILL_CATEGORY_ORDER } from '@/utils/format';
import type { Certificate, Education, Experience, Profile, Project, Skill } from '@/types';

function wirePrint(): void {
  const handler = () => window.print();
  for (const id of ['#print-cv', '#download-cv', '#download-cv-2']) {
    qs(id)?.addEventListener('click', handler);
  }
}

function mountHeader(): void {
  void api
    .getProfile()
    .then(({ data }) => {
      const name = qs('#resume-name');
      if (name) name.textContent = data.full_name;
      const headline = qs('#resume-headline');
      if (headline && data.headline) headline.textContent = data.headline;

      const contact = qs('#resume-contact');
      if (!contact) return;
      if (data.email) contact.appendChild(el('span', { class: 'mono text-dim' }, `✉ ${data.email}`));
      if (data.location) contact.appendChild(el('span', { class: 'mono text-dim' }, `⌖ ${data.location}`));
      contact.appendChild(
        el(
          'a',
          { class: 'mono text-dim', href: 'https://github.com/zharrDev', target: '_blank', rel: 'noopener noreferrer' },
          'github.com/zharrDev',
        ),
      );
    })
    .catch(() => {});
}

function mountSummary(): void {
  const host = qs('#resume-summary');
  const section = qs('#resume-summary-section');
  if (!host || !section) return;

  mountAsync<Profile>(
    host,
    () => api.getProfile().then((r) => r.data),
    (profile) => {
      if (!profile.about) {
        section.hidden = true;
        return el('span', { hidden: true });
      }
      return el(
        'div',
        { class: 'prose' },
        profile.about.split('\n').filter(Boolean).map((p) => el('p', {}, p)),
      );
    },
  );
}

function mountEducation(): void {
  const host = qs('#resume-education');
  if (!host) return;

  mountAsync<Education[]>(
    host,
    () => api.getEducation().then((r) => r.data),
    (educations) => {
      if (educations.length === 0) return emptyState('Belum ada data pendidikan', 'Tambahkan melalui dashboard admin.');
      return el(
        'div',
        {},
        educations.map((edu) =>
          el(
            'div',
            { class: 'resume-item print-block' },
            el('div', { class: 'resume-item__period' }, `${edu.start_year ?? '—'} — ${edu.end_year ?? 'Sekarang'}`),
            el(
              'div',
              {},
              el('h3', { class: 'resume-item__title' }, edu.institution),
              el('p', { class: 'resume-item__sub' }, [edu.degree, edu.major].filter(Boolean).join(' · ') || '—'),
              edu.description ? el('p', { class: 'timeline__desc' }, edu.description) : null,
            ),
          ),
        ),
      );
    },
  );
}

function mountExperience(): void {
  const host = qs('#resume-experience');
  const section = qs('#resume-experience-section');
  if (!host || !section) return;

  mountAsync<Experience[]>(
    host,
    () => api.getExperience().then((r) => r.data),
    (items) => {
      if (items.length === 0) {
        section.hidden = true;
        return el('span', { hidden: true });
      }
      return el(
        'div',
        {},
        items.map((item) =>
          el(
            'div',
            { class: 'resume-item print-block' },
            el(
              'div',
              { class: 'resume-item__period' },
              `${item.start_date ? formatMonthYear(item.start_date) : '—'} — ${item.end_date ? formatMonthYear(item.end_date) : 'Sekarang'}`,
            ),
            el(
              'div',
              {},
              el('h3', { class: 'resume-item__title' }, item.role),
              el('p', { class: 'resume-item__sub' }, `${item.organization}${item.type ? ` · ${item.type}` : ''}`),
              item.description ? el('p', { class: 'timeline__desc' }, item.description) : null,
            ),
          ),
        ),
      );
    },
  );
}

function mountSkills(): void {
  const host = qs('#resume-skills');
  if (!host) return;

  mountAsync<Skill[]>(
    host,
    () => api.getSkills().then((r) => r.data),
    (skills) => {
      const groups = SKILL_CATEGORY_ORDER.map((category) => ({
        category,
        items: skills.filter((s) => s.category === category),
      })).filter((g) => g.items.length > 0);

      if (groups.length === 0) return emptyState('Belum ada data skill');
      return el(
        'div',
        { class: 'stack stack-5' },
        groups.map((group) =>
          el(
            'div',
            { class: 'print-block' },
            el('div', { class: 'mono text-dim', style: 'margin-bottom: var(--sp-3)' }, skillCategoryLabel(group.category)),
            el('div', { class: 'row', style: 'gap: var(--sp-2)' }, group.items.map((s) => el('span', { class: 'tag' }, s.name))),
          ),
        ),
      );
    },
  );
}

function mountProjects(): void {
  const host = qs('#resume-projects');
  if (!host) return;

  mountAsync<Project[]>(
    host,
    () => api.getProjects({ featured: true, per_page: 6, sort: 'recent' }).then((r) => r.data),
    (projects) => {
      if (projects.length === 0) return emptyState('Belum ada proyek unggulan');
      return el(
        'div',
        {},
        projects.map((project) =>
          el(
            'div',
            { class: 'resume-item print-block' },
            el('div', { class: 'resume-item__period' }, project.year ? String(project.year) : '—'),
            el(
              'div',
              {},
              el(
                'h3',
                { class: 'resume-item__title' },
                project.title,
                isSafeUrl(project.repository_url)
                  ? el(
                      'a',
                      { class: 'mono', style: 'color: var(--accent); font-size: var(--text-xs); margin-left: var(--sp-3)', href: project.repository_url as string, target: '_blank', rel: 'noopener noreferrer' },
                      'repo ↗',
                    )
                  : null,
              ),
              el('p', { class: 'resume-item__sub' }, project.short_description),
              project.technologies.length > 0
                ? el(
                    'p',
                    { class: 'mono text-dim', style: 'font-size: var(--text-xs); margin-top: var(--sp-2)' },
                    project.technologies.map((t) => t.name).join(' · '),
                  )
                : null,
            ),
          ),
        ),
      );
    },
  );
}

function mountCertificates(): void {
  const host = qs('#resume-certificates');
  const section = qs('#resume-certificates-section');
  if (!host || !section) return;

  mountAsync<Certificate[]>(
    host,
    () => api.getCertificates().then((r) => r.data),
    (items) => {
      if (items.length === 0) {
        section.hidden = true;
        return el('span', { hidden: true });
      }
      return el(
        'div',
        {},
        items.map((cert) =>
          el(
            'div',
            { class: 'resume-item print-block' },
            el('div', { class: 'resume-item__period' }, cert.issued_date ? formatMonthYear(cert.issued_date) : '—'),
            el(
              'div',
              {},
              el('h3', { class: 'resume-item__title' }, cert.name),
              cert.issuer ? el('p', { class: 'resume-item__sub' }, cert.issuer) : null,
            ),
          ),
        ),
      );
    },
  );
}

onReady(() => {
  mountPublicLayout();
  wirePrint();
  mountHeader();
  mountSummary();
  mountEducation();
  mountExperience();
  mountSkills();
  mountProjects();
  mountCertificates();
});
