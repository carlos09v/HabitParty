package com.habitparty.application.usecases.task;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class MoveTaskUseCase {
  private final TaskRepository taskPort;
  private final BoardColumnRepository boardColumnPort;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public MoveTaskUseCase(TaskRepository taskPort, BoardColumnRepository boardColumnPort) {
    this.taskPort = taskPort;
    this.boardColumnPort = boardColumnPort;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public void execute(UUID userIdLogado, List<MoveTaskCommand> itemsToMove) {
    if (itemsToMove == null || itemsToMove.isEmpty()) {
      return;
    }

    Set<UUID> uniqueTaskIds = new LinkedHashSet<>();
    for (MoveTaskCommand item : itemsToMove) {
      if (item.newOrderIndex() < 0) {
        throw new DomainValidationException("O índice de ordem não pode ser negativo.");
      }
      uniqueTaskIds.add(item.taskId());
    }

    // 1. Carrega todas as tarefas envolvidas em 1 única consulta em lote (elimina N+1)
    Map<UUID, Task> tasksById = loadTasksByIds(uniqueTaskIds);

    // 2. Valida propriedade das tarefas e coleta todas as colunas de origem e destino envolvidas
    Set<UUID> requiredColumnIds = new LinkedHashSet<>();
    for (MoveTaskCommand item : itemsToMove) {
      Task task = tasksById.get(item.taskId());
      if (task == null) {
        throw new ResourceNotFoundException("Tarefa não encontrada: " + item.taskId());
      }
      task.validateOwnership(userIdLogado);
      requiredColumnIds.add(task.getBoardColumnId());
      if (item.boardColumnId() != null) {
        requiredColumnIds.add(item.boardColumnId());
      }
    }

    // 3. Carrega todas as colunas envolvidas em 1 única consulta em lote
    Map<UUID, BoardColumn> columnsById = loadColumnsByIds(requiredColumnIds);

    // 4. Valida propriedade e permissão de escrita por ambiente (sem repetir guardas no mesmo workspace)
    Set<UUID> validatedSourceWorkspaces = new HashSet<>();
    Set<UUID> validatedTargetWorkspaces = new HashSet<>();
    List<Task> tasksToUpdate = new ArrayList<>(itemsToMove.size());

    for (MoveTaskCommand item : itemsToMove) {
      Task task = tasksById.get(item.taskId());

      UUID sourceColumnId = task.getBoardColumnId();
      BoardColumn sourceColumn = columnsById.get(sourceColumnId);
      if (sourceColumn == null) {
        throw new ResourceNotFoundException("Coluna de origem não encontrada: " + sourceColumnId);
      }
      sourceColumn.validateOwnership(userIdLogado);
      if (workspaceWriteGuard != null && validatedSourceWorkspaces.add(sourceColumn.getWorkspaceId())) {
        workspaceWriteGuard.assertWorkspaceWritable(
            sourceColumn.getWorkspaceId(),
            userIdLogado,
            "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para mover tarefas dele!");
      }

      UUID targetColumnId = item.boardColumnId() != null ? item.boardColumnId() : sourceColumn.getId();
      BoardColumn targetColumn = columnsById.get(targetColumnId);
      if (targetColumn == null) {
        throw new ResourceNotFoundException("Coluna de destino não encontrada: " + targetColumnId);
      }
      targetColumn.validateOwnership(userIdLogado);
      if (workspaceWriteGuard != null && validatedTargetWorkspaces.add(targetColumn.getWorkspaceId())) {
        workspaceWriteGuard.assertWorkspaceWritable(
            targetColumn.getWorkspaceId(),
            userIdLogado,
            "O ambiente de destino está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para mover tarefas para ele!");
      }

      task.moveTo(targetColumnId, item.newOrderIndex());
      tasksToUpdate.add(task);
    }

    taskPort.saveAll(tasksToUpdate);
  }

  private Map<UUID, Task> loadTasksByIds(Set<UUID> taskIds) {
    Map<UUID, Task> map = new HashMap<>(taskIds.size());
    taskPort.findAllByIds(taskIds).ifPresentOrElse(
        tasks -> {
          for (Task task : tasks) {
            if (task != null && task.getId() != null) {
              map.put(task.getId(), task);
            }
          }
        },
        () -> {
          for (UUID taskId : taskIds) {
            taskPort.findById(taskId).ifPresent(task -> map.put(taskId, task));
          }
        });
    return map;
  }

  private Map<UUID, BoardColumn> loadColumnsByIds(Set<UUID> columnIds) {
    Map<UUID, BoardColumn> map = new HashMap<>(columnIds.size());
    boardColumnPort.findAllByIds(columnIds).ifPresentOrElse(
        columns -> {
          for (BoardColumn col : columns) {
            if (col != null && col.getId() != null) {
              map.put(col.getId(), col);
            }
          }
        },
        () -> {
          for (UUID colId : columnIds) {
            boardColumnPort.findById(colId).ifPresent(col -> map.put(colId, col));
          }
        });
    return map;
  }
}
