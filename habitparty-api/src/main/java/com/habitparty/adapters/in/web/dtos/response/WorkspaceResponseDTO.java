package com.habitparty.adapters.in.web.dtos.response;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.Workspace;

public record WorkspaceResponseDTO(
    UUID id,
    UUID userId,
    String name,
    List<BoardColumnResponseDTO> columns // Traz todas as colunas -> prática do (Aninhamento / Eager Loading) que é o carregamento incial de tudo que precisa (1 get grande) e não 3 gets (workspace, boardColumn e tasks)
) {
  // 1. Usado para o Menu Lateral (Sidebar) - Devolve as colunas vazias
  public static WorkspaceResponseDTO fromDomain(Workspace workspace) {
    return new WorkspaceResponseDTO(
        workspace.getId(),
        workspace.getUserId(),
        workspace.getName(),
        List.of() // Lista vazia para não pesar o JSON
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
}