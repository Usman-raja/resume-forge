// HTML shell shared by every generated page.
import SITE from "../../site.config.mjs";
import { GOOGLE_FONTS_URL } from "../shared/templates.mjs";
import { esc } from "../shared/render.mjs";

export { SITE, esc };
export const UI_FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";

export const LOGO_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="2" width="21" height="28" rx="4" fill="#14624e"/><path d="M19 2h2l8 8v16a4 4 0 0 1-4 4h-6z" fill="#0f4b3c"/><path d="M21 2v6a2 2 0 0 0 2 2h6z" fill="#f0bf5a"/><rect x="9" y="9" width="9" height="2.6" rx="1.3" fill="#fff"/><rect x="9" y="15" width="12" height="2" rx="1" fill="#fff" opacity=".75"/><rect x="9" y="19.5" width="10" height="2" rx="1" fill="#fff" opacity=".75"/><rect x="9" y="24" width="7" height="2" rx="1" fill="#fff" opacity=".75"/></svg>`;

export const logo = (cls = "") => `<a class="logo ${cls}" href="/" aria-label="${esc(SITE.name)} home">${LOGO_SVG}<span class="txt">${esc(SITE.name.split(" ")[0])} <b>${esc(SITE.name.split(" ").slice(1).join(" ") || "")}</b></span></a>`;

export function publicConfig() {
  return {
    siteName: SITE.name, siteUrl: SITE.url,
    authEnabled: SITE.authEnabled, devLogin: SITE.devLogin,
    aiEnabled: SITE.aiEnabled, aiRequireLogin: SITE.aiRequireLogin, aiDailyLimit: SITE.aiDailyCredits, aiGuestLimit: SITE.aiGuestCredits,
    adsenseClient: SITE.adsenseClient, adSlots: SITE.adSlots, showAdPlaceholders: SITE.showAdPlaceholders
  };
}

const NAV = [
  ["/templates/", "Templates"],
  ["/cv-examples/", "CV Examples"],
  ["/ats-resume-checker/", "ATS Checker"],
  ["/cover-letter-generator/", "Cover Letter"]
];

export function header(path) {
  return `<header class="site-header"><div class="wrap">
  ${logo()}
  <nav class="nav" aria-label="Main">${NAV.map(([h, l]) => `<a href="${h}"${path.startsWith(h) ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
  <div class="header-cta"><div class="user-slot"></div><a class="btn btn-primary btn-hide-m" href="/builder/">Build my resume</a>
  <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div>
  </div><nav class="mobile-nav" hidden aria-label="Mobile">${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}<a href="/dashboard/">My resumes</a><a class="btn btn-primary" href="/builder/" style="margin-top:6px">Build my resume — free</a></nav></header>`;
}

export function footer() {
  const y = new Date().getFullYear();
  return `<footer class="site-footer"><div class="wrap">
  <div class="foot-grid">
    <div style="display:grid;gap:14px;align-content:start">${logo()}<p style="max-width:30em">Free AI resume builder with ${"26"} designer templates. Upload your old CV, let AI rewrite it, download as PDF or Word. No watermarks, no paywall.</p></div>
    <div><h4>Build</h4><ul><li><a href="/builder/">Resume builder</a></li><li><a href="/builder/?open=import">Upload & improve CV</a></li><li><a href="/cover-letter-generator/">Cover letter generator</a></li><li><a href="/ats-resume-checker/">ATS resume checker</a></li></ul></div>
    <div><h4>Explore</h4><ul><li><a href="/templates/">Resume templates</a></li><li><a href="/templates/?f=ats">ATS-friendly templates</a></li><li><a href="/templates/?f=photo">CV templates with photo</a></li><li><a href="/cv-examples/">CV examples</a></li></ul></div>
    <div><h4>Company</h4><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/privacy/">Privacy policy</a></li><li><a href="/terms/">Terms of use</a></li></ul></div>
  </div>
  <div class="foot-note"><span>© ${y} ${esc(SITE.name)}. All templates and AI tools are free.</span><span>Made for job seekers in Pakistan and around the world.</span></div>
  </div></footer>`;
}

export function page({ path, title, description, body, scripts = [], css = [], resumeFonts = false, noindex = false, jsonld = [], bodyClass = "", chrome = true, ogImage = "/img/og.png" }) {
  const canonical = SITE.url + path;
  const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
  const cfg = JSON.stringify(publicConfig()).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? `<meta name="robots" content="noindex,follow">` : `<link rel="canonical" href="${esc(canonical)}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(SITE.url + ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0c231d">
${SITE.googleVerification ? `<meta name="google-site-verification" content="${esc(SITE.googleVerification)}">` : ""}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/icon-192.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${resumeFonts ? GOOGLE_FONTS_URL : UI_FONTS}">
<link rel="stylesheet" href="/css/site.css?v=__V__">
${css.map(c => `<link rel="stylesheet" href="/css/${c}?v=__V__">`).join("\n")}
<script>window.RF_CONFIG=${cfg};</script>
${SITE.adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(SITE.adsenseClient)}" crossorigin="anonymous"></script>` : ""}
${SITE.gaId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(SITE.gaId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${esc(SITE.gaId)}");</script>` : ""}
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
${chrome ? header(path) : ""}
${body}
${chrome ? footer() : ""}
<script type="module" src="/js/common.mjs"></script>
${scripts.map(s => `<script type="module" src="/js/${s}"></script>`).join("\n")}
</body>
</html>`;
}

export function adSlot(name) {
  const slot = SITE.adSlots[name];
  if (SITE.adsenseClient && slot) return `<div class="wrap"><div class="ad-slot"><div class="ad-label">Advertisement</div><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(SITE.adsenseClient)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div></div>`;
  return SITE.showAdPlaceholders ? `<div class="wrap"><div class="ad-slot placeholder">Ad space · ${esc(name)}</div></div>` : "";
}

export const breadcrumbLD = items => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE.url + path }))
});
