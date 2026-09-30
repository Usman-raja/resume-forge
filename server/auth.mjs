// "Continue with Google" without any library or third-party auth service.
// Standard OAuth 2.0 authorization-code flow; sessions live in Cloudflare D1.
import { json, fail, getCookie, cookie, randomToken, sha256hex, nowISO, safeNext, ApiError } from "./http.mjs";

const SESSION = "rf_session";
const STATE = "rf_oauth";
const SESSION_DAYS = 30;

const isHttps = request => new URL(request.url).protocol === "https:";

export async function currentUser(request, env) {
  if (!env.DB) return null;
  const token = getCookie(request, SESSION);
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT u.id, u.email, u.name, u.picture FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?"
  ).bind(await sha256hex(token), Date.now()).first();
  return row || null;
}

export async function requireUser(request, env) {
  const u = await currentUser(request, env);
  if (!u) throw new ApiError("auth", "Please sign in first.", 401);
  return u;
}

// Used by the Google callback (and the local dev server's test login).
export async function createSession(env, { id, email, name, picture }, secure = true) {
  const now = nowISO();
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, picture, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, last_login = excluded.last_login"
  ).bind(id, email || "", name || "", picture || "", now, now).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(id, Date.now()).run();
  const token = randomToken(32);
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256hex(token), id, Date.now() + SESSION_DAYS * 86400000, now).run();
  return cookie(SESSION, token, { maxAge: SESSION_DAYS * 86400, secure });
}

function decodeJwtPayload(jwt) {
  const part = String(jwt || "").split(".")[1];
  if (!part) return null;
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((part.length + 3) % 4);
  try { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)))); } catch { return null; }
}

export async function handleAuth(request, env, action) {
  const url = new URL(request.url);
  const redirectUri = url.origin + "/api/auth/callback";
  const secure = isHttps(request);

  if (action === "me") {
    const user = await currentUser(request, env);
    return json({ user, enabled: !!(env.GOOGLE_CLIENT_ID && env.DB) });
  }

  if (action === "google") {
    if (!env.GOOGLE_CLIENT_ID || !env.DB) return Response.redirect(url.origin + "/login/?error=setup", 302);
    const state = randomToken(24);
    const next = safeNext(url.searchParams.get("next"));
    const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    google.search = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: "code",
      scope: "openid email profile", state, prompt: "select_account", access_type: "online"
    }).toString();
    return new Response(null, {
      status: 302,
      headers: { location: google.toString(), "set-cookie": cookie(STATE, state + "|" + next, { maxAge: 600, path: "/api/auth", secure }), "cache-control": "no-store" }
    });
  }

  if (action === "callback") {
    const back = (err) => Response.redirect(url.origin + "/login/?error=" + err, 302);
    const saved = getCookie(request, STATE) || "";
    const [state, next] = [saved.slice(0, saved.indexOf("|")), saved.slice(saved.indexOf("|") + 1)];
    if (url.searchParams.get("error")) return back("cancelled");
    if (!state || state !== url.searchParams.get("state")) return back("state");
    const code = url.searchParams.get("code");
    if (!code || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return back("setup");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" })
    });
    const tok = await res.json().catch(() => null);
    if (!res.ok || !tok?.id_token) { console.error("google token", res.status, tok); return back("google"); }
    // The ID token came straight from Google over TLS, so checking its claims is enough (OpenID Connect §3.1.3.7).
    const c = decodeJwtPayload(tok.id_token);
    const okIss = c && (c.iss === "https://accounts.google.com" || c.iss === "accounts.google.com");
    if (!okIss || c.aud !== env.GOOGLE_CLIENT_ID || !c.sub || (c.exp || 0) * 1000 < Date.now() || c.email_verified === false) return back("token");

    const sessionCookie = await createSession(env, { id: "g:" + c.sub, email: c.email, name: c.name || c.given_name, picture: c.picture }, secure);
    const h = new Headers({ location: url.origin + safeNext(next), "cache-control": "no-store" });
    h.append("set-cookie", sessionCookie);
    h.append("set-cookie", cookie(STATE, "", { maxAge: 0, path: "/api/auth", secure }));
    return new Response(null, { status: 302, headers: h });
  }

  if (action === "logout") {
    if (request.method !== "POST") return fail("bad_input", "Use POST.", 405);
    const token = getCookie(request, SESSION);
    if (token && env.DB) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256hex(token)).run();
    return json({ ok: true }, 200, { "set-cookie": cookie(SESSION, "", { maxAge: 0, secure }) });
  }

  return fail("not_found", "Not found.", 404);
}
