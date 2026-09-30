# Resume Forge — Launch Guide (step by step)

Poori website **sirf ek free Cloudflare account** par chalti hai:

| Kaam | Kis cheez se | Kharcha |
|---|---|---|
| Website (pages) | Cloudflare Pages | Free, unlimited |
| API (login, save, AI) | Cloudflare Pages Functions | Free: 100,000 requests/din |
| AI | **Cloudflare Workers AI** (built-in; na API key, na license) | Free: 10,000 "neurons"/din |
| Database | **Cloudflare D1** | Free: 5 GB |
| Google login | Google Cloud "OAuth client" (sirf setting) | Free |

Na koi npm package, na Supabase, na OpenAI/Claude key. Paid cheez sirf **domain** hai (~$10/saal).

---

## 0. AI kaise kaam karta hai

- **Model:** Mistral Small 3.1 (24B). Yeh open-source hai (Apache 2.0 license, yani commercial istemal free). Yeh Cloudflare ke servers par chalta hai. Aap ko sirf project mein ek "AI binding" jorni hoti hai; koi key nahi.
- **Free hadd:** Rozana 10,000 neurons. Andaazan:

| Kaam | Neurons (taqreeban) | Free plan mein rozana |
|---|---|---|
| Poori CV import/rewrite/tailor | ~250 | ~35–40 |
| AI review / cover letter | ~120 | ~80 |
| Ek bullet rewrite | ~30 | ~300 |

  Yeh sab milakar hain, yani poori site ke liye ek din ka total.
- **Bill kabhi nahi aayega:** Free plan par limit poori hone ke baad AI us din band ho jata hai. Visitor ko message milta hai: *"Aaj ki free AI capacity khatam, kal try karein"*. Baqi site (templates, editor, PDF/Word download) chalti rehti hai.
- **Credits:** Har visitor ko rozana guest credits milte hain (default 6). Google se sign in karne par zyada milte hain (default 15). Poori site ki rozana hadd `AI_GLOBAL_DAILY_CREDITS` hai (default 100, jo 10,000 neurons ke andar rehti hai).
- **Bilkul free, unlimited extras:**
  - **Instant check:** Resume ka score aur ghaltiyan browser hi mein nikalta hai, AI ke baghair. Builder mein upar "Score" chip par click karein.
  - **Chrome ka built-in AI:** Jin users ke Chrome mein on-device AI mojood hai, un ke liye ek-line rewrites unhi ke computer par ho jate hain aur koi credit nahi lagta.

---

## 1. Apne computer par chala kar dekhein

1. [Node.js](https://nodejs.org) **22 ya naya** install karein.
2. Folder mein terminal kholein:
   ```
   npm run dev:mock
   ```
3. **http://localhost:8788** kholein. Is mode mein:
   - AI ke jawab nakli (fake) hote hain.
   - "Sign in" dabane par ek **test user** login ho jata hai, Google ki zaroorat nahi.
   - Database `.local/dev.sqlite` file mein banta hai.

   Isse aap poori site check kar sakte hain: builder, save, dashboard, share link, sab.

(Asli Workers AI local par chalana ho to `.env` mein `CF_ACCOUNT_ID` aur `CF_API_TOKEN` daal kar `npm run dev` chalayein. Yeh zaroori nahi hai.)

---

## 2. Domain lein

- `.com` behtar hai, kyunke Pakistan ke saath saath Gulf, UK aur US se bhi traffic aa sakti hai, jahan ads zyada paisa dete hain.
- **Cloudflare Registrar** se lein. Wahan sabse sasta milta hai aur DNS khud set ho jata hai.

---

## 3. Code GitHub par daalein

1. github.com par nayi **private** repository banayein.
2. Folder mein yeh chalayein (Git history pehle se bani hui hai):
   ```
   git remote add origin https://github.com/AAPKA-USERNAME/resume-forge.git
   git push -u origin main
   ```

---

## 4. Cloudflare Pages project

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git** → apni repo chunein.
2. Build settings:
   - Framework preset: **None**
   - Build command: `node build/build.mjs`
   - Build output directory: `dist`
3. **Save and Deploy.** Pehli deploy mein AI aur login abhi band honge; agle steps mein chalu honge.

---

## 5. Database (D1)

1. Cloudflare → **Storage & Databases → D1 SQL Database → Create**. Naam rakhein `resume-forge-db`.
2. Database kholein → **Console** → `db/schema.sql` ka poora content paste karein → **Execute**.
3. Pages project → **Settings → Bindings → Add → D1 database**:
   - Variable name: **`DB`**
   - Database: `resume-forge-db`

## 6. AI (Workers AI)

1. Pages project → **Settings → Bindings → Add → Workers AI**.
2. Variable name: **`AI`**.

Bas itna hi. Koi key ya license nahi chahiye.

> Agar Cloudflare ka menu thora mukhtalif ho to "Bindings" aam taur par **Settings → Functions** ke andar hota hai.

---

## 7. "Continue with Google" login

1. [console.cloud.google.com](https://console.cloud.google.com) → naya project banayein.
2. **APIs & Services → OAuth consent screen:**
   - User type: **External**
   - App name, support email aur logo (`public/img/icon-512.png`) bharein
   - Authorized domain mein apna domain daalein
   - Scopes: `openid`, `email`, `profile`
   - Aakhir mein **Publish app**
3. **Credentials → Create credentials → OAuth client ID → Web application:**
   - **Authorized JavaScript origins:** `https://aapka-domain.com`
   - **Authorized redirect URIs:**
     - `https://aapka-domain.com/api/auth/callback`
     - (optional) `https://PROJECT.pages.dev/api/auth/callback`
4. Client ID aur Client Secret copy karein. Step 8 mein kaam aayenge.

---

## 8. Settings (variables)

Pages project → **Settings → Variables and Secrets** (Production). 🔒 wale variables ko **Secret/Encrypt** type mein daalein.

| Name | Value |
|---|---|
| `SITE_URL` | `https://aapka-domain.com` (aakhir mein `/` na lagayein) |
| `SITE_NAME` | `Resume Forge` (ya aap ka brand) |
| `CONTACT_EMAIL` | aap ka email |
| `GOOGLE_CLIENT_ID` | step 7 se |
| `GOOGLE_CLIENT_SECRET` 🔒 | step 7 se |
| `SESSION_SECRET` 🔒 | 40+ random characters (koi bhi lambi random line; kisi ko na batayein) |
| `AI_DAILY_CREDITS` | `15` (signed-in users) |
| `AI_GUEST_DAILY_CREDITS` | `6` (bina login; `0` karein to AI ke liye login zaroori ho jayega) |
| `AI_GLOBAL_DAILY_CREDITS` | `100` (poori site; free plan ke andar) |
| `NODE_VERSION` | `22` |

Phir:
1. **Deployments → Retry deployment** karein. Yeh zaroori hai, kyunke kuch values build ke waqt pages mein likhi jati hain.
2. **Custom domains → Set up a custom domain** mein apna domain jor dein.

### Live hone ke baad yeh check karein
- [ ] Home page aur templates ki previews nazar aati hain.
- [ ] Builder mein type karne par preview badalta hai, aur reload ke baad bhi data rehta hai.
- [ ] Upar "Score" chip par click karne se instant check aata hai.
- [ ] **Improve with AI** kaam karta hai aur AI tools tab mein "credits left" kam hote hain.
- [ ] **Sign in → Continue with Google** ke baad aap wapas site par aate hain aur avatar nazar aata hai.
- [ ] "Save to my account" dabayein → Dashboard mein resume dikhta hai → Share link kisi doosre phone par khulta hai.
- [ ] **Download → PDF**: text select ho sakta hai. **Word** file bhi khulti hai.
- [ ] CV ki **photo** upload karke dekhein. Agar AI photo na parh sake to site khud visitor ko PDF/Word upload karne ka kehti hai.

---

## 9. Google Search par lana (SEO)

1. [Google Search Console](https://search.google.com/search-console) → Add property → **Domain** (Cloudflare par verification ek click mein).
2. **Sitemaps** → `sitemap.xml` submit karein (48 pages).
3. **URL Inspection** → home page, `/templates/` aur 3–4 CV example pages → **Request indexing**.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters) → "Import from Google Search Console".
5. **Har hafte 2–3 naye CV example pages** banayein (`src/shared/examples.mjs` mein entry add karein): doctor, pharmacist, electrician, driver, receptionist, bank officer, web developer, content writer, call centre, internship… Har page us job ki talaash karne walon ko site par la sakta hai.
6. Urdu/Roman Urdu mein short videos ("CV kaise banayein") banayein, aur university Facebook/WhatsApp groups aur LinkedIn par share karein. Share link feature se har resume khud site ki advertising karta hai.

---

## 10. Ads se kamai (AdSense)

1. Pehle kuch hafte traffic aane dein.
2. [adsense.google.com](https://adsense.google.com) par site add karein. Privacy, terms, about aur contact pages pehle se bane hue hain.
3. Approval ke baad variables mein yeh daalein:
   - `ADSENSE_CLIENT` = `ca-pub-…`
   - 6 ad units ke slot IDs:
     - `ADSENSE_SLOT_HOME`
     - `ADSENSE_SLOT_GALLERY`
     - `ADSENSE_SLOT_TEMPLATE`
     - `ADSENSE_SLOT_EXAMPLE`
     - `ADSENSE_SLOT_BUILDER`
     - `ADSENSE_SLOT_COVER`

   Phir **Retry deployment** karein. `ads.txt` khud ban jati hai.
4. **Auto ads** on karein to `/builder/` ko exclude karein. Europe/UK ke visitors ke liye AdSense ka consent message on rakhein.

---

## 11. Jab traffic barhe (optional)

- **Workers Paid ($5/mahina):** Rozana 10,000 free neurons ke baad AI ka kharcha **$0.011 har 1,000 neurons** hai. Yani ek poori CV rewrite taqreeban **$0.003 (≈1 rupaya)** ki hai. Tab `AI_GLOBAL_DAILY_CREDITS` barha dein, maslan 100 ki jagah 2000. Ads ki kamai is se kahin zyada honi chahiye.
- **Behtar quality chahiye:** `AI_MODEL` badal kar koi aur Workers AI model aazma sakte hain, maslan `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Is ka alag license (Llama) hai aur yeh mehenga hai.
- **Claude API (paid):** Chahein to `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` daal dein. Code pehle se support karta hai.

> Neurons ki qeemat aur models Cloudflare badal sakta hai. Launch se pehle [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) dekh lein.

---

## 12. Customize karna

- **Naam, email, domain:** variables.
- **Rang:** `src/styles/site.css` ke shuru mein `--accent`, `--gold` aur `--hero`.
- **Naya template:** `README.md` dekhein.
- **Home page ka text:** `src/pages/pages.mjs`.
- **AI ke qawaid:** `server/prompts.mjs`.
- **Instant check ke rules:** `src/shared/lint.mjs`.

---

## 13. Masail aur hal

| Masla | Hal |
|---|---|
| Google: "redirect_uri_mismatch" | Google Cloud mein bilkul `https://aapka-domain.com/api/auth/callback` ho (http/https aur www ka farq bhi dekhein) |
| Login button nazar nahi aata | `GOOGLE_CLIENT_ID` set karein → Retry deployment |
| "Sign-in isn't fully set up" | `GOOGLE_CLIENT_SECRET` ya `DB` binding missing hai |
| "AI is not switched on" | `AI` binding (Workers AI) add karein → Retry deployment |
| "Today's free AI capacity is used up" | Free 10,000 neurons khatam. Kal khud theek ho jayega, ya Workers Paid le lein |
| Save nahi hota / Dashboard khali | `DB` binding aur `db/schema.sql` check karein |
| Variable badla lekin asar nahi | Retry deployment |
| PDF mein rang nahi | Print window mein **Background graphics** on karein |

---

## 14. Qanooni note

Privacy policy aur terms templates hain. Inko ek dafa zaroor parh kar apne hisaab se theek karein. Main vakeel nahi hoon.
