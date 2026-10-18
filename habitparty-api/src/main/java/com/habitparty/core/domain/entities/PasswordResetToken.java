package com.habitparty.core.domain.entities;

import java.time.Instant;
import java.util.UUID;

public class PasswordResetToken {
  private UUID id;
  private UUID userId;
  private String token;
  private Instant expirationDate;
  private boolean used;

  public PasswordResetToken(UUID id, UUID userId, String token, Instant expirationDate, boolean used) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expirationDate = expirationDate;
    this.used = used;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(this.expirationDate);
  }

  public boolean isValid() {
    return !this.used && !isExpired();
  }

  public void markAsUsed() {
    this.used = true;
  }

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

  public boolean isUsed() {
    return used;
  }

  public void setUsed(boolean used) {
    this.used = used;
  }
}
