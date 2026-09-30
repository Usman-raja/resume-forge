// Cloudflare Pages Function: /api/ai/:action
import { handleAI } from "../../../server/handler.mjs";

export async function onRequest(context) {
  return handleAI(context.request, context.env, context.params.action);
}
