// Reads an uploaded resume in the browser. Files never leave the device except
// as extracted text (or page images for scanned files) sent to the AI.

const MAX_IMG_SIDE = 1400;

export async function readResumeFile(file) {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";
  if (name.endsWith(".json")) return { kind: "json", json: JSON.parse(await file.text()) };
  if (name.endsWith(".pdf") || type === "application/pdf") return readPdf(file);
  if (name.endsWith(".docx")) return { kind: "docx", text: await readDocx(file), images: [] };
  if (name.endsWith(".doc")) throw new Error("Old .doc files can't be read. Open it in Word and save as .docx or PDF, then upload again.");
  if (/\.(png|jpe?g|webp)$/.test(name) || type.startsWith("image/")) return { kind: "image", text: "", images: [await imageToJpeg(file)] };
  if (/\.(txt|md|rtf)$/.test(name) || type.startsWith("text/")) return { kind: "text", text: await file.text(), images: [] };
  throw new Error("This file type isn't supported. Upload a PDF, Word (.docx), photo, or .txt file.");
}

/* ---------------- PDF ---------------- */
let pdfjsP = null;
function loadPdfjs() {
  if (!pdfjsP) {
    pdfjsP = import("/vendor/pdfjs/pdf.min.mjs").then(m => {
      m.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsP;
}
async function readPdf(file) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = "";
  const pages = Math.min(doc.numPages, 6);
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let line = "";
    for (const it of tc.items) {
      if (!("str" in it)) continue;
      line += it.str;
      if (it.hasEOL) { text += line.trimEnd() + "\n"; line = ""; }
      else if (it.str && !it.str.endsWith(" ")) line += " ";
    }
    text += line + "\n\n";
  }
  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const images = [];
  if (text.replace(/\s/g, "").length < 120) {
    // Scanned PDF: send page pictures instead.
    for (let p = 1; p <= Math.min(doc.numPages, 2); p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 1.4 });
      const cv = document.createElement("canvas");
      cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      images.push(canvasToPart(cv));
    }
  }
  return { kind: "pdf", text, images, pages: doc.numPages };
}

/* ---------------- DOCX (zip + XML, no library) ---------------- */
async function inflateRaw(bytes) {
  if (typeof DecompressionStream === "undefined") throw new Error("Your browser is too old to read Word files. Update Chrome, or upload a PDF instead.");
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzipEntry(buf, wanted) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  // End of central directory record
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("This .docx file looks damaged.");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), cmtLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    if (name === wanted) {
      const lNameLen = dv.getUint16(local + 26, true), lExtraLen = dv.getUint16(local + 28, true);
      const start = local + 30 + lNameLen + lExtraLen;
      const data = u8.subarray(start, start + csize);
      if (method === 0) return dec.decode(data);
      if (method === 8) return dec.decode(await inflateRaw(data));
      throw new Error("Unsupported compression in .docx");
    }
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return null;
}
const decodeXml = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");
export async function readDocx(file) {
  const buf = await file.arrayBuffer();
  const xml = await unzipEntry(buf, "word/document.xml");
  if (!xml) throw new Error("This doesn't look like a Word .docx file.");
  const paras = xml.split(/<\/w:p>/);
  const lines = paras.map(p => {
    let out = "";
    const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:numPr>/g;
    let m;
    while ((m = re.exec(p))) {
      if (m[1] != null) out += decodeXml(m[1]);
      else if (m[0] === "<w:tab/>") out += "\t";
      else if (m[0] === "<w:br/>") out += "\n";
      else if (m[0] === "<w:numPr>") out += "• ";
    }
    return out.trim();
  });
  return lines.filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n");
}

/* ---------------- images ---------------- */
function canvasToPart(cv) {
  const url = cv.toDataURL("image/jpeg", 0.8);
  return { media_type: "image/jpeg", data: url.slice(url.indexOf(",") + 1) };
}
export async function imageToJpeg(file, max = MAX_IMG_SIDE) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error("This image couldn't be opened. Try a JPG or PNG.");
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
  return canvasToPart(cv);
}

// Square-crops and shrinks a profile photo to a small data URL for the resume.
export async function photoToDataUrl(file, size = 360) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) throw new Error("This image couldn't be opened. Try a JPG or PNG.");
  const side = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - side) / 2, sy = Math.max(0, (bmp.height - side) / 2 - side * 0.08);
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  cv.getContext("2d").drawImage(bmp, sx, Math.min(sy, bmp.height - side), side, side, 0, 0, size, size);
  return cv.toDataURL("image/jpeg", 0.85);
}

/* ---------------- no-AI fallback parser ---------------- */
export function basicParse(text) {
  const lines = String(text || "").split(/\n/).map(l => l.trim()).filter(Boolean);
  const r = { name: lines[0] || "", title: "", email: "", phone: "", location: "", links: [], summary: "", experience: [], education: [], projects: [], skills: [], certifications: [], languages: [], details: [], custom: [] };
  r.email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [""])[0];
  r.phone = ((text.match(/\+?\d[\d\s-]{8,}\d/) || [""])[0] || "").trim();
  r.links = [...new Set(text.match(/(?:linkedin\.com|github\.com|behance\.net)\/[\w\-/]+/gi) || [])];
  const H = [
    ["summary", /^(summary|profile|objective|career objective|about me|professional summary)\b/i],
    ["experience", /^(work experience|experience|employment( history)?|professional experience|work history)\b/i],
    ["education", /^(education|academic|qualification)/i],
    ["skills", /^(skills|technical skills|core skills|key skills|competenc)/i],
    ["projects", /^projects?\b/i],
    ["certifications", /^(certific|licen|courses?|trainings?)/i],
    ["languages", /^languages?\b/i]
  ];
  let cur = null; const b = {};
  lines.slice(1).forEach((l, i) => {
    const h = l.length < 42 && H.find(([, re]) => re.test(l.replace(/[:\-–]+$/, "")));
    if (h) { cur = h[0]; b[cur] = []; return; }
    if (!cur && i === 0 && !/@|\d{5,}/.test(l)) { r.title = l; return; }
    if (cur) b[cur].push(l.replace(/^[•\-–*·▪►]\s*/, ""));
  });
  if (b.summary) r.summary = b.summary.join(" ");
  if (b.experience) r.experience = [{ role: "", company: "", location: "", start: "", end: "", bullets: b.experience }];
  if (b.education) r.education = [{ degree: b.education[0] || "", school: b.education.slice(1, 2).join(""), location: "", start: "", end: "", details: b.education.slice(2).join(" ") }];
  if (b.projects) r.projects = b.projects.map(p => ({ name: p, link: "", desc: "" }));
  if (b.skills) r.skills = b.skills.join(",").split(/[,|•·;]/).map(s => s.trim()).filter(Boolean).slice(0, 30);
  if (b.certifications) r.certifications = b.certifications;
  if (b.languages) r.languages = b.languages.join(",").split(",").map(s => s.trim()).filter(Boolean);
  return r;
}
