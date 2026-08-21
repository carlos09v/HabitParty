package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.BoardColumn;

public interface BoardColumnRepository {
  BoardColumn save(BoardColumn board_Column);

  void deleteById(UUID id);

  // Essencial para carregar o quadro no front-end:
  List<BoardColumn> findAllByWorkspaceId(UUID workspaceId);

  // Essencial para validar se a coluna existe antes de fazer algo com ela:
  Optional<BoardColumn> findById(UUID id);

  // Útil para o ReorderColumnsUseCase atualizar várias de uma vez:
  void reorderAll(List<BoardColumn> columns);

  int countByWorkspaceId(UUID workspaceId); // Contagem pra validação do limite de 6 board_columns por workspace (plano free)

  // Ao deletar, reordena o index para não ficar um "buraco" na sequência
  void shiftColumnsDown(UUID workspaceId, int deletedIndex);

  // Para a criação da coluna gerar o index a partir do ultimo gerado
  int getMaxOrderIndex(UUID workspaceId);
}
