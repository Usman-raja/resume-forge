// Resume Forge builder app.
import { $, $$, esc, debounce, toast, openModal, confirmDialog, ICON, CFG, fitPage } from "./ui.mjs";
import { authEnabled, getUser, onAuthChange, goSignIn, signInWithGoogle } from "./auth.mjs";
import * as store from "./store.mjs";
import { callAI, aiMessage, onUsage, refreshUsage, aiNeedsLogin, aiAvailable } from "./ai.mjs";
import { readResumeFile, photoToDataUrl, basicParse } from "./importer.mjs";
import { printResume, exportDocx, exportText, exportJson, fileBase } from "./export.mjs";
import { adSlotHTML, pushAds } from "./common.mjs";
import { renderResume, effectiveOrder } from "/js/shared/render.mjs";
import { TEMPLATES, TAG_LABELS, FONTS, ACCENTS, getTemplate } from "/js/shared/templates.mjs";
import { emptyResume, normalizeResume, normalizeSettings, NEW_ITEM, SECTION_LABELS, SECTION_KEYS } from "/js/shared/schema.mjs";
import { EXAMPLE } from "/js/shared/sample.mjs";
import { EXAMPLES } from "/js/shared/examples.mjs";

/* ============================== state ============================== */
const S = {
  doc: null,            // {id, title, data, settings, isExample}
  user: null,
  tab: "content",
  review: null,         // last AI result card
  beforeAI: null,       // snapshot for "Undo AI changes"
  open: new Set(["personal", "summary", "experience"]),
  zoom: "fit",
  hist: [], fut: [],
  tplFilter: "all",
  saveState: "local",
  usage: null
};
const clone = o => JSON.parse(JSON.stringify(o));
const has = v => String(v ?? "").trim().length > 0;
const snapshot = () => JSON.stringify({ data: S.doc.data, settings: S.doc.settings });

function newDoc({ data, settings, title, isExample = false, id = null, cloudId = null } = {}) {
  return {
    id, cloudId, title: title || "My resume", isExample,
    data: normalizeResume(data || emptyResume()),
    settings: normalizeSettings(settings || {})
  };
}
function blankData() {
  const d = emptyResume();
  d.experience.push(NEW_ITEM.experience());
  d.education.push(NEW_ITEM.education());
  return d;
}

/* ============================== paths ============================== */
function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, val) {
  const ks = path.split("."); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
  o[ks[ks.length - 1]] = val;
}

/* ============================== history ============================== */
function pushHistory() {
  S.hist.push(snapshot());
  if (S.hist.length > 60) S.hist.shift();
  S.fut = [];
  syncUndo();
}
let typingTimer = null;
function typingHistory() {
  if (!typingTimer) pushHistory();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => { typingTimer = null; }, 1200);
}
function restore(json) {
  const o = JSON.parse(json);
  S.doc.data = normalizeResume(o.data);
  S.doc.settings = normalizeSettings(o.settings);
  renderAll(); saveSoon();
}
function undo() { if (!S.hist.length) return; S.fut.push(snapshot()); restore(S.hist.pop()); syncUndo(); }
function redo() { if (!S.fut.length) return; S.hist.push(snapshot()); restore(S.fut.pop()); syncUndo(); }
function syncUndo() {
  const u = $("#btnUndo"), r = $("#btnRedo");
  if (u) u.disabled = !S.hist.length;
  if (r) r.disabled = !S.fut.length;
}

/* ============================== saving ============================== */
function setSave(state, msg) {
  S.saveState = state;
  const el = $("#saveState"); if (!el) return;
  el.className = "save-state" + (state === "saving" ? " saving" : state === "error" ? " err" : "");
  if (state === "saving") el.innerHTML = `<i></i><span class="lbl">Saving…</span>`;
  else if (state === "error") el.innerHTML = `<i></i><span class="lbl">${esc(msg || "Couldn't save")}</span> <button type="button" data-act="retry-save">Retry</button>`;
  else if (state === "cloud") el.innerHTML = `<i></i><span class="lbl">Saved to your account</span>`;
  else if (authEnabled && S.user) el.innerHTML = `<i></i><span class="lbl">Saved in this browser</span> <button type="button" data-act="save-cloud">Save to my account</button>`;
  else if (authEnabled) el.innerHTML = `<i></i><span class="lbl">Saved in this browser</span> <button type="button" data-act="signin-save">Sign in to keep it safe</button>`;
  else el.innerHTML = `<i></i><span class="lbl">Saved in this browser</span>`;
}
async function save() {
  const d = S.doc;
  const payload = { title: d.title, data: d.data, settings: d.settings };
  if (d.id && S.user) {
    setSave("saving");
    try { await store.updateResume(d.id, payload); setSave("cloud"); }
    catch (e) { setSave("error", "Couldn't save online"); console.error(e); }
    store.saveLocal({ ...payload, cloudId: d.id, isExample: false, updatedAt: Date.now() });
  } else {
    store.saveLocal({ ...payload, isExample: d.isExample, updatedAt: Date.now() });
    setSave("local");
  }
}
const saveSoon = debounce(save, 900);
window.addEventListener("beforeunload", () => saveSoon.flush());
document.addEventListener("visibilitychange", () => { if (document.hidden) saveSoon.flush(); });

async function saveToCloud() {
  if (!S.user) return goSignIn(location.pathname + location.search);
  try {
    setSave("saving");
    const row = await store.createResume({ title: S.doc.title, data: S.doc.data, settings: S.doc.settings });
    S.doc.id = row.id; S.doc.isExample = false;
    const u = new URL(location.href); u.search = "?id=" + row.id; history.replaceState(null, "", u);
    setSave("cloud"); toast("Saved to your account. Find it any time under My resumes.");
  } catch (e) { setSave("error", "Couldn't save online"); toast(e.message || "Couldn't save"); }
}

/* ============================== commit ============================== */
const renderPreviewSoon = debounce(() => renderPreview(), 60);
const renderThumbsSoon = debounce(() => { if (S.tab === "design") renderTemplatePicker(); }, 700);
function changed({ editor = false, preview = true, thumbs = true } = {}) {
  if (S.doc.isExample) { S.doc.isExample = false; if (!editor) renderEditorBanner(); }
  if (editor) renderEditor();
  if (preview) renderPreviewSoon();
  if (thumbs) renderThumbsSoon();
  saveSoon();
}

/* ============================== preview ============================== */
const PAGE_BREAKS = { a4: { first: 1077.6, next: 1039.9 }, letter: { first: 1010.6, next: 972.8 } };
function renderPreview(anim = false) {
  const inner = $("#pageScale"), holder = $("#pageHolder");
  inner.innerHTML = renderResume(S.doc.data, S.doc.settings);
  holder.classList.toggle("page-anim", anim);
  if (anim) setTimeout(() => holder.classList.remove("page-anim"), 400);
  fitPreview();
  $("#tplName").textContent = getTemplate(S.doc.settings.template).name;
}
function fitPreview() {
  const inner = $("#pageScale"), holder = $("#pageHolder");
  const page = inner.firstElementChild; if (!page) return;
  const canvas = $("#canvas");
  const w = page.offsetWidth, h = page.offsetHeight;
  let s;
  if (S.zoom === "fit") s = Math.min(1.1, Math.max(0.3, (canvas.clientWidth - (innerWidth < 980 ? 20 : 56)) / w));
  else s = S.zoom;
  inner.style.transform = `scale(${s})`;
  holder.style.width = w * s + "px";
  holder.style.height = h * s + "px";
  $("#zoomVal").textContent = Math.round(s * 100) + "%";
  // page-break markers, based on the real content height (not the page's minimum height)
  $$(".pb-mark", holder).forEach(m => m.remove());
  page.style.minHeight = "0";
  const contentH = page.offsetHeight;
  page.style.minHeight = "";
  const pb = PAGE_BREAKS[S.doc.settings.paper] || PAGE_BREAKS.a4;
  let y = pb.first, n = 2;
  while (y < contentH - 4 && n < 12) {
    holder.insertAdjacentHTML("beforeend", `<div class="pb-mark" style="top:${y * s}px"><span>Page ${n}</span></div>`);
    y += pb.next; n++;
  }
  const pages = n - 1;
  $("#pageCount").textContent = pages === 1 ? "1 page" : pages + " pages";
}
new ResizeObserver(() => { if (S.doc) fitPreview(); }).observe(document.getElementById("canvas"));

/* ============================== editor ============================== */
const fid = p => "f-" + p.replace(/\./g, "-");
function field(label, path, { ph = "", type = "text", area = false, rows = 3, full = true } = {}) {
  const v = getPath(S.doc.data, path) ?? "";
  const input = area
    ? `<textarea id="${fid(path)}" data-k="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(v)}</textarea>`
    : `<input id="${fid(path)}" data-k="${path}" type="${type}" value="${esc(v)}" placeholder="${esc(ph)}" autocomplete="off">`;
  return `<label class="field"${full ? "" : ""}><span>${label}</span>${input}</label>`;
}
function chips(path, ph) {
  const arr = getPath(S.doc.data, path) || [];
  return `<div class="chips-input" data-chips="${path}">${arr.map((c, i) => `<span class="chip"><span>${esc(c)}</span><button type="button" data-act="chip-rm" data-path="${path}" data-i="${i}" aria-label="Remove ${esc(c)}">×</button></span>`).join("")}<input id="${fid(path)}-in" placeholder="${esc(ph)}" aria-label="${esc(ph)}"></div>`;
}
function itemHead(list, i, label) {
  const n = S.doc.data[list].length;
  return `<div class="item-h"><b>${esc(label)}</b>
    <button type="button" class="icon-btn" data-act="up" data-list="${list}" data-i="${i}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>${ICON.up}</button>
    <button type="button" class="icon-btn" data-act="down" data-list="${list}" data-i="${i}" aria-label="Move down" ${i === n - 1 ? "disabled" : ""}>${ICON.down}</button>
    <button type="button" class="icon-btn" data-act="rm" data-list="${list}" data-i="${i}" aria-label="Remove">${ICON.trash}</button></div>`;
}
function sec(id, title, icon, inner, count) {
  const hidden = SECTION_KEYS.includes(id) && S.doc.settings.hidden.includes(id);
  return `<details class="ed-sec" data-sec="${id}" ${S.open.has(id) ? "open" : ""}><summary><span class="ic">${icon}</span>${esc(title)}${count != null ? ` <span class="count">${count}</span>` : ""}${hidden ? ` <span class="hid">Hidden</span>` : ""}</summary><div class="ed-body">${inner}</div></details>`;
}
const aiBtn = (act, label, extra = "") => `<button type="button" class="ai-link" data-act="${act}" ${extra}>${ICON.sparkle}<span>${label}</span></button>`;

function renderEditorBanner() {
  const slot = $("#edBanner"); if (!slot) return;
  let h = "";
  if (S.review) h += reviewHTML();
  if (S.doc.isExample) h += `<div class="notice warn" style="display:grid;gap:10px"><div><b>This is an example resume.</b> Upload your old CV and our AI will rewrite it, or clear it and type your own details.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ai btn-sm" type="button" data-act="open-import">${ICON.upload} Upload my CV</button><button class="btn btn-sm" type="button" data-act="start-blank">Start blank</button></div></div>`;
  slot.innerHTML = h;
  animateRing();
}

function renderEditor() {
  const d = S.doc.data, st = S.doc.settings, t = getTemplate(st.template);
  const photoNote = t.photo ? (st.showPhoto ? "Shown on this template." : "Hidden — turn it on under Design.") : `The ${t.name} template has no photo. Try Modern, Creative, Banner or Horizon.`;
  let h = `<div id="edBanner"></div>`;
  h += sec("personal", "Personal details", ICON.user, `
    <div class="photo-row"><div class="photo-prev">${d.photo ? `<img src="${esc(d.photo)}" alt="Your photo">` : ICON.camera}</div>
      <div><div style="display:flex;gap:6px;flex-wrap:wrap"><label class="btn btn-sm" for="photoIn">${d.photo ? "Change photo" : "Add photo"}</label>${d.photo ? `<button type="button" class="btn btn-sm btn-ghost" data-act="photo-rm">Remove</button>` : ""}</div>
      <p class="note">${esc(photoNote)}</p><input type="file" id="photoIn" accept="image/*" hidden></div></div>
    ${field("Full name", "name", { ph: "e.g. Muhammad Ali Khan" })}
    ${field("Job title", "title", { ph: "e.g. Accountant, Software Engineer" })}
    <div class="grid2">${field("Email", "email", { type: "email", ph: "you@example.com" })}${field("Phone", "phone", { type: "tel", ph: "+92 3xx xxxxxxx" })}</div>
    ${field("City, Country", "location", { ph: "Lahore, Pakistan" })}
    <div class="field"><span>Links <em>(LinkedIn, portfolio — press Enter after each)</em></span>${chips("links", "linkedin.com/in/yourname")}</div>`);
  h += sec("summary", st.titles.summary || "Profile / summary", ICON.text, `
    ${field("", "summary", { area: true, rows: 5, ph: "2–3 lines: who you are, your experience, and what you're great at." })}
    <div class="ai-inline">${aiBtn("ai-summary", has(d.summary) ? "Rewrite with AI" : "Write it for me")}</div>`);
  h += sec("experience", st.titles.experience || "Work experience", ICON.briefcase,
    d.experience.map((e, i) => `<div class="item">${itemHead("experience", i, e.role || e.company || `Job ${i + 1}`)}
      <div class="grid2">${field("Job title", `experience.${i}.role`)}${field("Company", `experience.${i}.company`)}</div>
      <div class="grid2">${field("Start", `experience.${i}.start`, { ph: "Jan 2022" })}${field("End", `experience.${i}.end`, { ph: "Present" })}</div>
      ${field("Location", `experience.${i}.location`, { ph: "Karachi" })}
      <div class="field"><span>Achievements <em>(one per line — start with a verb)</em></span><div class="bullets">
        ${(e.bullets.length ? e.bullets : [""]).map((b, j) => `<div class="bullet"><textarea id="${fid(`experience.${i}.bullets.${j}`)}" data-k="experience.${i}.bullets.${j}" rows="1" placeholder="e.g. Increased monthly sales by 20% by…">${esc(b)}</textarea>
          <button type="button" class="icon-btn ai" data-act="ai-bullet" data-i="${i}" data-j="${j}" title="Improve with AI" aria-label="Improve this line with AI">${ICON.sparkle}</button>
          <button type="button" class="icon-btn" data-act="bullet-rm" data-i="${i}" data-j="${j}" aria-label="Remove line">${ICON.x}</button></div>`).join("")}
      </div></div>
      <button type="button" class="add-btn" data-act="bullet-add" data-i="${i}">${ICON.plus} Add line</button>
    </div>`).join("") + `<button type="button" class="add-btn" data-act="add" data-list="experience">${ICON.plus} Add job</button>`, d.experience.length);
  h += sec("education", st.titles.education || "Education", ICON.grad,
    d.education.map((e, i) => `<div class="item">${itemHead("education", i, e.degree || e.school || `Education ${i + 1}`)}
      ${field("Degree / certificate", `education.${i}.degree`, { ph: "BS Computer Science, Intermediate (FSc)…" })}
      <div class="grid2">${field("School / university", `education.${i}.school`)}${field("City", `education.${i}.location`)}</div>
      <div class="grid2">${field("Start", `education.${i}.start`, { ph: "2019" })}${field("End", `education.${i}.end`, { ph: "2023" })}</div>
      ${field("Details", `education.${i}.details`, { ph: "CGPA 3.5/4.0, honours, final year project" })}
    </div>`).join("") + `<button type="button" class="add-btn" data-act="add" data-list="education">${ICON.plus} Add education</button>`, d.education.length);
  h += sec("skills", st.titles.skills || "Skills", ICON.star, `
    ${chips("skills", "Type a skill and press Enter")}
    <div class="ai-inline">${aiBtn("ai-skills", "Suggest skills")}</div><div class="suggest" id="skillSuggest"></div>`, d.skills.length);
  h += sec("projects", st.titles.projects || "Projects", ICON.code,
    d.projects.map((p, i) => `<div class="item">${itemHead("projects", i, p.name || `Project ${i + 1}`)}
      <div class="grid2">${field("Project name", `projects.${i}.name`)}${field("Link", `projects.${i}.link`, { ph: "github.com/…" })}</div>
      ${field("What it does and your role", `projects.${i}.desc`, { area: true, rows: 3 })}
    </div>`).join("") + `<button type="button" class="add-btn" data-act="add" data-list="projects">${ICON.plus} Add project</button>`, d.projects.length);
  h += sec("certifications", st.titles.certifications || "Certifications", ICON.award, chips("certifications", "e.g. Google Data Analytics (2024)"), d.certifications.length);
  h += sec("languages", st.titles.languages || "Languages", ICON.globe, chips("languages", "e.g. English — fluent"), d.languages.length);
  const presets = ["Date of birth", "Nationality", "Marital status", "Driving licence", "Visa status", "Notice period", "Religion", "CNIC / Passport"];
  h += sec("details", st.titles.details || "Personal information", ICON.id, `
    <p class="note">Common on CVs for Pakistan and the Gulf. Leave it empty for UK/US jobs.</p>
    ${d.details.map((x, i) => `<div class="kvrow"><input class="input" data-k="details.${i}.label" id="${fid(`details.${i}.label`)}" value="${esc(x.label)}" placeholder="Label" aria-label="Label"><input class="input" data-k="details.${i}.value" id="${fid(`details.${i}.value`)}" value="${esc(x.value)}" placeholder="Value" aria-label="Value"><button type="button" class="icon-btn" data-act="rm" data-list="details" data-i="${i}" aria-label="Remove">${ICON.trash}</button></div>`).join("")}
    <div class="suggest">${presets.filter(p => !d.details.some(x => x.label === p)).map(p => `<button type="button" data-act="detail-add" data-label="${esc(p)}">+ ${esc(p)}</button>`).join("")}<button type="button" data-act="detail-add" data-label="">+ Other</button></div>`, d.details.length || null);
  h += sec("custom", "Custom sections", ICON.layers,
    d.custom.map((c, i) => `<div class="item">${itemHead("custom", i, c.title || `Section ${i + 1}`)}
      ${field("Section title", `custom.${i}.title`, { ph: "Awards, Volunteering, References, Publications…" })}
      <label class="field"><span>Items <em>(one per line)</em></span><textarea id="${fid(`custom.${i}.items`)}" data-k="custom.${i}.items" data-type="lines" rows="3">${esc(c.items.join("\n"))}</textarea></label>
    </div>`).join("") + `<div class="suggest">${["Awards", "Volunteering", "Hobbies & interests", "References", "Publications", "Trainings"].map(x => `<button type="button" data-act="custom-add" data-title="${esc(x)}">+ ${esc(x)}</button>`).join("")}</div>`, d.custom.length || null);
  h += adSlotHTML("builder");
  $("#paneContent").innerHTML = h;
  renderEditorBanner();
  $$("#paneContent .bullet textarea").forEach(autoGrow);
  pushAds($("#paneContent"));
}
function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = Math.max(40, ta.scrollHeight + 2) + "px"; }

/* ---------- editor events ---------- */
const panel = $("#panel");
panel.addEventListener("toggle", e => {
  const d = e.target.closest?.("details.ed-sec"); if (!d) return;
  d.open ? S.open.add(d.dataset.sec) : S.open.delete(d.dataset.sec);
}, true);
panel.addEventListener("input", e => {
  const el = e.target;
  if (el.matches(".sec-row input[data-title-for]")) {
    const k = el.dataset.titleFor; typingHistory();
    if (has(el.value)) S.doc.settings.titles[k] = el.value; else delete S.doc.settings.titles[k];
    changed({ thumbs: false }); return;
  }
  const k = el.dataset.k; if (!k) return;
  typingHistory();
  let v = el.value;
  if (el.dataset.type === "lines") v = v.split("\n");
  setPath(S.doc.data, k, v);
  if (el.tagName === "TEXTAREA" && el.closest(".bullet")) autoGrow(el);
  changed();
});
panel.addEventListener("keydown", e => {
  const inp = e.target;
  const box = inp.closest?.(".chips-input");
  if (box && inp.tagName === "INPUT") {
    const path = box.dataset.chips;
    if ((e.key === "Enter" || e.key === ",") && inp.value.trim()) {
      e.preventDefault();
      addChips(path, inp.value);
    } else if (e.key === "Backspace" && !inp.value) {
      const arr = getPath(S.doc.data, path);
      if (arr.length) { pushHistory(); arr.pop(); rerenderChips(path); changed(); }
    }
  }
  if (inp.matches?.(".bullet textarea") && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const [, i, , j] = inp.dataset.k.split(".").map((x, n) => (n ? +x : x));
    pushHistory();
    S.doc.data.experience[i].bullets.splice(j + 1, 0, "");
    renderEditor(); changed();
    setTimeout(() => $(`#${fid(`experience.${i}.bullets.${j + 1}`)}`)?.focus(), 0);
  }
});
panel.addEventListener("focusout", e => {
  const inp = e.target, box = inp.closest?.(".chips-input");
  if (box && inp.tagName === "INPUT" && inp.value.trim()) addChips(box.dataset.chips, inp.value);
});
panel.addEventListener("paste", e => {
  const box = e.target.closest?.(".chips-input");
  if (!box) return;
  const t = e.clipboardData?.getData("text") || "";
  if (/[,\n]/.test(t)) { e.preventDefault(); addChips(box.dataset.chips, t); }
});
function addChips(path, raw) {
  const arr = getPath(S.doc.data, path);
  const items = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean).filter(s => !arr.some(a => a.toLowerCase() === s.toLowerCase()));
  if (!items.length) { const i = $(`#${fid(path)}-in`); if (i) i.value = ""; return; }
  pushHistory(); arr.push(...items);
  rerenderChips(path); changed();
}
function rerenderChips(path) {
  const box = $(`[data-chips="${path}"]`); if (!box) return;
  const tmp = document.createElement("div"); tmp.innerHTML = chips(path, box.querySelector("input")?.placeholder || "");
  box.replaceWith(tmp.firstElementChild);
  $(`#${fid(path)}-in`)?.focus();
  const sum = $(`details[data-sec="${path}"] .count`); if (sum) sum.textContent = getPath(S.doc.data, path).length;
}
panel.addEventListener("change", async e => {
  if (e.target.id === "photoIn") {
    const f = e.target.files[0]; if (!f) return;
    try { pushHistory(); S.doc.data.photo = await photoToDataUrl(f); changed({ editor: true }); toast("Photo added"); }
    catch (err) { toast(err.message); }
  }
});
panel.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b || b.closest("#paneDesign, #paneAI")) return;
  const act = b.dataset.act, list = b.dataset.list, i = +b.dataset.i, j = +b.dataset.j;
  const d = S.doc.data;
  switch (act) {
    case "add": pushHistory(); d[list].push(NEW_ITEM[list]()); S.open.add(list); changed({ editor: true }); focusLast(list); return;
    case "rm": pushHistory(); d[list].splice(i, 1); changed({ editor: true }); return;
    case "up": if (i > 0) { pushHistory(); [d[list][i - 1], d[list][i]] = [d[list][i], d[list][i - 1]]; changed({ editor: true }); } return;
    case "down": if (i < d[list].length - 1) { pushHistory(); [d[list][i + 1], d[list][i]] = [d[list][i], d[list][i + 1]]; changed({ editor: true }); } return;
    case "bullet-add": pushHistory(); d.experience[i].bullets.push(""); changed({ editor: true }); setTimeout(() => $(`#${fid(`experience.${i}.bullets.${d.experience[i].bullets.length - 1}`)}`)?.focus(), 0); return;
    case "bullet-rm": pushHistory(); d.experience[i].bullets.splice(j, 1); changed({ editor: true }); return;
    case "chip-rm": { pushHistory(); getPath(d, b.dataset.path).splice(i, 1); rerenderChips(b.dataset.path); changed(); return; }
    case "photo-rm": pushHistory(); d.photo = ""; changed({ editor: true }); return;
    case "detail-add": pushHistory(); d.details.push({ label: b.dataset.label, value: "" }); changed({ editor: true }); setTimeout(() => $(`#${fid(`details.${d.details.length - 1}.${b.dataset.label ? "value" : "label"}`)}`)?.focus(), 0); return;
    case "custom-add": pushHistory(); d.custom.push({ title: b.dataset.title, items: [""] }); S.open.add("custom"); changed({ editor: true }); setTimeout(() => $(`#${fid(`custom.${d.custom.length - 1}.items`)}`)?.focus(), 0); return;
    case "skill-add": addChips("skills", b.dataset.skill); b.remove(); return;
    case "start-blank": {
      pushHistory();
      S.doc = newDoc({ data: blankData(), settings: S.doc.settings, title: "My resume" });
      S.review = null; S.beforeAI = null;
      renderAll(); saveSoon(); toast("Blank resume ready. Start with your name.");
      setTimeout(() => $("#f-name")?.focus(), 50); return;
    }
    case "open-import": return openAIModal("import");
    case "ai-summary": return aiSummary(b);
    case "ai-bullet": return aiBullet(b, i, j);
    case "ai-skills": return aiSkills(b);
    case "revert": if (S.beforeAI) { pushHistory(); restore(S.beforeAI); S.beforeAI = null; S.review = null; renderEditorBanner(); toast("AI changes undone"); } return;
    case "dismiss": S.review = null; renderEditorBanner(); return;
    case "ai-mode": return openAIModal(b.dataset.mode);
  }
});
function focusLast(list) {
  const n = S.doc.data[list].length - 1;
  const first = { experience: "role", education: "degree", projects: "name", custom: "title" }[list];
  setTimeout(() => { const el = $(`#${fid(`${list}.${n}.${first}`)}`); el?.focus(); el?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 0);
}

/* ============================== design pane ============================== */
function renderDesign() {
  const st = S.doc.settings, t = getTemplate(st.template);
  const accent = st.accent || t.accent;
  const filters = ["all", "ats", "photo", "professional", "creative", "simple", "fresher", "two-column"];
  const order = effectiveOrder(t, { ...st, hidden: [] });
  $("#paneDesign").innerHTML = `
  <div class="pane-h"><h2>Design</h2><span class="muted" style="font-size:13px">${TEMPLATES.length} templates, all free</span></div>
  <div class="d-block"><div class="filters" style="margin:0">${filters.map(f => `<button type="button" class="chip-btn" data-act="tpl-filter" data-f="${f}" aria-pressed="${S.tplFilter === f}">${f === "all" ? "All" : TAG_LABELS[f]}</button>`).join("")}</div>
    <div class="tpl-pick" id="tplPick"></div></div>
  <div class="d-block"><span class="field-label">Colour</span><div class="colors">${ACCENTS.map(c => `<button type="button" class="swatch" data-act="accent" data-c="${c}" style="background:${c}" aria-label="Colour ${c}" aria-pressed="${c.toLowerCase() === accent.toLowerCase()}"></button>`).join("")}
    <label class="color-custom" title="Custom colour"><input type="color" id="accentIn" value="${esc(accent)}" aria-label="Custom colour"></label>
    ${st.accent ? `<button type="button" class="btn btn-sm btn-ghost" data-act="accent-reset">Reset</button>` : ""}</div></div>
  <div class="grid2">
    <label class="field"><span>Font</span><select id="fontSel">${Object.entries(FONTS).map(([k, f]) => `<option value="${k}" ${k === st.font ? "selected" : ""}>${esc(f.label)}</option>`).join("")}</select></label>
    <div class="field"><span>Paper</span><div class="seg">${[["a4", "A4"], ["letter", "US Letter"]].map(([k, l]) => `<button type="button" data-act="paper" data-v="${k}" aria-pressed="${st.paper === k}">${l}</button>`).join("")}</div></div>
  </div>
  <div class="grid2">
    <div class="field"><span>Text size</span><div class="seg">${[["s", "Small"], ["m", "Medium"], ["l", "Large"]].map(([k, l]) => `<button type="button" data-act="size" data-v="${k}" aria-pressed="${st.size === k}">${l}</button>`).join("")}</div></div>
    <div class="field"><span>Spacing</span><div class="seg">${[["compact", "Tight"], ["normal", "Normal"], ["airy", "Airy"]].map(([k, l]) => `<button type="button" data-act="spacing" data-v="${k}" aria-pressed="${st.spacing === k}">${l}</button>`).join("")}</div></div>
  </div>
  ${t.photo ? `<label class="check"><input type="checkbox" id="photoChk" ${st.showPhoto ? "checked" : ""}><span>Show my photo<small>${S.doc.data.photo ? "" : "Add a photo under Personal details."}</small></span></label>` : ""}
  <div class="d-block"><div class="pane-h"><span class="field-label">Sections — order, rename, hide</span>${st.order || Object.keys(st.titles).length || st.hidden.length ? `<button type="button" class="btn btn-sm btn-ghost" data-act="sec-reset">Reset</button>` : ""}</div>
    <div class="sec-list">${order.map((k, i) => `<div class="sec-row${st.hidden.includes(k) ? " off" : ""}"><span class="grip">${i + 1}</span>
      ${k === "custom" ? `<input value="Custom sections" disabled aria-label="Custom sections">` : `<input data-title-for="${k}" value="${esc(st.titles[k] || SECTION_LABELS[k])}" aria-label="Title for ${esc(SECTION_LABELS[k])}">`}
      <button type="button" class="icon-btn" data-act="sec-up" data-k="${k}" ${i === 0 ? "disabled" : ""} aria-label="Move up">${ICON.up}</button>
      <button type="button" class="icon-btn" data-act="sec-down" data-k="${k}" ${i === order.length - 1 ? "disabled" : ""} aria-label="Move down">${ICON.down}</button>
      <button type="button" class="icon-btn" data-act="sec-toggle" data-k="${k}" aria-label="${st.hidden.includes(k) ? "Show" : "Hide"} section">${st.hidden.includes(k) ? ICON.eyeOff : ICON.eye}</button></div>`).join("")}</div>
    <p class="note">Sidebar templates keep skills, languages and certifications in the side column.</p></div>`;
  renderTemplatePicker();
}
function renderTemplatePicker() {
  const box = $("#tplPick"); if (!box) return;
  const st = S.doc.settings;
  const list = TEMPLATES.filter(t => S.tplFilter === "all" || t.tags.includes(S.tplFilter));
  box.innerHTML = list.map(t => `<button type="button" class="tpl-opt" data-act="tpl" data-id="${t.id}" aria-pressed="${t.id === st.template}">
    <div class="tpl-thumb">${t.id === st.template ? `<span class="tick">${ICON.check}</span>` : ""}<div class="mini">${renderResume(S.doc.data, { ...st, template: t.id, accent: st.accent })}</div></div><small>${esc(t.name)}</small></button>`).join("");
  requestAnimationFrame(() => {
    const th = box.querySelector(".tpl-thumb"); if (!th) return;
    const s = th.clientWidth / 794;
    $$(".mini", box).forEach(m => { m.style.transform = `scale(${s})`; });
  });
}
$("#paneDesign").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const st = S.doc.settings, t = getTemplate(st.template);
  const act = b.dataset.act;
  const orderNow = () => st.order ? [...st.order] : effectiveOrder(t, { ...st, hidden: [] });
  switch (act) {
    case "tpl":
      if (st.template === b.dataset.id) return;
      pushHistory(); st.template = b.dataset.id;
      renderDesign(); renderPreview(true); renderEditorPhotoNote(); saveSoon();
      if (innerWidth < 980) toast(getTemplate(st.template).name + " applied — tap Preview to see it");
      return;
    case "tpl-filter": S.tplFilter = b.dataset.f; renderDesign(); return;
    case "accent": pushHistory(); st.accent = b.dataset.c; break;
    case "accent-reset": pushHistory(); st.accent = ""; break;
    case "paper": case "size": case "spacing": pushHistory(); st[act] = b.dataset.v; break;
    case "sec-up": case "sec-down": {
      pushHistory(); const o = orderNow(); const k = b.dataset.k; const i = o.indexOf(k); const j = act === "sec-up" ? i - 1 : i + 1;
      if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; st.order = o; break;
    }
    case "sec-toggle": { pushHistory(); const k = b.dataset.k; st.hidden = st.hidden.includes(k) ? st.hidden.filter(x => x !== k) : [...st.hidden, k]; break; }
    case "sec-reset": pushHistory(); st.order = null; st.titles = {}; st.hidden = []; break;
    default: return;
  }
  renderDesign(); renderPreview(); saveSoon();
  if (act.startsWith("sec")) renderEditor();
});
$("#paneDesign").addEventListener("change", e => {
  const st = S.doc.settings;
  if (e.target.id === "fontSel") { pushHistory(); st.font = e.target.value; }
  else if (e.target.id === "photoChk") { pushHistory(); st.showPhoto = e.target.checked; renderEditorPhotoNote(); }
  else if (e.target.id === "accentIn") { pushHistory(); st.accent = e.target.value; }
  else return;
  renderDesign(); renderPreview(); saveSoon();
});
$("#paneDesign").addEventListener("input", e => {
  if (e.target.id === "accentIn") { S.doc.settings.accent = e.target.value; renderPreviewSoon(); saveSoon(); }
});
function renderEditorPhotoNote() { if (S.tab === "content" || innerWidth >= 980) renderEditor(); }

/* ============================== AI pane ============================== */
function renderAIPane() {
  const gate = aiAvailable() && aiNeedsLogin() && !S.user;
  const u = S.usage;
  $("#paneAI").innerHTML = `
  <div class="pane-h"><h2>AI tools</h2>${u ? `<span class="muted" style="font-size:13px">${Math.max(0, u.limit - u.used)} of ${u.limit} left today</span>` : ""}</div>
  ${!aiAvailable() ? `<div class="notice warn">AI features are not switched on for this site yet.</div>` : ""}
  ${gate ? `<div class="signin-gate"><b>Sign in to unlock the AI tools — free</b><span class="muted" style="font-size:14px">We ask you to sign in so we can give everyone a fair daily allowance. Your resume stays exactly as it is.</span><button class="btn btn-google" type="button" data-act="google">${ICON.google} Continue with Google</button></div>` : ""}
  ${u ? `<div class="credits"><span>Today</span><div class="meter"><i style="width:${Math.min(100, (u.used / u.limit) * 100)}%"></i></div><span>${u.used}/${u.limit}</span></div>` : ""}
  <div class="ai-card"><h3>${ICON.upload} Import & rewrite my old CV</h3><p>Upload a PDF, Word file or photo. AI fills every field and rewrites it in a stronger, professional style.</p><button class="btn btn-ai" type="button" data-act="ai-mode" data-mode="import">Upload CV</button></div>
  <div class="ai-card"><h3>${ICON.sparkle} Improve my whole resume</h3><p>Sharper bullet points, a proper summary, cleaned-up skills and grammar. Never invents facts.</p><button class="btn btn-ai" type="button" data-act="ai-mode" data-mode="improve">Improve with AI</button></div>
  <div class="ai-card"><h3>${ICON.target} Tailor to a job ad</h3><p>Paste a job description. AI reorders and rewrites your resume around what the employer asked for, and shows matched and missing keywords.</p><button class="btn btn-ai" type="button" data-act="ai-mode" data-mode="tailor">Tailor to a job</button></div>
  <div class="ai-card"><h3>${ICON.gauge} ATS score check</h3><p>Get a recruiter-style score out of 100, what's working, and exactly what to fix — without changing anything.</p><button class="btn" type="button" data-act="ai-mode" data-mode="review">Check my score</button></div>
  <div class="ai-card"><h3>${ICON.mail} Cover letter</h3><p>Write a matching cover letter from this resume and a job ad in about 30 seconds.</p><a class="btn" href="/cover-letter-generator/">Write a cover letter</a></div>`;
}
$("#paneAI").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  if (b.dataset.act === "ai-mode") openAIModal(b.dataset.mode);
  if (b.dataset.act === "google") startGoogle(`/builder/${S.doc.id ? "?id=" + S.doc.id + "&" : "?"}tab=ai`);
});
async function startGoogle(next) {
  saveSoon.flush();
  try { await signInWithGoogle(next); } catch (err) { toast(err.message || "Sign-in failed"); }
}

/* ============================== AI actions ============================== */
function needGate() {
  if (!aiAvailable()) { toast("AI features are not switched on for this site yet."); return true; }
  if (aiNeedsLogin() && !S.user) { openSignInModal(); return true; }
  return false;
}
function openSignInModal(reason = "Use AI for free") {
  const next = `/builder/${S.doc.id ? "?id=" + S.doc.id : ""}`;
  const m = openModal(`<h2>${esc(reason)}</h2><p class="sub">Sign in once and get ${esc(CFG.aiDailyLimit || 30)} free AI credits every day, plus cloud saving for all your resumes.</p>
    <ul class="perks"><li>Your current resume is kept — nothing is lost</li><li>No credit card, no payment, ever</li><li>We never post anything to your Google account</li></ul>
    <button class="btn btn-google btn-lg btn-block" type="button" data-g>${ICON.google} Continue with Google</button>
    <a class="btn btn-ghost btn-block" href="/login/" data-email>Use email instead</a>`);
  m.el.querySelector("[data-g]").onclick = () => startGoogle(next);
  m.el.querySelector("[data-email]").onclick = () => { saveSoon.flush(); try { localStorage.setItem("rf:next", next); } catch {} };
}
const stripPhoto = d => { const c = clone(d); delete c.photo; return c; };

async function aiSummary(btn) {
  if (needGate()) return;
  const lbl = btn.querySelector("span"), old = lbl.textContent;
  btn.disabled = true; lbl.textContent = "Writing…";
  try {
    const j = await callAI("rewrite", { kind: "summary", text: S.doc.data.summary, resume: stripPhoto(S.doc.data) });
    const opts = (j.result?.options || []).filter(Boolean);
    if (!opts.length) throw { code: "server" };
    showOptions(btn, "Pick a summary", opts, v => { pushHistory(); S.doc.data.summary = v; changed({ editor: true }); });
  } catch (err) { if (err.code !== "cancelled") toast(err.message || aiMessage(err.code)); }
  finally { btn.disabled = false; lbl.textContent = old; }
}
async function aiBullet(btn, i, j) {
  if (needGate()) return;
  const e = S.doc.data.experience[i];
  const text = e.bullets[j] || "";
  btn.disabled = true; btn.innerHTML = `<span style="font-size:11px">…</span>`;
  try {
    const r = await callAI("rewrite", { kind: "bullet", text, context: { role: e.role, company: e.company, title: S.doc.data.title } });
    const opts = (r.result?.options || []).filter(Boolean);
    if (!opts.length) throw { code: "server" };
    showOptions(btn, text ? "Pick a stronger version" : "Pick a line to add", opts, v => { pushHistory(); e.bullets[j] = v; changed({ editor: true }); });
  } catch (err) { if (err.code !== "cancelled") toast(err.message || aiMessage(err.code)); }
  finally { btn.disabled = false; btn.innerHTML = ICON.sparkle; }
}
async function aiSkills(btn) {
  if (needGate()) return;
  const lbl = btn.querySelector("span"), old = lbl.textContent;
  btn.disabled = true; lbl.textContent = "Thinking…";
  try {
    const r = await callAI("rewrite", { kind: "skills", resume: stripPhoto(S.doc.data) });
    const have = S.doc.data.skills.map(s => s.toLowerCase());
    const list = (r.result?.skills || []).filter(s => s && !have.includes(String(s).toLowerCase()));
    $("#skillSuggest").innerHTML = list.length ? list.map(s => `<button type="button" data-act="skill-add" data-skill="${esc(s)}">+ ${esc(s)}</button>`).join("") : `<span class="note">Your skills already look complete.</span>`;
  } catch (err) { if (err.code !== "cancelled") toast(err.message || aiMessage(err.code)); }
  finally { btn.disabled = false; lbl.textContent = old; }
}
function showOptions(anchor, title, options, apply) {
  $$(".popover").forEach(p => p.remove());
  const pop = document.createElement("div");
  pop.className = "popover"; pop.setAttribute("role", "dialog");
  pop.innerHTML = `<h4>${esc(title)}</h4>${options.map((o, k) => `<button type="button" class="opt" data-k="${k}">${esc(o)}</button>`).join("")}<button type="button" class="btn btn-ghost btn-sm" data-close>Keep mine</button>`;
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = Math.min(innerWidth - pw - 12, Math.max(12, r.right - pw));
  let top = r.bottom + 8; if (top + ph > innerHeight - 12) top = Math.max(12, r.top - ph - 8);
  pop.style.left = left + "px"; pop.style.top = top + "px";
  const close = () => { pop.remove(); document.removeEventListener("mousedown", outside, true); document.removeEventListener("keydown", onKey); };
  const outside = ev => { if (!pop.contains(ev.target)) close(); };
  const onKey = ev => { if (ev.key === "Escape") close(); };
  setTimeout(() => { document.addEventListener("mousedown", outside, true); document.addEventListener("keydown", onKey); }, 0);
  pop.addEventListener("click", ev => {
    const o = ev.target.closest(".opt");
    if (o) { apply(options[+o.dataset.k]); close(); toast("Updated"); }
    if (ev.target.closest("[data-close]")) close();
  });
  pop.querySelector(".opt")?.focus();
}

/* ---------- big AI modal: import / improve / tailor / review ---------- */
const MODES = {
  import: { title: "Upload your CV", sub: "PDF, Word (.docx), a photo of your CV, or pasted text. AI reads it, fills the editor and rewrites it stronger.", go: "Import & improve" },
  improve: { title: "Improve my resume", sub: "AI reviews your resume like a senior recruiter, rewrites weak lines and writes a sharper summary. It never invents jobs, degrees or numbers.", go: "Improve my resume" },
  tailor: { title: "Tailor to a job", sub: "Paste the job ad. AI reshapes your resume around it and shows which keywords match.", go: "Tailor my resume" },
  review: { title: "ATS score check", sub: "A recruiter-style score out of 100 with what to fix. Your resume is not changed.", go: "Check my score" },
  check: { title: "ATS score check", sub: "Upload your CV to get a recruiter-style score out of 100 and a list of fixes. Add a job ad to see which keywords you match.", go: "Check my CV" }
};
function openAIModal(mode) {
  const isImport = mode === "import" || mode === "check";
  if (!isImport && needGate()) return;
  const M = MODES[mode];
  const aiOn = aiAvailable();
  const gate = aiOn && aiNeedsLogin() && !S.user;
  let file = null, busy = false, ctl = null, src = "file";
  const m = openModal(`
    <h2>${M.title}</h2><p class="sub">${M.sub}</p>
    ${isImport ? `
      <div class="seg" role="tablist"><button type="button" data-src="file" aria-selected="true">Upload file</button><button type="button" data-src="paste" aria-selected="false">Paste text</button></div>
      <div data-pane="file"><label class="drop" for="aiFile" tabindex="0"><b>Drop your CV here or tap to choose</b><small>PDF · Word .docx · JPG/PNG photo · .txt · or a Resume Forge .json backup</small><span class="file" data-fname></span></label><input type="file" id="aiFile" accept=".pdf,.docx,.doc,.txt,.md,.json,image/*" hidden></div>
      <div data-pane="paste" hidden><label class="field"><span>CV text</span><textarea id="aiPaste" rows="8" placeholder="Paste your whole CV — any language, any format"></textarea></label></div>` : ""}
    ${mode !== "review" || true ? `<div class="grid2">
      <label class="field"><span>Target job <em>(optional)</em></span><input id="aiRole" placeholder="e.g. Accountant, Sales Manager" value="${esc(S.doc.data.title || "")}"></label>
      ${mode === "review" || mode === "check" ? `<span></span>` : `<label class="field"><span>Length</span><select id="aiLen"><option value="balanced">Balanced (1–2 pages)</option><option value="concise">One page, tight</option><option value="detailed">Detailed (senior)</option></select></label>`}
    </div>` : ""}
    <label class="field"><span>Job ad ${mode === "tailor" ? "" : "<em>(optional — paste it to match keywords)</em>"}</span><textarea id="aiJD" rows="${mode === "tailor" ? 6 : 3}" placeholder="Paste the job description from Rozee.pk, LinkedIn, Indeed, Bayt…"></textarea></label>
    ${!aiOn ? `<p class="notice warn">AI features aren't switched on for this website yet.${mode === "import" ? " We'll do a basic import you can tidy by hand." : ""}</p>` : ""}
    ${mode === "import" && aiOn ? `<label class="check"><input type="checkbox" id="aiImprove" ${gate ? "" : "checked"} ${gate ? "disabled" : ""}><span>Improve the wording with AI<small>${gate ? "Sign in to use AI. Without it we'll do a basic import you can tidy by hand." : "Stronger bullet points, proper summary, cleaned-up skills. Uncheck to keep your exact words."}</small></span></label>` : ""}
    ${gate && mode === "check" ? `<div class="signin-gate"><b>Sign in to get your score — free</b><span class="muted" style="font-size:14px">One click with Google. We ask so everyone gets a fair daily allowance.</span><button class="btn btn-google" type="button" data-g>${ICON.google} Continue with Google</button></div>` : ""}
    ${gate && mode === "import" ? `<div class="signin-gate"><b>Get the AI rewrite free</b><span class="muted" style="font-size:14px">Sign in with Google, then upload again. Your current resume is kept.</span><button class="btn btn-google" type="button" data-g>${ICON.google} Continue with Google</button></div>` : ""}
    <div class="progress" data-prog hidden><b data-pt>Reading your file…</b><div class="bar"><i></i></div><small class="muted" data-ps></small></div>
    <p class="notice err" data-err hidden></p>
    <div class="modal-foot"><button type="button" class="btn btn-ghost" data-cancel>Cancel</button><button type="button" class="btn btn-ai" data-go ${!aiOn && mode === "check" ? "disabled" : ""}>${(gate || !aiOn) && mode === "import" ? "Import without AI" : M.go}</button></div>`,
    { wide: isImport, dismissable: () => !busy });
  const el = m.el;
  const q = s => el.querySelector(s);
  const setErr = msg => { const e = q("[data-err]"); e.textContent = msg; e.hidden = !msg; q("[data-prog]").hidden = true; };
  const prog = (t, s = "") => { q("[data-prog]").hidden = false; q("[data-pt]").textContent = t; q("[data-ps]").textContent = s; };
  const setBusy = b => { busy = b; q("[data-go]").disabled = b; q("[data-cancel]").textContent = b ? "Stop" : "Cancel"; };
  q("[data-g]")?.addEventListener("click", () => startGoogle(`/builder/?open=${mode}`));
  if (gate && mode === "check") { const g = q("[data-go]"); g.textContent = "Continue with Google"; g.className = "btn btn-google"; g.onclick = () => startGoogle(`/builder/?open=check`); }
  q("[data-cancel]").onclick = () => { if (busy) { ctl?.abort(); setBusy(false); q("[data-prog]").hidden = true; } else m.close(); };
  if (isImport) {
    $$("[data-src]", el).forEach(b => b.onclick = () => {
      src = b.dataset.src;
      $$("[data-src]", el).forEach(x => x.setAttribute("aria-selected", String(x === b)));
      q('[data-pane="file"]').hidden = src !== "file"; q('[data-pane="paste"]').hidden = src !== "paste";
    });
    const drop = q(".drop"), inp = q("#aiFile");
    const pick = f => { file = f; q("[data-fname]").textContent = f ? f.name : ""; setErr(""); };
    inp.onchange = () => pick(inp.files[0] || null);
    drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f) pick(f); });
  }

  if (gate && mode === "check") return;
  q("[data-go]").onclick = async () => {
    if (busy) return;
    setErr("");
    const role = q("#aiRole")?.value.trim() || "";
    const jobAd = q("#aiJD")?.value.trim() || "";
    const length = q("#aiLen")?.value || "balanced";
    if (mode === "tailor" && jobAd.length < 60) return setErr("Paste the full job ad first (at least a few lines).");
    setBusy(true);
    try {
      if (isImport) {
        let text = "", images = [];
        if (src === "paste") {
          text = q("#aiPaste").value.trim();
          if (!text) throw new Error("Paste your CV text first.");
        } else {
          if (!file) throw new Error("Choose a file first.");
          prog("Reading your file…");
          const r = await readResumeFile(file);
          if (r.kind === "json") {
            const j = r.json;
            pushHistory();
            S.doc.data = normalizeResume(j.data || j);
            if (j.settings) S.doc.settings = normalizeSettings(j.settings);
            if (j.title) S.doc.title = j.title;
            S.doc.isExample = false; S.review = null; S.beforeAI = null;
            m.close(); renderAll(); saveSoon(); toast("Backup restored"); return;
          }
          text = r.text || ""; images = r.images || [];
        }
        const useAI = mode === "import" && q("#aiImprove")?.checked && !gate;
        const aiReady = aiOn && !(aiNeedsLogin() && !S.user);
        if (!aiReady) {
          if (!text.trim()) throw new Error("We couldn't find text in this file. Sign in to let AI read scanned files and photos, or paste the text.");
          applyResult({ resume: basicParse(text) }, "basic");
          m.close(); toast("Imported. Please check each section — the basic reader can miss things.");
          return;
        }
        ctl = new AbortController();
        prog(useAI ? "AI is reading and rewriting your CV…" : "AI is reading your CV…", "Usually 20–60 seconds. Keep this window open.");
        const j = await callAI("import", { text: text.slice(0, 40000), images, options: { improve: !!useAI, role, jobAd, length } }, { signal: ctl.signal });
        applyResult(j.result, useAI ? "improve" : mode === "check" ? "check" : "extract");
        m.close(); toast(useAI ? "Done — your improved resume is ready" : mode === "check" ? "Your score is ready — see the list on the left" : "Imported — check each section");
      } else {
        ctl = new AbortController();
        prog(mode === "review" ? "Scoring your resume…" : mode === "tailor" ? "Tailoring your resume to the job…" : "Improving your resume…", "Usually 20–60 seconds.");
        const j = await callAI(mode, { resume: stripPhoto(S.doc.data), options: { role, jobAd, length } }, { signal: ctl.signal });
        applyResult(j.result, mode);
        m.close(); toast(mode === "review" ? "Your score is ready" : "Done — review the changes on the left");
      }
    } catch (err) {
      setBusy(false);
      if (err?.code === "cancelled") return;
      if (err?.code === "auth") { m.close(); openSignInModal("Sign in to use AI"); return; }
      setErr(err?.message || aiMessage(err?.code));
      return;
    }
    setBusy(false);
  };
}

function applyResult(res, mode) {
  if (!res) return;
  if (mode === "review") {
    S.review = { mode, score: +res.score || 0, verdict: res.verdict || "", strengths: arr(res.strengths), issues: arr(res.issues), tips: arr(res.tips), kwHit: arr(res.keywords?.matched), kwMiss: arr(res.keywords?.missing), animate: true };
  } else {
    pushHistory();
    S.beforeAI = (S.doc.isExample || mode === "basic") ? null : snapshot();
    const photo = S.doc.data.photo;
    const next = normalizeResume(res.resume || {});
    if (!next.photo) next.photo = S.doc.isExample ? "" : photo;
    if (mode !== "basic" && !next.experience.length && !next.education.length && !has(next.name)) throw { code: "server", message: "The AI couldn't find resume content in this file. Try another file or paste the text." };
    S.doc.data = next;
    S.doc.isExample = false;
    if (has(next.name) && (S.doc.title === "My resume" || !has(S.doc.title))) S.doc.title = next.name + (next.title ? " — " + next.title : "");
    S.review = mode === "basic" ? null : { mode, scoreBefore: mode === "improve" || mode === "tailor" ? (+res.scoreBefore || 0) : 0, score: +res.scoreAfter || +res.scoreBefore || 0, verdict: res.verdict || "", strengths: arr(res.strengths), issues: arr(res.issues), changes: arr(res.changes), tips: arr(res.tips), kwHit: arr(res.keywords?.matched), kwMiss: arr(res.keywords?.missing), animate: true };
  }
  S.open.add("personal"); S.open.add("experience");
  switchTab("content");
  renderAll(); saveSoon();
  $("#panel").scrollTop = 0;
}
const arr = a => (Array.isArray(a) ? a : []).map(x => String(x || "").trim()).filter(Boolean);

function reviewHTML() {
  const r = S.review;
  const a = Math.max(0, Math.min(100, Math.round(r.score || 0))), b = Math.round(r.scoreBefore || 0);
  const C = 2 * Math.PI * 31, from = C * (1 - (b && b < a ? b : 0) / 100), to = C * (1 - a / 100);
  const title = { review: "ATS score", check: "ATS score", improve: "AI improvement", tailor: "Tailored to the job", extract: "CV imported" }[r.mode] || "AI review";
  const list = (h, items, n) => items?.length ? `<h4>${h}</h4><ul>${items.slice(0, n).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  return `<div class="review" role="status">
    <h3>${title}</h3>
    ${a ? `<div class="score"><div class="ring"><svg viewBox="0 0 78 78"><circle class="trk" cx="39" cy="39" r="31"/><circle class="val" data-ring cx="39" cy="39" r="31" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(r.animate ? from : to).toFixed(1)}" data-to="${to.toFixed(1)}"/></svg><b>${a}</b></div>
      <div class="meta"><b>Resume strength</b>${b && a > b ? `<span class="gain">+${a - b} points</span><small class="muted">Was ${b}/100 before</small>` : `<small class="muted">${esc(r.verdict || "out of 100")}</small>`}</div></div>` : ""}
    ${r.kwHit?.length ? `<h4>Job keywords you match</h4><div class="kw hit">${r.kwHit.slice(0, 16).map(k => `<span>${esc(k)}</span>`).join("")}</div>` : ""}
    ${r.kwMiss?.length ? `<h4>In the job ad but missing — add only if true</h4><div class="kw miss">${r.kwMiss.slice(0, 12).map(k => `<span>${esc(k)}</span>`).join("")}</div>` : ""}
    ${list("What's working", r.strengths, 5)}${list("Fix these", r.issues, 7)}${list("What changed", r.changes, 8)}${list("Make it even stronger", r.tips, 6)}
    <div class="row">${S.beforeAI ? `<button type="button" class="btn btn-sm" data-act="revert">${ICON.undo} ${r.mode === "extract" || r.mode === "check" ? "Restore my previous resume" : "Undo AI changes"}</button>` : ""}${r.mode === "review" || r.mode === "check" || r.mode === "extract" ? `<button type="button" class="btn btn-sm btn-ai" data-act="ai-mode" data-mode="improve">Fix it with AI</button>` : ""}<button type="button" class="btn btn-sm btn-ghost" data-act="dismiss">Dismiss</button></div></div>`;
}
function animateRing() {
  const ring = $("[data-ring]"); if (!ring) return;
  if (S.review?.animate) { S.review.animate = false; requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = ring.dataset.to; })); }
  else ring.style.strokeDashoffset = ring.dataset.to;
}

/* ============================== top bar ============================== */
$("#docTitle").addEventListener("input", e => { S.doc.title = e.target.value; saveSoon(); });
$("#btnImport").onclick = () => openAIModal("import");
$("#btnImprove").onclick = () => openAIModal("improve");
const dlBtn = $("#btnDownload"), dlMenu = $("#dlMenu");
dlBtn.onclick = e => { e.stopPropagation(); dlMenu.hidden = !dlMenu.hidden; dlBtn.setAttribute("aria-expanded", String(!dlMenu.hidden)); };
document.addEventListener("click", e => { if (!e.target.closest("#dlWrap")) { dlMenu.hidden = true; dlBtn.setAttribute("aria-expanded", "false"); } });
dlMenu.addEventListener("click", async e => {
  const b = e.target.closest("[data-dl]"); if (!b) return;
  dlMenu.hidden = true;
  const base = fileBase(S.doc.data);
  try {
    if (b.dataset.dl === "pdf") {
      if (!localStorage.getItem("rf:pdf-tip")) {
        const ok = await pdfTip(); if (!ok) return;
      }
      await printResume(renderResume(S.doc.data, S.doc.settings), { paper: S.doc.settings.paper, title: base });
    }
    if (b.dataset.dl === "docx") { toast("Creating your Word file…"); await exportDocx(S.doc.data, S.doc.settings, base + ".docx"); }
    if (b.dataset.dl === "txt") exportText(S.doc.data, base + ".txt");
    if (b.dataset.dl === "json") exportJson(S.doc, base + ".json");
  } catch (err) { console.error(err); toast("That download didn't work. Please try again."); }
});
function pdfTip() {
  return new Promise(resolve => {
    let done = false;
    const m = openModal(`<h2>Save as PDF</h2><p class="sub">Your browser's print window will open with your resume.</p>
      <ol class="prose" style="padding-left:20px;font-size:15px"><li>Set <b>Destination</b> (or Printer) to <b>Save as PDF</b>.</li><li>Keep margins on <b>Default</b> and turn on <b>Background graphics</b> if you see it.</li><li>Press <b>Save</b>. On a phone: tap <b>Share → Save to Files</b> or <b>Download</b>.</li></ol>
      <p class="note">This makes a real text PDF that job portals and ATS software can read — better than image PDFs from other sites.</p>
      <label class="check"><input type="checkbox" id="tipNo"><span>Don't show this again</span></label>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-ok>Open print window</button></div>`, { onClose: () => { if (!done) resolve(false); } });
    m.el.querySelector("[data-ok]").onclick = () => { done = true; if (m.el.querySelector("#tipNo").checked) { try { localStorage.setItem("rf:pdf-tip", "1"); } catch {} } m.close(); resolve(true); };
  });
}
$("#saveState").addEventListener("click", e => {
  const a = e.target.closest("[data-act]")?.dataset.act;
  if (a === "save-cloud") saveToCloud();
  if (a === "signin-save") { saveSoon.flush(); goSignIn(location.pathname + location.search); }
  if (a === "retry-save") save();
});

/* ============================== canvas tools ============================== */
$("#zoomOut").onclick = () => { const cur = currentScale(); S.zoom = Math.max(0.3, +(cur - 0.1).toFixed(2)); fitPreview(); };
$("#zoomIn").onclick = () => { const cur = currentScale(); S.zoom = Math.min(1.6, +(cur + 0.1).toFixed(2)); fitPreview(); };
$("#zoomFit").onclick = () => { S.zoom = "fit"; fitPreview(); };
const currentScale = () => { const m = /scale\(([\d.]+)\)/.exec($("#pageScale").style.transform); return m ? +m[1] : 1; };
$("#btnUndo").onclick = undo; $("#btnRedo").onclick = redo;
document.addEventListener("keydown", e => {
  const inField = e.target.closest?.("input,textarea,select,[contenteditable]");
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !inField) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !inField) { e.preventDefault(); redo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveSoon.flush(); toast("Saved"); }
});

/* ============================== tabs ============================== */
function switchTab(tab) {
  const preview = tab === "preview";
  document.body.classList.toggle("m-preview", preview);
  if (!preview) S.tab = tab;
  $$(".rail [data-tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === S.tab)));
  $$(".mob-tabs [data-tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === (preview ? "preview" : S.tab))));
  if (preview) { requestAnimationFrame(fitPreview); return; }
  $("#paneContent").hidden = S.tab !== "content";
  $("#paneDesign").hidden = S.tab !== "design";
  $("#paneAI").hidden = S.tab !== "ai";
  if (S.tab === "design") renderDesign();
  if (S.tab === "ai") { renderAIPane(); if (S.user) refreshUsage(); }
  $("#panel").scrollTop = 0;
}
$$("[data-tab]").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));

/* ============================== render all ============================== */
function renderAll() {
  $("#docTitle").value = S.doc.title;
  renderEditor();
  if (S.tab === "design") renderDesign();
  if (S.tab === "ai") renderAIPane();
  renderPreview();
  syncUndo();
}

/* ============================== boot ============================== */
async function chooseReplace(message) {
  return confirmDialog(message, { ok: "Replace it", cancel: "Keep my draft", danger: false });
}
async function boot() {
  const q = new URLSearchParams(location.search);
  const local = store.loadLocal();
  const localDoc = local && local.data ? newDoc({ data: local.data, settings: local.settings, title: local.title, isExample: !!local.isExample, cloudId: local.cloudId || null }) : null;
  const localHasWork = localDoc && !localDoc.isExample && (has(localDoc.data.name) || localDoc.data.experience.some(e => has(e.role)));
  const exKey = q.get("example");
  const tplParam = q.get("template");

  if (exKey && EXAMPLES[exKey]) {
    const ex = EXAMPLES[exKey];
    let use = true;
    S.doc = localDoc || newDoc({ data: EXAMPLE, isExample: true });
    if (localHasWork) { renderShell(); use = await chooseReplace("Replace your current draft with this example?"); }
    if (use) S.doc = newDoc({ data: ex.data, settings: { template: ex.template }, title: ex.title + " resume" });
  } else if (q.get("new")) {
    let use = true;
    S.doc = localDoc || newDoc({ data: EXAMPLE, isExample: true });
    if (localHasWork && !q.get("id")) { renderShell(); use = await chooseReplace("Start a new blank resume? Your current draft will be replaced."); }
    if (use) S.doc = newDoc({ data: blankData(), settings: { template: tplParam || S.doc.settings.template } });
  } else if (localDoc) {
    S.doc = localDoc;
  } else {
    S.doc = newDoc({ data: EXAMPLE, isExample: true, settings: { template: tplParam || "modern" } });
  }
  if (tplParam && TEMPLATES.some(t => t.id === tplParam)) S.doc.settings.template = tplParam;

  renderShell();
  const tab = q.get("tab");
  switchTab(["design", "ai", "content"].includes(tab) ? tab : "content");
  setSave("local");
  if (exKey || q.get("new") || tplParam) saveSoon();

  onUsage(u => { S.usage = u; if (S.tab === "ai") renderAIPane(); });

  if (authEnabled) {
    S.user = await getUser();
    setSave(S.saveState);
    onAuthChange(u => { const was = !!S.user; S.user = u; setSave(S.doc.id && u ? "cloud" : "local"); if (was !== !!u && S.tab === "ai") renderAIPane(); });
    let id = q.get("id");
    if (!id && S.user && S.doc.cloudId && !exKey && !q.get("new")) {
      id = S.doc.cloudId;
      const u2 = new URL(location.href); u2.searchParams.set("id", id); history.replaceState(null, "", u2);
    }
    if (id) {
      if (!S.user) { toast("Sign in to open your saved resume"); goSignIn(location.pathname + location.search); return; }
      try {
        const row = await store.getResume(id);
        if (!row) { toast("That resume wasn't found in your account."); }
        else {
          S.doc = newDoc({ id: row.id, data: row.data, settings: row.settings, title: row.title });
          renderAll(); setSave("cloud");
        }
      } catch (err) { toast(err.message || "Couldn't open the resume"); }
    }
    if (S.user) refreshUsage();
  }
  const open = q.get("open");
  if (open && MODES[open]) setTimeout(() => openAIModal(open), 300);
  // clean one-off params from the address bar
  const u = new URL(location.href);
  ["example", "new", "template", "open", "tab"].forEach(k => u.searchParams.delete(k));
  history.replaceState(null, "", u.pathname + (u.search || ""));
}
function renderShell() { renderAll(); document.fonts?.ready?.then(fitPreview); }
boot();
