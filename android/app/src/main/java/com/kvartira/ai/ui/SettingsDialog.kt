package com.kvartira.ai.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kvartira.ai.MainViewModel

@Composable
fun SettingsDialog(vm: MainViewModel, onClose: () -> Unit) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var auto by remember { mutableStateOf(ui.autoScan) }

    AlertDialog(
        onDismissRequest = onClose,
        title = { Text("Робот-автоматизатор") },
        text = {
            Column {
                Text(
                    "Робот сам собирает объявления с площадок (Циан, M2.ru, Дом.РФ, ДомКлик) " +
                        "и подбирает варианты по чётким правилам — без внешнего ИИ, всё работает на устройстве.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(checked = auto, onCheckedChange = { auto = it })
                    Spacer(Modifier.width(10.dp))
                    Text("Авто-сканирование площадок при каждом запросе")
                }
                Spacer(Modifier.height(12.dp))
                OutlinedButton(
                    onClick = { vm.refreshListings(); onClose() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("🔄 Сканировать площадки сейчас")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                vm.saveRobot(auto)
                onClose()
            }) { Text("Сохранить") }
        },
        dismissButton = {
            TextButton(onClick = onClose) { Text("Отмена") }
        }
    )
}