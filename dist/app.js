'use strict';
const translate = text => window.guruTranslate ? window.guruTranslate(text) : text;
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function closeMenu() { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', translate('Open navigation')); }
menuButton.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', translate(open ? 'Close navigation' : 'Open navigation')); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
  document.querySelectorAll('.about-grid, .programme, .life-gallery, .value-grid, .campus-grid, .team-grid, .community-details, .contact-box').forEach(element => { element.classList.add('reveal'); observer.observe(element); });
}
let queued = false;
const layers = document.querySelectorAll('[data-parallax]');
function updateParallax() { queued = false; layers.forEach(layer => { layer.style.translate = motion.matches ? '0 0' : `0 ${Math.min(window.scrollY, 800) * Number(layer.dataset.parallax)}px`; }); }
window.addEventListener('scroll', () => { if (!queued && !motion.matches) { queued = true; requestAnimationFrame(updateParallax); } }, { passive: true });
motion.addEventListener('change', () => { updateParallax(); if (motion.matches) document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible')); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  document.querySelectorAll('[data-category]').forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
}));
const lightbox = document.querySelector('#lightbox');
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  const img = lightbox.querySelector('img'); img.src = button.dataset.image; img.alt = button.dataset.caption;
  lightbox.querySelector('p').textContent = button.dataset.caption;
  lightbox.showModal();
}));
lightbox.querySelector('.close-dialog').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) { const rect = lightbox.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close(); } });
document.querySelector('#year').textContent = new Date().getFullYear();

const themeButton = document.querySelector('.theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let explicitTheme = false;
try { explicitTheme = ['light', 'dark'].includes(localStorage.getItem('guru-theme')); } catch { /* Use session choice if storage is unavailable. */ }
function syncThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', translate(dark ? 'Switch to light mode' : 'Switch to dark mode'));
  themeButton.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
  themeButton.querySelector('.theme-label').textContent = translate(dark ? 'Light' : 'Dark');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#131a29' : '#2448a5';
}
syncThemeButton();
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  explicitTheme = true;
  try { localStorage.setItem('guru-theme', theme); } catch { /* The toggle still works without persistent storage. */ }
  syncThemeButton();
});
systemTheme.addEventListener('change', event => {
  if (!explicitTheme) { document.documentElement.dataset.theme = event.matches ? 'dark' : 'light'; syncThemeButton(); }
});
// Native clicks include keyboard activation; do not delay navigation or actions.
document.addEventListener('click', event => {
  const target = event.target.closest('button, a, summary');
  if (!target || motion.matches || typeof target.animate !== 'function') return;
  target.animate([
    { scale: '1' }, { scale: '0.95', offset: 0.3 }, { scale: '1.035', offset: 0.7 }, { scale: '1' }
  ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  if (motion.matches) return;
  document.querySelectorAll('.campus-card:not([hidden])').forEach((card, index) => {
    card.animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { duration: 320, delay: index * 60, fill: 'backwards', easing: 'ease-out' });
  });
}));
lightbox.addEventListener('close', () => lightbox.getAnimations().forEach(animation => animation.cancel()));
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  if (!motion.matches) lightbox.animate([{ opacity: 0, scale: '.94' }, { opacity: 1, scale: '1' }], { duration: 260, easing: 'ease-out' });
}));

// Replay each school fact after it leaves and re-enters the viewport. HTML retains
// the real values for no-JavaScript visitors and assistive technologies.
const counters = [...document.querySelectorAll('[data-count]')];
const counterFrames = new Map();
function finishCounter(counter) {
  cancelAnimationFrame(counterFrames.get(counter));
  counterFrames.delete(counter);
  counter.textContent = counter.dataset.count;
}
function animateCounter(counter) {
  if (motion.matches) { finishCounter(counter); return; }
  finishCounter(counter);
  const target = Number(counter.dataset.count);
  const duration = 1400;
  let start;
  counter.textContent = '0';
  function tick(time) {
    if (motion.matches) { finishCounter(counter); return; }
    start ??= time;
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = String(Math.round(target * eased));
    if (progress < 1) counterFrames.set(counter, requestAnimationFrame(tick));
    else finishCounter(counter);
  }
  counterFrames.set(counter, requestAnimationFrame(tick));
}
if ('IntersectionObserver' in window) {
  const activeFacts = new WeakSet();
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const fact = entry.target;
      if (!entry.isIntersecting) {
        activeFacts.delete(fact);
        fact.querySelectorAll('[data-count]').forEach(finishCounter);
      } else if (entry.intersectionRatio >= 0.35 && !activeFacts.has(fact)) {
        activeFacts.add(fact);
        fact.querySelectorAll('[data-count]').forEach(animateCounter);
      }
    });
  }, { threshold: [0, 0.35] });
  document.querySelectorAll('.facts > div').forEach(fact => counterObserver.observe(fact));
  motion.addEventListener('change', () => {
    if (motion.matches) counters.forEach(finishCounter);
  });
}

document.addEventListener('guru-language-change', () => { syncThemeButton(); closeMenu(); if (lightbox.open) lightbox.close(); });
closeMenu();
