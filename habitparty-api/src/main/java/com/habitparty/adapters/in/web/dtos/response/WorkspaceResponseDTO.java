package com.habitparty.adapters.in.web.dtos.response;

import java.time.LocalDate;
import java.time.ZoneId;
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
    return fromKanbanBoard(board, LocalDate.now(), ZoneId.systemDefault());
  }

  public static WorkspaceResponseDTO fromKanbanBoard(KanbanBoard board, LocalDate referenceDate) {
    return fromKanbanBoard(board, referenceDate, ZoneId.systemDefault());
  }

  public static WorkspaceResponseDTO fromKanbanBoard(KanbanBoard board, LocalDate referenceDate, ZoneId zoneId) {
    LocalDate effectiveDate = referenceDate != null ? referenceDate : LocalDate.now();
    ZoneId effectiveZone = zoneId != null ? zoneId : ZoneId.systemDefault();
    List<BoardColumnResponseDTO> columnDTOs = board.columns().stream()
        .map(col -> BoardColumnResponseDTO.fromDomain(
            col.column(),
            col.tasks().stream().map(t -> TaskResponseDTO.fromDomain(t, effectiveDate, effectiveZone)).toList()
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