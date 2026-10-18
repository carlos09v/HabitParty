package com.habitparty.adapters.in.web.dtos.response;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.KanbanBoard;
import com.habitparty.core.domain.entities.Workspace;

public record WorkspaceResponseDTO(
    UUID id,
    UUID userId,
    String name,
    List<BoardColumnResponseDTO> columns
) {
  // 1. Usado para o Menu Lateral (Sidebar) - Devolve as colunas vazias
  public static WorkspaceResponseDTO fromDomain(Workspace workspace) {
    return new WorkspaceResponseDTO(
        workspace.getId(),
        workspace.getUserId(),
        workspace.getName(),
        List.of()
    );
  }

  // 2. Usado no GET Grandão - Recebe as colunas já processadas!
  public static WorkspaceResponseDTO fromDomain(Workspace workspace, List<BoardColumnResponseDTO> columns) {
    return new WorkspaceResponseDTO(
        workspace.getId(),
        workspace.getUserId(),
        workspace.getName(),
        columns);
  }

  // 3. Mapeia a partir do Aggregate/Record KanbanBoard puro de domínio
  public static WorkspaceResponseDTO fromKanbanBoard(KanbanBoard board) {
    List<BoardColumnResponseDTO> columnDTOs = board.columns().stream()
        .map(col -> BoardColumnResponseDTO.fromDomain(
            col.column(),
            col.tasks().stream().map(TaskResponseDTO::fromDomain).toList()
        ))
        .toList();

    return new WorkspaceResponseDTO(
        board.workspace().getId(),
        board.workspace().getUserId(),
        board.workspace().getName(),
        columnDTOs
    );
  }
}