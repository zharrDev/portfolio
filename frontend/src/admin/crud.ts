import { el, qs, render } from '@/utils/dom';
import { button, emptyState, skeleton, textAreaField, textField, toast } from '@/components/ui';
import { mountAdminLayout } from '@/admin/layout';
import {
  FormValues,
  RESOURCES,
  ResourceDef,
  Row,
  emptyValues,
  toFormValues,
  toPayload,
} from '@/admin/field-config';
import { api, ApiError } from '@/api/client';

interface FieldControl {
  wrapper: HTMLElement;
  read: () => string | boolean;
}

function buildField(resource: ResourceDef, name: string, values: FormValues): FieldControl {
  const field = resource.fields.find((f) => f.name === name);
  if (!field) throw new Error(`Unknown field ${name}`);
  const value = values[name];

  if (field.type === 'checkbox') {
    const input = el('input', { type: 'checkbox', checked: Boolean(value), id: `f-${name}` });
    const wrapper = el(
      'label',
      { class: 'switch', for: `f-${name}` },
      input,
      el('span', { class: 'switch__track', 'aria-hidden': 'true' }),
      field.label,
    );
    return { wrapper, read: () => input.checked };
  }

  if (field.type === 'select') {
    const select = el('select', { class: 'select', id: `f-${name}` });
    for (const choice of field.options ?? []) {
      select.appendChild(el('option', { value: choice.value, selected: choice.value === String(value ?? '') }, choice.label));
    }
    const wrapper = el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', for: `f-${name}` }, field.label),
      select,
      field.hint ? el('span', { class: 'field__hint' }, field.hint) : null,
    );
    return { wrapper, read: () => select.value };
  }

  if (field.type === 'textarea' || field.type === 'tags' || field.type === 'lines') {
    const wrapper = textAreaField({
      label: field.label,
      name,
      value: String(value ?? ''),
      placeholder: field.placeholder,
      hint: field.hint,
    });
    const textarea = qs<HTMLTextAreaElement>('textarea', wrapper);
    return { wrapper, read: () => textarea?.value ?? '' };
  }

  const wrapper = textField({
    label: field.label,
    name,
    type: field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text',
    value: String(value ?? ''),
    placeholder: field.placeholder,
    hint: field.hint,
    required: field.required,
  });
  const input = qs<HTMLInputElement>('input', wrapper);
  return { wrapper, read: () => input?.value ?? '' };
}

export function mountCrud(resourceKey: string): void {
  const resource = RESOURCES[resourceKey];
  if (!resource) throw new Error(`Unknown resource: ${resourceKey}`);

  const content = mountAdminLayout({
    title: resource.title,
    actions: [
      button('Muat ulang', { variant: 'ghost', size: 'sm', icon: 'refresh-cw', onClick: () => load() }),
      button(`Tambah ${resource.singular.toLowerCase()}`, {
        variant: 'primary',
        size: 'sm',
        icon: 'plus',
        onClick: () => openEditor(null),
      }),
    ],
  });

  render(content, el('div', { class: 'skeleton', style: 'height:240px' }));

  let rows: Row[] = [];
  let modal: HTMLElement | null = null;

  function load(): void {
    render(content, skeleton('240px'));
    api
      .list<Row>(resource.key, { per_page: 200 })
      .then(({ data }) => {
        rows = data;
        drawTable();
      })
      .catch((err: unknown) => {
        render(
          content,
          emptyState('Gagal memuat data', err instanceof Error ? err.message : 'Terjadi kesalahan.'),
        );
      });
  }

  function drawTable(): void {
    const toolbar = el(
      'p',
      { class: 'text-muted', style: 'font-size: var(--text-sm); margin-bottom: var(--sp-5)' },
      resource.description,
    );

    if (rows.length === 0) {
      render(
        content,
        toolbar,
        emptyState(
          `Belum ada ${resource.title.toLowerCase()}`,
          `Tambahkan ${resource.singular.toLowerCase()} pertama untuk mulai mengisi portfolio.`,
          button('Tambah', { variant: 'primary', size: 'sm', icon: 'plus', onClick: () => openEditor(null) }),
        ),
      );
      return;
    }

    const tbody = el('tbody');
    for (const row of rows) {
      const tr = el('tr');
      for (const column of resource.columns) {
        tr.appendChild(el('td', {}, column.format ? column.format(row) : String(row[column.key] ?? '—')));
      }

      const editButton = button('', { variant: 'ghost', size: 'sm', icon: 'pencil', ariaLabel: `Edit ${resource.singular}`, onClick: () => openEditor(row) });
      const deleteButton = button('', { variant: 'danger', size: 'sm', icon: 'trash', ariaLabel: `Hapus ${resource.singular}`, onClick: () => removeRow(row, deleteButton) });
      tr.appendChild(el('td', { class: 'actions' }, el('div', { class: 'row', style: 'flex-wrap:nowrap' }, editButton, deleteButton)));
      tbody.appendChild(tr);
    }

    const thead = el(
      'thead',
      {},
      el(
        'tr',
        {},
        resource.columns.map((c) => el('th', {}, c.label)),
        el('th', { style: 'width:1%' }, 'Aksi'),
      ),
    );

    render(
      content,
      toolbar,
      el('div', { class: 'table-wrap' }, el('div', { class: 'table-scroll' }, el('table', { class: 'data' }, thead, tbody))),
    );
  }

  function removeRow(row: Row, buttonEl: HTMLButtonElement): void {
    if (!window.confirm(`Hapus ${resource.singular.toLowerCase()} ini? Tindakan ini tidak dapat dibatalkan.`)) return;
    buttonEl.disabled = true;
    api
      .remove(resource.key, Number(row.id))
      .then(() => {
        toast('success', `${resource.singular} dihapus.`);
        load();
      })
      .catch((err: unknown) => {
        toast('error', err instanceof ApiError ? err.message : 'Gagal menghapus.');
        buttonEl.disabled = false;
      });
  }

  function openEditor(row: Row | null): void {
    const isEdit = Boolean(row && row.id);
    const values: FormValues = row ? toFormValues(resource, row) : emptyValues(resource);

    const controls = resource.fields.map((field) => ({ field, control: buildField(resource, field.name, values) }));

    const grid = el(
      'div',
      { class: 'editor__grid' },
      controls.map(({ field, control }) => {
        const cell = el('div', { style: field.full ? 'grid-column:1/-1' : undefined });
        cell.appendChild(control.wrapper);
        return cell;
      }),
    );

    const form = el('form', { class: 'modal__panel' });

    const close = () => {
      modal?.remove();
      modal = null;
      document.body.style.overflow = '';
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const next: FormValues = {};
      for (const { field, control } of controls) next[field.name] = control.read();
      const payload = toPayload(resource, next);

      const submitButton = qs<HTMLButtonElement>('button[type="submit"]', form);
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan…';
      }

      const action = isEdit
        ? api.update(resource.key, Number(row?.id), payload)
        : api.create(resource.key, payload);

      action
        .then(() => {
          toast('success', `${resource.singular} ${isEdit ? 'diperbarui' : 'ditambahkan'}.`);
          close();
          load();
        })
        .catch((err: unknown) => {
          const message =
            err instanceof ApiError && err.details
              ? Object.values(err.details)[0]
              : err instanceof ApiError
                ? err.message
                : 'Gagal menyimpan.';
          toast('error', message);
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = isEdit ? 'Simpan perubahan' : 'Tambah';
          }
        });
    });

    form.append(
      el(
        'div',
        { class: 'modal__head' },
        el('h2', { style: 'font-size: var(--text-xl)' }, isEdit ? `Edit ${resource.singular}` : `Tambah ${resource.singular}`),
        button('', { variant: 'ghost', icon: 'x', ariaLabel: 'Tutup', onClick: close }),
      ),
      grid,
      el(
        'div',
        { class: 'editor__actions', style: 'margin-top: var(--sp-6)' },
        button('Batal', { variant: 'ghost', onClick: close }),
        el('button', { type: 'submit', class: 'btn btn--primary' }, isEdit ? 'Simpan perubahan' : 'Tambah'),
      ),
    );

    modal = el('div', {
      class: 'modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `Form ${resource.singular}`,
      onClick: (event: Event) => {
        if (event.target === modal) close();
      },
    });
    modal.appendChild(form);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
  }

  load();
}
