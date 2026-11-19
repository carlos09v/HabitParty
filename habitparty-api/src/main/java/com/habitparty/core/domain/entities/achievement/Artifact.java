package com.habitparty.core.domain.entities.achievement;

import java.util.UUID;

import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;

public class Artifact {
  private final UUID id;
  private final String code;
  private final String iconName;
  private final AchievementRarity rarity;
  private final ArtifactSourceType sourceType;
  private final String requiredAchievementCode;
  private final int displayOrder;

  public Artifact(
      UUID id,
      String code,
      String iconName,
      AchievementRarity rarity,
      ArtifactSourceType sourceType,
      String requiredAchievementCode,
      int displayOrder) {
    this.id = id;
    this.code = code;
    this.iconName = iconName != null && !iconName.isBlank() ? iconName : "Sparkles";
    this.rarity = rarity != null ? rarity : AchievementRarity.RARE;
    this.sourceType = sourceType != null ? sourceType : ArtifactSourceType.ACHIEVEMENT;
    this.requiredAchievementCode = (requiredAchievementCode != null && !requiredAchievementCode.isBlank())
        ? requiredAchievementCode.trim().toUpperCase()
        : null;
    this.displayOrder = displayOrder;
  }

  public UUID getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getIconName() {
    return iconName;
  }

  public AchievementRarity getRarity() {
    return rarity;
  }

  public ArtifactSourceType getSourceType() {
    return sourceType;
  }

  public String getRequiredAchievementCode() {
    return requiredAchievementCode;
  }

  public int getDisplayOrder() {
    return displayOrder;
  }
}
