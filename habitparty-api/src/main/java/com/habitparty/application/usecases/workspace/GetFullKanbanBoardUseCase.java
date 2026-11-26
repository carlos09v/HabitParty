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
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetFullKanbanBoardUseCase {
  public static final int ARCHIVE_CUTOFF_DAYS = 7;

  public record ArchiveWindow(LocalDate minDueDate, LocalDateTime minCompletedAt) {
  }

  public static ArchiveWindow resolveArchiveWindow(LocalDate referenceToday) {
    LocalDate effectiveToday = referenceToday != null ? referenceToday : LocalDate.now();
    LocalDate minDueDate = effectiveToday.minusDays(ARCHIVE_CUTOFF_DAYS);
    return new ArchiveWindow(minDueDate, minDueDate.atStartOfDay());
  }

  private final WorkspaceRepository port;
  private final BoardColumnRepository columnRepository;
  private final TaskRepository taskRepository;

  public GetFullKanbanBoardUseCase(WorkspaceRepository port, BoardColumnRepository columnRepository,
      TaskRepository taskRepository) {
    this.port = port;
    this.columnRepository = columnRepository;
    this.taskRepository = taskRepository;
  }

  @Transactional(readOnly = true)
  public KanbanBoard execute(UUID workspaceId, UUID userIdLogado) {
    return execute(workspaceId, userIdLogado, false, false, LocalDate.now());
  }

  @Transactional(readOnly = true)
  public KanbanBoard execute(
      UUID workspaceId,
      UUID userIdLogado,
      boolean excludeArchivedCompleted,
      LocalDate referenceToday) {
    return execute(workspaceId, userIdLogado, excludeArchivedCompleted, false, referenceToday);
  }

  @Transactional(readOnly = true)
  public KanbanBoard execute(
      UUID workspaceId,
      UUID userIdLogado,
      boolean excludeArchivedCompleted,
      boolean includeHidden,
      LocalDate referenceToday) {
    Workspace workspace = port.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado);

    // 2. Pega as colunas (visíveis ou todas) do Workspace
    List<BoardColumn> columns = includeHidden
        ? columnRepository.findAllByWorkspaceId(workspaceId)
        : columnRepository.findVisibleByWorkspaceId(workspaceId);
    List<UUID> columnIds = columns.stream().map(BoardColumn::getId).toList();

    Map<UUID, BoardColumnSummaryDTO> summariesByColumnId = (excludeArchivedCompleted && !columnIds.isEmpty())
        ? columnRepository.getColumnSummaries(workspaceId).stream()
            .collect(Collectors.toMap(
                BoardColumnSummaryDTO::id,
                summary -> summary,
                (existing, ignored) -> existing))
        : Map.of();

    // 3. Busca todas as tarefas das colunas em uma única consulta em lote (elimina N+1)
    List<Task> allTasks;
    if (columnIds.isEmpty()) {
      allTasks = List.of();
    } else if (excludeArchivedCompleted) {
      ArchiveWindow archiveWindow = resolveArchiveWindow(referenceToday);
      allTasks = taskRepository.findDashboardActiveByBoardColumnIds(
          columnIds,
          archiveWindow.minDueDate(),
          archiveWindow.minCompletedAt());
    } else {
      allTasks = taskRepository.findByBoardColumnIdInOrderByOrderIndexAsc(columnIds);
    }

    Map<UUID, List<Task>> tasksByColumn = KanbanBoardAssembler.groupTasksByColumn(allTasks);

    // 4. Monta as colunas do Kanban com as tarefas já agrupadas e totais reais preservados
    return KanbanBoardAssembler.assembleBoard(
        workspace,
        columns,
        tasksByColumn,
        excludeArchivedCompleted,
        summariesByColumnId);
  }
}
