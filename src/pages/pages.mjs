// Every page of the site. build/build.mjs turns these into static HTML files.
import { page, SITE, esc, adSlot, breadcrumbLD, logo } from "./layout.mjs";
import { renderResume } from "../shared/render.mjs";
import { TEMPLATES, TAG_LABELS, ACCENTS } from "../shared/templates.mjs";
import { EXAMPLE } from "../shared/sample.mjs";
import { EXAMPLES, EXAMPLE_LIST } from "../shared/examples.mjs";

const N = TEMPLATES.length;
const I = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.9L19 10l-5.1 2.1L12 17l-1.9-4.9L5 10l5.1-2.1z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18a9 9 0 1 1 16 0"/><path d="M12 14l4-5"/></svg>`,
  layout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 9.5 4.3 4.3 0 0 1 18 18z"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`
};

const tplCard = (t, { example = "", href } = {}) => `<a class="tpl-card" href="${href || `/templates/${t.id}/`}" data-tags="${t.tags.join(" ")}">
  <div class="tpl-thumb" data-mini="${t.id}"${example ? ` data-example="${example}"` : ""}><div class="tpl-tags">${t.tags.includes("ats") ? "<span>ATS</span>" : ""}${t.photo ? "<span>PHOTO</span>" : ""}</div><span class="btn btn-primary btn-sm use">Preview &amp; use</span></div>
  <div class="tpl-meta"><b>${esc(t.name)}</b><small>${esc(t.tags.filter(x => x !== "ats" && x !== "photo").slice(0, 2).map(x => TAG_LABELS[x]).join(" · "))}</small></div></a>`;

const scaled = (html, { max = 1, pad = 44 } = {}) => `<div class="scaled-page" data-max="${max}" data-pad="${pad}"><div class="inner">${html}</div></div>`;

/* =========================== HOME =========================== */
const FAQ = [
  ["Is Resume Forge really free?", `Yes. All ${N} templates, PDF and Word downloads and the AI tools are free. There is no watermark and no "pay to download" step. The site is supported by ads.`],
  ["Do I need to sign up?", "No. You can build and download a resume without an account, and even try the AI tools as a guest. Signing in with Google gives you more AI credits every day and saves your resumes online."],
  ["Can I upload my old CV?", "Yes. Upload a PDF, a Word (.docx) file, or even a photo of a printed CV. The AI reads it, fills every section and can rewrite it in a stronger, more professional style."],
  ["Will the AI make things up?", "No. It is instructed never to invent employers, dates, degrees or numbers. If a line would be stronger with a number you didn't give, it tells you which number to add instead."],
  ["Are the templates ATS-friendly?", "Yes. PDFs are made with real, selectable text that applicant tracking systems can read. Templates tagged ATS use a simple single-column layout that is safest for online job portals."],
  ["Can I make a CV with a photo for Gulf or Pakistan jobs?", "Yes. Templates such as Modern, Banner, Horizon and Creative have a photo area, and there is a Personal information section for nationality, date of birth, visa status and driving licence."],
  ["How do I download my resume as PDF?", "Click Download → PDF. Your browser's print window opens; choose \"Save as PDF\". This produces a crisp, text-based PDF. You can also download a Word (.docx) file to edit in Microsoft Word or Google Docs."],
  ["Is my data safe?", "Without an account your resume stays in your own browser. If you sign in, it is stored in your private account and only you can see it unless you create a share link. We never sell your data."]
];

export function homePage() {
  const ex = EXAMPLES["data-analyst"], gd = EXAMPLES["graphic-designer"];
  const s1 = renderResume(ex.data, { template: "timeline" });
  const s2 = renderResume(gd.data, { template: "creative" });
  const s3 = renderResume(EXAMPLE, { template: "modern" });
  const featured = ["modern", "banner", "elegant", "creative", "harvard", "horizon", "startup", "fresher"].map(id => TEMPLATES.find(t => t.id === id));
  const C = 2 * Math.PI * 19;
  const body = `
<section class="hero"><div class="wrap">
  <div>
    <span class="hero-badge"><i>FREE</i> ${N} templates · AI writer · PDF &amp; Word</span>
    <h1>Turn your old CV into one that <em>gets interviews</em></h1>
    <p class="hero-sub">Upload your CV — PDF, Word or even a photo. Our AI rewrites it like a professional resume writer, tailors it to the job you want, and you download it in a beautiful template. Free, no watermark.</p>
    <div class="hero-cta">
      <a class="btn btn-gold btn-lg" href="/builder/?open=import">${I.upload} Upload my CV</a>
      <a class="btn btn-lg btn-outline" href="/builder/?new=1">Start from scratch</a>
    </div>
    <div class="trust"><span>${I.check} No sign-up to start</span><span>${I.check} No watermark</span><span>${I.check} ATS-readable PDF</span><span>${I.check} Works on mobile</span></div>
  </div>
  <div class="stack" aria-hidden="true">
    <div class="sheet s1">${s1}</div><div class="sheet s2">${s2}</div><div class="sheet s3">${s3}</div>
    <div class="float-card fc-score"><div class="mini-ring"><svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="19" stroke="#e3e8e6"/><circle cx="23" cy="23" r="19" stroke="#1b7a45" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * 0.09).toFixed(1)}" stroke-linecap="round"/></svg><b>91</b></div><div><b>Resume strength</b><small>was 58 before AI</small></div></div>
    <div class="float-card fc-ai"><span class="spark">${I.sparkle}</span><div><div class="old">Responsible for handling customer calls</div><div class="new">Resolved 70+ customer calls per shift with a 96% quality score</div></div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-h center"><span class="eyebrow">How it works</span><h2>A better resume in three steps</h2><p>Most people finish in under ten minutes.</p></div>
  <div class="steps">
    <div class="step"><h3>Upload or start fresh</h3><p>Drop in your old CV (PDF, Word or a phone photo) or type your details into a guided editor.</p></div>
    <div class="step"><h3>Let AI make it stronger</h3><p>Weak lines become achievement-focused bullet points. Paste a job ad and it tailors everything to that job.</p></div>
    <div class="step"><h3>Pick a design &amp; download</h3><p>Switch between ${N} templates in one click. Download a crisp PDF or an editable Word file.</p></div>
  </div>
  <div class="ba">
    <div class="ba-card"><span class="lbl">Before</span><ul><li>Responsible for sales in Karachi region</li><li>Worked on company social media pages</li><li>Handling of customer complaints</li></ul></div>
    <div class="ba-arrow" aria-hidden="true">${I.arrow}</div>
    <div class="ba-card after"><span class="lbl">After AI rewrite</span><ul><li>Achieved 118% of a PKR 60M annual sales target, ranking #2 of 14 in the southern region</li><li>Planned and published 36 posts in 8 weeks, growing the brand page by 2,100 followers</li><li>Resolved customer complaints within 24 hours and cut repeat escalations by half</li></ul></div>
  </div>
  <p class="note" style="margin-top:10px;text-align:center">Example rewrite. The AI keeps your real facts and asks you for any numbers it doesn't have.</p>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-h"><span class="eyebrow">Templates</span><h2>${N} designer templates. All free.</h2><p>Every design reads cleanly in applicant tracking systems. Change the template, colour, font and spacing any time — your content stays put.</p></div>
  <div class="tpl-grid">${featured.map(t => tplCard(t)).join("")}</div>
  <div style="margin-top:28px;display:flex;justify-content:center"><a class="btn btn-lg" href="/templates/">See all ${N} templates ${I.arrow}</a></div>
</div></section>

${adSlot("home")}

<section class="section"><div class="wrap">
  <div class="section-h"><span class="eyebrow">Premium features, free</span><h2>Everything paid resume sites charge for</h2></div>
  <div class="feat-grid">
    <div class="feat"><span class="ic ai">${I.upload}</span><h3>Import any old CV</h3><p>PDF, Word, a photo of a printed CV, or pasted text. Every section is filled in for you.</p></div>
    <div class="feat"><span class="ic ai">${I.sparkle}</span><h3>AI rewrite, line by line</h3><p>Rewrite the whole resume or tap ✨ next to any bullet to get three stronger versions.</p></div>
    <div class="feat"><span class="ic ai">${I.target}</span><h3>Tailor to any job ad</h3><p>Paste a job from Rozee.pk, LinkedIn or Bayt and see which keywords you match and which you're missing.</p></div>
    <div class="feat"><span class="ic ai">${I.gauge}</span><h3>ATS score out of 100</h3><p>A recruiter-style review of what works and exactly what to fix, before you apply.</p></div>
    <div class="feat"><span class="ic ai">${I.mail}</span><h3>Cover letter generator</h3><p>A matching, personal cover letter from your resume and the job ad in about 30 seconds.</p></div>
    <div class="feat"><span class="ic">${I.file}</span><h3>PDF and Word downloads</h3><p>Text-based PDFs that job portals can read, plus an editable .docx. No watermark.</p></div>
    <div class="feat"><span class="ic">${I.camera}</span><h3>Photo &amp; personal details</h3><p>Photo templates and a personal information section for Pakistan and Gulf job applications.</p></div>
    <div class="feat"><span class="ic">${I.cloud}</span><h3>Many resumes, saved online</h3><p>Keep a version for every job type and open them on any device.</p></div>
    <div class="feat"><span class="ic">${I.link}</span><h3>Share link</h3><p>Send your resume as a link on WhatsApp or email — it always shows the latest version.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-h"><span class="eyebrow">Why us</span><h2>Free should mean free</h2><p>Many "free" resume sites ask for payment at the download step. Here's how we compare.</p></div>
  <div class="compare"><table>
    <thead><tr><th>Feature</th><th class="us">${esc(SITE.name)}</th><th>Typical "free" resume sites</th></tr></thead>
    <tbody>
      <tr><td>Download PDF without paying</td><td class="us"><span class="yes">Yes</span></td><td><span class="no">Often paid</span></td></tr>
      <tr><td>Watermark on your resume</td><td class="us"><span class="yes">Never</span></td><td>Sometimes</td></tr>
      <tr><td>All templates unlocked</td><td class="us"><span class="yes">All ${N}</span></td><td>A few free, rest paid</td></tr>
      <tr><td>AI rewrite of your old CV</td><td class="us"><span class="yes">Yes</span></td><td>Rare, or paid</td></tr>
      <tr><td>Tailor to a job ad + keywords</td><td class="us"><span class="yes">Yes</span></td><td>Rare, or paid</td></tr>
      <tr><td>Word (.docx) download</td><td class="us"><span class="yes">Yes</span></td><td>Often paid</td></tr>
      <tr><td>Account needed to start</td><td class="us"><span class="yes">No</span></td><td>Usually</td></tr>
    </tbody></table></div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-h"><span class="eyebrow">Questions</span><h2>Frequently asked questions</h2></div>
  <div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
  <div class="cta-band"><div><h2>Your next job starts with a better resume.</h2><p>Free forever. Takes about ten minutes.</p></div><a class="btn btn-gold btn-lg" href="/builder/?open=import">${I.upload} Upload my CV</a></div>
</div></section>`;
  return page({
    path: "/", title: `Free AI Resume Builder & CV Maker — ${N} Templates, No Watermark | ${SITE.name}`,
    description: `Make a professional resume free. Upload your old CV and let AI rewrite it, tailor it to any job, and download in ${N} ATS-friendly templates as PDF or Word. No watermark.`,
    body, resumeFonts: true, css: ["resume.css"],
    jsonld: [
      { "@context": "https://schema.org", "@type": "WebApplication", name: SITE.name, url: SITE.url + "/", applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Free AI resume builder and CV maker with templates, AI rewriting, job tailoring and PDF/Word export." },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
    ]
  });
}

/* =========================== TEMPLATES =========================== */
export function templatesPage() {
  const filters = ["all", "ats", "photo", "professional", "creative", "simple", "fresher", "two-column"];
  const body = `
<section class="page-hero"><div class="wrap">
  <div class="crumbs"><a href="/">Home</a> / Templates</div>
  <h1>${N} free resume templates</h1>
  <p>Professional, creative, ATS-friendly and photo CV templates — every one free, with no watermark. Pick one to preview it, then fill it in with our builder or let AI import your old CV.</p>
</div></section>
<div class="wrap">
  <div class="filters" role="toolbar" aria-label="Filter templates">${filters.map(f => `<button type="button" class="chip-btn" data-f="${f}" aria-pressed="${f === "all"}">${f === "all" ? `All (${N})` : TAG_LABELS[f]}</button>`).join("")}</div>
  <div class="tpl-grid" id="tplGrid">${TEMPLATES.map(t => tplCard(t)).join("")}</div>
</div>
${adSlot("gallery")}
<section class="section"><div class="wrap prose">
  <h2>Which resume template should I choose?</h2>
  <p><b>Applying online or through a job portal?</b> Choose an ATS-friendly template such as Harvard, Classic, Minimal or Compact. Single-column layouts are the safest for applicant tracking systems.</p>
  <p><b>Applying in the Gulf, or does the employer expect a photo?</b> Banner, Horizon, Modern and Creative have a photo area and room for personal details like nationality and visa status.</p>
  <p><b>Fresh graduate?</b> The Fresher template puts education, skills and projects before experience so a first CV still looks complete.</p>
  <p><b>Senior role?</b> Executive, Elegant and Corporate give a calm, confident look for managers and directors.</p>
  <p>You can switch templates at any time in the builder — your content never needs retyping.</p>
</div></section>
<script type="module">
  const grid=document.getElementById("tplGrid"),btns=[...document.querySelectorAll("[data-f]")];
  const apply=f=>{btns.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.f===f)));[...grid.children].forEach(c=>{c.hidden=!(f==="all"||c.dataset.tags.split(" ").includes(f))});};
  btns.forEach(b=>b.onclick=()=>{apply(b.dataset.f);const u=new URL(location.href);b.dataset.f==="all"?u.searchParams.delete("f"):u.searchParams.set("f",b.dataset.f);history.replaceState(null,"",u);});
  const f=new URLSearchParams(location.search).get("f");if(f&&btns.some(b=>b.dataset.f===f))apply(f);
</script>`;
  return page({
    path: "/templates/", title: `${N} Free Resume Templates (ATS-Friendly, With Photo & More)`,
    description: `Browse ${N} free resume and CV templates: ATS-friendly, professional, creative, fresher and photo templates for Pakistan and the Gulf. Preview, fill in online and download PDF or Word.`,
    body, resumeFonts: true, css: ["resume.css"], jsonld: [breadcrumbLD([["Home", "/"], ["Templates", "/templates/"]])]
  });
}

export function templateDetailPage(t) {
  const html = renderResume(EXAMPLE, { template: t.id });
  const others = TEMPLATES.filter(x => x.id !== t.id && x.tags.some(tag => t.tags.includes(tag))).slice(0, 4);
  const layoutName = t.layout === "sidebar" ? `Two columns with a ${t.sidePos === "right" ? "right" : "left"} sidebar` : t.layout === "twocol" ? "Main column with a narrow side column" : "Single column";
  const body = `
<section class="page-hero" style="padding-bottom:20px"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / <a href="/templates/">Templates</a> / ${esc(t.name)}</div></div></section>
<div class="wrap"><div class="detail">
  <div class="detail-preview" id="tplPreview">${scaled(html, { max: 0.8, pad: 44 })}</div>
  <div class="detail-info">
    <div style="display:grid;gap:12px"><span class="eyebrow">${t.tags.map(x => TAG_LABELS[x]).join(" · ")}</span><h1>${esc(t.name)} resume template</h1><p style="font-size:17px;color:var(--ink-2)">${esc(t.desc)}</p></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary btn-lg" href="/builder/?template=${t.id}">Use this template</a><a class="btn btn-lg" href="/builder/?template=${t.id}&open=import">${I.upload} Upload my CV into it</a></div>
    <div class="d-block" style="display:grid;gap:8px"><span class="field-label">Try a colour</span><div class="swatch-row">${[t.accent, ...ACCENTS.filter(c => c !== t.accent).slice(0, 7)].map((c, i) => `<button type="button" class="swatch" data-c="${c}" style="background:${c}" aria-label="Colour ${c}" aria-pressed="${i === 0}"></button>`).join("")}</div></div>
    <dl class="kv">
      <div><dt>Best for</dt><dd>${esc(t.bestFor)}</dd></div>
      <div><dt>Layout</dt><dd>${layoutName}</dd></div>
      <div><dt>Photo</dt><dd>${t.photo ? "Yes — optional" : "No"}</dd></div>
      <div><dt>ATS-friendly</dt><dd>${t.tags.includes("ats") ? "Yes — best choice for job portals" : "Yes — text-based PDF"}</dd></div>
      <div><dt>Downloads</dt><dd>PDF, Word (.docx), text</dd></div>
      <div><dt>Price</dt><dd>Free, no watermark</dd></div>
    </dl>
    <div class="prose" style="font-size:15px"><h3>How to use the ${esc(t.name)} template</h3><ol><li>Click <b>Use this template</b>, or upload your existing CV and let AI fill it in.</li><li>Edit any section on the left — the preview updates instantly. Change colour, font and spacing under <b>Design</b>.</li><li>Press <b>Download</b> for a PDF or Word file. Switch to any of the other ${N - 1} templates whenever you like.</li></ol></div>
  </div>
</div></div>
${adSlot("template")}
<section class="section"><div class="wrap"><div class="section-h"><h2>Similar templates</h2></div><div class="tpl-grid">${others.map(o => tplCard(o)).join("")}</div></div></section>
<script type="module">
  import { renderResume } from "/js/shared/render.mjs"; import { EXAMPLE } from "/js/shared/sample.mjs";
  const box=document.querySelector("#tplPreview .inner"),sw=[...document.querySelectorAll(".swatch")];
  sw.forEach(b=>b.onclick=()=>{sw.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));box.innerHTML=renderResume(EXAMPLE,{template:${JSON.stringify(t.id)},accent:b.dataset.c});});
</script>`;
  return page({
    path: `/templates/${t.id}/`, title: `${t.name} Resume Template — Free Download (PDF & Word)`,
    description: `${t.desc} Free ${t.name} CV template — fill it in online, let AI improve it, and download as PDF or Word with no watermark.`.slice(0, 300),
    body, resumeFonts: true, css: ["resume.css"],
    jsonld: [breadcrumbLD([["Home", "/"], ["Templates", "/templates/"], [t.name, `/templates/${t.id}/`]])]
  });
}

/* =========================== CV EXAMPLES =========================== */
export function examplesPage() {
  const body = `
<section class="page-hero"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / CV examples</div>
  <h1>CV examples for every job</h1>
  <p>Real-looking resume examples written by recruiters' standards, with tips for each profession. Open one, then use it as a starting point in the builder.</p></div></section>
<div class="wrap"><div class="tpl-grid">${EXAMPLE_LIST.map(e => `<a class="tpl-card" href="/cv-examples/${e.slug}/"><div class="tpl-thumb" data-mini="${e.template}" data-example="${e.slug}"><span class="btn btn-primary btn-sm use">View example</span></div><div class="tpl-meta"><b>${esc(e.title)}</b><small>${esc(TEMPLATES.find(t => t.id === e.template).name)} template</small></div></a>`).join("")}</div></div>
${adSlot("example")}`;
  return page({
    path: "/cv-examples/", title: "CV Examples & Resume Samples for Every Job (Free Templates)",
    description: "Free CV and resume examples for software engineers, accountants, teachers, nurses, sales, customer service, fresh graduates and more — with writing tips and ready-to-edit templates.",
    body, resumeFonts: true, css: ["resume.css"], jsonld: [breadcrumbLD([["Home", "/"], ["CV examples", "/cv-examples/"]])]
  });
}

export function exampleDetailPage(slug) {
  const e = EXAMPLES[slug];
  const t = TEMPLATES.find(x => x.id === e.template);
  const html = renderResume(e.data, { template: e.template });
  const bullets = e.data.experience.flatMap(x => x.bullets).slice(0, 6);
  const more = EXAMPLE_LIST.filter(x => x.slug !== slug).slice(0, 8);
  const body = `
<section class="page-hero" style="padding-bottom:24px"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / <a href="/cv-examples/">CV examples</a> / ${esc(e.title)}</div>
  <h1>${esc(e.title)} CV example</h1><p>${esc(e.intro)}</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px"><a class="btn btn-primary btn-lg" href="/builder/?example=${slug}">Use this example</a><a class="btn btn-lg" href="/builder/?template=${t.id}&open=import">${I.upload} Upload my CV instead</a></div></div></section>
<div class="wrap"><div class="detail">
  <div class="detail-preview">${scaled(html, { max: 0.8, pad: 44 })}</div>
  <div class="detail-info">
    <div class="prose"><h2>How to write a ${esc(e.title.toLowerCase())} CV</h2></div>
    <ol class="tips" style="padding:0;margin:0">${e.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <div class="prose"><h3>Professional summary example</h3><p style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px">${esc(e.data.summary)}</p>
    <h3>Achievement bullet examples</h3><ul>${bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
    <h3>Top skills for a ${esc(e.title.toLowerCase())}</h3></div>
    <div class="skill-cloud">${e.data.skills.map(s => `<span>${esc(s)}</span>`).join("")}</div>
    <p class="note">This example uses the <a href="/templates/${t.id}/">${esc(t.name)} template</a>. All names and companies are fictional.</p>
  </div>
</div></div>
${adSlot("example")}
<section class="section"><div class="wrap"><div class="section-h"><h2>More CV examples</h2></div><div class="ex-grid">${more.map(x => `<a class="ex-card" href="/cv-examples/${x.slug}/"><b>${esc(x.title)} CV example</b><span>${esc(x.intro.split(". ")[0])}.</span></a>`).join("")}</div></div></section>`;
  return page({
    path: `/cv-examples/${slug}/`, title: `${e.title} CV Example & Resume Writing Tips`,
    description: `Free ${e.title.toLowerCase()} CV example with a professional summary, achievement bullet points, top skills and expert tips. Edit it online and download as PDF or Word.`,
    body, resumeFonts: true, css: ["resume.css"],
    jsonld: [breadcrumbLD([["Home", "/"], ["CV examples", "/cv-examples/"], [e.title, `/cv-examples/${slug}/`]])]
  });
}

/* =========================== TOOLS =========================== */
export function atsPage() {
  const body = `
<section class="page-hero"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / ATS resume checker</div>
  <h1>Free ATS resume checker</h1>
  <p>Upload your CV and get an honest score out of 100, what's working, and exactly what to fix — the same things applicant tracking systems and recruiters look for. Add a job ad to see which keywords you match.</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px"><a class="btn btn-ai btn-lg" href="/builder/?open=check">${I.gauge} Check my CV now</a><a class="btn btn-lg" href="/builder/?tab=ai">Check the resume I'm building</a></div>
  <p class="note" style="margin-top:12px">Free, no sign-up needed. The builder also has an instant check that works without AI and has no limit.</p></div></section>
<section class="section" style="padding-top:20px"><div class="wrap">
  <div class="feat-grid">
    <div class="feat"><span class="ic ai">${I.gauge}</span><h3>Score out of 100</h3><p>Scored like a recruiter using ATS software: clarity, impact, keywords, structure and grammar.</p></div>
    <div class="feat"><span class="ic ai">${I.target}</span><h3>Keyword match</h3><p>Paste a job ad and see which important keywords your CV has and which are missing.</p></div>
    <div class="feat"><span class="ic ai">${I.sparkle}</span><h3>One-click fixes</h3><p>Happy with the feedback? Let AI rewrite the weak parts for you, then check the new score.</p></div>
  </div>
</div></section>
<section class="section"><div class="wrap prose">
  <h2>What is an ATS and why does it matter?</h2>
  <p>An applicant tracking system (ATS) is software that companies use to collect and filter job applications. It reads the text of your CV, looks for keywords from the job description and ranks candidates. Many CVs are never seen by a person because the ATS could not read them or found too few matching keywords.</p>
  <h3>How to make your CV ATS-friendly</h3>
  <ul>
    <li>Use a clear layout with standard headings such as Experience, Education and Skills.</li>
    <li>Save as a text-based PDF or Word file — not a scanned image. ${esc(SITE.name)} PDFs are always text-based.</li>
    <li>Use the exact words from the job ad for skills and tools you really have, e.g. "Microsoft Excel", "SAP FI", "Customer service".</li>
    <li>Put your job title and key skills near the top.</li>
    <li>Avoid putting important information inside images, headers or footers.</li>
  </ul>
</div></section>`;
  return page({
    path: "/ats-resume-checker/", title: "Free ATS Resume Checker — Score Your CV Out of 100",
    description: "Check your resume against applicant tracking systems for free. Get a score out of 100, keyword match for any job ad and specific fixes. Upload PDF, Word or a photo.",
    body, css: ["resume.css"], resumeFonts: false
  });
}

export function coverLetterPage() {
  const body = `
<section class="page-hero" style="padding-bottom:20px"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / Cover letter generator</div>
  <h1>Free AI cover letter generator</h1>
  <p>Write a personal, specific cover letter in about 30 seconds. It uses the facts from your resume and matches them to what the job ad asks for.</p></div></section>
<div class="wrap"><div class="detail" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
  <form id="clForm" class="auth-card" style="width:100%;box-shadow:none" autocomplete="off">
    <div class="field"><span>Your resume</span><select id="clResume"><option value="local">The resume in this browser</option></select><small class="note" id="clResumeNote"></small></div>
    <label class="field"><span>Job ad</span><textarea id="clJD" rows="7" placeholder="Paste the job description here" required></textarea></label>
    <div class="grid2"><label class="field"><span>Company <em>(optional)</em></span><input id="clCompany" placeholder="e.g. Engro"></label><label class="field"><span>Hiring manager <em>(optional)</em></span><input id="clManager" placeholder="e.g. Ms. Ayesha Khan"></label></div>
    <div class="grid2"><label class="field"><span>Tone</span><select id="clTone"><option value="professional and warm">Professional &amp; warm</option><option value="confident and direct">Confident &amp; direct</option><option value="formal">Formal</option><option value="enthusiastic">Enthusiastic</option></select></label>
    <label class="field"><span>Length</span><select id="clLen"><option value="medium">Medium (~300 words)</option><option value="short">Short (~200 words)</option><option value="long">Long (~400 words)</option></select></label></div>
    <div class="progress" id="clProg" hidden><b>Writing your cover letter…</b><div class="bar"><i></i></div></div>
    <p class="notice err" id="clErr" hidden></p>
    <button class="btn btn-ai btn-lg" type="submit" id="clGo">${I.sparkle} Write my cover letter</button>
  </form>
  <div class="auth-card" style="width:100%;box-shadow:none;align-content:start">
    <div class="pane-h" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Your cover letter</b><div style="display:flex;gap:6px"><button class="btn btn-sm" type="button" id="clCopy" disabled>Copy</button><button class="btn btn-sm" type="button" id="clDocx" disabled>Word</button><button class="btn btn-sm" type="button" id="clTxt" disabled>.txt</button></div></div>
    <label class="field"><span>Email subject</span><input id="clSubject" placeholder="Appears here"></label>
    <textarea id="clOut" class="input" rows="18" placeholder="Your letter will appear here. You can edit it before copying." style="line-height:1.6"></textarea>
  </div>
</div></div>
${adSlot("cover")}
<section class="section"><div class="wrap prose">
  <h2>What makes a good cover letter?</h2>
  <ul><li><b>Short and specific.</b> 250–350 words is enough. Recruiters skim.</li><li><b>Matched to the job.</b> Pick two or three requirements from the ad and show real proof for each.</li><li><b>Honest.</b> Our AI only uses facts from your resume — edit anything that doesn't sound like you.</li><li><b>Ends with a next step.</b> Say you'd welcome an interview and give your phone number.</li></ul>
</div></section>`;
  return page({
    path: "/cover-letter-generator/", title: "Free AI Cover Letter Generator — Personal, Job-Specific Letters",
    description: "Generate a personal cover letter from your resume and the job ad in 30 seconds. Free, no watermark. Copy it or download as Word.",
    body, scripts: ["cover.mjs"]
  });
}

/* =========================== APP PAGES =========================== */
export function builderPage() {
  const tab = (id, label, icon, sel) => `<button type="button" data-tab="${id}" aria-selected="${sel}">${icon}<span>${label}</span></button>`;
  const IC = {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>`,
    design: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 22 9.7C22 5.9 17.5 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/></svg>`,
    ai: I.sparkle,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>`,
    redo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>`,
    dl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`
  };
  const body = `
<header class="app-bar">
  ${logo()}
  <input class="doc-title" id="docTitle" aria-label="Resume name" value="My resume" maxlength="120">
  <span class="save-state" id="saveState"></span>
  <div class="bar-actions">
    <button class="btn btn-ghost hide-m" id="btnImport" type="button">${I.upload}<span>Upload CV</span></button>
    <button class="btn btn-ai hide-m" id="btnImprove" type="button">${I.sparkle}<span>Improve with AI</span></button>
    <div class="dropdown" id="dlWrap"><button class="btn btn-primary" id="btnDownload" type="button" aria-haspopup="true" aria-expanded="false">${IC.dl}<span>Download</span></button>
      <div class="dropdown-menu" id="dlMenu" hidden>
        <button type="button" data-dl="pdf"><span><b>PDF</b><small>Best for applying — real text, ATS-readable</small></span></button>
        <button type="button" data-dl="docx"><span><b>Word (.docx)</b><small>Edit in Microsoft Word or Google Docs</small></span></button>
        <button type="button" data-dl="txt"><span><b>Plain text</b><small>Paste into job portal forms</small></span></button>
        <button type="button" data-dl="json"><span><b>Backup file</b><small>Re-open later with Upload CV</small></span></button>
      </div></div>
    <div class="user-slot"></div>
  </div>
</header>
<div class="app">
  <nav class="rail" aria-label="Builder sections">${tab("content", "Content", IC.edit, true)}${tab("design", "Design", IC.design, false)}${tab("ai", "AI tools", IC.ai, false)}</nav>
  <section class="panel" id="panel" aria-label="Editor">
    <div class="pane" id="paneContent"></div>
    <div class="pane" id="paneDesign" hidden></div>
    <div class="pane" id="paneAI" hidden></div>
  </section>
  <main class="canvas" id="canvas" aria-label="Preview">
    <div class="canvas-tools">
      <div class="zoom"><button type="button" id="btnUndo" title="Undo (Ctrl+Z)" aria-label="Undo" disabled style="display:grid;place-items:center">${IC.undo}</button><button type="button" id="btnRedo" title="Redo" aria-label="Redo" disabled style="display:grid;place-items:center">${IC.redo}</button></div>
      <div class="canvas-info"><button type="button" class="score-chip" id="scoreChip" title="Instant check — free"><i></i><span>Score</span></button><span class="tplname" id="tplName"></span><span id="pageCount"></span></div>
      <div class="zoom"><button type="button" id="zoomOut" aria-label="Zoom out">−</button><span id="zoomVal">100%</span><button type="button" id="zoomIn" aria-label="Zoom in">+</button><button type="button" id="zoomFit" style="width:auto;padding:0 10px;font-size:12.5px;font-weight:600">Fit</button></div>
    </div>
    <div class="stage"><div class="page-holder" id="pageHolder"><div class="page-scale" id="pageScale"></div></div></div>
  </main>
</div>
<nav class="mob-tabs" aria-label="Builder">${tab("content", "Edit", IC.edit, true)}${tab("design", "Design", IC.design, false)}${tab("ai", "AI", IC.ai, false)}${tab("preview", "Preview", IC.eye, false)}</nav>
<noscript><div class="notice warn" style="margin:20px">The resume builder needs JavaScript. Please enable it in your browser.</div></noscript>`;
  return page({
    path: "/builder/", title: "Resume Builder — Create Your CV Online Free",
    description: `Create a professional resume online in minutes. ${N} templates, AI writing help, live preview and free PDF & Word download.`,
    body, chrome: false, bodyClass: "app-body", resumeFonts: true, css: ["resume.css", "app.css"], scripts: ["builder.mjs"]
  });
}

export function dashboardPage() {
  const body = `<div class="wrap">
  <div class="dash-head"><div><span class="eyebrow">Your account</span><h1>My resumes</h1></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/builder/?open=import">Upload a CV</a><a class="btn btn-primary" href="/builder/?new=1">New resume</a></div></div>
  <div id="dash"><div class="empty">Loading your resumes…</div></div>
</div>`;
  return page({ path: "/dashboard/", title: "My resumes", description: "Your saved resumes.", body, noindex: true, resumeFonts: true, css: ["resume.css"], scripts: ["dashboard.mjs"] });
}

export function loginPage() {
  const G = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
  const body = `<div class="auth-wrap"><div class="auth-card">
  <div style="display:grid;gap:8px"><h1>Sign in — it's free</h1><p class="muted">Get more AI credits and keep all your resumes safe online.</p></div>
  <ul class="perks"><li>${SITE.aiDailyCredits} free AI credits every day</li><li>Save many versions and open them on any device</li><li>Share your resume with a link</li><li>No payment, ever</li></ul>
  <button class="btn btn-google btn-lg btn-block" type="button" id="gBtn"><span style="width:20px;height:20px;display:inline-grid">${G}</span> Continue with Google</button>
  <p class="notice" id="msg" hidden></p>
  <p class="note">By continuing you agree to our <a href="/terms/">Terms</a> and <a href="/privacy/">Privacy policy</a>. We only receive your name, email address and profile picture from Google.</p>
</div></div>`;
  return page({ path: "/login/", title: "Sign in", description: "Sign in to save resumes and get more free AI credits.", body, noindex: true, scripts: ["login.mjs"] });
}

export function sharePage() {
  const body = `<div class="wrap" style="padding-block:28px 10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <div><span class="eyebrow">Shared resume</span><h1 id="shTitle" style="font-size:28px;margin-top:6px">Loading…</h1></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="shPdf" disabled>Download PDF</button><a class="btn btn-primary" href="/builder/?new=1">Create your own — free</a></div></div>
  <div class="wrap"><div class="detail-preview" style="position:static" id="shBox"><div class="empty" id="shMsg">Loading…</div></div></div>`;
  return page({ path: "/r/", title: "Shared resume", description: "A resume shared from Resume Forge.", body, noindex: true, resumeFonts: true, css: ["resume.css"], scripts: ["share.mjs"] });
}

/* =========================== INFO PAGES =========================== */
const prosePage = (path, title, description, inner) => page({
  path, title, description,
  body: `<section class="page-hero"><div class="wrap"><h1>${esc(title)}</h1></div></section><div class="wrap"><div class="prose">${inner}</div></div>`
});

export function aboutPage() {
  return prosePage("/about/", "About " + SITE.name, `${SITE.name} is a free AI resume builder with ${N} templates, built to help job seekers in Pakistan and worldwide.`, `
  <p>${esc(SITE.name)} started with a simple frustration: most "free" resume builders let you spend an hour on your CV and then ask for money at the download step. Job seekers — especially fresh graduates and people between jobs — shouldn't have to pay to apply for work.</p>
  <p>So we built a resume builder where everything is free: all ${N} templates, PDF and Word downloads, and AI tools that rewrite your CV, tailor it to a job and write your cover letter. The site is supported by advertising, not by charging you.</p>
  <h2>What we believe</h2>
  <ul><li><b>Honest resumes win.</b> Our AI is built never to invent jobs, degrees or numbers.</li><li><b>Local needs matter.</b> Photo templates and personal-detail sections for Pakistan and Gulf applications sit next to ATS-safe formats for international jobs.</li><li><b>Your data is yours.</b> Without an account your resume never leaves your browser. With one, only you can see it.</li></ul>
  <p>Questions or ideas? <a href="/contact/">Get in touch</a>.</p>`);
}
export function contactPage() {
  return prosePage("/contact/", "Contact us", `Contact the ${SITE.name} team.`, `
  <p>We read every message. For help with your account, bug reports, feature ideas or partnerships, email us at:</p>
  <p style="font-size:20px;font-weight:700;user-select:all">${esc(SITE.contactEmail)}</p>
  <p>To delete your account and all saved resumes, email us from the address you signed in with and write "Delete my account" in the subject. We'll confirm within 7 days.</p>`);
}
export function privacyPage() {
  const d = new Date().toISOString().slice(0, 10);
  return prosePage("/privacy/", "Privacy policy", `How ${SITE.name} handles your data.`, `
  <p><i>Last updated: ${d}</i></p>
  <p>This policy explains what information ${esc(SITE.name)} ("we") collects, why, and your choices.</p>
  <h2>1. Using the site without an account</h2>
  <p>The resume you create is saved only in your own browser (local storage). It is not sent to our servers unless you use an AI feature or sign in.</p>
  <h2>2. Accounts</h2>
  <p>If you choose "Continue with Google", Google sends us your name, email address and profile picture. We set a secure login cookie so you stay signed in. Your saved resumes are stored in your private account in our database (hosted by Cloudflare). Only you can see them unless you turn on a share link for a resume; anyone with that link can then view that resume until you turn sharing off.</p>
  <h2>3. AI features</h2>
  <p>When you use an AI feature, the text of your resume (and any file text, page images or job description you provide) is processed by an open-source AI model running on Cloudflare's network (Cloudflare Workers AI) to produce the result. Your photo is never sent. We do not use your content to train AI models. Some small rewrites may run entirely on your own device using your browser's built-in AI, when your browser offers it. To keep AI fair and free, we count AI actions per account, or for guests per network address; for guests we store only a one-way scrambled code, not the address itself.</p>
  <h2>4. Uploaded files</h2>
  <p>Files you upload are read inside your browser. Only the extracted text (or page images for scanned files) is sent for AI processing. We do not store the original files.</p>
  <h2>5. Advertising and analytics</h2>
  <p>We show ads through Google AdSense to keep the service free. Google and its partners may use cookies to show ads based on your visits to this and other websites. You can opt out of personalised advertising at <a href="https://adssettings.google.com" rel="nofollow">adssettings.google.com</a>. We may use Google Analytics to understand how the site is used; it collects anonymous usage data through cookies. Where required by law, we ask for your consent before using these cookies.</p>
  <h2>6. Sharing</h2>
  <p>We never sell your personal data. We share it only with the service providers that run the site (hosting, database, sign-in, AI processing, advertising and analytics) and when required by law.</p>
  <h2>7. Keeping and deleting data</h2>
  <p>You can delete any resume from your dashboard at any time. To delete your account and all its data, contact us at ${esc(SITE.contactEmail)}.</p>
  <h2>8. Children</h2>
  <p>The service is intended for people aged 16 and over.</p>
  <h2>9. Contact</h2>
  <p>Questions about privacy: ${esc(SITE.contactEmail)}.</p>`);
}
export function termsPage() {
  const d = new Date().toISOString().slice(0, 10);
  return prosePage("/terms/", "Terms of use", `Terms of use for ${SITE.name}.`, `
  <p><i>Last updated: ${d}</i></p>
  <h2>1. The service</h2><p>${esc(SITE.name)} provides free tools to create resumes, CVs and cover letters, including AI-assisted writing. We may change, limit or stop features at any time.</p>
  <h2>2. Your content</h2><p>You own the content you create. You are responsible for making sure it is accurate and truthful. AI suggestions may contain mistakes — always review them before sending your resume to anyone.</p>
  <h2>3. Fair use</h2><p>AI features have daily limits so they can stay free for everyone. Do not attempt to bypass limits, overload the service, scrape it, or use it to create misleading or unlawful content.</p>
  <h2>4. Accounts</h2><p>Keep your sign-in secure. We may suspend accounts that abuse the service.</p>
  <h2>5. No guarantee</h2><p>The service is provided "as is". We do not guarantee that using it will lead to a job or interview, and we are not liable for any loss arising from its use, to the extent permitted by law.</p>
  <h2>6. Contact</h2><p>${esc(SITE.contactEmail)}</p>`);
}
export function notFoundPage() {
  return page({
    path: "/404", title: "Page not found", description: "Page not found", noindex: true,
    body: `<div class="auth-wrap"><div class="auth-card" style="text-align:center"><h1>Page not found</h1><p class="muted">The page you're looking for doesn't exist or has moved.</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="/builder/">Build my resume</a><a class="btn" href="/templates/">See templates</a></div></div></div>`
  });
}
