package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;

public record PaymentConfirmRequestDTO(
    @NotBlank(message = "O ID da sessão de checkout é obrigatório.")
    String sessionId
) {}
