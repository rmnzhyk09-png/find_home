package com.kvartira.ai.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kvartira.ai.data.Apartment

@Composable
fun FavoritesScreen(
    favorites: List<Apartment>,
    favoritesIds: Set<Long>,
    onToggleFavorite: (Apartment) -> Unit,
    onOpen: (String) -> Unit
) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            AxisTopBar()
        }
    ) { pad ->
        if (favorites.isEmpty()) {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(pad),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier
                            .size(96.dp)
                            .background(Axis.Lighter, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🏙", fontSize = 46.sp)
                    }
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Здесь появятся понравившиеся квартиры",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Жмите ♥ на карточке в каталоге или в ответах чата.",
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(pad)
                    .padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(favorites, key = { it.id }) { apt ->
                    AxisEnter {
                        ApartmentCard(
                            apartment = apt,
                            isFavorite = favoritesIds.contains(apt.id),
                            onToggleFavorite = { onToggleFavorite(apt) },
                            onClick = { if (apt.url.isNotBlank()) onOpen(apt.url) }
                        )
                    }
                }
            }
        }
    }
}