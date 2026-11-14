package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserThemeDTO(
    @NotBlank(message = "O tema visual é obrigatório")
    @Size(max = 40, message = "O identificador do tema deve ter no máximo 40 caracteres")
    String theme
) {
}
