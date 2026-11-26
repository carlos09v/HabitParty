package com.habitparty.core.domain.entities.achievement;

import java.util.Locale;
import java.util.UUID;

import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;

public record Artifact(
    UUID id,
    String code,
    String iconName,
    AchievementRarity rarity,
    ArtifactSourceType sourceType,
    String requiredAchievementCode,
    int displayOrder) {

  public Artifact {
    iconName = (iconName != null && !iconName.isBlank()) ? iconName : "Sparkles";
    rarity = rarity != null ? rarity : AchievementRarity.RARE;
    sourceType = sourceType != null ? sourceType : ArtifactSourceType.ACHIEVEMENT;
    requiredAchievementCode = (requiredAchievementCode != null && !requiredAchievementCode.isBlank())
        ? requiredAchievementCode.trim().toUpperCase(Locale.ROOT)
        : null;
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
