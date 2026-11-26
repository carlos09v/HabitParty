package com.habitparty.adapters.out.security;

import java.nio.charset.StandardCharsets;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.core.exceptions.DomainValidationException;

@Component
public class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  public static final int MAX_BCRYPT_UTF8_BYTES = 72;

  private final PasswordEncoder passwordEncoder;

  public BcryptPasswordHasherAdapter(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public String encode(String rawPassword) {
    if (rawPassword == null || rawPassword.getBytes(StandardCharsets.UTF_8).length > MAX_BCRYPT_UTF8_BYTES) {
      throw new DomainValidationException("A senha deve ter no máximo 72 bytes em UTF-8.");
    }
    return passwordEncoder.encode(rawPassword);
  }

  @Override
  public boolean matches(String rawPassword, String encodedPassword) {
    if (rawPassword == null || encodedPassword == null) {
      return false;
    }
    if (rawPassword.getBytes(StandardCharsets.UTF_8).length > MAX_BCRYPT_UTF8_BYTES) {
      return false;
    }
    return passwordEncoder.matches(rawPassword, encodedPassword);
  }
}
