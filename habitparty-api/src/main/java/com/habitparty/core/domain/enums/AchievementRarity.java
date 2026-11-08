package com.habitparty.core.domain.enums;

public enum AchievementRarity {
  COMMON(10),
  UNCOMMON(25),
  RARE(50),
  EPIC(100),
  LEGENDARY(250);

  private final int defaultPoints;

  AchievementRarity(int defaultPoints) {
    this.defaultPoints = defaultPoints;
  }

  public int getDefaultPoints() {
    return defaultPoints;
  }
}
