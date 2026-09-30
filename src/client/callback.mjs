import { $ } from "./ui.mjs";
import { supabase, takeNext } from "./auth.mjs";

(async () => {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.slice(1));
  const err = q.get("error_description") || h.get("error_description");
  if (err) { $("#msg").textContent = "Sign-in failed: " + err; setTimeout(() => location.replace("/login/?error=1"), 2500); return; }
  const sb = await supabase();
  if (!sb) { location.replace("/"); return; }
  // supabase-js exchanges the ?code= automatically when it starts (detectSessionInUrl).
  let { data } = await sb.auth.getSession();
  if (!data.session && q.get("code")) {
    try { await sb.auth.exchangeCodeForSession(q.get("code")); ({ data } = await sb.auth.getSession()); } catch {}
  }
  if (data.session) location.replace(takeNext());
  else { $("#msg").textContent = "That sign-in link has expired or was already used. Please try again."; setTimeout(() => location.replace("/login/?error=1"), 2500); }
})();
