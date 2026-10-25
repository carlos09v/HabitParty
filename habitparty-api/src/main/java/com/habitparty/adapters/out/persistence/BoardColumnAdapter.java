package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.BoardColumnMapper;
import com.habitparty.adapters.out.persistence.repository.BoardColumnJpaRepository;
import com.habitparty.adapters.out.persistence.repository.BoardColumnJpaRepository.BoardColumnSummaryProjection;
import com.habitparty.application.ports.BoardColumnRepository;
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
  public BoardColumn save(BoardColumn board_Column) {
    BoardColumnJpaEntity entity = boardColumnMapper.toEntity(board_Column);

    BoardColumnJpaEntity savedEntity = repository.save(entity);

    return boardColumnMapper.toDomain(savedEntity);
  }

  @Override
  public List<BoardColumnSummaryDTO> getColumnSummaries(UUID workspaceId) {
    // Busca a projeção no banco (passando o enum de COMPLETED para a query)
    List<BoardColumnSummaryProjection> projections = repository.findSummaryByWorkspaceId(
        workspaceId,
        TaskStatus.COMPLETED);

    // Converte a Projeção nativa do Spring para o seu DTO limpo
    return projections.stream()
        .map(p -> new BoardColumnSummaryDTO(
            p.getId(),
            p.getName(),
            p.getIcon(),
            p.getOrderIndex(),
            p.getTotalTasks() != null ? p.getTotalTasks() : 0L,
            p.getCompletedTasks() != null ? p.getCompletedTasks() : 0L))
        .toList();
  }

  @Override
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  public int countByWorkspaceId(UUID workspaceId) {
    return repository.countByWorkspace_Id(workspaceId);
  }

  @Override
  public Optional<BoardColumn> findById(UUID id) {
    return repository.findById(id)
        .map(entity -> boardColumnMapper.toDomain(entity));
  }

  @Override
  public List<BoardColumn> findAllByWorkspaceId(UUID workspaceId) {
    // 1. O JpaRepository vai no banco e traz a lista de entidades
    List<BoardColumnJpaEntity> entities = repository.findByWorkspace_Id(workspaceId);

    // 2. Converte a lista de entidades JPA para lista de Domínio
    return entities.stream()
        .map(entity -> boardColumnMapper.toDomain(entity))
        .toList();
  }

  @Override
  public List<BoardColumn> findVisibleByWorkspaceId(UUID workspaceId) {

    List<BoardColumnJpaEntity> entities = repository
        .findByWorkspaceIdAndIsVisibleTrueOrderByOrderIndexAsc(workspaceId);

    return entities.stream()
        .map(boardColumnMapper::toDomain) // Seu mapper já converte de JPA para Domínio
        .toList();
  }

  @Override
  public void reorderAll(List<BoardColumn> board_Columns) {
    // 1. Recebe o Domínio puro, converte cada item da lista para Entidade JPA
    List<BoardColumnJpaEntity> entities = board_Columns.stream()
        .map(domain -> boardColumnMapper.toEntity(domain))
        .toList();

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
