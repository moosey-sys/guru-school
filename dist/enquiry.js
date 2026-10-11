(() => {
  const form = document.querySelector('#enquiry-form');
  if (!form) return;
  const status = document.querySelector('#enquiry-status');
  const submit = form.querySelector('[type="submit"]');
  const dateRow = form.querySelector('.visit-date');
  const date = form.elements.date;
  let token = '', pending = false, statusText = '';
  const t = text => window.guruTranslate?.(text) || text;
  const show = (text, state = '') => { statusText = text; status.textContent = t(text); status.dataset.state = state; };
  async function prepare() {
    try {
      const response = await fetch('/api/enquiry', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unavailable');
      token = (await response.json()).token;
      submit.disabled = false;
      show('');
    } catch { submit.disabled = true; show('Online enquiries are temporarily unavailable. Please email or call our team.', 'error'); }
  }
  function booking() {
    const selected = form.elements.kind.value === 'Book a school visit';
    dateRow.hidden = !selected; date.required = selected;
    if (!selected) date.value = '';
  }
  date.min = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  form.elements.kind.addEventListener('change', booking);
  form.addEventListener('focusin', () => { if (!token && !pending) { pending = true; prepare().finally(() => { pending = false; }); } });
  document.addEventListener('guru-language-change', () => { status.textContent = t(statusText); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity() || !token) return;
    pending = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
    show('Sending your message…');
    try {
      const data = Object.fromEntries(new FormData(form)); data.token = token;
      const response = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error('Delivery failed');
      form.reset(); booking(); token = '';
      show('Thank you! Your enquiry has been saved for our team. We will contact you to confirm visit requests.', 'success');
    } catch { show('Your message could not be sent. Please try again, or email or call our team.', 'error'); token = ''; }
    finally { pending = false; form.removeAttribute('aria-busy'); submit.disabled = false; }
  });
  booking();
})();
