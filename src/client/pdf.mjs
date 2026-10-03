// Direct PDF download made in the browser — no print dialog, no library.
// Each page is drawn as a sharp picture of the real resume (exact fonts and
// colours), with an invisible text layer on top so the PDF stays searchable,
// copyable and readable by ATS / job portals. Page breaks fall between lines.

const PAPER = { a4: [595.28, 841.89], letter: [612, 792] }; // points
const MM = 96 / 25.4; // CSS px per mm
const TOP = 10 * MM, BOTTOM = 12 * MM; // same margins as the print version

export async function buildPdf(pageHTML, { paper = "a4", title = "Resume" } = {}) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;pointer-events:none";
  host.setAttribute("aria-hidden", "true");
  host.innerHTML = pageHTML;
  document.body.appendChild(host);
  try {
    const page = host.firstElementChild;
    try { await document.fonts?.ready; } catch {}
    await Promise.all([...page.querySelectorAll("img")].map(img => img.decode?.().catch(() => {})));

    const W = page.offsetWidth, H = page.offsetHeight;
    const [wPt, hPt] = PAPER[paper] || PAPER.a4;
    const pageH = W * hPt / wPt; // page height in CSS px
    const { runs, blocks, heads } = measure(page);
    const slices = paginate(blocks, heads, H, pageH);
    // Coloured sidebars run the full height of every page, as on screen.
    const base = page.getBoundingClientRect();
    const bands = [...page.querySelectorAll(".r-side")].map(el => {
      const r = el.getBoundingClientRect(), color = getComputedStyle(el).backgroundColor;
      return { x: r.left - base.left, w: r.width, color };
    }).filter(b => b.w && !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(b.color));

    const img = await snapshot(page, W, H);
    const scale = 2;
    const pages = [];
    for (const [i, s] of slices.entries()) {
      const top = i === 0 ? 0 : TOP;
      const cv = document.createElement("canvas");
      cv.width = Math.round(W * scale); cv.height = Math.round(pageH * scale);
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
      const end = top + s.to - s.from;
      for (const b of bands) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x * scale, 0, b.w * scale, top * scale + 1);
        ctx.fillRect(b.x * scale, end * scale - 1, b.w * scale, (pageH - end) * scale + 2);
      }
      ctx.drawImage(img, 0, s.from, W, s.to - s.from, 0, top * scale, W * scale, (s.to - s.from) * scale);
      const jpeg = await canvasJpeg(cv);
      const text = runs.filter(r => r.y >= s.from - 1 && r.y + r.h <= s.to + 1)
        .map(r => ({ ...r, y: r.y - s.from + top }));
      pages.push({ jpeg, w: cv.width, h: cv.height, text });
    }
    return writePdf(pages, { wPt, hPt, k: wPt / W, title });
  } finally {
    host.remove();
  }
}

/* ---------- measure text lines and unbreakable blocks ---------- */
function measure(page) {
  const base = page.getBoundingClientRect();
  const runs = [], blocks = [];
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const str = n.nodeValue;
    if (!str.trim()) continue;
    const size = parseFloat(getComputedStyle(n.parentElement).fontSize) || 13;
    let cur = null;
    for (const m of str.matchAll(/\S+/g)) {
      range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      const r = range.getClientRects()[0];
      if (!r || !r.width) continue;
      const x = r.left - base.left, y = r.top - base.top;
      if (cur && Math.abs(y - cur.y) < r.height / 2) { cur.text += " " + m[0]; cur.w = x + r.width - cur.x; cur.h = Math.max(cur.h, r.height); }
      else { cur = { x, y, w: r.width, h: r.height, size, text: m[0] }; runs.push(cur); }
    }
  }
  for (const r of runs) blocks.push({ top: r.y, bottom: r.y + r.h });
  for (const el of page.querySelectorAll("img, svg, .r-photo")) {
    const r = el.getBoundingClientRect();
    if (r.height) blocks.push({ top: r.top - base.top, bottom: r.bottom - base.top });
  }
  const heads = [...page.querySelectorAll(".r-sec-h")].map(h => {
    const r = h.getBoundingClientRect();
    return { top: r.top - base.top, bottom: r.bottom - base.top };
  });
  return { runs, blocks, heads };
}

// Chooses page breaks that never cut through a line, and never leave a
// section heading alone at the bottom of a page.
function paginate(blocks, heads, H, pageH) {
  const slices = [];
  const lastContent = Math.max(0, ...blocks.map(b => b.bottom));
  let from = 0;
  for (let i = 0; i < 50; i++) {
    const avail = pageH - (i === 0 ? 0 : TOP) - BOTTOM;
    if (lastContent <= from + avail) { slices.push({ from, to: Math.min(H, from + pageH - (i === 0 ? 0 : TOP)) }); break; }
    let cut = from + avail;
    for (let guard = 0; guard < 500; guard++) {
      const hit = blocks.find(b => b.top < cut - 0.5 && b.bottom > cut + 0.5 && b.bottom - b.top < avail);
      if (!hit) break;
      cut = hit.top - 1;
    }
    const lonely = heads.find(h => h.top > from && h.bottom <= cut && cut - h.bottom < (h.bottom - h.top) * 2.2);
    if (lonely) cut = lonely.top - 2;
    if (cut <= from + avail * 0.3) cut = from + avail; // never get stuck
    slices.push({ from, to: cut });
    from = cut;
  }
  return slices;
}

/* ---------- picture of the page (SVG foreignObject, fonts inlined) ---------- */
async function snapshot(page, W, H) {
  const css = await collectCss(page);
  const ser = new XMLSerializer();
  const style = document.createElement("style");
  style.textContent = css;
  const body = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;background:#fff">${ser.serializeToString(style)}${ser.serializeToString(page)}</div>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${body}</foreignObject></svg>`;
  const img = new Image();
  img.width = W; img.height = H;
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  // Safari sometimes needs one throw-away draw before fonts/images appear.
  const probe = document.createElement("canvas").getContext("2d");
  probe.drawImage(img, 0, 0);
  await new Promise(r => setTimeout(r, 60));
  return img;
}

const fontCache = new Map();
async function collectCss(page) {
  let css = "";
  for (const sh of document.styleSheets) {
    try { for (const r of sh.cssRules) css += r.cssText + "\n"; } catch {} // cross-origin sheets can't be read
  }
  // Fonts: embed only the families this resume uses (Latin subsets).
  const used = new Set();
  for (const el of [page, ...page.querySelectorAll("*")]) {
    for (const f of getComputedStyle(el).fontFamily.split(",")) used.add(f.trim().replace(/^["']|["']$/g, "").toLowerCase());
  }
  const links = [...document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]')];
  for (const link of links) {
    let text = fontCache.get(link.href);
    if (!text) { text = await (await fetch(link.href)).text(); fontCache.set(link.href, text); }
    for (const block of text.match(/@font-face\s*{[^}]*}/g) || []) {
      const fam = (block.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1];
      if (!fam || !used.has(fam.trim().toLowerCase())) continue;
      const range = (block.match(/unicode-range:([^;]+)/) || [])[1] || "";
      if (range && !/U\+0000-00FF|U\+0100-02/i.test(range)) continue;
      const url = (block.match(/url\(([^)]+)\)/) || [])[1];
      if (!url) continue;
      css += block.replace(url, await fontDataUrl(url.replace(/^["']|["']$/g, ""))) + "\n";
    }
  }
  return css;
}
async function fontDataUrl(url) {
  if (!fontCache.has(url)) {
    fontCache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error("font " + r.status); return r.blob(); }).then(blobToDataUrl));
  }
  return fontCache.get(url);
}
const blobToDataUrl = b => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); });
const canvasJpeg = cv => new Promise((res, rej) => cv.toBlob(b => b ? b.arrayBuffer().then(a => res(new Uint8Array(a)), rej) : rej(new Error("canvas export failed")), "image/jpeg", 0.92));

/* ---------- minimal PDF writer ---------- */
const WIN = { "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "…": 0x85, "€": 0x80 };
function pdfString(s) {
  let out = "";
  for (const ch of s) {
    const c = WIN[ch] ?? ch.codePointAt(0);
    if (c > 255) { out += " "; continue; } // outside the built-in font: leave a gap
    out += c === 0x28 || c === 0x29 || c === 0x5c ? "\\" + ch : String.fromCharCode(c);
  }
  return "(" + out + ")";
}
const latin1 = s => Uint8Array.from(s, c => c.charCodeAt(0));
const n2 = v => (Math.round(v * 100) / 100).toString();

function writePdf(pages, { wPt, hPt, k, title }) {
  const parts = [], offsets = [];
  let len = 0;
  const put = x => { const b = typeof x === "string" ? latin1(x) : x; parts.push(b); len += b.length; };
  const obj = (id, body) => { offsets[id] = len; put(`${id} 0 obj\n`); for (const b of [].concat(body)) put(b); put("\nendobj\n"); };

  put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const kids = pages.map((_, i) => `${5 + i * 3} 0 R`).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  obj(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  obj(4, `<< /Title ${pdfString(title)} /Producer (Resume Forge) /Creator (Resume Forge) >>`);
  pages.forEach((p, i) => {
    const id = 5 + i * 3;
    let content = `q ${n2(wPt)} 0 0 ${n2(hPt)} 0 0 cm /Im1 Do Q\nBT 3 Tr\n`;
    for (const r of p.text) {
      const size = r.size * k;
      const natural = r.text.length * size * 0.5; // rough Helvetica width
      const tz = natural > 0 ? Math.max(20, Math.min(400, (r.w * k / natural) * 100)) : 100;
      const baseline = hPt - (r.y + r.h * 0.78) * k;
      content += `/F1 ${n2(size)} Tf ${n2(tz)} Tz 1 0 0 1 ${n2(r.x * k)} ${n2(baseline)} Tm ${pdfString(r.text)} Tj\n`;
    }
    content += "ET";
    obj(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n2(wPt)} ${n2(hPt)}] /Resources << /Font << /F1 3 0 R >> /XObject << /Im1 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    obj(id + 1, [`<< /Length ${content.length} >>\nstream\n`, content, "\nendstream"]);
    obj(id + 2, [`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`, p.jpeg, "\nendstream"]);
  });
  const count = 5 + pages.length * 3;
  const xref = len;
  let x = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) x += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  put(x + `trailer\n<< /Size ${count} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: "application/pdf" });
}
