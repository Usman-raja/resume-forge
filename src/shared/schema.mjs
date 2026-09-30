// Resume data model shared by the browser app, the static build and the AI server.
import { DEFAULT_ORDER } from "./templates.mjs";

export const SECTION_KEYS = DEFAULT_ORDER;
export const SECTION_LABELS = {
  summary: "Profile", experience: "Experience", education: "Education", projects: "Projects",
  skills: "Skills", certifications: "Certifications", languages: "Languages",
  details: "Personal details", custom: "Custom sections"
};

export function emptyResume() {
  return {
    name: "", title: "", email: "", phone: "", location: "", links: [], photo: "", summary: "",
    experience: [], education: [], projects: [], skills: [], certifications: [], languages: [],
    details: [], custom: []
  };
}

export const NEW_ITEM = {
  experience: () => ({ role: "", company: "", location: "", start: "", end: "", bullets: [""] }),
  education: () => ({ degree: "", school: "", location: "", start: "", end: "", details: "" }),
  projects: () => ({ name: "", link: "", desc: "" }),
  details: () => ({ label: "", value: "" }),
  custom: () => ({ title: "", items: [""] })
};

export const DEFAULT_SETTINGS = {
  template: "modern", accent: "", font: "", size: "m", spacing: "normal", paper: "a4",
  showPhoto: true, order: null, hidden: [], titles: {}
};

const str = v => (v == null ? "" : String(v));
const arr = v => (Array.isArray(v) ? v : typeof v === "string" && v.trim() ? v.split(/\n|,(?![^()]*\))/) : []);
const strs = v => arr(v).map(x => str(x).trim()).filter(Boolean);

export function normalizeResume(r) {
  r = r && typeof r === "object" ? r : {};
  const photo = str(r.photo);
  return {
    name: str(r.name), title: str(r.title), email: str(r.email), phone: str(r.phone), location: str(r.location),
    links: strs(r.links),
    photo: photo.startsWith("data:image/") ? photo : "",
    summary: str(r.summary),
    experience: (Array.isArray(r.experience) ? r.experience : []).map(e => ({
      role: str(e?.role), company: str(e?.company), location: str(e?.location), start: str(e?.start), end: str(e?.end),
      bullets: arr(e?.bullets).map(str)
    })),
    education: (Array.isArray(r.education) ? r.education : []).map(e => ({
      degree: str(e?.degree), school: str(e?.school), location: str(e?.location), start: str(e?.start), end: str(e?.end), details: str(e?.details)
    })),
    projects: (Array.isArray(r.projects) ? r.projects : []).map(p => ({ name: str(p?.name), link: str(p?.link), desc: str(p?.desc) })),
    skills: strs(r.skills), certifications: strs(r.certifications), languages: strs(r.languages),
    details: (Array.isArray(r.details) ? r.details : []).map(d => ({ label: str(d?.label), value: str(d?.value) })),
    custom: (Array.isArray(r.custom) ? r.custom : []).map(c => ({ title: str(c?.title), items: arr(c?.items).map(str) }))
  };
}

export function normalizeSettings(s) {
  s = s && typeof s === "object" ? s : {};
  const out = { ...DEFAULT_SETTINGS, ...s };
  out.hidden = Array.isArray(s.hidden) ? s.hidden.filter(k => SECTION_KEYS.includes(k)) : [];
  if (Array.isArray(s.order)) {
    const o = s.order.filter(k => SECTION_KEYS.includes(k));
    SECTION_KEYS.forEach(k => { if (!o.includes(k)) o.push(k); });
    out.order = o;
  } else out.order = null;
  out.titles = s.titles && typeof s.titles === "object" ? { ...s.titles } : {};
  if (!["s", "m", "l"].includes(out.size)) out.size = "m";
  if (!["compact", "normal", "airy"].includes(out.spacing)) out.spacing = "normal";
  if (!["a4", "letter"].includes(out.paper)) out.paper = "a4";
  out.showPhoto = out.showPhoto !== false;
  return out;
}

// Plain-text version, used for .txt export, AI prompts and word counts.
export function resumeToText(r) {
  const L = [];
  const clean = a => (a || []).map(x => String(x).trim()).filter(Boolean);
  const range = (a, b) => [a, b].filter(x => String(x || "").trim()).join(" – ");
  L.push((r.name || "").toUpperCase());
  if (r.title) L.push(r.title);
  L.push([r.email, r.phone, r.location, ...clean(r.links)].filter(Boolean).join(" | "));
  const H = t => L.push("", t.toUpperCase(), "-".repeat(t.length));
  if (r.summary) { H("Profile"); L.push(r.summary); }
  const exp = (r.experience || []).filter(e => e.role || e.company || clean(e.bullets).length);
  const edu = (r.education || []).filter(e => e.degree || e.school);
  const proj = (r.projects || []).filter(p => p.name || p.desc);
  if (exp.length) {
    H("Experience");
    exp.forEach(e => {
      const d = range(e.start, e.end);
      L.push([e.role, e.company, e.location].filter(Boolean).join(", ") + (d ? `  (${d})` : ""));
      clean(e.bullets).forEach(b => L.push("• " + b));
      L.push("");
    });
  }
  if (edu.length) {
    H("Education");
    edu.forEach(e => {
      const d = range(e.start, e.end);
      L.push([e.degree, e.school, e.location].filter(Boolean).join(", ") + (d ? `  (${d})` : ""));
      if (e.details) L.push(e.details);
    });
  }
  if (proj.length) { H("Projects"); proj.forEach(p => { L.push([p.name, p.link].filter(Boolean).join(" — ")); if (p.desc) L.push(p.desc); }); }
  if (clean(r.skills).length) { H("Skills"); L.push(clean(r.skills).join(", ")); }
  if (clean(r.certifications).length) { H("Certifications"); clean(r.certifications).forEach(c => L.push("• " + c)); }
  if (clean(r.languages).length) { H("Languages"); L.push(clean(r.languages).join(", ")); }
  if (r.details?.length) { H("Personal details"); r.details.filter(d => d.label || d.value).forEach(d => L.push(`${d.label}: ${d.value}`)); }
  (r.custom || []).forEach(c => { if (!c.title && !clean(c.items).length) return; H(c.title || "Additional"); clean(c.items).forEach(i => L.push("• " + i)); });
  return L.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
