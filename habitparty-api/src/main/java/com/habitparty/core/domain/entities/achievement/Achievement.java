package com.habitparty.core.domain.entities.achievement;

import java.util.UUID;

import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;

public record Achievement(
    UUID id,
    String code,
    String title,
    String description,
    String iconName,
    int points,
    AchievementCategory category,
    AchievementRarity rarity,
    int targetValue,
    int displayOrder,
    boolean secret) {

  public Achievement {
    points = points > 0 ? points : (rarity != null ? rarity.getDefaultPoints() : 10);
    category = category != null ? category : AchievementCategory.TASKS;
    rarity = rarity != null ? rarity : AchievementRarity.COMMON;
    targetValue = Math.max(1, targetValue);
  }

  public UUID getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }

  public String getIconName() {
    return iconName;
  }

  public int getPoints() {
    return points;
  }

  public AchievementCategory getCategory() {
    return category;
  }

  public AchievementRarity getRarity() {
    return rarity;
  }

  public int getTargetValue() {
    return targetValue;
  }

  public int getDisplayOrder() {
    return displayOrder;
  }

  public boolean isSecret() {
    return secret;
  }
}
