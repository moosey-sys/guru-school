'use strict';
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function closeMenu() { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
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
