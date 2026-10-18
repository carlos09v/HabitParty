package com.habitparty.adapters.in.web.dtos.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record GoogleSignInRequestDTO(
    @Schema(description = "Código de autorização OAuth 2.0 retornado pelo Google")
    @NotBlank(message = "O código do Google é obrigatório.")
    String code
) {}
