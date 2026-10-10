/**
 * Entrance reveal — the site's one "arriving" animation.
 *
 * Every load plays it: a first visit, a refresh, moving between pages, and the
 * reload that follows a language switch. Text units flip up from below into
 * place, staggered a beat apart, so the page assembles itself line by line
 * instead of snapping in whole.
 *
 * Units owned by the scroll-reveal system (`.reveal`) are skipped: those
 * control their own opacity when they scroll into view, and two systems
 * fighting over one property reads as flicker.
 */

const ENTRANCE_SELECTOR = [
  '#site-header .brand',
  '#site-header .site-nav__link',
  '.hero__name',
  '.hero__title > span',
  '.hero__title > em',
  '.hero__lede',
  '.hero__cta > *',
  '.hero__facts > *',
  '.page-head__eyebrow',
  '.page-head__title',
  '.page-head__lede',
  '.section-head__title > *',
  '.resume__section-title',
  'footer .brand',
  '.footer-meta',
].join(', ');

/**
 * Flips each text unit up from below into place, staggered a beat apart.
 * Runs once per page load; the class and index are cleared afterwards so the
 * next load (or a late re-render) starts from a clean state.
 */
export function playEntrance(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const units = Array.from(document.querySelectorAll<HTMLElement>(ENTRANCE_SELECTOR)).filter(
    (node) => !node.classList.contains('reveal') && !node.closest('[hidden]'),
  );

  units.forEach((node, index) => {
    node.style.setProperty('--enter-i', String(Math.min(index, 22)));
    node.classList.add('enter-line');
  });

  window.setTimeout(() => {
    for (const node of units) {
      node.classList.remove('enter-line');
      node.style.removeProperty('--enter-i');
    }
  }, 1700);
}
