'use strict';
(() => {
  const dictionary = window.GURU_MYANMAR;
  const originalTitle = document.title;
  const originalDescription = document.querySelector('meta[name="description"]').content;
  let language = 'en';
  try { language = localStorage.getItem('guru-language') === 'my' ? 'my' : 'en'; } catch { /* Storage is optional. */ }
  const textBindings = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script, style, .language-tabs, .theme-label, #year, [data-count]')) continue;
    const key = node.textContent.trim();
    if (dictionary[key]) textBindings.push({ node, original: node.textContent, key });
  }
  const attributes = [];
  document.querySelectorAll('[alt], [aria-label], [data-caption]').forEach(element => {
    for (const attribute of ['alt', 'aria-label', 'data-caption']) {
      if ((element.matches('.theme-toggle, .menu-toggle')) && attribute === 'aria-label') continue;
      const original = element.getAttribute(attribute);
      if (dictionary[original]) attributes.push({ element, attribute, original });
    }
  });
  window.guruTranslate = text => language === 'my' ? (dictionary[text] || text) : text;
  function applyLanguage(next) {
    language = next;
    document.documentElement.lang = language;
    textBindings.forEach(({ node, original, key }) => {
      node.textContent = language === 'my' ? original.replace(key, dictionary[key]) : original;
    });
    attributes.forEach(({ element, attribute, original }) => element.setAttribute(attribute, window.guruTranslate(original)));
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.title = language === 'my' ? window.guruTranslate(originalTitle) : originalTitle;
    document.querySelector('meta[name="description"]').content = window.guruTranslate(originalDescription);
    document.dispatchEvent(new CustomEvent('guru-language-change'));
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    try { localStorage.setItem('guru-language', button.dataset.language); } catch { /* Session switching still works. */ }
    applyLanguage(button.dataset.language);
  }));
  applyLanguage(language);
})();
