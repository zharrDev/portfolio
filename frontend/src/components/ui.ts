/**
 * Shared UI primitives.
 *
 * Every function returns a real DOM node built with the `el()` helper, so user
 * data is always inserted as text (never parsed as HTML).
 */
import { Child, append, el } from '@/utils/dom';
import { icon, IconName } from '@/components/icons';
import { statusLabel } from '@/utils/format';

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger' | 'link';

export function button(
  label: Child,
  options: {
    variant?: ButtonVariant;
    size?: 'md' | 'sm';
    icon?: IconName;
    type?: 'button' | 'submit';
    onClick?: (event: MouseEvent) => void;
    disabled?: boolean;
    class?: string;
    ariaLabel?: string;
  } = {},
): HTMLButtonElement {
  const classes = [
    'btn',
    options.variant && options.variant !== 'default' ? `btn--${options.variant}` : '',
    options.size === 'sm' ? 'btn--sm' : '',
    options.class ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return el(
    'button',
    {
      type: options.type ?? 'button',
      class: classes,
      onClick: options.onClick,
      disabled: options.disabled,
      'aria-label': options.ariaLabel,
    },
    options.icon ? icon(options.icon, { size: 15 }) : null,
    label,
  );
}

export function linkButton(
  label: Child,
  href: string,
  options: { variant?: ButtonVariant; size?: 'md' | 'sm'; icon?: IconName; external?: boolean; class?: string } = {},
): HTMLAnchorElement {
  const classes = [
    'btn',
    options.variant && options.variant !== 'default' ? `btn--${options.variant}` : '',
    options.size === 'sm' ? 'btn--sm' : '',
    options.class ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return el(
    'a',
    {
      class: classes,
      href,
      target: options.external ? '_blank' : undefined,
      rel: options.external ? 'noopener noreferrer' : undefined,
    },
    options.icon ? icon(options.icon, { size: 15 }) : null,
    label,
  );
}

/* ------------------------------------------------------------------ */
/* Text bits                                                           */
/* ------------------------------------------------------------------ */

export function tag(content: Child, accent = false): HTMLSpanElement {
  return el('span', { class: `tag${accent ? ' tag--accent' : ''}` }, content);
}

export function statusBadge(status: string): HTMLSpanElement {
  return el(
    'span',
    { class: `badge badge--${status}` },
    el('span', { class: 'badge__dot' }),
    statusLabel(status),
  );
}

export function mono(content: Child, className = ''): HTMLSpanElement {
  return el('span', { class: `mono ${className}`.trim() }, content);
}

/* ------------------------------------------------------------------ */
/* Placeholders                                                        */
/* ------------------------------------------------------------------ */

export function skeleton(height = '120px'): HTMLDivElement {
  return el('div', { class: 'skeleton', style: `height:${height}`, 'aria-hidden': 'true' });
}

export function projectCardSkeleton(): HTMLDivElement {
  return el(
    'div',
    { class: 'project-card', 'aria-hidden': 'true' },
    el('div', { class: 'skeleton skeleton--thumb' }),
    el(
      'div',
      { class: 'project-card__body' },
      el('div', { class: 'skeleton skeleton--line', style: 'width:55%' }),
      el('div', { class: 'skeleton skeleton--line', style: 'width:90%' }),
      el('div', { class: 'skeleton skeleton--line', style: 'width:70%' }),
    ),
  );
}

export function emptyState(title: string, hint?: string, action?: Child): HTMLDivElement {
  return el(
    'div',
    { class: 'empty-state' },
    icon('inbox', { size: 30 }),
    el('h3', { style: 'font-size: var(--text-lg)' }, title),
    hint ? el('p', { class: 'text-muted', style: 'font-size: var(--text-sm); max-width:42ch' }, hint) : null,
    action ?? null,
  );
}

export function notice(kind: 'success' | 'error' | 'info', content: Child): HTMLDivElement {
  return el(
    'div',
    { class: `notice notice--${kind}` },
    icon(kind === 'success' ? 'check' : 'alert-circle', { size: 18 }),
    el('span', {}, content),
  );
}

/* ------------------------------------------------------------------ */
/* Reveal wrapper                                                      */
/* ------------------------------------------------------------------ */

export function reveal(node: Child, options: { delay?: number; class?: string; tag?: string } = {}): HTMLElement {
  const wrapper = el((options.tag ?? 'div') as keyof HTMLElementTagNameMap, {
    class: `reveal${options.class ? ` ${options.class}` : ''}`,
    style: options.delay ? `transition-delay:${options.delay}ms` : undefined,
  });
  append(wrapper, node);
  return wrapper;
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

function toastRegion(): HTMLElement {
  let region = document.querySelector<HTMLElement>('.toast-region');
  if (!region) {
    region = el('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(region);
  }
  return region;
}

export function toast(kind: 'success' | 'error' | 'info', message: string): void {
  const region = toastRegion();
  const node = el(
    'div',
    { class: `notice notice--${kind}`, style: 'box-shadow: var(--shadow-md); background: var(--bg-elev-2)' },
    icon(kind === 'success' ? 'check' : 'alert-circle', { size: 18 }),
    el('span', { style: 'flex:1; color: var(--fg)' }, message),
    el(
      'button',
      {
        type: 'button',
        class: 'btn btn--icon btn--ghost btn--sm',
        'aria-label': 'Tutup notifikasi',
        onClick: () => node.remove(),
      },
      icon('x', { size: 15 }),
    ),
  );
  region.appendChild(node);
  setTimeout(() => node.remove(), 5200);
}

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

export interface FieldOptions {
  label: string;
  name?: string;
  value?: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  autoComplete?: string;
  full?: boolean;
}

/** Returns the field wrapper; the input is available via `querySelector('input,textarea,select')`. */
export function textField(options: FieldOptions): HTMLDivElement {
  const id = `field-${(options.name ?? options.label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const errorId = options.error ? `${id}-error` : undefined;

  return el(
    'div',
    { class: 'field', style: options.full ? 'grid-column:1/-1' : undefined },
    el('label', { class: 'field__label', for: id }, options.label),
    el('input', {
      id,
      name: options.name,
      class: 'input',
      type: options.type ?? 'text',
      value: options.value ?? '',
      placeholder: options.placeholder,
      required: options.required,
      autoComplete: options.autoComplete,
      'aria-invalid': options.error ? 'true' : undefined,
      'aria-describedby': errorId,
    }),
    options.error
      ? el('span', { class: 'field__error', id: errorId }, options.error)
      : options.hint
        ? el('span', { class: 'field__hint' }, options.hint)
        : null,
  );
}

export function textAreaField(options: FieldOptions & { rows?: number }): HTMLDivElement {
  const id = `field-${(options.name ?? options.label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return el(
    'div',
    { class: 'field', style: options.full ? 'grid-column:1/-1' : undefined },
    el('label', { class: 'field__label', for: id }, options.label),
    el('textarea', {
      id,
      name: options.name,
      class: 'textarea',
      placeholder: options.placeholder,
      rows: options.rows,
      value: options.value ?? '',
      'aria-invalid': options.error ? 'true' : undefined,
    }),
    options.error
      ? el('span', { class: 'field__error' }, options.error)
      : options.hint
        ? el('span', { class: 'field__hint' }, options.hint)
        : null,
  );
}

export function selectField(
  options: FieldOptions & { choices: { value: string; label: string }[] },
): HTMLDivElement {
  const id = `field-${(options.name ?? options.label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const select = el('select', { id, name: options.name, class: 'select' });
  for (const choice of options.choices) {
    select.appendChild(
      el('option', { value: choice.value, selected: choice.value === options.value }, choice.label),
    );
  }
  return el(
    'div',
    { class: 'field', style: options.full ? 'grid-column:1/-1' : undefined },
    el('label', { class: 'field__label', for: id }, options.label),
    select,
    options.hint ? el('span', { class: 'field__hint' }, options.hint) : null,
  );
}

export function checkboxField(label: string, checked = false, name?: string): HTMLLabelElement {
  return el(
    'label',
    { class: 'switch' },
    el('input', { type: 'checkbox', checked, name }),
    el('span', { class: 'switch__track', 'aria-hidden': 'true' }),
    label,
  );
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

export interface LightboxImage {
  url: string;
  caption?: string | null;
}

export function openLightbox(images: LightboxImage[], startIndex: number): void {
  let index = startIndex;

  const figure = el('figure', { class: 'lightbox__figure' });
  const overlay = el('div', {
    class: 'lightbox',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Pratinjau gambar',
  });

  const close = () => {
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  };

  const draw = () => {
    const current = images[index];
    figure.textContent = '';
    figure.appendChild(
      el('img', { class: 'lightbox__img', src: current.url, alt: current.caption || 'Pratinjau proyek' }),
    );
    if (current.caption) {
      figure.appendChild(el('figcaption', { class: 'lightbox__caption' }, current.caption));
    }
  };

  const goTo = (next: number) => {
    index = (next + images.length) % images.length;
    draw();
  };

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight') goTo(index + 1);
    if (event.key === 'ArrowLeft') goTo(index - 1);
  }

  overlay.appendChild(
    button('', { variant: 'ghost', class: 'lightbox__close', ariaLabel: 'Tutup pratinjau', icon: 'x', onClick: close }),
  );

  if (images.length > 1) {
    overlay.appendChild(
      button('', { variant: 'ghost', class: 'lightbox__nav lightbox__nav--prev', ariaLabel: 'Sebelumnya', icon: 'arrow-left', onClick: (e) => { e.stopPropagation(); goTo(index - 1); } }),
    );
    overlay.appendChild(
      button('', { variant: 'ghost', class: 'lightbox__nav lightbox__nav--next', ariaLabel: 'Berikutnya', icon: 'arrow-right', onClick: (e) => { e.stopPropagation(); goTo(index + 1); } }),
    );
  }

  figure.addEventListener('click', (e) => e.stopPropagation());
  overlay.appendChild(figure);
  overlay.addEventListener('click', close);

  draw();
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);
}

/* ------------------------------------------------------------------ */
/* Async section helper                                                */
/* ------------------------------------------------------------------ */

/**
 * Renders `loading` immediately, then swaps in the result of `loader`.
 * Keeps every page's data-fetching uniform and cancel-safe.
 */
export function asyncSection<T>(
  loader: () => Promise<T>,
  render: (data: T) => Child,
  options: { loading?: () => Child; error?: (message: string) => Child } = {},
): HTMLElement {
  const container = el('div');
  const showLoading = options.loading ?? (() => skeleton('200px'));
  const showError = options.error ?? ((message: string) => emptyState('Gagal memuat data', message));

  append(container, showLoading());

  loader()
    .then((data) => {
      container.textContent = '';
      append(container, render(data));
    })
    .catch((err: unknown) => {
      container.textContent = '';
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      append(container, showError(message));
    });

  return container;
}

/** Convenience wrapper: renders an async section directly into `host`. */
export function mountAsync<T>(
  host: Element,
  loader: () => Promise<T>,
  render: (data: T) => Child,
  options: { loading?: () => Child; error?: (message: string) => Child } = {},
): void {
  host.appendChild(asyncSection(loader, render, options));
}
