# Guru International School

A responsive, static school website using the supplied school profile. Source lives in `dist/index.html`, `dist/styles.css`, and `dist/app.js`. No framework or runtime dependencies are needed.

## Preview
Run `npm run dev` from this directory, then open http://localhost:5173.
Run `npm run check` for the JavaScript syntax check.

## Content breakdown
- School story, establishment, vision, mission and values: profile pages 3–5, 7–8.
- Leadership: pages 6–10.
- Address and contact information: pages 11 and 24.
- Facilities and campus imagery: pages 12–13.
- Early years and primary programmes, ages 2–11: pages 14–17.
- Registration status: page 18; pending accreditation is explicitly described as pending.
- Enrichment, teaching, student life and parent engagement: pages 19–22.
- Class size and student–teacher ratio: page 23; shown as profile figures rather than current availability.

## Assets
Original PDF photos were extracted, resized to a maximum of 1600 pixels, and encoded as WebP. The original school crest is preserved as PNG with transparency. `scripts/prepare_assets.py` reproduces these assets using PyMuPDF and Pillow installed in the parent `.venv`. Original source materials are untouched. Browser photo crops use CSS object-fit.

## Behaviour and accessibility
Responsive navigation, campus filters, keyboard-accessible native photo dialog, scroll reveal, limited parallax and a moving text ribbon. Reduced-motion preferences disable animation. Semantic sections, skip link, visible focus states and meaningful image descriptions are included.

## Contact and security
Visit enquiries use the school's real email and telephone links. There is no form backend, collection of personal data, or fake booking confirmation. No API keys, secrets, authentication code, analytics or third-party JavaScript are shipped. Text updates use textContent. External map links use noopener and noreferrer. Fonts load from Google Fonts with local sans-serif fallbacks.

For a custom production host, configure HTTPS and response headers such as Content-Security-Policy, X-Content-Type-Options, Referrer-Policy and Permissions-Policy. This static site is a maintainable foundation; booking submissions would require a separately secured backend.

## Reference direction
The supplied KBTC and Auston websites were considered for programme, campus, and enquiry navigation. The visual composition is original and uses Guru's existing blue/yellow identity with neo-brutalist borders and offset shadows.
