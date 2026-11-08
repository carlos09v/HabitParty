package com.habitparty.application.usecases.task;

import java.util.UUID;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

public final class TaskGamificationHelper {

  private TaskGamificationHelper() {}

  public static void awardTaskCompletion(
      User user,
      Task task,
      TransactionType txType,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort) {
    TaskReward reward = task.calculateReward();
    user.addXp(reward.xp());
    user.addCoins(reward.coins());
    if (user.getStats() != null) {
      user.getStats().recordTaskCompleted(
          task.getDifficulty() == TaskDifficulty.HARD,
          task.isHardcoreModeEnabled()
      );
      // Checklist Impecável: tarefa com ao menos 1 subitem e todos marcados no momento da conclusão
      if (task.getChecklist() != null
          && !task.getChecklist().isEmpty()
          && task.getChecklist().stream().allMatch(ChecklistItem::isCompleted)) {
        user.getStats().recordChecklistTaskCompleted();
      }
      // Pontualidade Real: Afazer (To-Do) com data de vencimento concluído dentro do prazo e sem penalidade
      if (task instanceof Todo todo
          && todo.getDueDate().isPresent()
          && !todo.isOverdue()
          && !todo.isPenaltyApplied()) {
        user.getStats().recordOnTimeTodoCompleted();
      }
    }

    int tasksCompletedToday = transactionPort.countCompletedTasksToday(user.getId());
    if (tasksCompletedToday == 0) {
      // Se o usuário possuía streak > 0 mas passou o dia anterior sem concluir tarefas,
      // zera antes de iniciar a nova contagem em 1
      if (user.getCurrentStreak() > 0 && !transactionPort.hasCompletedTasksYesterday(user.getId())) {
        user.resetStreak();
      }
      user.incrementStreak();
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
        null
    );
    transactionPort.save(transaction);
  }

  public static TransactionHistory buildPenaltyTransaction(
      UUID userId,
      Task task,
      TaskReward penalty,
      TransactionType txType,
      String descriptionPrefix) {
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
        null
    );
  }
}
