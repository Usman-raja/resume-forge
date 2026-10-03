# Resume Forge — Project Summary (Owner ke liye)

> Yeh file aap ka "record" hai. Claude ki chat ya subscription khatam ho jaye tab bhi website chalti rahegi, aur yeh file GitHub par hamesha rahegi.

**Live website:** https://resume-forge-80s.pages.dev
**Code (GitHub):** https://github.com/Usman-raja/resume-forge (branch `main`)
**Support email:** resumeforge.support@gmail.com

---

## 1. Website kya karti hai
- 26 professional resume templates (ATS-friendly, photo wale, two-column waghaira)
- Purani CV upload karein (PDF, Word, photo ya text). AI usay parh kar editor mein bhar deta hai aur behtar likh deta hai.
- AI tools:
  - Bullet points rewrite
  - Poora resume improve karna
  - Job ad ke mutabiq tailor karna
  - ATS score (100 mein se)
  - Cover letter generator
- Downloads (login ke baad):
  - PDF: seedha download, printer wali window nahi
  - Word (.docx)
  - Plain text
  - Backup file
- Google se login, resumes cloud mein save, dashboard, aur share link
- SEO pages: templates, 13 CV examples, ATS checker, cover letter generator, sitemap
- Mobile, laptop aur PC teeno par check kiya hua

## 2. Stack (kis cheez se bani hai)
| Hissa | Kya use hua | Kharcha |
|---|---|---|
| Website hosting | **Cloudflare Pages** (static site, `node build/build.mjs` → `dist/`) | Free |
| Backend / API | **Cloudflare Pages Functions** (`functions/api/` → `server/`) | Free |
| AI | **Cloudflare Workers AI**, model `mistral-small-3.1-24b-instruct`, koi API key nahi | Free (10,000 neurons/din) |
| Database | **Cloudflare D1** (SQLite): users, sessions, resumes, ai_usage | Free |
| Login | **Google OAuth**, apna code `server/auth.mjs` mein | Free |
| Code | **GitHub**: Usman-raja/resume-forge | Free |
| Google search | **Google Search Console** (verify ho chuka, sitemap submit) | Free |
| Libraries | Koi framework nahi. Plain JavaScript, koi npm runtime dependency nahi. | — |

**Accounts (sab aap ke apne hain):**
- Cloudflare: faridi0786786@gmail.com. Project `resume-forge`, database `resume-forge-db`.
- Google Cloud: OAuth client "Resume Forge Web"
- Google Search Console: `https://resume-forge-80s.pages.dev`
- GitHub: Usman-raja

**Secrets** sirf Cloudflare mein rakhe hain. Yeh kabhi kisi ko na dein:
- `SESSION_SECRET`
- `GOOGLE_CLIENT_SECRET`
- Cloudflare API token

## 3. Faide (benefits)
- **100% free chalti hai.** Koi credit card nahi laga, is liye koi surprise bill nahi aa sakta.
- **Fast aur mehfooz:** Cloudflare ka global network, HTTPS, aur session cookie HttpOnly.
- **Privacy:** CV file browser mein hi parhi jati hai. AI ko sirf text jata hai (scanned CV ya photo ho to page ki tasveer). Asal IP address save nahi hota.
- **ATS-friendly PDF:** dekhne mein template jaisi, aur andar asli text bhi hai jo job portals parh lete hain.
- **Koi watermark nahi**, aur bina sign-up ke resume banana shuru kar sakte hain.
- **Claude ke baghair bhi chalti hai.** Website Cloudflare par hai, Claude par nahi. Koi bhi developer GitHub se code le kar kaam kar sakta hai.

## 4. Kab tak free?
**Hamesha**, jab tak free limits ke andar rahein. Limits rozana reset hoti hain.

| Cheez | Free limit | Matlab |
|---|---|---|
| Website pages | Unlimited | Jitne marzi log aayein |
| API (login, save, AI calls) | 100,000 requests/din | Hazaron users rozana |
| Database | 5 GB, 5 million reads/din | Lakhon resumes |
| **AI** | 10,000 neurons/din | **Sab se pehle yahi limit khatam hogi** |

- Site ne AI ke liye apni hadd rakhi hai: poori site ke liye **100 AI credits rozana**, har user ke 15 aur guest ke 6. Yeh `wrangler.toml` mein hai.
- Limit poori hone par AI us din ke liye ruk jata hai aur user ko saaf message milta hai. Baqi site (editor, templates, downloads) chalti rehti hai.
- **Jab users barh jayein:** Cloudflare Workers Paid plan (**$5/mahina**) lene se AI ki limit kaafi barh jati hai. Yeh sirf tab karein jab zaroorat ho.
- **Apna domain** (`.com` ya `.pk`): takreeban $10–15/saal. Yeh optional hai magar AdSense ke liye zaroori hai.

## 5. Agle steps
1. **Google Search Console**
   - Home page ke liye "Request indexing" dabayein.
   - 2–3 din baad Sitemaps dekhein. Agar "Couldn't fetch" rahe to remove karke `sitemap.xml?v=2` submit karein.
2. **Traffic dekhna:** Cloudflare → Workers & Pages → resume-forge → Metrics → **Web Analytics → Enable**.
3. **Promotion:** neeche diye gaye posts LinkedIn, WhatsApp aur Facebook par share karein. Dosto se feedback lein.
4. **Apna domain lein.** Phir Cloudflare Pages → Custom domains mein add karein. Is ke baad:
   - `SITE_URL` badlein
   - Google OAuth mein naya redirect URI add karein
   - Site dobara build aur deploy karein

   Tafseel `LAUNCH-GUIDE.md` section 9 mein hai.
5. **AdSense** (domain ke baad): `LAUNCH-GUIDE.md` section 10. AdSense `pages.dev` jaise subdomain par approve nahi hota, is liye pehle apna domain zaroori hai.
6. **Faisla baqi hai:** 13 CV example pages ke naam Pakistani se Western karne hain ya nahi.
7. Optional: Google Analytics (Measurement ID `G-...`) aur admin page (users aur resumes ki list).

## 6. Code mein kaam kaise karein (developer ya Claude ke liye)
- `npm test`: build karke self-test chalata hai. Har deploy se pehle pass hona chahiye.
- `npm run dev:mock`: local site http://localhost:8788 par, fake AI aur test login ke saath.
- Deploy:
  ```
  SITE_URL=https://resume-forge-80s.pages.dev GOOGLE_CLIENT_ID=<id> node build/build.mjs
  npx wrangler pages deploy dist --project-name resume-forge --branch main
  ```
- Claude Code mein `/deploy` likhne se yeh sab khud ho jata hai. Rules `CLAUDE.md` mein hain.

---

## 7. Social media posts

**Pictures** `marketing/` folder mein hain (GitHub par bhi):
| Picture | Kahan lagayein |
|---|---|
| `1-linkedin-main.png` | LinkedIn post ki main picture |
| `2-before-after.png` | LinkedIn: 2nd picture (carousel) ya alag post |
| `3-templates.png` | LinkedIn ya Facebook: 3rd picture |
| `4-whatsapp-post.png` | WhatsApp groups (Roman Urdu) |
| `5-whatsapp-status.png` | WhatsApp, Instagram ya Facebook Status/Story |

### LinkedIn (English)
> 🚀 **I just launched Resume Forge, a 100% free AI resume builder.**
>
> Most "free" resume sites add a watermark or ask for payment at the download step. I wanted to build one that is actually free.
>
> ✅ Upload your old CV (PDF, Word or even a photo). AI reads it and rewrites it stronger
> ✅ 26 professional, ATS-friendly templates
> ✅ Tailor your resume to any job ad and get an ATS score out of 100
> ✅ Free AI cover letter generator
> ✅ Download as PDF or Word, with no watermark
> ✅ Works on mobile
>
> Built for job seekers in Pakistan, the Gulf and everywhere else. Freshers, nurses, accountants, engineers, sales, IT.
>
> Try it here 👉 https://resume-forge-80s.pages.dev
>
> I'd really value your feedback. If it helps you or someone you know, please share it. 🙏
>
> #resume #cv #jobsearch #careers #AI #Pakistan #hiring #freshers #ATS

### WhatsApp (Roman Urdu, short)
> *Free CV / Resume banayein, AI ke saath* 📄✨
>
> Apni purani CV upload karein (PDF, Word ya photo). AI usay parh kar professional bana deta hai ✅
>
> 🔹 26 khoobsurat templates
> 🔹 Job ke mutabiq CV tailor + ATS score
> 🔹 Free cover letter
> 🔹 PDF / Word download, *koi watermark nahi*
> 🔹 Mobile par bhi chalta hai
>
> Bilkul *FREE* 👇
> https://resume-forge-80s.pages.dev
>
> Job dhoondne wale dosto aur family groups mein zaroor share karein 🙏

### WhatsApp Status (one line)
> CV banani hai? 2 minute mein AI se professional CV banayein, bilkul free, koi watermark nahi 👉 https://resume-forge-80s.pages.dev
