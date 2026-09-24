package com.kvartira.ai.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class ApartmentDb(context: Context) :
    SQLiteOpenHelper(context.applicationContext, "kvartira.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """CREATE TABLE apartments(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                rooms INTEGER NOT NULL,
                district TEXT,
                address TEXT,
                price INTEGER NOT NULL,
                area REAL,
                floor_i INTEGER,
                floors_t INTEGER,
                description TEXT,
                features TEXT,
                url TEXT,
                updated INTEGER
            )"""
        )
        db.execSQL(
            """CREATE TABLE favorites(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                apt_id INTEGER UNIQUE,
                created INTEGER
            )"""
        )
        db.execSQL(
            """CREATE TABLE history(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT,
                created INTEGER
            )"""
        )
        seed(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    private fun seed(db: SQLiteDatabase) {
        val seed = listOf(
            A("M2.ru", 1, "Центр", "ул. Ленина, 12", 4_500_000, 38.0, 5, 9,
                "Уютная студия в самом центре, метро в 3 минутах.", listOf("ремонт", "балкон", "метро рядом"), "https://www.m2.ru/kupit-kvartiru/"),
            A("M2.ru", 2, "Центр", "Красный проспект, 31", 6_800_000, 52.0, 3, 12,
                "Евродвушка с премиальным ремонтом, вид на парк.", listOf("ремонт", "кухня-гостиная", "парк"), "https://www.m2.ru/kupit-kvartiru/"),
            A("M2.ru", 3, "Ленинский", "ул. Титова, 5", 9_500_000, 78.0, 8, 14,
                "Просторная трёшка для семьи, тихий двор.", listOf("2 балкона", "гардеробная", "ремонт"), "https://www.m2.ru/kupit-kvartiru/"),
            A("ДомКлик", 1, "Заельцовский", "ул. Дуси Ковальчук, 270", 3_900_000, 35.0, 7, 10,
                "Недорогая однушка рядом с парком, свежая отделка.", listOf("балкон", "парк", "новостройка"), "https://domclick.ru/"),
            A("ДомКлик", 2, "Октябрьский", "ул. Кирова, 25", 5_600_000, 49.0, 4, 16,
                "Двушка со свободной планировкой, дом клубный тип.", listOf("огромная кухня", "двор без машин", "новостройка"), "https://domclick.ru/"),
            A("ДомКлик", 2, "Центр", "ул. Советская, 8", 7_100_000, 55.0, 2, 7,
                "Вторичка в кирпичном доме, капитальный ремонт.", listOf("кирпичный дом", "ремонт", "центр"), "https://domclick.ru/"),
            A("ДомКлик", 3, "Первомайский", "ул. Одоевского, 16", 8_200_000, 74.0, 9, 18,
                "Трёшка с двумя санузлами, панорамные окна.", listOf("2 санузла", "панорамные окна"), "https://domclick.ru/"),
            A("Дом.РФ", 2, "Академгородок", "пр. Ак. Лаврентьева, 18", 6_200_000, 53.0, 6, 12,
                "Семейная двушка в наукограде, школа во дворе.", listOf("школа рядом", "детский сад", "тихо"), "https://www.дом.рф/"),
            A("Дом.РФ", 3, "Ленинский", "Морской проспект, 9", 9_000_000, 82.0, 11, 20,
                "Большая трёшка с двумя лоджиями и гардеробной.", listOf("2 лоджии", "гардеробная"), "https://www.дом.рф/"),
            A("Дом.РФ", 1, "Октябрьский", "ул. Семьи Шамшиных, 44", 3_200_000, 33.0, 1, 5,
                "Компактная однушка для инвестора, сдаётся в аренду.", listOf("инвестиции", "низкая цена"), "https://www.дом.рф/"),
            A("База", 1, "Центр", "ул. Гоголя, 40", 2_900_000, 30.0, 6, 12,
                "Бюджетная студия под сдачу, ликвидная локация.", listOf("недорого", "куплю/сдам"), ""),
            A("База", 2, "Заельцовский", "ул. Кропоткина, 55", 4_800_000, 47.0, 3, 9,
                "Двушка с балконом и кладовкой, добротная советская планировка.", listOf("балкон", "кладовка"), ""),
            A("База", 2, "Ленинский", "ул. Немировича-Данченко, 104", 5_300_000, 51.0, 10, 17,
                "Новостройка сдача в этом году, до метро пешком 7 минут.", listOf("новостройка", "метро рядом", "отделка"), ""),
            A("База", 3, "Октябрьский", "ул. Бориса Богаткова, 18", 7_600_000, 70.0, 5, 11,
                "Светлая трёшка, две спальни + гостиная, ремонт от застройщика.", listOf("ремонт", "две спальни"), ""),
            A("База", 4, "Первомайский", "ул. Выборная, 99", 10_500_000, 96.0, 14, 24,
                "Четырёхкомнатная квартира для большой семьи.", listOf("4 комнаты", "гардеробная", "2 санузла"), ""),
            A("База", 2, "Академгородок", "ул. Терешковой, 3", 3_500_000, 40.0, 2, 6,
                "Двушка возле НГУ, идеальна для сдачи студентам.", listOf("студентам", "недорого"), "")
        )
        for (a in seed) insert(db, a)
    }

    private fun A(
        source: String, rooms: Int, district: String, address: String, price: Long,
        area: Double, floor: Int, total: Int, desc: String, features: List<String>, url: String
    ) = Apartment(0, source, rooms, district, address, price, area, floor, total, desc, features, url, System.currentTimeMillis())

    private fun insert(db: SQLiteDatabase, a: Apartment) {
        val cv = ContentValues().apply {
            put("source", a.source)
            put("rooms", a.rooms)
            put("district", a.district)
            put("address", a.address)
            put("price", a.price)
            put("area", a.area)
            put("floor_i", a.floor)
            put("floors_t", a.totalFloors)
            put("description", a.description)
            put("features", a.features.joinToString(","))
            put("url", a.url)
            put("updated", a.updatedAt)
        }
        db.insert("apartments", null, cv)
    }

    @Synchronized
    fun insertScraped(list: List<Apartment>) {
        val db = writableDatabase
        for (a in list) {
            val existing = db.query(
                "apartments", arrayOf("id"), "url = ? AND source = ?",
                arrayOf(a.url, a.source), null, null, null
            ).use { it.moveToFirst() }
            if (!existing) insert(db, a.copy(id = 0))
        }
    }

    fun getById(id: Long): Apartment? {
        val db = readableDatabase
        return db.query("apartments", null, "id = ?", arrayOf(id.toString()), null, null, null).use { c ->
            if (c.moveToFirst()) rowToApartment(c) else null
        }
    }

    fun getFavorites(): List<Apartment> {
        val db = readableDatabase
        return db.rawQuery(
            "SELECT a.* FROM apartments a INNER JOIN favorites f ON f.apt_id = a.id ORDER BY f.created DESC", null
        ).use { c ->
            buildList {
                while (c.moveToNext()) add(rowToApartment(c))
            }
        }
    }

    @Synchronized
    fun toggleFavorite(aptId: Long, on: Boolean) {
        val db = writableDatabase
        if (on) {
            db.execSQL("INSERT OR IGNORE INTO favorites(apt_id, created) VALUES (?, ?)", arrayOf(aptId, System.currentTimeMillis()))
        } else {
            db.delete("favorites", "apt_id = ?", arrayOf(aptId.toString()))
        }
    }

    fun isFavorite(aptId: Long): Boolean {
        val db = readableDatabase
        return db.query("favorites", arrayOf("id"), "apt_id = ?", arrayOf(aptId.toString()), null, null, null).use { it.count > 0 }
    }

    @Synchronized
    fun addHistory(text: String) {
        val cv = ContentValues().apply {
            put("text", text)
            put("created", System.currentTimeMillis())
        }
        writableDatabase.insert("history", null, cv)
        writableDatabase.execSQL("DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 50)")
    }

    fun getHistory(): List<String> {
        val db = readableDatabase
        return db.rawQuery("SELECT text FROM history ORDER BY id DESC LIMIT 50", null).use { c ->
            buildList {
                while (c.moveToNext()) add(c.getString(0))
            }
        }
    }

    fun search(criteria: Criteria): List<Match> {
        val all = readAll()
        val r = criteria.rooms
        val mp = criteria.maxPrice
        val ds = criteria.district
        val ed = criteria.excludeDistrict
        val mnA = criteria.minArea
        val mxA = criteria.maxArea
        val src = criteria.source
        val maxScore = 3 + 3 + 2 + minOf(4, criteria.keywords.size) + (if (src != null) 1 else 0)
        return all.mapNotNull { a ->
            var sc = 0
            if (ed != null && a.district.equals(ed, true)) {
                return@mapNotNull null
            }
            if (r != null && a.rooms == r) sc += 3
            if (mp != null) {
                if (a.price <= mp) sc += 3
                else if (a.price <= (mp * 1.2)) sc += 1
            }
            if (ds != null && a.district.equals(ds, true)) sc += 2
            if (mnA != null && a.area >= mnA) sc += 1
            if (mxA != null && a.area <= mxA) sc += 1
            criteria.keywords.forEach { kw ->
                val kwLower = kw.lowercase()
                if (a.description.lowercase().contains(kwLower) || a.features.any { it.lowercase().contains(kwLower) }) sc += 1
            }
            if (src != null && a.source.equals(src, true)) sc += 1
            if (sc > 0) Match(a, sc, maxScore) else null
        }.sortedWith(
            compareByDescending<Match> { it.score }.thenByDescending { it.apartment.updatedAt }
        )
    }

    fun readAll(): List<Apartment> {
        val db = readableDatabase
        return db.query("apartments", null, null, null, null, null, "price ASC").use { c ->
            buildList {
                while (c.moveToNext()) add(rowToApartment(c))
            }
        }
    }

    private fun rowToApartment(c: android.database.Cursor): Apartment = Apartment(
        id = c.getLong(c.getColumnIndexOrThrow("id")),
        source = c.getString(c.getColumnIndexOrThrow("source")),
        rooms = c.getInt(c.getColumnIndexOrThrow("rooms")),
        district = c.getString(c.getColumnIndexOrThrow("district")) ?: "",
        address = c.getString(c.getColumnIndexOrThrow("address")) ?: "",
        price = c.getLong(c.getColumnIndexOrThrow("price")),
        area = c.getDouble(c.getColumnIndexOrThrow("area")),
        floor = c.getInt(c.getColumnIndexOrThrow("floor_i")),
        totalFloors = c.getInt(c.getColumnIndexOrThrow("floors_t")),
        description = c.getString(c.getColumnIndexOrThrow("description")) ?: "",
        features = (c.getString(c.getColumnIndexOrThrow("features")) ?: "").split(",").filter { it.isNotBlank() },
        url = c.getString(c.getColumnIndexOrThrow("url")) ?: "",
        updatedAt = c.getLong(c.getColumnIndexOrThrow("updated"))
    )
}