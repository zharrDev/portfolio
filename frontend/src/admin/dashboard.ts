import '@/styles';
import { el, onReady, render } from '@/utils/dom';
import { button, emptyState, skeleton, toast } from '@/components/ui';
import { mountAdminLayout } from '@/admin/layout';
import { api, ApiError } from '@/api/client';
import { relativeTime } from '@/utils/format';
import type { DashboardStats } from '@/types';

function stat(value: string | number, label: string, accent = false): HTMLElement {
  return el(
    'div',
    { class: `stat${accent ? ' stat--accent' : ''}` },
    el('span', { class: 'stat__value' }, String(value)),
    el('span', { class: 'stat__label' }, label),
  );
}

onReady(() => {
  const syncButton = button('Sinkron GitHub', {
    variant: 'ghost',
    size: 'sm',
    icon: 'refresh-cw',
    onClick: () => {
      syncButton.disabled = true;
      api
        .syncGithub()
        .then(({ data }) => {
          toast('success', `Sinkronisasi selesai: ${data.imported} baru, ${data.updated} diperbarui.`);
          window.location.reload();
        })
        .catch((err: unknown) => {
          toast('error', err instanceof ApiError ? err.message : 'Gagal sinkronisasi GitHub.');
          syncButton.disabled = false;
        });
    },
  });

  const content = mountAdminLayout({ title: 'Dashboard', actions: [syncButton] });
  render(content, skeleton('240px'));

  api
    .dashboard()
    .then(({ data }) => draw(content, data))
    .catch((err: unknown) => {
      render(content, emptyState('Gagal memuat ringkasan', err instanceof Error ? err.message : 'Terjadi kesalahan.'));
    });
});

function draw(content: HTMLElement, data: DashboardStats): void {
  const messageList = el('div', { class: 'stack stack-4' });
  if (data.recent_messages.length === 0) {
    messageList.appendChild(emptyState('Belum ada pesan', 'Pesan dari formulir kontak akan muncul di sini.'));
  } else {
    for (const message of data.recent_messages) {
      messageList.appendChild(
        el(
          'div',
          { class: 'message-item', 'data-unread': String(!message.is_read) },
          el(
            'div',
            { class: 'message-item__head' },
            el('strong', {}, message.name),
            el('span', { class: 'mono text-dim' }, relativeTime(message.created_at)),
          ),
          el('div', { class: 'mono text-dim' }, message.subject),
          el('p', { class: 'message-item__body' }, `${message.message.slice(0, 180)}${message.message.length > 180 ? '…' : ''}`),
        ),
      );
    }
    messageList.appendChild(el('a', { class: 'btn btn--ghost btn--sm', href: '/admin/messages.html' }, 'Lihat semua pesan'));
  }

  render(
    content,
    el(
      'div',
      { class: 'stat-grid' },
      stat(data.projects_total, 'Total proyek', true),
      stat(data.projects_featured, 'Featured'),
      stat(data.projects_published, 'Terbit'),
      stat(data.messages_unread, 'Pesan belum dibaca'),
      stat(data.skills_total, 'Skills'),
      stat(data.educations_total, 'Pendidikan'),
      stat(data.certificates_total, 'Sertifikat'),
      stat(data.github_repos_total, 'Repo GitHub'),
    ),
    el(
      'div',
      { class: 'grid grid--2', style: 'margin-top: var(--sp-7)' },
      el(
        'section',
        {},
        el('h2', { class: 'mono', style: 'color: var(--accent); margin-bottom: var(--sp-4)' }, 'Pesan terbaru'),
        messageList,
      ),
      el(
        'section',
        { class: 'stack stack-5' },
        el(
          'div',
          { class: 'card stack stack-4' },
          el('h2', { class: 'mono', style: 'color: var(--accent)' }, 'Integrasi GitHub'),
          el(
            'p',
            { class: 'text-muted', style: 'font-size: var(--text-sm)' },
            'Sinkronisasi mengambil metadata repository publik akun GitHub yang dikonfigurasi di backend. Hasil disimpan di database sebagai fallback bila API tidak tersedia.',
          ),
          el('span', { class: 'mono text-dim', style: 'font-size: var(--text-xs)' }, `Sinkron terakhir: ${data.last_github_sync ? relativeTime(data.last_github_sync) : 'belum pernah'}`),
        ),
        el(
          'div',
          { class: 'card stack stack-3' },
          el('h2', { class: 'mono', style: 'color: var(--accent)' }, 'Aksi cepat'),
          el(
            'div',
            { class: 'row' },
            el('a', { class: 'btn btn--ghost btn--sm', href: '/admin/projects.html' }, 'Kelola proyek'),
            el('a', { class: 'btn btn--ghost btn--sm', href: '/admin/profile.html' }, 'Edit profil'),
            el('a', { class: 'btn btn--ghost btn--sm', href: '/admin/settings.html' }, 'Pengaturan situs'),
          ),
        ),
      ),
    ),
  );
}
