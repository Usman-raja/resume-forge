import { $, toast } from "./ui.mjs";
import { authEnabled, getUser, signInWithGoogle, signInWithEmail } from "./auth.mjs";

const peekNext = () => { try { return localStorage.getItem("rf:next") || "/dashboard/"; } catch { return "/dashboard/"; } };
const msg = (text, cls = "") => { const m = $("#msg"); m.textContent = text; m.className = "notice " + cls; m.hidden = !text; };

if (!authEnabled) {
  msg("Sign-in isn't set up on this site yet. You can still build and download resumes without an account.", "warn");
  $("#gBtn").disabled = true; $("#emailForm button").disabled = true;
} else {
  getUser().then(u => { if (u) location.replace(peekNext()); });
  $("#gBtn").onclick = async () => {
    $("#gBtn").disabled = true;
    try { await signInWithGoogle(peekNext()); }
    catch (e) { $("#gBtn").disabled = false; msg(e.message || "Google sign-in failed. Please try again.", "err"); }
  };
  $("#emailForm").onsubmit = async e => {
    e.preventDefault();
    const email = $("#email").value.trim();
    if (!email) return;
    const b = $("#emailForm button"); b.disabled = true;
    try { await signInWithEmail(email, peekNext()); msg(`Check your inbox — we sent a sign-in link to ${email}. It can take a minute; check spam too.`); }
    catch (err) { msg(err.message || "Couldn't send the email. Please try again.", "err"); }
    finally { b.disabled = false; }
  };
}
if (new URLSearchParams(location.search).get("error")) toast("Sign-in was cancelled or failed. Please try again.");
