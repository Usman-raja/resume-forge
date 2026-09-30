import { $ } from "./ui.mjs";
import { authEnabled, getUser, signInWithGoogle } from "./auth.mjs";

const q = new URLSearchParams(location.search);
const raw = q.get("next") || "/dashboard/";
const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard/";
const msg = (text, cls = "") => { const m = $("#msg"); m.textContent = text; m.className = "notice " + cls; m.hidden = !text; };

const ERRORS = {
  cancelled: "Google sign-in was cancelled. Try again whenever you're ready.",
  state: "That sign-in took too long or was opened in another tab. Please try again.",
  google: "Google didn't confirm the sign-in. Please try again.",
  token: "Google didn't confirm the sign-in. Please try again.",
  setup: "Sign-in isn't fully set up on this site yet."
};
if (q.get("error")) msg(ERRORS[q.get("error")] || "Sign-in failed. Please try again.", "err");

if (!authEnabled) {
  msg("Sign-in isn't set up on this site yet. You can still build and download resumes without an account.", "warn");
  $("#gBtn").disabled = true;
} else {
  getUser().then(u => { if (u) location.replace(next); });
  $("#gBtn").onclick = () => { $("#gBtn").disabled = true; signInWithGoogle(next); };
}
