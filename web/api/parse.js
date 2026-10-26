/**
 * GET /api/parse?city=&rooms=&minPrice=&maxPrice=
 * Обратная совместимость: ту же логику и формат ответа, что и ранее,
 * но все парсеры теперь живут в ../_lib/parser.js.
 */
const {
  cacheGet,
  cacheSet,
  fetchAllSources,
  filterResults,
} = require("../_lib/parser");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  const url = new URL(req.url, "http://localhost");
  const city = (url.searchParams.get("city") || "novosibirsk").replace(/[^a-z-]/g, "");
  const rooms = parseInt(url.searchParams.get("rooms") || "") || null;
  const minPrice = parseInt(url.searchParams.get("minPrice") || "") || null;
  const maxPrice = parseInt(url.searchParams.get("maxPrice") || "") || null;

  const key = "parse:" + JSON.stringify({ city, rooms, minPrice, maxPrice });
  const hit = cacheGet(key);
  if (hit) {
    return res.status(200).json({ ...hit.data, cached: true });
  }

  const { results, sources } = await fetchAllSources(city);
  const items = filterResults(results, { rooms, minPrice, maxPrice });

  const filters = { rooms, minPrice, maxPrice };
  const data = {
    items,
    sources,
    count: items.length,
    city,
    requested: { rooms, minPrice, maxPrice },
    filters,
    fetchedAt: new Date().toISOString(),
  };
  cacheSet(key, { data });
  res.status(200).json(data);
};
