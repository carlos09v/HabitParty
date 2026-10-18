package com.habitparty.adapters.in.web.dtos.response;

import com.habitparty.core.domain.entities.AuthTokens;

public record SignInResponseDTO(
    String accessToken,
    String refreshToken
) {
  public static SignInResponseDTO fromDomain(AuthTokens tokens) {
    return new SignInResponseDTO(tokens.accessToken(), tokens.refreshToken());
  }
}
