import '@/styles';
import { onReady } from '@/utils/dom';
import { mountCrud } from '@/admin/crud';

/**
 * Single entry point for every admin resource page.
 * Each HTML page declares which resource it edits via `<body data-resource="…">`.
 */
onReady(() => {
  const key = document.body.dataset.resource;
  if (!key) throw new Error('Admin page is missing data-resource on <body>');
  mountCrud(key);
});
