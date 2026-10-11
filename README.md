# Guru International School — React website

The public website, staff dashboard and privacy page use React with JSX and Vite. The migration preserves the school's existing layout, typography, photos, separate page URLs, English/Myanmar choices and light/dark themes. The backend remains Node.js Vercel Functions; React renders the interface, while server-only credentials stay on the server.

## Run locally

The project now lives directly in `Guru-Project-Website/`; there is no nested `guru-school/` folder. Open that folder in your editor and run commands from it.

Use Node.js 22.12+ or 24 LTS, then:

```sh
npm ci
npm run dev
```

The Vite website opens at `http://localhost:5173` and proxies `/api` to the local Node server on port 5175. The development API requires the private `.env` and `.env.local` files. Staff cookies use Secure and HttpOnly; use the deployed HTTPS dashboard for production authentication checks.

```sh
npm run check       # Backend and tooling syntax
npm run build       # Client bundles, React pre-rendering, output security checks
npm test            # Node backend tests and React UI tests
npm run preview     # Serve the production build locally
```

## Source layout

- `src/PublicApp.jsx`: public pages, navigation, published content and visitor tracking.
- `src/AdminApp.jsx`: authentication and staff workspace.
- `src/components/`: gallery, photo viewer, enquiry form, publishing editors, inbox and analytics charts.
- `src/content/SchoolSections.jsx`: existing school content as editable React components.
- `src/content/pages.js`, `gallery.js`, `translations.js`: page metadata, gallery photos and Myanmar translations.
- `src/styles.css`, `admin.css`: original visual systems, with small contrast improvements.
- `src/palette.mjs`: checked semantic colour pairs and contrast calculation.
- `public/assets/`: all original and updated school images.
- `api/`, `lib/`: private storage, sessions, SMTP mail, publishing and visitor analytics.
- `scripts/prerender.mjs`: writes initial React HTML for each public page. `dist/` and `.build-server/` are generated and ignored by Git.

Edit `src/` and `public/`, then build. Do not edit generated files in `dist/`.

The older showcase project, source-photo duplicates, preview screenshots and one-time image preparation scripts are no longer part of the active project. The website uses the prepared images in `public/assets/`.

## Pages and deployment

Routes are `/`, `/about`, `/programmes`, `/life`, `/campus`, `/team`, `/gallery`, `/news`, `/contact`, `/privacy.html` and `/admin`. Each public page is pre-rendered for fast initial loading and search engines, then React hydrates its controls. Navigation retains separate page URLs and normal browser back/forward behaviour. Legacy links such as `/#gallery` redirect to the related page.

Vercel runs `npm run build` and serves `dist/`, with existing page rewrites and Node API functions. The production Vercel alias is `https://guru-school.vercel.app`. The custom domain `guru.edu.mm` also requires the registrar's DNS to point to Vercel. The Git repository is `https://github.com/moosey-sys/guru-school`.

## Private configuration

Required server variables: `BLOB_READ_WRITE_TOKEN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.

Optional mail variables: `SMTP_HOST`, `SMTP_PORT` (465 or 587), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`. The notification recipient is `mooseythaw03@gmail.com`. The sender is the authenticated SMTP account; Reply-To is the visitor's email. For Gmail use a Google-generated App Password for the sending account, not its normal password. The receiving inbox does not need an App Password.

Enquiries are saved privately before SMTP delivery is attempted. Missing or failed SMTP does not lose the message. The staff inbox shows `not-configured`, `accepted` or `failed`; SMTP acceptance is not proof of inbox delivery. Visit requests require school confirmation, and changing their status does not automatically send a booking email.

Never commit `.env`, `.env.local`, `.admin-credentials`, private keys or tokens. Those files are ignored by Git and excluded from deployment uploads. Authentication uses a salted scrypt hash, signed secure cookies, origin validation, CSRF checks and rate limits. Conditional ETag writes protect staff edits from overwriting each other. Draft stories and unpublished uploads are private. Uploaded JPEG/PNG/WebP photos are decoded, stripped of metadata and re-encoded to WebP.

## Visitor statistics

Daily, monthly and yearly statistics use Myanmar time (`Asia/Yangon`). Visitors are approximate distinct browsers, not identified people. An anonymous browser ID lasts up to one year and visits last 30 minutes. Reloads and navigation remain in the same visit. Different devices or cleared cookies can count separately. Signed-in staff, obvious bots, Do Not Track and Global Privacy Control requests are excluded. No raw IP addresses, names, emails or browsing history are stored in traffic events. Statistics start when tracking was introduced; earlier traffic cannot be reconstructed. The report explicitly fails rather than silently truncating above 100,000 event markers.

## Migration verification

The test suites cover public navigation, language/theme persistence, gallery filtering/expansion and photo viewing, campus filters, public news visibility, visitor privacy preferences, enquiry booking fields, submission/error handling, staff login/logout, analytics views, publishing and stale-version errors, photo upload/save, inbox notes/status, authentication/CSRF/origin checks, image validation, SMTP success/failure, durable enquiry storage, anonymous statistics and semantic colour contrast. Browser comparisons against the previous production version checked matching page geometry and colours on desktop and mobile.

The key text colour pairs meet WCAG AA's 4.5:1 contrast threshold. The school palette remains navy, cream and yellow; dark focus outlines use yellow, and small dashboard labels use a slightly darker secondary tone in light mode. These checks do not claim a full accessibility certification. Email inbox delivery requires real SMTP credentials and a separate delivery test.
