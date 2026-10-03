package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChecklistItemDTO(
    @NotBlank(message = "O nome do item não pode estar vazio")
    @Size(max = 30, message = "O nome deve ter até 30 caracteres") String name) {
}
