package com.habitparty.adapters.in.web.dtos.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateTaskOrderDTO(
    @NotNull
    UUID taskId,
    
    UUID boardColumnId, // Pode ser a mesma coluna, ou a nova coluna para onde foi arrastada

    @NotNull @Min(0) int newOrderIndex) {

}
