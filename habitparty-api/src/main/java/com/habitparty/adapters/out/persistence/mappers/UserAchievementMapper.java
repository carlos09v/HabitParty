package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserAchievementJpaEntity;
import com.habitparty.core.domain.entities.achievement.UserAchievement;

@Component
public class UserAchievementMapper {

  public UserAchievementJpaEntity toEntity(UserAchievement domain) {
    return new UserAchievementJpaEntity(
        domain.getUserId(),
        domain.getAchievementId(),
        domain.getUnlockedAt(),
        domain.isSeen());
  }

  public UserAchievement toDomain(UserAchievementJpaEntity entity) {
    return new UserAchievement(
        entity.getUserId(),
        entity.getAchievementId(),
        entity.getUnlockedAt(),
        entity.isSeen());
  }
}
