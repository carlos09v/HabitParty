package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.BoardColumnApi;
import com.habitparty.adapters.in.web.dtos.request.CreateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.BoardColumnResponseDTO;
import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.application.usecases.boardcolumn.BoardColumnOrderCommand;
import com.habitparty.application.usecases.boardcolumn.CreateBoardColumnCommand;
import com.habitparty.application.usecases.boardcolumn.CreateBoardColumnUseCase;
import com.habitparty.application.usecases.boardcolumn.DeleteBoardColumnUseCase;
import com.habitparty.application.usecases.boardcolumn.ListUserBoardColumnsUseCase;
import com.habitparty.application.usecases.boardcolumn.ReorderBoardColumnUseCase;
import com.habitparty.application.usecases.boardcolumn.UpdateBoardColumnUseCase;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class BoardColumnController implements BoardColumnApi {
  private final CreateBoardColumnUseCase createBoardColumnUseCase;
  private final DeleteBoardColumnUseCase deleteBoardColumnUseCase;
  private final ReorderBoardColumnUseCase reorderBoardColumnUseCase;
  private final UpdateBoardColumnUseCase updateBoardColumnUseCase;  
  private final ListUserBoardColumnsUseCase listUserBoardColumnsUseCase;

  @Override
  public ResponseEntity<BoardColumnResponseDTO> createBoardColumn(
      CreateBoardColumnDTO requestDTO,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    var command = new CreateBoardColumnCommand(requestDTO.workspaceId(), requestDTO.name(), requestDTO.icon());
    BoardColumn createdColumn = createBoardColumnUseCase.execute(command, userId);

    return ResponseEntity.status(HttpStatus.CREATED).body(BoardColumnResponseDTO.fromDomain(createdColumn));
  }

  @Override
  public ResponseEntity<Void> deleteBoardColumn(
      UUID id,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    deleteBoardColumnUseCase.execute(id, userId);

    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<Void> updateOrderIndex(
      UUID workspaceId,
      List<UpdateBoardColumnOrderDTO> newOrderList,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    List<BoardColumnOrderCommand> orderCommands = newOrderList.stream()
        .map(dto -> new BoardColumnOrderCommand(dto.board_column_id(), dto.newIndex()))
        .toList();
    reorderBoardColumnUseCase.execute(workspaceId, userId, orderCommands);

    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<BoardColumnResponseDTO> update(
      UUID boardColumnId,
      UpdateBoardColumnDTO dto,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    var command = new com.habitparty.application.usecases.boardcolumn.UpdateBoardColumnCommand(dto.name(), dto.icon());
    BoardColumn updated = updateBoardColumnUseCase.execute(boardColumnId, command, userId);
    return ResponseEntity.ok(BoardColumnResponseDTO.fromDomain(updated));
  }

  @Override
  public ResponseEntity<List<BoardColumnSummaryDTO>> getColumnListByWorkspaceId(
      UUID workspaceId,
      AuthenticatedUser usuarioLogado) {
    List<BoardColumnSummaryDTO> responseList = listUserBoardColumnsUseCase.execute(
        workspaceId, 
        usuarioLogado.id()
    );

    return ResponseEntity.ok(responseList);
  }
}
