package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    String notes,
    LocalDateTime startTime,
    LocalDateTime endTime,
    FocusRecordType recordType,
    Integer completedPomos,
    int durationMinutes,
    Integer xpEarned,
    BigDecimal coinsEarned) {
  public static FocusRecordResponseDTO fromDomain(FocusRecord record) {
    return new FocusRecordResponseDTO(
        record.getId(),
        record.getUserId(),
        record.getFocusActivityId().orElse(null),
        record.getInventoryItemId().orElse(null),
        record.getNotes().orElse(null),
        record.getStartTime(),
        record.getEndTime(),
        record.getRecordType().orElse(null),
        record.getCompletedPomos().orElse(null),
        record.getDurationMinutes(),
        record.getXpEarned().orElse(0),
        record.getCoinsEarned().orElse(BigDecimal.ZERO));
  }
}
