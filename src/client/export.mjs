// Downloads: PDF (browser print engine → real selectable text), Word, text, JSON.
import { loadScript } from "./ui.mjs";
import { getTemplate } from "/js/shared/templates.mjs";
import { SECTION_LABELS, resumeToText } from "/js/shared/schema.mjs";
import { effectiveOrder } from "/js/shared/render.mjs";

export function fileBase(data) {
  const n = String(data?.name || "").trim().replace(/[^\p{L}\p{N}\- ]+/gu, "").replace(/\s+/g, "_");
  return (n || "My") + "_Resume";
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
export const downloadText = (text, filename, type = "text/plain") => downloadBlob(new Blob([text], { type: type + ";charset=utf-8" }), filename);

/* ---------------- PDF via print ---------------- */
export async function printResume(pageHTML, { paper = "a4", title = "Resume" } = {}) {
  let root = document.getElementById("print-root");
  if (!root) { root = document.createElement("div"); root.id = "print-root"; document.body.appendChild(root); }
  root.innerHTML = pageHTML;
  let st = document.getElementById("print-page-style");
  if (!st) { st = document.createElement("style"); st.id = "print-page-style"; document.head.appendChild(st); }
  st.textContent = `@page{size:${paper === "letter" ? "letter" : "A4"} portrait;margin:10mm 0 12mm 0}@page :first{margin-top:0}`;
  const oldTitle = document.title;
  document.title = title; // browsers use this as the default PDF file name
  document.documentElement.classList.add("printing");
  const cleanup = () => {
    document.documentElement.classList.remove("printing");
    document.title = oldTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  try { await document.fonts?.ready; } catch {}
  await Promise.all([...root.querySelectorAll("img")].map(img => img.decode?.().catch(() => {})));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.print();
}

/* ---------------- Word (.docx) ---------------- */
export async function exportDocx(data, settings, filename) {
  await loadScript("/vendor/docx.iife.js");
  const D = window.docx;
  const { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, BorderStyle, LevelFormat, Tab } = D;
  const t = getTemplate(settings.template);
  const accent = String(settings.accent || t.accent || "#16624f").replace("#", "").toUpperCase();
  const letter = settings.paper === "letter";
  const page = letter ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 };
  const margin = { top: 900, bottom: 900, left: 1000, right: 1000 };
  const contentW = page.width - margin.left - margin.right;
  const clean = a => (a || []).map(x => String(x || "").trim()).filter(Boolean);
  const has = v => String(v || "").trim().length > 0;
  const MUTED = "555C66";
  const kids = [];

  kids.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: data.name || "Your Name", bold: true, size: 44, color: "1B1F24" })] }));
  if (has(data.title)) kids.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: data.title, size: 24, color: accent, bold: true })] }));
  const contact = [data.email, data.phone, data.location, ...clean(data.links)].filter(has);
  if (contact.length) kids.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: contact.join("  |  "), size: 19, color: MUTED })] }));

  const heading = text => new Paragraph({
    spacing: { before: 260, after: 90 }, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D5DBE1", space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 21, color: accent, characterSpacing: 30 })]
  });
  const itemHead = (left, right) => new Paragraph({
    spacing: { before: 100, after: 10 }, keepNext: true,
    tabStops: [{ type: TabStopType.RIGHT, position: contentW }],
    children: [new TextRun({ text: left || "", bold: true, size: 22 }), ...(has(right) ? [new TextRun({ children: [new Tab(), right], size: 19, color: MUTED })] : [])]
  });
  const sub = text => new Paragraph({ spacing: { after: 30 }, keepNext: true, children: [new TextRun({ text, italics: true, size: 20, color: MUTED })] });
  const bullet = text => new Paragraph({ numbering: { reference: "rf-bullets", level: 0 }, spacing: { after: 30 }, children: [new TextRun({ text, size: 20 })] });
  const para = text => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text, size: 20 })] });
  const range = (a, b) => [a, b].filter(has).join(" – ");
  const title = k => (settings.titles?.[k] || SECTION_LABELS[k]);

  for (const key of effectiveOrder(t, settings)) {
    if (key === "summary" && has(data.summary)) { kids.push(heading(title(key)), para(data.summary)); }
    if (key === "experience") {
      const items = (data.experience || []).filter(e => has(e.role) || has(e.company) || clean(e.bullets).length);
      if (items.length) {
        kids.push(heading(title(key)));
        items.forEach(e => {
          kids.push(itemHead(e.role, range(e.start, e.end)));
          const o = [e.company, e.location].filter(has).join(", ");
          if (o) kids.push(sub(o));
          clean(e.bullets).forEach(b => kids.push(bullet(b)));
        });
      }
    }
    if (key === "education") {
      const items = (data.education || []).filter(e => has(e.degree) || has(e.school));
      if (items.length) {
        kids.push(heading(title(key)));
        items.forEach(e => {
          kids.push(itemHead(e.degree, range(e.start, e.end)));
          const o = [e.school, e.location].filter(has).join(", ");
          if (o) kids.push(sub(o));
          if (has(e.details)) kids.push(para(e.details));
        });
      }
    }
    if (key === "projects") {
      const items = (data.projects || []).filter(p => has(p.name) || has(p.desc));
      if (items.length) {
        kids.push(heading(title(key)));
        items.forEach(p => { kids.push(itemHead(p.name, p.link)); if (has(p.desc)) kids.push(para(p.desc)); });
      }
    }
    if (key === "skills" && clean(data.skills).length) kids.push(heading(title(key)), para(clean(data.skills).join(" • ")));
    if (key === "certifications" && clean(data.certifications).length) { kids.push(heading(title(key))); clean(data.certifications).forEach(c => kids.push(bullet(c))); }
    if (key === "languages" && clean(data.languages).length) kids.push(heading(title(key)), para(clean(data.languages).join(" • ")));
    if (key === "details") {
      const d = (data.details || []).filter(x => has(x.label) || has(x.value));
      if (d.length) {
        kids.push(heading(title(key)));
        d.forEach(x => kids.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: (x.label || "") + ": ", bold: true, size: 20 }), new TextRun({ text: x.value || "", size: 20 })] })));
      }
    }
    if (key === "custom") {
      (data.custom || []).filter(c => has(c.title) || clean(c.items).length).forEach(c => {
        kids.push(heading(c.title || "Additional"));
        clean(c.items).forEach(i => kids.push(bullet(i)));
      });
    }
  }

  const doc = new Document({
    creator: "Resume Forge", title: (data.name || "Resume") + " — Resume",
    styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
    numbering: { config: [{ reference: "rf-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
    sections: [{ properties: { page: { size: page, margin } }, children: kids }]
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

export function exportText(data, filename) { downloadText(resumeToText(data), filename); }
export function exportJson(doc, filename) {
  downloadText(JSON.stringify({ app: "resume-forge", version: 2, title: doc.title, data: doc.data, settings: doc.settings }, null, 2), filename, "application/json");
}
