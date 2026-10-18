package com.habitparty.application.ports;

import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.User;

public interface TokenPort {
  record TokenPayload(UUID userId, String role) {}

  String generateToken(User user);
  String validateTokenAndGetUserId(String token);
  Optional<TokenPayload> validateToken(String token);
}
