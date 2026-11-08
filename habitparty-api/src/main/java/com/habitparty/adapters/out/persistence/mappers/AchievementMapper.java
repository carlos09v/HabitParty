package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity;
import com.habitparty.core.domain.entities.achievement.Achievement;

@Component
public class AchievementMapper {

  public Achievement toDomain(AchievementJpaEntity entity) {
    return new Achievement(
        entity.getId(),
        entity.getCode(),
        entity.getTitle(),
        entity.getDescription(),
        entity.getIconName(),
        entity.getPoints(),
        entity.getCategory(),
        entity.getRarity(),
        entity.getTargetValue(),
        entity.getDisplayOrder(),
        entity.isSecret());
  }
}
