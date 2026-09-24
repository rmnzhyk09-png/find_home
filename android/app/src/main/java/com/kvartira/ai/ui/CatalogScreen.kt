package com.kvartira.ai.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kvartira.ai.data.Apartment
import com.kvartira.ai.data.Criteria

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CatalogScreen(
    allListings: List<Apartment>,
    favorites: Set<Long>,
    working: Boolean,
    note: String,
    criteria: Criteria,
    onRefresh: () -> Unit,
    onToggleFavorite: (Apartment) -> Unit
) {
    var query by remember { mutableStateOf("") }
    var roomFilter by remember { mutableStateOf<Int?>(null) }
    var sortPriceAsc by remember { mutableStateOf(false) }
    val ctx = LocalContext.current

    val base = remember(allListings, criteria) {
        if (criteria.rooms != null || criteria.maxPrice != null) {
            com.kvartira.ai.data.ApartmentDb(ctx).search(criteria).map { it.apartment }
        } else allListings
    }

    val filtered = remember(base, query, roomFilter, sortPriceAsc) {
        base.filter { a ->
            (query.isBlank() || "$a.district ${a.address} ${a.description} ${a.features.joinToString(" ")}"
                .contains(query, ignoreCase = true))
                    && (roomFilter == null || a.rooms == (roomFilter ?: 0) || (roomFilter == 4 && a.rooms >= 4))
        }.let { list ->
            if (sortPriceAsc) list.sortedBy { it.price } else list
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            AxisTopBar(
                title = "Каталог",
                subtitle = note.ifBlank { "Объявления с площадок и базы" },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Загрузить с площадок", tint = Color.White)
                    }
                }
            )
        }
    ) { pad ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(pad)
                .padding(horizontal = 12.dp)
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Поиск по адресу, району, фичам…", fontSize = 14.sp) },
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )
            Spacer(Modifier.height(6.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                listOf(null to "Все", 1 to "1", 2 to "2", 3 to "3", 4 to "4+").forEach { (r, label) ->
                    FilterChip(
                        selected = roomFilter == r,
                        onClick = { roomFilter = r },
                        label = { Text(label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = Color.White,
                            containerColor = MaterialTheme.colorScheme.surface,
                            labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
                FilterChip(
                    selected = sortPriceAsc,
                    onClick = { sortPriceAsc = !sortPriceAsc },
                    label = { Text("Цена ↑", fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = Color.White,
                        containerColor = MaterialTheme.colorScheme.surface,
                        labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
            Spacer(Modifier.height(8.dp))
            if (working) {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(modifier = Modifier.padding(top = 40.dp))
                }
            }
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filtered, key = { it.id }) { apt ->
                    AxisEnter {
                        ApartmentCard(
                            apartment = apt,
                            isFavorite = favorites.contains(apt.id),
                            onToggleFavorite = { onToggleFavorite(apt) },
                            onClick = { if (apt.url.isNotBlank()) {
                                ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(apt.url)))
                            } }
                        )
                    }
                }
                if (filtered.isEmpty() && !working) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                "Пока пусто. Нажмите 🔄, или начните диалог в чате — робот подберёт.",
                                modifier = Modifier.padding(16.dp),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}