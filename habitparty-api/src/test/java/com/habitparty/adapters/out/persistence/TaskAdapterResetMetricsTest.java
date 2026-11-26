package com.habitparty.adapters.out.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.adapters.out.persistence.entities.HabitJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.ChecklistItemMapper;
import com.habitparty.adapters.out.persistence.mappers.TaskMapper;
import com.habitparty.adapters.out.persistence.repository.ChecklistItemJpaRepository;
import com.habitparty.adapters.out.persistence.repository.TaskJpaRepository;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.task.TaskType;

@ExtendWith(MockitoExtension.class)
class TaskAdapterResetMetricsTest {

  @Mock
  private TaskJpaRepository taskJpaRepository;
  @Mock
  private ChecklistItemJpaRepository checklistJpaRepository;
  @Mock
  private TaskMapper taskMapper;
  @Mock
  private ChecklistItemMapper checklistMapper;

  private TaskAdapter taskAdapter;

  @BeforeEach
  void setUp() {
    taskAdapter = new TaskAdapter(
        taskJpaRepository,
        checklistJpaRepository,
        taskMapper,
        checklistMapper);
  }

  @Test
  @DisplayName("Deve resetar métricas de Habit, Daily e Task para o usuário sem apagar tarefas")
  void shouldResetHabitDailyAndTaskFocusMetricsForUser() {
    UUID userId = UUID.randomUUID();

    taskAdapter.resetMetricsByUserId(userId);

    InOrder order = inOrder(taskJpaRepository);
    order.verify(taskJpaRepository).resetHabitMetricsByUserId(userId);
    order.verify(taskJpaRepository).resetDailyMetricsByUserId(userId);
    order.verify(taskJpaRepository).resetTaskFocusMetricsByUserId(userId);
    verifyNoMoreInteractions(taskJpaRepository, checklistJpaRepository);
  }

  @Test
  @DisplayName("Não deve consultar checklist_item ao carregar apenas tarefas do tipo HABIT")
  void shouldSkipChecklistQueryWhenLoadingOnlyHabits() {
    UUID userId = UUID.randomUUID();
    UUID habitId = UUID.randomUUID();
    HabitJpaEntity habitEntity = HabitJpaEntity.builder()
        .id(habitId)
        .userId(userId)
        .taskType(TaskType.HABIT)
        .build();

    Task mappedHabit = mock(Habit.class);
    when(taskJpaRepository.findRecurringTasksByUserIds(List.of(userId))).thenReturn(List.of(habitEntity));
    when(taskJpaRepository.findById(habitId)).thenReturn(Optional.of(habitEntity));
    when(taskMapper.toDomain(habitEntity, List.of())).thenReturn(mappedHabit);

    List<Task> recurring = taskAdapter.findRecurringTasksByUserIds(List.of(userId));
    Optional<Task> single = taskAdapter.findById(habitId);

    assertEquals(1, recurring.size());
    assertEquals(mappedHabit, single.orElseThrow());
    verify(checklistJpaRepository, never()).findAllByTaskIds(anyCollection());
  }
}
