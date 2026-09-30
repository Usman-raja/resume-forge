// /api/ai/:action — one Web-standard handler (Request → Response).
// Used by Cloudflare Pages Functions in production and by build/dev-server.mjs locally.
import { SYSTEM, importPrompt, improvePrompt, reviewPrompt, rewritePrompt, coverLetterPrompt } from "./prompts.mjs";
import { complete, parseJSON, AIError } from "./providers.mjs";

const COST = { import: 3, improve: 3, tailor: 3, review: 2, "cover-letter": 2, rewrite: 1 };
const MAX_BODY = 9 * 1024 * 1024;

function config(env) {
  const provider = (env.AI_PROVIDER || (env.ANTHROPIC_API_KEY ? "anthropic" : env.GEMINI_API_KEY ? "gemini" : "")).toLowerCase();
  return {
    provider,
    model: env.AI_MODEL || "",
    modelHeavy: env.AI_MODEL_HEAVY || "",
    anthropicKey: env.ANTHROPIC_API_KEY || "",
    geminiKey: env.GEMINI_API_KEY || "",
    supabaseUrl: (env.SUPABASE_URL || "").replace(/\/$/, ""),
    supabaseAnon: env.SUPABASE_ANON_KEY || "",
    supabaseService: env.SUPABASE_SERVICE_ROLE_KEY || "",
    dailyLimit: Math.max(1, parseInt(env.AI_DAILY_CREDITS || "30", 10) || 30),
    globalLimit: Math.max(0, parseInt(env.AI_GLOBAL_DAILY_CREDITS || "1500", 10) || 0),
    requireLogin: String(env.AI_REQUIRE_LOGIN ?? "true").toLowerCase() !== "false"
  };
}

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const fail = (code, message, status, extra = {}) => json({ error: { code, message }, ...extra }, status);

/* ---------------- Supabase (auth + credits) via REST ---------------- */
async function verifyUser(cfg, token) {
  if (!token || !cfg.supabaseUrl) return null;
  const res = await fetch(cfg.supabaseUrl + "/auth/v1/user", { headers: { apikey: cfg.supabaseAnon, Authorization: "Bearer " + token } });
  if (!res.ok) return null;
  const u = await res.json().catch(() => null);
  return u?.id ? u : null;
}
// Credit functions run with the service-role key (server-only secret).
async function rpc(cfg, fn, args) {
  const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: cfg.supabaseService, Authorization: "Bearer " + cfg.supabaseService, "content-type": "application/json" },
    body: JSON.stringify(args)
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) { console.error("rpc", fn, res.status, body); throw new AIError("server", "Could not check your AI allowance.", 502); }
  return body;
}

/* ---------------- input checks ---------------- */
const str = (v, max) => String(v ?? "").slice(0, max);
function cleanImages(images) {
  if (!Array.isArray(images)) return [];
  const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  return images.slice(0, 3)
    .filter(im => im && ok.includes(im.media_type) && typeof im.data === "string" && im.data.length < 4_000_000 && /^[A-Za-z0-9+/=]+$/.test(im.data.slice(0, 200)))
    .map(im => ({ media_type: im.media_type, data: im.data }));
}
function cleanResume(r) {
  if (!r || typeof r !== "object") throw new AIError("bad_input", "Resume data is missing.", 400);
  const c = { ...r }; delete c.photo;
  const s = JSON.stringify(c);
  if (s.length > 60000) throw new AIError("too_large", "This resume is too long to process at once.", 413);
  return c;
}
function opts(o) {
  o = o && typeof o === "object" ? o : {};
  return {
    role: str(o.role, 120), jobAd: str(o.jobAd, 15000),
    length: ["balanced", "concise", "detailed"].includes(o.length) ? o.length : "balanced",
    improve: o.improve !== false
  };
}

/* ---------------- actions ---------------- */
async function run(action, body, cfg) {
  const call = async (prompt, { images = [], maxTokens = 7000, heavy = true, temperature = 0.4 } = {}) => {
    const out = await complete(cfg, { system: SYSTEM, prompt, images, maxTokens, heavy, temperature });
    const data = parseJSON(out.text);
    if (!data) {
      console.error("unparseable AI output", out.truncated, out.text.slice(0, 300));
      throw new AIError(out.truncated ? "too_large" : "server", out.truncated ? "This resume is too long to rewrite in one go. Try the 'One page' length." : "The AI reply was incomplete. Please try again.", 502);
    }
    return data;
  };
  const needResume = d => { if (!d || typeof d.resume !== "object") throw new AIError("server", "The AI reply was incomplete. Please try again.", 502); return d; };

  switch (action) {
    case "import": {
      const o = opts(body.options);
      const text = str(body.text, 40000);
      const images = cleanImages(body.images);
      if (!text.trim() && !images.length) throw new AIError("bad_input", "We couldn't find any text in this file.", 400);
      return needResume(await call(importPrompt({ text, hasImages: images.length > 0, improve: o.improve, role: o.role, jobAd: o.jobAd, length: o.length }), { images, maxTokens: 8000 }));
    }
    case "improve":
    case "tailor": {
      const o = opts(body.options);
      if (action === "tailor" && o.jobAd.trim().length < 40) throw new AIError("bad_input", "Paste the job ad to tailor your resume.", 400);
      return needResume(await call(improvePrompt({ resume: cleanResume(body.resume), role: o.role, jobAd: o.jobAd, length: o.length, tailor: action === "tailor" }), { maxTokens: 8000 }));
    }
    case "review": {
      const o = opts(body.options);
      const d = await call(reviewPrompt({ resume: cleanResume(body.resume), role: o.role, jobAd: o.jobAd }), { maxTokens: 2500, temperature: 0.2 });
      if (typeof d.score !== "number") d.score = parseInt(d.score, 10) || 0;
      return d;
    }
    case "rewrite": {
      const kind = ["bullet", "summary", "skills"].includes(body.kind) ? body.kind : null;
      if (!kind) throw new AIError("bad_input", "Unknown rewrite type.", 400);
      const prompt = rewritePrompt({ kind, text: str(body.text, 2000), context: body.context || {}, resume: body.resume ? cleanResume(body.resume) : null });
      return call(prompt, { maxTokens: 1200, heavy: false, temperature: 0.7 });
    }
    case "cover-letter": {
      const o = body.options || {};
      const d = await call(coverLetterPrompt({ resume: cleanResume(body.resume), jobAd: str(o.jobAd, 15000), company: str(o.company, 120), manager: str(o.manager, 120), tone: str(o.tone, 60), length: str(o.length, 10) }), { maxTokens: 2000, temperature: 0.6 });
      if (typeof d.letter !== "string") throw new AIError("server", "The AI reply was incomplete. Please try again.", 502);
      return d;
    }
  }
  throw new AIError("bad_input", "Unknown AI action.", 404);
}

/* ---------------- entry ---------------- */
export async function handleAI(request, env, action) {
  const cfg = config(env || {});
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();

  if (request.method === "GET" && action === "usage") {
    if (!cfg.supabaseUrl) return json({ usage: null });
    const user = await verifyUser(cfg, token);
    if (!user) return fail("auth", "Please sign in.", 401);
    try {
      if (!cfg.supabaseService) return json({ usage: null });
      const u = await rpc(cfg, "get_ai_usage", { p_user: user.id, p_limit: cfg.dailyLimit });
      return json({ usage: { used: u?.used ?? 0, limit: cfg.dailyLimit } });
    } catch { return json({ usage: null }); }
  }
  if (request.method !== "POST") return fail("bad_input", "Use POST.", 405);
  if (!(action in COST)) return fail("bad_input", "Unknown AI action.", 404);
  if (!cfg.provider || !(cfg.anthropicKey || cfg.geminiKey)) return fail("not_configured", "AI is not switched on for this website yet.", 503);

  const len = +(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return fail("too_large", "This file is too large. Try a smaller PDF or a photo.", 413);
  let body;
  try { body = await request.json(); } catch { return fail("bad_input", "Invalid request.", 400); }

  // Auth + fair-use allowance. Fails closed: with AI_REQUIRE_LOGIN on (default)
  // and no Supabase configured, nobody can spend your AI budget.
  let user = null, usage = null, charged = 0;
  if (cfg.requireLogin && !cfg.supabaseUrl) return fail("not_configured", "AI needs sign-in, which isn't set up on this website yet.", 503);
  if (cfg.supabaseUrl && token) user = await verifyUser(cfg, token);
  if (cfg.requireLogin && !user) return fail("auth", "Please sign in to use AI features. It's free.", 401);
  if (user && !cfg.supabaseService) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set; refusing AI calls so costs can't run away.");
    return fail("not_configured", "AI limits are not configured on this website yet.", 503);
  }
  if (user) {
    try {
      const r = await rpc(cfg, "consume_ai_credit", { p_user: user.id, p_cost: COST[action], p_limit: cfg.dailyLimit, p_global_limit: cfg.globalLimit });
      if (!r?.allowed) {
        if (r?.reason === "global") return fail("budget", "Today's free AI capacity is used up. Please try again tomorrow.", 429);
        return fail("limit", `You've used today's ${cfg.dailyLimit} free AI credits. They reset at midnight (UTC).`, 429, { usage: { used: r?.used ?? cfg.dailyLimit, limit: cfg.dailyLimit } });
      }
      charged = COST[action];
      usage = { used: r.used, limit: cfg.dailyLimit };
    } catch (e) { return fail(e.code || "server", e.message, e.status || 502); }
  }

  try {
    const result = await run(action, body, cfg);
    return json({ result, usage });
  } catch (e) {
    if (user && charged) {
      try { const r = await rpc(cfg, "refund_ai_credit", { p_user: user.id, p_cost: charged }); usage = { used: r?.used ?? usage?.used, limit: cfg.dailyLimit }; } catch {}
    }
    const err = e instanceof AIError ? e : new AIError("server", "Something went wrong. Please try again.", 500);
    if (!(e instanceof AIError)) console.error(e);
    return fail(err.code, err.message, err.status, { usage });
  }
}
