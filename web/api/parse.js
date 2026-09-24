const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  const url = new URL(req.url, "http://localhost");
  const city = (url.searchParams.get("city") || "novosibirsk").replace(/[^a-z-]/g, "");
  const rooms = parseInt(url.searchParams.get("rooms") || "") || null;
  const minPrice = parseInt(url.searchParams.get("minPrice") || "") || null;
  const maxPrice = parseInt(url.searchParams.get("maxPrice") || "") || null;

  const key = JSON.stringify({ city, rooms, minPrice, maxPrice });
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return res.status(200).json({ ...hit.data, cached: true });
  }

  const results = [];
  const sources = {};

  await Promise.allSettled([
    parseDomRf(results, sources),
    parseM2(results, sources, city),
    parseCian(results, sources, city),
    parseJsonLd("ДомКлик", "https://domclick.ru/", results, sources),
  ]);

  let items = filterResults(results, rooms, minPrice, maxPrice);

  const data = {
    items,
    sources,
    count: items.length,
    city,
    requested: { rooms, minPrice, maxPrice },
    fetchedAt: new Date().toISOString(),
  };
  cache.set(key, { data, ts: Date.now() });
  res.status(200).json(data);
};

function filterResults(items, rooms, minPrice, maxPrice) {
  return items.filter((a) => {
    if (rooms && a.rooms !== rooms) return false;
    if (minPrice && a.price < minPrice) return false;
    if (maxPrice && a.price > maxPrice) return false;
    return true;
  });
}

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

// ---------- Дом.РФ: открытый REST API ----------
async function parseDomRf(out, sources) {
  try {
    const data = await fetchJson(
      "https://api.domrf.ru/v1/listings?limit=30&search_region=7"
    );
    const items = data?.items || data?.data?.items || [];
    let added = 0;
    for (const raw of items) {
      const l = raw.listing || raw;
      const apt = normalizeDomRf(l);
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

function num(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
  if (typeof v === "object" && v.value != null) return num(v.value);
  return 0;
}

function parseNum(str) {
  if (!str) return 0;
  const n = parseFloat(str.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function normalizeDomRf(l) {
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
    address: addr || "г. Новосибирск",
    price,
    area,
    floor: num(l.floor) || 1,
    totalFloors: num(l.total_floors) || 10,
    description: l.description || "Объявление с Дом.РФ",
    features: ["новостройка"],
    url: l.url || l.link || "https://дом.рф/",
  };
}

// ---------- M2.ru: ЖК и предложения по комнатности ----------
function m2Slug(city) {
  if (city === "moscow") return "moskva";
  if (city === "spb" || city === "sankt-peterburg") return "sankt-peterburg";
  return city;
}

function cianHost(city) {
  if (city === "moscow" || city === "moskva" || city === "spb" || city === "sankt-peterburg") return "www";
  return city;
}

async function parseM2(out, sources, city) {
  const url = `https://m2.ru/${m2Slug(city)}/novostroyki/`;
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
        const minPrice = parseFloat(m[4].replace(/\s/g, "").replace(",", ".")) * unit;
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

// ---------- Циан: вторичка (серверный рендер каталога) ----------
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
      const addr = (geo.join(" , ") || distRaw || pick(text, /(Новосибирская область[\s\S]{0,120}?)(?= \d[\d\s]{2,}\s*₽)/, 1) || "г. Новосибирск").trim();
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
        features: zhk ? ["новостройка", "ЖК: " + zhk] : ["вторичная недвижимость"],
        url: urlM.startsWith("http") ? urlM : "https://" + urlM,
      });
      added++;
    }
    sources["Циан"] = { ok: true, count: added };
  } catch (e) {
    sources["Циан"] = { ok: false, error: e.message };
  }
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
  if (x.includes("академгородок") || x.includes("лавренть") || x.includes("советский")) d = "Советский (Академгородок)";
  else if (x.includes("заельцов")) d = "Заельцовский";
  else if (x.includes("дзержинск")) d = "Дзержинский";
  else if (x.includes("ленинск")) d = "Ленинский";
  else if (x.includes("октябр")) d = "Октябрьский";
  else if (x.includes("первомай") || x.includes("первомайский")) d = "Первомайский";
  else if (x.includes("калинин") || x.includes("калининский")) d = "Калининский";
  else if (x.includes("кировск")) d = "Кировский";
  else if (x.includes("центр") || x.includes("красный просп") || x.includes("гоголя")) d = "Центр";
  return d || fallbackDistrict || "—";
}

// гибкий извлекатель первого совпадения
function pick(text, re, group) {
  const m = text.match(re);
  return m ? m[group] : "";
}

// ---------- Универсальный JSON-LD парсер (ДомКлик и др.) ----------
async function parseJsonLd(source, url, out, sources) {
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
      return t.includes("apartment") || t.includes("offer") || t.includes("product") || t.includes("realestate");
    })
    .map((n) => normalizeLd(n, source, pageUrl))
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

function normalizeLd(n, source, pageUrl) {
  const area = num(n.floorSize?.value?.value || n.floorSize?.value || n.floorSize);
  let price = 0;
  const offers = n.offers;
  if (offers) {
    if (Array.isArray(offers)) price = num(offers[0]?.price || offers[0]?.priceSpecification?.price);
    else price = num(offers.price || offers.priceSpecification?.price);
  }
  if (price <= 0) price = num(n.price);
  if (price <= 0 || area <= 0) return null;
  const rooms = num(n.numberOfRooms) || 1;
  const addr =
    (typeof n.address === "string" ? n.address : n.address?.streetAddress || n.address?.name || "") || "";
  return {
    source,
    rooms,
    district: districtOf(addr),
    address: addr || "г. Новосибирск",
    price,
    area,
    floor: 1,
    totalFloors: 10,
    description: (n.description || "").slice(0, 160) || `Объявление с ${source}`,
    features: [],
    url: n.url || pageUrl,
  };
}