/**
 * GET /api/sources — список обрабатываемых площадок.
 */
const SOURCES = ["Дом.РФ", "M2.ru", "Циан", "ДомКлик"];

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  res.status(200).json({
    sources: SOURCES,
    description: "Парсинг публичных данных с 4-х крупнейших площадок РФ",
  });
};
