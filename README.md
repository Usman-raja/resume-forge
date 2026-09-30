# Resume Forge — free AI resume builder

A complete, launch-ready website: 26 resume templates, AI import/rewrite/tailoring/ATS score/cover letters, Google login, cloud saving, share links, SEO pages and ad slots.

**Stack:** static HTML/CSS/JS (no framework, no npm dependencies) + Cloudflare Pages Functions for AI + Supabase for Google login and the database.

```
npm run dev:mock     # local preview with fake AI  → http://localhost:8788
npm run dev          # local preview with real AI (needs .env)
npm run build        # builds dist/  (Cloudflare runs this)
```

See **LAUNCH-GUIDE.md** for the full step-by-step launch (Roman Urdu).

## Folders

| Path | What it is |
|---|---|
| `src/shared/` | Resume engine used by browser **and** build: `templates.mjs` (26 templates), `render.mjs`, `schema.mjs`, `examples.mjs` (12 SEO CV examples), `sample.mjs` |
| `src/styles/resume.css` | All 26 template designs + print rules |
| `src/styles/site.css`, `app.css` | Website and builder UI |
| `src/client/` | Browser modules: `builder.mjs` (the app), `auth.mjs`, `store.mjs`, `ai.mjs`, `importer.mjs` (PDF/Word/photo reading), `export.mjs` (PDF/Word/text), `cover.mjs`, `dashboard.mjs`, … |
| `src/pages/` | Every page's HTML (home, templates, examples, legal…) |
| `server/` | AI handler, prompts, providers (Anthropic or Gemini), credit limits |
| `functions/api/ai/[action].js` | Cloudflare Pages Function → `server/handler.mjs` |
| `supabase/schema.sql` | Tables, row-level security, AI credit functions |
| `build/build.mjs` | Static build → `dist/` (+ sitemap, robots, ads.txt, headers) |
| `build/dev-server.mjs` | Local server with `/api/ai/*` (and `MOCK_AI=1`) |
| `public/` | Favicon, social image, icons, vendored pdf.js (legacy build) and docx |

## Adding a template
1. Add an entry to `TEMPLATES` in `src/shared/templates.mjs` (layout `single`, `sidebar` or `twocol`).
2. Add a `.t-yourid { … }` block in `src/styles/resume.css`.
3. `npm run build` — the gallery, detail page and sitemap update automatically.

## Adding a CV example page
Add an entry to `EXAMPLES` in `src/shared/examples.mjs`. It becomes `/cv-examples/<slug>/`.

## Security notes
- The AI key and Supabase service-role key live only in Cloudflare secrets.
- AI requires sign-in by default and fails closed if Supabase isn't configured.
- Per-user daily credits and a site-wide daily cap are enforced in Postgres by functions only the server can call.
- Resumes are protected by row-level security; public share links use an RPC that returns one resume by id and can't list others.

Third-party code in `public/vendor/`: pdf.js (Apache-2.0), docx (MIT).
