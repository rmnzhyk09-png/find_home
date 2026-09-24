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

/** AXIS-палитра из макета Figma (iPhone 16/17 Pro Max). */
object Axis {
    val Green = Color(0xFF116E25)
    val GreenBright = Color(0xFF007C34)
    val GreenLight = Color(0xFF94CD7A)
    val GreenPale = Color(0xFFE7F2DF)
    val Ink = Color(0xFF25412B)
    val Bg = Color(0xFFF3F6F1)
    val Card = Color(0xFFFFFFFF)
    val Border = Color(0xFFDDE5D6)
    val Muted = Color(0xFF68726C)

    val M2 = Color(0xFF1B5E20)
    val M2Bg = Color(0xFFE0F2E6)
    val DomClick = Color(0xFFB3261E)
    val DomClickBg = Color(0xFFFCE8E6)
    val DomRf = Color(0xFF0B57D0)
    val DomRfBg = Color(0xFFE3F0FD)
    val Cian = Color(0xFF116E25)
    val CianBg = Color(0xFFE7F2DF)
    val Base = Color(0xFF5F6368)
    val BaseBg = Color(0xFFE9EDF0)
}

private val LightColors = lightColorScheme(
    primary = Axis.Green,
    onPrimary = Color.White,
    primaryContainer = Axis.GreenPale,
    onPrimaryContainer = Axis.Ink,
    secondary = Axis.GreenBright,
    onSecondary = Color.White,
    secondaryContainer = Axis.GreenLight,
    onSecondaryContainer = Axis.Ink,
    tertiary = Axis.GreenLight,
    onTertiary = Axis.Ink,
    background = Axis.Bg,
    onBackground = Color(0xFF1D2622),
    surface = Axis.Card,
    onSurface = Color(0xFF1D2622),
    surfaceVariant = Axis.GreenPale,
    onSurfaceVariant = Axis.Muted,
    outline = Axis.Border,
    error = Color(0xFFD33),
    onError = Color.White
)

private val DarkColors = darkColorScheme(
    primary = Axis.GreenLight,
    onPrimary = Color(0xFF12321B),
    primaryContainer = Axis.Ink,
    onPrimaryContainer = Color(0xFFD6EBCB),
    secondary = Color(0xFF94CD7A),
    onSecondary = Color(0xFF12321B),
    secondaryContainer = Color(0xFF2E5745),
    onSecondaryContainer = Color(0xFFD6EBCB),
    tertiary = Color(0xFF94CD7A),
    onTertiary = Color(0xFF12321B),
    background = Color(0xFF0F1712),
    onBackground = Color(0xFFE4EBE1),
    surface = Color(0xFF161F18),
    onSurface = Color(0xFFE4EBE1),
    surfaceVariant = Color(0xFF26322B),
    onSurfaceVariant = Color(0xFFAAB8AB),
    outline = Color(0xFF33473A),
    error = Color(0xFFFF6E6E),
    onError = Color(0xFF3A0000)
)

private val AxisShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun KvartiraTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    MaterialTheme(
        colorScheme = if (dark) DarkColors else LightColors,
        shapes = AxisShapes,
        content = content
    )
}