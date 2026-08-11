package com.habitparty.application.ports;

import com.habitparty.core.domain.entities.User;

public interface TokenPort {
  String generateToken(User user);
  String validateTokenAndGetUserId(String token);
}
