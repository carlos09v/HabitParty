package com.habitparty.core.domain.entities;

import java.util.List;
import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskStatus;

public record KanbanBoard(
    Workspace workspace,
    List<KanbanColumn> columns
) {
  public record KanbanColumn(
      BoardColumn column,
      List<Task> tasks,
      Long totalTasks,
      Long completedTasks
  ) {
    public KanbanColumn(BoardColumn column, List<Task> tasks) {
      this(column, tasks, null, null);
    }

    public static KanbanColumn from(
        BoardColumn column,
        List<Task> tasks,
        boolean excludeArchivedCompleted,
        BoardColumnSummaryDTO summary) {
      if (!excludeArchivedCompleted) {
        return new KanbanColumn(column, tasks);
      }
      if (summary != null) {
        return new KanbanColumn(column, tasks, summary.totalTasks(), summary.completedTasks());
      }
      long completedCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
      return new KanbanColumn(column, tasks, (long) tasks.size(), completedCount);
    }
  }
}
