/**
 * POST /api/chat  {message, city?} -> {response, filters, items, totalCount, count, sources, fetchedAt, cached}
 * NLP-фильтры: база из бэка KvartiraPro, расширенная словарём старого web/public/js/app.js:
 *   - города и сленг (нск, мск, спб, еКБ, питер...),
 *   - «двушка/трёшка/однушка/студия»,
 *   - excludeDistrict («не в центре», «не центр»),
 *   - инфраструктурные запросы (метро, школа, парк, садик, магазины...).
 */
const {
  cacheGet,
  cacheSet,
  fetchAllSources,
  filterResults,
} = require("./_lib/parser");

// ---------- Города (из legacy app.js) ----------
const CITIES = [
  ["новосибирск", "Новосибирск", "novosibirsk"],
  ["нск", "Новосибирск", "novosibirsk"],
  ["москва", "Москва", "moscow"],
  ["мск", "Москва", "moscow"],
  ["москву", "Москва", "moscow"],
  ["санкт-петербург", "Санкт-Петербург", "spb"],
  ["петербург", "Санкт-Петербург", "spb"],
  ["питер", "Санкт-Петербург", "spb"],
  ["спб", "Санкт-Петербург", "spb"],
  ["екатеринбург", "Екатеринбург", " ekaterinburg".trim()],
  ["екб", "Екатеринбург", "ekaterinburg"],
  ["казань", "Казань", "kazan"],
  ["нижний новгород", "Нижний Новгород", "nizhny-novgorod"],
  ["уфа", "Уфа", "ufa"],
  ["красноярск", "Красноярск", "krasnoyarsk"],
];

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

  // Комнаты (регэксп из KvartiraPro + сленг из legacy)
  const roomsMatch = lower.match(/(\d)\s*[- ]?\s*(?:комнат|комн|к\b)/);
  if (roomsMatch) filters.rooms = parseInt(roomsMatch[1]);
  if (/(однушк|студи|1-?комнат|1к)\b/.test(lower)) filters.rooms = 1;
  if (/(двушк|2-?комнат|2к)\b/.test(lower)) filters.rooms = 2;
  if (/(тр[её]шк|3-?комнат|3к)\b/.test(lower)) filters.rooms = 3;
  if (/(четыр[её]х|4-?комнат|4к)\b/.test(lower)) filters.rooms = 4;

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
  const from = lower.match(/(?:от|не меньше|не менее)\s*(\d{2,3})\s*м/);
  const to = lower.match(/(?:до|не больше)\s*(\d{2,3})\s*м\s*2?/);
  if (range) {
    filters.minArea = parseFloat(range[1]);
    filters.maxArea = parseFloat(range[2]);
  } else {
    if (from) filters.minArea = parseFloat(from[1]);
    if (to) filters.maxArea = parseFloat(to[1]);
  }

  // Город
  const cityHit = CITIES.find(([k]) => lower.includes(k));
  if (cityHit) filters.city = cityHit[2];

  // «не в центре» / «не центр» -> исключаем Центр (спальные районы)
  if (/(не\s+в\s+центре|не\s+центр|спальн)/.test(lower)) {
    filters.excludeDistrict = "Центр";
  }

  // Район (если это не «не в центре»)
  const d = DISTRICTS.find(([k]) => lower.includes(k));
  if (d) filters.district = d[1].charAt(0).toUpperCase() + d[1].slice(1);

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

function generateResponse(filters, count) {
  const parts = [];
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
  if (filters.city) parts.push(`город: ${filters.city}`);

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

    const filters = parseNaturalLanguage(message);
    filters.city = city;

    const key = "chat:" + JSON.stringify({ city, ...filters });
    const hit = cacheGet(key);
    let items, sources, fetchedAt, cached = false;

    if (hit) {
      ({ items, sources, fetchedAt } = hit.data);
      cached = true;
    } else {
      const { results, sources: src } = await fetchAllSources(city);
      sources = src;
      items = filterResults(results, filters);
      fetchedAt = new Date().toISOString();
      cacheSet(key, { data: { items, sources, fetchedAt } });
    }

    const responseText = generateResponse(filters, items.length);

    res.status(200).json({
      response: responseText,
      filters,
      items: items.slice(0, 10), // Топ-10 для чата
      totalCount: items.length,
      count: items.length,
      sources,
      fetchedAt,
      cached,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
