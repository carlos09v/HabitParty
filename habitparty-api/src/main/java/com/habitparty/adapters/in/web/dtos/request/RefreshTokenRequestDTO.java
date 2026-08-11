package com.habitparty.adapters.in.web.dtos.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequestDTO(
  @NotBlank(message = "O Refresh Token é obrigatório")
  String refreshToken
) {
  
}
