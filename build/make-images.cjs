// One-off helper (needs Playwright): renders public/img/og.png and app icons.
// Usage: node build/make-images.cjs   — only needed if you change the brand.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
(async () => {
  const root = path.resolve(__dirname, "..");
  const { renderResume } = await import(path.join(root, "src/shared/render.mjs"));
  const { EXAMPLE } = await import(path.join(root, "src/shared/sample.mjs"));
  const { EXAMPLES } = await import(path.join(root, "src/shared/examples.mjs"));
  const css = fs.readFileSync(path.join(root, "src/styles/resume.css"), "utf8");
  const logo = fs.readFileSync(path.join(root, "public/favicon.svg"), "utf8");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const F = `"Noto Sans CJK HK","Liberation Sans",sans-serif`;
  await p.setContent(`<!doctype html><html><head><style>${css}
    body{margin:0;width:1200px;height:630px;overflow:hidden;background:radial-gradient(900px 500px at 90% -10%,#12352b,transparent 60%),#0c231d;font-family:${F};color:#eaf5f0;position:relative}
    .dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px);background-size:22px 22px}
    .l{position:absolute;left:70px;top:70px;width:600px}
    .brand{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:900;letter-spacing:-.5px}.brand svg{width:48px;height:48px}.brand b{color:#f0bf5a}
    .l h1{font-size:68px;line-height:1.02;font-weight:900;letter-spacing:-2px;margin:40px 0 0}.l h1 em{font-style:normal;color:#f0bf5a}
    .l p{font-size:26px;color:#a9c4ba;margin:24px 0 0;line-height:1.35}
    .pill{display:inline-block;margin-top:34px;background:#f0bf5a;color:#241703;font-weight:900;font-size:24px;padding:12px 24px;border-radius:14px}
    .sheet{position:absolute;width:794px;transform-origin:0 0;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);border-radius:4px;overflow:hidden}
    .a{left:690px;top:70px;transform:scale(.52) rotate(4deg)}.b{left:760px;top:40px;transform:scale(.5) rotate(-3deg);opacity:.0}
  </style></head><body><div class="dots"></div>
  <div class="l"><div class="brand">${logo}<span>Resume <b>Forge</b></span></div>
  <h1>Free AI resume builder that <em>gets interviews</em></h1>
  <p>Upload your old CV · AI rewrites it · 26 templates · PDF &amp; Word</p><span class="pill">100% free · no watermark</span></div>
  <div class="sheet a">${renderResume(EXAMPLE, { template: "modern" })}</div></body></html>`);
  await p.screenshot({ path: path.join(root, "public/img/og.png") });
  for (const s of [192, 512]) {
    const q = await b.newPage({ viewport: { width: s, height: s } });
    await q.setContent(`<body style="margin:0;background:#0c231d;display:grid;place-items:center;width:${s}px;height:${s}px">${logo.replace("<svg", `<svg width="${s * 0.7}" height="${s * 0.7}"`)}</body>`);
    await q.screenshot({ path: path.join(root, `public/img/icon-${s}.png`) });
  }
  await b.close();
  console.log("images written");
})();
