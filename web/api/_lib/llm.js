/**
 * Клиент OpenRouter (замена Яндекс.GPT). Используются ТОЛЬКО бесплатные модели.
 * Env: OPENROUTER_API_KEY (обязателен), OPENROUTER_MODEL (по умолчанию бесплатная NVIDIA Nemotron).
 * Заголовок OpenRouter billing: без кредитов — 429; ключ для бесплатных моделей ок.
 * Если ключа нет — функции возвращают null, вызывающий код падает на regex-фоллбэк.
 */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Только бесплатные модели (:free) — подобрать и проверить можно через /api/v1/models
const FALLBACK_MODELS = [
  "nvidia/nemotron-3.5-super-vl:free",   // основная: соображает, отдаёт JSON в content
  "nvidia/nemotron-3-ultra-550b-a55b:free", // крупная, но многословная
  "openrouter/free",                    // анти-фоллбэк роутер по свободным
];

function llmEnabled() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function llmModel() {
  return process.env.OPENROUTER_MODEL || FALLBACK_MODELS[0];
}

// content только (не «мысли» reasoning — они не для пользователя)
function extractContent(ch) {
  const msg = ch?.message || {};
  return (msg.content && msg.content.trim()) || "";
}
// fallback для экстракции JSON из reasoning
function extractJSON(ch) {
  const msg = ch?.message || {};
  return (msg.content && msg.content.trim()) || (msg.reasoning && msg.reasoning.trim()) || "";
}

async function chatComplete(messages, { maxTokens = 900, temperature = 0.4, models: preferred } = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const models = [...(preferred || []), llmModel(), ...FALLBACK_MODELS].filter(
    (m, i, arr) => m && arr.indexOf(m) === i
  );
  let lastErr = null;
  for (const model of models) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
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
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        // у reasoning-моделей не платить токены за «мысли» в ответе
        reasoning: { exclude: true },
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} (${model})`);
      const data = await r.json();
            const text = extractContent(data?.choices?.[0]);
      if (text) return text;
      throw new Error(`пустой ответ (${model})`);
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  if (lastErr) console.error("[llm] все модели упали:", lastErr.message);
  return null;
}

module.exports = { llmEnabled, llmModel, chatComplete, extractJSON };
