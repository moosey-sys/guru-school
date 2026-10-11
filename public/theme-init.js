(() => {
  let saved;
  const key = location.pathname.startsWith('/admin') ? 'guru-admin-theme' : 'guru-theme';
  try { saved = localStorage.getItem(key); } catch {}
  document.documentElement.dataset.theme = ['light','dark'].includes(saved) ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();
