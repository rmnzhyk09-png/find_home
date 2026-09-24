package com.kvartira.ai.ui

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kvartira.ai.MainViewModel
import com.kvartira.ai.ui.chat.ChatBubble
import kotlin.math.max

private val QuickSuggestions = listOf(
    "2 комнаты, до 6 млн, в центре, рядом парк и школа",
    "3 комнаты до 9 млн рядом метро и детский сад",
    "город Новосибирск, однушка до 3 млн с ремонтом",
    "двушка в Академгородке до 5 млн, тихий двор"
)

@Composable
private fun TypingDots(color: Color, dotSize: androidx.compose.ui.unit.Dp = 5.dp) {
    val infinite = rememberInfiniteTransition(label = "typing")
    val alphas = List(3) { i ->
        infinite.animateFloat(
            initialValue = 0.25f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(360, delayMillis = i * 170), RepeatMode.Reverse),
            label = "dot$i"
        )
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        alphas.forEach { a ->
            Box(Modifier.size(dotSize).background(color.copy(alpha = a.value), CircleShape))
        }
    }
}

@Composable
fun ChatScreen(vm: MainViewModel, onOpenSettings: () -> Unit, onOpenApartmentUrl: (String) -> Unit) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(ui.chat.size) {
        val last = max(0, ui.chat.size - 1)
        listState.animateScrollToItem(last)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            AxisTopBar(
                title = "Робот-автоматизатор",
                subtitle = "Сам сканирует площадки и подбирает жильё",
                actions = {
                    if (ui.scraperNote.isNotBlank()) {
                        IconButton(onClick = { vm.refreshListings() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Обновить площадки", tint = Color.White)
                        }
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Настройки робота", tint = Color.White)
                    }
                }
            )
        },
        bottomBar = {
            Column(Modifier.fillMaxWidth()) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
                if (ui.chat.none { it.fromUser }) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        QuickSuggestions.forEach { s ->
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.clickable {
                                    vm.sendMessage(s)
                                }
                            ) {
                                Text(
                                    s,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                                )
                            }
                        }
                    }
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = input,
                        onValueChange = { input = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Например: город Новосибирск, 2 комнаты, до 6 млн, рядом парк", fontSize = 14.sp) },
                        shape = RoundedCornerShape(16.dp),
                        maxLines = 3
                    )
                    Spacer(Modifier.width(8.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.primary,
                        shape = RoundedCornerShape(16.dp),
                        shadowElevation = 4.dp,
                        modifier = Modifier.align(Alignment.Bottom)
                    ) {
                        IconButton(
                            onClick = {
                                if (input.isNotBlank()) {
                                    vm.sendMessage(input)
                                    input = ""
                                }
                            },
                            enabled = input.isNotBlank() && !ui.working
                        ) {
                            if (ui.working) {
                                TypingDots(color = Color.White)
                            } else {
                                Icon(
                                    Icons.AutoMirrored.Filled.Send,
                                    contentDescription = "Отправить",
                                    tint = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    ) { pad ->
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(pad),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(ui.chat, key = { it.id }) { m ->
                ChatBubble(
                    m = m,
                    onOpenApartmentUrl = onOpenApartmentUrl,
                    onToggleFavorite = { vm.toggleFavorite(it) }
                )
            }
        }
    }
}