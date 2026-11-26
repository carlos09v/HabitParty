package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.AchievementProgressItem;
import com.habitparty.application.usecases.common.UtcDateTimeMapper;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;

public record AchievementItemResponseDTO(
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
    boolean isSecret,
    boolean unlocked,
    OffsetDateTime unlockedAt,
    boolean seen,
    int currentValue,
    int progressPercent,
    ArtifactSummaryDTO grantedArtifact) {

  public static AchievementItemResponseDTO fromDomain(AchievementProgressItem item) {
    Achievement a = item.achievement();
    OffsetDateTime unlockedAtUtc = UtcDateTimeMapper.toUtcOffsetDateTime(item.unlockedAt());
    return new AchievementItemResponseDTO(
        a.getId(),
        a.getCode(),
        a.getTitle(),
        a.getDescription(),
        a.getIconName(),
        a.getPoints(),
        a.getCategory(),
        a.getRarity(),
        a.getTargetValue(),
        a.getDisplayOrder(),
        a.isSecret(),
        item.unlocked(),
        unlockedAtUtc,
        item.seen(),
        item.currentValue(),
        item.progressPercent(),
        ArtifactSummaryDTO.fromDomain(item.grantedArtifact()));
  }
}
