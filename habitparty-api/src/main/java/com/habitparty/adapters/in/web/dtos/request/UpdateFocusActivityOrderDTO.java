package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateFocusActivityOrderDTO(
    @NotNull
    UUID id,

    @NotNull(message = "O índice de ordem é obrigatório")
    @Min(value = 0, message = "O índice de ordem não pode ser negativo")
    Integer orderIndex) {

}
