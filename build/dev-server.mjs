// Local preview: node build/dev-server.mjs   (run `node build/build.mjs` first)
// Serves dist/ with clean URLs and runs the same /api/* code as Cloudflare, with:
//   • a local SQLite file standing in for Cloudflare D1 (.local/dev.sqlite, needs Node 22+)
//   • AI: MOCK_AI=1 → fake answers;  or CF_ACCOUNT_ID + CF_API_TOKEN → real Workers AI over REST
//   • DEV_LOGIN=1 → /api/dev-login signs you in as a test user (no Google needed)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { route } from "../server/router.mjs";
import { createSession } from "../server/auth.mjs";

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

if (process.argv.includes("--mock")) process.env.MOCK_AI = "1";
if (process.argv.includes("--dev-login")) process.env.DEV_LOGIN = "1";

/* ---------------- D1 stand-in (node:sqlite) ---------------- */
let DB = null;
try {
  const { DatabaseSync } = await import("node:sqlite");
  fs.mkdirSync(path.join(ROOT, ".local"), { recursive: true });
  const db = new DatabaseSync(process.env.DEV_DB || path.join(ROOT, ".local/dev.sqlite"));
  db.exec(fs.readFileSync(path.join(ROOT, "db/schema.sql"), "utf8"));
  const plain = r => (r ? { ...r } : null);
  class Stmt {
    constructor(sql, params = []) { this.sql = sql; this.params = params; }
    bind(...p) { return new Stmt(this.sql, p); }
    async first(col) { const r = plain(db.prepare(this.sql).get(...this.params)); return r && col ? r[col] ?? null : r; }
    async all() { return { success: true, results: db.prepare(this.sql).all(...this.params).map(plain) }; }
    async run() { const i = db.prepare(this.sql).run(...this.params); return { success: true, meta: { changes: Number(i.changes) } }; }
  }
  DB = { prepare: sql => new Stmt(sql), exec: sql => db.exec(sql) };
} catch (e) {
  console.warn("node:sqlite not available (needs Node 22+) — login and cloud saving are off locally.");
}

/* ---------------- Workers AI stand-in ---------------- */
function mockAnswer(prompt) {
  const p = String(prompt);
  if (p.includes('Return: {"options"')) return JSON.stringify({ options: ["Mock option one — stronger version", "Mock option two — with result focus", "Mock option three — concise"] });
  if (p.includes('Return: {"skills"')) return JSON.stringify({ skills: ["Salesforce", "Negotiation", "Pipeline management"] });
  if (p.includes('{"subject": "", "letter": ""}')) return JSON.stringify({ subject: "Application — mock", letter: "Dear Hiring Manager,\n\nThis is a mock cover letter.\n\nSincerely," });
  if (p.includes('{"score": 0, "verdict"')) return JSON.stringify({ score: 61, verdict: "Solid base; bullets list duties rather than results.", strengths: ["Clear structure", "Relevant experience"], issues: ["Bullets describe duties, not results", "No summary"], tips: ["Add numbers"], keywords: { matched: [], missing: [] } });
  const m = p.match(/<resume>\n([\s\S]*?)\n<\/resume>/);
  let resume = { name: "Sample Person", title: "Sales Officer", email: "sample@example.com", experience: [{ role: "Sales Officer", company: "Sample Co", start: "2022", end: "Present", bullets: ["Responsible for sales"] }], education: [{ degree: "BBA", school: "Sample University", end: "2021" }], skills: ["sales", "ms excel"] };
  if (m) { try { resume = JSON.parse(m[1]); } catch {} }
  (resume.experience || []).forEach(e => { e.bullets = (e.bullets || []).map(b => "Delivered: " + String(b).replace(/^responsible for /i, "")); });
  resume.summary = resume.summary || "Results-focused professional (mock AI summary).";
  return "Here you go:\n```json\n" + JSON.stringify({ resume, scoreBefore: 54, scoreAfter: 86, verdict: "Good start.", strengths: ["Clear structure"], issues: ["Few numbers"], changes: ["Rewrote bullet points to start with action verbs", "Wrote a professional summary"], tips: ["Add your monthly sales numbers"], keywords: { matched: [], missing: [] } }) + "\n```";
}
let AI = null;
if (process.env.MOCK_AI === "1") {
  AI = { run: async (model, input) => { await new Promise(r => setTimeout(r, 500)); return { response: mockAnswer(input.messages?.at(-1)?.content?.[0]?.text || input.messages?.at(-1)?.content), usage: { prompt_tokens: 100, completion_tokens: 100 } }; } };
} else if (process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN) {
  AI = {
    run: async (model, input) => {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${model}`, {
        method: "POST", headers: { Authorization: "Bearer " + process.env.CF_API_TOKEN, "content-type": "application/json" }, body: JSON.stringify(input)
      });
      const j = await res.json();
      if (!j.success) throw new Error(JSON.stringify(j.errors || j));
      return j.result;
    }
  };
}
const env = { ...process.env, DB, AI };
if (!AI && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) console.warn("No AI configured locally. Use MOCK_AI=1, or CF_ACCOUNT_ID + CF_API_TOKEN for real Workers AI.");

async function readBody(req) { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c); }
async function send(res, out) {
  const headers = {};
  out.headers.forEach((v, k) => { if (k !== "set-cookie") headers[k] = v; });
  const cookies = out.headers.getSetCookie?.() || [];
  if (cookies.length) headers["set-cookie"] = cookies;
  res.writeHead(out.status, headers);
  res.end(Buffer.from(await out.arrayBuffer()));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/api/dev-login" && process.env.DEV_LOGIN === "1" && DB) {
    const c = await createSession(env, { id: "g:dev-user", email: "dev@example.com", name: "Dev User", picture: "" }, false);
    const next = url.searchParams.get("next") || "/dashboard/";
    res.writeHead(302, { "set-cookie": c, location: next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard/" });
    return res.end();
  }
  if (url.pathname.startsWith("/api/")) {
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
    const headers = { ...req.headers, "cf-connecting-ip": req.socket.remoteAddress || "127.0.0.1" };
    return send(res, await route(new Request(url, { method: req.method, headers, body }), env));
  }
  const p = decodeURIComponent(url.pathname);
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith("/")) { res.writeHead(301, { location: p + "/" + url.search }); return res.end(); }
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": TYPES[".html"] }); return res.end(fs.readFileSync(path.join(DIST, "404.html"))); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Resume Forge running at http://localhost:${PORT}${AI && process.env.MOCK_AI === "1" ? "  (mock AI)" : ""}${process.env.DEV_LOGIN === "1" ? "  (test login: /api/dev-login)" : ""}`));
