package com.habitparty.application.usecases.task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.GetFullKanbanBoardUseCase;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListTasksByColumnUseCase {
  private final TaskRepository port;
  private final BoardColumnRepository columnRepository;

  public ListTasksByColumnUseCase(TaskRepository port, BoardColumnRepository columnRepository) {
    this.port = port;
    this.columnRepository = columnRepository;
  }

  @Transactional(readOnly = true)
  public List<Task> execute(UUID boardColumnId, UUID userIdLogado) {
    return execute(boardColumnId, userIdLogado, false, LocalDate.now());
  }

  @Transactional(readOnly = true)
  public List<Task> execute(
      UUID boardColumnId,
      UUID userIdLogado,
      boolean excludeArchivedCompleted,
      LocalDate referenceToday) {
    BoardColumn column = columnRepository.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));
    column.validateOwnership(userIdLogado);

    if (!excludeArchivedCompleted) {
      return port.findByBoardColumnIdOrderByOrderIndexAsc(boardColumnId);
    }

    GetFullKanbanBoardUseCase.ArchiveWindow archiveWindow =
        GetFullKanbanBoardUseCase.resolveArchiveWindow(referenceToday);
    return port.findDashboardActiveByBoardColumnIds(
        List.of(boardColumnId),
        archiveWindow.minDueDate(),
        archiveWindow.minCompletedAt());
  }

  @Transactional(readOnly = true)
  public List<Task> executeArchivedCompleted(
      UUID boardColumnId,
      UUID userIdLogado,
      LocalDate referenceToday) {
    BoardColumn column = columnRepository.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));
    column.validateOwnership(userIdLogado);

    GetFullKanbanBoardUseCase.ArchiveWindow archiveWindow =
        GetFullKanbanBoardUseCase.resolveArchiveWindow(referenceToday);
    return port.findArchivedCompletedTodosByBoardColumnId(
        boardColumnId,
        archiveWindow.minDueDate(),
        archiveWindow.minCompletedAt());
  }
}
