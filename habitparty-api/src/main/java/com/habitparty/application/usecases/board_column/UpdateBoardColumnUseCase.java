package com.habitparty.application.usecases.board_column;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class UpdateBoardColumnUseCase {
  private final BoardColumnRepository port;

  public UpdateBoardColumnUseCase(BoardColumnRepository port) {
    this.port = port;
  }

  public BoardColumn execute(UUID boardColumnId, UpdateBoardColumnDTO dto, UUID userIdLogado) {
    BoardColumn boardColumn = port.findById(boardColumnId)
      .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    boardColumn.validateOwnership(userIdLogado);

    // Verifica os campos opcionais do DTO e atualiza apenas o que foi enviado!
    if (dto.name() != null) {
        boardColumn.updateName(dto.name());
    }
    if (dto.icon() != null) {
        boardColumn.updateIcon(dto.icon());
    }

    return port.save(boardColumn);
  }
}
