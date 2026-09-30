// /api/ai/:action — AI features with a fair daily allowance per person.
import { SYSTEM, importPrompt, improvePrompt, reviewPrompt, rewritePrompt, coverLetterPrompt } from "./prompts.mjs";
import { complete, parseJSON } from "./providers.mjs";
import { json, fail, readJSON, sha256hex, todayUTC, ApiError } from "./http.mjs";
import { currentUser } from "./auth.mjs";

// Credits roughly follow real cost: a full rewrite uses ~3× a one-line rewrite.
export const COST = { import: 3, improve: 3, tailor: 3, review: 2, "cover-letter": 2, rewrite: 1 };
const MAX_BODY = 6 * 1024 * 1024;
const int = (v, d) => { const n = parseInt(v ?? "", 10); return Number.isFinite(n) && n >= 0 ? n : d; };

export function aiConfig(env) {
  const provider = (env.AI_PROVIDER || (env.AI ? "workers-ai" : env.ANTHROPIC_API_KEY ? "anthropic" : env.GEMINI_API_KEY ? "gemini" : "")).toLowerCase();
  return {
    provider, ai: env.AI,
    model: env.AI_MODEL || "", modelHeavy: env.AI_MODEL_HEAVY || "",
    anthropicKey: env.ANTHROPIC_API_KEY || "", geminiKey: env.GEMINI_API_KEY || "",
    userLimit: Math.max(1, int(env.AI_DAILY_CREDITS, 15)),
    guestLimit: String(env.AI_REQUIRE_LOGIN).toLowerCase() === "true" ? 0 : int(env.AI_GUEST_DAILY_CREDITS, 6), // 0 = guests must sign in
    globalLimit: int(env.AI_GLOBAL_DAILY_CREDITS, 100),     // whole site per day; 0 = no cap
    salt: env.SESSION_SECRET || "resume-forge"
  };
}
const configured = cfg => (cfg.provider === "workers-ai" ? !!cfg.ai : cfg.provider === "anthropic" ? !!cfg.anthropicKey : cfg.provider === "gemini" ? !!cfg.geminiKey : false);

/* ---------------- allowance (D1) ---------------- */
async function who(request, env, cfg) {
  const user = await currentUser(request, env).catch(() => null);
  if (user) return { subject: "u:" + user.id, limit: cfg.userLimit, guest: false };
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  return { subject: "ip:" + (await sha256hex(ip + "|" + cfg.salt)).slice(0, 32), limit: cfg.guestLimit, guest: true };
}
async function consume(env, cfg, w, cost) {
  const day = todayUTC();
  if (cfg.globalLimit > 0) {
    const total = await env.DB.prepare("SELECT COALESCE(SUM(used), 0) AS t FROM ai_usage WHERE day = ?").bind(day).first("t");
    if (total + cost > cfg.globalLimit) return { allowed: false, reason: "global" };
  }
  const row = await env.DB.prepare(
    "INSERT INTO ai_usage (subject, day, used) VALUES (?, ?, ?) ON CONFLICT(subject, day) DO UPDATE SET used = ai_usage.used + excluded.used WHERE ai_usage.used + excluded.used <= ? RETURNING used"
  ).bind(w.subject, day, cost, w.limit).first();
  if (!row) {
    const used = await env.DB.prepare("SELECT used FROM ai_usage WHERE subject = ? AND day = ?").bind(w.subject, day).first("used");
    return { allowed: false, reason: "limit", used: used ?? w.limit };
  }
  if (row.used > w.limit) { // first action of the day costing more than the whole allowance
    await env.DB.prepare("UPDATE ai_usage SET used = used - ? WHERE subject = ? AND day = ?").bind(cost, w.subject, day).run();
    return { allowed: false, reason: "limit", used: row.used - cost };
  }
  if (Math.random() < 0.01) await env.DB.prepare("DELETE FROM ai_usage WHERE day < ?").bind(new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10)).run();
  return { allowed: true, used: row.used };
}
async function refund(env, w, cost) {
  return env.DB.prepare("UPDATE ai_usage SET used = MAX(0, used - ?) WHERE subject = ? AND day = ? RETURNING used").bind(cost, w.subject, todayUTC()).first("used");
}

/* ---------------- input checks ---------------- */
const str = (v, max) => String(v ?? "").slice(0, max);
function cleanImages(images) {
  if (!Array.isArray(images)) return [];
  const ok = ["image/jpeg", "image/png", "image/webp"];
  return images.slice(0, 2)
    .filter(im => im && ok.includes(im.media_type) && typeof im.data === "string" && im.data.length < 2_500_000 && /^[A-Za-z0-9+/=]+$/.test(im.data.slice(0, 200)))
    .map(im => ({ media_type: im.media_type, data: im.data }));
}
function cleanResume(r) {
  if (!r || typeof r !== "object") throw new ApiError("bad_input", "Resume data is missing.", 400);
  const c = { ...r }; delete c.photo;
  if (JSON.stringify(c).length > 60000) throw new ApiError("too_large", "This resume is too long to process at once.", 413);
  return c;
}
function opts(o) {
  o = o && typeof o === "object" ? o : {};
  return { role: str(o.role, 120), jobAd: str(o.jobAd, 15000), length: ["balanced", "concise", "detailed"].includes(o.length) ? o.length : "balanced", improve: o.improve !== false };
}

/* ---------------- actions ---------------- */
async function run(action, body, cfg) {
  const call = async (prompt, { images = [], maxTokens = 6000, heavy = true, temperature = 0.35 } = {}) => {
    const out = await complete(cfg, { system: SYSTEM, prompt, images, maxTokens, heavy, temperature });
    const data = parseJSON(out.text);
    if (!data) {
      console.error("unparseable AI output", out.truncated, String(out.text).slice(0, 300));
      throw new ApiError(out.truncated ? "too_large" : "server", out.truncated ? "This resume is too long to rewrite in one go. Try the 'One page' length." : "The AI reply was incomplete. Please try again.", 502);
    }
    return data;
  };
  const needResume = d => { if (!d || typeof d.resume !== "object" || !d.resume) throw new ApiError("server", "The AI reply was incomplete. Please try again.", 502); return d; };

  switch (action) {
    case "import": {
      const o = opts(body.options);
      const text = str(body.text, 40000);
      const images = cleanImages(body.images);
      if (!text.trim() && !images.length) throw new ApiError("bad_input", "We couldn't find any text in this file.", 400);
      return needResume(await call(importPrompt({ text, hasImages: images.length > 0, improve: o.improve, role: o.role, jobAd: o.jobAd, length: o.length }), { images }));
    }
    case "improve":
    case "tailor": {
      const o = opts(body.options);
      if (action === "tailor" && o.jobAd.trim().length < 40) throw new ApiError("bad_input", "Paste the job ad to tailor your resume.", 400);
      return needResume(await call(improvePrompt({ resume: cleanResume(body.resume), role: o.role, jobAd: o.jobAd, length: o.length, tailor: action === "tailor" })));
    }
    case "review": {
      const o = opts(body.options);
      const d = await call(reviewPrompt({ resume: cleanResume(body.resume), role: o.role, jobAd: o.jobAd }), { maxTokens: 2500, temperature: 0.2 });
      d.score = Math.max(0, Math.min(100, parseInt(d.score, 10) || 0));
      return d;
    }
    case "rewrite": {
      const kind = ["bullet", "summary", "skills"].includes(body.kind) ? body.kind : null;
      if (!kind) throw new ApiError("bad_input", "Unknown rewrite type.", 400);
      return call(rewritePrompt({ kind, text: str(body.text, 2000), context: body.context || {}, resume: body.resume ? cleanResume(body.resume) : null }), { maxTokens: 1200, heavy: false, temperature: 0.7 });
    }
    case "cover-letter": {
      const o = body.options || {};
      const d = await call(coverLetterPrompt({ resume: cleanResume(body.resume), jobAd: str(o.jobAd, 15000), company: str(o.company, 120), manager: str(o.manager, 120), tone: str(o.tone, 60), length: str(o.length, 10) }), { maxTokens: 2000, temperature: 0.6 });
      if (typeof d.letter !== "string") throw new ApiError("server", "The AI reply was incomplete. Please try again.", 502);
      return d;
    }
  }
  throw new ApiError("bad_input", "Unknown AI action.", 404);
}

/* ---------------- entry ---------------- */
export async function handleAI(request, env, action) {
  const cfg = aiConfig(env || {});
  const hasDB = !!env.DB;

  if (action === "usage") {
    if (!hasDB) return json({ usage: null });
    const w = await who(request, env, cfg);
    const used = await env.DB.prepare("SELECT used FROM ai_usage WHERE subject = ? AND day = ?").bind(w.subject, todayUTC()).first("used");
    return json({ usage: { used: used || 0, limit: w.limit, guest: w.guest } });
  }
  if (request.method !== "POST") return fail("bad_input", "Use POST.", 405);
  if (!(action in COST)) return fail("bad_input", "Unknown AI action.", 404);
  if (!configured(cfg)) return fail("not_configured", "AI is not switched on for this website yet.", 503);
  // Paid providers never run without limits.
  if (!hasDB && cfg.provider !== "workers-ai") return fail("not_configured", "AI limits are not set up on this website yet.", 503);

  const body = await readJSON(request, MAX_BODY);
  let w = null, usage = null, charged = 0;
  if (hasDB) {
    w = await who(request, env, cfg);
    if (w.guest && cfg.guestLimit === 0) return fail("auth", "Please sign in to use AI features. It's free.", 401);
    const r = await consume(env, cfg, w, COST[action]);
    if (!r.allowed) {
      if (r.reason === "global") return fail("budget", "Today's free AI capacity is used up. Please try again tomorrow — everything else on the site still works.", 429);
      const u = { used: r.used, limit: w.limit, guest: w.guest };
      return w.guest
        ? fail("guest_limit", `You've used today's ${w.limit} free guest credits. Sign in with Google to get ${cfg.userLimit} credits a day.`, 429, { usage: u })
        : fail("limit", `You've used today's ${w.limit} free AI credits. They reset at midnight (UTC).`, 429, { usage: u });
    }
    charged = COST[action];
    usage = { used: r.used, limit: w.limit, guest: w.guest };
  }

  try {
    return json({ result: await run(action, body, cfg), usage });
  } catch (e) {
    if (w && charged) { try { const u = await refund(env, w, charged); usage = { ...usage, used: u ?? usage.used }; } catch {} }
    const err = e instanceof ApiError ? e : new ApiError("server", "Something went wrong. Please try again.", 500);
    if (!(e instanceof ApiError)) console.error(e);
    return fail(err.code, err.message, err.status, { usage });
  }
}
