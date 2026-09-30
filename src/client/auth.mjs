// Supabase auth (Google + email magic link). Loaded lazily from the CDN only
// when the site is configured with a Supabase project.
import { CFG } from "./ui.mjs";

export const authEnabled = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
let clientP = null;

export function supabase() {
  if (!authEnabled) return Promise.resolve(null);
  if (!clientP) {
    clientP = import(SUPABASE_ESM)
      .then(m => m.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      }))
      .catch(err => { console.error("Supabase failed to load", err); clientP = null; return null; });
  }
  return clientP;
}

export async function getSession() {
  const sb = await supabase();
  if (!sb) return null;
  try { const { data } = await sb.auth.getSession(); return data.session || null; } catch { return null; }
}
export async function getUser() { return (await getSession())?.user || null; }
export async function accessToken() { return (await getSession())?.access_token || null; }

export async function onAuthChange(cb) {
  const sb = await supabase();
  if (!sb) return;
  sb.auth.onAuthStateChange((_event, session) => cb(session?.user || null, session));
}

function rememberNext(next) {
  try { localStorage.setItem("rf:next", next || location.pathname + location.search); } catch {}
}
export function takeNext() {
  let n = "/dashboard/";
  try { n = localStorage.getItem("rf:next") || n; localStorage.removeItem("rf:next"); } catch {}
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard/";
}

export async function signInWithGoogle(next) {
  const sb = await supabase();
  if (!sb) throw new Error("Sign-in is not set up on this site yet.");
  rememberNext(next);
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.origin + "/auth/callback/", queryParams: { prompt: "select_account" } }
  });
  if (error) throw error;
}

export async function signInWithEmail(email, next) {
  const sb = await supabase();
  if (!sb) throw new Error("Sign-in is not set up on this site yet.");
  rememberNext(next);
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/auth/callback/" } });
  if (error) throw error;
}

export async function signOut() {
  const sb = await supabase();
  if (sb) await sb.auth.signOut();
}

export function displayName(user) {
  const m = user?.user_metadata || {};
  return m.full_name || m.name || (user?.email || "").split("@")[0] || "You";
}
export function avatarUrl(user) {
  const m = user?.user_metadata || {};
  return m.avatar_url || m.picture || "";
}

// Sends the visitor to the sign-in page and brings them back here afterwards.
export function goSignIn(next) {
  rememberNext(next || location.pathname + location.search);
  location.href = "/login/";
}
