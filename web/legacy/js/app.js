/* Квартира AI — веб-версия */
"use strict";

// ---------- Демо-база (работает офлайн, обогащается данными с площадок) ----------
const SEED = [
  { source: "M2.ru", rooms: 1, district: "Центр", address: "ул. Ленина, 12", price: 4500000, area: 38, floor: 5, totalFloors: 9, description: "Уютная студия в самом центре, метро в 3 минутах.", features: ["ремонт", "балкон", "метро рядом"], url: "https://www.m2.ru/kupit-kvartiru/" },
  { source: "M2.ru", rooms: 2, district: "Центр", address: "Красный проспект, 31", price: 6800000, area: 52, floor: 3, totalFloors: 12, description: "Евродвушка с премиальным ремонтом, вид на парк.", features: ["ремонт", "кухня-гостиная", "парк"], url: "https://www.m2.ru/kupit-kvartiru/" },
  { source: "M2.ru", rooms: 3, district: "Ленинский", address: "ул. Титова, 5", price: 9500000, area: 78, floor: 8, totalFloors: 14, description: "Просторная трёшка для семьи, тихий двор.", features: ["2 балкона", "гардеробная", "ремонт"], url: "https://www.m2.ru/kupit-kvartiru/" },
  { source: "ДомКлик", rooms: 1, district: "Заельцовский", address: "ул. Дуси Ковальчук, 270", price: 3900000, area: 35, floor: 7, totalFloors: 10, description: "Недорогая однушка рядом с парком, свежая отделка.", features: ["балкон", "парк", "новостройка"], url: "https://domclick.ru/" },
  { source: "ДомКлик", rooms: 2, district: "Октябрьский", address: "ул. Кирова, 25", price: 5600000, area: 49, floor: 4, totalFloors: 16, description: "Двушка со свободной планировкой, дом клубного типа.", features: ["огромная кухня", "двор без машин", "новостройка"], url: "https://domclick.ru/" },
  { source: "ДомКлик", rooms: 2, district: "Центр", address: "ул. Советская, 8", price: 7100000, area: 55, floor: 2, totalFloors: 7, description: "Вторичка в кирпичном доме, капитальный ремонт.", features: ["кирпичный дом", "ремонт", "центр"], url: "https://domclick.ru/" },
  { source: "ДомКлик", rooms: 3, district: "Первомайский", address: "ул. Одоевского, 16", price: 8200000, area: 74, floor: 9, totalFloors: 18, description: "Трёшка с двумя санузлами, панорамные окна.", features: ["2 санузла", "панорамные окна"], url: "https://domclick.ru/" },
  { source: "Дом.РФ", rooms: 2, district: "Академгородок", address: "пр. Ак. Лаврентьева, 18", price: 6200000, area: 53, floor: 6, totalFloors: 12, description: "Семейная двушка в наукограде, школа во дворе.", features: ["школа рядом", "детский сад", "тихо"], url: "https://дом.рф/" },
  { source: "Дом.РФ", rooms: 3, district: "Ленинский", address: "Морской проспект, 9", price: 9000000, area: 82, floor: 11, totalFloors: 20, description: "Большая трёшка с двумя лоджиями и гардеробной.", features: ["2 лоджии", "гардеробная"], url: "https://дом.рф/" },
  { source: "Дом.РФ", rooms: 1, district: "Октябрьский", address: "ул. Семьи Шамшиных, 44", price: 3200000, area: 33, floor: 1, totalFloors: 5, description: "Компактная однушка для инвестора, сдаётся в аренду.", features: ["инвестиции", "низкая цена"], url: "https://дом.рф/" },
  { source: "База", rooms: 1, district: "Центр", address: "ул. Гоголя, 40", price: 2900000, area: 30, floor: 6, totalFloors: 12, description: "Бюджетная студия под сдачу, ликвидная локация.", features: ["недорого", "куплю/сдам"], url: "" },
  { source: "База", rooms: 2, district: "Заельцовский", address: "ул. Кропоткина, 55", price: 4800000, area: 47, floor: 3, totalFloors: 9, description: "Двушка с балконом и кладовкой, добротная планировка.", features: ["балкон", "кладовка"], url: "" },
  { source: "База", rooms: 2, district: "Ленинский", address: "ул. Немировича-Данченко, 104", price: 5300000, area: 51, floor: 10, totalFloors: 17, description: "Новостройка, сдача в этом году, до метро 7 минут.", features: ["новостройка", "метро рядом", "отделка"], url: "" },
  { source: "База", rooms: 3, district: "Октябрьский", address: "ул. Бориса Богаткова, 18", price: 7600000, area: 70, floor: 5, totalFloors: 11, description: "Светлая трёшка: две спальни + гостиная.", features: ["ремонт", "две спальни"], url: "" },
  { source: "База", rooms: 4, district: "Первомайский", address: "ул. Выборная, 99", price: 10500000, area: 96, floor: 14, totalFloors: 24, description: "Четырёхкомнатная квартира для большой семьи.", features: ["4 комнаты", "гардеробная", "2 санузла"], url: "" },
  { source: "База", rooms: 2, district: "Академгородок", address: "ул. Терешковой, 3", price: 3500000, area: 40, floor: 2, totalFloors: 6, description: "Двушка возле НГУ, идеальна для сдачи студентам.", features: ["студентам", "недорого"], url: "" }
];

// ---------- Хранилище ----------
const store = {
  get favorites() { return JSON.parse(localStorage.getItem("fav") || "[]"); },
  set favorites(v) { localStorage.setItem("fav", JSON.stringify(v)); },
  get history() {
    const raw = JSON.parse(localStorage.getItem("hist") || "[]");
    return raw.map((h) => (typeof h === "string" ? { q: h, d: "" } : h)).filter((h) => h && h.q);
  },
  set history(v) { localStorage.setItem("hist", JSON.stringify(v.slice(0, 50))); },
  get scraperCache() { return JSON.parse(localStorage.getItem("scraper") || "null"); },
  set scraperCache(v) { localStorage.setItem("scraper", JSON.stringify(v)); }
};

let live = [];            // объявления с площадок (обогащение)
const parsed = {};        // краткий статус по площадкам
const criteria = { rooms: null, maxPrice: null, district: null, city: null, region: null, minArea: null, maxArea: null, source: null, excludeDistrict: null, keywords: [] };

// ---------- Форматирование ----------
const fmtPrice = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";

// ---------- Голосовой ввод (Web Speech API) ----------
let recognition = null;
let listening = false;

function startVoice() {
  if (listening) stopVoice();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast("Голосовой ввод не поддерживается в этом браузере"); return; }
  recognition = new SR();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.onstart = () => { listening = true; const b = document.getElementById("voiceBtn"); if (b) b.classList.add("on"); };
  recognition.onend = () => { listening = false; const b = document.getElementById("voiceBtn"); if (b) b.classList.remove("on"); };
  recognition.onerror = (e) => { listening = false; const b = document.getElementById("voiceBtn"); if (b) b.classList.remove("on"); if (e.error === "not-allowed") toast("Доступ к микрофону запрещён"); };
  recognition.onresult = (ev) => {
    const t = ev.results[0][0].transcript;
    const input = document.getElementById("chatInput");
    if (input) { input.value = t; }
    sendMessage(t);
  };
  recognition.start();
}
function stopVoice() { if (recognition) { try { recognition.stop(); } catch {} } }

// ---------- Парсер запросов (локальный ИИ-мозг) ----------
const DISTRICTS = [
  ["академгородок", "Академгородок"], ["академ", "Академгородок"], ["наукоград", "Академгородок"],
  ["заельцовский", "Заельцовский"], ["заельцов", "Заельцовский"],
  ["ленинский", "Ленинский"], ["ленинск", "Ленинский"],
  ["октябрьский", "Октябрьский"], ["октябр", "Октябрьский"],
  ["первомайский", "Первомайский"], ["первомай", "Первомайский"],
  ["центр", "Центр"], ["центре", "Центр"]
];

const CITIES = [
  ["новосибирск", "Новосибирск"], ["нск", "Новосибирск"],
  ["москва", "Москва"], ["мск", "Москва"], ["москву", "Москва"],
  ["санкт-петербург", "Санкт-Петербург"], ["петербург", "Санкт-Петербург"], ["питер", "Санкт-Петербург"], ["спб", "Санкт-Петербург"],
  ["екатеринбург", "Екатеринбург"], ["екб", "Екатеринбург"],
  ["казань", "Казань"], ["нижний новгород", "Нижний Новгород"],
  ["уфа", "Уфа"], ["красноярск", "Красноярск"]
];

const CITY_SLUGS = {
  "новосибирск": "novosibirsk", " москва": "moskva", "москва": "moskva",
  "санкт-петербург": "sankt-peterburg", "екатеринбург": "yekaterinburg",
  "нижний новгород": "nizhniy-novgorod", "казань": "kazan",
  "уфа": "ufa", "красноярск": "krasnoyarsk"
};

const INFRA = [
  { label: "метро", words: ["метро", "станция метро"] },
  { label: "парк", words: ["парк", "зелён", "сквер", "набережн"] },
  { label: "школа", words: ["школ", "гимнази", "лицей"] },
  { label: "детский сад", words: ["детский сад", "садик"] },
  { label: "магазины", words: ["магазин", "торгов", "тц", "супермаркет"] },
  { label: "поликлиника", words: ["поликлин", "медиц", "клиник", "больниц"] },
  { label: "спорт", words: ["спорт", "фитнес", "тренажер", "стадион", "спорткомплекс"] },
  { label: "транспорт", words: ["транспорт", "остановк", "автобус", "трамвай", "троллейбус"] },
  { label: "вуз", words: ["университ", "институт", "вуз", "колледж", "техникум"] }
];

function detectCity(lower) {
  const c = CITIES.find(([k]) => lower.includes(k));
  return c ? c[1] : null;
}

function detectInfra(lower) {
  return INFRA.filter((f) => f.words.some((w) => lower.includes(w))).map((f) => f.label);
}

function parseUserMessage(text) {
  const lower = text.toLowerCase();
  const changed = {
    rooms: null, maxPrice: null, district: null, city: null, region: null, excludeDistrict: null,
    minArea: null, maxArea: null, source: null, keywords: null, unrecognized: false
  };

  const roomM = lower.match(/(\d+)\s*[- ]?комнат/);
  if (roomM) changed.rooms = parseInt(roomM[1]);
  if (/(однушк|студи|1-?комнат|1к)/.test(lower)) changed.rooms = 1;
  if (/(двушк|2-?комнат|2к)/.test(lower)) changed.rooms = 2;
  if (/(трёшк|трешк|3-?комнат|3к)/.test(lower)) changed.rooms = 3;
  if (/(четырёх|4-?комнат)/.test(lower)) changed.rooms = 4;

  const priceM = lower.match(/(\d[\d\s]*)\s*(миллион|млн)/);
  if (priceM) {
    const n = parseInt(priceM[1].replace(/\D/g, ""));
    changed.maxPrice = n <= 1000 ? n * 1000000 : n;
  } else {
    const full = lower.match(/(?:до|около|~)?\s*([1-9][\d\s]{6,})/);
    if (full) changed.maxPrice = parseInt(full[1].replace(/\D/g, ""));
  }

  const isSpalny = /(спальн|не в центре|не центр)/.test(lower);
  if (isSpalny) changed.excludeDistrict = "Центр";
  const d = DISTRICTS.find(([k]) => lower.includes(k));
  if (d) changed.district = d[1];

  changed.city = detectCity(lower);
  const regM = lower.match(/(?:в|вся)?\s*(новосибирская|московская|ленинградская|свердловская|республика)\s*область|регион[\s:]+([а-яё\-]+)/);
  if (regM) changed.region = regM[1] || regM[2];

  const from = lower.match(/(?:от|не меньше|не менее)\s*(\d{2,3})\s*м/);
  const to = lower.match(/(?:до|не больше|не более)\s*(\d{2,3})\s*м/);
  const range = lower.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})\s*м/);
  if (range) { changed.minArea = +range[1]; changed.maxArea = +range[2]; }
  else if (from || to) { changed.minArea = from ? +from[1] : null; changed.maxArea = to ? +to[1] : null; }

  if (/домклик/.test(lower)) changed.source = "ДомКлик";
  else if (/дом\.?рф/.test(lower)) changed.source = "Дом.РФ";
  else if (/\bm2\b| м2/.test(lower)) changed.source = "M2.ru";

  const kw = [];
  if (/(ремонт)/.test(lower)) kw.push("ремонт");
  if (/(балкон|лоджи)/.test(lower)) kw.push("балкон");
  if (/(метро)/.test(lower)) kw.push("метро рядом");
  if (/(парк|зелен)/.test(lower)) kw.push("парк");
  if (/(новостройк)/.test(lower)) kw.push("новостройка");
  if (/(гардеробн)/.test(lower)) kw.push("гардеробная");
  if (/(тих|спокойн)/.test(lower)) kw.push("тихо");
  if (/(вторичк)/.test(lower)) kw.push("вторичка");
  if (/(инвест|под сдачу|сдавать)/.test(lower)) kw.push("инвестиции");
  if (/(студент)/.test(lower)) kw.push("студентам");
  kw.push(...detectInfra(lower).filter((l) => !kw.some((k) => k.includes(l) || l === k)));
  if (kw.length) changed.keywords = kw;

  const applied = Object.values(changed).some((v) => v != null && !(Array.isArray(v) && v.length === 0));
  if (!applied) changed.unrecognized = true;
  return changed;
}

function applyCriteria(ch) {
  for (const k of Object.keys(ch)) {
    if (ch[k] === null || ch[k] === undefined || ch[k] === false) continue;
    if (ch[k] === true) continue;
    criteria[k] = ch[k];
  }
}

function searchApts(list, c) {
  const maxScore = 10 + Math.min(4, c.keywords.length);
  return list.map((a) => {
      let s = 0;
      if (c.excludeDistrict && a.district === c.excludeDistrict) return null;
      if (c.rooms != null && a.rooms === c.rooms) s += 3;
      if (c.maxPrice != null) { if (a.price <= c.maxPrice) s += 3; else if (a.price <= c.maxPrice * 1.2) s += 1; }
      if (c.district && a.district.toLowerCase() === c.district.toLowerCase()) s += 2;
      if (c.minArea != null && a.area >= c.minArea) s += 1;
      if (c.maxArea != null && a.area <= c.maxArea) s += 1;
      c.keywords.forEach((kw) => {
        if ((a.description + " " + a.features.join(" ")).toLowerCase().includes(kw)) s++;
      });
      if (c.source && a.source.toLowerCase() === c.source.toLowerCase()) s += 1;
      return s > 0 ? { a, s, maxScore } : null;
    })
    .filter(Boolean)
    .sort((x, y) => y.s - x.s || y.a.updatedAt - x.a.updatedAt);
}

function brainAnswer(text, list) {
  const lower = text.toLowerCase();
  const greetWords = ["привет", "здравствуй", "доброе утро", "добрый день", "добрый вечер", "хай", "приветствую", "ку"];
  if (greetWords.some((w) => lower.includes(w))) {
    return { text: "Привет! Я AI Застройщик — робот-автоматизатор: сам сканирую площадки и подбираю квартиры по чётким правилам. Скажите, сколько комнат нужно, бюджет и район. Например: «2 комнаты, до 5 млн, в центре».", results: null };
  }
  const ch = parseUserMessage(text);
  if (ch.unrecognized) {
    return { text: "Не всё разобрал 🤖. Робот умеет читать: город и регион (Новосибирск, Москва…), комнаты (2 комнаты, двушка), бюджет (до 6 млн), район (центр, ленинский…), площадь (от 45 м²), инфраструктуру (метро, школа, сад, парк, поликлиника, магазины) и площадку (домклик, m2, циан).", results: null };
  }
  applyCriteria(ch);

  if (criteria.rooms == null) return { text: "Сколько комнат вам нужно? (1, 2, 3 или больше)", results: null };
  if (criteria.maxPrice == null) return { text: "Какой у вас бюджет? Например: до 5 млн.", results: null };

  const matches = searchApts(list, criteria);
  if (!matches.length) {
    return { text: "Точных совпадений нет. Попробуйте увеличить бюджет или сменить район/площадку.", results: null };
  }
  const top = matches.slice(0, 6).map((m) => ({ ...m.a, _pct: Math.round((m.s * 100) / m.maxScore) }));
  const hintInfra = criteria.keywords.length ? " | Инфраструктура: " + criteria.keywords.join(", ") : "";
  return { text: "Готово! Варианты ниже 👇" + hintInfra, results: top, summary: `Подобрал ${matches.length} ${wordForms(matches.length)}${criteria.city ? `, ${criteria.city}` : ""}${criteria.district ? ", район " + criteria.district : ""}${criteria.rooms != null ? ", " + criteria.rooms + " комн." : ""}${criteria.maxPrice ? ", до " + fmtPrice(criteria.maxPrice) : ""}` };
}

function wordForms(n) {
  const titles = ["вариант", "варианта", "вариантов"];
  let i = (n % 100 > 4 && n % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][Math.min(n % 10, 5)];
  return titles[i];
}

// ---------- Рендер карточек (по макету: светлый корпус + тёмная полоса цены) ----------
function cardHtml(a, pct) {
  const fav = store.favorites.includes(a.id);
  return `
  <div class="card" onclick="openApt(event,'${escAttr(a.url)}')" data-id="${a.id}">
    <div class="card-top">
      <span class="source">${esc(a.source)}</span>
      <button class="fav ${fav ? "on" : ""}" data-fav="${a.id}" onclick="toggleFav(event,${a.id})">${fav ? "❤️" : "🤍"}</button>
      <div class="card-title">${a.rooms}-комн., ${Math.round(a.area)} м²${pct != null ? `<span class="pct">${pct}%</span>` : ""}</div>
      <div class="card-addr">${esc(a.district)} • ${esc(a.address)}</div>
      <div class="card-desc">${esc(a.description)}</div>
      ${a.features.length ? `<div class="tags">${a.features.slice(0, 4).map(f => `<span class="tag">${esc(f)}</span>`).join("")}</div>` : ""}
    </div>
    <div class="card-bar">
      <span class="price">${fmtPrice(a.price)}</span>
      <span class="per-meter">≈ ${fmtPrice(Math.round(a.price / Math.max(a.area, 1)))}/м² · эт. ${a.floor}/${a.totalFloors}</span>
      <span class="bar-go">→</span>
    </div>
  </div>`;
}

function esc(s) { return String(s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }

function openApt(e, url) {
  e.stopPropagation();
  if (url) window.open(url, "_blank");
}

function toggleFav(e, id) {
  e.stopPropagation();
  let f = store.favorites;
  f = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
  store.favorites = f;
  refreshFavCount();
  renderCatalog();
  renderFavorites();
}

function refreshFavCount() {
  const el = document.getElementById("favCount");
  if (el) el.textContent = store.favorites.length ? store.favorites.length : "";
}

// ---------- Каталог ----------
let catQuery = "", catRooms = "all", catSort = "";
function allListings() { return [...SEED.map((s, i) => ({ ...s, id: "seed-" + i })), ...live]; }

function filteredList() {
  let list = allListings();
  if (catRooms !== "all") list = list.filter((a) => catRooms === "4" ? a.rooms >= 4 : a.rooms === +catRooms);
  if (catQuery) list = list.filter((a) => (a.district + " " + a.address + " " + a.description + " " + a.features.join(" ")).toLowerCase().includes(catQuery.toLowerCase()));
  if (catSort === "price") list = [...list].sort((a, b) => a.price - b.price);
  else if (criteria.rooms != null || criteria.maxPrice != null) {
    list = searchApts(list, criteria).map((m) => ({ ...m.a, _pct: Math.round((m.s * 100) / m.maxScore) }));
    if (!list.length) list = allListings().filter((a) => !(criteria.excludeDistrict && a.district === criteria.excludeDistrict));
  }
  return list;
}

function renderCatalog() {
  document.getElementById("catalogList").innerHTML = filteredList().map((a) => cardHtml(a, a._pct ?? null)).join("") || `<div class="empty">Пока пусто. Нажмите «Обновить с площадок» или начните диалог в чате.</div>`;
}

async function refreshCatalog() {
  const btn = document.getElementById("refreshBtn");
  const sideBtn = document.getElementById("refreshBtnSide");
  const note = document.getElementById("catalogNote");
  const sideNote = document.getElementById("sideNote");
  btn.disabled = true;
  if (sideBtn) sideBtn.disabled = true;
  note.textContent = "🔄 Сканирую Циан, M2.ru, Дом.РФ…";
  if (sideNote) sideNote.textContent = "🔄 Сканирую площадки…";
  try {
    const q = new URLSearchParams();
    const slug = CITY_SLUGS[String(criteria.city || "").toLowerCase()] || "novosibirsk";
    q.set("city", slug);
    const c = typeof criteria !== "undefined" && criteria ? criteria : {};
    const roomsVal = catRooms && catRooms !== "all" ? catRooms : (c.rooms != null ? c.rooms : "");
    if (roomsVal && roomsVal !== "") q.set("rooms", roomsVal);
    if (c.maxPrice) q.set("maxPrice", c.maxPrice);
    const r = await fetch("/api/parse?" + q.toString());
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    const items = (data.items || []).map((it, i) => ({ ...it, id: it.url + it.address + i, features: it.features || [] }));
    live = items;
    store.scraperCache = { items, at: data.fetchedAt, ts: Date.now() };
    const bad = Object.entries(data.sources || {}).filter(([, v]) => !v.ok);
    const ok = Object.entries(data.sources || {}).filter(([, v]) => v.ok);
    let txt = `Загружено с площадок: ${items.length}. `;
    if (ok.length) txt += "OK: " + ok.map(([s, v]) => `${s} (${v.count})`).join(", ") + ". ";
    if (bad.length) txt += "Недоступны: " + bad.map(([s]) => s).join(", ") + ".";
    note.className = "note" + (bad.length && !ok.length ? " err" : "");
    note.textContent = txt;
    if (sideNote) sideNote.textContent = txt;
    renderCatalog();
    toast(items.length ? `Площадки обновлены: ${items.length} объявлений` : "Площадки не дали данных (анти-бот). Попробуйте позже.");
  } catch (e) {
    note.className = "note err";
    note.textContent = "Не удалось получить данные с площадок: " + e.message;
    if (sideNote) sideNote.textContent = "Площадки недоступны: " + e.message;
    toast("Сервер парсера недоступен");
  } finally {
    btn.disabled = false;
    if (sideBtn) sideBtn.disabled = false;
  }
}

// ---------- Чат ----------
function addMsg(text, from, results) {
  const list = document.getElementById("chatList");
  const wrap = document.createElement("div");
  const who = from ? "user" : "bot";
  wrap.className = "msg " + who;
  const t = typeof text === "object" ? text.text : text;
  const t2 = typeof text === "object" ? (text.summary ? text.summary + "." : "") : "";
  wrap.innerHTML = `<div class="bubble">${esc(t)}</div>` + (t2 ? `<div class="bubble" style="margin-top:6px;">${esc(t2)}</div>` : "");
  if (results) wrap.innerHTML += results.map((a) => `<div class="mini-card" onclick="window.open('${escAttr(a.url)}','_blank')">${cardHtml(a, a._pct)}</div>`).join("");
  list.appendChild(wrap);
  list.scrollTop = list.scrollHeight;
}

async function sendMessage(text) {
  if (!text.trim()) return;
  addMsg({ text }, true);
  const d = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  store.history = [{ q: text, d }, ...store.history.filter((h) => h.q !== text)];
  renderHistory();
  document.getElementById("typing").hidden = false;
  const hero = document.getElementById("heroCard");
  if (hero) hero.hidden = true;

  // Робот-автоматизатор: перед ответом сам сканирует площадки под текущие критерии
  await robotScan();

  let answer = brainAnswer(text, allListings());
  if (typeof answer === "string") answer = { text: answer, results: null, summary: null };

  document.getElementById("typing").hidden = true;
  if (answer.summary) addMsg(answer.summary, true);
  addMsg(answer.text, false, answer.results);
}

// Робот сам подтягивает свежие объявления с площадок — без участия пользователя
async function robotScan() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45000);
    const q = new URLSearchParams();
    const slug = CITY_SLUGS[String(criteria.city || "").toLowerCase()] || "novosibirsk";
    q.set("city", slug);
    if (criteria.rooms != null) q.set("rooms", criteria.rooms);
    if (criteria.maxPrice) q.set("maxPrice", criteria.maxPrice);
    const r = await fetch("/api/parse?" + q.toString(), { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return;
    const data = await r.json();
    const items = (data.items || []).map((it, i) => ({ ...it, id: it.url + it.address + i, features: it.features || [] }));
    if (items.length) {
      live = items;
      store.scraperCache = { items, at: data.fetchedAt, ts: Date.now() };
    }
  } catch {}
}

// ---------- Избранное / История ----------
function renderFavorites() {
  const list = allListings().filter((a) => store.favorites.includes(a.id));
  document.getElementById("favoritesList").innerHTML = list.map((a) => cardHtml(a, null)).join("") || `<div class="empty">Здесь появятся понравившиеся квартиры — нажимайте ♥ на карточке.</div>`;
}

function renderHistory() {
  const h = store.history;
  document.getElementById("historyList").innerHTML = h.length
    ? h.map((it) => `<div class="h-item" onclick="sendMessage(this.dataset.q); backToChat()" data-q="${escAttr(it.q)}">${esc(it.q)}${
        it.d ? `<span class="h-date">${esc(it.d)}</span>` : ""
      }<span class="arr">→</span></div>`).join("")
    : `<div class="empty">История пуста — опишите будущую квартиру в чате.</div>`;
  renderSideHistory(h);
}

function renderSideHistory(h) {
  const el = document.getElementById("sideHistory");
  if (!el) return;
  const list = h || store.history;
  el.innerHTML = list.length
    ? list.slice(0, 8).map((it) => `<div class="side-item" onclick="sendMessage(this.dataset.q); backToChat()" data-q="${escAttr(it.q)}">${esc(it.q.length > 42 ? it.q.slice(0, 42) + "…" : it.q)}<span class="arr">→</span></div>`).join("")
    : `<div class="empty" style="font-size:12px;">Пока пусто</div>`;
}

function clearHistory() {
  store.history = [];
  renderHistory();
  renderSideHistory([]);
  toast("История очищена");
}

function backToChat() {
  switchTab("chat");
}

// ---------- Табы (иконки в шапке + нижняя навигация) ----------
function switchTab(name) {
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("active", p.id === "pane-" + name));
  if (name === "catalog") renderCatalog();
  if (name === "favorites") renderFavorites();
  if (name === "history") renderHistory();
  if (name === "chat") document.getElementById("chatInput").focus();
}

// ---------- Подсказки ----------
const SUGGESTIONS = [
  "Город Новосибирск, 2 комнаты, до 6 млн, в центре, рядом парк и школа",
  "Новосибирск, центр, 3 комнаты, до 9 млн, рядом метро",
  "Однушка до 3 млн с ремонтом, рядом магазины",
  "Двушка в Академгородке до 5 млн, рядом детский сад и поликлиника"
];
function renderSuggestions() {
  document.getElementById("suggestions").innerHTML = SUGGESTIONS.map((s) => `<button class="sugg" onclick="sendFromSugg('${escAttr(s)}')">${esc(s)}</button>`).join("");
}
function sendFromSugg(t) { document.getElementById("chatInput").value = t; document.getElementById("sendBtn").click(); }

// ---------- Фильтры каталога ----------
function applyFilters() {
  criteria.region = document.getElementById("fRegion").value.trim() || null;
  criteria.city = document.getElementById("fCity").value.trim() || null;
  const rv = document.getElementById("fRooms").value;
  criteria.rooms = rv ? (rv === "4" ? 4 : +rv) : null;
  const b = parseFloat(document.getElementById("fBudget").value.replace(",", ".").replace(/\s/g, ""));
  criteria.maxPrice = b ? b * 1000000 : null;
  categoriesToKeywords();
  renderCatalog();
}

function categoriesToKeywords() {
  const sel = [...document.querySelectorAll("#infraChips .chip.active")].map((c) => c.dataset.infra);
  criteria.keywords = sel;
}

function resetFilters() {
  document.getElementById("fRegion").value = "";
  document.getElementById("fCity").value = "";
  document.getElementById("fRooms").value = "";
  document.getElementById("fBudget").value = "";
  document.querySelectorAll("#infraChips .chip").forEach((c) => c.classList.remove("active"));
  criteria.region = null; criteria.city = null; criteria.rooms = null; criteria.maxPrice = null; criteria.keywords = [];
  catRooms = "all"; catQuery = ""; catSort = "";
  document.getElementById("catSearch").value = "";
  document.querySelectorAll(".chip[data-rooms]").forEach((c) => c.classList.toggle("active", c.dataset.rooms === "all"));
  document.getElementById("sortPrice").classList.remove("active");
  renderCatalog();
}

// ---------- События ----------
function init() {
  renderSuggestions();
  refreshFavCount();
  renderHistory();

  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  const col = document.getElementById("collapseBtn");
  if (col) col.addEventListener("click", () => {
    document.getElementById("layout").classList.add("collapsed");
    document.getElementById("expandBtn").hidden = false;
  });
  const exp = document.getElementById("expandBtn");
  if (exp) exp.addEventListener("click", () => {
    document.getElementById("layout").classList.remove("collapsed");
    exp.hidden = true;
  });
  document.getElementById("sendBtn").addEventListener("click", () => { const i = document.getElementById("chatInput"); sendMessage(i.value); i.value = ""; });
  const vb = document.getElementById("voiceBtn");
  if (vb) vb.addEventListener("click", startVoice);
  const cb = document.getElementById("clearHistoryBtn");
  if (cb) cb.addEventListener("click", clearHistory);
  document.getElementById("chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { sendMessage(e.target.value); e.target.value = ""; } });
  document.getElementById("catSearch").addEventListener("input", (e) => { catQuery = e.target.value; renderCatalog(); });
  document.getElementById("sortPrice").addEventListener("click", () => { catSort = catSort === "price" ? "" : "price"; document.getElementById("sortPrice").classList.toggle("active", catSort === "price"); renderCatalog(); });
  document.getElementById("refreshBtn").addEventListener("click", refreshCatalog);
  document.getElementById("refreshBtnSide").addEventListener("click", refreshCatalog);
  document.getElementById("fReset").addEventListener("click", resetFilters);
  ["fRegion", "fCity", "fRooms", "fBudget"].forEach((id) => document.getElementById(id).addEventListener("input", applyFilters));
  document.querySelectorAll("#infraChips .chip").forEach((c) => c.addEventListener("click", () => { c.classList.toggle("active"); applyFilters(); }));
  document.querySelectorAll(".chip[data-rooms]").forEach((c) => c.addEventListener("click", () => {
    catRooms = c.dataset.rooms;
    document.querySelectorAll(".chip[data-rooms]").forEach((x) => x.classList.toggle("active", x === c));
    renderCatalog();
  }));
  renderCatalog();
}

// ---------- Toast ----------
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 4200);
}

document.addEventListener("DOMContentLoaded", init);