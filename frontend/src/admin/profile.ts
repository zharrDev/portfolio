import '@/styles';
import { el, onReady, qs, render } from '@/utils/dom';
import { button, emptyState, skeleton, textAreaField, textField, toast } from '@/components/ui';
import { mountAdminLayout } from '@/admin/layout';
import { api, ApiError } from '@/api/client';
import type { Profile } from '@/types';

interface FieldSpec {
  name: keyof Profile;
  label: string;
  type?: 'text' | 'textarea' | 'url';
  hint?: string;
  full?: boolean;
}

const FIELDS: FieldSpec[] = [
  { name: 'full_name', label: 'Nama lengkap', hint: 'Contoh: Izhar Harahap' },
  { name: 'nickname', label: 'Nama panggilan' },
  { name: 'brand', label: 'Personal brand', hint: 'Contoh: Dzhar.dev' },
  { name: 'headline', label: 'Headline' },
  { name: 'subheadline', label: 'Subheadline', full: true },
  { name: 'email', label: 'Email publik' },
  { name: 'location', label: 'Lokasi' },
  { name: 'university', label: 'Universitas / kampus' },
  { name: 'major', label: 'Program studi' },
  { name: 'previous_school', label: 'Sekolah sebelumnya' },
  { name: 'previous_major', label: 'Jurusan sebelumnya' },
  { name: 'current_focus', label: 'Fokus saat ini' },
  { name: 'availability', label: 'Status / ketersediaan', hint: 'Contoh: Sedang membangun proyek' },
  { name: 'avatar_url', label: 'Avatar URL', type: 'url', full: true },
  { name: 'about', label: 'Tentang (satu paragraf per baris)', type: 'textarea', full: true },
];

onReady(() => {
  const saveButton = button('Simpan', { variant: 'primary', size: 'sm', icon: 'check', type: 'submit' });
  const content = mountAdminLayout({ title: 'Profile', actions: [saveButton] });

  render(content, skeleton('320px'));

  let controls: { spec: FieldSpec; wrapper: HTMLElement }[] = [];

  api
    .getAdminProfile()
    .then(({ data }) => {
      const profile = data;
      if (!profile) {
        render(content, emptyState('Profil belum tersedia', 'Pastikan migration dan seed sudah dijalankan.'));
        return;
      }

      controls = FIELDS.map((spec) => {
        const value = (profile[spec.name] as string | null) ?? '';
        const wrapper =
          spec.type === 'textarea'
            ? textAreaField({ label: spec.label, name: spec.name as string, value, hint: spec.hint, full: true })
            : textField({
                label: spec.label,
                name: spec.name as string,
                value,
                type: spec.type === 'url' ? 'url' : 'text',
                hint: spec.hint,
                full: spec.full,
              });
        return { spec, wrapper };
      });

      const grid = el('div', { class: 'editor__grid' }, controls.map(({ spec, wrapper }) => {
        const cell = el('div', { style: spec.full ? 'grid-column:1/-1' : undefined });
        cell.appendChild(wrapper);
        return cell;
      }));

      const form = el(
        'form',
        { class: 'editor' },
        el('p', { class: 'text-muted', style: 'font-size: var(--text-sm)' }, 'Data ini tampil pada halaman publik, CV, dan footer.'),
        grid,
        el(
          'div',
          { class: 'editor__actions' },
          el('button', { type: 'submit', class: 'btn btn--primary' }, 'Simpan perubahan'),
        ),
      );

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const payload: Record<string, string | null> = {};
        for (const { spec, wrapper } of controls) {
          const input = qs<HTMLInputElement | HTMLTextAreaElement>('input, textarea', wrapper);
          payload[spec.name as string] = input?.value.trim() ? input.value.trim() : null;
        }
        const submit = qs<HTMLButtonElement>('button[type="submit"]', form);
        if (submit) {
          submit.disabled = true;
          submit.textContent = 'Menyimpan…';
        }
        api
          .updateAdminProfile(payload)
          .then(() => {
            toast('success', 'Profil diperbarui.');
          })
          .catch((err: unknown) => {
            toast('error', err instanceof ApiError ? err.message : 'Gagal menyimpan profil.');
          })
          .finally(() => {
            if (submit) {
              submit.disabled = false;
              submit.textContent = 'Simpan perubahan';
            }
          });
      });

      render(content, form);
    })
    .catch((err: unknown) => {
      render(content, emptyState('Gagal memuat profil', err instanceof Error ? err.message : 'Terjadi kesalahan.'));
    });
});
