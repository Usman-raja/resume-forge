// Where resumes live: the browser (guests) or Supabase (signed-in users).
import { supabase } from "./auth.mjs";

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

async function sb() {
  const c = await supabase();
  if (!c) throw new Error("Cloud saving is not set up on this site.");
  return c;
}
const fail = error => { if (error) throw new Error(error.message || "Database error"); };

export async function listResumes() {
  const c = await sb();
  const { data, error } = await c.from("resumes").select("id,title,data,settings,is_public,updated_at").order("updated_at", { ascending: false });
  fail(error); return data || [];
}
export async function getResume(id) {
  const c = await sb();
  const { data, error } = await c.from("resumes").select("id,title,data,settings,is_public,updated_at").eq("id", id).maybeSingle();
  fail(error); return data;
}
export async function createResume({ title, data, settings }) {
  const c = await sb();
  const { data: row, error } = await c.from("resumes").insert({ title: title || "My resume", data, settings }).select("id,updated_at").single();
  fail(error); return row;
}
export async function updateResume(id, patch) {
  const c = await sb();
  const { data, error } = await c.from("resumes").update(patch).eq("id", id).select("updated_at").single();
  fail(error); return data;
}
export async function deleteResume(id) {
  const c = await sb();
  const { error } = await c.from("resumes").delete().eq("id", id);
  fail(error);
}
export async function setPublic(id, isPublic) { return updateResume(id, { is_public: !!isPublic }); }
export async function getPublicResume(id) {
  const c = await sb();
  const { data, error } = await c.rpc("get_public_resume", { p_id: id });
  fail(error);
  return Array.isArray(data) ? data[0] || null : data;
}
