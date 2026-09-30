// Calls the site's own /api/ai/* functions. The API key never reaches the browser.
import { accessToken, authEnabled } from "./auth.mjs";
import { CFG } from "./ui.mjs";

const listeners = new Set();
let lastUsage = null;
export const onUsage = fn => { listeners.add(fn); if (lastUsage) fn(lastUsage); return () => listeners.delete(fn); };
function setUsage(u) { if (!u) return; lastUsage = u; listeners.forEach(f => f(u)); }

export const aiNeedsLogin = () => CFG.aiRequireLogin !== false;
// AI is usable when it's switched on, and sign-in exists whenever it's required.
export const aiAvailable = () => CFG.aiEnabled !== false && (!aiNeedsLogin() || authEnabled);

const MESSAGES = {
  auth: "Please sign in to use AI features. It's free.",
  limit: "You've used all your free AI actions for today. They reset at midnight (UTC).",
  busy: "The AI is very busy right now. Please try again in a minute.",
  too_large: "This resume is too long to process at once. Try a shorter file or paste the text.",
  bad_input: "Something in the request was not valid. Please check and try again.",
  not_configured: "AI is not switched on for this website yet.",
  budget: "Today's free AI capacity is used up. Please try again tomorrow.",
  network: "Couldn't reach the server. Check your internet connection and try again.",
  server: "Something went wrong on our side. Please try again."
};
export const aiMessage = code => MESSAGES[code] || MESSAGES.server;

export async function callAI(action, payload, { signal } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = await accessToken();
  if (token) headers.Authorization = "Bearer " + token;
  else if (aiNeedsLogin()) throw { code: "auth", message: MESSAGES.auth };
  let res;
  try {
    res = await fetch("/api/ai/" + action, { method: "POST", headers, body: JSON.stringify(payload), signal });
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
  const token = await accessToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/ai/usage", { headers: { Authorization: "Bearer " + token } });
    const j = await res.json();
    if (j?.usage) setUsage(j.usage);
    return j?.usage || null;
  } catch { return null; }
}
