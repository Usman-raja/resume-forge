// Pure HTML renderer for a resume page. Runs in the browser (builder, previews)
// and in Node (static build for SEO pages). No DOM access.
import { getTemplate, DEFAULT_ORDER, FONTS } from "./templates.mjs";
import { SECTION_LABELS, normalizeSettings, normalizeResume } from "./schema.mjs";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = a => (Array.isArray(a) ? a : []).map(x => String(x ?? "").trim()).filter(Boolean);
const has = v => String(v ?? "").trim().length > 0;

/* ---------- colour helpers ---------- */
function hexToRgb(h) {
  h = String(h || "").replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h, 16);
  if (!/^[0-9a-f]{6}$/i.test(h) || Number.isNaN(n)) return [22, 98, 79];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = rgb => "#" + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function luminance([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function accentVars(hex) {
  const c = hexToRgb(hex);
  const soft = toHex(mix(c, [255, 255, 255], 0.88));
  const light = toHex(mix(c, [255, 255, 255], 0.55));
  const deep = toHex(mix(c, [0, 0, 0], 0.35));
  const ink = luminance(c) > 0.42 ? "#16191d" : "#ffffff";
  return `--ac:${toHex(c)};--ac-soft:${soft};--ac-light:${light};--ac-deep:${deep};--ac-ink:${ink}`;
}

/* ---------- small pieces ---------- */
const ICONS = {
  email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  location: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
};
const prettyLink = l => String(l).trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

function contactHTML(r) {
  const items = [];
  if (has(r.email)) items.push(["email", r.email]);
  if (has(r.phone)) items.push(["phone", r.phone]);
  if (has(r.location)) items.push(["location", r.location]);
  clean(r.links).forEach(l => items.push(["link", prettyLink(l)]));
  if (!items.length) return "";
  return `<div class="r-contact">${items.map(([k, v]) => `<span class="r-ci r-ci--${k}">${ICONS[k]}<span>${esc(v)}</span></span>`).join("")}</div>`;
}
function initials(name) {
  const p = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "CV";
}
function photoHTML(r, t, s) {
  if (!t.photo || !s.showPhoto || !has(r.photo)) return "";
  return `<div class="r-photo r-photo--${t.photo}"><img src="${esc(r.photo)}" alt=""></div>`;
}
const dates = (a, b) => (has(a) && has(b) ? `${esc(a.trim())} – ${esc(b.trim())}` : esc(String(a || b || "").trim()));
const org = (co, loc) => {
  const parts = [];
  if (has(co)) parts.push(`<span class="r-co">${esc(co)}</span>`);
  if (has(loc)) parts.push(`<span class="r-loc${has(co) ? " r-sep" : ""}">${esc(loc)}</span>`);
  return parts.length ? `<div class="r-org">${parts.join("")}</div>` : "";
};

/* ---------- sections ---------- */
const SEC = {
  summary: r => (has(r.summary) ? `<p class="r-text">${esc(r.summary.trim())}</p>` : ""),
  experience: r => {
    const items = (r.experience || []).filter(e => has(e.role) || has(e.company) || clean(e.bullets).length);
    if (!items.length) return "";
    return `<div class="r-items">${items.map(e => `<article class="r-item">
<div class="r-item-h"><div class="r-item-t"><h3 class="r-role">${esc(e.role)}</h3>${org(e.company, e.location)}</div>${has(e.start) || has(e.end) ? `<div class="r-date">${dates(e.start, e.end)}</div>` : ""}</div>
${clean(e.bullets).length ? `<ul class="r-bul">${clean(e.bullets).map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</article>`).join("")}</div>`;
  },
  education: r => {
    const items = (r.education || []).filter(e => has(e.degree) || has(e.school));
    if (!items.length) return "";
    return `<div class="r-items">${items.map(e => `<article class="r-item">
<div class="r-item-h"><div class="r-item-t"><h3 class="r-role">${esc(e.degree)}</h3>${org(e.school, e.location)}</div>${has(e.start) || has(e.end) ? `<div class="r-date">${dates(e.start, e.end)}</div>` : ""}</div>
${has(e.details) ? `<p class="r-note">${esc(e.details)}</p>` : ""}</article>`).join("")}</div>`;
  },
  projects: r => {
    const items = (r.projects || []).filter(p => has(p.name) || has(p.desc));
    if (!items.length) return "";
    return `<div class="r-items">${items.map(p => `<article class="r-item">
<div class="r-item-h"><div class="r-item-t"><h3 class="r-role">${esc(p.name)}</h3></div>${has(p.link) ? `<div class="r-plink">${esc(prettyLink(p.link))}</div>` : ""}</div>
${has(p.desc) ? `<p class="r-note">${esc(p.desc)}</p>` : ""}</article>`).join("")}</div>`;
  },
  skills: r => (clean(r.skills).length ? `<ul class="r-skills">${clean(r.skills).map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""),
  certifications: r => (clean(r.certifications).length ? `<ul class="r-list">${clean(r.certifications).map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""),
  languages: r => (clean(r.languages).length ? `<ul class="r-list r-langs">${clean(r.languages).map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""),
  details: r => {
    const d = (r.details || []).filter(x => has(x.label) || has(x.value));
    return d.length ? `<dl class="r-dl">${d.map(x => `<div><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd></div>`).join("")}</dl>` : "";
  }
};

function sectionHTML(key, r, s) {
  if (key === "custom") {
    return (r.custom || []).filter(c => has(c.title) || clean(c.items).length).map(c =>
      `<section class="r-sec r-sec--custom"><h2 class="r-sec-h"><span>${esc(c.title || "Additional")}</span></h2><div class="r-sec-b"><ul class="r-list r-list--custom">${clean(c.items).map(i => `<li>${esc(i)}</li>`).join("")}</ul></div></section>`
    ).join("");
  }
  const body = SEC[key]?.(r);
  if (!body) return "";
  const title = has(s.titles?.[key]) ? s.titles[key] : SECTION_LABELS[key];
  return `<section class="r-sec r-sec--${key}"><h2 class="r-sec-h"><span>${esc(title)}</span></h2><div class="r-sec-b">${body}</div></section>`;
}

export function effectiveOrder(t, s) {
  return (s.order && s.order.length ? s.order : t.order || DEFAULT_ORDER).filter(k => !s.hidden.includes(k));
}

/* ---------- main ---------- */
export function renderResume(data, settings, opts = {}) {
  const r = normalizeResume(data); // also drops unsafe photo values from untrusted data
  const s = normalizeSettings(settings);
  const t = getTemplate(s.template);
  const accent = s.accent || t.accent;
  const order = effectiveOrder(t, s);
  const font = FONTS[s.font]?.css;
  const style = accentVars(accent) + (font ? `;--f-body:${font}` : "");
  const name = esc(has(r.name) ? r.name : opts.placeholderName || "Your Name");
  const titleHTML = has(r.title) ? `<div class="r-title">${esc(r.title)}</div>` : "";
  const mono = `<div class="r-mono" aria-hidden="true">${esc(initials(r.name))}</div>`;
  const photo = photoHTML(r, t, s);
  const secs = keys => keys.map(k => sectionHTML(k, r, s)).join("");
  const cls = `page t-${t.id} l-${t.layout} side-${t.sidePos || "left"} sz-${s.size} sp-${s.spacing} paper-${s.paper}${photo ? " has-photo" : ""}`;
  const idAttr = opts.id ? ` id="${esc(opts.id)}"` : "";

  if (t.layout === "sidebar") {
    const sideKeys = order.filter(k => t.side.includes(k));
    const mainKeys = order.filter(k => !t.side.includes(k));
    if (t.head === "side") {
      return `<div class="${cls}"${idAttr} style="${esc(style)}">
<aside class="r-side">${photo}<header class="r-head"><div class="r-hd">${mono}<h1 class="r-name">${name}</h1>${titleHTML}</div></header>
${contactHTML(r) ? `<section class="r-sec r-sec--contact"><h2 class="r-sec-h"><span>Contact</span></h2><div class="r-sec-b">${contactHTML(r)}</div></section>` : ""}
${secs(sideKeys)}</aside>
<main class="r-main">${secs(mainKeys)}</main></div>`;
    }
    return `<div class="${cls}"${idAttr} style="${esc(style)}">
<aside class="r-side">${photo}${contactHTML(r) ? `<section class="r-sec r-sec--contact"><h2 class="r-sec-h"><span>Contact</span></h2><div class="r-sec-b">${contactHTML(r)}</div></section>` : ""}${secs(sideKeys)}</aside>
<main class="r-main"><header class="r-head"><div class="r-hd">${mono}<h1 class="r-name">${name}</h1>${titleHTML}</div></header>${secs(mainKeys)}</main></div>`;
  }

  const head = `<header class="r-head">${photo}<div class="r-hd">${mono}<h1 class="r-name">${name}</h1>${titleHTML}${contactHTML(r)}</div></header>`;
  if (t.layout === "twocol") {
    const sideKeys = order.filter(k => t.side.includes(k));
    const mainKeys = order.filter(k => !t.side.includes(k));
    return `<div class="${cls}"${idAttr} style="${esc(style)}">${head}<div class="r-cols"><div class="r-col-main">${secs(mainKeys)}</div><div class="r-col-side">${secs(sideKeys)}</div></div></div>`;
  }
  return `<div class="${cls}"${idAttr} style="${esc(style)}">${head}<div class="r-body">${secs(order)}</div></div>`;
}
