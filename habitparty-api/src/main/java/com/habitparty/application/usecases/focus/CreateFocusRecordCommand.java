package com.habitparty.application.usecases.focus;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;

public record CreateFocusRecordCommand(
    UUID focusActivityId,
    UUID inventoryItemId,
    UUID taskId,
    String notes,
    LocalDateTime startTime,
    LocalDateTime endTime,
    FocusRecordType recordType,
    Integer completedPomos
) {
  public CreateFocusRecordCommand(
      UUID focusActivityId,
      UUID inventoryItemId,
      String notes,
      LocalDateTime startTime,
      LocalDateTime endTime,
      FocusRecordType recordType,
      Integer completedPomos) {
    this(focusActivityId, inventoryItemId, null, notes, startTime, endTime, recordType, completedPomos);
  }
}
