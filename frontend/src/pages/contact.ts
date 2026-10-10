import '@/styles';
import { el, onReady, qs } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';
import { contactForm } from '@/components/contact-form';
import { api } from '@/api/client';
import { t } from '@/i18n';
import type { Profile } from '@/types';

function mountForm(): void {
  const host = qs('#contact-form-host');
  if (host) host.appendChild(contactForm());
}

function mountInfo(): void {
  const host = qs('#contact-info');
  if (!host) return;

  api
    .getProfile()
    .then(({ data }: { data: Profile }) => {
      if (data.email) {
        host.appendChild(el('a', { class: 'row', href: `mailto:${data.email}`, style: 'font-size: var(--text-sm)' }, `✉ ${data.email}`));
      }
      if (data.location) {
        host.appendChild(el('span', { class: 'row text-muted', style: 'font-size: var(--text-sm)' }, `⌖ ${data.location}`));
      }
      host.appendChild(
        el(
          'a',
          { class: 'row', href: 'https://github.com/zharrDev', target: '_blank', rel: 'noopener noreferrer', style: 'font-size: var(--text-sm)' },
          'github.com/zharrDev',
        ),
      );
    })
    .catch(() => {
      host.appendChild(el('span', { class: 'text-dim', style: 'font-size: var(--text-sm)' }, t('contact.infoNotSet')));
    });
}

onReady(() => {
  mountPublicLayout();
  mountForm();
  mountInfo();
});
