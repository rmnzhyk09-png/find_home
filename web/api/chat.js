/**
 * POST /api/chat  {message, city?} -> {response, filters, items, totalCount, count, sources, fetchedAt, cached}
 * NLP-фильтры: база из бэка KvartiraPro, расширенная словарём старого web/public/js/app.js:
 *   - города и сленг (нск, мск, спб, еКБ, питер...),
 *   - «двушка/трёшка/однушка/студия»,
 *   - excludeDistrict («не в центре», «не центр»),
 *   - инфраструктурные запросы (метро, школа, парк, садик, магазины...).
 */
const {
  CITY_DB,
  cacheGet,
  cacheSet,
  fetchAllSources,
  filterResults,
  cityName,
} = require("./_lib/parser");
const { llmEnabled, llmModel, chatComplete, extractJSON } = require("./_lib/llm");

// ---------- Города: основа из CITY_DB + сленг (из legacy app.js) ----------
const CITIES = Object.entries(CITY_DB).map(([slug, v]) => [v.name.toLowerCase(), v.name, slug]);
// сленг и альтернативные написания
const CITY_SLANG = [
  ["нск", "Новосибирск", "novosibirsk"],
  ["мск", "Москва", "moscow"],
  ["питер", "Санкт-Петербург", "spb"],
  ["спб", "Санкт-Петербург", "spb"],
  ["екб", "Екатеринбург", "ekaterinburg"],
].map(([k, name, slug]) => [new RegExp("(?<![а-яё])" + k, "i"), name, slug]);

// только начало слова (ом-мск-е не должно матчить «мск» → Москва)
const findCity = (lower, candidates) =>
  candidates.find(([k]) => (k instanceof RegExp ? k.test(lower) : new RegExp("(?<![а-яё])" + k, "i").test(lower)));

const DISTRICTS = [
  ["академгородок", "Академгородок"],
  ["академ", "Академгородок"],
  ["наукоград", "Академгородок"],
  ["заельцовский", "Заельцовский"],
  ["заельцов", "Заельцовский"],
  ["ленинский", "Ленинский"],
  ["ленинск", "Ленинский"],
  ["октябрьский", "Октябрьский"],
  ["октябр", "Октябрьский"],
  ["первомайский", "Первомайский"],
  ["первомай", "Первомайский"],
  ["калининский", "Калининский"],
  ["дзержинский", "Дзержинский"],
  ["кировский", "Кировский"],
  ["центр", "Центр"],
];

const INFRA = [
  { label: "метро рядом", words: ["метро", "станция метро"] },
  { label: "парк", words: ["парк", "зелён", "сквер", "набережн"] },
  { label: "школа рядом", words: ["школ", "гимнази", "лицей"] },
  { label: "детский сад", words: ["детский сад", "садик"] },
  { label: "магазины", words: ["магазин", "торгов", "тц", "супермаркет"] },
  { label: "поликлиника", words: ["поликлин", "медиц", "клиник", "больниц"] },
  { label: "спорт", words: ["спорт", "фитнес", "тренажер", "стадион", "спорткомплекс"] },
  { label: "транспорт", words: ["транспорт", "остановк", "автобус", "трамвай", "троллейбус"] },
  { label: "вуз", words: ["университ", "институт", "вуз", "колледж", "техникум"] },
];

const hasInfra = (lower) =>
  INFRA.some((f) => f.words.some((w) => lower.includes(w)));

function parseNaturalLanguage(text) {
  const lower = (text || "").toLowerCase();
  const filters = {};

  // Комнаты (регэксп из KvartiraPro + сленг из legacy); позже — старше приоритет: 1 → 4
  if (/однуш|студи|1-?комнат/.test(lower)) filters.rooms = 1;
  if (/двушк|2-?комнат/.test(lower)) filters.rooms = 2;
  if (/тр[её]шк|тр[её]х-?комнат|3-?комнат/.test(lower)) filters.rooms = 3;
  if (/четыр[её]х|4-?комнат/.test(lower)) filters.rooms = 4;

  // Цена (KvartiraPro + «бюджет N млн» из legacy)
  const priceMatch = lower.match(
    /(?:до|макс|максимум|не\s+более|бюджет)\s*(\d+(?:[.,]\d+)?)\s*(?:млн|млн\.|миллион|тыс|тыс\.|к\b|k\b)/
  );
  if (priceMatch) {
    const val = parseFloat(priceMatch[1].replace(",", "."));
    const unit = /тыс|к\b/.test(priceMatch[0]) ? 1000 : 1000000;
    filters.maxPrice = val * unit;
  } else {
    const m = lower.match(/(\d[\d\s]*)\s*(миллион|млн)/);
    if (m) {
      const n = parseInt(m[1].replace(/\D/g, ""));
      filters.maxPrice = n <= 1000 ? n * 1000000 : n;
    }
  }
  const minPriceMatch = lower.match(
    /(?:от|мин|минимум|не\s+менее)\s*(\d+(?:[.,]\d+)?)\s*(?:млн|млн\.|миллион|тыс|тыс\.|к\b|k\b)/
  );
  if (minPriceMatch) {
    const val = parseFloat(minPriceMatch[1].replace(",", "."));
    const unit = /тыс|к\b/.test(minPriceMatch[0]) ? 1000 : 1000000;
    filters.minPrice = val * unit;
  }

  // Площадь (диапазон / от / до)
  const range = lower.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})\s*м/);
  const from = lower.match(/(?:от|не меньше|не менее)\s*(\d{2,3})\s*(?:до\s*(\d{2,3}))?\s*м2?/);
  const to = lower.match(/(?:до|не больше)\s*(\d{2,3})\s*м\s*2?/);
  if (range) {
    filters.minArea = parseFloat(range[1]);
    filters.maxArea = parseFloat(range[2]);
  } else {
    if (from) {
      filters.minArea = parseFloat(from[1]);
      if (from[2]) filters.maxArea = parseFloat(from[2]);
    }
    if (to) filters.maxArea = filters.maxArea || parseFloat(to[1]);
  }

  // Город: сленг → точное имя → корень имени (терпит падежи: «в Казани», «по Самаре»)
  const slangHit = findCity(lower, CITY_SLANG);
  if (slangHit) filters.city = slangHit[2];
  else {
    const exact = findCity(lower, CITIES);
    if (exact) filters.city = exact[2];
    else {
      const stem = CITIES.find(
        ([k]) => k.length >= 4 && new RegExp("(?<![а-яё])" + k.slice(0, k.length - 2), "i").test(lower)
      );
      if (stem) filters.city = stem[2];
      else if (/(нижн[ей]|горьк)/.test(lower)) filters.city = "nizhny-novgorod";
      else if (/ростов/.test(lower)) filters.city = "rostov-na-donu";
      else if (/краснодар/.test(lower)) filters.city = "krasnodar";
    }
  }

  // «не в центре» / «не центр» -> исключаем Центр (спальные районы)
  if (/(не\s+в\s+центре|не\s+центр|спальн)/.test(lower)) {
    filters.excludeDistrict = "Центр";
  }

  // Район (если это не «не в центре»)
  const d = DISTRICTS.find(([k]) => lower.includes(k));
  if (d && !filters.excludeDistrict) filters.district = d[1].charAt(0).toUpperCase() + d[1].slice(1);

  // Ключевые слова + инфраструктура
  const keywords = [];
  if (lower.includes("новострой") || lower.includes("жк") || lower.includes("застройщ"))
    keywords.push("новостройка");
  if (lower.includes("вторичн")) keywords.push("вторичная");
  if (lower.includes("без комисс")) keywords.push("без комиссии");
  if (lower.includes("ипотек")) keywords.push("ипотека");
  if (/(ремонт)/.test(lower)) keywords.push("ремонт");
  if (/(балкон|лоджи)/.test(lower)) keywords.push("балкон");
  if (/(гардеробн)/.test(lower)) keywords.push("гардеробная");
  if (/(тих|спокойн)/.test(lower)) keywords.push("тихо");
  if (/(инвест|под сдачу|сдавать|сдаётся)/.test(lower)) keywords.push("инвестиции");
  if (/(студент)/.test(lower)) keywords.push("студентам");
  if (hasInfra(lower)) {
    for (const f of INFRA) {
      if (f.words.some((w) => lower.includes(w))) keywords.push(f.label);
    }
  }
  if (keywords.length > 0) filters.keywords = [...new Set(keywords)];

  return filters;
}

// ---------- Фильтры через LLM (OpenRouter), regex-парсер — фоллбэк ----------
// Возвращает {filters:null} при отсутствии ключа/ошибке — тогда работает parseNaturalLanguage.
const LLM_FILTER_SCHEMA = {
  city: "slug из списка: " + Object.keys(CITY_DB).join(", ") + " | null",
  rooms: "число комнат | null",
  minPrice: "₽ | null",
  maxPrice: "₽ | null",
  minArea: "м² | null",
  maxArea: "м² | null",
  district: "название района | null",
  excludeDistrict: "что исключить | null",
  keywords: "до 5 ключевых слов из текста запроса | []",
};

async function parseNLWithLLM(message) {
  if (!llmEnabled()) return null;
  const sys =
    "Ты извлекаешь фильтры поиска квартиры из сообщения на русском. " +
    `Только JSON без пояснений, схема: ${JSON.stringify(LLM_FILTER_SCHEMA)}. ` +
    "Цены в рублях (млн → ×1e6, тыс → ×1e3). Сленг: двушка=2, однушка=1, трёшка=3, нск=новосибирск. " +
    "city — slug РОВНО из этого списка, иначе null: " + Object.keys(CITY_DB).join(", ") + ". " +
    "«не в центре» → excludeDistrict='Центр'. keywords — инфраструктура из текста (метро, школа, парк, новостройка, ипотека, ремонт).";
  const text = await chatComplete(
    [
      { role: "system", content: sys },
      { role: "user", content: message },
    ],
    { maxTokens: 500, temperature: 0 }
  );
  if (!text) return null;
  const candidates = [
    text.match(/\{\s*"city"[\s\S]*?\}/),
    text.match(/\{[\s\S]*\}/),
  ].filter(Boolean);
  let raw = null;
  for (const m of candidates) {
    // вычищаем возможный текст вокруг JSON, вырезаем жилые строки
    const cleaned = m[0].replace(/^[^{]*/, "").replace(/[^}]*$/, "");
    try {
      raw = JSON.parse(cleaned);
      break;
    } catch {}
  }
  if (!raw) return null;
  try {
    const filters = {};
    for (const k of Object.keys(LLM_FILTER_SCHEMA)) {
      if (k === "city") continue; // город маппится отдельно ниже
      if (k === "keywords") {
        if (Array.isArray(raw.keywords) && raw.keywords.length)
          filters.keywords = raw.keywords.map(String).slice(0, 5);
      } else if (raw[k] != null && raw[k] !== "" && raw[k] !== false) {
        filters[k] = raw[k];
      }
    }
    // slug города: точное совпадение либо по имени
    let slug =
      typeof raw.city === "string" && CITY_DB[raw.city.toLowerCase()] ? raw.city.toLowerCase() : null;
    if (!slug && typeof raw.city === "string") {
      const known = Object.entries(CITY_DB).find(
        ([, v]) => v.name.toLowerCase() === raw.city.toLowerCase()
      );
      slug = known ? known[0] : null;
    }
    if (slug) filters.city = slug;
    return Object.keys(filters).length ? filters : {};
  } catch {
    return null;
  }
}

// ---------- Живой ответ через LLM ----------
async function generateResponseLLM(filters, items, city) {
  if (!llmEnabled()) return null;
  const listing = items.slice(0, 10).map(
    (a, i) =>
      `${i + 1}) ${a.rooms}-комн., ${a.area} м², ${a.district}, ${a.address} — от ${(
        a.price / 1e6
      ).toFixed(2)} млн ₽ [${a.source}]`
  );
  const sys =
    "Ты — дружелюбный ассистент по поиску недвижимости в России. Ответь на русском, " +
    "сметой 1-2 предложения:_confirm найденные варианты, кратко подытожь цены, " +
    "если ничего не нашлось — мягко посоветуй расширить бюджет, площадь или район. " +
    "Без заголовков и списков, живым текстом.";
  return await chatComplete(
    [
      { role: "system", content: sys },
      {
        role: "user",
        content:
          `Поиск по запросу: "${JSON.stringify(filters)}", город: ${cityName(city)}.\n` +
          `Найдено ${items.length} вариантов:\n${listing.join("\n") || "(пусто)"}`,
      },
    ],
    { maxTokens: 600, temperature: 0.7 }
  );
}

// спокойный дедуп: бесплатная Nemotron любит повторять своё предложение
function dedupeSentence(text) {
  return text.replace(/(.{40,}?)\s*\1/g, "$1").trim();
}

function generateResponse(filters, count) {  const parts = [];
  if (filters.rooms) parts.push(`${filters.rooms}-комнатную`);
  if (filters.maxPrice) parts.push(`до ${(filters.maxPrice / 1e6).toFixed(1)} млн`);
  if (filters.minPrice) parts.push(`от ${(filters.minPrice / 1e6).toFixed(1)} млн`);
  if (filters.district) parts.push(`в ${filters.district.toLowerCase()} районе`);
  if (filters.excludeDistrict) parts.push(`кроме ${filters.excludeDistrict.toLowerCase()}`);
  if (filters.minArea || filters.maxArea) {
    const a = [];
    if (filters.minArea) a.push(`от ${filters.minArea} м²`);
    if (filters.maxArea) a.push(`до ${filters.maxArea} м²`);
    parts.push(a.join(" "));
  }
  if (filters.keywords?.length) parts.push(filters.keywords.join(", "));
  if (filters.city && CITY_DB[filters.city]) parts.push(`город: ${CITY_DB[filters.city].name}`);

  const queryDesc = parts.length ? parts.join(", ") : "квартиру";
  return `Ищу ${queryDesc}... Найдено ${count} вариантов.`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод POST обязателен" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { message, city = "novosibirsk" } = body || {};
    if (!message) return res.status(400).json({ error: "Message required" });

    // 1) Извлечение фильтров: сначала LLM (если есть ключ), затем regex-фоллбэк и частичное слияние
    let filters = {};
    let parsedBy = "regex";
    try {
      const llmFilters = await parseNLWithLLM(message);
      if (llmFilters) {
        // regex как страховка: добавляем поля, которые LLM не заполнил
        filters = llmFilters;
        parsedBy = "llm";
      }
    } catch {}
    const regexFilters = parseNaturalLanguage(message);
    filters = { ...regexFilters, ...filters };
    filters.city = filters.city || city;
    filters.city = CITY_DB[filters.city] ? filters.city : "novosibirsk"; // нормализуем slug

    const key = "chat:" + JSON.stringify({ city, ...filters });
    const hit = cacheGet(key);
    let items, sources, fetchedAt, cached = false;
    let relaxed = null;

    if (hit) {
      ({ items, sources, fetchedAt } = hit.data);
      cached = true;
      relaxed = null;
    } else {
      const { results, sources: src } = await fetchAllSources(city);
      sources = src;
      items = filterResults(results, filters);
      fetchedAt = new Date().toISOString();
      // Релаксация: чтобы не отвечать пустотой, понемногу ослабляем строгость
      if (items.length === 0 && results.length > 0) {
        const steps = [
          { label: "без ключевых слов", f: { ...filters, keywords: undefined } },
          { label: "без района", f: { ...filters, keywords: undefined, district: undefined, excludeDistrict: undefined } },
          { label: "без площади", f: { ...filters, keywords: undefined, district: undefined, excludeDistrict: undefined, minArea: undefined, maxArea: undefined } },
          { label: "только city+rooms", f: { ...filters, keywords: undefined, district: undefined, excludeDistrict: undefined, minArea: undefined, maxArea: undefined, maxPrice: undefined, minPrice: undefined } },
        ];
        for (const st of steps) {
          const tryItems = filterResults(results, st.f);
          if (tryItems.length > 0) {
            items = tryItems;
            relaxed = { dropped: st.label, appliedFilters: st.f };
            break;
          }
        }
        if (items.length === 0 && results.length > 0) {
          items = results;
          relaxed = { dropped: "все фильтры кроме города", appliedFilters: { city: filters.city } };
        }
      }
      cacheSet(key, { data: { items, sources, fetchedAt } });
    }

    let responseText = generateResponse(filters, items.length);
    try {
      const llmText = await generateResponseLLM(filters, items, filters.city);
      if (llmText) responseText = dedupeSentence(llmText);
    } catch {}

    res.status(200).json({
      response: responseText,
      parsedBy,
      filters,
      items: items.slice(0, 10), // Топ-10 для чата
      totalCount: items.length,
      count: items.length,
      sources,
      fetchedAt,
      cached,
      relaxed, // {dropped, appliedFilters} | null — какие фильтры пришлось смягчить
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports.parseNaturalLanguage = parseNaturalLanguage;
