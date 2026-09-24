package com.kvartira.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
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
        Tab("Чат", Icons.AutoMirrored.Filled.Send),
        Tab("Каталог", Icons.Default.Home),
        Tab("Избранное", Icons.Default.FavoriteBorder),
        Tab("История", Icons.Default.DateRange)
    )

    if (settingsOpen) {
        SettingsDialog(vm, onClose = { settingsOpen = false })
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                tabs.forEachIndexed { i, t ->
                    NavigationBarItem(
                        selected = tabIndex == i,
                        onClick = { tabIndex = i },
                        icon = { Icon(t.icon, contentDescription = t.label) },
                        label = { Text(t.label, fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.onPrimary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primary,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }
        }
    ) { pad ->
        Box(
            Modifier
                .fillMaxSize()
                .padding(pad)
        ) {
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
    }
}