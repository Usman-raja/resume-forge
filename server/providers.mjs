// Model providers. Pure fetch — works in Cloudflare Workers and Node 18+.

export class AIError extends Error {
  constructor(code, message, status = 500) { super(message); this.code = code; this.status = status; }
}

function providerError(status, body) {
  if (status === 429 || status === 529 || status === 503) return new AIError("busy", "The AI is busy right now. Please try again in a minute.", 503);
  if (status === 401 || status === 403) return new AIError("not_configured", "The AI key on the server is missing or invalid.", 503);
  if (status === 400 || status === 413) {
    if (/too long|too large|maximum|context/i.test(body)) return new AIError("too_large", "This resume is too long to process at once.", 413);
    return new AIError("bad_input", "The AI could not process this input.", 400);
  }
  return new AIError("server", "The AI service had a problem. Please try again.", 502);
}

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
  if (!res.ok) { console.error("anthropic", res.status, body.slice(0, 500)); throw providerError(res.status, body); }
  const j = JSON.parse(body);
  return {
    text: (j.content || []).filter(c => c.type === "text").map(c => c.text).join(""),
    truncated: j.stop_reason === "max_tokens",
    usage: { input: j.usage?.input_tokens || 0, output: j.usage?.output_tokens || 0 }
  };
}

async function gemini({ key, model, system, prompt, images, maxTokens, temperature }) {
  const parts = [{ text: prompt }, ...images.map(im => ({ inlineData: { mimeType: im.media_type, data: im.data } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: "application/json" }
    })
  });
  const body = await res.text();
  if (!res.ok) { console.error("gemini", res.status, body.slice(0, 500)); throw providerError(res.status, body); }
  const j = JSON.parse(body);
  const cand = j.candidates?.[0];
  if (!cand) throw new AIError("bad_input", "The AI declined to process this input.", 400);
  return {
    text: (cand.content?.parts || []).map(p => p.text || "").join(""),
    truncated: cand.finishReason === "MAX_TOKENS",
    usage: { input: j.usageMetadata?.promptTokenCount || 0, output: j.usageMetadata?.candidatesTokenCount || 0 }
  };
}

export const DEFAULT_MODELS = { anthropic: "claude-haiku-4-5-20251001", gemini: "gemini-2.5-flash" };

export async function complete(cfg, { system, prompt, images = [], maxTokens = 4000, temperature = 0.4, heavy = false }) {
  const model = (heavy && cfg.modelHeavy) || cfg.model || DEFAULT_MODELS[cfg.provider];
  const fn = cfg.provider === "gemini" ? gemini : anthropic;
  const key = cfg.provider === "gemini" ? cfg.geminiKey : cfg.anthropicKey;
  if (!key) throw new AIError("not_configured", "AI is not configured on this server.", 503);
  // Gemini 2.5 models spend output tokens on thinking; give them room.
  const max = cfg.provider === "gemini" ? Math.max(maxTokens * 2, 8192) : maxTokens;
  return fn({ key, model, system, prompt, images, maxTokens: max, temperature });
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
