package com.habitparty.application.usecases.task;

import java.util.UUID;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.enums.TransactionType;

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

    int tasksCompletedToday = transactionPort.countCompletedTasksToday(user.getId());
    if (tasksCompletedToday == 0) {
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
