---
description: Test, rebuild and redeploy Resume Forge to Cloudflare Pages, then verify the live site
---

1. Run `npm test`. Stop and fix anything that fails.
2. Read the project name and the live URL from `wrangler.toml` / `npx wrangler pages project list`. Use the custom domain if one is set.
3. Build:
   ```
   SITE_URL=<live url> GOOGLE_CLIENT_ID=<from wrangler.toml [vars], if set> node build/build.mjs
   ```
   Add the AdSense and analytics vars if the owner has given them (see `.env.example`).
4. Deploy:
   ```
   npx wrangler pages deploy dist --project-name <project> --branch main --commit-dirty=true
   ```
5. Verify with curl:
   - home, `/builder/` and `/sitemap.xml` return 200
   - `/api/ai/usage` returns JSON
   - one real `POST /api/ai/rewrite` returns 3 options
6. Commit and push any changes. Then tell the owner in one or two lines of Roman Urdu what changed, and give him the link.
