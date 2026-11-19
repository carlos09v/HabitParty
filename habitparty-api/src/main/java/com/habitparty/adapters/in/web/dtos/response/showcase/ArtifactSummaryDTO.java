package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.enums.AchievementRarity;

public record ArtifactSummaryDTO(
    UUID id,
    String code,
    String iconName,
    AchievementRarity rarity) {

  public static ArtifactSummaryDTO fromDomain(Artifact artifact) {
    if (artifact == null) {
      return null;
    }
    return new ArtifactSummaryDTO(
        artifact.getId(),
        artifact.getCode(),
        artifact.getIconName(),
        artifact.getRarity());
  }
}
