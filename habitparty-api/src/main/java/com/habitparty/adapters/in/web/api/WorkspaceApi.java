package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateWorkspaceDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateWorkspaceDTO;
import com.habitparty.adapters.in.web.dtos.response.WorkspaceResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/workspaces")
@Tag(name = "Workspaces", description = "Endpoints para gerenciamento de áreas de trabalho (Workspaces)")
public interface WorkspaceApi {

    @Operation(summary = "Criar Workspace", description = "Cria um novo espaço de trabalho para o usuário.")
    @PostMapping
    ResponseEntity<WorkspaceResponseDTO> createWorkspace(
        @RequestBody @Valid CreateWorkspaceDTO requestDTO,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Workspace", description = "Exclui um espaço de trabalho.")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteWorkspace(
        @PathVariable UUID id,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Listar Workspaces", description = "Retorna todos os workspaces do usuário logado.")
    @GetMapping
    ResponseEntity<List<WorkspaceResponseDTO>> getWorkspaceListByUserId(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Workspace", description = "Atualiza dados de um workspace.")
    @PutMapping("/{workspaceId}")
    ResponseEntity<WorkspaceResponseDTO> update(
        @PathVariable UUID workspaceId,
        @Valid @RequestBody UpdateWorkspaceDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Obter Quadro Kanban Completo", description = "Retorna a estrutura completa de colunas e tarefas do Kanban.")
    @GetMapping("/{workspaceId}/kanban")
    ResponseEntity<WorkspaceResponseDTO> getFullKanbanBoard(
        @PathVariable UUID workspaceId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
