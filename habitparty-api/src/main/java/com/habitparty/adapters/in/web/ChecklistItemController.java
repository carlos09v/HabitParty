package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateChecklistItemDTO;
import com.habitparty.adapters.in.web.dtos.response.ChecklistItemResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.task.checklistItem.AddChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.DeleteChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.ToggleChecklistItemUseCase;
import com.habitparty.application.usecases.task.checklistItem.UpdateChecklistItemUseCase;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/tasks")
public class ChecklistItemController {
  private final AddChecklistItemUseCase addChecklistItemUseCase;
  private final UpdateChecklistItemUseCase updateChecklistItemUseCase;
  private final DeleteChecklistItemUseCase deleteChecklistItemUseCase;
  private final ToggleChecklistItemUseCase toggleChecklistItemUseCase;

  public ChecklistItemController(AddChecklistItemUseCase addChecklistItemUseCase,
      UpdateChecklistItemUseCase updateChecklistItemUseCase,
      DeleteChecklistItemUseCase deleteChecklistItemUseCase,
      ToggleChecklistItemUseCase toggleChecklistItemUseCase) {
    this.addChecklistItemUseCase = addChecklistItemUseCase;
    this.updateChecklistItemUseCase = updateChecklistItemUseCase;
    this.deleteChecklistItemUseCase = deleteChecklistItemUseCase;
    this.toggleChecklistItemUseCase = toggleChecklistItemUseCase;
  }

  // Criação: Rota aninhada (Nested Route)
  @PostMapping("/{taskId}/checklists")
  public ResponseEntity<ChecklistItemResponseDTO> addItem(
      @PathVariable UUID taskId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @RequestBody @Valid CreateChecklistItemDTO dto) {
    UUID userId = userIdLogado.getId();

    ChecklistItemResponseDTO response = addChecklistItemUseCase.execute(taskId, userId, dto.name());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PutMapping("/checklists/{itemId}")
  public ResponseEntity<ChecklistItemResponseDTO> updateItem(
      @PathVariable UUID itemId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado,
      @RequestBody @Valid CreateChecklistItemDTO dto) {
    UUID userId = userIdLogado.getId();

    ChecklistItemResponseDTO response = updateChecklistItemUseCase.execute(itemId, userId, dto.name());
    return ResponseEntity.ok(response);
  }

  // Toggle de conclusão (Clicou no Checkbox) -> PATCH porque altera apenas o estado!
  @PatchMapping("/checklists/{itemId}/toggle")
  public ResponseEntity<ChecklistItemResponseDTO> toggleItem(
      @PathVariable UUID itemId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado) {
    UUID userId = userIdLogado.getId();

    ChecklistItemResponseDTO response = toggleChecklistItemUseCase.execute(itemId, userId);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/checklists/{itemId}")
  public ResponseEntity<Void> deleteItem(
      @PathVariable UUID itemId,
      @AuthenticationPrincipal UserJpaEntity userIdLogado) {
    UUID userId = userIdLogado.getId();

    deleteChecklistItemUseCase.execute(itemId, userId);
    return ResponseEntity.noContent().build();
  }
}
