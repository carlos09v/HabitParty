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
  public static WorkspaceResponseDTO fromDomain(Workspace workspace) {
    return new WorkspaceResponseDTO(
        workspace.getId(),
        workspace.getUserId(),
        workspace.getName(),
        // Pega a lista do domínio, converte cada item para DTO e junta tudo!
        workspace.getColumns() != null
            ? workspace.getColumns().stream().map(BoardColumnResponseDTO::fromDomain).toList()
            : List.of() // Retorna uma lista vazia caso o Domínio ainda não tenha colunas
    );
  }
}