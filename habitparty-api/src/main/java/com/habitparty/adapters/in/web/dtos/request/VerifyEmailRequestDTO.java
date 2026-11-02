package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequestDTO(
    @NotBlank(message = "O token de verificação é obrigatório.")
    String token
) {
}
