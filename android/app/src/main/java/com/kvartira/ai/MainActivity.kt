package com.kvartira.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.kvartira.ai.ui.Axis
import com.kvartira.ai.ui.CatalogScreen
import com.kvartira.ai.ui.ChatScreen
import com.kvartira.ai.ui.FavoritesScreen
import com.kvartira.ai.ui.HistoryScreen
import com.kvartira.ai.ui.KvartiraTheme
import com.kvartira.ai.ui.SettingsDialog
import com.kvartira.ai.ui.openUrl

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KvartiraTheme {
                val vm: MainViewModel = viewModel()
                MainApp(vm)
            }
        }
    }
}

private data class Tab(
    val label: String,
    val icon: ImageVector
)

@Composable
private fun MainApp(vm: MainViewModel) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var tabIndex by remember { mutableStateOf(0) }
    var settingsOpen by remember { mutableStateOf(false) }
    val ctx = LocalContext.current

    val tabs = listOf(
        Tab("Поиск", Icons.Default.Search),
        Tab("Каталог", Icons.Default.Home),
        Tab("Избранное", Icons.Default.Favorite),
        Tab("История", Icons.Default.Person)
    )

    if (settingsOpen) {
        SettingsDialog(vm, onClose = { settingsOpen = false })
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        Box(
            Modifier
                .fillMaxSize()
                .padding(pad)
        ) {
            Box(Modifier.fillMaxSize().padding(bottom = 96.dp)) {
                AnimatedContent(
                    targetState = tabIndex,
                    transitionSpec = {
                        (fadeIn(tween(240)) togetherWith fadeOut(tween(140)))
                    },
                    label = "tab"
                ) { i ->
                    when (i) {
                        0 -> ChatScreen(
                            vm = vm,
                            onOpenSettings = { settingsOpen = true },
                            onOpenApartmentUrl = { url -> openUrl(ctx, url) }
                        )
                        1 -> CatalogScreen(
                            allListings = ui.allListings,
                            favorites = ui.favorites.map { it.id }.toSet(),
                            working = ui.working,
                            note = ui.scraperNote,
                            criteria = ui.criteria,
                            onRefresh = { vm.refreshListings() },
                            onToggleFavorite = { vm.toggleFavorite(it) }
                        )
                        2 -> FavoritesScreen(
                            favorites = ui.favorites,
                            favoritesIds = ui.favorites.map { it.id }.toSet(),
                            onToggleFavorite = { vm.toggleFavorite(it) },
                            onOpen = { url -> openUrl(ctx, url) }
                        )
                        3 -> HistoryScreen(
                            history = ui.history,
                            onPick = { q ->
                                tabIndex = 0
                                vm.sendMessage(q)
                            }
                        )
                    }
                }
            }
            // Плавающая тёмная навигация-пилюля (как в макете)
            Surface(
                color = Axis.Dark,
                shape = CircleShape,
                shadowElevation = 12.dp,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 14.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 22.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    tabs.forEachIndexed { i, t ->
                        val sel = tabIndex == i
                        Surface(
                            color = if (sel) Color.White else Axis.Light,
                            shape = RoundedCornerShape(14.dp),
                            shadowElevation = if (sel) 4.dp else 0.dp,
                            modifier = Modifier
                                .size(width = 56.dp, height = 44.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .clickable { tabIndex = i }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    t.icon,
                                    contentDescription = t.label,
                                    tint = if (i == 2) Axis.Heart else Axis.Dark,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}