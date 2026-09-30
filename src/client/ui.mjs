// Small UI helpers shared by every page.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const CFG = window.RF_CONFIG || {};

export function debounce(fn, ms) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  d.cancel = () => clearTimeout(t);
  return d;
}

let toastT;
export function toast(msg, ms = 3400) {
  let t = document.getElementById("rf-toast");
  if (!t) { t = document.createElement("div"); t.id = "rf-toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false;
  t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms);
}

// Minimal modal: returns {el, close}. content is an HTML string.
export function openModal(html, { wide = false, onClose, dismissable = true } = {}) {
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal${wide ? " wide" : ""}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(back);
  const el = back.firstElementChild;
  const prevFocus = document.activeElement;
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    back.remove(); document.removeEventListener("keydown", onKey);
    prevFocus?.focus?.(); onClose?.();
  };
  const onKey = e => { if (e.key === "Escape" && (dismissable === true || (typeof dismissable === "function" && dismissable()))) close(); };
  document.addEventListener("keydown", onKey);
  back.addEventListener("mousedown", e => { if (e.target === back && (dismissable === true || (typeof dismissable === "function" && dismissable()))) close(); });
  el.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  setTimeout(() => (el.querySelector("[autofocus]") || el.querySelector("input,textarea,button"))?.focus(), 30);
  return { el, close };
}

export function confirmDialog(message, { ok = "Delete", cancel = "Cancel", danger = true } = {}) {
  return new Promise(resolve => {
    let answered = false;
    const m = openModal(`<h2>${esc(message)}</h2><div class="modal-foot"><button class="btn btn-ghost" data-close>${esc(cancel)}</button><button class="btn ${danger ? "btn-primary" : "btn-primary"}" data-ok>${esc(ok)}</button></div>`,
      { onClose: () => { if (!answered) resolve(false); } });
    m.el.querySelector("[data-ok]").onclick = () => { answered = true; m.close(); resolve(true); };
  });
}

export function loadScript(src) {
  window.__rfScripts = window.__rfScripts || {};
  if (!window.__rfScripts[src]) {
    window.__rfScripts[src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true; s.onload = res;
      s.onerror = () => { delete window.__rfScripts[src]; rej(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }
  return window.__rfScripts[src];
}

export function timeAgo(iso) {
  const d = new Date(iso); const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  if (s < 86400 * 7) return Math.floor(s / 86400) + " days ago";
  return d.toLocaleDateString();
}

// Scales a fixed-width .page inside a box to fit its width.
export function fitPage(holder, inner, maxScale = 1, pad = 0) {
  const page = inner.firstElementChild;
  if (!page) return 1;
  const w = page.offsetWidth || 794;
  const avail = Math.max(120, holder.parentElement.clientWidth - pad);
  const s = Math.min(maxScale, avail / w);
  inner.style.transform = `scale(${s})`;
  holder.style.width = w * s + "px";
  holder.style.height = page.offsetHeight * s + "px";
  return s;
}

const P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  upload: `<svg viewBox="0 0 24 24" ${P}><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>`,
  download: `<svg viewBox="0 0 24 24" ${P}><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" ${P}><path d="M12 3l1.9 4.9L19 10l-5.1 2.1L12 17l-1.9-4.9L5 10l5.1-2.1z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" ${P}><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>`,
  palette: `<svg viewBox="0 0 24 24" ${P}><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 22 9.7C22 5.9 17.5 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" ${P}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" ${P}><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`,
  up: `<svg viewBox="0 0 24 24" ${P}><path d="M6 15l6-6 6 6"/></svg>`,
  down: `<svg viewBox="0 0 24 24" ${P}><path d="M6 9l6 6 6-6"/></svg>`,
  x: `<svg viewBox="0 0 24 24" ${P}><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" ${P}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" ${P}><path d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${P} stroke-width="3"><path d="M5 12l5 5 9-10"/></svg>`,
  user: `<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>`,
  grad: `<svg viewBox="0 0 24 24" ${P}><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/></svg>`,
  star: `<svg viewBox="0 0 24 24" ${P}><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/></svg>`,
  code: `<svg viewBox="0 0 24 24" ${P}><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>`,
  award: `<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>`,
  id: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3M15 10h3M15 13h3"/></svg>`,
  list: `<svg viewBox="0 0 24 24" ${P}><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>`,
  text: `<svg viewBox="0 0 24 24" ${P}><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" ${P}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>`,
  file: `<svg viewBox="0 0 24 24" ${P}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`,
  target: `<svg viewBox="0 0 24 24" ${P}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" ${P}><path d="M4 18a9 9 0 1 1 16 0"/><path d="M12 14l4-5"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  undo: `<svg viewBox="0 0 24 24" ${P}><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>`,
  redo: `<svg viewBox="0 0 24 24" ${P}><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>`,
  link: `<svg viewBox="0 0 24 24" ${P}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" ${P}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" ${P}><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" ${P}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" ${P}><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" ${P}><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  google: `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`
};
