// Where resumes live: the browser (guests) or this site's /api/resumes (signed-in users).

const LOCAL_KEY = "rf:draft:v2";

export function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; }
}
export function saveLocal(doc) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(doc)); return true; } catch { return false; }
}
export function clearLocal() { try { localStorage.removeItem(LOCAL_KEY); } catch {} }
// On sign-out, don't leave a copy of an account resume on a shared computer.
export function clearLocalIfCloud() { const d = loadLocal(); if (d?.cloudId) clearLocal(); }

async function api(path, { method = "GET", body } = {}) {
  let res;
  const payload = body ? JSON.stringify(body) : undefined;
  try {
    // keepalive lets a save finish even if the tab is closing (browsers allow it for small bodies only).
    res = await fetch(path, { method, cache: "no-store", headers: body ? { "content-type": "application/json" } : {}, body: payload, keepalive: !!payload && payload.length < 60000 });
  } catch { throw Object.assign(new Error("Couldn't reach the server. Check your internet connection."), { status: 0 }); }
  let j = null;
  try { j = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(j?.error?.message || "Something went wrong. Please try again."), { status: res.status, code: j?.error?.code });
  return j;
}

export async function listResumes() { return (await api("/api/resumes")).resumes || []; }
export async function getResume(id) {
  try { return (await api("/api/resumes/" + encodeURIComponent(id))).resume; }
  catch (e) { if (e.status === 404) return null; throw e; }
}
export async function createResume({ title, data, settings }) { return api("/api/resumes", { method: "POST", body: { title: title || "My resume", data, settings } }); }
export async function updateResume(id, patch) { return api("/api/resumes/" + encodeURIComponent(id), { method: "PUT", body: patch }); }
export async function deleteResume(id) { return api("/api/resumes/" + encodeURIComponent(id), { method: "DELETE" }); }
export async function setPublic(id, isPublic) { return updateResume(id, { is_public: !!isPublic }); }
export async function getPublicResume(id) {
  try { return (await api("/api/public/" + encodeURIComponent(id))).resume; }
  catch (e) { if (e.status === 404) return null; throw e; }
}
