// AI model providers.
//  • "workers-ai" (default): Cloudflare's built-in AI. No API key, no extra account —
//    just an "AI" binding on the Pages project. Runs open-source models.
//  • "anthropic" / "gemini": optional paid upgrades (need an API key).
import { ApiError } from "./http.mjs";
export { ApiError as AIError };

// Mistral Small 3.1 24B: Apache-2.0 licence, 128k context, understands images.
export const DEFAULT_MODELS = {
  "workers-ai": "@cf/mistralai/mistral-small-3.1-24b-instruct",
  anthropic: "claude-haiku-4-5-20251001",
  gemini: "gemini-2.5-flash"
};

function httpError(status, body) {
  if (status === 429 || status === 529 || status === 503) return new ApiError("busy", "The AI is busy right now. Please try again in a minute.", 503);
  if (status === 401 || status === 403) return new ApiError("not_configured", "The AI key on the server is missing or invalid.", 503);
  if (status === 400 || status === 413) {
    if (/too long|too large|maximum|context/i.test(body)) return new ApiError("too_large", "This resume is too long to process at once.", 413);
    return new ApiError("bad_input", "The AI could not process this input.", 400);
  }
  return new ApiError("server", "The AI service had a problem. Please try again.", 502);
}

/* ---------------- Cloudflare Workers AI (binding) ---------------- */
function workersAIError(e) {
  const m = String(e?.message || e || "");
  console.error("workers-ai", m.slice(0, 400));
  if (/3036|neuron|daily free allocation|allocation/i.test(m)) return new ApiError("budget", "Today's free AI capacity is used up. Please try again tomorrow — everything else on the site still works.", 429);
  if (/3040|capacity|too many|rate limit|429|overloaded/i.test(m)) return new ApiError("busy", "The AI is busy right now. Please try again in a minute.", 503);
  if (/context|too long|input.*length|5021|exceeds/i.test(m)) return new ApiError("too_large", "This resume is too long to process at once.", 413);
  if (/image|vision|multimodal/i.test(m)) return new ApiError("image", "We couldn't read this picture. Please upload a PDF or Word file, or paste the text.", 400);
  return new ApiError("server", "The AI had a problem. Please try again.", 502);
}
// Different Workers AI models answer in different shapes; accept all of them.
export function extractText(o) {
  if (o == null) return "";
  if (typeof o === "string") return o;
  if (typeof o.response === "string") return o.response;
  if (o.response && typeof o.response === "object") return JSON.stringify(o.response);
  const c = o.choices?.[0]?.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map(p => p.text || "").join("");
  if (typeof o.output_text === "string") return o.output_text;
  if (Array.isArray(o.output)) {
    return o.output.filter(i => i && (i.type === "message" || i.role === "assistant"))
      .flatMap(i => (Array.isArray(i.content) ? i.content : [i.content]))
      .map(p => (typeof p === "string" ? p : p?.text || "")).join("");
  }
  if (o.result) return extractText(o.result);
  return "";
}
async function workersAI({ ai, model, system, prompt, images, maxTokens, temperature }) {
  if (!ai || typeof ai.run !== "function") throw new ApiError("not_configured", "AI is not switched on for this website yet.", 503);
  const content = images.length
    ? [{ type: "text", text: prompt }, ...images.map(im => ({ type: "image_url", image_url: { url: `data:${im.media_type};base64,${im.data}` } }))]
    : prompt;
  const input = max => ({ messages: [{ role: "system", content: system }, { role: "user", content }], max_tokens: max, temperature });
  let out;
  try { out = await ai.run(model, input(maxTokens)); }
  catch (e) {
    // Some models cap max_tokens lower; retry once with a safe value.
    if (/max_tokens|maximum.*tokens/i.test(String(e?.message)) && maxTokens > 4096) {
      try { out = await ai.run(model, input(4096)); } catch (e2) { throw workersAIError(e2); }
    } else throw workersAIError(e);
  }
  const used = out?.usage?.completion_tokens || 0;
  return { text: extractText(out), truncated: used > 0 && used >= maxTokens - 8, usage: { input: out?.usage?.prompt_tokens || 0, output: used } };
}

/* ---------------- optional paid providers ---------------- */
async function anthropic({ key, model, system, prompt, images, maxTokens, temperature }) {
  const content = [
    ...images.map(im => ({ type: "image", source: { type: "base64", media_type: im.media_type, data: im.data } })),
    { type: "text", text: prompt }
  ];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature, system, messages: [{ role: "user", content }] })
  });
  const body = await res.text();
  if (!res.ok) { console.error("anthropic", res.status, body.slice(0, 500)); throw httpError(res.status, body); }
  const j = JSON.parse(body);
  return { text: (j.content || []).filter(c => c.type === "text").map(c => c.text).join(""), truncated: j.stop_reason === "max_tokens", usage: {} };
}
async function gemini({ key, model, system, prompt, images, maxTokens, temperature }) {
  const parts = [{ text: prompt }, ...images.map(im => ({ inlineData: { mimeType: im.media_type, data: im.data } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts }], generationConfig: { temperature, maxOutputTokens: Math.max(maxTokens * 2, 8192), responseMimeType: "application/json" } })
  });
  const body = await res.text();
  if (!res.ok) { console.error("gemini", res.status, body.slice(0, 500)); throw httpError(res.status, body); }
  const cand = JSON.parse(body).candidates?.[0];
  if (!cand) throw new ApiError("bad_input", "The AI declined to process this input.", 400);
  return { text: (cand.content?.parts || []).map(p => p.text || "").join(""), truncated: cand.finishReason === "MAX_TOKENS", usage: {} };
}

export async function complete(cfg, { system, prompt, images = [], maxTokens = 4000, temperature = 0.4, heavy = false }) {
  const model = (heavy && cfg.modelHeavy) || cfg.model || DEFAULT_MODELS[cfg.provider];
  if (cfg.provider === "anthropic") {
    if (!cfg.anthropicKey) throw new ApiError("not_configured", "AI is not configured on this server.", 503);
    return anthropic({ key: cfg.anthropicKey, model, system, prompt, images, maxTokens, temperature });
  }
  if (cfg.provider === "gemini") {
    if (!cfg.geminiKey) throw new ApiError("not_configured", "AI is not configured on this server.", 503);
    return gemini({ key: cfg.geminiKey, model, system, prompt, images, maxTokens, temperature });
  }
  return workersAI({ ai: cfg.ai, model, system, prompt, images, maxTokens, temperature });
}

// Tolerant JSON extraction: whole text, fenced block, or first { … last }.
export function parseJSON(text) {
  const t = String(text || "").trim();
  const tries = [t];
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) tries.push(fence[1]);
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) tries.push(t.slice(a, b + 1));
  for (const s of tries) { try { return JSON.parse(s); } catch {} }
  return null;
}
