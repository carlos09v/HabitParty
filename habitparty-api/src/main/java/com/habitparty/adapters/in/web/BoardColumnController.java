package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.BoardColumnResponseDTO;
import com.habitparty.application.usecases.board_column.CreateBoardColumnUseCase;
import com.habitparty.application.usecases.board_column.DeleteBoardColumnUseCase;
import com.habitparty.application.usecases.board_column.ListUserBoardColumnsUseCase;
import com.habitparty.application.usecases.board_column.ReorderBoardColumnUseCase;
import com.habitparty.application.usecases.board_column.UpdateBoardColumnUseCase;
import com.habitparty.core.domain.entities.BoardColumn;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/board_columns")
@Validated // para quando receber uma lista do body, fazendo com que o @Valid funcione
public class BoardColumnController {
  private final CreateBoardColumnUseCase createBoardColumnUseCase;
  private final DeleteBoardColumnUseCase deleteBoardColumnUseCase;
  private final ReorderBoardColumnUseCase reorderBoardColumnUseCase;
  private final UpdateBoardColumnUseCase updateBoardColumnUseCase;  
  private final ListUserBoardColumnsUseCase listUserBoardColumnsUseCase;  

  public BoardColumnController(CreateBoardColumnUseCase createBoardColumnUseCase,
      DeleteBoardColumnUseCase deleteBoardColumnUseCase, ReorderBoardColumnUseCase reorderBoardColumnUseCase,
      UpdateBoardColumnUseCase updateBoardColumnUseCase, ListUserBoardColumnsUseCase listUserBoardColumnsUseCase) {
    this.createBoardColumnUseCase = createBoardColumnUseCase;
    this.deleteBoardColumnUseCase = deleteBoardColumnUseCase;
    this.reorderBoardColumnUseCase = reorderBoardColumnUseCase;
    this.updateBoardColumnUseCase = updateBoardColumnUseCase;
    this.listUserBoardColumnsUseCase = listUserBoardColumnsUseCase;
  }


  @PostMapping
  public ResponseEntity<BoardColumnResponseDTO> createBoardColumn(
    @RequestBody @Valid CreateBoardColumnDTO requestDTO,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    BoardColumn createdColumn = createBoardColumnUseCase.execute(requestDTO, userIdLogado);

    return ResponseEntity.status(HttpStatus.CREATED).body(BoardColumnResponseDTO.fromDomain(createdColumn));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteBoardColumn(
    @PathVariable UUID id,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    deleteBoardColumnUseCase.execute(id, userIdLogado);

    return ResponseEntity.noContent().build();
  }

  @PutMapping("/workspace/{workspaceId}/reorder")
  public ResponseEntity<Void> updateOrderIndex(
    @PathVariable UUID workspaceId,
    @RequestBody @Valid List<UpdateBoardColumnOrderDTO> newOrderList, // O Frontend manda a nova ordem no Body
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    reorderBoardColumnUseCase.execute(workspaceId, newOrderList, userIdLogado);

    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{boardColumnId}")
  public ResponseEntity<BoardColumnResponseDTO> update(
    @PathVariable UUID boardColumnId,
    @RequestBody @Valid UpdateBoardColumnDTO dto,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    BoardColumn updatedBoardColumn = updateBoardColumnUseCase.execute(boardColumnId, dto, userIdLogado);

    return ResponseEntity.ok(BoardColumnResponseDTO.fromDomain(updatedBoardColumn));
  }

  @GetMapping("/workspace/{workspaceId}")
  public ResponseEntity<List<BoardColumnResponseDTO>> getColumnListByWorkspaceId(
      @PathVariable UUID workspaceId,
      @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    // O UseCase deve receber o workspaceId para filtrar, e o userIdLogado para validar se o usuário é dono daquele workspace!
    List<BoardColumn> columns = listUserBoardColumnsUseCase.execute(workspaceId, userIdLogado);

    List<BoardColumnResponseDTO> responseList = columns.stream()
        .map(BoardColumnResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }
}
