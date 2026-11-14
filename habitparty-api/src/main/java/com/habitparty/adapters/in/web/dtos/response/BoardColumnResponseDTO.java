package com.habitparty.adapters.in.web.dtos.response;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.BoardColumn;

public record BoardColumnResponseDTO(
        UUID id,
        UUID workspaceId,
        boolean isVisible,
        String name,
        int orderIndex,
        String icon,
        List<TaskResponseDTO> tasks,
        @JsonInclude(JsonInclude.Include.NON_NULL) Long totalTasks,
        @JsonInclude(JsonInclude.Include.NON_NULL) Long completedTasks) {
    // MÉTDO 1: Usado pelo Controller simples (sem as tasks)
    public static BoardColumnResponseDTO fromDomain(BoardColumn column) {
        return new BoardColumnResponseDTO(
                column.getId(),
                column.getWorkspaceId(),
                column.isVisible(),
                column.getName(),
                column.getOrderIndex(),
                column.getIcon().orElse(null),
                List.of(), // <-- Injeta uma lista vazia automaticamente!
                null,
                null
        );
    }

    // MÉTODO 2: Usado pelo GetFullKanbanBoardUseCase (GET Grandão com as tasks)
    public static BoardColumnResponseDTO fromDomain(BoardColumn column, List<TaskResponseDTO> tasks) {
        return fromDomain(column, tasks, null, null);
    }

    public static BoardColumnResponseDTO fromDomain(
            BoardColumn column,
            List<TaskResponseDTO> tasks,
            Long totalTasks,
            Long completedTasks) {
        return new BoardColumnResponseDTO(
                column.getId(),
                column.getWorkspaceId(),
                column.isVisible(),
                column.getName(),
                column.getOrderIndex(),
                column.getIcon().orElse(null),
                tasks, // <-- Usa as tarefas passadas por parâmetro
                totalTasks,
                completedTasks
        );
    }
}