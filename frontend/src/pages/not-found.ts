import '@/styles';
import { onReady, qs } from '@/utils/dom';
import { mountPublicLayout } from '@/components/layout';

onReady(() => {
  mountPublicLayout();
  const path = qs('#notfound-path');
  if (path) path.textContent = window.location.pathname;
});
