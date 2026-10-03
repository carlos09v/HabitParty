package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;

import jakarta.validation.constraints.NotNull;

public record CreateFocusRecordDTO(
    UUID focusActivityId,
    UUID inventoryItemId,
    String notes,

    @NotNull(message = "O horário de início é obrigatório.") LocalDateTime startTime,

    @NotNull(message = "O horário de fim é obrigatório.") LocalDateTime endTime,

    FocusRecordType recordType,
    Integer completedPomos
) {

}
