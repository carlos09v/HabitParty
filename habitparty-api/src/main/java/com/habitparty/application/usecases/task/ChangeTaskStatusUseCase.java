package com.habitparty.application.usecases.task;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
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

  public ChangeTaskStatusUseCase(TaskRepository taskPort, TransactionHistoryRepository transactionPort,
      UserRepository userPort) {
    this.taskPort = taskPort;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
  }

  @Transactional
  public Task execute(UUID taskId, UUID userIdLogado, TaskStatus newStatus) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    // 2. Só gera extrato se o status realmente mudou para COMPLETED (evita cliques duplos)
    if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
      User user = userPort.findById(userIdLogado)
          .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

      // Se for um Todo Hardcore atrasado e a penalidade ainda não foi aplicada (ex: cron da meia-noite não rodou),
      // aplica a dedução do atraso e registra no histórico antes de creditar a recompensa tardia
      if (task instanceof Todo todo && todo.isHardcoreModeEnabled() && todo.isOverdue()) {
        if (!todo.isPenaltyApplied()) {
          todo.markPenaltyApplied();
          TaskReward penalty = todo.calculatePenalty();
          user.applyPenalty(penalty.coins(), penalty.xp());

          TransactionHistory negativeTransaction = new TransactionHistory(
              null,
              userIdLogado,
              todo.getId(),
              penalty.coins().negate(),
              -penalty.xp(),
              null,
              TransactionType.TASK_FAILED,
              "Falhou no prazo: " + todo.getName(),
              null,
              null,
              todo.getDifficulty(),
              todo.getTags(),
              null
          );
          transactionPort.save(negativeTransaction);
        }
      }

      TaskReward reward = task.calculateReward();
      user.addXp(reward.xp());
      user.addCoins(reward.coins());

      int tasksCompletedToday = transactionPort.countCompletedTasksToday(userIdLogado);
      if (tasksCompletedToday == 0) {
        user.incrementStreak();
      }

      userPort.save(user);

      TransactionType txType = switch (task.getTaskType()) {
        case HABIT -> TransactionType.HABIT_COMPLETED;
        case DAILY -> TransactionType.DAILY_COMPLETED;
        case TODO -> TransactionType.TODO_COMPLETED;
      };

      TransactionHistory transaction = new TransactionHistory(
          null,
          userIdLogado, 
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
      task.registerCompletion();
    }

    // 3. Atualiza o status no Domínio
    task.changeStatus(newStatus);

    // 4. Salva e devolve a tarefa atualizada
    return taskPort.save(task);
  }
}
