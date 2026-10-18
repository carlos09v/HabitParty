package com.habitparty.application.usecases.task;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RecordHabitScoreUseCase {
  private final TaskRepository taskPort;
  private final TransactionHistoryRepository transactionPort;
  private final UserRepository userPort;

  public RecordHabitScoreUseCase(
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      UserRepository userPort) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
  }

  @Transactional
  public Task execute(UUID taskId, UUID userIdLogado, int delta) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    if (!(task instanceof Habit habit)) {
      throw new DomainValidationException("Apenas tarefas do tipo Hábito podem ter pontuação registrada.");
    }

    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    if (delta > 0) {
      if (habit.getHabitType() == HabitType.NEGATIVE) {
        throw new DomainValidationException("Este hábito é do tipo Negativo e não permite pontuação positiva.");
      }

      TaskReward reward = habit.calculateReward();
      user.addXp(reward.xp());
      user.addCoins(reward.coins());

      int tasksCompletedToday = transactionPort.countCompletedTasksToday(userIdLogado);
      if (tasksCompletedToday == 0) {
        user.incrementStreak();
      }

      userPort.save(user);

      TransactionHistory transaction = new TransactionHistory(
          null,
          userIdLogado,
          habit.getId(),
          reward.coins(),
          reward.xp(),
          null,
          TransactionType.HABIT_COMPLETED,
          habit.getName(),
          null,
          null,
          habit.getDifficulty(),
          habit.getTags(),
          null);
      transactionPort.save(transaction);

      habit.registerCompletion();
      habit.changeStatus(TaskStatus.COMPLETED);
    } else if (delta < 0) {
      if (habit.getHabitType() == HabitType.POSITIVE) {
        throw new DomainValidationException("Este hábito é do tipo Positivo e não permite pontuação negativa.");
      }

      habit.registerNegative();

      TaskReward penalty = habit.calculatePenalty();
      user.applyPenalty(penalty.coins(), penalty.xp());
      userPort.save(user);

      TransactionHistory negativeTransaction = new TransactionHistory(
          null,
          userIdLogado,
          habit.getId(),
          penalty.coins().negate(),
          -penalty.xp(),
          null,
          TransactionType.BAD_HABIT_PENALTY,
          "Penalidade de hábito: " + habit.getName(),
          null,
          null,
          habit.getDifficulty(),
          habit.getTags(),
          null);
      transactionPort.save(negativeTransaction);
    }

    return taskPort.save(habit);
  }
}
