package com.habitparty.core.domain.entities;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

import com.habitparty.core.domain.enums.UserTokenType;

public class UserToken {
  private UUID id;
  private UUID userId;
  private UserTokenType tokenType;
  private String token;
  private Instant expirationDate;
  private boolean used;
  private Instant usedAt;
  private LocalDateTime createdAt;

  public UserToken(
      UUID id,
      UUID userId,
      UserTokenType tokenType,
      String token,
      Instant expirationDate,
      boolean used,
      Instant usedAt,
      LocalDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.tokenType = tokenType != null ? tokenType : UserTokenType.PASSWORD_RESET;
    this.token = token;
    this.expirationDate = expirationDate;
    this.used = used;
    this.usedAt = usedAt;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
  }

  public UserToken(
      UUID id,
      UUID userId,
      UserTokenType tokenType,
      String token,
      Instant expirationDate,
      boolean used) {
    this(id, userId, tokenType, token, expirationDate, used, null, LocalDateTime.now());
  }

  /**
   * Gera o hash SHA-256 do token puro para armazenamento seguro no banco de dados.
   */
  public static String hashToken(String rawToken) {
    if (rawToken == null) {
      return null;
    }
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] encodedHash = digest.digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(encodedHash);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("Algoritmo SHA-256 não disponível no ambiente.", e);
    }
  }

  public boolean isExpired() {
    return Instant.now().isAfter(this.expirationDate);
  }

  public boolean isValid() {
    return !this.used && !isExpired();
  }

  public void markAsUsed() {
    this.used = true;
    this.usedAt = Instant.now();
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

  public UserTokenType getTokenType() {
    return tokenType;
  }

  public void setTokenType(UserTokenType tokenType) {
    this.tokenType = tokenType;
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

  public Instant getUsedAt() {
    return usedAt;
  }

  public void setUsedAt(Instant usedAt) {
    this.usedAt = usedAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
