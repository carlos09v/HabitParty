package com.habitparty.application.usecases.focus;

import java.time.Duration;

import org.springframework.lang.Nullable;

import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Task;

/**
 * Helper compartilhado para montar os metadados de snapshot (nome, ícone, duração e notas)
 * das transações {@code FOCUS_COMPLETED} ao criar ou atualizar registros de foco.
 */
final class FocusRecordTransactionSupport {

  record FocusTransactionSnapshot(
      String nameSnapshot,
      String iconSnapshot,
      String durationLabel,
      String descriptionSnapshot) {}

  private FocusRecordTransactionSupport() {}

  static FocusTransactionSnapshot buildSnapshot(
      FocusRecord record,
      @Nullable FocusActivity activity,
      @Nullable Task task) {
    String activityName = "Sessão de Foco Livre";
    String activityIcon = "timer";
    String effectiveTaskName = task != null
        ? task.getName()
        : record.getTaskNameSnapshot().orElse(null);

    if (activity != null) {
      activityName = activity.getName();
      if (activity.getIcon() != null && !activity.getIcon().isBlank()) {
        activityIcon = activity.getIcon();
      }
      if (effectiveTaskName != null) {
        String combined = activityName + " • " + effectiveTaskName;
        activityName = combined.length() > 250 ? combined.substring(0, 250) : combined;
      }
    } else if (effectiveTaskName != null) {
      activityName = effectiveTaskName;
    }

    long totalSeconds = Duration.between(record.getStartTime(), record.getEndTime()).toSeconds();
    String durationLabel;
    if (totalSeconds < 60) {
      durationLabel = Math.max(1, totalSeconds) + "s";
    } else {
      long mins = totalSeconds / 60;
      long remainingSecs = totalSeconds % 60;
      durationLabel = remainingSecs > 0
          ? mins + "m " + remainingSecs + "s"
          : mins + " min";
    }

    String descriptionSnapshot = record.getNotes()
        .map(String::trim)
        .filter(note -> !note.isEmpty())
        .orElse(null);

    return new FocusTransactionSnapshot(
        activityName,
        activityIcon,
        durationLabel,
        descriptionSnapshot);
  }
}
