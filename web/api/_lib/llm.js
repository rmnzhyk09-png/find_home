/**
 * Клиент OpenRouter (замена Яндекс.GPT).
 * Env: OPENROUTER_API_KEY (обязателен), OPENROUTER_MODEL (по умолчанию openai/gpt-4o-mini).
 * Если ключа нет — функции возвращают null, вызывающий код падает на regex-фоллбэк.
 */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function llmEnabled() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function llmModel() {
  return process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
}

async function chatComplete(messages, { maxTokens = 500, temperature = 0.4 } = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-zastroichik.vercel.app",
        "X-Title": "AI Zastroichik",
      },
      body: JSON.stringify({
        model: llmModel(),
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });
    if (!r.ok) throw new Error(`OpenRouter HTTP ${r.status}`);
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } finally {
    clearTimeout(t);
  }
}

module.exports = { llmEnabled, llmModel, chatComplete };
