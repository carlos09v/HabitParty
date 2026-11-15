package com.habitparty.adapters.out.persistence;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.adapters.out.persistence.mappers.ChecklistItemMapper;
import com.habitparty.adapters.out.persistence.mappers.TaskMapper;
import com.habitparty.adapters.out.persistence.repository.ChecklistItemJpaRepository;
import com.habitparty.adapters.out.persistence.repository.TaskJpaRepository;

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
}
