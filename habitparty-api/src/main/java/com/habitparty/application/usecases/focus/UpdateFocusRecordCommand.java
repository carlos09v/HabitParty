package com.habitparty.application.usecases.focus;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;

public record UpdateFocusRecordCommand(
    UUID focusActivityId,
    UUID inventoryItemId,
    UUID taskId,
    String notes,
    LocalDateTime startTime,
    LocalDateTime endTime,
    FocusRecordType recordType,
    Integer completedPomos,
    Integer pomoTargetMinutes) {

  public static UpdateFocusRecordCommand notesOnly(String notes) {
    return new UpdateFocusRecordCommand(null, null, null, notes, null, null, null, null, null);
  }

  public boolean isNotesOnlyUpdate() {
    return focusActivityId == null
        && inventoryItemId == null
        && taskId == null
        && startTime == null
        && endTime == null
        && recordType == null
        && completedPomos == null
        && pomoTargetMinutes == null;
  }
}
