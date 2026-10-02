// Reads an uploaded resume in the browser. Files never leave the device except
// as extracted text (or page images for scanned files) sent to the AI.

const MAX_IMG_SIDE = 1400;

// Errors meant for the user; anything else thrown while parsing gets a plain message.
class FileError extends Error {}

export async function readResumeFile(file) {
  try { return await readFile(file); }
  catch (e) {
    if (e instanceof FileError) throw e;
    console.error(e);
    throw new Error("We couldn't read this file. Save it again as PDF or Word (.docx) and upload it, or paste the text instead.");
  }
}
async function readFile(file) {
  const name = (file.name || "").toLowerCase();
  const type = file.type || "";
  if (name.endsWith(".json")) return { kind: "json", json: JSON.parse(await file.text()) };
  if (name.endsWith(".pdf") || type === "application/pdf") return readPdf(file);
  if (name.endsWith(".docx")) return { kind: "docx", text: await readDocx(file), images: [] };
  if (name.endsWith(".doc")) throw new FileError("Old .doc files can't be read. Open it in Word and save as .docx or PDF, then upload again.");
  if (/\.(png|jpe?g|webp)$/.test(name) || type.startsWith("image/")) return { kind: "image", text: "", images: [await imageToJpeg(file)] };
  if (/\.(txt|md|rtf)$/.test(name) || type.startsWith("text/")) return { kind: "text", text: await file.text(), images: [] };
  throw new FileError("This file type isn't supported. Upload a PDF, Word (.docx), photo, or .txt file.");
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
  if (typeof DecompressionStream === "undefined") throw new FileError("Your browser is too old to read Word files. Update Chrome, or upload a PDF instead.");
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
const DAMAGED = "This .docx file looks damaged. Open it in Word and save it again (or save as PDF), then upload again.";
async function unzipEntry(buf, wanted) {
  const size = buf.byteLength;
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const dec = new TextDecoder();
  // Bounds-checked readers: a damaged file must never read past its end.
  const fits = (at, len) => at >= 0 && at + len <= size;
  const u16 = at => fits(at, 2) ? dv.getUint16(at, true) : -1;
  const u32 = at => fits(at, 4) ? dv.getUint32(at, true) : -1;
  const u64 = at => fits(at, 8) ? dv.getUint32(at, true) + dv.getUint32(at + 4, true) * 2 ** 32 : -1;
  const readLocal = async (local, method, csize) => {
    if (u32(local) !== 0x04034b50) return null;
    const start = local + 30 + u16(local + 26) + u16(local + 28);
    if (!fits(start, csize)) return null;
    const data = u8.subarray(start, start + csize);
    if (method === 0) return dec.decode(data);
    if (method === 8) return dec.decode(await inflateRaw(data));
    throw new FileError("This .docx uses a compression we can't read. Save it again in Word, or upload a PDF.");
  };

  // 1) Central directory (normal or ZIP64), allowing extra bytes before the zip.
  let eocd = -1;
  for (let i = size - 22; i >= Math.max(0, size - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd >= 0) {
    let count = u16(eocd + 10), cdSize = u32(eocd + 12), cdOff = u32(eocd + 16), cdEnd = eocd;
    if ((count === 0xFFFF || cdSize === 0xFFFFFFFF || cdOff === 0xFFFFFFFF) && u32(eocd - 20) === 0x07064b50) {
      const z = u64(eocd - 12);
      if (u32(z) === 0x06064b50) { count = u64(z + 32); cdSize = u64(z + 40); cdOff = u64(z + 48); cdEnd = z; }
    }
    const shift = cdEnd - cdSize - cdOff;
    const base = shift > 0 && u32(cdOff) !== 0x02014b50 && u32(cdOff + shift) === 0x02014b50 ? shift : 0;
    let p = cdOff + base;
    for (let n = 0; n < count && u32(p) === 0x02014b50; n++) {
      const method = u16(p + 10);
      let csize = u32(p + 20), usize = u32(p + 24), local = u32(p + 42);
      const nameLen = u16(p + 28), extraLen = u16(p + 30), cmtLen = u16(p + 32);
      if (!fits(p + 46, nameLen + extraLen)) break;
      if (dec.decode(u8.subarray(p + 46, p + 46 + nameLen)) === wanted) {
        // ZIP64 extra field holds the real sizes/offset when the 32-bit ones are maxed out.
        for (let x = p + 46 + nameLen, xEnd = x + extraLen; x + 4 <= xEnd; x += 4 + u16(x + 2)) {
          if (u16(x) !== 0x0001) continue;
          let q = x + 4;
          if (usize === 0xFFFFFFFF) { usize = u64(q); q += 8; }
          if (csize === 0xFFFFFFFF) { csize = u64(q); q += 8; }
          if (local === 0xFFFFFFFF) local = u64(q);
          break;
        }
        const out = await readLocal(local + base, method, csize);
        if (out != null) return out;
        break;
      }
      p += 46 + nameLen + extraLen + cmtLen;
    }
  }

  // 2) Fallback: scan the local file headers (works when the index at the end is damaged).
  const want = new TextEncoder().encode(wanted);
  for (let i = 0; i + 30 <= size; i++) {
    if (u32(i) !== 0x04034b50 || u16(i + 26) !== want.length) continue;
    if (!want.every((b, k) => u8[i + 30 + k] === b)) continue;
    const start = i + 30 + want.length + u16(i + 28);
    let csize = u32(i + 18);
    if ((u16(i + 6) & 8) || !fits(start, csize)) {
      // Size isn't in the header: the data runs until the next zip record.
      let end = start;
      while (end + 4 <= size && !(u8[end] === 0x50 && u8[end + 1] === 0x4b && [0x0807, 0x0403, 0x0201].includes(u16(end + 2)))) end++;
      csize = (end + 4 <= size ? end : size) - start;
    }
    return readLocal(i, u16(i + 8), csize);
  }
  if (eocd < 0) throw new FileError(DAMAGED);
  return null;
}
const decodeXml = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");
export async function readDocx(file) {
  const buf = await file.arrayBuffer();
  const xml = await unzipEntry(buf, "word/document.xml");
  if (!xml) throw new FileError("This doesn't look like a Word .docx file.");
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
  if (!bmp) throw new FileError("This image couldn't be opened. Try a JPG or PNG.");
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
  if (!bmp) throw new FileError("This image couldn't be opened. Try a JPG or PNG.");
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
