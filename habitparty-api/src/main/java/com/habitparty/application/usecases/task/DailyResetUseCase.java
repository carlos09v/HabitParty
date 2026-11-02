package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

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
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DailyResetUseCase {
  // Tamanho do lote do rollover: limita heap e duração de cada transação
  static final int BATCH_SIZE = 500;

  private final TaskRepository port;
  private final UserRepository userPort;
  private final TransactionHistoryRepository transactionPort;
  private final Clock clock;
  private final TransactionOperations transactionOperations;

  public DailyResetUseCase(TaskRepository port, TransactionHistoryRepository transactionPort, UserRepository userPort,
      Clock clock, TransactionOperations transactionOperations) {
    this.port = port;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
    this.clock = clock;
    this.transactionOperations = transactionOperations;
  }

  public void executeDailyRollover() {
    LocalDate today = LocalDate.now(clock);

    // Processa as tarefas recorrentes em lotes, cada lote em sua própria transação curta
    int page = 0;
    while (true) {
      final int currentPage = page;
      Integer fetched = transactionOperations.execute(status -> processRecurringBatch(currentPage, today));
      if (fetched == null || fetched < BATCH_SIZE) {
        break;
      }
      page++;
    }

    // Processa Afazeres (To-dos) no modo Hardcore que venceram e ainda não foram penalizados
    processOverdueHardcoreTodos(today);
  }

  private int processRecurringBatch(int page, LocalDate today) {
    LocalDate yesterday = today.minusDays(1);
    List<Task> batch = port.findRecurringTasksPage(page, BATCH_SIZE);

    List<Task> changedTasks = new ArrayList<>();
    List<Task> failedHardcoreTasks = new ArrayList<>();

    for (Task task : batch) {
      boolean changed = false;
      boolean hasFailed = false;

      if (task instanceof Habit h) {
        boolean isResetBoundary = switch (h.getResetCounter()) {
          case DAILY -> true;
          case WEEKLY -> today.getDayOfWeek() == DayOfWeek.SUNDAY;
          case MONTHLY -> today.getDayOfMonth() == 1;
        };

        if (isResetBoundary) {
          if (h.getHabitType() == HabitType.NEGATIVE) {
            h.resetCycleCounts();
            changed = true;
          } else if (task.getStatus() == TaskStatus.COMPLETED) {
            h.resetCycleCounts();
            task.changeStatus(TaskStatus.PENDING);
            changed = true;
          } else if (task.getStatus() == TaskStatus.PENDING) {
            h.breakStreak();
            h.resetCycleCounts();
            hasFailed = true;
            changed = true;
          }
        }
      } else if (task instanceof Daily d) {
        if (task.getStatus() == TaskStatus.COMPLETED) {
          task.changeStatus(TaskStatus.PENDING);
          changed = true;
        } else if (task.getStatus() == TaskStatus.PENDING
            && d.getDueDate().isPresent() && !d.getDueDate().get().isAfter(yesterday)) {
          d.breakStreak();
          d.shiftToNextOccurrence(today);
          hasFailed = true;
          changed = true;
        }
      }

      if (changed) {
        changedTasks.add(task);
      }
      // A Regra do Hardcore (Punição para Habit e Daily)
      if (hasFailed && task.isHardcoreModeEnabled()) {
        failedHardcoreTasks.add(task);
      }
    }

    applyHardcorePenalties(failedHardcoreTasks, "Falhou: ");

    // Persiste apenas as tarefas efetivamente alteradas
    if (!changedTasks.isEmpty()) {
      port.saveAll(changedTasks);
    }
    return batch.size();
  }

  public int processOverdueHardcoreTodos(LocalDate today) {
    Integer processed = transactionOperations.execute(status -> {
      List<Task> overdueTodos = port.findOverdueHardcoreTodos(today);
      List<Task> penalized = new ArrayList<>();
      for (Task task : overdueTodos) {
        if (task instanceof Todo todo) {
          todo.markPenaltyApplied();
          penalized.add(todo);
        }
      }

      applyHardcorePenalties(penalized, "Falhou no prazo: ");

      if (!overdueTodos.isEmpty()) {
        port.saveAll(overdueTodos);
      }
      return overdueTodos.size();
    });
    return processed != null ? processed : 0;
  }

  /**
   * Aplica as penalidades carregando todos os usuários envolvidos em uma única consulta
   * e salvando cada usuário apenas uma vez (mesmo com várias tarefas falhas).
   */
  private void applyHardcorePenalties(List<Task> failedTasks, String namePrefix) {
    if (failedTasks.isEmpty()) {
      return;
    }

    Set<UUID> userIds = failedTasks.stream().map(Task::getUserId).collect(Collectors.toSet());
    Map<UUID, User> usersById = userPort.findAllByIds(userIds).stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));

    Map<UUID, User> penalizedUsers = new LinkedHashMap<>();
    for (Task task : failedTasks) {
      User user = usersById.get(task.getUserId());
      if (user == null) {
        throw new ResourceNotFoundException("Usuário não encontrado para penalidade.");
      }

      Task.TaskReward penalty = task.calculatePenalty();
      // Aplica a punição no perfil do usuário (garante que não cai de nível)
      user.applyPenalty(penalty.coins(), penalty.xp());
      penalizedUsers.put(user.getId(), user);

      transactionPort.save(TaskGamificationHelper.buildPenaltyTransaction(
          task.getUserId(), task, penalty, TransactionType.TASK_FAILED, namePrefix));
    }

    penalizedUsers.values().forEach(userPort::save);
  }
}
