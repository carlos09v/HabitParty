package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserArtifactJpaEntity;
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
  public UserArtifact save(UserArtifact userArtifact) {
    UserArtifactJpaEntity saved = repository.save(mapper.toEntity(userArtifact));
    return mapper.toDomain(saved);
  }

  @Override
  public List<UserArtifact> saveAll(List<UserArtifact> userArtifacts) {
    if (userArtifacts == null || userArtifacts.isEmpty()) {
      return List.of();
    }
    List<UserArtifactJpaEntity> entities = userArtifacts.stream()
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

  @Override
  public void deleteAchievementArtifactsByUserId(UUID userId) {
    repository.deleteAchievementArtifactsByUserId(userId);
  }
}
