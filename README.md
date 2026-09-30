# Resume Forge — free AI resume builder

A complete, launch-ready website: 26 resume templates, AI import/rewrite/tailoring/ATS score/cover letters, Google login, cloud saving, share links, SEO pages and ad slots.

**Stack — one free Cloudflare account, nothing else to pay for:**
- Static HTML/CSS/JS (no framework, **no npm dependencies**)
- Cloudflare Pages Functions for the API (`functions/api/[[path]].js` → `server/router.mjs`)
- **Cloudflare Workers AI** for AI — built-in, no API key, open-source model (Mistral Small 3.1, Apache-2.0)
- **Cloudflare D1** (SQLite) for accounts, saved resumes and AI allowances
- "Continue with Google" implemented directly with Google OAuth (no auth library or service)
- Free extras that need no server: an instant rule-based resume check, and Chrome's on-device AI for one-line rewrites when available

```
npm run dev:mock     # local preview with fake AI + test login → http://localhost:8788
npm run dev          # local preview (real Workers AI if CF_ACCOUNT_ID + CF_API_TOKEN are in .env)
npm run build        # builds dist/  (Cloudflare runs this)
```

See **LAUNCH-GUIDE.md** for the full step-by-step launch (Roman Urdu).

## Folders

| Path | What it is |
|---|---|
| `src/shared/` | Resume engine used by browser **and** build: `templates.mjs` (26 templates), `render.mjs`, `schema.mjs`, `examples.mjs` (12 SEO CV examples), `lint.mjs` (instant check), `sample.mjs` |
| `src/styles/resume.css` | All 26 template designs + print rules |
| `src/styles/site.css`, `app.css` | Website and builder UI |
| `src/client/` | Browser modules: `builder.mjs` (the app), `auth.mjs`, `store.mjs`, `ai.mjs`, `importer.mjs` (PDF/Word/photo reading), `export.mjs` (PDF/Word/text), `cover.mjs`, `dashboard.mjs`, … |
| `src/pages/` | Every page's HTML (home, templates, examples, legal…) |
| `server/` | `router.mjs`, `auth.mjs` (Google login + sessions), `resumes.mjs`, `handler.mjs` (AI + allowances), `providers.mjs` (Workers AI; optional Anthropic/Gemini), `prompts.mjs` |
| `functions/api/[[path]].js` | Cloudflare Pages Function → `server/router.mjs` |
| `db/schema.sql` | D1 tables: users, sessions, resumes, ai_usage |
| `build/build.mjs` | Static build → `dist/` (+ sitemap, robots, ads.txt, headers) |
| `build/dev-server.mjs` | Local server running the same API with a SQLite file as D1 (Node 22+), `MOCK_AI=1`, `DEV_LOGIN=1` |
| `public/` | Favicon, social image, icons, vendored pdf.js (legacy build) and docx |

## Adding a template
1. Add an entry to `TEMPLATES` in `src/shared/templates.mjs` (layout `single`, `sidebar` or `twocol`).
2. Add a `.t-yourid { … }` block in `src/styles/resume.css`.
3. `npm run build` — the gallery, detail page and sitemap update automatically.

## Adding a CV example page
Add an entry to `EXAMPLES` in `src/shared/examples.mjs`. It becomes `/cv-examples/<slug>/`.

## Security notes
- No API keys exist for AI: Workers AI is a binding. Only `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` are secrets.
- Sessions: random token in an HttpOnly, Secure, SameSite=Lax cookie; only its SHA-256 hash is stored.
- Cross-site writes are rejected by an Origin check. Users can only read/write their own resumes; share links return one resume by unguessable id and can't list others.
- AI allowances are enforced in D1 per user and per guest (salted hash of the IP — raw IPs are never stored), plus a site-wide daily cap. On Cloudflare's free plan Workers AI also stops at 10,000 neurons/day, so the bill can't grow.

Third-party code in `public/vendor/`: pdf.js (Apache-2.0), docx (MIT).
