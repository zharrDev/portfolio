import '@/styles';
import { el, onReady, render } from '@/utils/dom';
import { button, emptyState, skeleton, toast } from '@/components/ui';
import { mountAdminLayout } from '@/admin/layout';
import { api, ApiError } from '@/api/client';
import { formatDate, relativeTime } from '@/utils/format';
import type { ContactMessage } from '@/types';

onReady(() => {
  const content = mountAdminLayout({
    title: 'Messages',
    actions: [button('Muat ulang', { variant: 'ghost', size: 'sm', icon: 'refresh-cw', onClick: () => load() })],
  });

  render(content, skeleton('320px'));

  function load(): void {
    render(content, skeleton('320px'));
    api
      .listMessages({ per_page: 200 })
      .then(({ data }) => draw(data))
      .catch((err: unknown) => {
        render(content, emptyState('Gagal memuat pesan', err instanceof Error ? err.message : 'Terjadi kesalahan.'));
      });
  }

  function draw(messages: ContactMessage[]): void {
    if (messages.length === 0) {
      render(content, emptyState('Belum ada pesan', 'Pesan dari formulir kontak halaman publik akan muncul di sini.'));
      return;
    }

    const list = el('div', { class: 'stack stack-4' });
    for (const message of messages) {
      const readButton = button(message.is_read ? 'Tandai belum dibaca' : 'Tandai dibaca', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => {
          readButton.disabled = true;
          api
            .updateMessage(message.id, { is_read: !message.is_read })
            .then(() => load())
            .catch((err: unknown) => {
              toast('error', err instanceof ApiError ? err.message : 'Gagal memperbarui pesan.');
              readButton.disabled = false;
            });
        },
      });

      const deleteButton = button('Hapus', {
        variant: 'danger',
        size: 'sm',
        icon: 'trash',
        onClick: () => {
          if (!window.confirm('Hapus pesan ini?')) return;
          api
            .deleteMessage(message.id)
            .then(() => {
              toast('success', 'Pesan dihapus.');
              load();
            })
            .catch((err: unknown) => toast('error', err instanceof ApiError ? err.message : 'Gagal menghapus.'));
        },
      });

      list.appendChild(
        el(
          'article',
          { class: 'message-item', 'data-unread': String(!message.is_read) },
          el(
            'div',
            { class: 'message-item__head' },
            el('div', {}, el('strong', {}, message.name), el('span', { class: 'mono text-dim', style: 'margin-left: var(--sp-3)' }, message.email)),
            el('span', { class: 'mono text-dim', title: formatDate(message.created_at) }, relativeTime(message.created_at)),
          ),
          el('div', { class: 'mono text-dim' }, message.subject),
          el('p', { class: 'message-item__body' }, message.message),
          el('div', { class: 'row' }, readButton, el('a', { class: 'btn btn--ghost btn--sm', href: `mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}` }, 'Balas'), deleteButton),
        ),
      );
    }

    render(content, list);
  }

  load();
});
