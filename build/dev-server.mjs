// Local preview: node build/dev-server.mjs   (run `node build/build.mjs` first)
// Serves dist/ with clean URLs and runs /api/ai/* locally.
// MOCK_AI=1 returns fake AI answers so you can try the whole app without an API key.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleAI } from "../server/handler.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = +(process.env.PORT || 8788);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };

const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function mockAI(action, body) {
  const r = body.resume || { name: "Sample Person", title: "Sales Officer", email: "sample@example.com", experience: [{ role: "Sales Officer", company: "Sample Co", start: "2022", end: "Present", bullets: ["Responsible for sales"] }], education: [{ degree: "BBA", school: "Sample University", end: "2021" }], skills: ["sales", "ms excel"] };
  const improved = JSON.parse(JSON.stringify(r));
  (improved.experience || []).forEach(e => { e.bullets = (e.bullets || []).map(b => "Delivered: " + String(b).replace(/^responsible for /i, "")); });
  const base = { scoreBefore: 54, scoreAfter: 86, verdict: "Solid base; bullets list duties rather than results.", strengths: ["Clear structure", "Relevant experience"], issues: ["Bullets describe duties, not results", "No summary"], changes: ["Rewrote bullet points to start with action verbs", "Wrote a professional summary"], tips: ["Add your monthly sales numbers"], keywords: body.options?.jobAd ? { matched: ["Sales", "Excel"], missing: ["CRM", "Salesforce"] } : { matched: [], missing: [] } };
  switch (action) {
    case "import": case "improve": case "tailor": return { ...base, resume: { ...improved, summary: improved.summary || "Results-focused professional (mock AI summary)." } };
    case "review": return { score: 61, verdict: base.verdict, strengths: base.strengths, issues: base.issues, tips: base.tips, keywords: base.keywords };
    case "rewrite": return body.kind === "skills" ? { skills: ["Salesforce", "Negotiation", "Pipeline management"] } : { options: ["Mock option one — stronger version", "Mock option two — with result focus", "Mock option three — concise"] };
    case "cover-letter": return { subject: "Application — mock", letter: "Dear Hiring Manager,\n\nThis is a mock cover letter.\n\nSincerely,\n" + (r.name || "") };
  }
}

async function readBody(req) {
  const chunks = []; for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const m = url.pathname.match(/^\/api\/ai\/([\w-]+)$/);
  if (m) {
    const body = req.method === "POST" ? await readBody(req) : undefined;
    if (process.env.MOCK_AI === "1") {
      await new Promise(r => setTimeout(r, 600));
      const j = body ? JSON.parse(body.toString() || "{}") : {};
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(m[1] === "usage" ? { usage: { used: 4, limit: 30 } } : { result: mockAI(m[1], j), usage: { used: 7, limit: 30 } }));
    }
    const request = new Request(url, { method: req.method, headers: req.headers, body });
    const out = await handleAI(request, process.env, m[1]);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    return res.end(Buffer.from(await out.arrayBuffer()));
  }
  let p = decodeURIComponent(url.pathname);
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith("/")) { res.writeHead(301, { location: p + "/" + url.search }); return res.end(); }
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": TYPES[".html"] }); return res.end(fs.readFileSync(path.join(DIST, "404.html"))); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Resume Forge running at http://localhost:${PORT}${process.env.MOCK_AI === "1" ? "  (mock AI)" : ""}`));
