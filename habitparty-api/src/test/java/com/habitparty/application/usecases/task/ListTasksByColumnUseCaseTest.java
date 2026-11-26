package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
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
import com.habitparty.application.usecases.workspace.GetFullKanbanBoardUseCase;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;

@ExtendWith(MockitoExtension.class)
class ListTasksByColumnUseCaseTest {

  @Mock
  private TaskRepository taskRepository;

  @Mock
  private BoardColumnRepository columnRepository;

  @InjectMocks
  private ListTasksByColumnUseCase useCase;

  @Test
  @DisplayName("Deve buscar tarefas ativas + recentes quando excludeArchivedCompleted=true")
  void excludesArchivedCompletedWhenRequested() {
    UUID userId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    BoardColumn col = mock(BoardColumn.class);
    Task active = mock(Todo.class);
    LocalDate today = LocalDate.of(2026, 11, 15);
    LocalDate expectedCutoff = today.minusDays(GetFullKanbanBoardUseCase.ARCHIVE_CUTOFF_DAYS);

    when(columnRepository.findById(colId)).thenReturn(Optional.of(col));
    when(taskRepository.findDashboardActiveByBoardColumnIds(
        List.of(colId), expectedCutoff, expectedCutoff.atStartOfDay()))
        .thenReturn(List.of(active));

    List<Task> result = useCase.execute(colId, userId, true, today);

    assertEquals(List.of(active), result);
    verify(col).validateOwnership(userId);
  }

  @Test
  @DisplayName("Deve buscar apenas concluídas arquivadas sob demanda com o mesmo corte")
  void loadsArchivedCompletedTodosOnDemand() {
    UUID userId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    BoardColumn col = mock(BoardColumn.class);
    Task archived = mock(Todo.class);
    LocalDate today = LocalDate.of(2026, 11, 15);
    LocalDate expectedCutoff = today.minusDays(GetFullKanbanBoardUseCase.ARCHIVE_CUTOFF_DAYS);
    LocalDateTime expectedCutoffAt = expectedCutoff.atStartOfDay();

    when(columnRepository.findById(colId)).thenReturn(Optional.of(col));
    when(taskRepository.findArchivedCompletedTodosByBoardColumnId(colId, expectedCutoff, expectedCutoffAt))
        .thenReturn(List.of(archived));

    List<Task> result = useCase.executeArchivedCompleted(colId, userId, today);

    assertEquals(List.of(archived), result);
    verify(col).validateOwnership(userId);
  }
}
