package com.habitparty.adapters.in.web.dtos.request;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFocusRecordDTO(
    UUID focusActivityId,
    UUID inventoryItemId,
    UUID taskId,
    @Size(max = 500, message = "A anotação não pode ter mais de 500 caracteres.")
    String notes,

    @NotNull(message = "O horário de início é obrigatório.") LocalDateTime startTime,

    @NotNull(message = "O horário de fim é obrigatório.") LocalDateTime endTime,

    FocusRecordType recordType,
    @Min(value = 0, message = "A quantidade de pomodoros concluídos não pode ser negativa.")
    @Max(value = 200, message = "A quantidade de pomodoros concluídos não pode exceder 200.")
    Integer completedPomos,
    @Min(value = 1, message = "A duração alvo do Pomodoro deve ser de pelo menos 1 minuto.")
    @Max(value = 180, message = "A duração alvo do Pomodoro não pode exceder 180 minutos.")
    Integer pomoTargetMinutes,
    Boolean autoConsumeOnDepletion
) {
  public CreateFocusRecordDTO(
      UUID focusActivityId,
      UUID inventoryItemId,
      UUID taskId,
      String notes,
      LocalDateTime startTime,
      LocalDateTime endTime,
      FocusRecordType recordType,
      Integer completedPomos,
      Integer pomoTargetMinutes) {
    this(
        focusActivityId,
        inventoryItemId,
        taskId,
        notes,
        startTime,
        endTime,
        recordType,
        completedPomos,
        pomoTargetMinutes,
        null);
  }
}
