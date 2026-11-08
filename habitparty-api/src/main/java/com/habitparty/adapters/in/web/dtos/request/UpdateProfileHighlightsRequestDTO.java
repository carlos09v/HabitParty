package com.habitparty.adapters.in.web.dtos.request;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.enums.HighlightType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateProfileHighlightsRequestDTO(
    @NotNull(message = "A lista de destaques não pode ser nula.")
    @Size(max = 4, message = "A vitrine suporta no máximo 4 destaques.")
    @Valid
    List<HighlightSlotDTO> highlights) {

  public record HighlightSlotDTO(
      @Min(value = 0, message = "A posição mínima é 0.")
      @Max(value = 3, message = "A posição máxima é 3.")
      int displayOrder,

      @NotNull(message = "O tipo do destaque é obrigatório.")
      HighlightType highlightType,

      UUID referenceId,

      @Size(max = 60, message = "A chave do destaque deve ter no máximo 60 caracteres.")
      String highlightKey) {}
}
