package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.enums.FocusRecordType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record FocusRecordResponseDTO(
    UUID id,
    UUID userId,
    UUID focusActivityId,
    UUID inventoryItemId,
    UUID taskId,
    String taskNameSnapshot,
    String notes,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    FocusRecordType recordType,
    Integer completedPomos,
    int durationMinutes,
    Integer xpEarned,
    BigDecimal coinsEarned) {
  public static FocusRecordResponseDTO fromDomain(FocusRecord record) {
    return fromDomain(record, ZoneId.systemDefault());
  }

  public static FocusRecordResponseDTO fromDomain(FocusRecord record, ZoneId userZone) {
    ZoneId effectiveZone = userZone != null ? userZone : ZoneId.systemDefault();
    return new FocusRecordResponseDTO(
        record.getId(),
        record.getUserId(),
        record.getFocusActivityId().orElse(null),
        record.getInventoryItemId().orElse(null),
        record.getTaskId().orElse(null),
        record.getTaskNameSnapshot().orElse(null),
        record.getNotes().orElse(null),
        toOffsetDateTime(record.getStartTime(), effectiveZone),
        toOffsetDateTime(record.getEndTime(), effectiveZone),
        record.getRecordType().orElse(null),
        record.getCompletedPomos().orElse(null),
        record.getDurationMinutes(),
        record.getXpEarned().orElse(0),
        record.getCoinsEarned().orElse(BigDecimal.ZERO));
  }

  private static OffsetDateTime toOffsetDateTime(LocalDateTime value, ZoneId userZone) {
    return value != null
        ? value.atZone(ZoneId.systemDefault()).withZoneSameInstant(userZone).toOffsetDateTime()
        : null;
  }
}
