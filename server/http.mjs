// Tiny HTTP helpers shared by all /api routes. Web-standard only (Workers + Node 18+).

export class ApiError extends Error {
  constructor(code, message, status = 500) { super(message); this.code = code; this.status = status; }
}

export const json = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
});
export const fail = (code, message, status = 400, extra = {}) => json({ error: { code, message }, ...extra }, status);

export async function readJSON(request, maxBytes = 1_000_000) {
  const len = +(request.headers.get("content-length") || 0);
  if (len > maxBytes) throw new ApiError("too_large", "This request is too large.", 413);
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiError("too_large", "This request is too large.", 413);
  try { return text ? JSON.parse(text) : {}; } catch { throw new ApiError("bad_input", "Invalid request.", 400); }
}

export function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}
export function cookie(name, value, { maxAge, path = "/", secure = true, httpOnly = true } = {}) {
  return [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, "SameSite=Lax", httpOnly && "HttpOnly", secure && "Secure", maxAge != null && `Max-Age=${maxAge}`].filter(Boolean).join("; ");
}

export function randomToken(bytes = 32) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function sha256hex(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export const nowISO = () => new Date().toISOString();
export const todayUTC = () => new Date().toISOString().slice(0, 10);

// Only allow redirects back into this site.
export const safeNext = n => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n.slice(0, 500) : "/dashboard/");
