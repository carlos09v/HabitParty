package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ProfileHighlightJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.ProfileHighlightMapper;
import com.habitparty.adapters.out.persistence.repository.ProfileHighlightJpaRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;

@Component
public class ProfileHighlightAdapter implements ProfileHighlightRepository {
  private final ProfileHighlightJpaRepository repository;
  private final ProfileHighlightMapper mapper;

  public ProfileHighlightAdapter(ProfileHighlightJpaRepository repository, ProfileHighlightMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public List<ProfileHighlight> findAllByUserIdOrderByDisplayOrder(UUID userId) {
    return repository.findAllByUserIdOrderByDisplayOrderAsc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<ProfileHighlight> replaceAllForUser(UUID userId, List<ProfileHighlight> highlights) {
    repository.deleteAllByUserId(userId);
    repository.flush();
    if (highlights == null || highlights.isEmpty()) {
      return List.of();
    }
    List<ProfileHighlightJpaEntity> entities = highlights.stream()
        .map(mapper::toEntity)
        .toList();
    return repository.saveAll(entities).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public long countByUserId(UUID userId) {
    return repository.countByUserId(userId);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
