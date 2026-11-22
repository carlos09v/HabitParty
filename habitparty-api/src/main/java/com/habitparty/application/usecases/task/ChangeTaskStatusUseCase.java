package com.habitparty.application.usecases.task;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.user.GlobalStreakSupport;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.application.events.TaskCompletedEvent;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserStats.TaskReversalOutcome;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ChangeTaskStatusUseCase {
  private final TaskRepository taskPort;
  private final TransactionHistoryRepository transactionPort;
  private final UserRepository userPort;
  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private final BoardColumnRepository boardColumnPort;
  private final Clock clock;
  private final ApplicationEventPublisher eventPublisher;
  private DailyResetUseCase dailyResetUseCase;
  private WorkspaceWriteGuard workspaceWriteGuard;
  private FocusRecordRepository focusRecordPort;

  @Autowired
  public ChangeTaskStatusUseCase(
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

  public ChangeTaskStatusUseCase(TaskRepository taskPort, TransactionHistoryRepository transactionPort,
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

  @Autowired(required = false)
  public void setFocusRecordPort(FocusRecordRepository focusRecordPort) {
    this.focusRecordPort = focusRecordPort;
  }

  public record ExecutionResult(
      Task task,
      boolean rewardGranted,
      boolean rewardReverted,
      int revertedXp,
      BigDecimal revertedCoins,
      boolean streakReverted) {
    public ExecutionResult(Task task, boolean rewardGranted) {
      this(task, rewardGranted, false, 0, BigDecimal.ZERO, false);
    }
  }

  private record ReversalResult(
      boolean rewardReverted,
      int revertedXp,
      BigDecimal revertedCoins,
      boolean streakReverted) {
    static ReversalResult none() {
      return new ReversalResult(false, 0, BigDecimal.ZERO, false);
    }
  }

  @Transactional
  public Task execute(UUID taskId, UUID userIdLogado, TaskStatus newStatus) {
    return executeWithResult(taskId, userIdLogado, newStatus).task();
  }

  @Transactional
  public ExecutionResult executeWithResult(UUID taskId, UUID userIdLogado, TaskStatus newStatus) {
    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userIdLogado);
    }
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertColumnWritable(
          task.getBoardColumnId(),
          userIdLogado,
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para atualizar tarefas nele!");
    }

    // 2. Só gera extrato e recompensa se o status mudou para COMPLETED e a recompensa ainda não foi resgatada
    User rewardedUser = null;
    UserLevel reachedLevel = null;
    ReversalResult reversal = ReversalResult.none();
    if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
      User user = userPort.findById(userIdLogado)
          .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
      LocalDate today = user.resolveLocalDate(clock);
      LocalDateTime now = user.resolveLocalDateTime(clock);

      if (!task.isRewardAlreadyClaimed(today)) {
        String columnName = TaskGamificationHelper.resolveColumnName(boardColumnPort, task);

        // Se for um Todo Hardcore atrasado e a penalidade ainda não foi aplicada (ex: cron da meia-noite não rodou),
        // aplica a dedução do atraso e registra no histórico antes de creditar a recompensa tardia
        if (task instanceof Todo todo && todo.isHardcoreModeEnabled() && todo.isOverdue(today)) {
          if (!todo.isPenaltyApplied()) {
            todo.markPenaltyApplied();
            TaskReward penalty = todo.calculatePenalty(today);
            user.applyPenalty(penalty.coins(), penalty.xp());

            TransactionHistory negativeTransaction = TaskGamificationHelper.buildPenaltyTransaction(
                userIdLogado, todo, penalty, TransactionType.TASK_FAILED, "Falhou no prazo: ", columnName);
            transactionPort.save(negativeTransaction);
          }
        }

        if (task instanceof Habit habit) {
          habit.refreshStreakForDate(today);
        } else if (task instanceof Daily daily) {
          daily.refreshStreakForDate(today);
        }

        TransactionType txType = switch (task.getTaskType()) {
          case HABIT -> TransactionType.HABIT_COMPLETED;
          case DAILY -> TransactionType.DAILY_COMPLETED;
          case TODO -> TransactionType.TODO_COMPLETED;
        };

        UserLevel levelBefore = user.getCurrentLevel();
        TaskGamificationHelper.awardTaskCompletion(
            user, task, txType, userPort, transactionPort, focusRecordPort, columnName, today, clock);
        UserLevel levelAfter = user.getCurrentLevel();
        if (levelAfter.ordinal() > levelBefore.ordinal()) {
          reachedLevel = levelAfter;
        }
        task.registerCompletion(now);
        rewardedUser = user;
      }
    } else if (newStatus == TaskStatus.PENDING
        && task.getStatus() == TaskStatus.COMPLETED
        && (task instanceof Daily || task instanceof Todo)) {
      reversal = revertTaskCompletionIfClaimed(task, userIdLogado);
    }

    // 3. Atualiza o status no Domínio
    task.changeStatus(newStatus);

    // 4. Salva e devolve a tarefa atualizada
    Task savedTask = taskPort.save(task);

    if (rewardedUser != null) {
      if (eventPublisher != null) {
        eventPublisher.publishEvent(new TaskCompletedEvent(rewardedUser.getId(), reachedLevel));
      } else if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(rewardedUser);
        if (reachedLevel != null) {
          evaluateUserAchievementsUseCase.notifyLevelMilestoneIfReached(rewardedUser.getId(), reachedLevel);
        }
      }
    }

    return new ExecutionResult(
        savedTask,
        rewardedUser != null,
        reversal.rewardReverted(),
        reversal.revertedXp(),
        reversal.revertedCoins(),
        reversal.streakReverted());
  }

  private ReversalResult revertTaskCompletionIfClaimed(Task task, UUID userIdLogado) {
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    ZoneId userZone = user.resolveZoneId(clock.getZone());
    LocalDate today = LocalDate.now(clock.withZone(userZone));

    if (!task.isRewardAlreadyClaimed(today)) {
      return ReversalResult.none();
    }

    TransactionType txType = task instanceof Daily
        ? TransactionType.DAILY_COMPLETED
        : TransactionType.TODO_COMPLETED;
    List<TransactionHistory> latestTxs = transactionPort.findTop2ByUserIdAndReferenceIdAndType(
        userIdLogado, task.getId(), txType);
    if (latestTxs == null || latestTxs.isEmpty()) {
      return ReversalResult.none();
    }

    TransactionHistory latestTx = latestTxs.get(0);
    ZoneId systemZone = ZoneId.systemDefault();
    LocalDateTime txUserDateTime = latestTx.getCreatedAt() != null
        ? latestTx.getCreatedAt().atZone(systemZone).withZoneSameInstant(userZone).toLocalDateTime()
        : null;
    LocalDate txUserDate = txUserDateTime != null ? txUserDateTime.toLocalDate() : null;

    if (task instanceof Daily daily) {
      LocalDate completedDate = daily.getLastCompletedAt() != null
          ? daily.getLastCompletedAt().toLocalDate()
          : today;
      if (txUserDate == null || txUserDate.isBefore(completedDate)) {
        return ReversalResult.none();
      }
    }

    int xpToRevert = Math.max(0, latestTx.getXpAmount());
    BigDecimal coinsToRevert = latestTx.getGoldAmount()
        .map(amount -> amount.max(BigDecimal.ZERO))
        .orElse(BigDecimal.ZERO);

    boolean isHard = task.getDifficulty() == TaskDifficulty.HARD;
    boolean isHardcore = task.isHardcoreModeEnabled();
    boolean hasCompletedChecklist = task.getChecklist() != null
        && !task.getChecklist().isEmpty()
        && task.getChecklist().stream().allMatch(ChecklistItem::isCompleted);
    boolean wasOnTimeTodo = false;
    if (task instanceof Todo todo && todo.getDueDate().isPresent() && !todo.isPenaltyApplied()) {
      LocalDate completionDate = todo.getCompletedAt() != null
          ? todo.getCompletedAt().toLocalDate()
          : (txUserDate != null ? txUserDate : today);
      wasOnTimeTodo = !todo.isOverdue(completionDate);
    }

    UserStats stats = user.getStats();
    TaskReversalOutcome outcome = stats != null
        ? stats.revertTaskCompletion(
            xpToRevert,
            coinsToRevert,
            isHard,
            isHardcore,
            hasCompletedChecklist,
            wasOnTimeTodo)
        : new TaskReversalOutcome(0, BigDecimal.ZERO, false);

    if (latestTx.getId() != null) {
      transactionPort.deleteById(latestTx.getId());
    }

    boolean streakReverted = false;
    if (stats != null
        && txUserDate != null
        && txUserDate.equals(today)
        && today.equals(stats.getLastStreakDate())) {
      int remainingCompletedTasksToday = transactionPort.countCompletedTasksToday(userIdLogado, userZone);
      boolean hasQualifiedFocusToday = GlobalStreakSupport.hasQualifiedFocusOnDate(
          userIdLogado, today, userZone, focusRecordPort);
      if (remainingCompletedTasksToday <= 0 && !hasQualifiedFocusToday) {
        streakReverted = stats.revertTodayStreakIncrement(today);
      }
    }

    userPort.save(user);

    if (task instanceof Todo todo) {
      if (outcome.fullyReverted()) {
        todo.clearCompletion();
      }
    } else if (task instanceof Daily daily) {
      LocalDateTime previousCompletedAt = null;
      if (latestTxs.size() > 1 && latestTxs.get(1).getCreatedAt() != null) {
        previousCompletedAt = latestTxs.get(1).getCreatedAt()
            .atZone(systemZone)
            .withZoneSameInstant(userZone)
            .toLocalDateTime();
      }
      daily.revertCompletion(previousCompletedAt, outcome.fullyReverted());
    }

    return new ReversalResult(
        true,
        outcome.xpReverted(),
        outcome.coinsReverted(),
        streakReverted);
  }
}
