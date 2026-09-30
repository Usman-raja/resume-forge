// Calls the site's own /api/ai/* functions (Cloudflare Workers AI — no API key in the browser).
// Small one-line rewrites first try the browser's built-in AI (Chrome's on-device
// model) when it is available: free, private and it doesn't use any credits.
import { authEnabled } from "./auth.mjs";
import { CFG } from "./ui.mjs";

const listeners = new Set();
let lastUsage = null;
export const onUsage = fn => { listeners.add(fn); if (lastUsage) fn(lastUsage); return () => listeners.delete(fn); };
function setUsage(u) { if (!u) return; lastUsage = u; listeners.forEach(f => f(u)); }

export const aiNeedsLogin = () => CFG.aiRequireLogin === true;
export const aiAvailable = () => CFG.aiEnabled !== false && (!aiNeedsLogin() || authEnabled);

const MESSAGES = {
  auth: "Please sign in to use AI features. It's free.",
  limit: "You've used all your free AI credits for today. They reset at midnight (UTC).",
  guest_limit: "You've used today's free guest credits. Sign in with Google for more — it's free.",
  busy: "The AI is very busy right now. Please try again in a minute.",
  budget: "Today's free AI capacity is used up. Please try again tomorrow — everything else still works.",
  too_large: "This resume is too long to process at once. Try a shorter file or paste the text.",
  image: "We couldn't read this picture. Please upload a PDF or Word file, or paste the text.",
  bad_input: "Something in the request was not valid. Please check and try again.",
  not_configured: "AI is not switched on for this website yet.",
  network: "Couldn't reach the server. Check your internet connection and try again.",
  server: "Something went wrong on our side. Please try again."
};
export const aiMessage = code => MESSAGES[code] || MESSAGES.server;

/* ---------------- on-device AI (Chrome built-in model), best effort ---------------- */
const DEVICE_SYSTEM = "You are a professional resume writer. Never invent facts, numbers, employers or tools. Reply only with JSON.";
function devicePrompt(p) {
  if (p.kind === "bullet") {
    const who = [p.context?.role && `Job title: ${p.context.role}`, p.context?.company && `Company: ${p.context.company}`].filter(Boolean).join("\n");
    return String(p.text || "").trim()
      ? `Rewrite this resume bullet point in 3 different, stronger versions. Start each with a strong action verb, 12–26 words, keep every fact and number, add nothing new. Professional English.\n${who}\nBullet: ${String(p.text).slice(0, 600)}\nReply as {"options":["","",""]}`
      : `Write 3 example resume bullet points for this job, each starting with an action verb. Use [number] where a number would go; invent no facts.\n${who}\nReply as {"options":["","",""]}`;
  }
  return null; // summaries and skills need the whole resume → server
}
async function onDevice(payload) {
  try {
    const LM = globalThis.LanguageModel;
    const prompt = devicePrompt(payload);
    if (!prompt || !LM?.availability || !LM?.create) return null;
    if ((await LM.availability()) !== "available") return null; // never trigger a big model download
    const session = await LM.create({ initialPrompts: [{ role: "system", content: DEVICE_SYSTEM }] });
    try {
      const text = await session.prompt(prompt, { responseConstraint: { type: "object", properties: { options: { type: "array", items: { type: "string" } } }, required: ["options"] } });
      const j = JSON.parse(text);
      const options = (j.options || []).map(s => String(s).trim()).filter(Boolean);
      return options.length >= 2 ? { result: { options }, onDevice: true } : null;
    } finally { session.destroy?.(); }
  } catch { return null; }
}

export async function callAI(action, payload, { signal } = {}) {
  if (action === "rewrite" && !signal?.aborted) {
    const local = await onDevice(payload);
    if (local) return local;
  }
  let res;
  try {
    res = await fetch("/api/ai/" + action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal });
  } catch (e) {
    if (e?.name === "AbortError") throw { code: "cancelled", message: "" };
    throw { code: "network", message: MESSAGES.network };
  }
  let j = null;
  try { j = await res.json(); } catch {}
  if (j?.usage) setUsage(j.usage);
  if (!res.ok || !j || j.error) {
    const code = j?.error?.code || (res.status === 401 ? "auth" : res.status === 429 ? "limit" : "server");
    throw { code, message: j?.error?.message || aiMessage(code) };
  }
  return j;
}

export async function refreshUsage() {
  try {
    const res = await fetch("/api/ai/usage", { cache: "no-store" });
    const j = await res.json();
    if (j?.usage) setUsage(j.usage);
    return j?.usage || null;
  } catch { return null; }
}
