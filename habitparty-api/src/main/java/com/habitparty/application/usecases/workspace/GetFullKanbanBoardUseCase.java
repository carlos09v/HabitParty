package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.KanbanBoard;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetFullKanbanBoardUseCase {
  private final WorkspaceRepository port;
  private final BoardColumnRepository columnRepository;
  private final TaskRepository taskRepository;

  public GetFullKanbanBoardUseCase(WorkspaceRepository port, BoardColumnRepository columnRepository,
      TaskRepository taskRepository) {
    this.port = port;
    this.columnRepository = columnRepository;
    this.taskRepository = taskRepository;
  }

  public KanbanBoard execute(UUID workspaceId, UUID userIdLogado) {
    Workspace workspace = port.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado);

    // 2. Pega as Colunas Visíveis daquele Workspace
    List<BoardColumn> columns = columnRepository.findVisibleByWorkspaceId(workspaceId);

    // 3. Busca todas as tarefas das colunas em uma única consulta em lote (elimina N+1)
    List<UUID> columnIds = columns.stream().map(BoardColumn::getId).toList();
    List<Task> allTasks = taskRepository.findByBoardColumnIdInOrderByOrderIndexAsc(columnIds);
    java.util.Map<UUID, List<Task>> tasksByColumn = allTasks.stream()
        .collect(java.util.stream.Collectors.groupingBy(Task::getBoardColumnId));

    // 4. Monta as colunas do Kanban com as tarefas já agrupadas em memória
    List<KanbanBoard.KanbanColumn> kanbanColumns = columns.stream().map(column -> {
      List<Task> tasks = tasksByColumn.getOrDefault(column.getId(), List.of());
      return new KanbanBoard.KanbanColumn(column, tasks);
    }).toList();

    return new KanbanBoard(workspace, kanbanColumns);
  }
}
