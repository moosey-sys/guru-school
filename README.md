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
Light/dark theme toggle with a saved preference and system-theme default. Button selection bounce, staggered gallery filtering, and photo-dialog entrance feedback. Responsive navigation, campus filters, keyboard-accessible native photo dialog, scroll reveal, limited parallax and a moving text ribbon. Reduced-motion preferences disable animation. Semantic sections, skip link, visible focus states and meaningful image descriptions are included.

## Contact and security
Visit enquiries use the school's real email and telephone links. The enquiry form sends name, email, optional phone number, request type, message, and optional visit date to the school through a server-side SMTP endpoint. Visit requests require confirmation by the school. No API keys, secrets, authentication code, analytics or third-party JavaScript are shipped. Text updates use textContent. External map links use noopener and noreferrer. Fonts load from Google Fonts with local sans-serif fallbacks.

For a custom production host, configure HTTPS and response headers such as Content-Security-Policy, X-Content-Type-Options, Referrer-Policy and Permissions-Policy. This static site is a maintainable foundation; booking submissions would require a separately secured backend.

## Reference direction
The supplied KBTC and Auston websites were considered for programme, campus, and enquiry navigation. The visual composition is original and uses Guru's existing blue/yellow identity with neo-brutalist borders and offset shadows.

## Languages
English and Myanmar are available through the header language tabs. The selection is stored locally. Translation strings live in `dist/translations.js`, with switching in `dist/language.js`. Official names, telephone numbers, emails, and counter digits remain recognizable across languages.

## Vercel deployment
From `guru-school`, run `npx vercel login`, then `npx vercel --prod`. Use the Other framework preset and `dist` as the output directory. `vercel.json` defines the static build check, output directory, and response security headers. No API keys or server are needed. The extraction scripts and Sites metadata are excluded from deployment.

The full photo gallery contains 27 images from the school profile and five supplied JPGs, with bilingual captions, category filters and an enlarged photo viewer. Run `../.venv/bin/python scripts/prepare_gallery.py` to reproduce the gallery WebP assets; captions and categories are recorded in `scripts/gallery-manifest.json`.

## Enquiry inbox setup
The Vercel function `api/enquiry.js` needs server-only environment variables in the guru-school project: `SMTP_HOST`, `SMTP_PORT` (465 or 587), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, and `MAIL_TO`. Optionally set a separate random `FORM_SECRET` for signed form tokens. Use the mail provider’s authenticated sender for MAIL_FROM; visitor email is Reply-To. For Gmail, use an app password rather than the normal account password. Add credentials in Vercel Settings → Environment Variables for Production, then redeploy. Never add secrets to dist or commit them.

Enquiries are saved in the private dashboard even when SMTP is unavailable. Email notifications require the SMTP settings above. The destination inbox is `guruinternationalschool.aca@gmail.com`; notifications include visitor contact details, request type, preferred visit date and message. Reply-To addresses the visitor directly. Visit bookings remain requests until the school confirms them. SMTP acceptance does not guarantee inbox delivery.

## Dynamic staff dashboard
The public site retains its original design and static fallback. Live announcements, published news, and uploaded gallery photos are read from `/api/content`, refreshed on return to the page and every minute. Staff manage these at `/admin`. Original school programmes, staff profiles, and the original gallery remain maintained in source; the dashboard manages additional uploaded photos.

Private Vercel Blob store: `guru-school-private`, `store_oHhWi94PBuqzEOZX`, region `iad1`. JSON content and enquiry records are saved privately; published images are served through a same-origin function. Conditional ETag writes prevent overwriting another staff edit. Unpublished news and photos are hidden from unauthenticated requests. Image uploads are decoded, stripped of metadata and resized to WebP.

Production configuration: `BLOB_READ_WRITE_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET`. Staff login uses a salted scrypt password hash and an eight-hour HttpOnly, Secure, SameSite cookie. Mutating staff endpoints require an origin check and a CSRF header. Login and enquiry rate limits use private atomic storage slots. Signed enquiry tokens prevent duplicate submissions. Keep `.env`, `.env.local`, and `.admin-credentials` private; they are excluded from Git and deployment. The initial staff login is recorded in `.admin-credentials`. To revoke all sessions, rotate `SESSION_SECRET` and redeploy. To change the staff password, generate a new salt:scrypt hash, update `ADMIN_PASSWORD_HASH`, rotate `SESSION_SECRET`, and redeploy.

Enquiries are saved even if SMTP is absent or fails. The dashboard shows the notification status; SMTP acceptance does not prove inbox delivery. Optional SMTP variables are documented above. Reply by email uses the visitor’s email address. Booking status is internal; changing it does not automatically email a confirmation.

Run `npm run check` and `npm test`. For local previews run `npm run dev` with `.env` and `.env.local`; use HTTPS production for staff login (Secure cookies). Vercel deployments bundle the Node server functions plus static output. Private storage incurs usage according to the account plan. Export/back up enquiries via Vercel storage before administrative deletion. Stored images removed from the website are retained privately. Periodically remove expired `limits/` and `receipts/` records from storage; retain content and enquiries according to school policy.

## Visitor dashboard and themes
The staff Overview page has daily, monthly and yearly charts, anonymous browser visitor totals, visits, CSV export, and light/dark mode. Theme preference is stored locally; the default follows the system theme. Tracking starts on deployment of this feature, with no historical backfill. All day/month/year boundaries use Asia/Yangon. A visitor means a browser with a first-party anonymous identifier, not an identified individual. A visit lasts up to 30 minutes and is counted once per browser session/day; crossing midnight counts activity in each day. Reloads do not add visits. Monthly/yearly visitor totals use distinct browser IDs, not a sum of daily visitors. Clearing cookies, using another device, or rotating the session secret can count a browser again. Signed-in staff, obvious bots, Do Not Track and Global Privacy Control requests are excluded; automated traffic detection is approximate.

`POST /api/traffic` stores private anonymous event markers; it saves no raw IP addresses, names, email addresses or browsing history. The browser identifier lasts up to a year, and the visit cookie lasts 30 minutes. IP rate-limiting reuses the hashed private limiter. `GET /api/analytics` is staff-only and aggregates up to 100,000 event markers, failing explicitly beyond that threshold instead of returning incomplete reports. For larger traffic, migrate aggregation to a dedicated analytics database. The Overview uses real totals and empty states, never synthetic data. The privacy page explains this tracking.

### Public pages

Navigation opens separate pages at `/about`, `/programmes`, `/life`, `/campus`, `/team`, `/gallery`, `/news` and `/contact`. The home page introduces the school and links to each area. Shared school content lives in `scripts/site-template.html`; `npm run build` regenerates the public HTML using `scripts/build-pages.mjs`. Edit the template rather than generated page HTML. Shared scripts safely run on pages without galleries or forms. Legacy home-page section links redirect to the related page. Statistics continue counting browser visits across pages without counting each navigation as a new visit. Admin publishing populates School News and Gallery.
