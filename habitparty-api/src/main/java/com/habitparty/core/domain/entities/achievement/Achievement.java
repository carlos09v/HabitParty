package com.habitparty.core.domain.entities.achievement;

import java.util.UUID;

import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;

public class Achievement {
  private UUID id;
  private String code;
  private String title;
  private String description;
  private String iconName;
  private int points;
  private AchievementCategory category;
  private AchievementRarity rarity;
  private int targetValue;
  private int displayOrder;
  private boolean secret;

  public Achievement(
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
    this.id = id;
    this.code = code;
    this.title = title;
    this.description = description;
    this.iconName = iconName;
    this.points = points > 0 ? points : (rarity != null ? rarity.getDefaultPoints() : 10);
    this.category = category != null ? category : AchievementCategory.TASKS;
    this.rarity = rarity != null ? rarity : AchievementRarity.COMMON;
    this.targetValue = Math.max(1, targetValue);
    this.displayOrder = displayOrder;
    this.secret = secret;
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
