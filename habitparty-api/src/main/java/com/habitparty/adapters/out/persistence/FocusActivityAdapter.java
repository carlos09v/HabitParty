package com.habitparty.adapters.out.persistence;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusActivityJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.FocusActivityMapper;
import com.habitparty.adapters.out.persistence.repository.FocusActivityJpaRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;

@Component
public class FocusActivityAdapter implements FocusActivityRepository {
  private final FocusActivityJpaRepository repository;
  private final FocusActivityMapper mapper;

  public FocusActivityAdapter(FocusActivityJpaRepository repository, FocusActivityMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public FocusActivity save(FocusActivity activity) {
    FocusActivityJpaEntity entity = repository.findById(activity.getId())
        .map(existing -> {
          mapper.updateEntityFromDomain(existing, activity);
          return existing;
        })
        .orElseGet(() -> mapper.toEntity(activity));
    FocusActivityJpaEntity savedEntity = repository.save(entity);
    return mapper.toDomain(savedEntity);
  }

  @Override
  public Optional<FocusActivity> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  public List<FocusActivity> findAllByUserIdOrderByOrderIndex(UUID userId) {
    return repository.findAllByUserIdOrderByOrderIndexAsc(userId).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public int countByUserId(UUID userId) {
    return repository.countByUserId(userId);
  }

  @Override
  public int getMaxOrderIndexByUserId(UUID userId) {
    return repository.findMaxOrderIndexByUserId(userId);
  }

  @Override
  public void shiftOrderIndexDown(UUID userId, int startOrderIndex) {
    repository.shiftOrderIndexDown(userId, startOrderIndex);
  }

  @Override
  public List<FocusActivity> saveAll(List<FocusActivity> activities) {
    if (activities == null || activities.isEmpty()) {
      return List.of();
    }
    List<UUID> ids = activities.stream()
        .map(FocusActivity::getId)
        .filter(Objects::nonNull)
        .toList();
    Map<UUID, FocusActivityJpaEntity> existingById = repository.findAllById(ids).stream()
        .collect(Collectors.toMap(FocusActivityJpaEntity::getId, Function.identity(), (a, b) -> a));

    List<FocusActivityJpaEntity> entities = new ArrayList<>(activities.size());
    for (FocusActivity activity : activities) {
      FocusActivityJpaEntity entity = existingById.get(activity.getId());
      if (entity != null) {
        mapper.updateEntityFromDomain(entity, activity);
      } else {
        entity = mapper.toEntity(activity);
      }
      entities.add(entity);
    }

    List<FocusActivityJpaEntity> savedEntities = repository.saveAll(entities);
    return savedEntities.stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
