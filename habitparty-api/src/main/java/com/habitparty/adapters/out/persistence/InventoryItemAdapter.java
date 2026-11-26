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

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.InventoryItemMapper;
import com.habitparty.adapters.out.persistence.repository.InventoryItemJpaRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;

@Component
public class InventoryItemAdapter implements InventoryItemRepository {
  private static final List<InventoryItemStatus> ACTIVE_BACKPACK_STATUSES = List.of(
      InventoryItemStatus.AVAILABLE,
      InventoryItemStatus.IN_FOCUS);

  private final InventoryItemJpaRepository repository;
  private final InventoryItemMapper mapper;

  public InventoryItemAdapter(InventoryItemJpaRepository repository, InventoryItemMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public InventoryItem save(InventoryItem item) {
    InventoryItemJpaEntity entity = repository.findById(item.getId())
        .map(existing -> {
          mapper.updateEntityFromDomain(existing, item);
          return existing;
        })
        .orElseGet(() -> mapper.toEntity(item));
    InventoryItemJpaEntity savedEntity = repository.save(entity);
    return mapper.toDomain(savedEntity);
  }

  @Override
  public Optional<InventoryItem> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  public Optional<InventoryItem> findByIdForUpdate(UUID id) {
    return repository.findByIdForUpdate(id).map(mapper::toDomain);
  }

  @Override
  public int countByUserId(UUID userId) {
    return repository.countByUserIdAndStatusIn(userId, ACTIVE_BACKPACK_STATUSES);
  }

  @Override
  public List<InventoryItem> saveAll(List<InventoryItem> items) {
    if (items == null || items.isEmpty()) {
      return List.of();
    }
    List<UUID> ids = items.stream()
        .map(InventoryItem::getId)
        .filter(Objects::nonNull)
        .toList();
    Map<UUID, InventoryItemJpaEntity> existingById = repository.findAllById(ids).stream()
        .collect(Collectors.toMap(InventoryItemJpaEntity::getId, Function.identity(), (a, b) -> a));

    List<InventoryItemJpaEntity> entities = new ArrayList<>(items.size());
    for (InventoryItem item : items) {
      InventoryItemJpaEntity entity = existingById.get(item.getId());
      if (entity != null) {
        mapper.updateEntityFromDomain(entity, item);
      } else {
        entity = mapper.toEntity(item);
      }
      entities.add(entity);
    }

    List<InventoryItemJpaEntity> savedEntities = repository.saveAll(entities);
    return savedEntities.stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<InventoryItem> findByUserIdAndStatusIn(UUID userId, List<InventoryItemStatus> statuses) {
    return repository.findByUserIdAndStatusInOrderByOrderIndexAscAcquiredAtDesc(userId, statuses)
        .stream()
        .map(mapper::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public int getMaxOrderIndex(UUID userId) {
    return repository.findMaxOrderIndexByUserIdAndStatusIn(userId, ACTIVE_BACKPACK_STATUSES);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
