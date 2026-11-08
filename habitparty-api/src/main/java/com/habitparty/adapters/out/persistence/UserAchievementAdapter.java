package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserAchievementJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserAchievementMapper;
import com.habitparty.adapters.out.persistence.repository.UserAchievementJpaRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.core.domain.entities.achievement.UserAchievement;

@Component
public class UserAchievementAdapter implements UserAchievementRepository {
  private final UserAchievementJpaRepository repository;
  private final UserAchievementMapper mapper;

  public UserAchievementAdapter(UserAchievementJpaRepository repository, UserAchievementMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public List<UserAchievement> findAllByUserId(UUID userId) {
    return repository.findAllByUserIdOrderByUnlockedAtDesc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<UserAchievement> findUnseenByUserId(UUID userId) {
    return repository.findAllByUserIdAndSeenFalseOrderByUnlockedAtDesc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public UserAchievement save(UserAchievement userAchievement) {
    UserAchievementJpaEntity saved = repository.save(mapper.toEntity(userAchievement));
    return mapper.toDomain(saved);
  }

  @Override
  public List<UserAchievement> saveAll(List<UserAchievement> userAchievements) {
    if (userAchievements == null || userAchievements.isEmpty()) {
      return List.of();
    }
    List<UserAchievementJpaEntity> entities = userAchievements.stream()
        .map(mapper::toEntity)
        .toList();
    return repository.saveAll(entities).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public void markAllSeenByUserId(UUID userId) {
    repository.markAllSeenByUserId(userId);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
