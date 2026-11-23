package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.GlobalStreakSupport;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

public final class TaskGamificationHelper {

  private TaskGamificationHelper() {}

  /**
   * Resolve o nome da lista (BoardColumn) de uma tarefa para o snapshot do Histórico.
   * Retorna null quando o repositório não está disponível ou a coluna não existe.
   */
  public static String resolveColumnName(BoardColumnRepository boardColumnPort, Task task) {
    if (boardColumnPort == null || task == null || task.getBoardColumnId() == null) {
      return null;
    }
    return boardColumnPort.findById(task.getBoardColumnId())
        .map(BoardColumn::getName)
        .orElse(null);
  }

  public static void awardTaskCompletion(
      User user,
      Task task,
      TransactionType txType,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort) {
    awardTaskCompletion(user, task, txType, userPort, transactionPort, null);
  }

  /**
   * @param columnName nome da lista (BoardColumn) da tarefa, salvo como snapshot no Histórico
   */
  public static void awardTaskCompletion(
      User user,
      Task task,
      TransactionType txType,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort,
      String columnName) {
    awardTaskCompletion(user, task, txType, userPort, transactionPort, columnName, LocalDate.now());
  }

  public static void awardTaskCompletion(
      User user,
      Task task,
      TransactionType txType,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort,
      String columnName,
      LocalDate referenceDate) {
    awardTaskCompletion(
        user, task, txType, userPort, transactionPort, null, columnName, referenceDate, Clock.systemDefaultZone());
  }

  public static void awardTaskCompletion(
      User user,
      Task task,
      TransactionType txType,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort,
      FocusRecordRepository focusRecordPort,
      String columnName,
      LocalDate referenceDate,
      Clock clock) {
    Clock effectiveClock = clock != null ? clock : Clock.systemDefaultZone();
    ZoneId userZone = user.resolveZoneId(effectiveClock.getZone());
    LocalDate effectiveDate = referenceDate != null ? referenceDate : LocalDate.now(effectiveClock.withZone(userZone));
    TaskReward reward = task.calculateReward(effectiveDate);
    int effortUnits = Math.max(1, task.getRewardMultiplierUnits());
    user.addXp(reward.xp());
    user.addCoins(reward.coins());
    boolean checklistCompleted = user.getStats() != null
        && task.getChecklist() != null
        && !task.getChecklist().isEmpty()
        && task.getChecklist().stream().allMatch(ChecklistItem::isCompleted);
    if (user.getStats() != null) {
      user.getStats().recordTaskCompleted(
          task.getDifficulty() == TaskDifficulty.HARD,
          task.isHardcoreModeEnabled(),
          effortUnits
      );
      // Checklist Impecável: tarefa com ao menos 1 subitem e todos marcados no momento da conclusão
      if (checklistCompleted) {
        user.getStats().recordChecklistTaskCompleted();
      }
      // Pontualidade Real: Afazer (To-Do) com data de vencimento concluído dentro do prazo e sem penalidade
      if (task instanceof Todo todo
          && todo.getDueDate().isPresent()
          && !todo.isOverdue(effectiveDate)
          && !todo.isPenaltyApplied()) {
        user.getStats().recordOnTimeTodoCompleted();
      }
    }

    int tasksCompletedToday = transactionPort.countCompletedTasksToday(user.getId(), userZone);
    if (tasksCompletedToday == 0
        && !GlobalStreakSupport.hasQualifiedFocusOnDate(user.getId(), effectiveDate, userZone, focusRecordPort)) {
      GlobalStreakSupport.incrementTodayStreakIfYesterdayVerified(
          user, userZone, effectiveDate, transactionPort, focusRecordPort);
    }

    userPort.save(user);

    TransactionHistory transaction = new TransactionHistory(
        null,
        user.getId(),
        task.getId(),
        reward.coins(),
        reward.xp(),
        null,
        txType,
        task.getName(),
        null,
        null,
        task.getDifficulty(),
        task.getTags(),
        columnName,
        null,
        task instanceof Habit ? null : checklistCompleted,
        effortUnits,
        LocalDateTime.ofInstant(effectiveClock.instant(), ZoneId.systemDefault())
    );
    transactionPort.save(transaction);
  }

  public static TransactionHistory buildPenaltyTransaction(
      UUID userId,
      Task task,
      TaskReward penalty,
      TransactionType txType,
      String descriptionPrefix) {
    return buildPenaltyTransaction(userId, task, penalty, txType, descriptionPrefix, null);
  }

  public static TransactionHistory buildPenaltyTransaction(
      UUID userId,
      Task task,
      TaskReward penalty,
      TransactionType txType,
      String descriptionPrefix,
      String columnName) {
    return new TransactionHistory(
        null,
        userId,
        task.getId(),
        penalty.coins().negate(),
        -penalty.xp(),
        null,
        txType,
        descriptionPrefix + task.getName(),
        null,
        null,
        task.getDifficulty(),
        task.getTags(),
        columnName,
        null
    );
  }
}
