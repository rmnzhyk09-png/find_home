package com.kvartira.ai.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Палитра с макета пользователя: тёмно-зелёная шапка, салатовые карточки. */
object Axis {
    val Dark = Color(0xFF0C5C21)
    val DarkDeep = Color(0xFF073D16)
    val Ink = Color(0xFF0C3D18)
    val Light = Color(0xFF9CCB9B)
    val Lighter = Color(0xFFB7DDB4)
    val Pale = Color(0xFFEDF3E6)
    val Text = Color(0xFF14331D)
    val Muted = Color(0xFF5F7261)
    val Heart = Color(0xFFE0393E)
    val White = Color(0xFFFFFFFF)
}

private val LightColors = lightColorScheme(
    primary = Axis.Dark,
    onPrimary = Color.White,
    primaryContainer = Axis.Light,
    onPrimaryContainer = Axis.Ink,
    secondary = Axis.Dark,
    onSecondary = Color.White,
    secondaryContainer = Axis.Lighter,
    onSecondaryContainer = Axis.Ink,
    tertiary = Axis.Light,
    onTertiary = Axis.Ink,
    background = Axis.Pale,
    onBackground = Axis.Text,
    surface = Axis.White,
    onSurface = Axis.Text,
    surfaceVariant = Axis.Lighter,
    onSurfaceVariant = Axis.Muted,
    outline = Color(0xFFD9E4D2),
    error = Color(0xFFC0392B),
    onError = Color.White
)

private val DarkColors = darkColorScheme(
    primary = Axis.Light,
    onPrimary = Axis.Ink,
    primaryContainer = Axis.Dark,
    onPrimaryContainer = Color(0xFFD9EBCF),
    secondary = Axis.Light,
    onSecondary = Axis.Ink,
    secondaryContainer = Color(0xFF1E4A2A),
    onSecondaryContainer = Color(0xFFD9EBCF),
    tertiary = Axis.Light,
    onTertiary = Axis.Ink,
    background = Color(0xFF0A140D),
    onBackground = Color(0xFFE4EBE1),
    surface = Color(0xFF122114),
    onSurface = Color(0xFFE4EBE1),
    surfaceVariant = Color(0xFF1E3324),
    onSurfaceVariant = Color(0xFFAAB8AB),
    outline = Color(0xFF2A4432),
    error = Color(0xFFFF8A80),
    onError = Color(0xFF3A0000)
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(12.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

@Composable
fun KvartiraTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    MaterialTheme(
        colorScheme = if (dark) DarkColors else LightColors,
        shapes = AppShapes,
        content = content
    )
}