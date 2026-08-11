package com.habitparty.adapters.in.web.dtos.response;

public record SignInResponseDTO(
  String accessToken,
  String refreshToken
) {
  
}
