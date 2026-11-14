package com.habitparty.adapters.in.web.dtos.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleSignInRequestDTO(
    @Schema(description = "Código de autorização OAuth 2.0 retornado pelo Google")
    @NotBlank(message = "O código do Google é obrigatório.")
    String code,

    @Schema(description = "Fuso horário IANA detectado no navegador do usuário (ex: America/Sao_Paulo)")
    @Size(max = 64, message = "O fuso horário deve ter no máximo 64 caracteres")
    String timezone
) {
  public GoogleSignInRequestDTO(String code) {
    this(code, null);
  }
}
