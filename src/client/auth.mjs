// Sign-in with Google, handled entirely by this site's own /api/auth/* functions.
// No third-party auth library: a secure, HttpOnly session cookie is set after Google login.
import { CFG } from "./ui.mjs";

export const authEnabled = !!CFG.authEnabled;
let meP = null;
const listeners = new Set();

export function getUser(force = false) {
  if (!authEnabled) return Promise.resolve(null);
  if (!meP || force) {
    meP = fetch("/api/auth/me", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => j?.user || null)
      .catch(() => null);
  }
  return meP;
}
export function onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb); }
const emit = u => listeners.forEach(f => { try { f(u); } catch {} });

// Sends the browser to Google; it comes back to `next` already signed in.
export async function signInWithGoogle(next) {
  if (!authEnabled) throw new Error("Sign-in isn't set up on this site yet.");
  const n = encodeURIComponent(next || location.pathname + location.search);
  location.href = CFG.devLogin ? "/api/dev-login?next=" + n : "/api/auth/google?next=" + n;
}
export async function signOut() {
  try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
  meP = Promise.resolve(null);
  emit(null);
}
export function displayName(u) { return u?.name || (u?.email || "").split("@")[0] || "You"; }
export function avatarUrl(u) { return u?.picture || ""; }
export function goSignIn(next) {
  location.href = "/login/?next=" + encodeURIComponent(next || location.pathname + location.search);
}
