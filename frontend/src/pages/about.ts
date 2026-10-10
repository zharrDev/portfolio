import '@/styles';
import { el, onReady, qs } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';
import { emptyState, mountAsync, tag } from '@/components/ui';
import { api } from '@/api/client';
import { formatMonthYear, isSafeUrl, skillCategoryLabel, SKILL_CATEGORY_ORDER } from '@/utils/format';
import type { Certificate, Education, Experience, Profile, Skill } from '@/types';

function mountPortrait(): void {
  const host = qs('#portrait');
  if (!host) return;
  void api
    .getProfile()
    .then(({ data }) => {
      if (!data.avatar_url || !isSafeUrl(data.avatar_url)) {
        host.insertBefore(
          el(
            'div',
            { class: 'portrait__placeholder' },
            el('span', { class: 'mono' }, 'Foto profil'),
            el('span', { style: 'font-size: var(--text-xs)' }, 'Dapat diunggah melalui dashboard admin'),
          ),
          host.firstChild,
        );
        return;
      }
      host.insertBefore(
        el('img', { src: data.avatar_url, alt: `Foto ${data.full_name}`, width: '480', height: '600' }),
        host.firstChild,
      );
    })
    .catch(() => {});
}

function mountFacts(): void {
  const host = qs('#profile-facts');
  if (!host) return;

  mountAsync<Profile>(
    host,
    () => api.getProfile().then((r) => r.data),
    (profile) => {
      const rows: [string, string | null][] = [
        ['Nama', profile.full_name],
        ['Panggilan', profile.nickname],
        ['Pendidikan', [profile.university, profile.major].filter(Boolean).join(' · ') || null],
        ['Sebelumnya', [profile.previous_school, profile.previous_major].filter(Boolean).join(' · ') || null],
        ['Lokasi', profile.location],
        ['Fokus saat ini', profile.current_focus],
      ];
      return el(
        'dl',
        { class: 'about__aside-list' },
        rows
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => el('div', { class: 'fact-row' }, el('dt', {}, label), el('dd', {}, value))),
      );
    },
    { loading: () => el('div', { class: 'skeleton', style: 'height:180px' }) },
  );
}

function mountProse(): void {
  const host = qs('#about-prose');
  if (!host) return;

  mountAsync<Profile>(
    host,
    () => api.getProfile().then((r) => r.data),
    (profile) => {
      if (!profile.about) {
        return emptyState('Cerita profil belum diisi', 'Bagian ini dapat diisi melalui dashboard admin → Profile.');
      }
      return el(
        'div',
        { class: 'prose' },
        profile.about.split('\n').filter(Boolean).map((paragraph) => el('p', {}, paragraph)),
      );
    },
  );
}

function mountSkills(): void {
  const host = qs('#about-skills');
  if (!host) return;

  mountAsync<Skill[]>(
    host,
    () => api.getSkills().then((r) => r.data),
    (skills) => {
      if (skills.length === 0) {
        host.closest('section')?.setAttribute('hidden', 'true');
        return el('span', { hidden: true });
      }
      return el(
        'div',
        { class: 'stack stack-5' },
        SKILL_CATEGORY_ORDER.map((category) => {
          const items = skills.filter((s) => s.category === category);
          if (items.length === 0) return null;
          return el(
            'div',
            {},
            el('div', { class: 'mono text-dim', style: 'margin-bottom: var(--sp-3)' }, skillCategoryLabel(category)),
            el('div', { class: 'skill-list' }, items.map((s) => el('span', { class: 'skill-chip' }, s.name))),
          );
        }),
      );
    },
  );
}

function mountEducation(): void {
  const host = qs('#about-education');
  if (!host) return;

  mountAsync<Education[]>(
    host,
    () => api.getEducation().then((r) => r.data),
    (educations) => {
      if (educations.length === 0) return emptyState('Belum ada data pendidikan');
      return el(
        'div',
        { class: 'timeline' },
        educations.map((edu, index) =>
          el(
            'div',
            { class: 'timeline__item', 'data-current': index === 0 ? 'true' : undefined },
            el('span', { class: 'timeline__marker', 'aria-hidden': 'true' }),
            el('div', { class: 'mono timeline__period' }, `${edu.start_year ?? '—'} — ${edu.end_year ?? 'Sekarang'}`),
            el('h3', { class: 'timeline__title' }, edu.institution),
            el('p', { class: 'timeline__sub' }, [edu.degree, edu.major].filter(Boolean).join(' · ') || '—'),
            edu.description ? el('p', { class: 'timeline__desc' }, edu.description) : null,
          ),
        ),
      );
    },
  );
}

function mountExperience(): void {
  const host = qs('#about-experience');
  const section = qs('#experience-section');
  if (!host || !section) return;

  mountAsync<Experience[]>(
    host,
    () => api.getExperience().then((r) => r.data),
    (items) => {
      if (items.length === 0) {
        section.hidden = true; // hidden when empty, per spec
        return el('span', { hidden: true });
      }
      return el(
        'div',
        {},
        items.map((item) =>
          el(
            'div',
            { class: 'resume-item' },
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

function mountCertificates(): void {
  const host = qs('#about-certificates');
  const section = qs('#certificates-section');
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
        { class: 'grid grid--3' },
        items.map((cert) =>
          el(
            'div',
            { class: 'card' },
            el('div', { class: 'row', style: 'justify-content: space-between' }, el('span', { class: 'mono text-dim' }, cert.issued_date ? formatMonthYear(cert.issued_date) : '')),
            el('h3', { style: 'font-size: var(--text-lg); margin-top: var(--sp-3)' }, cert.name),
            cert.issuer ? el('p', { class: 'text-muted', style: 'font-size: var(--text-sm)' }, cert.issuer) : null,
            isSafeUrl(cert.credential_url)
              ? el(
                  'a',
                  { class: 'btn btn--link btn--sm', style: 'margin-top: var(--sp-3)', href: cert.credential_url as string, target: '_blank', rel: 'noopener noreferrer' },
                  'Lihat kredensial',
                )
              : null,
          ),
        ),
      );
    },
  );
}

function mountExtras(): void {
  const extra = qs('#about-extra-tags');
  if (!extra) return;
  extra.append(tag('Dzhar.dev', true), tag('Debian Linux'));
}

onReady(() => {
  mountPublicLayout();
  mountPortrait();
  mountFacts();
  mountProse();
  mountSkills();
  mountEducation();
  mountExperience();
  mountCertificates();
  mountExtras();
});
