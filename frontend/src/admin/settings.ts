import '@/styles';
import { el, onReady, render } from '@/utils/dom';
import { button, emptyState, skeleton, toast } from '@/components/ui';
import { mountAdminLayout } from '@/admin/layout';
import { api, ApiError } from '@/api/client';
import type { SiteSetting } from '@/types';

const LABELS: Record<string, string> = {
  site_title: 'Judul situs',
  site_description: 'Meta description',
  github_username: 'Username GitHub',
  contact_email: 'Email kontak',
  footer_note: 'Catatan footer',
};

onReady(() => {
  const content = mountAdminLayout({
    title: 'Settings',
    actions: [button('Muat ulang', { variant: 'ghost', size: 'sm', icon: 'refresh-cw', onClick: () => load() })],
  });

  render(content, skeleton('280px'));

  function load(): void {
    render(content, skeleton('280px'));
    api
      .getSettings()
      .then(({ data }) => draw(data))
      .catch((err: unknown) => {
        render(content, emptyState('Gagal memuat pengaturan', err instanceof Error ? err.message : 'Terjadi kesalahan.'));
      });
  }

  function draw(settings: SiteSetting[]): void {
    if (settings.length === 0) {
      render(content, emptyState('Belum ada pengaturan', 'Jalankan seed database untuk membuat pengaturan awal.'));
      return;
    }

    const inputs = new Map<string, HTMLInputElement>();

    const form = el(
      'form',
      { class: 'editor' },
      el(
        'p',
        { class: 'text-muted', style: 'font-size: var(--text-sm)' },
        'Pengaturan ini tersimpan di tabel site_settings dan dibaca oleh backend.',
      ),
      el(
        'div',
        { class: 'editor__grid' },
        settings.map((setting) => {
          const id = `setting-${setting.key}`;
          const input = el('input', { id, class: 'input', value: setting.value, type: 'text' });
          inputs.set(setting.key, input);
          return el(
            'div',
            { class: 'field' },
            el('label', { class: 'field__label', for: id }, LABELS[setting.key] ?? setting.key),
            input,
          );
        }),
      ),
      el('div', { class: 'editor__actions' }, el('button', { type: 'submit', class: 'btn btn--primary' }, 'Simpan pengaturan')),
    );

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Menyimpan…';
      }

      const updates = settings.map((setting) =>
        api.update<SiteSetting>('settings', setting.id, { value: inputs.get(setting.key)?.value ?? '' }),
      );

      Promise.all(updates)
        .then(() => toast('success', 'Pengaturan disimpan.'))
        .catch((err: unknown) => toast('error', err instanceof ApiError ? err.message : 'Gagal menyimpan pengaturan.'))
        .finally(() => {
          if (submit) {
            submit.disabled = false;
            submit.textContent = 'Simpan pengaturan';
          }
        });
    });

    render(content, form);
  }

  load();
});
