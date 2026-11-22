package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class ChangeTaskStatusUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private UserRepository userPort;

  @Mock
  private FocusRecordRepository focusRecordPort;

  @InjectMocks
  private ChangeTaskStatusUseCase changeTaskStatusUseCase;

  private UUID userId;
  private UUID taskId;
  private User user;
  private Todo todoTask;

  @BeforeEach
  void setUp() {
    changeTaskStatusUseCase.setFocusRecordPort(focusRecordPort);
    userId = UUID.randomUUID();
    taskId = UUID.randomUUID();

    user = new User(
        userId,
        UserRole.USER,
        false,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0, // streak
        0, // level
        0, // currentXp
        LocalDateTime.now()
    );

    todoTask = new Todo(
        taskId,
        UUID.randomUUID(),
        userId,
        "Estudar Spring Boot",
        "Praticar arquitetura hexagonal",
        1,
        TaskPriority.HIGH,
        List.of("estudo"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        false,
        LocalDate.now(),
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null
    );
  }

  @Test
  @DisplayName("Deve completar tarefa pela 1ª vez no dia e incrementar o streak quando foco ainda não atingiu 30m")
  void testCompleteTaskFirstTimeTodayIncrementsStreak() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertEquals(1, user.getCurrentStreak());
    assertTrue(user.getTotalXp() > 0);
    assertTrue(user.getCurrentCoins().compareTo(BigDecimal.ZERO) > 0);

    verify(userPort).save(user);

    ArgumentCaptor<TransactionHistory> captor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionPort).save(captor.capture());
    assertEquals(TransactionType.TODO_COMPLETED, captor.getValue().getTransactionType());
    assertEquals(taskId, captor.getValue().getReferenceId().orElse(null));
  }

  @Test
  @DisplayName("Não deve incrementar ofensiva global duas vezes no dia se 30m de foco já garantiram hoje")
  void testCompleteTaskAfter30MinutesFocusTodayDoesNotIncrementStreakTwice() {
    user.incrementStreak(); // Já havia garantido +1 hoje via 30m de foco
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(30);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertEquals(1, user.getCurrentStreak());
    verify(userPort).save(user);
    verify(transactionPort).save(any(TransactionHistory.class));
  }

  @Test
  @DisplayName("Deve completar tarefa no mesmo dia mantendo o streak já incrementado anteriormente")
  void testCompleteTaskSubsequentTimeTodayDoesNotIncrementStreakTwice() {
    user.incrementStreak(); // Já estava streak = 1
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(1);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertEquals(1, user.getCurrentStreak()); // Streak continua 1, não incrementa novamente
    verify(userPort).save(user);
    verify(transactionPort).save(any(TransactionHistory.class));
  }

  @Test
  @DisplayName("Não deve conceder recompensas duplicadas se a tarefa já estava COMPLETED")
  void testCompleteAlreadyCompletedTaskIsIdempotent() {
    todoTask.changeStatus(TaskStatus.COMPLETED);
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Deve lançar UnauthorizedException se usuário não for o proprietário da tarefa")
  void testThrowsUnauthorizedExceptionWhenUserIsNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));

    assertThrows(UnauthorizedException.class, () ->
        changeTaskStatusUseCase.execute(taskId, otherUserId, TaskStatus.COMPLETED)
    );

    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Deve lançar ResourceNotFoundException se a tarefa não for encontrada")
  void testThrowsResourceNotFoundWhenTaskDoesNotExist() {
    when(taskPort.findById(taskId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () ->
        changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED)
    );
  }

  @Test
  @DisplayName("Deve conceder 50% de recompensa ao completar To-do Hardcore atrasado que já tinha penalidade aplicada")
  void testCompleteOverdueHardcoreTodoWithPenaltyAlreadyApplied() {
    Todo overdueTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Todo Atrasado", "Hardcore", 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, true, LocalDate.now().minusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, true
    );

    when(taskPort.findById(taskId)).thenReturn(Optional.of(overdueTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    // Dificuldade MEDIUM com 50%: 7 XP e $1.25
    assertEquals(7, user.getTotalXp());
    assertEquals(new BigDecimal("1.25"), user.getCurrentCoins());
    verify(transactionPort, times(1)).save(any(TransactionHistory.class));
  }

  @Test
  @DisplayName("Deve aplicar penalidade pendente e conceder 50% ao completar To-do Hardcore atrasado sem penalidade prévia")
  void testCompleteOverdueHardcoreTodoWithoutPriorPenaltyAppliesPenaltyAndAwardsHalf() {
    user.addCoins(new BigDecimal("10.00"));
    user.addXp(50);

    Todo overdueTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Todo Atrasado Não Penalizado", "Hardcore", 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, true, LocalDate.now().minusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, false
    );

    when(taskPort.findById(taskId)).thenReturn(Optional.of(overdueTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertTrue(overdueTodo.isPenaltyApplied());
    // 2 transações: 1 de penalidade (TASK_FAILED) e 1 de conclusão tardia (TASK_COMPLETED)
    verify(transactionPort, times(2)).save(any(TransactionHistory.class));
    // Saldo: 10.00 - 1.25 (multa de 50% de 2.50) + 1.25 (ganho tardio de 50%) = 10.00
    assertEquals(new BigDecimal("1.00").add(new BigDecimal("9.00")), user.getCurrentCoins());
  }

  private List<TransactionHistory> wireTransactionStore() {
    List<TransactionHistory> store = new ArrayList<>();
    doAnswer(invocation -> {
      TransactionHistory tx = invocation.getArgument(0);
      TransactionHistory persisted = new TransactionHistory(
          UUID.randomUUID(),
          tx.getUserId(),
          tx.getReferenceId().orElse(null),
          tx.getGoldAmount().orElse(null),
          tx.getXpAmount(),
          null,
          tx.getTransactionType(),
          tx.getNameSnapshot(),
          null,
          null,
          tx.getDifficultySnapshot().orElse(null),
          tx.getTagsSnapshot().orElse(null),
          tx.getColumnNameSnapshot().orElse(null),
          tx.getCreatedAt() != null ? tx.getCreatedAt() : LocalDateTime.now());
      store.add(0, persisted);
      return null;
    }).when(transactionPort).save(any(TransactionHistory.class));

    when(transactionPort.findTop2ByUserIdAndReferenceIdAndType(eq(userId), any(), any()))
        .thenAnswer(invocation -> {
          UUID refId = invocation.getArgument(1);
          TransactionType type = invocation.getArgument(2);
          return store.stream()
              .filter(tx -> tx.getReferenceId().filter(refId::equals).isPresent()
                  && type == tx.getTransactionType())
              .limit(2)
              .toList();
        });

    lenient().doAnswer(invocation -> {
      UUID id = invocation.getArgument(0);
      store.removeIf(tx -> id.equals(tx.getId()));
      return null;
    }).when(transactionPort).deleteById(any(UUID.class));

    return store;
  }

  @Test
  @DisplayName("Deve reverter integralmente XP, moedas, contadores, streak e histórico ao desmarcar Todo e permitir nova conclusão limpa")
  void testTodoUncheckedRevertsFullRewardAndAllowsCleanRecompletion() {
    List<TransactionHistory> store = wireTransactionStore();
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenAnswer(inv -> store.size());
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    // 1ª conclusão: concede recompensa (MEDIUM: 15 XP, 2.50 moedas)
    var firstResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.COMPLETED);
    assertTrue(firstResult.rewardGranted());
    assertEquals(15, user.getTotalXp());
    assertEquals(new BigDecimal("2.50"), user.getCurrentCoins());
    assertEquals(1, user.getCurrentStreak());
    assertEquals(1, user.getStats().getTotalTasksCompleted());
    assertEquals(1, user.getStats().getTotalOnTimeTodosCompleted());
    assertEquals(1, store.size());
    assertTrue(todoTask.isRewardAlreadyClaimed());

    // Desmarca para PENDING: estorna tudo e remove o registro do histórico
    var uncheckResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertEquals(TaskStatus.PENDING, uncheckResult.task().getStatus());
    assertTrue(uncheckResult.rewardReverted());
    assertEquals(15, uncheckResult.revertedXp());
    assertEquals(new BigDecimal("2.50"), uncheckResult.revertedCoins());
    assertTrue(uncheckResult.streakReverted());
    assertEquals(0, user.getTotalXp());
    assertEquals(0, user.getCurrentCoins().compareTo(BigDecimal.ZERO));
    assertEquals(0, user.getStats().getTotalGoldEarned().compareTo(BigDecimal.ZERO));
    assertEquals(0, user.getCurrentStreak());
    assertEquals(0, user.getStats().getTotalTasksCompleted());
    assertEquals(0, user.getStats().getTotalOnTimeTodosCompleted());
    assertEquals(0, store.size());
    assertFalse(todoTask.isRewardAlreadyClaimed());

    // Conclui novamente: como o estorno foi integral, ganha 1x de forma limpa
    var secondResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.COMPLETED);
    assertEquals(TaskStatus.COMPLETED, secondResult.task().getStatus());
    assertTrue(secondResult.rewardGranted());
    assertEquals(15, user.getTotalXp());
    assertEquals(new BigDecimal("2.50"), user.getCurrentCoins());
    assertEquals(1, user.getCurrentStreak());
    assertEquals(1, user.getStats().getTotalTasksCompleted());
    assertEquals(1, store.size());
  }

  @Test
  @DisplayName("Deve travar novo resgate se usuário gastou moedas antes de desmarcar (antifraude) e não deduzir em dobro")
  void testTodoUncheckedAfterSpendingCoinsKeepsRewardLockedAndPreventsDoubleReversal() {
    List<TransactionHistory> store = wireTransactionStore();
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenAnswer(inv -> store.size());
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    // Completa (15 XP, 2.50 moedas) e gasta 1.00 moeda na loja
    changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);
    user.spendMoney(new BigDecimal("1.00"));
    assertEquals(new BigDecimal("1.50"), user.getCurrentCoins());

    // Desmarca: estorna 15 XP e apenas os 1.50 disponíveis (não fica negativo); mantém isRewardAlreadyClaimed travado
    var uncheckResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertTrue(uncheckResult.rewardReverted());
    assertEquals(15, uncheckResult.revertedXp());
    assertEquals(0, new BigDecimal("1.50").compareTo(uncheckResult.revertedCoins()));
    assertEquals(0, user.getTotalXp());
    assertEquals(0, user.getCurrentCoins().compareTo(BigDecimal.ZERO));
    assertEquals(0, user.getStats().getTotalGoldEarned().compareTo(BigDecimal.ZERO));
    assertEquals(0, store.size());
    assertTrue(todoTask.isRewardAlreadyClaimed());

    // Recompreta: bloqueado pelo antifraude (não gera XP/Ouro novamente)
    var recompletion = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.COMPLETED);
    assertFalse(recompletion.rewardGranted());
    assertEquals(0, user.getTotalXp());
    assertEquals(0, user.getCurrentCoins().compareTo(BigDecimal.ZERO));

    // Dá nova moeda ao usuário e desmarca pela 2ª vez: como tx já foi apagada, não deduz em dobro
    user.addCoins(new BigDecimal("5.00"));
    var secondUncheck = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertFalse(secondUncheck.rewardReverted());
    assertEquals(new BigDecimal("5.00"), user.getCurrentCoins());
  }

  @Test
  @DisplayName("Deve respeitar piso de XP do nível ao desmarcar e manter recompensa travada quando XP é limitado pelo nível")
  void testTodoUncheckedAtXpLevelFloorClampsXpAndKeepsRewardLocked() {
    List<TransactionHistory> store = wireTransactionStore();
    // 90 XP -> completa Todo (+15 XP) -> sobe para APPRENTICE (min 100 XP, total 105 XP)
    user.addXp(90);
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenAnswer(inv -> store.size());
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);
    assertEquals(UserLevel.APPRENTICE, user.getCurrentLevel());
    assertEquals(105, user.getTotalXp());

    // Desmarca: estorna apenas 5 XP até o piso de 100 XP de APPRENTICE -> estorno parcial mantém trava
    var uncheckResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertTrue(uncheckResult.rewardReverted());
    assertEquals(5, uncheckResult.revertedXp());
    assertEquals(UserLevel.APPRENTICE.getMinXpRequired(), user.getTotalXp());
    assertTrue(todoTask.isRewardAlreadyClaimed());

    var recompletion = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.COMPLETED);
    assertFalse(recompletion.rewardGranted());
    assertEquals(100, user.getTotalXp());
  }

  @Test
  @DisplayName("Deve reverter Daily para PENDING restaurando lastCompletedAt anterior, streak da Daily e contadores Hard/Hardcore/Checklist")
  void testDailyUncheckedRestoresPreviousCompletionAndStreakAndStats() {
    List<TransactionHistory> store = wireTransactionStore();
    LocalDate yesterday = LocalDate.now().minusDays(1);
    LocalDateTime yesterdayAt9 = yesterday.atTime(9, 0);
    store.add(new TransactionHistory(
        UUID.randomUUID(), userId, taskId, new BigDecimal("5.00"), 30, null,
        TransactionType.DAILY_COMPLETED, "Treino", null, null, TaskDifficulty.HARD, List.of(), null, yesterdayAt9));

    ChecklistItem item1 = new ChecklistItem(UUID.randomUUID(), taskId, userId, "Aquecer", true);
    ChecklistItem item2 = new ChecklistItem(UUID.randomUUID(), taskId, userId, "Series", true);
    Daily dailyTask = new Daily(
        taskId, UUID.randomUUID(), userId, "Treino", "Pesado", 1,
        TaskPriority.HIGH, List.of("saude"), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.DAILY, true, LocalDate.now(), LocalDateTime.now().minusDays(3), List.of(item1, item2),
        1, LocalDate.now().minusDays(3), DailyRepeatType.DAILY, 1, null, null, yesterdayAt9);
    dailyTask.restoreHighestStreak(1);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(dailyTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenAnswer(inv ->
        (int) store.stream().filter(t -> !t.getCreatedAt().toLocalDate().isBefore(LocalDate.now())).count());
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    // Completa hoje: streak 1 -> 2, HARD (30 XP, 5.00 moedas) + HARDCORE + checklist
    changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);
    assertEquals(2, dailyTask.getCurrentStreak());
    assertEquals(2, dailyTask.getHighestStreak());
    assertEquals(1, user.getStats().getTotalTasksCompleted());
    assertEquals(1, user.getStats().getTotalHardTasksCompleted());
    assertEquals(1, user.getStats().getTotalHardcoreTasksCompleted());
    assertEquals(1, user.getStats().getTotalChecklistTasksCompleted());

    // Desmarca hoje: volta para 1/1, restaura lastCompletedAt para ontem, zera contadores de hoje e permite nova conclusão
    var uncheckResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertTrue(uncheckResult.rewardReverted());
    assertEquals(30, uncheckResult.revertedXp());
    assertEquals(0, new BigDecimal("5.00").compareTo(uncheckResult.revertedCoins()));
    assertEquals(1, dailyTask.getCurrentStreak());
    assertEquals(1, dailyTask.getHighestStreak());
    assertEquals(yesterday, dailyTask.getLastCompletedAt().toLocalDate());
    assertFalse(dailyTask.isRewardAlreadyClaimed(LocalDate.now()));
    assertEquals(0, user.getStats().getTotalTasksCompleted());
    assertEquals(0, user.getStats().getTotalHardTasksCompleted());
    assertEquals(0, user.getStats().getTotalHardcoreTasksCompleted());
    assertEquals(0, user.getStats().getTotalChecklistTasksCompleted());

    // Re-conclui hoje: concede exatamente 1x de volta e restaura streak 2
    var recompletion = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.COMPLETED);
    assertTrue(recompletion.rewardGranted());
    assertEquals(2, dailyTask.getCurrentStreak());
    assertEquals(2, dailyTask.getHighestStreak());
  }

  @Test
  @DisplayName("Não deve reverter streak global ao desmarcar se ainda houver outra tarefa ou >= 30m de foco no dia")
  void testUncheckDoesNotRevertGlobalStreakWhenOtherTaskOrQualifiedFocusExistsToday() {
    List<TransactionHistory> store = wireTransactionStore();
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    // Para a conclusão contar o streak inicialmente precisamos de focus < 30; ajustamos dinamicamente:
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0, 30);
    changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);
    assertEquals(1, user.getCurrentStreak());

    var uncheckWithFocus = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertTrue(uncheckWithFocus.rewardReverted());
    assertFalse(uncheckWithFocus.streakReverted());
    assertEquals(1, user.getCurrentStreak());
    assertEquals(0, store.size());

    // Agora testa com outra tarefa concluída restante hoje (foco = 0)
    UUID secondTaskId = UUID.randomUUID();
    Todo secondTodo = new Todo(
        secondTaskId, UUID.randomUUID(), userId, "Segunda", "", 2,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.TODO, false, LocalDate.now(), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null);
    when(taskPort.findById(secondTaskId)).thenReturn(Optional.of(secondTodo));
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0, 1);

    changeTaskStatusUseCase.execute(secondTaskId, userId, TaskStatus.COMPLETED);
    var uncheckWithAnotherTask = changeTaskStatusUseCase.executeWithResult(secondTaskId, userId, TaskStatus.PENDING);
    assertTrue(uncheckWithAnotherTask.rewardReverted());
    assertFalse(uncheckWithAnotherTask.streakReverted());
    assertEquals(1, user.getCurrentStreak());
  }

  @Test
  @DisplayName("Deve ignorar estorno com segurança quando histórico foi apagado manualmente no /history (mantém trava)")
  void testUncheckAfterManualHistoryDeletionDoesNothingAndKeepsLock() {
    List<TransactionHistory> store = wireTransactionStore();
    Daily dailyTask = new Daily(
        taskId, UUID.randomUUID(), userId, "Leitura", "", 1,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.now(), LocalDateTime.now().minusDays(1), List.of(),
        0, LocalDate.now().minusDays(1), DailyRepeatType.DAILY, 1, null, null, null);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(dailyTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);
    int xpAfter = user.getTotalXp();
    BigDecimal coinsAfter = user.getCurrentCoins();

    // Usuário apaga o registro diretamente no /history antes de desmarcar
    store.clear();

    var uncheckResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertFalse(uncheckResult.rewardReverted());
    assertEquals(xpAfter, user.getTotalXp());
    assertEquals(coinsAfter, user.getCurrentCoins());
    assertTrue(dailyTask.isRewardAlreadyClaimed(LocalDate.now()));
    verify(transactionPort, never()).deleteById(any());
  }

  @Test
  @DisplayName("Deve estornar recompensa tardia de 50% de Todo Hardcore atrasado sem decrementar contador de pontualidade")
  void testOverdueHardcoreTodoUncheckedRevertsHalfRewardWithoutOnTimeDecrement() {
    List<TransactionHistory> store = wireTransactionStore();
    Todo overdueTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Todo Atrasado", "Hardcore", 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, true, LocalDate.now().minusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, true);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(overdueTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(eq(userId), any())).thenAnswer(inv -> store.size());
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(userId), any(), any())).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);
    assertEquals(7, user.getTotalXp());
    assertEquals(new BigDecimal("1.25"), user.getCurrentCoins());
    assertEquals(0, user.getStats().getTotalOnTimeTodosCompleted());

    var uncheckResult = changeTaskStatusUseCase.executeWithResult(taskId, userId, TaskStatus.PENDING);
    assertTrue(uncheckResult.rewardReverted());
    assertEquals(7, uncheckResult.revertedXp());
    assertEquals(new BigDecimal("1.25"), uncheckResult.revertedCoins());
    assertEquals(0, user.getTotalXp());
    assertEquals(0, user.getCurrentCoins().compareTo(BigDecimal.ZERO));
    assertEquals(0, user.getStats().getTotalOnTimeTodosCompleted());
    assertFalse(overdueTodo.isRewardAlreadyClaimed());
  }
}
