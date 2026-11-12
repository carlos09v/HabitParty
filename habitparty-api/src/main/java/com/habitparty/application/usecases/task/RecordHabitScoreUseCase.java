package com.habitparty.application.usecases.task;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
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
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final BoardColumnRepository boardColumnPort;

  @Autowired
  public RecordHabitScoreUseCase(
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      BoardColumnRepository boardColumnPort) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.boardColumnPort = boardColumnPort;
  }

  public RecordHabitScoreUseCase(
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      UserRepository userPort) {
    this(taskPort, transactionPort, userPort, null, null);
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
    String columnName = TaskGamificationHelper.resolveColumnName(boardColumnPort, habit);

    if (delta > 0) {
      if (habit.getHabitType() == HabitType.NEGATIVE) {
        throw new DomainValidationException("Este hábito é do tipo Negativo e não permite pontuação positiva.");
      }

      // Domínio do Impulso: primeira ação positiva no ciclo de um Hábito Misto (BOTH) sem nenhuma recaída negativa
      if (habit.getHabitType() == HabitType.BOTH
          && habit.getPositiveCount() == 0
          && habit.getNegativeCount() == 0
          && user.getStats() != null) {
        user.getStats().recordCleanHabitCycle();
      }

      TaskGamificationHelper.awardTaskCompletion(
          user, habit, TransactionType.HABIT_COMPLETED, userPort, transactionPort, columnName);
      if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(user);
      }

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

      TransactionHistory negativeTransaction = TaskGamificationHelper.buildPenaltyTransaction(
          userIdLogado, habit, penalty, TransactionType.BAD_HABIT_PENALTY, "Penalidade de hábito: ", columnName);
      transactionPort.save(negativeTransaction);
    }

    return taskPort.save(habit);
  }
}
