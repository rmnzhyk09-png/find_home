package com.kvartira.ai.ai

import com.kvartira.ai.data.Apartment
import com.kvartira.ai.data.ApartmentDb
import com.kvartira.ai.data.Criteria
import java.util.Locale

class LocalBrain(private val db: ApartmentDb) {

    data class BrainOut(val text: String, val results: List<Apartment> = emptyList(), val updated: Criteria)

    private val districtMap = listOf(
        "академгородок" to "Академгородок", "академ" to "Академгородок", "наукоград" to "Академгородок",
        "заельцовский" to "Заельцовский", "заельцов" to "Заельцовский",
        "ленинский" to "Ленинский", "ленинск" to "Ленинский",
        "октябрьский" to "Октябрьский", "октябр" to "Октябрьский",
        "первомайский" to "Первомайский", "первомай" to "Первомайский",
        "центр" to "Центр", "центре" to "Центр", "в центре" to "Центр"
    )

    fun process(text: String, prev: Criteria): BrainOut {
        val clean = text.trim()
        if (clean.isEmpty()) return BrainOut("Напишите, что вы ищете 🙂", updated = prev)
        val lower = clean.lowercase(Locale.getDefault())
        val c = prev.copyOf()

        if (isGreeting(lower)) {
            return BrainOut(
                "Привет! Я робот-автоматизатор: подберу квартиру по чётким правилам. Расскажите: сколько комнат нужно, какой бюджет и район? Например: «2 комнаты, до 5 млн, в центре».",
                updated = c
            )
        }
        if (lower.equals("спасибо") || lower.equals("спс") || lower.contains("спасибо")) {
            return BrainOut("Всегда пожалуйста! Обращайтесь 🏠", updated = c)
        }

        var changed = false
        val mRooms = roomRegex.find(lower)
        if (mRooms != null) {
            val rv = roomValue(mRooms.value)
            if (rv != null) {
                c.rooms = rv
                changed = true
            }
        }
        if (c.maxPrice == null) {
            val mp = priceValue(clean)
            if (mp != null) {
                c.maxPrice = mp
                changed = true
            }
        } else {
            val mp2 = priceValue(clean)
            if (mp2 != null && mp2 != c.maxPrice) {
                c.maxPrice = mp2
                changed = true
            }
        }
        val d = districtValue(lower)
        if (d != null) {
            if (d == "СПАЛЬНЫЙ") c.excludeDistrict = "Центр"
            else c.district = d
            changed = true
        }
        val mk = keywordValue(clean)
        if (mk != null) {
            c.keywords = (c.keywords + mk).distinct()
            changed = true
        }
        val area0 = areaValue(lower)
        if (area0 != null) {
            c.minArea = area0.first
            c.maxArea = area0.second
            changed = true
        }
        val src = sourceValue(lower)
        if (src != null) {
            c.source = src
            changed = true
        }
        if (lower.contains("дешев") || lower.contains("бюджетн")) {
            c.order = "price"
            changed = true
        }

        if (!changed) {
            return BrainOut(
                "Разобрал не всё 🤖. Робот понимает: количество комнат (2 комнаты, двушка, трёшка), бюджет (до 5 млн), район (центр, ленинский…), площадь (от 45 метров), пожелания (ремонт, балкон, метро, парк, школа, детский сад, новостройка) и площадку (домклик, m2).",
                updated = c
            )
        }

        val missing = c.missingText()
        if (missing != null) {
            return BrainOut(missing, updated = c)
        }

        val all = db.search(c)
        if (all.isEmpty()) {
            return BrainOut(
                "К сожалению, точных совпадений нет. Попробуйте ослабить критерии: увеличить бюджет, другой район или площадку. Могу также показать всё, что есть рядом.",
                updated = c
            )
        }
        val top = all.take(6).map { it.apartment }
        val money = formatPrice(c.maxPrice ?: 0L)
        val summary = buildString {
            append("Отлично! Подобрал по запросу: ")
            append(c.rooms?.let { "${pluralRooms(it)}" } ?: "")
            if (c.district != null) append(", район ${c.district}")
            if (c.excludeDistrict != null) append(", не центр")
            if (c.maxPrice != null) append(", бюджет до $money")
            if (c.minArea != null) append(", от ${c.minArea?.toInt()} м²")
            if (c.keywords.isNotEmpty()) append(", ${c.keywords.joinToString(", ")}")
            append(". Всего подходящих: ${all.size}.")
            if (all.isNotEmpty()) append("\n\nТоп варианты: ")
        }
        val topText = top.take(3).joinToString("\n\n") { fmtShort(it) }
        return BrainOut(summary + topText, results = top, updated = c)
    }

    private fun isGreeting(lower: String): Boolean =
        listOf("привет", "здравствуй", "добрый день", "хай", "приветствую", "ку").any { lower.contains(it) }

    private val roomRegex = Regex("""(\d+\s*[- ]?\s*комнат(?:ы|а)?|однушк\w*|двушк\w*|трёшк\w*|трешк\w*|четырёх|студ(?:ия|ию))""")

    private fun roomValue(s: String): Int? = when {
        s.contains("однушк") -> 1
        s.contains("двушк") -> 2
        s.contains("трёшк") || s.contains("трешк") -> 3
        s.contains("четырёх") -> 4
        s.contains("студ") -> 1
        else -> {
            val n = Regex("""(\d+)\s*[- ]?комнат""").find(s)?.groupValues?.get(1)?.toIntOrNull()
            n
        }
    }

    private fun priceValue(s: String): Long? {
        val lower = s.lowercase(Locale.getDefault())
        val milRegex = Regex("""(\d[\d\s]*)\s*миллион\w*|(\d[\d\s]*)\s*млн""")
        val m = milRegex.find(lower) ?: run {
            Regex("""(\d[\d\s]*)\s*м\b""").find(lower)
        }
        if (m != null) {
            val digits = (m.groupValues[1].ifEmpty { m.groupValues[2] }).replace(Regex("[^0-9]"), "")
            val num = digits.toLongOrNull() ?: return null
            if (num <= 1000) return num * 1_000_000 else return num
        }
        val full = Regex("""(?:до|около|примерно|~)?\s*([1-9][\d\s]{6,})""").find(lower)?.groupValues?.get(1)
            ?.replace(Regex("[^0-9]"), "")?.toLongOrNull()
        return full
    }

    private fun districtValue(lower: String): String? {
        if (lower.contains("спальн") || lower.contains("спальник") || lower.contains("не центр") || lower.contains("не в центре")) {
            return "СПАЛЬНЫЙ"
        }
        return districtMap.firstOrNull { lower.contains(it.first) }?.second
    }

    private fun keywordValue(s: String): List<String>? {
        val keys = mutableListOf<String>()
        if (containsWord(s, listOf("ремонт", "с ремонтом", "качественный ремонт"))) keys.add("ремонт")
        if (containsWord(s, listOf("балкон", "лоджи"))) keys.add("балкон")
        if (containsWord(s, listOf("метро"))) keys.add("метро рядом")
        if (containsWord(s, listOf("парк", "парком", "зелень"))) keys.add("парк")
        if (containsWord(s, listOf("новостройк", "новостройка"))) keys.add("новостройка")
        if (containsWord(s, listOf("гардеробн"))) keys.add("гардеробная")
        if (containsWord(s, listOf("тих", "спокойн"))) keys.add("тихо")
        if (containsWord(s, listOf("школ", "лицей", "гимнази"))) keys.add("школа рядом")
        if (containsWord(s, listOf("детский сад", "детсад", "садик"))) keys.add("детский сад")
        if (containsWord(s, listOf("поликлиник", "медицинск", "больниц"))) keys.add("медицина рядом")
        if (containsWord(s, listOf("магазин", "торговый центр", "тц"))) keys.add("магазины рядом")
        if (containsWord(s, listOf("спорт", "фитнес", "стадион"))) keys.add("спорт рядом")
        if (containsWord(s, listOf("транспорт", "остановк", "автобус"))) keys.add("транспорт рядом")
        if (containsWord(s, listOf("вторичк", "вторичное жилье"))) keys.add("вторичка")
        if (containsWord(s, listOf("инвестор", "инвестиц", "под сдачу", "сдавать"))) keys.add("инвестиции")
        if (containsWord(s, listOf("для студента", "студентам", "студенту"))) keys.add("студентам")
        return if (keys.isEmpty()) null else keys
    }

    private fun areaValue(lower: String): Pair<Double?, Double?>? {
        val from = Regex("""(?:от|не меньше|не менее)\s*(\d{2,3})\s*м""").find(lower)?.groupValues?.get(1)?.toDoubleOrNull()
        val to = Regex("""(?:до|не больше|не более)\s*(\d{2,3})\s*м""").find(lower)?.groupValues?.get(1)?.toDoubleOrNull()
        val range = Regex("""(\d{2,3})\s*[-–]\s*(\d{2,3})\s*м""").find(lower)
        if (range != null) return range.groupValues[1].toDouble() to range.groupValues[2].toDouble()
        if (from != null || to != null) return from to to
        return null
    }

    private fun sourceValue(lower: String): String? = when {
        lower.contains("домклик") || lower.contains("дом клик") -> "ДомКлик"
        lower.contains("дом.рф") || lower.contains("дом рф") || lower.contains("домрф") -> "Дом.РФ"
        lower.contains("m2") || lower.contains("м2") -> "M2.ru"
        else -> null
    }

    private fun containsWord(s: String, words: List<String>): Boolean {
        val lower = s.lowercase(Locale.getDefault())
        return words.any { lower.contains(it.lowercase(Locale.getDefault())) }
    }

    private fun pluralRooms(n: Int): String = when (n) {
        1 -> "1-комнатную квартиру"
        2 -> "2-комнатную квартиру"
        3 -> "3-комнатную квартиру"
        4 -> "4-комнатную квартиру"
        else -> "$n комнат"
    }

    fun fmtShort(a: Apartment): String =
        "${emojiRooms(a.rooms)} ${a.rooms}-комн., ${a.area.toInt()} м², ${a.district}, ${a.address}\n" +
            "   💰 ${formatPrice(a.price)} • ${a.source} • совпадение по вашим критериям"

    private fun emojiRooms(rooms: Int): String = when (rooms) {
        1 -> "🏠"
        2 -> "🏡"
        else -> "🏘️"
    }

    companion object {
        fun formatPrice(v: Long): String {
            val s = v.toString().reversed().chunked(3).joinToString(" ").reversed()
            return "$s ₽"
        }
    }
}