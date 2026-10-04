package com.habitparty.adapters.in.web.api;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateChecklistItemDTO;
import com.habitparty.adapters.in.web.dtos.response.ChecklistItemResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/tasks")
@Tag(name = "Checklist Items", description = "Endpoints para gerenciamento de itens de checklist de tarefas")
public interface ChecklistItemApi {

    @Operation(summary = "Adicionar Item ao Checklist", description = "Adiciona um novo item de checklist vinculado a uma tarefa.")
    @PostMapping("/{taskId}/checklists")
    ResponseEntity<ChecklistItemResponseDTO> addItem(
        @PathVariable UUID taskId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestBody @Valid CreateChecklistItemDTO dto
    );

    @Operation(summary = "Atualizar Item do Checklist", description = "Atualiza o texto de um item de checklist.")
    @PutMapping("/checklists/{itemId}")
    ResponseEntity<ChecklistItemResponseDTO> updateItem(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado,
        @RequestBody @Valid CreateChecklistItemDTO dto
    );

    @Operation(summary = "Alternar Conclusão do Item", description = "Marca ou desmarca o checkbox de um item de checklist.")
    @PatchMapping("/checklists/{itemId}/toggle")
    ResponseEntity<ChecklistItemResponseDTO> toggleItem(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado
    );

    @Operation(summary = "Excluir Item do Checklist", description = "Remove um item de checklist.")
    @DeleteMapping("/checklists/{itemId}")
    ResponseEntity<Void> deleteItem(
        @PathVariable UUID itemId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser userIdLogado
    );
}
