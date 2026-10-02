// Self-test: node build/test.mjs   (Node 22+, no network, no accounts)
// Builds the site, then runs the real API code against an in-memory SQLite
// database (stand-in for Cloudflare D1) and a fake AI. Exits 1 on any failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0, passed = 0;
const ok = (cond, label) => { if (cond) { passed++; console.log("  ✓ " + label); } else { failed++; console.log("  ✗ " + label); } };

console.log("1. Build");
execFileSync(process.execPath, [path.join(ROOT, "build/build.mjs")], { stdio: "pipe", env: { ...process.env, GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com" } });
const D = p => fs.existsSync(path.join(ROOT, "dist", p));
ok(D("index.html") && D("builder/index.html") && D("templates/modern/index.html") && D("cv-examples/nurse/index.html"), "key pages built");
ok(fs.readFileSync(path.join(ROOT, "dist/sitemap.xml"), "utf8").split("<url>").length - 1 >= 45, "sitemap has 45+ pages");

console.log("2. Resume engine");
const { renderResume } = await import("../src/shared/render.mjs");
const { TEMPLATES } = await import("../src/shared/templates.mjs");
const { EXAMPLE } = await import("../src/shared/sample.mjs");
const { lintResume } = await import("../src/shared/lint.mjs");
ok(TEMPLATES.length >= 26 && TEMPLATES.every(t => renderResume(EXAMPLE, { template: t.id }).includes("t-" + t.id)), `${TEMPLATES.length} templates render`);
ok(!/<script>/.test(renderResume({ name: "<script>x</script>" }, {})), "user text is escaped");
ok(lintResume(EXAMPLE).score >= 80 && lintResume({ name: "A" }).score < 40, "instant check scores sensibly");

console.log("3. API (D1 + auth + AI allowance)");
const { DatabaseSync } = await import("node:sqlite");
const { route } = await import("../server/router.mjs");
const db = new DatabaseSync(":memory:");
db.exec(fs.readFileSync(path.join(ROOT, "db/schema.sql"), "utf8"));
const plain = r => (r ? { ...r } : null);
class Stmt {
  constructor(s, p = []) { this.s = s; this.p = p; }
  bind(...p) { return new Stmt(this.s, p); }
  async first(c) { const r = plain(db.prepare(this.s).get(...this.p)); return r && c ? r[c] ?? null : r; }
  async all() { return { results: db.prepare(this.s).all(...this.p).map(plain) }; }
  async run() { const i = db.prepare(this.s).run(...this.p); return { meta: { changes: Number(i.changes) } }; }
}
let aiFail = null;
const env = {
  DB: { prepare: s => new Stmt(s) },
  AI: { run: async () => { if (aiFail) { const m = aiFail; aiFail = null; throw new Error(m); } return { response: '```json\n{"options":["A","B","C"],"resume":{"name":"X"},"scoreBefore":50,"scoreAfter":80}\n```' }; } },
  GOOGLE_CLIENT_ID: "cid", GOOGLE_CLIENT_SECRET: "sec", SESSION_SECRET: "s",
  AI_GUEST_DAILY_CREDITS: "6", AI_DAILY_CREDITS: "9", AI_GLOBAL_DAILY_CREDITS: "1000"
};
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith("https://oauth2.googleapis.com/token")) {
    const claims = { iss: "https://accounts.google.com", aud: "cid", sub: "1", email: "a@b.c", email_verified: true, name: "Test", exp: Date.now() / 1000 + 600 };
    return new Response(JSON.stringify({ id_token: "h." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".s" }));
  }
  return realFetch(url, init);
};
const O = "https://site.test";
const req = (p, { method = "GET", body, cookie, ip = "1.1.1.1", origin } = {}) =>
  route(new Request(O + p, { method, redirect: "manual", headers: { "content-type": "application/json", "cf-connecting-ip": ip, ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
const J = async r => r.json();

let r = await req("/api/auth/google?next=/builder/");
const state = new URL(r.headers.get("location")).searchParams.get("state");
const sc = r.headers.get("set-cookie").split(";")[0];
ok(r.status === 302 && state, "Google sign-in redirect");
ok((await req(`/api/auth/callback?code=x&state=wrong`, { cookie: sc })).headers.get("location").includes("error=state"), "bad state rejected");
r = await req(`/api/auth/callback?code=x&state=${state}`, { cookie: sc });
const session = (r.headers.getSetCookie().find(c => c.startsWith("rf_session=")) || "").split(";")[0];
ok(r.status === 302 && session, "Google callback creates a session");
ok((await J(await req("/api/auth/me", { cookie: session }))).user?.email === "a@b.c", "/api/auth/me returns the user");
r = await req("/api/resumes", { method: "POST", cookie: session, body: { title: "T", data: { name: "A" }, settings: {} } });
const { id } = await J(r);
ok(r.status === 201 && id, "create resume");
ok((await req("/api/resumes", { method: "POST", cookie: session, origin: "https://evil.example", body: {} })).status === 403, "cross-site write blocked");
ok((await req("/api/resumes/" + id)).status === 401, "resume needs login");
ok((await req("/api/public/" + id)).status === 404, "private resume not public");
await req("/api/resumes/" + id, { method: "PUT", cookie: session, body: { is_public: true } });
ok((await req("/api/public/" + id)).status === 200, "share link works");
const ai = (a, o = {}) => req("/api/ai/" + a, { method: "POST", body: { resume: { name: "A" }, kind: "bullet", text: "x" }, ...o });
ok((await J(await ai("rewrite"))).result?.options?.length === 3, "AI rewrite (fenced JSON parsed)");
await ai("improve"); r = await ai("improve");
ok(r.status === 429 && (await J(r)).error.code === "guest_limit", "guest daily limit enforced");
aiFail = "3036: daily free allocation of 10,000 neurons used";
r = await ai("improve", { cookie: session });
const e = await J(r);
ok(r.status === 429 && e.error.code === "budget" && e.usage.used === 0, "free-tier cap → friendly message + refund");
ok(!JSON.stringify(db.prepare("select subject from ai_usage").all()).includes("1.1.1.1"), "raw IPs never stored");
ok((await J(await req("/api/auth/logout", { method: "POST", cookie: session }))).ok && !(await J(await req("/api/auth/me", { cookie: session }))).user, "logout");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
