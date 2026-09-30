// Single entry point for every /api/* request.
import { fail, ApiError } from "./http.mjs";
import { handleAuth } from "./auth.mjs";
import { handleResumes, handlePublic } from "./resumes.mjs";
import { handleAI } from "./handler.mjs";

export async function route(request, env = {}) {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean); // ["api", ...]
  try {
    // Block cross-site writes (cookies are SameSite=Lax too).
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) return fail("forbidden", "Request blocked.", 403);
    }
    const [, area, a, b] = parts;
    if (area === "auth") return await handleAuth(request, env, a || "");
    if (area === "resumes") return await handleResumes(request, env, a || "");
    if (area === "public") return await handlePublic(request, env, a || "");
    if (area === "ai") return await handleAI(request, env, a || "");
    return fail("not_found", "Not found.", 404);
  } catch (e) {
    if (e instanceof ApiError) return fail(e.code, e.message, e.status);
    console.error(e);
    return fail("server", "Something went wrong. Please try again.", 500);
  }
}
