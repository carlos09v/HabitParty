package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
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
    // Salva no banco e converte a resposta de volta para Domínio
    InventoryItemJpaEntity savedEntity = repository.save(mapper.toEntity(item));
    return mapper.toDomain(savedEntity);
  }

  @Override
  public Optional<InventoryItem> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  public int countByUserId(UUID userId) {
    return repository.countByUser_IdAndStatusIn(userId, ACTIVE_BACKPACK_STATUSES);
  }

  @Override
  public List<InventoryItem> saveAll(List<InventoryItem> items) {
    // Converte a lista de Domínio para lista de JPA e salva tudo em lote!
    List<InventoryItemJpaEntity> entities = items.stream()
        .map(mapper::toEntity)
        .toList();

    List<InventoryItemJpaEntity> savedEntities = repository.saveAll(entities);

    return savedEntities.stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public List<InventoryItem> findByUserIdAndStatusIn(UUID userId, List<InventoryItemStatus> statuses) {
    return repository.findByUser_IdAndStatusInOrderByOrderIndexAscAcquiredAtDesc(userId, statuses)
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
