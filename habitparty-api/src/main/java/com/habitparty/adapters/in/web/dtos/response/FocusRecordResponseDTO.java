package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.application.usecases.common.UtcDateTimeMapper;
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
    Integer pomoTargetMinutes,
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
        UtcDateTimeMapper.toUserOffsetDateTime(record.getStartTime(), effectiveZone),
        UtcDateTimeMapper.toUserOffsetDateTime(record.getEndTime(), effectiveZone),
        record.getRecordType().orElse(null),
        record.getCompletedPomos().orElse(null),
        record.getPomoTargetMinutes().orElse(null),
        record.getDurationMinutes(),
        record.getXpEarned().orElse(0),
        record.getCoinsEarned().orElse(BigDecimal.ZERO));
  }
}
