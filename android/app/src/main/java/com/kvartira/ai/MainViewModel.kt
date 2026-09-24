package com.kvartira.ai

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kvartira.ai.ai.LocalBrain
import com.kvartira.ai.data.Apartment
import com.kvartira.ai.data.ApartmentDb
import com.kvartira.ai.data.ChatMessage
import com.kvartira.ai.data.Criteria
import com.kvartira.ai.net.ListingScraper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class UiState(
    val chat: List<ChatMessage> = emptyList(),
    val criteria: Criteria = Criteria(),
    val allListings: List<Apartment> = emptyList(),
    val favorites: List<Apartment> = emptyList(),
    val history: List<String> = emptyList(),
    val autoScan: Boolean = true,
    val scraperNote: String = "",
    val working: Boolean = false
)

class MainViewModel(app: Application) : AndroidViewModel(app) {

    private val db = ApartmentDb(app)
    private val brain = LocalBrain(db)

    private val _ui = MutableStateFlow(UiState())
    val ui: StateFlow<UiState> = _ui.asStateFlow()

    private val prefs = app.getSharedPreferences("settings", Context.MODE_PRIVATE)

    init {
        _ui.update {
            it.copy(
                allListings = db.readAll(),
                favorites = db.getFavorites(),
                history = db.getHistory(),
                autoScan = prefs.getBoolean("autoscan", true),
                chat = listOf(
                    ChatMessage(text = "Привет! Я AI Застройщик — ваш помощник для поиска жилья.\n" +
                        "Сам сканирую площадки (Циан, M2.ru, Дом.РФ, ДомКлик) и подбираю по чётким правилам.\n" +
                        "Напишите одной строкой: город, комнаты, бюджет и что нужно рядом (парк, школа, метро).", fromUser = false)
                )
            )
        }
    }

    fun sendMessage(text: String) {
        val t = text.trim()
        if (t.isEmpty()) return
val userMsg = ChatMessage(text = t, fromUser = true)
        _ui.update {
            it.copy(
                chat = it.chat + userMsg,
                working = true
            )
        }
        db.addHistory(t)
        _ui.update { it.copy(history = db.getHistory()) }
        viewModelScope.launch {
            val brainOut = withContext(Dispatchers.Default) { brain.process(t, _ui.value.criteria) }
            val st = _ui.value
            // Робот-автоматизатор: отвечает сразу по локальным правилам,
            // а свежие объявления с площадок тихо подтягивает в фоне.
            val replyText = brainOut.text
            _ui.update {
                it.copy(
                    chat = it.chat + ChatMessage(text = replyText, fromUser = false, apartments = brainOut.results),
                    criteria = Criteria().apply {
                        rooms = brainOut.updated.rooms
                        maxPrice = brainOut.updated.maxPrice
                        district = brainOut.updated.district
                        minArea = brainOut.updated.minArea
                        maxArea = brainOut.updated.maxArea
                        keywords = brainOut.updated.keywords
                        source = brainOut.updated.source
                        excludeDistrict = brainOut.updated.excludeDistrict
                    },
                    allListings = if (brainOut.results.isNotEmpty()) {
                        val ids = brainOut.results.map { it.id }
                        (brainOut.results + it.allListings.filter { l -> l.id !in ids })
                    } else it.allListings,
                    working = false,
                    favorites = db.getFavorites()
                )
            }
            if (st.autoScan) {
                viewModelScope.launch {
                    val res = ListingScraper.scrape()
                    withContext(Dispatchers.IO) { db.insertScraped(res.list) }
                    val loaded = withContext(Dispatchers.IO) { db.readAll() }
                    _ui.update { it.copy(allListings = loaded) }
                }
            }
        }
    }

    fun refreshListings() {
        _ui.update { it.copy(working = true) }
        viewModelScope.launch {
            val res = ListingScraper.scrape()
            withContext(Dispatchers.IO) { db.insertScraped(res.list) }
            val loaded = withContext(Dispatchers.IO) { db.readAll() }
            _ui.update { it.copy(working = false, allListings = loaded, scraperNote = res.message) }
        }
    }

    fun toggleFavorite(apt: Apartment) {
        val isFav = db.isFavorite(apt.id)
        db.toggleFavorite(apt.id, !isFav)
        _ui.update { it.copy(favorites = db.getFavorites()) }
    }

    fun saveRobot(auto: Boolean) {
        prefs.edit().putBoolean("autoscan", auto).apply()
        _ui.update { it.copy(autoScan = auto) }
    }

    fun selectAppartmentAsRequest(apt: Apartment) {
        sendMessage("покажи похожие на ${apt.rooms}-комнатную в районе ${apt.district}")
    }
}