/**
 * GET /api/search?city=&rooms=&minPrice=&maxPrice=&minArea=&maxArea=&district=&keywords=
 * Логика поиска — как в Express-бэке KvartiraPro, парсеры из ../_lib/parser.js.
 * Формат ответа: {items, sources:{ok,count,error}, count, filters, fetchedAt, cached}
 */
const { cacheGet, cacheSet, fetchAllSources, filterResults } = require("./_lib/parser");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const url = new URL(req.url, "http://localhost");
    const city = (url.searchParams.get("city") || "novosibirsk").replace(/[^a-z-]/g, "");
    const filters = {
      rooms: url.searchParams.get("rooms")
        ? parseInt(url.searchParams.get("rooms"))
        : null,
      minPrice: url.searchParams.get("minPrice")
        ? parseInt(url.searchParams.get("minPrice"))
        : null,
      maxPrice: url.searchParams.get("maxPrice")
        ? parseInt(url.searchParams.get("maxPrice"))
        : null,
      minArea: url.searchParams.get("minArea")
        ? parseFloat(url.searchParams.get("minArea"))
        : null,
      maxArea: url.searchParams.get("maxArea")
        ? parseFloat(url.searchParams.get("maxArea"))
        : null,
      district: url.searchParams.get("district") || null,
      keywords: url.searchParams.get("keywords")
        ? url.searchParams.get("keywords").split(",")
        : [],
    };

    const key = "search:" + JSON.stringify({ city, ...filters });
    const hit = cacheGet(key);
    if (hit) {
      return res.status(200).json({ ...hit, cached: true });
    }

    const { results, sources } = await fetchAllSources(city);
    const items = filterResults(results, filters);

    const data = {
      items,
      sources,
      count: items.length,
      city,
      filters,
      fetchedAt: new Date().toISOString(),
    };
    cacheSet(key, data);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
