package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase.AchievementProgressItem;
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
    LocalDateTime unlockedAt,
    boolean seen,
    int currentValue,
    int progressPercent) {

  public static AchievementItemResponseDTO fromDomain(AchievementProgressItem item) {
    Achievement a = item.achievement();
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
        item.unlockedAt(),
        item.seen(),
        item.currentValue(),
        item.progressPercent());
  }
}
