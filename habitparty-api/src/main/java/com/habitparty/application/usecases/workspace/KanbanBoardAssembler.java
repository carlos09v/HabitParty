package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.KanbanBoard;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;

/**
 * Montador compartilhado de {@link KanbanBoard} para {@link GetFullKanbanBoardUseCase}
 * e {@link GetAllWorkspacesBoardsUseCase}, convertendo projeções de aplicação
 * ({@link BoardColumnSummaryDTO}) em métricas puras de domínio ({@link KanbanBoard.ColumnMetrics}).
 */
final class KanbanBoardAssembler {

  private KanbanBoardAssembler() {
  }

  static Map<UUID, List<Task>> groupTasksByColumn(List<Task> tasks) {
    if (tasks == null || tasks.isEmpty()) {
      return Map.of();
    }
    return tasks.stream().collect(Collectors.groupingBy(Task::getBoardColumnId));
  }

  static KanbanBoard assembleBoard(
      Workspace workspace,
      List<BoardColumn> columns,
      Map<UUID, List<Task>> tasksByColumn,
      boolean excludeArchivedCompleted,
      Map<UUID, BoardColumnSummaryDTO> summariesByColumnId) {
    List<KanbanBoard.KanbanColumn> kanbanColumns = columns.stream()
        .map(column -> {
          BoardColumnSummaryDTO summary = summariesByColumnId != null
              ? summariesByColumnId.get(column.getId())
              : null;
          KanbanBoard.ColumnMetrics metrics = summary != null
              ? new KanbanBoard.ColumnMetrics(summary.totalTasks(), summary.completedTasks())
              : null;
          return KanbanBoard.KanbanColumn.from(
              column,
              tasksByColumn.getOrDefault(column.getId(), List.of()),
              excludeArchivedCompleted,
              metrics);
        })
        .toList();
    return new KanbanBoard(workspace, kanbanColumns);
  }
}
