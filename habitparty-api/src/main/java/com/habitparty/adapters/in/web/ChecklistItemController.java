package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.ChecklistItemApi;
import com.habitparty.adapters.in.web.dtos.request.CreateChecklistItemDTO;
import com.habitparty.adapters.in.web.dtos.response.ChecklistItemResponseDTO;
import com.habitparty.application.usecases.task.checklistItem.AddChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.DeleteChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.ToggleChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.UpdateChecklistItemUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class ChecklistItemController implements ChecklistItemApi {
  private final AddChecklistItemUseCase addChecklistItemUseCase;
  private final UpdateChecklistItemUseCase updateChecklistItemUseCase;
  private final DeleteChecklistItemUseCase deleteChecklistItemUseCase;
  private final ToggleChecklistItemUseCase toggleChecklistItemUseCase;

  @Override
  public ResponseEntity<ChecklistItemResponseDTO> addItem(
      UUID taskId,
      AuthenticatedUser userIdLogado,
      CreateChecklistItemDTO dto) {
    UUID userId = userIdLogado.id();
    var item = addChecklistItemUseCase.execute(taskId, userId, dto.name());
    return ResponseEntity.status(HttpStatus.CREATED).body(ChecklistItemResponseDTO.fromDomain(item));
  }

  @Override
  public ResponseEntity<ChecklistItemResponseDTO> updateItem(
      UUID itemId,
      AuthenticatedUser userIdLogado,
      CreateChecklistItemDTO dto) {
    UUID userId = userIdLogado.id();
    var item = updateChecklistItemUseCase.execute(itemId, userId, dto.name());
    return ResponseEntity.ok(ChecklistItemResponseDTO.fromDomain(item));
  }

  @Override
  public ResponseEntity<ChecklistItemResponseDTO> toggleItem(
      UUID itemId,
      AuthenticatedUser userIdLogado) {
    UUID userId = userIdLogado.id();
    var item = toggleChecklistItemUseCase.execute(itemId, userId);
    return ResponseEntity.ok(ChecklistItemResponseDTO.fromDomain(item));
  }

  @Override
  public ResponseEntity<Void> deleteItem(
      UUID itemId,
      AuthenticatedUser userIdLogado) {
    UUID userId = userIdLogado.id();

    deleteChecklistItemUseCase.execute(itemId, userId);
    return ResponseEntity.noContent().build();
  }
}
