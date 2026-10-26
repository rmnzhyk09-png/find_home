/**
 * Единая библиотека парсеров: используется всеми serverless-функциями api/.
 * Содержит всё, что раньше было внутри api/parse.js и в Express-бэке KvartiraPro.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/128.0 Safari/537.36";

// ---------- Простой TTL-кэш (Map в памяти инстанса) ----------
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

function cacheGet(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;
  if (hit) cache.delete(key);
  return null;
}
function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
  // не даём карте расти бесконечно
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// ---------- Утилиты ----------
function num(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string")
    return parseFloat(v.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  if (typeof v === "object" && v.value != null) return num(v.value);
  return 0;
}

function parseNum(str) {
  if (!str) return 0;
  const n = parseFloat(str.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// гибкий извлекатель первого совпадения
function pick(text, re, group) {
  const m = text.match(re);
  return m ? m[group] : "";
}

function districtRus(raw) {
  const map = {
    заельцовский: "Заельцовский",
    заельцовскийр: "Заельцовский",
    октябрьский: "Октябрьский",
    ленинский: "Ленинский",
    кировский: "Кировский",
    советский: "Советский",
    первомайский: "Первомайский",
    калининский: "Калининский",
    дзержинский: "Дзержинский",
    центральный: "Центр",
  };
  return map[(raw || "").toLowerCase().replace(/\s+/g, "")] || raw;
}

function districtOf(addr, fallbackDistrict) {
  const x = (addr || "").toLowerCase();
  let d = null;
  if (x.includes("академгородок") || x.includes("лавренть") || x.includes("советский"))
    d = "Советский (Академгородок)";
  else if (x.includes("заельцов")) d = "Заельцовский";
  else if (x.includes("дзержинск")) d = "Дзержинский";
  else if (x.includes("ленинск")) d = "Ленинский";
  else if (x.includes("октябр")) d = "Октябрьский";
  else if (x.includes("первомай") || x.includes("первомайский")) d = "Первомайский";
  else if (x.includes("калинин") || x.includes("калининский")) d = "Калининский";
  else if (x.includes("кировск")) d = "Кировский";
  else if (x.includes("центр") || x.includes("красный просп") || x.includes("гоголя"))
    d = "Центр";
  return d || fallbackDistrict || "—";
}

// ---------- Реестр городов (глобальный поиск) ----------
// Сл_unique M2-слаги проверены живьём против m2.ru (200/404).
// cian — поддомен www.cian.ru; domrf — регион (если известен, иначе env).
const CITY_DB = {
  moscow: { name: "Москва", m2: "moskva", cian: "www" },
  spb: { name: "Санкт-Петербург", m2: "sankt-peterburg", cian: "www" },
  novosibirsk: { name: "Новосибирск", m2: "novosibirsk", cian: "nsk" },
  ekaterinburg: { name: "Екатеринбург", m2: "yekaterinburg", cian: "ekb" },
  kazan: { name: "Казань", m2: "kazan", cian: "kzn" },
  ufa: { name: "Уфа", m2: "ufa", cian: "ufa" },
  krasnoyarsk: { name: "Красноярск", m2: "krasnoyarsk", cian: "krasnoyarsk" },
  samara: { name: "Самара", m2: "samara" },
  omsk: { name: "Омск", m2: "omsk", cian: "omsk" },
  chelyabinsk: { name: "Челябинск", m2: "chelyabinsk", cian: "chelyabinsk" },
  perm: { name: "Пермь", m2: "perm" },
  voronezh: { name: "Воронеж", m2: "voronezh" },
  volgograd: { name: "Волгоград", m2: "volgograd" },
  saratov: { name: "Саратов", m2: "saratov" },
  tyumen: { name: "Тюмень", m2: "tyumen", cian: "tumen" },
  tolyatti: { name: "Тольятти", m2: "tolyatti" },
  izhevsk: { name: "Ижевск", m2: "izhevsk" },
  barnaul: { name: "Барнаул", m2: "barnaul" },
  ulyanovsk: { name: "Ульяновск", m2: "ulyanovsk" },
  yaroslavl: { name: "Ярославль", m2: "yaroslavl" },
  vladivostok: { name: "Владивосток", m2: "vladivostok" },
  tomsk: { name: "Томск", m2: "tomsk" },
  orenburg: { name: "Оренбург", m2: "orenburg" },
  ryazan: { name: "Рязань", m2: "ryazan" },
  penza: { name: "Пенза", m2: "penza" },
  lipetsk: { name: "Липецк", m2: "lipetsk" },
  kirov: { name: "Киров", m2: "kirov" },
  tula: { name: "Тула", m2: "tula" },
  cheboksary: { name: "Чебоксары", m2: "cheboksary" },
  kaliningrad: { name: "Калининград", m2: "kaliningrad" },
  kursk: { name: "Курск", m2: "kursk" },
  ivanovo: { name: "Иваново", m2: "ivanovo" },
  tver: { name: "Тверь", m2: "tver" },
  bryansk: { name: "Брянск", m2: "bryansk" },
  belgorod: { name: "Белгород", m2: "belgorod" },
  vladimir: { name: "Владимир", m2: "vladimir" },
  smolensk: { name: "Смоленск", m2: "smolensk" },
  kostroma: { name: "Кострома", m2: "kostroma" },
  pskov: { name: "Псков", m2: "pskov" },
  vologda: { name: "Вологда", m2: "vologda" },
  cherepovets: { name: "Череповец", m2: "cherepovets" },
  taganrog: { name: "Таганрог", m2: "taganrog" },
  stavropol: { name: "Ставрополь", m2: "stavropol" },
  vladikavkaz: { name: "Владикавказ", m2: "vladikavkaz" },
  sochi: { name: "Сочи", m2: "sochi" },
  kurgan: { name: "Курган", m2: "kurgan" },
  surgut: { name: "Сургут", m2: "surgut" },
  yakutsk: { name: "Якутск", m2: "yakutsk" },
  irkutsk: { name: "Иркутск", m2: "irkutsk" },
  chita: { name: "Чита", m2: "chita" },
  blagoveshchensk: { name: "Благовещенск", m2: "blagoveshchensk" },
  nizhnevartovsk: { name: "Нижневартовск", m2: "nizhnevartovsk" },
  khabarovsk: { name: "Хабаровск", m2: "khabarovsk" },
  "yuzhno-sakhalinsk": { name: "Южно-Сахалинск", m2: "yuzhno-sakhalinsk" },
  dzerzhinsk: { name: "Дзержинск", m2: "dzerzhinsk" },
  "nizhny-novgorod": { name: "Нижний Новгород", m2: null, cian: "novgorod" },
  "rostov-na-donu": { name: "Ростов-на-Дону", m2: null, cian: "rnd" },
  krasnodar: { name: "Краснодар", m2: null, cian: "krd" },
};

function cityInfo(city) {
  return CITY_DB[city] || null;
}

function cityName(city) {
  const info = cityInfo(city);
  return info ? info.name : "—";
}

function m2Slug(city) {
  const info = cityInfo(city);
  return info ? info.m2 : null; // null → город на M2 недоступен
}

function cianHost(city) {
  const info = cityInfo(city);
  if (!info) return "www";
  return info.cian || info.m2 || "www";
}

// ---------- Fetch helpers ----------
async function fetchText(url, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/json,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "application/json,*/*",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// ---------- Парсеры ----------

// Дом.РФ: открытый REST API. Регион задаётся env DOMRF_REGION_ID,
// иначе берётся из CITY_DB[city].domrf (если есть).
// Внимание: DNS хоста api.domrf.ru нестабилен — источник может просто недоступен.
async function parseDomRf(out, sources, city) {
  try {
    const regionId =
      Number(process.env.DOMRF_REGION_ID) || (cityInfo(city) || {}).domrf || 7;
    const data = await fetchJson(
      `https://api.domrf.ru/v1/listings?limit=30&search_region=${regionId}`
    );
    const items = data?.items || data?.data?.items || [];
    let added = 0;
    for (const raw of items) {
      const l = raw.listing || raw;
      const apt = normalizeDomRf(l, city);
      if (apt) {
        out.push(apt);
        added++;
      }
    }
    sources["Дом.РФ"] = { ok: true, count: added };
  } catch (e) {
    sources["Дом.РФ"] = { ok: false, error: e.message };
  }
}

function normalizeDomRf(l, city) {
  const price = num(l.price) || num(l.cost);
  const area = num(l.total_area) || num(l.area);
  const rooms = num(l.room) || num(l.rooms) || 1;
  if (price <= 0 || area <= 0) return null;
  const addr =
    typeof l.address === "object"
      ? l.address?.title || l.address?.full || l.address?.street || ""
      : l.address || "";
  return {
    source: "Дом.РФ",
    rooms,
    district: districtOf(addr),
    address: addr || cityName(city),
    price,
    area,
    floor: num(l.floor) || 1,
    totalFloors: num(l.total_floors) || 10,
    description: l.description || "Объявление с Дом.РФ",
    features: ["новостройка"],
    url: l.url || l.link || "https://дом.рф/",
  };
}

// M2.ru: ЖК и предложения по комнатности
async function parseM2(out, sources, city) {
  const slug = m2Slug(city);
  if (!slug) {
    sources["M2.ru"] = { ok: false, error: `город не поддерживается M2: ${city}` };
    return;
  }
  const url = `https://m2.ru/${slug}/novostroyki/`;
  try {
    const html = await fetchText(url);
    const cards = html.split(/NewBuildingSerpSnippet__borderWrapper/).slice(1);
    let added = 0;
    for (const card of cards) {
      const title = pick(card, /NewBuildingSerpSnippet__title[^>]*>([\s\S]*?)<\//, 1)
        .replace(/<[^>]+>/g, "")
        .trim();
      const titleDesk = title.startsWith("ЖК") ? title : `ЖК «${title}»`;
      const address = pick(card, /NewBuildingSerpSnippet__address[^>]*>([\s\S]*?)<\//, 1)
        .replace(/<[^>]+>/g, "")
        .trim();
      const link = pick(card, /href="(https?:\/\/m2\.ru\/[^"]+)"/, 1) || url;
      const cls = (pick(card, /Класс ЖК\s*([а-яА-ЯёЁ\s]+?)(?:\s*<|$)/, 1) || "")
        .trim()
        .toLowerCase();

      const clean = card
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");

      const offers = [...clean.matchAll(
        /(\d)\s*-?\s*комн\.\s*([\d.,]+)\s*–\s*([\d.,]+)\s*м²\s*([\d.,\s]+)\s*–\s*([\d.,\s]+)\s*(млн|тыс)\s*₽/g
      )].map((m) => {
        const unit = m[6] === "тыс" ? 1000 : 1000000;
        const minPrice =
          parseFloat(m[4].replace(/\s/g, "").replace(",", ".")) * unit;
        const minArea = parseFloat(m[2].replace(",", "."));
        const maxArea = parseFloat(m[3].replace(",", "."));
        const rooms = parseInt(m[1]);
        return {
          source: "M2.ru",
          rooms,
          district: "—",
          address: address || titleDesk,
          price: minPrice,
          area: Math.max(minArea, Math.min(maxArea, minArea + 10)) || minArea,
          floor: 1,
          totalFloors: 10,
          description: `${titleDesk}, от ${minPrice} ₽ (комп. ${rooms}-комн.)` + (cls ? `, класс ${cls}` : ""),
          features: ["новостройка"].concat(cls ? ["класс: " + cls] : []),
          url: link,
        };
      });

      const basePrice = pick(clean, /от\s*([\d.,]+\s*млн)\s*₽/, 1);
      if (offers.length === 0 && basePrice) {
        offers.push({
          source: "M2.ru",
          rooms: 1,
          district: "—",
          address: address || titleDesk,
          price: parseFloat(basePrice.replace(",", ".")) * 1000000,
          area: 40,
          floor: 1,
          totalFloors: 10,
          description: `${titleDesk} — уточняйте планировки` + (cls ? `, класс ${cls}` : ""),
          features: ["новостройка"].concat(cls ? ["класс: " + cls] : []),
          url: link,
        });
      }

      for (const o of offers) {
        if (o && o.price > 0) {
          out.push(o);
          added++;
        }
      }
    }
    sources["M2.ru"] = { ok: true, count: added };
  } catch (e) {
    sources["M2.ru"] = { ok: false, error: e.message };
  }
}

// Циан: вторичка (серверный рендер каталога)
async function parseCian(out, sources, city) {
  const url = `https://${cianHost(city)}.cian.ru/kupit-kvartiru/`;
  try {
    const html = await fetchText(url);
    const s = html
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/<script[\s\S]*?<\/script>/g, "");
    const segs = s.split(/data-mark="MainPrice"/).slice(1);
    let added = 0;
    for (const seg of segs) {
      const priceM = pick(seg, />([\d][\d\s]{1,11}?)\s*₽</, 1);
      const price = parseNum(priceM);
      if (price <= 0) continue;

      const text = seg
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();

      const params = pick(text, /(\d)\s*-\s*комн\.[^,]{0,20}?,\s*([\d.,]+)\s*м²\s*,\s*(\d+)\/(\d+)\s*этаж/, 1);
      const rooms = params ? parseInt(params) : 1;
      const area = params
        ? parseNum(pick(text, /(\d)-комн\.[^,]{0,20}?,\s*([\d.,]+)\s*м²/, 2))
        : 0;

      const zhk = pick(text, /ЖК\s*«([^»]+)»/, 1);
      const distRaw = pick(text, /р-н\s*([А-Яа-яЁё]+)/, 1);
      const geo = [...seg.matchAll(/data-name="GeoLabel"[^>]*>\s*([^<]{1,90}?)<\/a>/g)].map((m) =>
        m[1].trim()
      );
      const addr = (
        geo.join(" , ") ||
        (distRaw ? districtRus(distRaw) + " район" : "") ||
        cityName(city)
      ).trim();
      const urlM =
        pick(seg, /href="(https?:\/\/(?:www\.)?[^"]*?(?:\/flats\/|kupit-kvartiru|prodazha)[^"]*?)"/, 1) ||
        url;

      const desc =
        (text.split("₽/м²")[1] || "").trim().slice(0, 220) ||
        `Квартира (${rooms}-комн., ${area || "—"} м²) на Циан`;

      out.push({
        source: "Циан",
        rooms,
        district: districtOf(addr, distRaw && districtRus(distRaw) + " район"),
        address: addr,
        price,
        area: area || 40,
        floor: params ? parseInt(pick(text, /(\d)-комн\.[^,]{0,20}?,\s*[\d.,]+\s*м²\s*,\s*(\d+)\/(\d+)\s*этаж/, 2)) : 1,
        totalFloors: params ? parseInt(pick(text, /(\d)-комн\.[^,]{0,20}?,\s*[\d.,]+\s*м²\s*,\s*(\d+)\/(\d+)\s*этаж/, 3)) : 10,
        description: desc,
        features: zhk
          ? ["новостройка", "ЖК: " + zhk]
          : ["вторичная недвижимость"],
        url: urlM.startsWith("http") ? urlM : "https://" + urlM,
      });
      added++;
    }
    sources["Циан"] = { ok: true, count: added };
  } catch (e) {
    sources["Циан"] = { ok: false, error: e.message };
  }
}

// Универсальный JSON-LD парсер (ДомКлик и др.)
let ldCity = "";
async function parseJsonLd(source, url, out, sources, city) {
  ldCity = city || "";
  try {
    const html = await fetchText(url);
    const matches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    let added = 0;
    for (const [, raw] of matches) {
      const trimmed = raw.trim();
      if (!trimmed.includes("@type")) continue;
      try {
        const obj = JSON.parse(trimmed);
        for (const apt of extractApts(obj, source, url)) {
          out.push(apt);
          added++;
        }
      } catch {}
    }
    sources[source] = { ok: true, count: added };
  } catch (e) {
    sources[source] = { ok: false, error: e.message };
  }
}

function extractApts(obj, source, pageUrl) {
  const nodes = [];
  walk(obj, nodes);
  return nodes
    .filter((n) => {
      const t = (n["@type"] || "").toLowerCase();
      return (
        t.includes("apartment") || t.includes("offer") ||
        t.includes("product") || t.includes("realestate")
      );
    })
    .map((n) => normalizeLd(n, source, pageUrl, ldCity))
    .filter(Boolean)
    .slice(0, 30);
}

function walk(v, acc) {
  if (!v) return;
  if (Array.isArray(v)) {
    for (const item of v) walk(item, acc);
  } else if (typeof v === "object") {
    acc.push(v);
    for (const k of Object.keys(v)) walk(v[k], acc);
  }
}

function normalizeLd(n, source, pageUrl, currentCity) {
  const area = num(n.floorSize?.value?.value || n.floorSize?.value || n.floorSize);
  let price = 0;
  const offers = n.offers;
  if (offers) {
    if (Array.isArray(offers))
      price = num(offers[0]?.price || offers[0]?.priceSpecification?.price);
    else price = num(offers.price || offers.priceSpecification?.price);
  }
  if (price <= 0) price = num(n.price);
  if (price <= 0 || area <= 0) return null;
  const rooms = num(n.numberOfRooms) || 1;
  const addr =
    (typeof n.address === "string"
      ? n.address
      : n.address?.streetAddress || n.address?.name || "") || "";
  return {
    source,
    rooms,
    district: districtOf(addr),
    address: addr || cityName(currentCity || ""),
    price,
    area,
    floor: 1,
    totalFloors: 10,
    description: (n.description || "").slice(0, 160) || `Объявление с ${source}`,
    features: [],
    url: n.url || pageUrl,
  };
}

// ---------- Фильтрация ----------
function filterResults(items, filters) {
  filters = filters || {};
  return items.filter((a) => {
    if (filters.excludeDistrict && a.district === filters.excludeDistrict) return false;
    if (filters.rooms && a.rooms !== filters.rooms) return false;
    if (filters.minPrice && a.price < filters.minPrice) return false;
    if (filters.maxPrice && a.price > filters.maxPrice) return false;
    if (filters.minArea && a.area < filters.minArea) return false;
    if (filters.maxArea && a.area > filters.maxArea) return false;
    if (
      filters.district &&
      a.district &&
      !a.district.toLowerCase().includes(String(filters.district).toLowerCase())
    )
      return false;
    if (filters.keywords && filters.keywords.length > 0) {
      const text = `${a.address} ${a.description} ${(a.features || []).join(" ")}`.toLowerCase();
      if (!filters.keywords.some((k) => text.includes(String(k).toLowerCase()))) return false;
    }
    return true;
  });
}

// ---------- Сбор данных со всех площадок ----------
// ---------- Сбор данных со всех площадок ----------

// Санити: объявление должно упоминать запрошенный город (иначе Циан/WildCard отдаёт «дефолтный» город)
function citySanity(results, city) {
  const name = cityName(city);
  if (!name || name === "—") return results;
  return results.filter(
    (a) => a.address && (a.address.toLowerCase().includes(name.toLowerCase()) || a.address.includes(", " + name))
  );
}

async function fetchAllSources(city) {
  const results0 = [];
  const sources = {};
  await Promise.allSettled([
    parseDomRf(results0, sources, city),
    parseM2(results0, sources, city),
    parseCian(results0, sources, city),
    parseJsonLd("ДомКлик", "https://domclick.ru/", results0, sources, city),
  ]);
  const results = citySanity(results0, city);
  return { results, sources };
}

module.exports = {
  CITY_DB,
  cityName,
  UA,
  TTL_MS,
  cache,
  cacheGet,
  cacheSet,
  num,
  parseNum,
  pick,
  districtOf,
  districtRus,
  m2Slug,
  cianHost,
  fetchText,
  fetchJson,
  parseDomRf,
  parseM2,
  parseCian,
  parseJsonLd,
  filterResults,
  fetchAllSources,
};
