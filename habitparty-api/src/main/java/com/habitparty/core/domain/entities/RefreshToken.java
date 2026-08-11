package com.habitparty.core.domain.entities;

import java.time.Instant;
import java.util.UUID;

public class RefreshToken {
  private UUID id;
  private UUID userId;
  private String token;
  private Instant expirationDate;
  private boolean revoked;

  public RefreshToken(UUID id, UUID userId, String token, Instant expirationDate, boolean revoked) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expirationDate = expirationDate;
    this.revoked = revoked;
  }

  // --- Regras de Negócio do Domínio ---
  public void revoke() {
    this.revoked = true;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(this.expirationDate);
  }

  public boolean isValid() {
    return !this.revoked && !isExpired();
  }

  // --- Getters and Setters ---
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public Instant getExpirationDate() {
    return expirationDate;
  }

  public void setExpirationDate(Instant expirationDate) {
    this.expirationDate = expirationDate;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public void setRevoked(boolean revoked) {
    this.revoked = revoked;
  }
}
