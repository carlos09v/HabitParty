package com.habitparty.adapters.in.web.api;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.habitparty.adapters.in.web.dtos.request.CreateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateBoardColumnOrderDTO;
import com.habitparty.adapters.in.web.dtos.response.BoardColumnResponseDTO;
import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/board_columns")
@Validated
@Tag(name = "Board Columns", description = "Endpoints para gerenciamento de colunas do quadro Kanban")
public interface BoardColumnApi {

    @Operation(summary = "Criar Coluna", description = "Cria uma nova coluna no Kanban.")
    @PostMapping
    ResponseEntity<BoardColumnResponseDTO> createBoardColumn(
        @RequestBody @Valid CreateBoardColumnDTO requestDTO,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Excluir Coluna", description = "Remove uma coluna existente.")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteBoardColumn(
        @PathVariable UUID id,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Reordenar Colunas", description = "Atualiza os índices de ordem das colunas em um workspace.")
    @PutMapping("/workspace/{workspaceId}/reorder")
    ResponseEntity<Void> updateOrderIndex(
        @PathVariable UUID workspaceId,
        @RequestBody List<@Valid UpdateBoardColumnOrderDTO> newOrderList,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Coluna", description = "Atualiza nome e configurações de uma coluna.")
    @PutMapping("/{boardColumnId}")
    ResponseEntity<BoardColumnResponseDTO> update(
        @PathVariable UUID boardColumnId,
        @RequestBody @Valid UpdateBoardColumnDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Listar Colunas por Workspace", description = "Retorna o resumo das colunas de um workspace específico.")
    @GetMapping("/workspace/{workspaceId}")
    ResponseEntity<List<BoardColumnSummaryDTO>> getColumnListByWorkspaceId(
        @PathVariable UUID workspaceId,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
