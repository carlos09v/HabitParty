package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.BoardColumnMapper;
import com.habitparty.adapters.out.persistence.repository.BoardColumnJpaRepository;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.core.domain.entities.BoardColumn;

@Component
public class BoardColumnAdapter implements BoardColumnRepository {
  private final BoardColumnJpaRepository boardColumnRepository;
  private final BoardColumnMapper boardColumnMapper;

  public BoardColumnAdapter(BoardColumnJpaRepository boardColumnJpaRepository, BoardColumnMapper boardColumnMapper) {
    this.boardColumnRepository = boardColumnJpaRepository;
    this.boardColumnMapper = boardColumnMapper;
  }

  @Override
  public BoardColumn save(BoardColumn board_Column) {
    BoardColumnJpaEntity entity = boardColumnMapper.toEntity(board_Column);

    BoardColumnJpaEntity savedEntity = boardColumnRepository.save(entity);

    return boardColumnMapper.toDomain(savedEntity);
  }

  @Override
  public void deleteById(UUID id) {
    boardColumnRepository.deleteById(id);
  }

  @Override
  public int countByWorkspaceId(UUID workspaceId) {
    return boardColumnRepository.countByWorkspace_Id(workspaceId);
  }

  @Override
  public Optional<BoardColumn> findById(UUID id) {
    return boardColumnRepository.findById(id)
        .map(entity -> boardColumnMapper.toDomain(entity));
  }

  @Override
  public List<BoardColumn> findAllByWorkspaceId(UUID workspaceId) {
    // 1. O JpaRepository vai no banco e traz a lista de entidades
    List<BoardColumnJpaEntity> entities = boardColumnRepository.findByWorkspace_Id(workspaceId);

    // 2. Converte a lista de entidades JPA para lista de Domínio
    return entities.stream()
        .map(entity -> boardColumnMapper.toDomain(entity))
        .toList();
  }

  @Override
  public void reorderAll(List<BoardColumn> board_Columns) {
    // 1. Recebe o Domínio puro, converte cada item da lista para Entidade JPA
    List<BoardColumnJpaEntity> entities = board_Columns.stream()
        .map(domain -> boardColumnMapper.toEntity(domain))
        .toList();

    boardColumnRepository.saveAll(entities);
  }

  @Override
  public void shiftColumnsDown(UUID workspaceId, int deletedIndex) {
    boardColumnRepository.decrementOrderIndexForColumnsAfter(workspaceId, deletedIndex);
  }

  @Override
  public int getMaxOrderIndex(UUID workspaceId) {
    return boardColumnRepository.findMaxOrderIndexByWorkspaceId(workspaceId);
  }
}
