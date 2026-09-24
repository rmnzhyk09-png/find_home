package com.kvartira.ai.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kvartira.ai.ai.LocalBrain
import com.kvartira.ai.data.Apartment
import kotlinx.coroutines.delay

fun openApartment(context: android.content.Context, a: Apartment) {
    if (a.url.isNotBlank()) openUrl(context, a.url)
}

fun openUrl(context: android.content.Context, url: String) {
    if (url.isNotBlank()) {
        val i = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        i.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(i)
    }
}

/** Плавное появление с подъёмом. Слегка уступает по порядку — каскад. */
@Composable
fun AxisEnter(index: Int = 0, modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    val p = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay((index * 50L).coerceAtMost(480L))
        p.animateTo(1f, animationSpec = tween(420, easing = FastOutSlowInEasing))
    }
    Box(
        modifier = modifier.graphicsLayer {
            alpha = p.value
            translationY = (1f - p.value) * 24.dp.toPx()
            scaleX = 0.96f + 0.04f * p.value
            scaleY = 0.96f + 0.04f * p.value
        },
        content = content
    )
}

/** Тёмная шапка с центральной светлой пилюлей (как в макете). */
@Composable
fun AxisTopBar(
    actions: @Composable RowScope.() -> Unit = {}
) {
    Surface(color = Axis.Dark, shadowElevation = 8.dp) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .background(Axis.Light, CircleShape)
                    .padding(horizontal = 34.dp, vertical = 8.dp)
            ) {
                Text(
                    "AI Застройщик",
                    color = Axis.Ink,
                    fontWeight = FontWeight.Medium,
                    fontSize = 20.sp
                )
            }
            Row(
                modifier = Modifier.align(Alignment.CenterEnd),
                verticalAlignment = Alignment.CenterVertically,
                content = actions
            )
        }
    }
}

@Composable
fun SourceBadge(source: String) {
    Surface(color = Color.White.copy(alpha = 0.92f), shape = CircleShape) {
        Text(
            text = source,
            color = Axis.Ink,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
        )
    }
}

@Composable
private fun FavoriteButton(
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit
) {
    var pulse by remember { mutableStateOf(false) }
    LaunchedEffect(isFavorite) {
        if (isFavorite) {
            pulse = true
            delay(280)
            pulse = false
        }
    }
    val scale by animateFloatAsState(
        targetValue = if (pulse) 1.35f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "favScale"
    )
    Surface(
        color = Color.White.copy(alpha = 0.92f),
        shape = CircleShape,
        shadowElevation = 4.dp,
        modifier = Modifier
            .size(34.dp)
            .clickable { onToggleFavorite() }
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                contentDescription = if (isFavorite) "Убрать из избранного" else "В избранное",
                tint = if (isFavorite) Axis.Heart else Axis.Ink,
                modifier = Modifier
                    .size(21.dp)
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                    }
            )
        }
    }
}

/** Карточка по макету: салатовый корпус + тёмная полоса цены. */
@Composable
fun ApartmentCard(
    apartment: Apartment,
    isFavorite: Boolean,
    percent: Int? = null,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit = {}
) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = Axis.Light,
        shadowElevation = 3.dp,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                SourceBadge(apartment.source)
                Spacer(Modifier.weight(1f))
                FavoriteButton(isFavorite = isFavorite, onToggleFavorite = onToggleFavorite)
            }
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${apartment.rooms}-комн., ${apartment.area.toInt()} м²",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 19.sp,
                    color = Axis.Ink
                )
                if (percent != null) {
                    Spacer(Modifier.width(8.dp))
                    Surface(color = Color.White.copy(alpha = 0.85f), shape = CircleShape) {
                        Text(
                            text = "$percent%",
                            color = Axis.Ink,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = "${apartment.district} • ${apartment.address}",
                color = Axis.Muted,
                fontSize = 13.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (apartment.description.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = apartment.description,
                    color = Axis.Text,
                    fontSize = 13.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (apartment.features.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    apartment.features.take(5).forEach { f ->
                        Surface(
                            color = Color.White.copy(alpha = 0.6f),
                            shape = CircleShape
                        ) {
                            Text(
                                f,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Axis.Ink,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Surface(
                color = Axis.Dark,
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 13.dp)
                ) {
                    Text(
                        text = LocalBrain.formatPrice(apartment.price),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        color = Color.White
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(
                        text = "≈ ${LocalBrain.formatPrice(apartment.pricePerMeter)}/м²",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        text = "→",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }
            }
        }
    }
}
