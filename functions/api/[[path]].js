// Cloudflare Pages Function: every /api/* request goes to server/router.mjs.
// Bindings used (Pages → Settings → Bindings): AI = Workers AI, DB = D1 database.
import { route } from "../../server/router.mjs";

export async function onRequest(context) {
  return route(context.request, context.env);
}
