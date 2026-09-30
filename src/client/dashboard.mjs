import { $, $$, esc, toast, confirmDialog, openModal, timeAgo, ICON } from "./ui.mjs";
import { authEnabled, getUser, signInWithGoogle } from "./auth.mjs";
import * as store from "./store.mjs";
import { renderResume } from "/js/shared/render.mjs";
import { getTemplate } from "/js/shared/templates.mjs";

const box = $("#dash");
let rows = [];

function sizeMinis() {
  $$(".doc-card .tpl-thumb").forEach(th => { const m = th.querySelector(".mini"); if (m) m.style.transform = `scale(${th.clientWidth / 794})`; });
}
new ResizeObserver(sizeMinis).observe(box);

function localBanner() {
  const d = store.loadLocal();
  if (!d?.data || d.cloudId || d.isExample || !(d.data.name || "").trim()) return "";
  return `<div class="notice warn" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px">
    <span>You have an unsaved resume in this browser${d.data.name ? ` (<b>${esc(d.data.name)}</b>)` : ""}.</span>
    <button class="btn btn-sm btn-primary" type="button" data-act="import-local">Save it to my account</button></div>`;
}

function render() {
  box.innerHTML = localBanner() + `<div class="doc-grid">
    <a class="doc-new" href="/builder/?new=1">${ICON.plus}<span>New resume</span></a>
    ${rows.map(r => `<article class="doc-card" data-id="${r.id}">
      <a class="tpl-thumb" href="/builder/?id=${r.id}" aria-label="Open ${esc(r.title)}"><div class="mini">${renderResume(r.data || {}, r.settings || {})}</div></a>
      <div class="body"><b title="${esc(r.title)}">${esc(r.title || "Untitled")}</b><small>${esc(getTemplate(r.settings?.template).name)} · edited ${esc(timeAgo(r.updated_at))}${r.is_public ? " · <span style=\"color:var(--good);font-weight:700\">Shared</span>" : ""}</small></div>
      <div class="acts">
        <a class="btn btn-sm btn-primary" href="/builder/?id=${r.id}">Open</a>
        <button class="btn btn-sm" type="button" data-act="share">${ICON.link} Share</button>
        <button class="btn btn-sm btn-ghost" type="button" data-act="dup" title="Duplicate">${ICON.copy}</button>
        <button class="btn btn-sm btn-ghost" type="button" data-act="del" title="Delete">${ICON.trash}</button>
      </div></article>`).join("")}
  </div>
  ${rows.length ? "" : `<p class="empty">No saved resumes yet. Create one, or upload your old CV and let AI rebuild it.</p>`}`;
  requestAnimationFrame(sizeMinis);
}

box.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "import-local") {
    const d = store.loadLocal();
    try {
      const row = await store.createResume({ title: d.title || d.data.name || "My resume", data: d.data, settings: d.settings });
      store.saveLocal({ ...d, cloudId: row.id });
      toast("Saved to your account"); await load();
    } catch (err) { toast(err.message); }
    return;
  }
  const card = b.closest(".doc-card"); const id = card?.dataset.id; const r = rows.find(x => x.id === id);
  if (!r) return;
  if (act === "del") {
    if (!(await confirmDialog(`Delete "${r.title}"? This can't be undone.`))) return;
    try { await store.deleteResume(id); rows = rows.filter(x => x.id !== id); render(); toast("Deleted"); } catch (err) { toast(err.message); }
  }
  if (act === "dup") {
    try { await store.createResume({ title: r.title + " (copy)", data: r.data, settings: r.settings }); toast("Duplicated"); await load(); } catch (err) { toast(err.message); }
  }
  if (act === "share") shareModal(r);
});

function shareModal(r) {
  const url = `${location.origin}/r/?id=${r.id}`;
  const m = openModal(`<h2>Share "${esc(r.title)}"</h2>
    <p class="sub">Anyone with the link can view and download this resume. It always shows your latest version.</p>
    <label class="check"><input type="checkbox" id="pub" ${r.is_public ? "checked" : ""}><span>Link sharing is on<small>Turn off to make the link stop working.</small></span></label>
    <div class="field" ${r.is_public ? "" : "hidden"} id="linkRow"><span>Link</span><div style="display:flex;gap:6px"><input class="input" id="lnk" readonly value="${esc(url)}"><button class="btn" type="button" id="cp">Copy</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><a class="btn btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("My resume: " + url)}">WhatsApp</a><a class="btn btn-sm" href="mailto:?subject=${encodeURIComponent("My resume")}&body=${encodeURIComponent(url)}">Email</a><a class="btn btn-sm" target="_blank" rel="noopener" href="${esc(url)}">Open</a></div></div>
    <div class="modal-foot"><button class="btn btn-primary" data-close>Done</button></div>`);
  const pub = m.el.querySelector("#pub");
  pub.onchange = async () => {
    try { await store.setPublic(r.id, pub.checked); r.is_public = pub.checked; m.el.querySelector("#linkRow").hidden = !pub.checked; render(); toast(pub.checked ? "Link sharing is on" : "Link sharing is off"); }
    catch (err) { pub.checked = !pub.checked; toast(err.message); }
  };
  m.el.querySelector("#cp").onclick = async () => {
    const inp = m.el.querySelector("#lnk");
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { inp.select(); document.execCommand?.("copy"); toast("Link copied"); }
  };
}

async function load() {
  try { rows = await store.listResumes(); render(); }
  catch (err) { box.innerHTML = `<div class="notice err">Couldn't load your resumes: ${esc(err.message)}</div>`; }
}

(async () => {
  if (!authEnabled) { box.innerHTML = `<div class="notice warn">Accounts aren't set up on this site yet. Your resume is saved in this browser — <a href="/builder/">open the builder</a>.</div>`; return; }
  const u = await getUser();
  if (!u) {
    box.innerHTML = `<div class="auth-card" style="margin:10px auto 60px"><h2 style="font-size:24px">Sign in to see your resumes</h2><p class="muted">Keep every version of your resume safe and open it on any device.</p><button class="btn btn-google btn-lg btn-block" type="button" id="g">${ICON.google} Continue with Google</button></div>`;
    $("#g").onclick = () => signInWithGoogle("/dashboard/").catch(err => toast(err.message));
    return;
  }
  await load();
})();
