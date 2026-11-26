package com.habitparty.adapters.out.persistence;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.BoardColumnMapper;
import com.habitparty.adapters.out.persistence.repository.BoardColumnJpaRepository;
import com.habitparty.adapters.out.persistence.repository.BoardColumnJpaRepository.BoardColumnSummaryProjection;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.enums.task.TaskStatus;

@Component
public class BoardColumnAdapter implements BoardColumnRepository {
  private final BoardColumnJpaRepository repository;
  private final BoardColumnMapper boardColumnMapper;

  public BoardColumnAdapter(BoardColumnJpaRepository repository, BoardColumnMapper boardColumnMapper) {
    this.repository = repository;
    this.boardColumnMapper = boardColumnMapper;
  }

  @Override
  public BoardColumn save(BoardColumn boardColumn) {
    BoardColumnJpaEntity entity = repository.findById(boardColumn.getId())
        .map(existing -> {
          boardColumnMapper.updateEntityFromDomain(existing, boardColumn);
          return existing;
        })
        .orElseGet(() -> boardColumnMapper.toEntity(boardColumn));

    BoardColumnJpaEntity savedEntity = repository.save(entity);
    return boardColumnMapper.toDomain(savedEntity);
  }

  @Override
  public List<BoardColumnSummaryDTO> getColumnSummaries(UUID workspaceId) {
    List<BoardColumnSummaryProjection> projections = repository.findSummaryByWorkspaceId(
        workspaceId,
        TaskStatus.COMPLETED);

    return projections.stream()
        .map(this::toSummaryDTO)
        .toList();
  }

  @Override
  public Map<UUID, BoardColumnSummaryDTO> getColumnSummariesByWorkspaceIds(Collection<UUID> workspaceIds) {
    if (workspaceIds == null || workspaceIds.isEmpty()) {
      return Map.of();
    }
    return repository.findSummaryByWorkspaceIdIn(workspaceIds, TaskStatus.COMPLETED).stream()
        .collect(Collectors.toMap(
            BoardColumnSummaryProjection::getId,
            this::toSummaryDTO,
            (existing, ignored) -> existing));
  }

  private BoardColumnSummaryDTO toSummaryDTO(BoardColumnSummaryProjection projection) {
    return new BoardColumnSummaryDTO(
        projection.getId(),
        projection.getName(),
        projection.getIcon(),
        projection.getOrderIndex(),
        projection.getTotalTasks() != null ? projection.getTotalTasks() : 0L,
        projection.getCompletedTasks() != null ? projection.getCompletedTasks() : 0L);
  }

  @Override
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  public int countByWorkspaceId(UUID workspaceId) {
    return repository.countByWorkspaceId(workspaceId);
  }

  @Override
  public Optional<BoardColumn> findById(UUID id) {
    return repository.findById(id)
        .map(boardColumnMapper::toDomain);
  }

  @Override
  public Optional<List<BoardColumn>> findAllByIds(Collection<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return Optional.of(List.of());
    }
    return Optional.of(repository.findAllById(ids).stream()
        .map(boardColumnMapper::toDomain)
        .toList());
  }

  @Override
  public List<BoardColumn> findAllByWorkspaceId(UUID workspaceId) {
    List<BoardColumnJpaEntity> entities = repository.findByWorkspaceIdOrderByOrderIndexAsc(workspaceId);
    return entities.stream()
        .map(boardColumnMapper::toDomain)
        .toList();
  }

  @Override
  public List<BoardColumn> findAllByWorkspaceIds(List<UUID> workspaceIds) {
    if (workspaceIds == null || workspaceIds.isEmpty()) {
      return List.of();
    }
    return repository.findByWorkspaceIdInOrderByOrderIndexAsc(workspaceIds).stream()
        .map(boardColumnMapper::toDomain)
        .toList();
  }

  @Override
  public List<BoardColumn> findVisibleByWorkspaceId(UUID workspaceId) {
    List<BoardColumnJpaEntity> entities = repository
        .findByWorkspaceIdAndIsVisibleTrueOrderByOrderIndexAsc(workspaceId);
    return entities.stream()
        .map(boardColumnMapper::toDomain)
        .toList();
  }

  @Override
  @Transactional
  public void reorderAll(List<BoardColumn> boardColumns) {
    if (boardColumns == null || boardColumns.isEmpty()) {
      return;
    }
    List<UUID> ids = boardColumns.stream()
        .map(BoardColumn::getId)
        .filter(Objects::nonNull)
        .toList();
    Map<UUID, BoardColumnJpaEntity> existingById = repository.findAllById(ids).stream()
        .collect(Collectors.toMap(BoardColumnJpaEntity::getId, Function.identity(), (a, b) -> a));

    List<BoardColumnJpaEntity> entities = new ArrayList<>(boardColumns.size());
    for (BoardColumn domain : boardColumns) {
      BoardColumnJpaEntity entity = existingById.get(domain.getId());
      if (entity != null) {
        boardColumnMapper.updateEntityFromDomain(entity, domain);
      } else {
        entity = boardColumnMapper.toEntity(domain);
      }
      entities.add(entity);
    }

    repository.saveAll(entities);
  }

  @Override
  public void shiftColumnsDown(UUID workspaceId, int deletedIndex) {
    repository.decrementOrderIndexForColumnsAfter(workspaceId, deletedIndex);
  }

  @Override
  public int getMaxOrderIndex(UUID workspaceId) {
    return repository.findMaxOrderIndexByWorkspaceId(workspaceId);
  }

  @Override
  public void deleteAllByWorkspaceId(UUID workspaceId) {
    repository.deleteAllByWorkspaceId(workspaceId);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
