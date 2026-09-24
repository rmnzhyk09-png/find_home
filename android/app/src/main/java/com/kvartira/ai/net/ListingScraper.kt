package com.kvartira.ai.net

import android.util.Log
import com.kvartira.ai.data.Apartment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.jsoup.Jsoup
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Best-effort scraper for public listing aggregators (M2.ru, ДомКлик, Дом.РФ).
 * Sites without a public API often block bots; the module never throws and
 * returns an empty list instead, so the app always works.
 */
object ListingScraper {

    private val tag = "ListingScraper"
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    data class ScrapeOut(val list: List<Apartment>, val message: String)

    suspend fun scrape(): ScrapeOut = withContext(Dispatchers.IO) {
        val jobs = listOf(
            async { scrapeDomRf() },
            async { scrapeJsonLd("M2.ru", "https://www.m2.ru/kupit-kvartiru/") },
            async { scrapeJsonLd("ДомКлик", "https://domclick.ru/newholdings") }
        )
        val (domRf, m2, domclick) = jobs.awaitAll()
        val all = domRf + m2 + domclick
        when {
            all.isEmpty() -> ScrapeOut(emptyList(), "Площадки не ответили (анти-бот защита или сеть). Использую локальную базу.")
            else -> ScrapeOut(all, "Загружено объявлений с площадок: ${all.size}")
        }
    }

    private fun get(url: String): String? = runCatching {
        val req = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")
            .header("Accept-Language", "ru-RU,ru;q=0.9")
            .build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) null else resp.body?.string()
        }
    }.getOrElse {
        Log.w(tag, "fetch failed $url: $it")
        null
    }

    /** Дом.РФ tries its open REST endpoint. */
    private fun scrapeDomRf(): List<Apartment> = runCatching {
        val body = get("https://api.domrf.ru/v1/listings?limit=10&search_region=7")
            ?: return runCatching { emptyList<Apartment>() }.getOrDefault(emptyList())
        val root = JSONObject(body)
        val items = root.optJSONArray("items") ?: JSONArray()
        val out = mutableListOf<Apartment>()
        for (i in 0 until items.length()) {
            val listing = items.getJSONObject(i).optJSONObject("listing") ?: continue
            val area = (listing.opt("total_area") as? Number)?.toDouble()
                ?: (listing.optJSONObject("total_area")?.optDouble("value") ?: 0.0)
            val price = (listing.opt("price") as? Number)?.toLong() ?: 0L
            val rooms = (listing.opt("room") as? Number)?.toInt() ?: 1
            val address = listing.optJSONObject("address")?.optString("title")
                ?: listing.optString("address").ifBlank { "г. Новосибирск" }
            val url = listing.optString("url").ifBlank { "https://api.domrf.ru/v1/listings" }
            if (price > 0 && area > 0) {
                out += Apartment(0, "Дом.РФ", rooms, "—", address, price, area, 1, 10,
                    "Объявление с открытого API Дом.РФ", emptyList(), url, System.currentTimeMillis())
            }
        }
        out
    }.recoverCatching {
        Log.w(tag, "domrf scrape failed: $it")
        emptyList<Apartment>()
    }.getOrDefault(emptyList())

    /** Generic JSON-LD (schema.org) extraction used for M2.ru / ДомКлик. */
    private fun scrapeJsonLd(source: String, url: String): List<Apartment> = runCatching {
        val html = get(url) ?: return runCatching { emptyList<Apartment>() }.getOrDefault(emptyList())
        val doc = Jsoup.parse(html)
        val scripts = doc.select("script[type=application/ld+json]")
        val out = mutableListOf<Apartment>()
        for (el in scripts) {
            val raw = el.data()?.trim() ?: continue
            if (!raw.contains("\"@type\"")) continue
            val obj = JSONObject(raw)
            for (n in extractNodes(obj).take(30)) {
                val type = n.optString("@type").lowercase()
                if (!type.contains("apartment") && !type.contains("product") && !type.contains("offer")) continue
                val apt = toApartment(n, source, url, type)
                if (apt != null) out += apt
            }
        }
        out.distinctBy { it.address + it.price }
    }.recoverCatching {
        Log.w(tag, "$source jsonld failed: $it")
        emptyList<Apartment>()
    }.getOrDefault(emptyList())

    private fun extractNodes(obj: JSONObject): List<JSONObject> {
        val nodes = mutableListOf<JSONObject>()
        fun walk(v: Any?) {
            when (v) {
                is JSONObject -> {
                    nodes += v
                    for (k in v.keys()) walk(v.opt(k))
                }
                is JSONArray -> for (i in 0 until v.length()) walk(v.opt(i))
            }
        }
        walk(obj)
        return nodes
    }

    private fun toApartment(n: JSONObject, source: String, pageUrl: String, type: String): Apartment? {
        val area = runCatching {
            val a = n.optJSONObject("floorSize")?.optJSONObject("value")?.optDouble("value")
                ?: (n.opt("floorSize") as? JSONObject)?.optDouble("value")
                ?: (n.opt("floorSize") as? Number)?.toDouble()
                ?: 0.0
            a
        }.getOrDefault(0.0)
        val price = runCatching {
            val off = n.optJSONObject("offers").takeIf { it != null } ?: JSONObject()
            when (val p = off.opt("price")) {
                is Number -> p.toLong()
                else -> off.optJSONObject("priceSpecification")?.optDouble("price")?.toLong() ?: 0L
            }
        }.getOrDefault(0L)
        if (price <= 0 || area <= 0) return null
        val rooms = runCatching {
            (n.opt("numberOfRooms") as? Number)?.toInt()
                ?: (n.optJSONObject("numberOfRooms")?.optDouble("value"))?.toInt()
                ?: 1
        }.getOrDefault(1)
        val address = n.optString("address").ifBlank {
            n.optJSONObject("address")?.optString("streetAddress").orEmpty()
        }.ifBlank { "г. Новосибирск" }
        val url = n.optString("url").ifBlank { pageUrl }
        return Apartment(0, source, rooms, "—", address, price, area, 1, 10,
            n.optString("description").take(160).ifBlank { "Объявление с $source" },
            emptyList(), url, System.currentTimeMillis())
    }
}