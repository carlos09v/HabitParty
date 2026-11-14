package com.habitparty.application.usecases.workspace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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

@ExtendWith(MockitoExtension.class)
class GetAllWorkspacesBoardsUseCaseTest {

  @Mock
  private WorkspaceRepository workspaceRepository;

  @Mock
  private BoardColumnRepository columnRepository;

  @Mock
  private TaskRepository taskRepository;

  @InjectMocks
  private GetAllWorkspacesBoardsUseCase useCase;

  @Test
  @DisplayName("Deve retornar lista vazia sem consultar colunas ou tarefas quando usuário não tem workspaces")
  void shouldReturnEmptyListWhenUserHasNoWorkspaces() {
    UUID userId = UUID.randomUUID();
    when(workspaceRepository.findAllByUserId(userId)).thenReturn(List.of());

    List<KanbanBoard> result = useCase.execute(userId);

    assertTrue(result.isEmpty());
    verify(columnRepository, never()).findAllByWorkspaceIds(any());
    verify(taskRepository, never()).findByBoardColumnIdInOrderByOrderIndexAsc(any());
  }

  @Test
  @DisplayName("Deve carregar workspaces sem colunas sem consultar tarefas")
  void shouldHandleWorkspacesWithoutColumns() {
    UUID userId = UUID.randomUUID();
    UUID wsId = UUID.randomUUID();
    Workspace ws = new Workspace(wsId, userId, "Pessoal");
    when(workspaceRepository.findAllByUserId(userId)).thenReturn(List.of(ws));
    when(columnRepository.findAllByWorkspaceIds(List.of(wsId))).thenReturn(List.of());

    List<KanbanBoard> result = useCase.execute(userId);

    assertEquals(1, result.size());
    assertEquals(wsId, result.get(0).workspace().getId());
    assertTrue(result.get(0).columns().isEmpty());
    verify(taskRepository, never()).findByBoardColumnIdInOrderByOrderIndexAsc(any());
  }

  @Test
  @DisplayName("Deve agrupar colunas (visíveis e ocultas) e tarefas por workspace em consultas em lote")
  void shouldGroupColumnsAndTasksAcrossMultipleWorkspaces() {
    UUID userId = UUID.randomUUID();
    UUID ws1Id = UUID.randomUUID();
    UUID ws2Id = UUID.randomUUID();
    Workspace ws1 = new Workspace(ws1Id, userId, "Casa");
    Workspace ws2 = new Workspace(ws2Id, userId, "Trabalho");

    UUID col1VisibleId = UUID.randomUUID();
    UUID col2HiddenId = UUID.randomUUID();
    UUID col3OtherWsId = UUID.randomUUID();

    BoardColumn col1Visible = new BoardColumn(col1VisibleId, userId, ws1Id, "Rotina", 0, "sun", true);
    BoardColumn col2Hidden = new BoardColumn(col2HiddenId, userId, ws1Id, "Arquivo", 1, "archive", false);
    BoardColumn col3OtherWs = new BoardColumn(col3OtherWsId, userId, ws2Id, "Sprint", 0, "briefcase", true);

    Task task1 = mock(Task.class);
    when(task1.getBoardColumnId()).thenReturn(col1VisibleId);
    Task task2 = mock(Task.class);
    when(task2.getBoardColumnId()).thenReturn(col2HiddenId);
    Task task3 = mock(Task.class);
    when(task3.getBoardColumnId()).thenReturn(col3OtherWsId);

    when(workspaceRepository.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2));
    when(columnRepository.findAllByWorkspaceIds(List.of(ws1Id, ws2Id)))
        .thenReturn(List.of(col1Visible, col2Hidden, col3OtherWs));
    when(taskRepository.findByBoardColumnIdInOrderByOrderIndexAsc(List.of(col1VisibleId, col2HiddenId, col3OtherWsId)))
        .thenReturn(List.of(task1, task2, task3));

    List<KanbanBoard> result = useCase.execute(userId);

    assertEquals(2, result.size());
    assertEquals("Casa", result.get(0).workspace().getName());
    assertEquals(2, result.get(0).columns().size());
    assertEquals(List.of(task1), result.get(0).columns().get(0).tasks());
    assertEquals(List.of(task2), result.get(0).columns().get(1).tasks());

    assertEquals("Trabalho", result.get(1).workspace().getName());
    assertEquals(1, result.get(1).columns().size());
    assertEquals(List.of(task3), result.get(1).columns().get(0).tasks());
  }

  @Test
  @DisplayName("Quando excludeArchivedCompleted=true busca apenas tarefas ativas recentes e preserva totais escalares por coluna")
  void shouldLoadActiveDashboardTasksWithColumnSummaryTotalsWhenFlagEnabled() {
    UUID userId = UUID.randomUUID();
    UUID wsId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    Workspace ws = new Workspace(wsId, userId, "Foco");
    BoardColumn col = new BoardColumn(colId, userId, wsId, "Hoje", 0, "sun", true);

    Task activeTask = mock(Task.class);
    when(activeTask.getBoardColumnId()).thenReturn(colId);

    LocalDate today = LocalDate.of(2026, 11, 14);
    LocalDate expectedCutoffDate = LocalDate.of(2026, 10, 25); // 2026-11-01 - 7 days
    LocalDateTime expectedCutoffTime = expectedCutoffDate.atStartOfDay();

    when(workspaceRepository.findAllByUserId(userId)).thenReturn(List.of(ws));
    when(columnRepository.findAllByWorkspaceIds(List.of(wsId))).thenReturn(List.of(col));
    when(columnRepository.getColumnSummariesByWorkspaceIds(List.of(wsId))).thenReturn(Map.of(
        colId, new BoardColumnSummaryDTO(colId, "Hoje", "sun", 0, 25L, 19L)));
    when(taskRepository.findDashboardActiveByBoardColumnIds(
        List.of(colId), expectedCutoffDate, expectedCutoffTime))
        .thenReturn(List.of(activeTask));

    List<KanbanBoard> result = useCase.execute(userId, true, today);

    assertEquals(1, result.size());
    KanbanBoard.KanbanColumn colResult = result.get(0).columns().get(0);
    assertEquals(List.of(activeTask), colResult.tasks());
    assertEquals(25L, colResult.totalTasks());
    assertEquals(19L, colResult.completedTasks());
    verify(taskRepository, never()).findByBoardColumnIdInOrderByOrderIndexAsc(any());
  }
}
