/**
 * Verification-only smoke test.
 *
 * Loads the *built* page bundles inside a jsdom environment, pointing API
 * requests at a running backend, and asserts that real content is rendered.
 * This proves the vanilla TypeScript controllers work, not just that they
 * compile. Run with: node scripts/smoke.mjs [apiBaseUrl]
 *
 * Not part of the shipped app; it exists so the pages can be verified without
 * a browser binary.
 *
 * The script owns the fixtures it needs: the inbox check creates a contact
 * message through the public API and deletes it again through the admin API,
 * so it passes on a freshly seeded database instead of depending on leftover
 * data from an earlier manual run.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const API = process.argv[2] ?? 'http://localhost:8080';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const realFetch = globalThis.fetch;

let failures = 0;
const log = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
};

/**
 * Vite emits one `<script type="module">` per shared chunk for multi-page
 * builds, so every script tag must be executed in document order — exactly as
 * a browser would.
 */
function assetsFor(htmlFile) {
  const html = readFileSync(path.join(dist, htmlFile), 'utf8');
  const matches = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"/g)];
  if (matches.length === 0) throw new Error(`no module script in ${htmlFile}`);
  return matches.map((m) => path.join(dist, m[1].replace(/^\//, '')));
}

async function loadPage(htmlFile, { slug } = {}) {
  const url = slug
    ? `http://localhost:4173/${htmlFile}?slug=${encodeURIComponent(slug)}`
    : `http://localhost:4173/${htmlFile}`;
  const html = readFileSync(path.join(dist, htmlFile), 'utf8');
  const dom = new JSDOM(html, { url, pretendToBeVisual: true });

  const { window } = dom;
  window.IntersectionObserver = class {
    observe(target) { target.dataset.visible = 'true'; }
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.print = () => {};
  window.scrollTo = () => {};

  // Bridge relative API calls to the running backend.
  window.fetch = (input, init) => {
    const raw = typeof input === 'string' ? input : input?.url ?? String(input);
    const target = raw.startsWith('/') ? API + raw : raw;
    if (process.env.SMOKE_DEBUG) console.error('[smoke] fetch', raw, '->', target);

    // Vite's module-preload polyfill fetches sibling chunks from the page
    // origin. There is no static server here, so answer those locally.
    if (target.startsWith('http://localhost:4173')) {
      return Promise.resolve(new Response('', { status: 200, headers: { 'Content-Type': 'text/javascript' } }));
    }
    return realFetch(target, init);
  };
  for (const key of [
    'window', 'document', 'navigator', 'location', 'history',
    'Node', 'Element', 'HTMLElement', 'HTMLInputElement', 'SVGElement',
    'Event', 'CustomEvent', 'MutationObserver', 'IntersectionObserver', 'matchMedia',
  ]) {
    if (window[key] !== undefined) globalThis[key] = window[key];
  }
  globalThis.IntersectionObserver = window.IntersectionObserver;
  globalThis.matchMedia = window.matchMedia;
  globalThis.fetch = window.fetch;
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

  for (const entry of assetsFor(htmlFile)) {
    await import(pathToFileURL(entry).href);
  }
  await new Promise((resolve) => setTimeout(resolve, 900));

  // `.reveal` starts at opacity 0 and is only shown once an IntersectionObserver
  // marks it. jsdom never applies that opacity, so a page can pass every content
  // check while its sections are invisible in a real browser. The stub above
  // records `observe()` calls in data-visible, making that wiring assertable.
  const revealTotal = window.document.querySelectorAll('.reveal').length;
  const revealHidden = window.document.querySelectorAll('.reveal:not([data-visible="true"])').length;
  log(
    revealTotal === 0 || revealHidden === 0,
    `${htmlFile}: every .reveal is observed (nothing stuck invisible)`,
    `${revealTotal - revealHidden}/${revealTotal}`,
  );

  return window;
}

async function main() {
  // 1. Home page renders profile, skills, featured projects and education.
  {
    const w = await loadPage('index.html');
    const text = w.document.body.textContent;
    log(w.document.querySelectorAll('#skills-grid .card').length >= 3, 'home: skills groups rendered');
    log(w.document.querySelectorAll('#featured-projects .project-card').length >= 2, 'home: featured projects rendered',
      `${w.document.querySelectorAll('#featured-projects .project-card').length} cards`);
    log(w.document.querySelectorAll('#education-timeline .timeline__item').length >= 2, 'home: education timeline rendered');
    log(text.includes('Izhar Harahap'), 'home: profile name injected');
    log(w.document.querySelectorAll('#site-header .site-nav__link').length >= 5, 'home: header mounted');
    log(
      w.document.querySelector('#featured-projects')?.textContent.includes('LedgerFlow') === true,
      'home: LedgerFlow card present',
    );

    // i18n plumbing: the toggle must render, the document must declare its
    // language, and no data-i18n element may still be showing its raw key
    // (which is what t() returns when a dictionary lookup fails).
    log(w.document.querySelectorAll('.lang-switch__btn').length === 2, 'i18n: language switch rendered',
      `${w.document.querySelectorAll('.lang-switch__btn').length} options`);
    log(w.document.documentElement.lang === 'id', 'i18n: document language declared',
      `lang=${w.document.documentElement.lang}`);
    const untranslated = [...w.document.querySelectorAll('[data-i18n]')]
      .filter((node) => (node.dataset.i18n ?? '').includes('.') && node.textContent?.trim() === node.dataset.i18n);
    log(untranslated.length === 0, 'i18n: no untranslated static copy',
      untranslated.map((n) => n.dataset.i18n).join(', '));
  }

  // 2. Projects page: filter controls + grid, and filtering works.
  {
    const w = await loadPage('projects.html');
    const cards = () => w.document.querySelectorAll('#projects-grid .project-card').length;
    log(cards() >= 2, 'projects: grid rendered', `${cards()} cards`);

    const language = w.document.querySelector('#filter-language');
    log(language.options.length > 1, 'projects: language filter populated', `${language.options.length} options`);

    // Apply a language filter and confirm the list narrows.
    const before = cards();
    language.value = 'Go';
    language.dispatchEvent(new w.Event('change'));
    await new Promise((r) => setTimeout(r, 200));
    const after = cards();
    log(after <= before && after >= 1, 'projects: language filter narrows results', `${before} → ${after}`);

    // Search with no matches must show the empty state.
    const search = w.document.querySelector('#project-search');
    search.value = 'zzzz-not-a-project';
    search.dispatchEvent(new w.Event('input'));
    await new Promise((r) => setTimeout(r, 350));
    log(w.document.querySelector('#projects-grid .empty-state') !== null, 'projects: empty state shown for no matches');
  }

  // 3. Project detail page (dynamic slug + lightbox-ready gallery markup).
  {
    const w = await loadPage('project-detail.html', { slug: 'ledgerflow' });
    const text = w.document.body.textContent;
    log(text.includes('LedgerFlow'), 'detail: project title rendered');
    log(text.includes('Masalah yang diselesaikan'), 'detail: problem section rendered');
    log(w.document.querySelectorAll('.detail-aside .skill-chip').length > 0, 'detail: tech stack chips rendered');
    const repoLink = w.document.querySelector('.detail-aside a[href*="github.com/zharrDev/LedgerFlow"]');
    log(repoLink !== null, 'detail: repository link rendered');
    log(w.document.querySelector('.pager') !== null, 'detail: prev/next pager rendered');
  }

  // 4. Resume page renders and exposes print controls.
  {
    const w = await loadPage('resume.html');
    log(w.document.querySelector('#resume-name').textContent.includes('Izhar'), 'resume: name rendered');
    log(w.document.querySelectorAll('#resume-skills .tag').length > 5, 'resume: skills rendered');
    log(w.document.querySelectorAll('#resume-projects .resume-item').length >= 2, 'resume: featured projects rendered');
    log(w.document.querySelector('#print-cv') !== null, 'resume: print button present');
  }

  // 5. Contact page: form present, client-side validation blocks bad input.
  {
    const w = await loadPage('contact.html');
    const form = w.document.querySelector('#contact-form-host form');
    log(form !== null, 'contact: form rendered');
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 150));
    log(w.document.querySelector('.field__error') !== null, 'contact: validation error shown on empty submit');
  }

  // 6. Admin dashboard + CRUD pages render their shells and tables.
  {
    const w = await loadPage('admin/index.html');
    log(w.document.querySelectorAll('.stat').length >= 8, 'admin: dashboard stats rendered',
      `${w.document.querySelectorAll('.stat').length} stats`);
    log(w.document.querySelectorAll('.admin__nav-link').length >= 8, 'admin: sidebar nav rendered');
  }
  {
    const w = await loadPage('admin/projects.html');
    log(w.document.querySelector('table.data tbody tr') !== null, 'admin: projects table rendered',
      `${w.document.querySelectorAll('table.data tbody tr').length} rows`);
    const addBtn = [...w.document.querySelectorAll('button')].find((b) => b.textContent.includes('Tambah'));
    log(Boolean(addBtn), 'admin: add button present');
    addBtn.click();
    await new Promise((r) => setTimeout(r, 100));
    log(w.document.querySelector('.modal') !== null, 'admin: editor modal opens');
  }
  {
    // A fresh seed leaves the inbox empty, which is correct product behaviour,
    // so create a message first and clean it up afterwards. Seeding the fixture
    // here keeps the assertion strong (a real stored message must render) while
    // making the check independent of the database's prior state.
    const marker = `smoke fixture ${Date.now()}`;
    const created = await realFetch(`${API}/api/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Test',
        email: 'smoke@example.com',
        subject: marker,
        message: 'Pesan otomatis dari smoke test; aman untuk dihapus.',
        website: '',
      }),
    });
    const createdBody = created.ok ? await created.json() : null;
    const fixtureId = createdBody?.data?.id ?? null;
    log(fixtureId !== null, 'admin: contact message created as fixture', `HTTP ${created.status}`);

    const w = await loadPage('admin/messages.html');
    const items = w.document.querySelectorAll('.message-item');
    log(items.length >= 1, 'admin: messages list rendered', `${items.length} item(s)`);
    log(
      w.document.body.textContent.includes(marker),
      'admin: the stored message is rendered in the list',
    );

    const removed = await realFetch(`${API}/api/v1/admin/messages/${fixtureId}`, { method: 'DELETE' });
    log(removed.status === 204 || removed.status === 200, 'admin: fixture message removed', `HTTP ${removed.status}`);
  }
  {
    const w = await loadPage('404.html');
    log(w.document.querySelector('#notfound-path') !== null, '404: path rendered');
  }

  console.log(`\n${failures === 0 ? 'ALL SMOKE CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exit(1);
});
