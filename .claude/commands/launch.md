---
description: Launch Resume Forge on Cloudflare (D1 + Workers AI + Pages) and hand back a live link
---

Launch this site for the owner, end to end. Work on your own; stop only at the **[OWNER]** steps, and when you stop, tell him in short, simple Roman Urdu exactly what to click and what to send you. Keep a task list so he can follow progress. Never print or commit secrets.

## 0. Preflight
1. `node -v` (need 22+ for tests). Run `npm test` — fix anything that fails before continuing.
2. Check Cloudflare access:
   - `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be set in the environment. If `npx --yes wrangler@4 whoami` fails because they are missing → **[OWNER]** step A below.
   - If `npx` or `api.cloudflare.com` is blocked by the network → **[OWNER]** step B below.
   - On the owner's own computer (Claude Code CLI/desktop) `npx wrangler login` in his browser also works instead of a token.

**[OWNER] step A — Cloudflare token** (tell him this, in Roman Urdu):
1. dash.cloudflare.com par free account banayein, ya pehle se ho to login karein.
2. Right side se **Account ID** copy karein.
3. **My Profile → API Tokens → Create Token → Create Custom Token** banayein. Permissions:
   - Account · **Cloudflare Pages** · Edit
   - Account · **D1** · Edit
   - Account · **Workers AI** · Read
   - Account · **Account Settings** · Read
   - User · **User Details** · Read
   - User · **Memberships** · Read
4. Claude Code ki **environment settings** mein do variables daalein: `CLOUDFLARE_API_TOKEN` aur `CLOUDFLARE_ACCOUNT_ID`.
5. Token chat mein paste **na** karein.

**[OWNER] step B — network:** Claude Code environment ki settings mein network access **Full** karein, ya yeh domains allow karein:
- `api.cloudflare.com`
- `*.cloudflare.com`
- `registry.npmjs.org`
- `*.pages.dev`
- `oauth2.googleapis.com`

## 1. Database (D1)
- `npx wrangler d1 create resume-forge-db`. If the database already exists, find it with `npx wrangler d1 list`. Take its `database_id`.
- `cp wrangler.toml.example wrangler.toml`, then put the id in.
- Run `npx wrangler d1 execute resume-forge-db --remote --file db/schema.sql --yes`.
- Verify with `npx wrangler d1 execute resume-forge-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"`. It must show `users`, `sessions`, `resumes` and `ai_usage`.

## 2. Pages project
- `npx wrangler pages project create resume-forge --production-branch main`. If the name is taken, use `resume-forge-<something>`, and change `name` in `wrangler.toml` to match.
- Note the live address: `https://<project>.pages.dev`.

## 3. Secrets
- Create `SESSION_SECRET` with `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- Pipe it into `npx wrangler pages secret put SESSION_SECRET --project-name <project>`. Never echo it.

## 4. Build and deploy
- `SITE_URL=https://<project>.pages.dev node build/build.mjs`. Also add `GOOGLE_CLIENT_ID=...` once you have it.
- `npx wrangler pages deploy dist --project-name <project> --branch main --commit-dirty=true`. Run this from the repo root so `functions/` and `wrangler.toml` are picked up.

## 5. Verify the live site (don't skip)
With curl against `https://<project>.pages.dev`:
- `/`, `/templates/`, `/builder/`, `/cv-examples/nurse/` and `/sitemap.xml` return 200.
- `/api/ai/usage` returns JSON with `usage`. This proves D1 is connected.
- **Real AI test:** `POST /api/ai/rewrite` with `{"kind":"bullet","text":"responsible for sales in Karachi"}` must return `result.options` (3 strings).
  - If it fails, read the logs with `npx wrangler pages deployment tail --project-name <project>`.
  - Look at what Workers AI actually returned, and fix `extractText()` in `server/providers.mjs` or the model id if needed. Redeploy and test again.
- Also test `POST /api/ai/improve` with a small resume JSON. The returned `result.resume` must be filled in.
- Test a photo (image) import with a small JPEG of text. If the model rejects images, make sure the site shows the friendly "upload a PDF or Word file" message rather than a crash.

## 6. Commit
- `git add wrangler.toml` and any fixes. Commit, then `git push origin main`.

## 7. Report to the owner (Roman Urdu)
- Live link.
- What works.
- What's left: Google login (step 8), domain, Search Console and AdSense. Point to `LAUNCH-GUIDE.md` sections 2, 9 and 10.

## 8. Google login — **[OWNER]** gives you two values
Tell him, in Roman Urdu:
1. console.cloud.google.com → new project → **OAuth consent screen**:
   - External
   - App name aur email bharein
   - **Publish**
2. **Credentials → Create OAuth client ID → Web application**:
   - **Authorized JavaScript origins:** `https://<project>.pages.dev`
   - **Authorized redirect URI:** `https://<project>.pages.dev/api/auth/callback`
3. **Client ID** chat mein bhej dein. Yeh public hota hai.
4. **Client Secret** chat mein na bhejein. Usay Claude Code environment mein `GOOGLE_CLIENT_SECRET` naam se daal dein.

Then you:
- Add `GOOGLE_CLIENT_ID = "<id>"` under `[vars]` in `wrangler.toml`.
- Pipe the secret into `npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name <project>`.
- Rebuild with `GOOGLE_CLIENT_ID` set, then redeploy.
- Verify that `/api/auth/me` shows `"enabled":true`.
- Verify that `/api/auth/google` returns a 302 to accounts.google.com, with the correct `redirect_uri`.
- Commit and push. Ask him to try "Continue with Google" once and confirm.

## 9. Custom domain (later, when he buys one)
Ask him to add it in **Pages → Custom domains** (or do it via the Cloudflare API). Then:
- Set `SITE_URL` to the new domain.
- Add the new redirect URI in Google.
- Rebuild, redeploy and verify.
