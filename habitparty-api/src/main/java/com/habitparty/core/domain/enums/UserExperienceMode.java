package com.habitparty.core.domain.enums;

public enum UserExperienceMode {
  GAMIFIED,
  PRODUCTIVITY;

  public static UserExperienceMode fromStringOrDefault(String value) {
    if (value == null || value.isBlank()) {
      return PRODUCTIVITY;
    }
    String normalized = value.trim().toUpperCase();
    if ("GAMIFIED".equals(normalized)) {
      return GAMIFIED;
    }
    return PRODUCTIVITY;
  }
}
