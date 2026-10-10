import { el, qs } from '@/utils/dom';
import { button, notice, textAreaField, textField } from '@/components/ui';
import { api, ApiError } from '@/api/client';
import { t } from '@/i18n';
import type { ContactPayload } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Values {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string; // honeypot
}

type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = t('contact.error.name');
  else if (values.name.trim().length < 2) errors.name = t('contact.error.nameShort');
  else if (values.name.length > 100) errors.name = t('contact.error.nameLong');

  if (!values.email.trim()) errors.email = t('contact.error.email');
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = t('contact.error.emailInvalid');

  if (!values.subject.trim()) errors.subject = t('contact.error.subject');
  else if (values.subject.length > 150) errors.subject = t('contact.error.subjectLong');

  if (!values.message.trim()) errors.message = t('contact.error.message');
  else if (values.message.trim().length < 10) errors.message = t('contact.error.messageShort');
  else if (values.message.length > 5000) errors.message = t('contact.error.messageLong');

  return errors;
}

export function contactForm(): HTMLFormElement {
  const values: Values = { name: '', email: '', subject: '', message: '', website: '' };
  const touched: Record<string, boolean> = {};

  const fieldsHost = el('div', { class: 'editor__grid' });
  const statusHost = el('div');
  const submitButton = button(t('contact.send'), { variant: 'primary', type: 'submit' });

  const nameField = textField({ label: t('contact.name'), name: 'name', autoComplete: 'name', required: true });
  const emailField = textField({ label: t('contact.email'), name: 'email', type: 'email', autoComplete: 'email', required: true });
  const subjectField = textField({ label: t('contact.subject'), name: 'subject', required: true, full: true });
  const messageField = textAreaField({ label: t('contact.message'), name: 'message', required: true, full: true, rows: 7 });

  fieldsHost.append(nameField, emailField, subjectField, messageField);

  const honeypot = el(
    'div',
    { class: 'honeypot', 'aria-hidden': 'true' },
    el('label', { for: 'contact-website' }, 'Website'),
    el('input', { id: 'contact-website', name: 'website', tabIndex: -1, autoComplete: 'off' }),
  );

  const form = el(
    'form',
    { class: 'contact-card stack stack-5', novalidate: true },
    fieldsHost,
    honeypot,
    statusHost,
    el(
      'div',
      { class: 'row', style: 'justify-content: space-between' },
      el('span', { class: 'field__hint' }, t('contact.privacyNote')),
      submitButton,
    ),
  );

  const readInput = (wrapper: HTMLElement, key: keyof Values): string => {
    const input = qs<HTMLInputElement | HTMLTextAreaElement>('input, textarea', wrapper);
    return input?.value ?? values[key];
  };

  const sync = (wrapper: HTMLElement, key: keyof Values) => {
    values[key] = readInput(wrapper, key);
  };

  const showErrors = () => {
    const errors = validate(values);
    const map: [HTMLElement, keyof Values][] = [
      [nameField, 'name'],
      [emailField, 'email'],
      [subjectField, 'subject'],
      [messageField, 'message'],
    ];
    for (const [wrapper, key] of map) {
      const errorSpan = qs<HTMLElement>('.field__error', wrapper);
      const input = qs<HTMLElement>('input, textarea', wrapper);
      if (errors[key] && touched[key]) {
        if (errorSpan) errorSpan.textContent = errors[key] as string;
        else wrapper.appendChild(el('span', { class: 'field__error' }, errors[key] as string));
        input?.setAttribute('aria-invalid', 'true');
      } else if (errorSpan) {
        errorSpan.remove();
        input?.removeAttribute('aria-invalid');
      }
    }
    return errors;
  };

  for (const [wrapper, key] of [
    [nameField, 'name'],
    [emailField, 'email'],
    [subjectField, 'subject'],
    [messageField, 'message'],
  ] as [HTMLElement, keyof Values][]) {
    const input = qs<HTMLInputElement>('input, textarea', wrapper);
    input?.addEventListener('input', () => {
      sync(wrapper, key);
      showErrors();
    });
    input?.addEventListener('blur', () => {
      touched[key] = true;
      sync(wrapper, key);
      showErrors();
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    touched.name = true;
    touched.email = true;
    touched.subject = true;
    touched.message = true;
    values.name = readInput(nameField, 'name');
    values.email = readInput(emailField, 'email');
    values.subject = readInput(subjectField, 'subject');
    values.message = readInput(messageField, 'message');
    values.website = qs<HTMLInputElement>('input', honeypot)?.value ?? '';

    const errors = showErrors();
    if (Object.keys(errors).length > 0) return;

    statusHost.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = t('contact.sending');

    const payload: ContactPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      message: values.message.trim(),
      website: values.website,
    };

    api
      .sendContact(payload)
      .then(() => {
        statusHost.textContent = '';
        statusHost.appendChild(
          notice('success', t('contact.sent')),
        );
        form.reset();
        values.name = '';
        values.email = '';
        values.subject = '';
        values.message = '';
        for (const key of Object.keys(touched)) delete touched[key];
        showErrors();
      })
      .catch((err: unknown) => {
        let message = t('contact.failed');
        if (err instanceof ApiError) {
          message = err.status === 429 ? t('contact.rateLimited') : err.message;
        }
        statusHost.textContent = '';
        statusHost.appendChild(notice('error', message));
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = t('contact.send');
      });
  });

  return form;
}
