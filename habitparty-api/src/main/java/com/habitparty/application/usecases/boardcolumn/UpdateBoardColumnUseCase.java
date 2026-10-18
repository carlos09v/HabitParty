package com.habitparty.application.usecases.boardcolumn;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateBoardColumnUseCase {
  private final BoardColumnRepository port;

  public UpdateBoardColumnUseCase(BoardColumnRepository port) {
    this.port = port;
  }

  public BoardColumn execute(UUID boardColumnId, UpdateBoardColumnCommand command, UUID userIdLogado) {
    return execute(boardColumnId, userIdLogado, command.name(), command.icon());
  }

  public BoardColumn execute(UUID boardColumnId, UUID userIdLogado, String name, String icon) {
    BoardColumn boardColumn = port.findById(boardColumnId)
      .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    boardColumn.validateOwnership(userIdLogado);

    boardColumn.updateDetails(name, icon);

    return port.save(boardColumn);
  }
}
