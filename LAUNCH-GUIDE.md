# Resume Forge — Launch Guide (step by step)

Yeh guide aap ko zero se live website tak le jayegi. Poora kaam **free accounts** par ho jata hai. Sirf **domain** (~$10/saal) aur **AI ka istemal** (jitna chalega utna) paid hai.

---

## 0. Aap ke paas kya hai

- **Website:** Home page, 26 template pages, 12 CV-example pages, ATS checker, cover letter generator, builder, dashboard, login, share page, privacy/terms/about/contact.
- **Builder:** Resume editor, live preview, 26 templates, colour/font/size/spacing, section order/rename/hide, photo, undo/redo, page-break markers, PDF (asli text wala), Word (.docx), text, backup.
- **AI (sab free, "premium" features):**
  - Purani CV upload karke rewrite (PDF, Word, photo)
  - Job ad ke mutabiq tailoring aur keyword match
  - ATS score
  - Har bullet ke liye 3 options
  - Summary likhna
  - Skills ke suggestions
  - Cover letter
- **Login:** Google (aur email link). Bina login ke bhi resume ban kar download ho jata hai. AI aur cloud save ke liye login zaroori hai.
- **Kamai:** Har page par AdSense ke slots pehle se bane hue hain. Approval ke baad sirf IDs daalni hain.

Folder structure ke liye `README.md` dekhein.

---

## 1. Apne computer par chala kar dekhein (5 minute)

1. [Node.js](https://nodejs.org) 18 ya us se naya version install karein.
2. Folder mein terminal kholein:
   ```
   npm run dev:mock
   ```
3. Browser mein **http://localhost:8788** kholein.
   - `dev:mock` mein AI jawab nakli (fake) hote hain, taake bina API key ke poora app check ho sake.
   - Is mode mein login ki zaroorat band hoti hai. Iske liye `.env` file mein yeh line daalein, phir dobara chalayein:
     ```
     AI_REQUIRE_LOGIN=false
     ```
     **Yeh sirf local testing ke liye hai. Live site par kabhi `false` na karein.**

---

## 2. Domain lein

- Pakistan ke saath saath duniya bhar ki traffic (jahan ads zyada paisa dete hain) ke liye `.com` behtar hai.
- Short, yaad rehne wala naam chunein, jaise `cvforge.com` ya `resumebano.com`.
- **Cloudflare Registrar** se lein (sasta, aur DNS khud set ho jata hai), ya Namecheap se lein aur nameservers Cloudflare par kar dein.
- Naam badalna ho to Cloudflare ki setting `SITE_NAME` badal dein (step 7). Logo automatically naya naam dikhayega.

---

## 3. Code GitHub par daalein

1. github.com par nayi **private** repository banayein (maslan `resume-forge`).
2. Is folder mein:
   ```
   git remote add origin https://github.com/AAPKA-USERNAME/resume-forge.git
   git push -u origin main
   ```
   (Git history pehle se bani hui hai.)

---

## 4. Supabase (login + database) — free

1. [supabase.com](https://supabase.com) → **New project**.
   - Region: **Mumbai (ap-south-1)** ya **Singapore**, jo Pakistan ke qareeb hain.
   - Database password kahin mehfooz likh lein.
2. **SQL Editor** → New query → `supabase/schema.sql` ka poora content paste karein → **Run**. Isse yeh cheezein ban jati hain:
   - resumes table
   - security rules
   - AI limit functions
3. **Project Settings → API** se yeh teen cheezein copy karein:
   - `Project URL` → yeh aap ka `SUPABASE_URL` hai
   - `anon public` key → yeh aap ka `SUPABASE_ANON_KEY` hai
   - `service_role` key → yeh aap ka `SUPABASE_SERVICE_ROLE_KEY` hai. **Isay kabhi browser/code mein na daalein, sirf Cloudflare secret mein.**
4. **Authentication → URL Configuration** mein:
   - **Site URL:** `https://aapka-domain.com`
   - **Redirect URLs** mein yeh dono add karein:
     - `https://aapka-domain.com/auth/callback/`
     - `http://localhost:8788/auth/callback/`

---

## 5. "Continue with Google" login

1. [console.cloud.google.com](https://console.cloud.google.com) → naya project banayein.
2. **APIs & Services → OAuth consent screen:**
   - User type: **External**
   - App name aur support email bharein, logo lagayein (`public/img/icon-512.png`)
   - Authorized domains mein apna domain aur `supabase.co` daalein
   - Scopes mein sirf `email`, `profile`, `openid` rakhein
   - Aakhir mein **Publish app** dabayein
3. **Credentials → Create credentials → OAuth client ID → Web application:**
   - **Authorized JavaScript origins:** `https://aapka-domain.com`
   - **Authorized redirect URIs:** `https://XXXX.supabase.co/auth/v1/callback`. `XXXX` aap ke Supabase project ka ID hai; poora URL Supabase ke Google provider page par bhi likha hota hai.
4. Client ID aur Client Secret copy karein.
5. Supabase → **Authentication → Sign In / Providers → Google** → Enable → dono paste karein → Save.
6. Email link login khud se chalta hai. Lekin Supabase ka free email ghante mein sirf chand emails bhejta hai, is liye traffic aane par **Authentication → Emails → SMTP** mein Resend ya Brevo (dono ka free plan hai) laga dein.

---

## 6. AI key

**Option A — Claude (behtar quality, default):**
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key.
2. **Billing** mein thora credit daalein aur **monthly spend limit** zaroor set karein, maslan $20.
3. Default model `claude-haiku-4-5-20251001` hai, jo sasta aur tez hai.

**Option B — Google Gemini (sasta, free tier bhi hai):**
1. [aistudio.google.com](https://aistudio.google.com) → Get API key.
2. Settings mein `AI_PROVIDER=gemini` aur `GEMINI_API_KEY=...` daalein.
3. Dhyan rakhein ke Gemini ke free tier par Google aap ka data apne models behtar karne ke liye istemal kar sakta hai. Resumes mein logon ki zaati maloomat hoti hai, is liye paid tier behtar hai, aur privacy policy bhi usi hisaab se update karein.

---

## 7. Cloudflare Pages par deploy (free, ads ki ijazat hai)

> Vercel ka free (Hobby) plan sirf non-commercial kaam ke liye hai, aur ads commercial shumaar hote hain. Cloudflare Pages par static pages bilkul free aur unlimited hain, aur functions rozana 100,000 requests tak free hain.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git** → apni repo chunein.
2. Build settings:
   - Framework preset: **None**
   - Build command: `node build/build.mjs`
   - Build output directory: `dist`
3. **Environment variables (Production)** mein yeh variables daalein (nishani wali values ko **Encrypt/Secret** banayein):

| Name | Value |
|---|---|
| `SITE_URL` | `https://aapka-domain.com` (aakhir mein `/` na lagayein) |
| `SITE_NAME` | `Resume Forge` (ya aap ka brand) |
| `CONTACT_EMAIL` | aap ka email |
| `SUPABASE_URL` | step 4 se |
| `SUPABASE_ANON_KEY` | step 4 se |
| `SUPABASE_SERVICE_ROLE_KEY` 🔒 | step 4 se |
| `ANTHROPIC_API_KEY` 🔒 | step 6 se (ya `GEMINI_API_KEY` + `AI_PROVIDER=gemini`) |
| `AI_DAILY_CREDITS` | `30` (har user ko rozana kitne credits) |
| `AI_GLOBAL_DAILY_CREDITS` | `1500` (poori site ki rozana hadd, jo aap ke bill ko bachati hai) |
| `NODE_VERSION` | `20` |

4. **Save and Deploy.**
5. **Custom domains → Set up a custom domain** → apna domain daalein. Agar domain Cloudflare par hai to DNS khud ban jata hai.
6. **Zaroori baat:** Public values (SITE_URL, Supabase keys, AdSense IDs) build ke waqt pages mein likh di jati hain. Inko badalne ke baad **Deployments → Retry deployment** zaroor karein.

### Live hone ke baad yeh check karein
- [ ] Home page khulta hai aur templates ki previews nazar aati hain.
- [ ] Builder mein type karne par preview badalta hai, aur reload ke baad bhi data rehta hai.
- [ ] **Download → PDF**: print window aata hai, "Save as PDF" se PDF banta hai aur us ka text select ho sakta hai.
- [ ] **Download → Word** se file khulti hai.
- [ ] **Sign in → Continue with Google** ke baad aap wapas site par aa jate hain.
- [ ] AI tools → **Improve with AI** kaam karta hai aur "left today" credits kam hote hain.
- [ ] Dashboard par resume save hota hai, aur Share link kisi doosre phone par khulta hai.
- [ ] `https://aapka-domain.com/sitemap.xml` aur `/robots.txt` khulte hain.

---

## 8. Google Search par lana (SEO)

1. [Google Search Console](https://search.google.com/search-console) → **Add property → Domain**. Domain Cloudflare par hai to verification ek click mein ho jati hai.
2. **Sitemaps** → `sitemap.xml` submit karein. Is mein 48 pages hain.
3. **URL Inspection** → home page → **Request indexing**. Yahi kaam `/templates/` aur 3–4 CV example pages ke liye bhi karein.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters) → "Import from Google Search Console".
5. **Keywords** jin ke liye pages bane hue hain:
   - free resume builder, CV maker
   - resume templates, ATS resume checker
   - cover letter generator
   - "accountant CV example" jaise job-wise searches
6. **Traffic badhane ka plan:**
   - **Har hafte 2–3 naye CV example pages** banayein (`src/shared/examples.mjs` mein entry add karein). Maslan: doctor, pharmacist, electrician, driver, receptionist, bank officer, web developer, civil engineer (Gulf), content writer, call centre, internship. Har job ki talaash karne wale log is site par aa sakte hain.
   - **Urdu/Roman Urdu content:** "CV kaise banayein", "fresh graduate CV format" jaise blog posts ya YouTube/TikTok shorts banayein, jin mein site ka link ho.
   - **University groups:** Facebook/WhatsApp groups (FAST, NUST, COMSATS, PU…) aur LinkedIn par share karein. Share link feature se har resume khud site ki advertising karta hai.
   - Google ko results dikhane mein aam taur par 2–8 hafte lagte hain. Search Console mein "Performance" dekhte rahein.

---

## 9. Ads se kamai (Google AdSense)

1. **Pehle** kuch hafte traffic aur content aane dein. AdSense ke liye custom domain, privacy policy, about aur contact pages (sab bane hue hain) aur original content chahiye.
2. [adsense.google.com](https://adsense.google.com) → site add karein → approval ka intezar karein. Is mein aam taur par kuch din se kuch hafte lagte hain.
3. Approval ke baad Cloudflare mein:
   - `ADSENSE_CLIENT` = `ca-pub-XXXXXXXXXXXXXXXX`. Isse `ads.txt` khud ban jati hai.
   - AdSense mein **Ads → By ad unit → Display ads** se 6 units banayein aur un ke slot IDs yahan daalein:
     - `ADSENSE_SLOT_HOME`
     - `ADSENSE_SLOT_GALLERY`
     - `ADSENSE_SLOT_TEMPLATE`
     - `ADSENSE_SLOT_EXAMPLE`
     - `ADSENSE_SLOT_BUILDER`
     - `ADSENSE_SLOT_COVER`
   - Phir **Retry deployment** karein.
4. Ads ki jagahein soch samajh kar rakhi gayi hain: pages ke darmiyan, gallery, aur builder ke editor ke neeche. Resume ya PDF ke andar kabhi ad nahi aata.
5. **Auto ads** on karne hon to AdSense mein `/builder/` ko **exclude** karein, warna ads editor ke beech mein aa sakte hain.
6. Europe/UK visitors ke liye **Privacy & messaging → European regulations message** on karein. Yeh consent popup AdSense khud dikhata hai.
7. Pehle local page dekhna ho ke ad kahan aayega, to `.env` mein `SHOW_AD_PLACEHOLDERS=1` daal kar `npm run dev:mock` chalayein.

---

## 10. Kharcha aur kamai ka hisaab (imandari se)

**AI credits:**
- Import, improve aur tailor = 3 credits
- ATS check aur cover letter = 2 credits
- Ek line ka rewrite = 1 credit
- Har user ko rozana 30 credits milte hain.

**Claude Haiku 4.5 ki qeemat:** taqreeban $1 har 10 lakh input tokens, aur $5 har 10 lakh output tokens. Is hisaab se:

| Kaam | Andaazan kharcha |
|---|---|
| Ek poori CV import/rewrite | ~$0.02 (≈ 5–6 PKR) |
| ATS check / cover letter | ~$0.01 |
| Ek bullet rewrite | ~$0.002 |
| Site-wide cap `AI_GLOBAL_DAILY_CREDITS=1500` | zyada se zyada ~$10/din |

- **Ads ki kamai:** Pakistan ki traffic par RPM (har 1000 page views ki kamai) kam hota hai, aksar $1 se kam. US/UK/Gulf ki traffic par kai guna zyada hota hai. Is liye:
  - Shuru mein `AI_GLOBAL_DAILY_CREDITS` kam rakhein (500–1500). Anthropic mein monthly limit set rakhein.
  - Traffic aur kamai barhne ke saath limit barhayein.
  - English content aur CV examples ko Gulf aur international jobs ke liye bhi likhein, taake zyada paisa dene wali traffic aaye.
- **Cloudflare:**
  - Free plan par har function call ke liye 10ms CPU time milta hai. Hamare functions zyada tar AI ka intezar karte hain, jo CPU time mein nahi ginta.
  - Traffic barhne par ($5/mahina) **Workers Paid** le lein. Is se limits bahut barh jati hain.
- **Supabase:** Free plan (500MB database) hazaron resumes ke liye kaafi hai.

> Yeh qeematein aaj ke andaazay hain. Launch se pehle anthropic.com/pricing aur Cloudflare/Supabase ke pricing pages zaroor dekh lein.

---

## 11. Customize karna

- **Naam, email, domain:** Cloudflare env vars badlein (ya `site.config.mjs`).
- **Rang (brand colours):** `src/styles/site.css` ke shuru mein `--accent`, `--gold` aur `--hero` badlein.
- **Naya template:** `README.md` → "Adding a template" dekhein.
- **Home page ka text:** `src/pages/pages.mjs` → `homePage()`.
- **AI ka andaaz ya qawaid:** `server/prompts.mjs`.
- **Social image:** `public/img/og.png` (1200×630) badal dein.

---

## 12. Masail aur hal

| Masla | Hal |
|---|---|
| Google login ke baad "redirect_uri_mismatch" | Google Cloud mein redirect URI bilkul `https://XXXX.supabase.co/auth/v1/callback` ho |
| Login ke baad localhost par chala jata hai | Supabase → URL Configuration → Site URL aur Redirect URLs mein apna domain |
| "AI is not switched on" | `ANTHROPIC_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` set karein → Retry deployment |
| "AI limits are not configured" | `SUPABASE_SERVICE_ROLE_KEY` missing hai |
| Env var badla lekin site par asar nahi | Retry deployment (public values build mein likhi jati hain) |
| PDF mein rang nahi aa rahe | Print window mein **Background graphics** on karein |
| Purani .doc file nahi khulti | Word mein .docx ya PDF bana kar upload karein |
| Scanned CV ka text nahi aata | AI (login ke baad) photo khud parh leta hai. Bina login ke text paste karein |

---

## 13. Qanooni note

Privacy policy aur terms ek achha template hain, lekin aap ke business ke hisaab se inko ek dafa zaroor parh kar theek karein, maslan AI provider ka naam aur rabta ka email. Main vakeel nahi hoon. Europe ke users ke liye AdSense ka consent message on rakhein.
