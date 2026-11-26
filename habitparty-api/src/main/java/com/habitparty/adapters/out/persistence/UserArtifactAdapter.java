package com.habitparty.adapters.out.persistence;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.mappers.UserArtifactMapper;
import com.habitparty.adapters.out.persistence.repository.UserArtifactJpaRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.core.domain.entities.achievement.UserArtifact;

@Component
public class UserArtifactAdapter implements UserArtifactRepository {
  private final UserArtifactJpaRepository repository;
  private final UserArtifactMapper mapper;

  public UserArtifactAdapter(UserArtifactJpaRepository repository, UserArtifactMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public List<UserArtifact> findAllByUserId(UUID userId) {
    return repository.findAllByUserIdOrderByUnlockedAtDesc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<UserArtifact> findUnseenByUserId(UUID userId) {
    return repository.findAllByUserIdAndSeenFalseOrderByUnlockedAtDesc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public long countByUserId(UUID userId) {
    return repository.countByUserId(userId);
  }

  @Override
  @Transactional
  public UserArtifact save(UserArtifact userArtifact) {
    repository.insertIfAbsent(
        userArtifact.getUserId(),
        userArtifact.getArtifactId(),
        userArtifact.getObtainedSource(),
        userArtifact.getUnlockedAt(),
        userArtifact.isSeen());
    return userArtifact;
  }

  @Override
  @Transactional
  public List<UserArtifact> saveAll(List<UserArtifact> userArtifacts) {
    if (userArtifacts == null || userArtifacts.isEmpty()) {
      return List.of();
    }
    List<UserArtifact> inserted = new ArrayList<>(userArtifacts.size());
    for (UserArtifact ua : userArtifacts) {
      int rows = repository.insertIfAbsent(
          ua.getUserId(),
          ua.getArtifactId(),
          ua.getObtainedSource(),
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

  @Override
  @Transactional
  public void deleteAchievementArtifactsByUserId(UUID userId) {
    repository.deleteAchievementArtifactsByUserId(userId);
  }
}
