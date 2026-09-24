package com.kvartira.ai.data

data class Apartment(
    val id: Long,
    val source: String,
    val rooms: Int,
    val district: String,
    val address: String,
    val price: Long,
    val area: Double,
    val floor: Int,
    val totalFloors: Int,
    val description: String,
    val features: List<String>,
    val url: String,
    val updatedAt: Long
) {
    val pricePerMeter: Long get() = if (area > 0) (price / area).toLong() else 0
}

data class Criteria(
    var rooms: Int? = null,
    var maxPrice: Long? = null,
    var district: String? = null,
    var minArea: Double? = null,
    var maxArea: Double? = null,
    var keywords: List<String> = emptyList(),
    var source: String? = null,
    var excludeDistrict: String? = null,
    var order: String = "score"
) {
    fun isComplete(): Boolean = rooms != null && maxPrice != null

    fun missingText(): String? = when {
        rooms == null -> "Сколько комнат вам нужно? (например: 2 комнаты)"
        maxPrice == null -> "Какой у вас бюджет? (например: до 5 млн)"
        else -> null
    }

    fun copyOf() = Criteria(
        rooms, maxPrice, district, minArea, maxArea,
        keywords.toList(), source, excludeDistrict, order
    )
}

data class ChatMessage(
    val id: Long = System.nanoTime(),
    val text: String,
    val fromUser: Boolean,
    val apartments: List<Apartment> = emptyList()
)

data class Match(
    val apartment: Apartment,
    val score: Int,
    val maxScore: Int
) {
    val percent: Int get() = if (maxScore > 0) ((score * 100) / maxScore) else 0
}