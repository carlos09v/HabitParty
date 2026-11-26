package com.habitparty.adapters.out.persistence;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
  @Transactional
  public UserAchievement save(UserAchievement userAchievement) {
    repository.insertIfAbsent(
        userAchievement.getUserId(),
        userAchievement.getAchievementId(),
        userAchievement.getUnlockedAt(),
        userAchievement.isSeen());
    return userAchievement;
  }

  @Override
  @Transactional
  public List<UserAchievement> saveAll(List<UserAchievement> userAchievements) {
    if (userAchievements == null || userAchievements.isEmpty()) {
      return List.of();
    }
    List<UserAchievement> inserted = new ArrayList<>(userAchievements.size());
    for (UserAchievement ua : userAchievements) {
      int rows = repository.insertIfAbsent(
          ua.getUserId(),
          ua.getAchievementId(),
          ua.getUnlockedAt(),
          ua.isSeen());
      if (rows > 0) {
        inserted.add(ua);
      }
    }
    return inserted;
  }

  @Override
  @Transactional
  public void markAllSeenByUserId(UUID userId) {
    repository.markAllSeenByUserId(userId);
  }

  @Override
  @Transactional
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
