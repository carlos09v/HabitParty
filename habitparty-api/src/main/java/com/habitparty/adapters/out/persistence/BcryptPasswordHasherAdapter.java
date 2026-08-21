package com.habitparty.adapters.out.persistence;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.PasswordHasherPort;

@Component
public class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  private final PasswordEncoder passwordEncoder;

  public BcryptPasswordHasherAdapter(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public String encode(String rawPassword) {
    return passwordEncoder.encode(rawPassword);
  }

  @Override
  public boolean matches(String rawPassword, String encodedPassword) {
    return passwordEncoder.matches(rawPassword, encodedPassword);
  }
}
