package com.habitparty.adapters.in.web.dtos.response;

import java.util.UUID;

import com.habitparty.core.domain.entities.BoardColumn;

public record BoardColumnResponseDTO(
    UUID id,
    UUID workspaceId,
    String name,
    int orderIndex,
    String icon
    // Falta adicionar a List de Tasks
) {
    public static BoardColumnResponseDTO fromDomain(BoardColumn column) {
        return new BoardColumnResponseDTO(
            column.getId(),
            column.getWorkspaceId(),
            column.getName(),
            column.getOrderIndex(),
            column.getIcon().orElse(null)
        );
    }
}