'use strict';
// Apply the saved choice before styles load to avoid a light-theme flash.
(() => {
  let saved;
  try { saved = localStorage.getItem('guru-theme'); } catch { /* Storage may be disabled. */ }
  const theme = saved === 'light' || saved === 'dark' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
})();
