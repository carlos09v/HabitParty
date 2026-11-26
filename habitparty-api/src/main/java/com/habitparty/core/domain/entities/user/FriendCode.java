package com.habitparty.core.domain.entities.user;

import java.security.SecureRandom;
import java.util.Locale;

/**
 * Value Object com as regras de geração e normalização de códigos de amizade (ex: {@code HP-9A7K2M}).
 */
public final class FriendCode {
  public static final String PREFIX = "HP-";
  private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final int RANDOM_LENGTH = 6;
  private static final SecureRandom RANDOM = new SecureRandom();

  private FriendCode() {
  }

  public static String generateRandom() {
    StringBuilder sb = new StringBuilder(PREFIX.length() + RANDOM_LENGTH);
    sb.append(PREFIX);
    for (int i = 0; i < RANDOM_LENGTH; i++) {
      int idx = RANDOM.nextInt(ALPHABET.length());
      sb.append(ALPHABET.charAt(idx));
    }
    return sb.toString();
  }

  public static String normalize(String raw) {
    if (raw == null) {
      return null;
    }
    String cleaned = raw.trim().toUpperCase(Locale.ROOT);
    if (cleaned.isEmpty()) {
      return null;
    }
    if (cleaned.startsWith(PREFIX)) {
      String suffix = cleaned.substring(PREFIX.length());
      return isAlphanumericCodeSuffix(suffix) ? cleaned : null;
    }
    if (cleaned.length() == RANDOM_LENGTH && isAlphanumericCodeSuffix(cleaned)) {
      return PREFIX + cleaned;
    }
    return null;
  }

  private static boolean isAlphanumericCodeSuffix(String value) {
    if (value == null || value.isEmpty() || value.length() > 9) {
      return false;
    }
    for (int i = 0; i < value.length(); i++) {
      char c = value.charAt(i);
      if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))) {
        return false;
      }
    }
    return true;
  }
}
