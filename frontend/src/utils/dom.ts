/**
 * Minimal DOM helpers for building UI in plain TypeScript.
 *
 * `el()` creates elements safely (text children become text nodes, so user
 * data is never parsed as HTML). Use `text()` for text nodes and `frag()` to
 * group children.
 */

export type Child = Node | string | number | null | undefined | false | Child[];

export type Attrs = Record<string, unknown>;

function assignAttrs(node: HTMLElement, attrs: Attrs): void {
  for (const [rawKey, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;

    // Event listeners: onClick, onInput, onSubmit, …
    if (rawKey.length > 2 && rawKey.startsWith('on') && typeof value === 'function') {
      const event = rawKey.slice(2).toLowerCase();
      node.addEventListener(event, value as EventListener);
      continue;
    }

    if (rawKey === 'class' || rawKey === 'className') {
      node.setAttribute('class', String(value));
      continue;
    }

    if (rawKey === 'style') {
      if (typeof value === 'string') node.setAttribute('style', value);
      else if (typeof value === 'object') {
        for (const [prop, v] of Object.entries(value as Record<string, unknown>)) {
          if (v === null || v === undefined || v === false) continue;
          node.style.setProperty(prop, String(v));
        }
      }
      continue;
    }

    if (rawKey === 'dataset' && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (v === null || v === undefined) continue;
        node.dataset[k] = String(v);
      }
      continue;
    }

    // Booleans map to presence/absence of the attribute.
    if (value === true) {
      node.setAttribute(rawKey, '');
      continue;
    }

    node.setAttribute(rawKey, String(value));
  }
}

function appendChildren(node: HTMLElement, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) {
      appendChildren(node, child);
    } else if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode(String(child)));
    }
  }
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  assignAttrs(node, attrs);
  appendChildren(node, children);
  return node;
}

/** SVG elements (created in the SVG namespace). */
export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): SVGElementTagNameMap[K] {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.length > 2 && key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      continue;
    }
    node.setAttribute(key, value === true ? '' : String(value));
  }
  appendChildrenNS(node, children);
  return node;
}

function appendChildrenNS(node: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) appendChildrenNS(node, child);
    else if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  }
}

/** Appends any number of Child values to an element. */
export function append(parent: Element, ...children: Child[]): void {
  appendChildren(parent as HTMLElement, children);
}

/** Groups children without adding a wrapper element. */
export function frag(...children: Child[]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  appendChildren(fragment as unknown as HTMLElement, children);
  return fragment;
}

/** Sets text content and returns the node (helper for leaf text). */
export function text(value: string | number): Text {
  return document.createTextNode(String(value));
}

/** Replaces the contents of a container with the given children. */
export function render(container: Element, ...children: Child[]): void {
  container.textContent = '';
  appendChildren(container as HTMLElement, children);
}

export function qs<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

export function qsa<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** Runs `fn` after the DOM is ready (immediately if already parsed). */
export function onReady(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

/** Adds the scroll-reveal behaviour to a root element. */
export function observeReveals(root: ParentNode = document): void {
  const targets = qsa<HTMLElement>('.reveal', root);
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const t of targets) t.dataset.visible = 'true';
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.visible = 'true';
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  for (const target of targets) observer.observe(target);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
