# Resume Forge — notes for Claude Code

Free AI resume/CV builder website (26 templates, AI import/rewrite/tailor/ATS/cover letter, Google login, cloud save, share links, SEO pages, ad slots). Owner: Usman (GitHub `Usman-raja`). **Talk to the owner in simple Roman Urdu.** He wants you to do the work yourself and hand him the final result (a live link), stopping only for things only he can do.

## Stack (keep it this way)
- Static site built by `node build/build.mjs` → `dist/`. **No npm runtime dependencies** — do not add frameworks or packages. (`npx wrangler` is a dev tool only, fine to use.)
- API: Cloudflare Pages Functions → `functions/api/[[path]].js` → `server/router.mjs`.
- AI: **Cloudflare Workers AI** via the `AI` binding (no API key). Default model `@cf/mistralai/mistral-small-3.1-24b-instruct`. Do not switch to a paid provider unless the owner asks.
- Database: **Cloudflare D1** via the `DB` binding; schema in `db/schema.sql`.
- Login: our own Google OAuth code in `server/auth.mjs` (needs `GOOGLE_CLIENT_ID` var + `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` secrets).
- Everything must stay on free tiers. On Cloudflare's free plan Workers AI stops at 10,000 neurons/day, so there is no surprise bill.

## Commands
- `npm test` — builds and runs the self-test (Node 22+): templates, escaping, D1 API, Google login flow, AI allowances. Must pass before any deploy.
- `npm run dev:mock` — local site at http://localhost:8788 with fake AI and a test login.
- `npm run build` — production build (reads `SITE_URL`, `GOOGLE_CLIENT_ID`, ads vars from env at build time).
- `/launch` — full first launch on Cloudflare (see `.claude/commands/launch.md`).
- `/deploy` — rebuild and redeploy after changes.

## Rules
- Never print, log or commit secrets (`CLOUDFLARE_API_TOKEN`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`). `wrangler.toml` (database id, public vars) is fine to commit.
- Never buy anything or upgrade a paid plan; tell the owner instead.
- Public values are baked into pages at build time: after changing `SITE_URL`, `GOOGLE_CLIENT_ID` or AdSense ids, rebuild **and** redeploy.
- After every deploy, verify the live site with curl (pages + `/api/auth/me` + `/api/ai/usage` + one real AI call) before reporting success.
- Commit with clear messages and push to `main`.

## Where things are
`src/shared/` resume engine (templates, renderer, schema, examples, instant-check rules) · `src/styles/` CSS · `src/client/` browser modules · `src/pages/` HTML for every page · `server/` API · `LAUNCH-GUIDE.md` manual steps in Roman Urdu.
