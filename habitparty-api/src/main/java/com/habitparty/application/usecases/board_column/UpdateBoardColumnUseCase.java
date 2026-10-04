package com.habitparty.application.usecases.board_column;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.response.BoardColumnResponseDTO;
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

  public BoardColumnResponseDTO execute(UUID boardColumnId, UpdateBoardColumnDTO dto, UUID userIdLogado) {
    BoardColumn boardColumn = port.findById(boardColumnId)
      .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    boardColumn.validateOwnership(userIdLogado);

    boardColumn.updateDetails(dto.name(), dto.icon());

    BoardColumn savedColumn = port.save(boardColumn);

    return BoardColumnResponseDTO.fromDomain(savedColumn);
  }
}
