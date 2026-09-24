package com.kvartira.ai.ui.chat

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kvartira.ai.data.Apartment
import com.kvartira.ai.data.ChatMessage
import com.kvartira.ai.ui.AxisEnter
import com.kvartira.ai.ui.ApartmentCard

@Composable
fun ChatBubble(
    m: ChatMessage,
    onOpenApartmentUrl: (String) -> Unit,
    onToggleFavorite: ((Apartment) -> Unit)? = null
) {
    AxisEnter {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = if (m.fromUser) Arrangement.End else Arrangement.Start
        ) {
            Surface(
                color = if (m.fromUser) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(
                    topStart = 18.dp,
                    topEnd = 18.dp,
                    bottomStart = if (m.fromUser) 18.dp else 6.dp,
                    bottomEnd = if (m.fromUser) 6.dp else 18.dp
                ),
                tonalElevation = if (m.fromUser) 0.dp else 2.dp,
                shadowElevation = if (m.fromUser) 3.dp else 0.dp,
                border = if (m.fromUser) null else androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)),
                modifier = Modifier.widthIn(max = 330.dp)
            ) {
                Column(Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                    Text(
                        text = m.text,
                        fontSize = 15.sp,
                        lineHeight = 20.sp,
                        color = if (m.fromUser) Color.White else MaterialTheme.colorScheme.onSurface
                    )
                    if (m.apartments.isNotEmpty()) {
                        Spacer(Modifier.height(10.dp))
                        m.apartments.take(3).forEach { a ->
                            Box(Modifier.padding(bottom = 8.dp)) {
                                ApartmentCard(
                                    apartment = a,
                                    isFavorite = false,
                                    onToggleFavorite = { onToggleFavorite?.invoke(a) },
                                    onClick = { if (a.url.isNotBlank()) onOpenApartmentUrl(a.url) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}