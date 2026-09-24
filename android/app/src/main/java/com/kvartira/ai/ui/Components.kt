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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
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

@Composable
fun AxisLogo(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(38.dp)
            .background(Axis.GreenLight, RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "AXIS",
                color = Axis.Ink,
                fontWeight = FontWeight.Black,
                fontSize = 11.sp,
                letterSpacing = 0.5.sp
            )
            Box(
                Modifier
                    .size(4.dp)
                    .background(Axis.GreenBright, CircleShape)
            )
        }
    }
}

@Composable
fun AxisTopBar(
    title: String,
    subtitle: String = "",
    actions: @Composable RowScope.() -> Unit = {}
) {
    Surface(color = MaterialTheme.colorScheme.primary, shadowElevation = 8.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AxisLogo()
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                if (subtitle.isNotBlank()) {
                    Text(
                        subtitle,
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 12.sp
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, content = actions)
        }
    }
}

@Composable
fun SourceBadge(source: String) {
    val (bg, fg) = when (source) {
        "M2.ru" -> Axis.M2Bg to Axis.M2
        "ДомКлик" -> Axis.DomClickBg to Axis.DomClick
        "Дом.РФ" -> Axis.DomRfBg to Axis.DomRf
        "Циан" -> Axis.CianBg to Axis.Cian
        else -> Axis.BaseBg to Axis.Base
    }
    Surface(color = bg, shape = CircleShape) {
        Text(
            text = source,
            color = fg,
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
                tint = if (isFavorite) Color(0xFFFF5252) else Axis.Ink,
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

@Composable
fun ApartmentCard(
    apartment: Apartment,
    isFavorite: Boolean,
    percent: Int? = null,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit = {}
) {
    val cardShape = RoundedCornerShape(18.dp)
    Surface(
        shape = cardShape,
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column {
            // Фото-плашка
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(104.dp)
                    .background(
                        Brush.linearGradient(listOf(Axis.GreenLight, Axis.GreenBright))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text("🏙", fontSize = 42.sp)
                Surface(
                    color = Color.White.copy(alpha = 0.92f),
                    shape = CircleShape,
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .padding(end = 8.dp)
                        .size(40.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = "${apartment.rooms}",
                            fontWeight = FontWeight.Black,
                            fontSize = 16.sp,
                            color = Axis.Green
                        )
                    }
                }
            }
            Column(Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = Axis.GreenPale,
                        shape = CircleShape,
                        modifier = Modifier.padding(end = 6.dp)
                    ) {
                        Text(
                            text = "${LocalBrain.formatPrice(apartment.price)}",
                            color = Axis.Green,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    FavoriteButton(isFavorite = isFavorite, onToggleFavorite = onToggleFavorite)
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "${apartment.rooms}-комн., ${apartment.area.toInt()} м²",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "${apartment.district} • ${apartment.address}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 11.5.sp,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                if (apartment.description.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = apartment.description,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.78f),
                        fontSize = 12.sp,
                        maxLines = 2,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
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
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = CircleShape
                            ) {
                                Text(
                                    f,
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (percent != null) {
                        Text(
                            text = "$percent%",
                            color = Axis.GreenBright,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 13.sp
                        )
                        Spacer(Modifier.width(6.dp))
                    }
                    Text(
                        text = "${apartment.source}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 10.5.sp
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        text = "${apartment.floor}/${apartment.totalFloors} эт",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 10.5.sp
                    )
                }
            }
        }
    }
}