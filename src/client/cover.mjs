import { $, esc, toast, openModal, ICON, CFG } from "./ui.mjs";
import { authEnabled, getUser, signInWithGoogle } from "./auth.mjs";
import * as store from "./store.mjs";
import { callAI, aiMessage, aiNeedsLogin } from "./ai.mjs";
import { downloadText, downloadBlob } from "./export.mjs";
import { loadScript } from "./ui.mjs";

const sel = $("#clResume"), note = $("#clResumeNote");
let cloud = [];
const local = store.loadLocal();
const hasLocal = local?.data && !local.isExample && (local.data.name || local.data.experience?.length);

function fillSelect() {
  sel.innerHTML = "";
  if (hasLocal && !cloud.some(r => r.id === local.cloudId)) sel.insertAdjacentHTML("beforeend", `<option value="local">${esc(local.data.name || "Resume")} — in this browser</option>`);
  cloud.forEach(r => sel.insertAdjacentHTML("beforeend", `<option value="${r.id}">${esc(r.title)} — my account</option>`));
  sel.insertAdjacentHTML("beforeend", `<option value="paste">Paste my resume text instead</option>`);
  syncNote();
}
function syncNote() {
  const pasting = sel.value === "paste";
  let ta = $("#clPaste");
  if (pasting && !ta) { sel.closest(".field").insertAdjacentHTML("afterend", `<label class="field" id="clPasteWrap"><span>Resume text</span><textarea id="clPaste" rows="6" placeholder="Paste your CV text"></textarea></label>`); }
  if (!pasting) $("#clPasteWrap")?.remove();
  note.innerHTML = !hasLocal && !cloud.length ? `No saved resume found. <a href="/builder/">Build one</a> or paste your CV text.` : "";
}
sel.onchange = syncNote;
fillSelect();

(async () => {
  if (!authEnabled) return;
  const u = await getUser();
  if (u) { try { cloud = await store.listResumes(); fillSelect(); if (cloud.length && (!hasLocal || local.cloudId)) sel.value = cloud.some(r => r.id === local?.cloudId) ? local.cloudId : cloud[0].id; syncNote(); } catch {} }
})();

function resumeForAI() {
  if (sel.value === "paste") {
    const t = $("#clPaste")?.value.trim();
    if (!t) throw new Error("Paste your resume text first.");
    return { name: "", rawText: t.slice(0, 20000) };
  }
  const src = sel.value === "local" ? local?.data : cloud.find(r => r.id === sel.value)?.data;
  if (!src) throw new Error("Choose a resume first.");
  const c = { ...src }; delete c.photo; return c;
}

let current = null;
function signInPrompt(reason) {
  const m = openModal(`<h2>Sign in to write your letter — free</h2><p class="sub">${esc(reason || `One click with Google. You'll get ${CFG.aiDailyLimit || 15} free AI credits every day.`)}</p><button class="btn btn-google btn-lg btn-block" type="button" data-g>${ICON.google} Continue with Google</button>`);
  m.el.querySelector("[data-g]").onclick = () => signInWithGoogle(location.pathname).catch(x => toast(x.message));
}
$("#clForm").onsubmit = async e => {
  e.preventDefault();
  const err = $("#clErr"); err.hidden = true;
  if (aiNeedsLogin() && !(await getUser())) {
    signInPrompt();
    return;
  }
  let resume;
  try { resume = resumeForAI(); } catch (x) { err.textContent = x.message; err.hidden = false; return; }
  const jobAd = $("#clJD").value.trim();
  if (jobAd.length < 60) { err.textContent = "Paste the full job ad (a few lines at least)."; err.hidden = false; return; }
  $("#clGo").disabled = true; $("#clProg").hidden = false;
  try {
    const j = await callAI("cover-letter", { resume, options: { jobAd, company: $("#clCompany").value.trim(), manager: $("#clManager").value.trim(), tone: $("#clTone").value, length: $("#clLen").value } });
    current = j.result;
    $("#clSubject").value = current.subject || "";
    $("#clOut").value = String(current.letter || "").replace(/\\n/g, "\n");
    ["#clCopy", "#clDocx", "#clTxt"].forEach(s => { $(s).disabled = false; });
    $("#clOut").scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Your cover letter is ready — edit anything you like");
  } catch (x) {
    if ((x.code === "guest_limit" || x.code === "auth") && authEnabled) signInPrompt(x.message);
    err.textContent = x.message || aiMessage(x.code); err.hidden = false;
  }
  finally { $("#clGo").disabled = false; $("#clProg").hidden = true; }
};

$("#clCopy").onclick = async () => {
  try { await navigator.clipboard.writeText($("#clOut").value); toast("Copied"); } catch { $("#clOut").select(); toast("Press Ctrl+C to copy"); }
};
$("#clTxt").onclick = () => downloadText($("#clOut").value, "Cover_Letter.txt");
$("#clDocx").onclick = async () => {
  await loadScript("/vendor/docx.iife.js");
  const { Document, Packer, Paragraph, TextRun } = window.docx;
  const paras = $("#clOut").value.split(/\n/).map(line => new Paragraph({ spacing: { after: line.trim() ? 120 : 0 }, children: [new TextRun({ text: line, size: 22 })] }));
  const doc = new Document({ styles: { default: { document: { run: { font: "Calibri", size: 22 } } } }, sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } }, children: paras }] });
  downloadBlob(await Packer.toBlob(doc), "Cover_Letter.docx");
};
