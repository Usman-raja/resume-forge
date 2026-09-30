// Saved resumes (Cloudflare D1). Each user sees only their own rows.
import { json, fail, readJSON, nowISO, ApiError } from "./http.mjs";
import { requireUser } from "./auth.mjs";

const MAX_PER_USER = 50;
const MAX_BYTES = 700_000;
const COLS = "id, title, data, settings, is_public, updated_at";

const parse = s => { try { return JSON.parse(s || "{}"); } catch { return {}; } };
const out = r => r && ({ id: r.id, title: r.title, data: parse(r.data), settings: parse(r.settings), is_public: !!r.is_public, updated_at: r.updated_at });
const isId = id => /^[0-9a-f-]{36}$/i.test(id || "");

function clean(body, partial) {
  const o = {};
  if (!partial || "title" in body) o.title = String(body.title || "My resume").slice(0, 200);
  if (!partial || "data" in body) { if (body.data != null && typeof body.data !== "object") throw new ApiError("bad_input", "Invalid resume.", 400); o.data = JSON.stringify(body.data || {}); }
  if (!partial || "settings" in body) o.settings = JSON.stringify(body.settings && typeof body.settings === "object" ? body.settings : {});
  if ("is_public" in body) o.is_public = body.is_public ? 1 : 0;
  if ((o.data?.length || 0) + (o.settings?.length || 0) > MAX_BYTES) throw new ApiError("too_large", "This resume is too large to save (try a smaller photo).", 413);
  return o;
}

export async function handleResumes(request, env, id) {
  if (!env.DB) return fail("not_configured", "Cloud saving isn't set up on this site.", 503);
  const user = await requireUser(request, env);
  const m = request.method;

  if (!id) {
    if (m === "GET") {
      const { results } = await env.DB.prepare(`SELECT ${COLS} FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(user.id).all();
      return json({ resumes: results.map(out) });
    }
    if (m === "POST") {
      const b = clean(await readJSON(request, MAX_BYTES + 50_000), false);
      const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM resumes WHERE user_id = ?").bind(user.id).first("n");
      if (n >= MAX_PER_USER) return fail("limit", `You can keep up to ${MAX_PER_USER} resumes. Delete an old one first.`, 409);
      const newId = crypto.randomUUID(), now = nowISO();
      await env.DB.prepare("INSERT INTO resumes (id, user_id, title, data, settings, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)")
        .bind(newId, user.id, b.title, b.data, b.settings, now, now).run();
      return json({ id: newId, updated_at: now }, 201);
    }
    return fail("bad_input", "Method not allowed.", 405);
  }

  if (!isId(id)) return fail("not_found", "Resume not found.", 404);
  if (m === "GET") {
    const r = await env.DB.prepare(`SELECT ${COLS} FROM resumes WHERE id = ? AND user_id = ?`).bind(id, user.id).first();
    return r ? json({ resume: out(r) }) : fail("not_found", "Resume not found.", 404);
  }
  if (m === "PUT" || m === "PATCH") {
    const b = clean(await readJSON(request, MAX_BYTES + 50_000), true);
    const keys = Object.keys(b);
    if (!keys.length) return fail("bad_input", "Nothing to update.", 400);
    const now = nowISO();
    const res = await env.DB.prepare(`UPDATE resumes SET ${keys.map(k => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ? AND user_id = ?`)
      .bind(...keys.map(k => b[k]), now, id, user.id).run();
    return res.meta?.changes ? json({ updated_at: now }) : fail("not_found", "Resume not found.", 404);
  }
  if (m === "DELETE") {
    await env.DB.prepare("DELETE FROM resumes WHERE id = ? AND user_id = ?").bind(id, user.id).run();
    return json({ ok: true });
  }
  return fail("bad_input", "Method not allowed.", 405);
}

// Share links: anyone with the exact id can view a resume its owner made public.
export async function handlePublic(request, env, id) {
  if (!env.DB) return fail("not_configured", "Sharing isn't set up on this site.", 503);
  if (!isId(id)) return fail("not_found", "Not found.", 404);
  const r = await env.DB.prepare(`SELECT ${COLS} FROM resumes WHERE id = ? AND is_public = 1`).bind(id).first();
  return r ? json({ resume: out(r) }, 200, { "cache-control": "public, max-age=60" }) : fail("not_found", "This resume is private or doesn't exist.", 404);
}
