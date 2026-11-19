package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.ArtifactProgressItem;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.UserArtifact;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;

public record ArtifactItemResponseDTO(
    UUID id,
    String code,
    String iconName,
    AchievementRarity rarity,
    ArtifactSourceType sourceType,
    String requiredAchievementCode,
    int displayOrder,
    boolean unlocked,
    LocalDateTime unlockedAt,
    String obtainedSource,
    boolean seen) {

  public static ArtifactItemResponseDTO fromDomain(ArtifactProgressItem item) {
    Artifact a = item.artifact();
    return new ArtifactItemResponseDTO(
        a.getId(),
        a.getCode(),
        a.getIconName(),
        a.getRarity(),
        a.getSourceType(),
        a.getRequiredAchievementCode(),
        a.getDisplayOrder(),
        item.unlocked(),
        item.unlockedAt(),
        item.obtainedSource(),
        item.seen());
  }

  public static ArtifactItemResponseDTO fromDrop(Artifact artifact, UserArtifact userArtifact) {
    if (artifact == null) {
      return null;
    }
    return new ArtifactItemResponseDTO(
        artifact.getId(),
        artifact.getCode(),
        artifact.getIconName(),
        artifact.getRarity(),
        artifact.getSourceType(),
        artifact.getRequiredAchievementCode(),
        artifact.getDisplayOrder(),
        true,
        userArtifact != null ? userArtifact.getUnlockedAt() : LocalDateTime.now(),
        userArtifact != null ? userArtifact.getObtainedSource() : artifact.getSourceType().name(),
        userArtifact != null && userArtifact.isSeen());
  }
}
