package com.habitparty.application.usecases.task;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DailyResetUseCase {
  private final TaskRepository port;
  private final UserRepository userPort;
  private final TransactionHistoryRepository transactionPort;

  public DailyResetUseCase(TaskRepository port, TransactionHistoryRepository transactionPort, UserRepository userPort) {
    this.port = port;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
  }

  @Transactional
  public void executeDailyRollover() {
    LocalDate today = LocalDate.now();
    LocalDate yesterday = today.minusDays(1);

    List<Task> recurringTasks = port.findAllRecurringTasks();
    for (Task task : recurringTasks) {
      boolean hasFailed = false;

      if (task instanceof Habit h) {
        boolean isResetBoundary = switch (h.getResetCounter()) {
          case DAILY -> true;
          case WEEKLY -> today.getDayOfWeek() == java.time.DayOfWeek.MONDAY;
          case MONTHLY -> today.getDayOfMonth() == 1;
        };

        if (h.getHabitType() == com.habitparty.core.domain.enums.task.HabitType.NEGATIVE) {
          if (isResetBoundary) {
            h.resetCycleCounts();
          }
        } else {
          if (task.getStatus() == TaskStatus.COMPLETED) {
            if (isResetBoundary) {
              h.resetCycleCounts();
              task.changeStatus(TaskStatus.PENDING);
            }
          } else if (task.getStatus() == TaskStatus.PENDING) {
            if (isResetBoundary) {
              h.breakStreak();
              h.resetCycleCounts();
              hasFailed = true;
            }
          }
        }
      } else if (task instanceof Daily d) {
        if (task.getStatus() == TaskStatus.COMPLETED) {
          task.changeStatus(TaskStatus.PENDING);
        } else if (task.getStatus() == TaskStatus.PENDING) {
          if (d.getDueDate().isPresent() && !d.getDueDate().get().isAfter(yesterday)) {
            d.breakStreak();
            hasFailed = true;
            d.shiftToNextOccurrence(today);
          }
        }
      }

        // A Regra do Hardcore (Punição para Habit e Daily)
        if (hasFailed && task.isHardcoreModeEnabled()) {
          Task.TaskReward penalty = task.calculatePenalty();

          User user = userPort.findById(task.getUserId())
              .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado para penalidade."));
          // Aplica a punição no perfil do usuário (garante que não cai de nível)
          user.applyPenalty(penalty.coins(), penalty.xp());
          userPort.save(user);

          TransactionHistory negativeTransaction = new TransactionHistory(
              null,
              task.getUserId(),
              task.getId(), // referenceId = ID da Task que falhou
              penalty.coins().negate(), // goldAmount = Penalidade de ouro
              -penalty.xp(), // xpAmount = penalidade de XP
              null, // priceSnapshot (Não se aplica a task)
              TransactionType.TASK_FAILED,
              "Falhou: " + task.getName(), // Nome limpo pro extrato
              null, // iconSnapshot
              null, // packageLevel
              task.getDifficulty(), // difficulty
              task.getTags(), // tags
              null);

          transactionPort.save(negativeTransaction);
        }
      }

    // 5. Salva todas as tarefas modificadas de uma única vez fora do loop
    port.saveAll(recurringTasks);

    // 6. Processa Afazeres (To-dos) no modo Hardcore que venceram e ainda não foram penalizados
    processOverdueHardcoreTodos(today);
  }

  @Transactional
  public int processOverdueHardcoreTodos(LocalDate today) {
    List<Task> overdueTodos = port.findOverdueHardcoreTodos(today);
    for (Task task : overdueTodos) {
      if (task instanceof Todo todo) {
        todo.markPenaltyApplied();

        Task.TaskReward penalty = todo.calculatePenalty();

        User user = userPort.findById(todo.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado para penalidade."));
        user.applyPenalty(penalty.coins(), penalty.xp());
        userPort.save(user);

        TransactionHistory negativeTransaction = new TransactionHistory(
            null,
            todo.getUserId(),
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
            null);

        transactionPort.save(negativeTransaction);
      }
    }

    if (!overdueTodos.isEmpty()) {
      port.saveAll(overdueTodos);
    }
    return overdueTodos.size();
  }
}