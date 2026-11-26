package com.habitparty.application.usecases.workspace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.KanbanBoard;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;

@ExtendWith(MockitoExtension.class)
class GetFullKanbanBoardUseCaseTest {

  @Mock
  private WorkspaceRepository workspaceRepository;

  @Mock
  private BoardColumnRepository columnRepository;

  @Mock
  private TaskRepository taskRepository;

  @InjectMocks
  private GetFullKanbanBoardUseCase useCase;

  @Test
  @DisplayName("Quando excludeArchivedCompleted=true, carrega apenas janela recente e preserva totais da coluna")
  void excludesArchivedCompletedAndPreservesSummaryCounts() {
    UUID userId = UUID.randomUUID();
    UUID wsId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    Workspace ws = mock(Workspace.class);
    BoardColumn col = mock(BoardColumn.class);
    Task activeTask = mock(Todo.class);
    when(col.getId()).thenReturn(colId);
    when(activeTask.getBoardColumnId()).thenReturn(colId);

    LocalDate today = LocalDate.of(2026, 11, 15);
    LocalDate expectedCutoffDate = today.minusDays(GetFullKanbanBoardUseCase.ARCHIVE_CUTOFF_DAYS);
    LocalDateTime expectedCutoffTime = expectedCutoffDate.atStartOfDay();

    when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(ws));
    when(columnRepository.findVisibleByWorkspaceId(wsId)).thenReturn(List.of(col));
    when(columnRepository.getColumnSummaries(wsId))
        .thenReturn(List.of(new BoardColumnSummaryDTO(colId, "Hoje", "sun", 0, 30L, 22L)));
    when(taskRepository.findDashboardActiveByBoardColumnIds(
        List.of(colId), expectedCutoffDate, expectedCutoffTime))
        .thenReturn(List.of(activeTask));

    KanbanBoard result = useCase.execute(wsId, userId, true, today);

    assertEquals(1, result.columns().size());
    KanbanBoard.KanbanColumn colResult = result.columns().get(0);
    assertEquals(List.of(activeTask), colResult.tasks());
    assertEquals(30L, colResult.totalTasks());
    assertEquals(22L, colResult.completedTasks());
    verify(taskRepository, never()).findByBoardColumnIdInOrderByOrderIndexAsc(any());
  }

  @Test
  @DisplayName("Por padrão carrega todas as tarefas das colunas visíveis")
  void loadsAllTasksByDefault() {
    UUID userId = UUID.randomUUID();
    UUID wsId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    Workspace ws = mock(Workspace.class);
    BoardColumn col = mock(BoardColumn.class);
    Task task = mock(Todo.class);
    when(col.getId()).thenReturn(colId);
    when(task.getBoardColumnId()).thenReturn(colId);

    when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(ws));
    when(columnRepository.findVisibleByWorkspaceId(wsId)).thenReturn(List.of(col));
    when(taskRepository.findByBoardColumnIdInOrderByOrderIndexAsc(List.of(colId)))
        .thenReturn(List.of(task));

    KanbanBoard result = useCase.execute(wsId, userId);

    assertEquals(1, result.columns().size());
    assertEquals(List.of(task), result.columns().get(0).tasks());
    verify(taskRepository, never()).findDashboardActiveByBoardColumnIds(any(), any(), any());
  }

  @Test
  @DisplayName("Quando includeHidden=true busca todas as colunas (visíveis e ocultas) em uma única consulta")
  void includesHiddenColumnsWhenFlagEnabled() {
    UUID userId = UUID.randomUUID();
    UUID wsId = UUID.randomUUID();
    UUID visibleColId = UUID.randomUUID();
    UUID hiddenColId = UUID.randomUUID();
    Workspace ws = mock(Workspace.class);
    BoardColumn visibleCol = mock(BoardColumn.class);
    BoardColumn hiddenCol = mock(BoardColumn.class);
    when(visibleCol.getId()).thenReturn(visibleColId);
    when(hiddenCol.getId()).thenReturn(hiddenColId);

    when(workspaceRepository.findById(wsId)).thenReturn(Optional.of(ws));
    when(columnRepository.findAllByWorkspaceId(wsId)).thenReturn(List.of(visibleCol, hiddenCol));
    when(columnRepository.getColumnSummaries(wsId)).thenReturn(List.of(
        new BoardColumnSummaryDTO(visibleColId, "Hoje", "sun", 0, 2L, 1L),
        new BoardColumnSummaryDTO(hiddenColId, "Oculta", "archive", 1, 5L, 5L)));
    when(taskRepository.findDashboardActiveByBoardColumnIds(any(), any(), any())).thenReturn(List.of());

    KanbanBoard result = useCase.execute(wsId, userId, true, true, LocalDate.of(2026, 11, 15));

    assertEquals(2, result.columns().size());
    verify(columnRepository, never()).findVisibleByWorkspaceId(any());
    verify(columnRepository).findAllByWorkspaceId(wsId);
  }
}
