package com.habitparty.core.domain.entities;

import java.util.List;
import com.habitparty.core.domain.entities.task.Task;

public record KanbanBoard(
    Workspace workspace,
    List<KanbanColumn> columns
) {
  public record KanbanColumn(
      BoardColumn column,
      List<Task> tasks
  ) {}
}
