package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
import com.habitparty.application.events.TaskCompletedEvent;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
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

  @Transactional
  public Task execute(UUID taskId, UUID userIdLogado, TaskStatus newStatus) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    LocalDate today = LocalDate.now(clock);
    LocalDateTime now = LocalDateTime.now(clock);

    // 2. Só gera extrato e recompensa se o status mudou para COMPLETED e a recompensa ainda não foi resgatada
    if (newStatus == TaskStatus.COMPLETED
        && task.getStatus() != TaskStatus.COMPLETED
        && !task.isRewardAlreadyClaimed(today)) {
      User user = userPort.findById(userIdLogado)
          .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
      String columnName = TaskGamificationHelper.resolveColumnName(boardColumnPort, task);

      // Se for um Todo Hardcore atrasado e a penalidade ainda não foi aplicada (ex: cron da meia-noite não rodou),
      // aplica a dedução do atraso e registra no histórico antes de creditar a recompensa tardia
      if (task instanceof Todo todo && todo.isHardcoreModeEnabled() && todo.isOverdue(today)) {
        if (!todo.isPenaltyApplied()) {
          todo.markPenaltyApplied();
          TaskReward penalty = todo.calculatePenalty();
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

      TaskGamificationHelper.awardTaskCompletion(
          user, task, txType, userPort, transactionPort, columnName, today);
      if (eventPublisher != null) {
        eventPublisher.publishEvent(new TaskCompletedEvent(user.getId()));
      } else if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(user);
      }
      task.registerCompletion(now);
    }

    // 3. Atualiza o status no Domínio
    task.changeStatus(newStatus);

    // 4. Salva e devolve a tarefa atualizada
    return taskPort.save(task);
  }
}
