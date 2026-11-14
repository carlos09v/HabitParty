package com.habitparty.application.usecases.workspace;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.KanbanBoard;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskStatus;

/**
 * Carrega todos os workspaces do usuário com todas as suas colunas (visíveis e ocultas)
 * e tarefas em uma única consulta em lote para o Dashboard multi-ambiente.
 */
@Service
public class GetAllWorkspacesBoardsUseCase {
  private static final int ARCHIVE_CUTOFF_EXTRA_DAYS = 7;

  private final WorkspaceRepository workspaceRepository;
  private final BoardColumnRepository columnRepository;
  private final TaskRepository taskRepository;

  public GetAllWorkspacesBoardsUseCase(
      WorkspaceRepository workspaceRepository,
      BoardColumnRepository columnRepository,
      TaskRepository taskRepository) {
    this.workspaceRepository = workspaceRepository;
    this.columnRepository = columnRepository;
    this.taskRepository = taskRepository;
  }

  @Transactional(readOnly = true)
  public List<KanbanBoard> execute(UUID userId) {
    return execute(userId, false, LocalDate.now());
  }

  @Transactional(readOnly = true)
  public List<KanbanBoard> execute(UUID userId, boolean excludeArchivedCompleted, LocalDate referenceToday) {
    List<Workspace> workspaces = workspaceRepository.findAllByUserId(userId);
    if (workspaces.isEmpty()) {
      return List.of();
    }

    List<UUID> workspaceIds = workspaces.stream().map(Workspace::getId).toList();
    List<BoardColumn> allColumns = columnRepository.findAllByWorkspaceIds(workspaceIds);
    List<UUID> columnIds = allColumns.stream().map(BoardColumn::getId).toList();

    Map<UUID, BoardColumnSummaryDTO> summariesByColumnId = (excludeArchivedCompleted && !columnIds.isEmpty())
        ? columnRepository.getColumnSummariesByWorkspaceIds(workspaceIds)
        : Map.of();

    List<Task> allTasks;
    if (columnIds.isEmpty()) {
      allTasks = List.of();
    } else if (excludeArchivedCompleted) {
      LocalDate effectiveToday = referenceToday != null ? referenceToday : LocalDate.now();
      LocalDate minDueDate = effectiveToday.withDayOfMonth(1).minusDays(ARCHIVE_CUTOFF_EXTRA_DAYS);
      LocalDateTime minCompletedAt = minDueDate.atStartOfDay();
      allTasks = taskRepository.findDashboardActiveByBoardColumnIds(columnIds, minDueDate, minCompletedAt);
    } else {
      allTasks = taskRepository.findByBoardColumnIdInOrderByOrderIndexAsc(columnIds);
    }

    Map<UUID, List<Task>> tasksByColumn = allTasks.stream()
        .collect(Collectors.groupingBy(Task::getBoardColumnId));
    Map<UUID, List<BoardColumn>> columnsByWorkspace = allColumns.stream()
        .collect(Collectors.groupingBy(BoardColumn::getWorkspaceId));

    return workspaces.stream()
        .map(workspace -> {
          List<BoardColumn> wsColumns = columnsByWorkspace.getOrDefault(workspace.getId(), List.of());
          List<KanbanBoard.KanbanColumn> kanbanColumns = wsColumns.stream()
              .map(column -> toKanbanColumn(
                  column,
                  tasksByColumn.getOrDefault(column.getId(), List.of()),
                  excludeArchivedCompleted,
                  summariesByColumnId.get(column.getId())))
              .toList();
          return new KanbanBoard(workspace, kanbanColumns);
        })
        .toList();
  }

  private KanbanBoard.KanbanColumn toKanbanColumn(
      BoardColumn column,
      List<Task> tasks,
      boolean excludeArchivedCompleted,
      BoardColumnSummaryDTO summary) {
    if (!excludeArchivedCompleted) {
      return new KanbanBoard.KanbanColumn(column, tasks);
    }
    if (summary != null) {
      return new KanbanBoard.KanbanColumn(column, tasks, summary.totalTasks(), summary.completedTasks());
    }
    long completedCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
    return new KanbanBoard.KanbanColumn(column, tasks, (long) tasks.size(), completedCount);
  }
}
