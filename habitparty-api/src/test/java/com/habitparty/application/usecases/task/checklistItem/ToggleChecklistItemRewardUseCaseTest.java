package com.habitparty.application.usecases.task.checklistItem;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;

class ToggleChecklistItemRewardUseCaseTest {

  private ChecklistItem buildItem(UUID itemId, UUID taskId, UUID userId, String name, boolean rewarded) {
    return new ChecklistItem(itemId, taskId, userId, name, false, rewarded);
  }

  private Todo buildTodo(UUID taskId, UUID colId, UUID userId, TaskDifficulty difficulty, List<ChecklistItem> checklist) {
    return new Todo(
        taskId, colId, userId, "Card Dificil", null, 0,
        TaskPriority.HIGH, List.of(), difficulty, TaskStatus.PENDING,
        TaskType.TODO, false, null, LocalDateTime.now(), checklist,
        TodoReminderType.NONE, null, null);
  }

  @Test
  @DisplayName("ToggleChecklistItemRewardUseCase ativa e desativa recompensa em Daily/Todo HARD respeitando limite de 4")
  void togglesRewardedUpToLimitAndAllowsDisabling() {
    TaskRepository port = mock(TaskRepository.class);
    ToggleChecklistItemRewardUseCase useCase = new ToggleChecklistItemRewardUseCase(port);

    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();

    ChecklistItem r1 = buildItem(UUID.randomUUID(), taskId, userId, "Parte 1", true);
    ChecklistItem r2 = buildItem(UUID.randomUUID(), taskId, userId, "Parte 2", true);
    ChecklistItem r3 = buildItem(UUID.randomUUID(), taskId, userId, "Parte 3", true);
    ChecklistItem target = buildItem(UUID.randomUUID(), taskId, userId, "Parte 4", false);
    ChecklistItem fifth = buildItem(UUID.randomUUID(), taskId, userId, "Parte 5", false);

    Daily hardDaily = new Daily(
        taskId, colId, userId, "Projeto Longo", null, 0,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.now(), LocalDateTime.now(),
        List.of(r1, r2, r3, target, fifth), 0, LocalDate.now(), DailyRepeatType.DAILY, 1, null, null, null);

    when(port.findChecklistItemByIdAndUserId(target.getId(), userId)).thenReturn(Optional.of(target));
    when(port.findChecklistItemByIdAndUserId(fifth.getId(), userId)).thenReturn(Optional.of(fifth));
    when(port.findById(taskId)).thenReturn(Optional.of(hardDaily));
    when(port.saveChecklistItem(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

    // Ativa o 4o item recompensado com sucesso
    ChecklistItem promoted = useCase.execute(target.getId(), userId);
    assertTrue(promoted.isRewarded());

    // Tentar ativar o 5o deve lançar DomainValidationException
    assertThrows(DomainValidationException.class, () -> useCase.execute(fifth.getId(), userId));
    assertFalse(fifth.isRewarded());

    // Desativar o 4o deve funcionar sempre
    ChecklistItem demoted = useCase.execute(target.getId(), userId);
    assertFalse(demoted.isRewarded());
  }

  @Test
  @DisplayName("AddChecklistItemUseCase e ToggleChecklistItemRewardUseCase rejeitam recompensa em tarefas não-HARD e Hábitos")
  void rejectsRewardedStepsForNonHardTasksAndHabits() {
    TaskRepository port = mock(TaskRepository.class);
    AddChecklistItemUseCase addUseCase = new AddChecklistItemUseCase(port);
    ToggleChecklistItemRewardUseCase toggleUseCase = new ToggleChecklistItemRewardUseCase(port);

    UUID userId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    UUID mediumTodoId = UUID.randomUUID();
    UUID hardHabitId = UUID.randomUUID();

    ChecklistItem itemOnMedium = buildItem(UUID.randomUUID(), mediumTodoId, userId, "Etapa", false);
    Todo mediumTodo = buildTodo(mediumTodoId, colId, userId, TaskDifficulty.MEDIUM, List.of(itemOnMedium));

    Habit hardHabit = new Habit(
        hardHabitId, colId, userId, "Hábito Difícil", null, 0,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.HABIT, false, null, LocalDateTime.now(), List.of(),
        0, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.HIGH, null, 0, 0);

    when(port.findById(mediumTodoId)).thenReturn(Optional.of(mediumTodo));
    when(port.findById(hardHabitId)).thenReturn(Optional.of(hardHabit));
    when(port.findChecklistItemByIdAndUserId(itemOnMedium.getId(), userId)).thenReturn(Optional.of(itemOnMedium));

    assertThrows(DomainValidationException.class,
        () -> addUseCase.execute(mediumTodoId, userId, "Nova", true));
    assertThrows(DomainValidationException.class,
        () -> addUseCase.execute(hardHabitId, userId, "Nova", true));
    assertThrows(DomainValidationException.class,
        () -> toggleUseCase.execute(itemOnMedium.getId(), userId));
  }

  @Test
  @DisplayName("UpdateChecklistItemUseCase valida limite de 4 ao promover para recompensada e permite remover recompensa")
  void updateChecklistItemValidatesRewardPromotionAndAllowsDemotion() {
    TaskRepository port = mock(TaskRepository.class);
    UpdateChecklistItemUseCase updateUseCase = new UpdateChecklistItemUseCase(port);

    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    ChecklistItem r1 = buildItem(UUID.randomUUID(), taskId, userId, "1", true);
    ChecklistItem r2 = buildItem(UUID.randomUUID(), taskId, userId, "2", true);
    ChecklistItem r3 = buildItem(UUID.randomUUID(), taskId, userId, "3", true);
    ChecklistItem r4 = buildItem(UUID.randomUUID(), taskId, userId, "4", true);
    ChecklistItem standard = buildItem(UUID.randomUUID(), taskId, userId, "5", false);

    Todo hardTodo = buildTodo(taskId, UUID.randomUUID(), userId, TaskDifficulty.HARD, List.of(r1, r2, r3, r4, standard));

    when(port.findChecklistItemByIdAndUserId(standard.getId(), userId)).thenReturn(Optional.of(standard));
    when(port.findChecklistItemByIdAndUserId(r4.getId(), userId)).thenReturn(Optional.of(r4));
    when(port.findById(taskId)).thenReturn(Optional.of(hardTodo));
    when(port.saveChecklistItem(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

    assertThrows(DomainValidationException.class,
        () -> updateUseCase.execute(standard.getId(), userId, "5 renomeada", true));

    ChecklistItem demoted = updateUseCase.execute(r4.getId(), userId, "4 padrão", false);
    assertEquals("4 padrão", demoted.getName());
    assertFalse(demoted.isRewarded());
    verify(port).saveChecklistItem(r4);
  }

  @Test
  @DisplayName("ToggleChecklistItemRewardUseCase respeita WorkspaceWriteGuard em ambientes somente-leitura")
  void enforcesWorkspaceWriteGuard() {
    TaskRepository port = mock(TaskRepository.class);
    WorkspaceRepository wsPort = mock(WorkspaceRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    BoardColumnRepository colPort = mock(BoardColumnRepository.class);

    ToggleChecklistItemRewardUseCase useCase = new ToggleChecklistItemRewardUseCase(port);
    useCase.setWorkspaceWriteGuard(new WorkspaceWriteGuard(wsPort, userPort, colPort));

    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    UUID colId = UUID.randomUUID();
    UUID ws3 = UUID.randomUUID();
    ChecklistItem item = buildItem(UUID.randomUUID(), taskId, userId, "Etapa", false);
    Todo hardTodo = buildTodo(taskId, colId, userId, TaskDifficulty.HARD, List.of(item));

    User freeUser = new User(
        userId, UserRole.USER, false, "Free", "freeuser", "free@habitparty.com", "pwd",
        java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, LocalDate.of(1995, 1, 1), null,
        UserGender.MALE, 0, 1, 0, LocalDateTime.now());

    when(port.findChecklistItemByIdAndUserId(item.getId(), userId)).thenReturn(Optional.of(item));
    when(port.findById(taskId)).thenReturn(Optional.of(hardTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(colPort.findById(colId)).thenReturn(Optional.of(new BoardColumn(colId, userId, ws3, "Col", 0, "x", true)));
    when(wsPort.findAllByUserId(userId)).thenReturn(List.of(
        new Workspace(UUID.randomUUID(), userId, "W1"),
        new Workspace(UUID.randomUUID(), userId, "W2"),
        new Workspace(ws3, userId, "W3")));

    assertThrows(LimitExceededException.class, () -> useCase.execute(item.getId(), userId));
    // Garante que a Task foi carregada apenas 1 vez (sem consulta dupla no guard + validação)
    verify(port, times(1)).findById(taskId);
  }

  @Test
  @DisplayName("AddChecklistItemUseCase atribui orderIndex sequencial baseado no maior índice existente")
  void addChecklistItemAssignsSequentialOrderIndex() {
    TaskRepository port = mock(TaskRepository.class);
    AddChecklistItemUseCase addUseCase = new AddChecklistItemUseCase(port);

    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    ChecklistItem existing0 = new ChecklistItem(UUID.randomUUID(), taskId, userId, "Primeiro", false, false, 0, false);
    ChecklistItem existing2 = new ChecklistItem(UUID.randomUUID(), taskId, userId, "Terceiro", false, true, 2, false);
    Todo hardTodo = buildTodo(taskId, UUID.randomUUID(), userId, TaskDifficulty.HARD, List.of(existing0, existing2));

    when(port.findById(taskId)).thenReturn(Optional.of(hardTodo));
    when(port.saveChecklistItem(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

    ChecklistItem created = addUseCase.execute(taskId, userId, "Quarto", true);
    assertEquals(3, created.getOrderIndex());
    assertTrue(created.isRewarded());
    assertFalse(created.isAutoCompleted());
  }
}
