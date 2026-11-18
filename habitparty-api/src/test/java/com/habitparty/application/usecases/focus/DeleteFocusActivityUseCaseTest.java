package com.habitparty.application.usecases.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@ExtendWith(MockitoExtension.class)
class DeleteFocusActivityUseCaseTest {

  @Mock
  private FocusActivityRepository activityPort;

  @Mock
  private FocusRecordRepository recordPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private UserRepository userPort;

  @Mock
  private TaskRepository taskPort;

  @Mock
  private InventoryItemRepository inventoryItemPort;

  @InjectMocks
  private DeleteFocusActivityUseCase useCase;

  private UUID userId;
  private UUID activityId;
  private FocusActivity activity;

  @BeforeEach
  void setUp() {
    useCase.setUserPort(userPort);
    useCase.setTaskPort(taskPort);
    useCase.setInventoryItemPort(inventoryItemPort);
    userId = UUID.randomUUID();
    activityId = UUID.randomUUID();
    activity = new FocusActivity(
        activityId,
        userId,
        "Programação",
        "code",
        0,
        FocusRecordType.POMO,
        25,
        LocalDateTime.now());
  }

  @Test
  @DisplayName("Ao excluir atividade com deleteHistory=true, estorna XP, moedas (sem negativar), UserStats e métricas de Task")
  void shouldRevertAllEconomyAndTaskMetricsWhenDeleteHistoryIsTrue() {
    User user = new User(
        userId,
        UserRole.USER,
        false,
        "Dev",
        "dev",
        "dev@habitparty.com",
        "pwd",
        new BigDecimal("0.60"),
        new BigDecimal("2.00"),
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        110, // Level APPRENTICE (minXp = 100)
        0,
        0,
        LocalDateTime.now());
    user.getStats().recordFocusCompleted(30, 1);
    user.getStats().recordFocusCompleted(25, 1);

    UUID taskId = UUID.randomUUID();
    Todo linkedTask = new Todo(
        taskId,
        UUID.randomUUID(),
        userId,
        "Refatorar Foco",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        false,
        LocalDate.now(),
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null);
    linkedTask.addFocusSession(55, 2);

    UUID r1Id = UUID.randomUUID();
    UUID r2Id = UUID.randomUUID();
    FocusRecord r1 = new FocusRecord(
        r1Id, userId, activityId, null, taskId, "Refatorar Foco", null,
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 30),
        FocusRecordType.POMO, 1, 15, new BigDecimal("1.00"));
    FocusRecord r2 = new FocusRecord(
        r2Id, userId, activityId, null, taskId, "Refatorar Foco", null,
        LocalDateTime.of(2026, 10, 16, 14, 0),
        LocalDateTime.of(2026, 10, 16, 14, 25),
        FocusRecordType.POMO, 1, 10, new BigDecimal("0.50"));

    when(activityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(recordPort.findAllByFocusActivityId(activityId)).thenReturn(List.of(r1, r2));
    when(recordPort.findMaxProductiveDurationMinutesExcludingRecords(eq(userId), anyList())).thenReturn(0);
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(taskPort.findById(taskId)).thenReturn(Optional.of(linkedTask));

    useCase.execute(userId, activityId, true);

    assertEquals(UserLevel.APPRENTICE, user.getCurrentLevel());
    assertEquals(100, user.getTotalXp());
    assertEquals(0, BigDecimal.ZERO.compareTo(user.getCurrentCoins()));
    assertEquals(0, new BigDecimal("0.50").compareTo(user.getTotalGoldEarned()));
    assertEquals(0, user.getStats().getTotalFocusMinutes());
    assertEquals(0, user.getStats().getTotalFocusSessions());
    assertEquals(0, user.getStats().getTotalPomodorosCompleted());
    assertEquals(0, user.getStats().getLongestFocusSessionMinutes());
    assertEquals(0, linkedTask.getTotalFocusMinutes());
    assertEquals(0, linkedTask.getFocusCyclesCount());

    verify(userPort).save(user);
    verify(taskPort).save(linkedTask);
    verify(transactionPort).deleteAllByReferenceIdsAndUserId(List.of(r1Id, r2Id), userId);
    verify(recordPort).deleteAllByFocusActivityId(activityId);
    verify(activityPort).deleteById(activityId);
  }

  @Test
  @DisplayName("Ao excluir atividade com deleteHistory=false, preserva registros e não estorna usuário nem tarefa")
  void shouldPreserveHistoryAndRewardsWhenDeleteHistoryIsFalse() {
    when(activityPort.findById(activityId)).thenReturn(Optional.of(activity));

    useCase.execute(userId, activityId, false);

    verify(recordPort).nullifyFocusActivityId(activityId);
    verify(recordPort, never()).deleteAllByFocusActivityId(any());
    verify(userPort, never()).findById(any());
    verify(taskPort, never()).findById(any());
    verify(transactionPort, never()).deleteAllByReferenceIdsAndUserId(anyList(), any());
    verify(activityPort).deleteById(activityId);
  }
}
