package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

import com.habitparty.application.ports.BoardColumnRepository;
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
  private final BoardColumnRepository boardColumnPort;

  @Autowired
  public DailyResetUseCase(TaskRepository port, TransactionHistoryRepository transactionPort, UserRepository userPort,
      Clock clock, TransactionOperations transactionOperations, BoardColumnRepository boardColumnPort) {
    this.port = port;
    this.transactionPort = transactionPort;
    this.userPort = userPort;
    this.clock = clock;
    this.transactionOperations = transactionOperations;
    this.boardColumnPort = boardColumnPort;
  }

  public DailyResetUseCase(TaskRepository port, TransactionHistoryRepository transactionPort, UserRepository userPort,
      Clock clock, TransactionOperations transactionOperations) {
    this(port, transactionPort, userPort, clock, transactionOperations, null);
  }

  private record RolloverOutcome(boolean changed, boolean hasFailed) {}

  public void executeDailyRollover() {
    LocalDate today = LocalDate.now(clock);

    // Processa as tarefas recorrentes em lotes, cada lote em sua própria transação curta
    int page = 0;
    while (true) {
      final int currentPage = page;
      int[] batchCounts = transactionOperations.execute(status -> processRecurringBatch(currentPage, today, false));
      if (batchCounts == null || batchCounts[0] < BATCH_SIZE) {
        break;
      }
      page++;
    }

    // Processa Afazeres (To-dos) no modo Hardcore que venceram e ainda não foram penalizados
    processOverdueHardcoreTodos(today);
  }

  /**
   * Recuperação idempotente executada no startup da aplicação para sincronizar
   * Hábitos e Diárias caso o servidor estivesse offline na virada da meia-noite.
   * Não reaplica penalidades Hardcore para evitar cobrança duplicada em múltiplos restarts no mesmo dia.
   */
  public int catchUpRecurringTasks(LocalDate today) {
    int totalUpdated = 0;
    int page = 0;
    while (true) {
      final int currentPage = page;
      int[] batchCounts = transactionOperations.execute(status -> processRecurringBatch(currentPage, today, true));
      if (batchCounts == null) {
        break;
      }
      totalUpdated += batchCounts[1];
      if (batchCounts[0] < BATCH_SIZE) {
        break;
      }
      page++;
    }
    return totalUpdated;
  }

  private int[] processRecurringBatch(int page, LocalDate today, boolean catchUp) {
    List<Task> batch = port.findRecurringTasksPage(page, BATCH_SIZE);

    List<Task> changedTasks = new ArrayList<>();
    List<Task> failedHardcoreTasks = new ArrayList<>();
    List<UUID> cleanNegativeHabitUsers = new ArrayList<>();

    for (Task task : batch) {
      RolloverOutcome outcome = switch (task) {
        case Habit h -> processHabitRollover(h, today, catchUp, cleanNegativeHabitUsers);
        case Daily d -> processDailyRollover(d, today, catchUp);
        default -> new RolloverOutcome(false, false);
      };

      if (outcome.changed()) {
        changedTasks.add(task);
      }
      // A Regra do Hardcore (Punição para Habit e Daily, omitida no catch-up idempotente)
      if (!catchUp && outcome.hasFailed() && task.isHardcoreModeEnabled()) {
        failedHardcoreTasks.add(task);
      }
    }

    if (!catchUp) {
      applyHardcorePenalties(failedHardcoreTasks, "Falhou: ");
      rewardCleanNegativeHabits(cleanNegativeHabitUsers);
    }

    // Persiste apenas as tarefas efetivamente alteradas
    if (!changedTasks.isEmpty()) {
      port.saveAll(changedTasks);
    }
    return new int[] { batch.size(), changedTasks.size() };
  }

  private RolloverOutcome processHabitRollover(
      Habit habit, LocalDate today, boolean catchUp, List<UUID> cleanNegativeHabitUsers) {
    if (catchUp) {
      if (habit.getHabitType() == HabitType.NEGATIVE) {
        return new RolloverOutcome(false, false);
      }
      boolean changed = false;
      boolean completedInPastCycle = habit.getLastCompletedAt() != null && !habit.isInSameCycle(today);
      if (completedInPastCycle
          && (habit.getStatus() == TaskStatus.COMPLETED
              || habit.getPositiveCount() > 0
              || habit.getNegativeCount() > 0)) {
        habit.resetCycleCounts();
        habit.changeStatus(TaskStatus.PENDING);
        changed = true;
      }
      if (breakExpiredHabitStreakIfNeeded(habit, today)) {
        changed = true;
      }
      return new RolloverOutcome(changed, false);
    }

    boolean isResetBoundary = switch (habit.getResetCounter()) {
      case DAILY -> true;
      case WEEKLY -> today.getDayOfWeek() == DayOfWeek.SUNDAY;
      case MONTHLY -> today.getDayOfMonth() == 1;
    };

    if (isResetBoundary) {
      if (habit.getHabitType() == HabitType.NEGATIVE) {
        if (habit.getNegativeCount() == 0) {
          cleanNegativeHabitUsers.add(habit.getUserId());
        }
        habit.resetCycleCounts();
        return new RolloverOutcome(true, false);
      }
      if (habit.getStatus() == TaskStatus.COMPLETED) {
        breakExpiredHabitStreakIfNeeded(habit, today);
        habit.resetCycleCounts();
        habit.changeStatus(TaskStatus.PENDING);
        return new RolloverOutcome(true, false);
      }
      if (habit.getStatus() == TaskStatus.PENDING) {
        habit.breakStreak();
        habit.resetCycleCounts();
        return new RolloverOutcome(true, true);
      }
    } else if (breakExpiredHabitStreakIfNeeded(habit, today)) {
      return new RolloverOutcome(true, false);
    }

    return new RolloverOutcome(false, false);
  }

  private boolean breakExpiredHabitStreakIfNeeded(Habit habit, LocalDate today) {
    if (habit.getHabitType() != HabitType.NEGATIVE
        && habit.getCurrentStreak() > 0
        && habit.getLastCompletedAt() != null
        && !habit.isStreakStillActive(today)) {
      habit.breakStreak();
      return true;
    }
    return false;
  }

  private RolloverOutcome processDailyRollover(Daily daily, LocalDate today, boolean catchUp) {
    boolean canResetCompleted = !catchUp
        || daily.getLastCompletedAt() == null
        || daily.getLastCompletedAt().toLocalDate().isBefore(today);

    if (daily.getStatus() == TaskStatus.COMPLETED && canResetCompleted) {
      if (daily.getLastCompletedAt() != null && !daily.isStreakStillActive(today)) {
        daily.breakStreak();
      }
      daily.changeStatus(TaskStatus.PENDING);
      if (daily.getDueDate().isPresent() && daily.getDueDate().get().isBefore(today)) {
        daily.advanceDueDateToAtLeast(today);
      }
      return new RolloverOutcome(true, false);
    }

    if (daily.getStatus() == TaskStatus.PENDING
        && daily.getDueDate().isPresent()
        && daily.getDueDate().get().isBefore(today)) {
      daily.breakStreak();
      if (catchUp) {
        daily.advanceDueDateToAtLeast(today);
        return new RolloverOutcome(true, false);
      }
      daily.shiftToNextOccurrence(today);
      return new RolloverOutcome(true, true);
    }

    return new RolloverOutcome(false, false);
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
   * Zera a ofensiva global (currentStreak) dos usuários que passaram o dia anterior
   * sem concluir nenhuma tarefa.
   */
  public int resetInactiveUserStreaks(LocalDate today) {
    LocalDateTime yesterdayStart = today.minusDays(1)
        .atStartOfDay(clock.getZone())
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
    Integer resetCount = transactionOperations.execute(status -> {
      List<User> expiredUsers = userPort.findUsersWithExpiredStreak(yesterdayStart);
      for (User user : expiredUsers) {
        user.resetStreak();
      }
      if (!expiredUsers.isEmpty()) {
        userPort.saveAll(expiredUsers);
      }
      return expiredUsers.size();
    });
    return resetCount != null ? resetCount : 0;
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
    // Cache local para não consultar a mesma lista várias vezes no lote
    Map<UUID, String> columnNamesById = new HashMap<>();
    for (Task task : failedTasks) {
      User user = usersById.get(task.getUserId());
      if (user == null) {
        throw new ResourceNotFoundException("Usuário não encontrado para penalidade.");
      }

      Task.TaskReward penalty = task.calculatePenalty();
      // Aplica a punição no perfil do usuário (garante que não cai de nível)
      user.applyPenalty(penalty.coins(), penalty.xp());
      penalizedUsers.put(user.getId(), user);

      String columnName = task.getBoardColumnId() == null ? null
          : columnNamesById.computeIfAbsent(task.getBoardColumnId(),
              id -> TaskGamificationHelper.resolveColumnName(boardColumnPort, task));
      transactionPort.save(TaskGamificationHelper.buildPenaltyTransaction(
          task.getUserId(), task, penalty, TransactionType.TASK_FAILED, namePrefix, columnName));
    }

    userPort.saveAll(penalizedUsers.values());
  }

  private void rewardCleanNegativeHabits(List<UUID> cleanUserIds) {
    if (cleanUserIds.isEmpty()) {
      return;
    }

    Set<UUID> uniqueIds = Set.copyOf(cleanUserIds);
    Map<UUID, User> usersById = userPort.findAllByIds(uniqueIds).stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));

    Map<UUID, User> updatedUsers = new LinkedHashMap<>();
    for (UUID userId : cleanUserIds) {
      User user = usersById.get(userId);
      if (user != null && user.getStats() != null) {
        user.getStats().recordCleanHabitCycle();
        updatedUsers.put(user.getId(), user);
      }
    }

    if (!updatedUsers.isEmpty()) {
      userPort.saveAll(updatedUsers.values());
    }
  }
}
