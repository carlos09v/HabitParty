package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.application.events.TaskCompletedEvent;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RecordHabitScoreUseCase {
  private final TaskRepository taskPort;
  private final TransactionHistoryRepository transactionPort;
  private final UserRepository userPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final BoardColumnRepository boardColumnPort;
  private final Clock clock;
  private final ApplicationEventPublisher eventPublisher;
  private DailyResetUseCase dailyResetUseCase;
  private WorkspaceWriteGuard workspaceWriteGuard;

  @Autowired
  public RecordHabitScoreUseCase(
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      UserRepository userPort,
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase,
      BoardColumnRepository boardColumnPort,
      Clock clock,
      ApplicationEventPublisher eventPublisher) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
    this.boardColumnPort = boardColumnPort;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
    this.eventPublisher = eventPublisher;
  }

  public RecordHabitScoreUseCase(
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      UserRepository userPort) {
    this(taskPort, transactionPort, userPort, null, null, Clock.systemDefaultZone(), null);
  }

  @Autowired(required = false)
  public void setDailyResetUseCase(DailyResetUseCase dailyResetUseCase) {
    this.dailyResetUseCase = dailyResetUseCase;
  }

  @Autowired(required = false)
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public record HabitScoreResult(Task task, boolean rewardGranted) {
  }

  @Transactional
  public Task execute(UUID taskId, UUID userIdLogado, int delta) {
    return executeWithResult(taskId, userIdLogado, delta).task();
  }

  @Transactional
  public HabitScoreResult executeWithResult(UUID taskId, UUID userIdLogado, int delta) {
    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userIdLogado);
    }
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    if (!(task instanceof Habit habit)) {
      throw new DomainValidationException("Apenas tarefas do tipo Hábito podem ter pontuação registrada.");
    }

    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertColumnWritable(
          user,
          habit.getBoardColumnId(),
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para pontuar hábitos nele!");
    }
    String columnName = TaskGamificationHelper.resolveColumnName(boardColumnPort, habit);
    LocalDate today = user.resolveLocalDate(clock);
    LocalDateTime now = user.resolveLocalDateTime(clock);

    if (delta > 0) {
      if (habit.getHabitType() == HabitType.NEGATIVE) {
        throw new DomainValidationException("Este hábito é do tipo Negativo e não permite pontuação positiva.");
      }

      // Garante que eventual streak expirado por falta de rollover seja zerado antes do bônus/incremento
      habit.refreshStreakForDate(today);

      ZoneId userZone = user.resolveZoneId(ZoneId.systemDefault());
      long rewardedToday = transactionPort.countByUserIdAndReferenceIdAndTypeOnDate(
          user.getId(),
          habit.getId(),
          TransactionType.HABIT_COMPLETED,
          today,
          userZone);
      boolean grantReward = rewardedToday < Habit.MAX_DAILY_REWARDED_SCORES;

      UserLevel reachedLevel = null;
      if (grantReward) {
        UserLevel levelBefore = user.getCurrentLevel();
        TaskGamificationHelper.awardTaskCompletion(
            user, habit, TransactionType.HABIT_COMPLETED, userPort, transactionPort, columnName, today);
        UserLevel levelAfter = user.getCurrentLevel();
        reachedLevel = levelAfter.ordinal() > levelBefore.ordinal() ? levelAfter : null;
      }

      habit.registerCompletion(now);
      habit.changeStatus(TaskStatus.COMPLETED);
      Task savedHabit = taskPort.save(habit);

      if (grantReward) {
        if (eventPublisher != null) {
          eventPublisher.publishEvent(new TaskCompletedEvent(user.getId(), reachedLevel));
        } else if (evaluateUserAchievementsUseCase != null) {
          evaluateUserAchievementsUseCase.execute(user);
          if (reachedLevel != null) {
            evaluateUserAchievementsUseCase.notifyLevelMilestoneIfReached(user.getId(), reachedLevel);
          }
        }
      }

      return new HabitScoreResult(savedHabit, grantReward);
    } else if (delta < 0) {
      if (habit.getHabitType() == HabitType.POSITIVE) {
        throw new DomainValidationException("Este hábito é do tipo Positivo e não permite pontuação negativa.");
      }

      habit.registerNegative();

      TaskReward penalty = habit.calculatePenalty(today);
      user.applyPenalty(penalty.coins(), penalty.xp());
      userPort.save(user);

      TransactionHistory negativeTransaction = TaskGamificationHelper.buildPenaltyTransaction(
          userIdLogado, habit, penalty, TransactionType.BAD_HABIT_PENALTY, "Penalidade de hábito: ", columnName);
      transactionPort.save(negativeTransaction);
    }

    return new HabitScoreResult(taskPort.save(habit), false);
  }
}
