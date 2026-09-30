// Static site build: node build/build.mjs  →  dist/
// No npm packages needed. Cloudflare Pages runs this with its default Node version.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

// Allow a local .env file for convenience (KEY=value lines).
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { default: SITE } = await import("../site.config.mjs");
const P = await import("../src/pages/pages.mjs");
const { TEMPLATES } = await import("../src/shared/templates.mjs");
const { EXAMPLES } = await import("../src/shared/examples.mjs");

const t0 = Date.now();
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
copyDir(path.join(ROOT, "public"), DIST);
copyDir(path.join(ROOT, "src/client"), path.join(DIST, "js"));
copyDir(path.join(ROOT, "src/shared"), path.join(DIST, "js/shared"));
copyDir(path.join(ROOT, "src/styles"), path.join(DIST, "css"));

// Cache-busting version from the contents of CSS + JS
const hash = crypto.createHash("sha1");
for (const dir of ["css", "js", "js/shared"]) {
  for (const f of fs.readdirSync(path.join(DIST, dir)).sort()) {
    const p = path.join(DIST, dir, f);
    if (fs.statSync(p).isFile()) hash.update(fs.readFileSync(p));
  }
}
const V = hash.digest("hex").slice(0, 10);

const pages = [];
function write(urlPath, html, { sitemap = true, priority = 0.6 } = {}) {
  const file = urlPath === "/404" ? path.join(DIST, "404.html") : path.join(DIST, urlPath, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html.replaceAll("__V__", V));
  if (sitemap) pages.push({ url: urlPath, priority });
}

write("/", P.homePage(), { priority: 1.0 });
write("/templates/", P.templatesPage(), { priority: 0.9 });
for (const t of TEMPLATES) write(`/templates/${t.id}/`, P.templateDetailPage(t), { priority: 0.8 });
write("/cv-examples/", P.examplesPage(), { priority: 0.9 });
for (const slug of Object.keys(EXAMPLES)) write(`/cv-examples/${slug}/`, P.exampleDetailPage(slug), { priority: 0.8 });
write("/builder/", P.builderPage(), { priority: 0.9 });
write("/ats-resume-checker/", P.atsPage(), { priority: 0.8 });
write("/cover-letter-generator/", P.coverLetterPage(), { priority: 0.8 });
write("/about/", P.aboutPage(), { priority: 0.3 });
write("/contact/", P.contactPage(), { priority: 0.3 });
write("/privacy/", P.privacyPage(), { priority: 0.2 });
write("/terms/", P.termsPage(), { priority: 0.2 });
write("/dashboard/", P.dashboardPage(), { sitemap: false });
write("/login/", P.loginPage(), { sitemap: false });
write("/auth/callback/", P.callbackPage(), { sitemap: false });
write("/r/", P.sharePage(), { sitemap: false });
write("/404", P.notFoundPage(), { sitemap: false });

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(p => `  <url><loc>${SITE.url}${p.url}</loc><lastmod>${today}</lastmod><priority>${p.priority.toFixed(1)}</priority></url>`).join("\n") +
  `\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /login/\nDisallow: /auth/\nDisallow: /r/\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
if (SITE.adsenseClient) {
  const pub = SITE.adsenseClient.replace(/^ca-/, "");
  fs.writeFileSync(path.join(DIST, "ads.txt"), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
}
fs.writeFileSync(path.join(DIST, "site.webmanifest"), JSON.stringify({
  name: SITE.name, short_name: SITE.name.split(" ")[0], start_url: "/builder/", display: "standalone",
  background_color: "#0c231d", theme_color: "#0c231d",
  icons: [{ src: "/img/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/img/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }]
}, null, 2));

// Cloudflare Pages headers + redirects
fs.writeFileSync(path.join(DIST, "_headers"), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN

/vendor/*
  Cache-Control: public, max-age=604800

/img/*
  Cache-Control: public, max-age=604800

/css/*
  Cache-Control: public, max-age=86400

/js/*
  Cache-Control: public, max-age=3600
`);
fs.writeFileSync(path.join(DIST, "_redirects"), `/resume-builder /builder/ 301
/cv-maker /builder/ 301
/app /builder/ 301
`);

console.log(`Built ${pages.length + 4} pages into dist/ (v=${V}) in ${Date.now() - t0} ms`);
if (SITE.url.includes("example.com")) console.warn("⚠  SITE_URL is not set — set it to your real domain before launching (Cloudflare → Settings → Environment variables).");
if (!SITE.supabaseUrl) console.warn("⚠  SUPABASE_URL is not set — login, cloud saving and AI limits are disabled.");
