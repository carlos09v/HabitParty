package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
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
  // Tamanho do lote de usuários processados por transação curta
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

  public record RolloverSummary(int processedUsers, int updatedTasks, int overdueHardcoreTodos, int expiredStreaks) {}

  private record RolloverOutcome(boolean changed, boolean hasFailed) {}

  public void executeDailyRollover() {
    executeDailyRolloverSummary();
  }

  /**
   * Garante virada preguiçosa e atômica para um único usuário caso ele interaja entre 00:00 locais
   * e a execução do próximo lote do cron (evita cliques pós-meia-noite serem tratados como do dia anterior).
   */
  public boolean resetUserIfDue(UUID userId) {
    if (userId == null) {
      return false;
    }
    Instant nowUtc = Instant.now(clock);
    if (!userPort.isUserDueForDailyReset(userId, nowUtc)) {
      return false;
    }

    if (transactionOperations != null) {
      Boolean executed = transactionOperations.execute(status -> executeSingleUserRolloverUnderLock(userId, nowUtc));
      return Boolean.TRUE.equals(executed);
    }
    return executeSingleUserRolloverUnderLock(userId, nowUtc);
  }

  private boolean executeSingleUserRolloverUnderLock(UUID userId, Instant nowUtc) {
    Optional<User> lockedUser = userPort.findByIdForUpdate(userId);
    if (lockedUser.isEmpty()) {
      return false;
    }
    User user = lockedUser.get();
    ZoneId userZone = user.resolveZoneId(clock.getZone());
    LocalDate userToday = LocalDate.now(clock.withZone(userZone));
    if (!user.shouldRunDailyReset(userToday)
        && user.getNextDailyResetAt() != null
        && user.getNextDailyResetAt().isAfter(nowUtc)) {
      return false;
    }
    RolloverSummary summary = processLoadedUsersBatch(List.of(user));
    return summary.processedUsers() > 0;
  }

  /**
   * Executa a virada diária por fuso horário de cada usuário devido (cron UTC a cada 15 min ou startup).
   * Como a atualização de {@code lastDailyResetDate} e {@code nextDailyResetAt} ocorre na mesma transação
   * das tarefas e penalidades, a operação é idempotente por usuário e dia calendário local.
   */
  public RolloverSummary executeDailyRolloverSummary() {
    Instant nowUtc = Instant.now(clock);
    List<UUID> dueUserIds = userPort.findUserIdsDueForDailyReset(nowUtc);
    if (dueUserIds == null || dueUserIds.isEmpty()) {
      return new RolloverSummary(0, 0, 0, 0);
    }

    int processedUsers = 0;
    int updatedTasks = 0;
    int overdueHardcoreTodos = 0;
    int expiredStreaks = 0;

    for (int start = 0; start < dueUserIds.size(); start += BATCH_SIZE) {
      List<UUID> slice = dueUserIds.subList(start, Math.min(start + BATCH_SIZE, dueUserIds.size()));
      RolloverSummary batch = transactionOperations.execute(status -> processUsersBatch(slice));
      if (batch != null) {
        processedUsers += batch.processedUsers();
        updatedTasks += batch.updatedTasks();
        overdueHardcoreTodos += batch.overdueHardcoreTodos();
        expiredStreaks += batch.expiredStreaks();
      }
    }

    return new RolloverSummary(processedUsers, updatedTasks, overdueHardcoreTodos, expiredStreaks);
  }

  private RolloverSummary processUsersBatch(List<UUID> batchUserIds) {
    List<User> lockedUsers = userPort.findAllByIdsForUpdate(batchUserIds);
    List<User> loadedUsers = (lockedUsers != null && !lockedUsers.isEmpty())
        ? lockedUsers
        : userPort.findAllByIds(batchUserIds);
    if (loadedUsers == null || loadedUsers.isEmpty()) {
      return new RolloverSummary(0, 0, 0, 0);
    }
    return processLoadedUsersBatch(loadedUsers);
  }

  private RolloverSummary processLoadedUsersBatch(List<User> loadedUsers) {

    Map<UUID, User> usersById = new LinkedHashMap<>();
    Map<UUID, User> dirtyUsers = new LinkedHashMap<>();
    Map<UUID, ZoneId> dueZonesById = new LinkedHashMap<>();
    Map<UUID, LocalDate> dueTodayById = new LinkedHashMap<>();
    Map<UUID, LocalDate> previousResetById = new HashMap<>();

    for (User user : loadedUsers) {
      usersById.put(user.getId(), user);
      ZoneId userZone = user.resolveZoneId(clock.getZone());
      LocalDate userToday = LocalDate.now(clock.withZone(userZone));
      LocalDate previousResetDate = user.getLastDailyResetDate();

      if (user.shouldRunDailyReset(userToday)) {
        dueZonesById.put(user.getId(), userZone);
        dueTodayById.put(user.getId(), userToday);
        previousResetById.put(user.getId(), previousResetDate);
      } else if (user.getNextDailyResetAt() == null) {
        // Garante preenchimento de nextDailyResetAt sem reexecutar o dia já processado
        LocalDate anchor = previousResetDate != null ? previousResetDate : userToday;
        user.markDailyResetExecuted(anchor, userZone);
        dirtyUsers.put(user.getId(), user);
      }
    }

    if (dueTodayById.isEmpty()) {
      if (!dirtyUsers.isEmpty()) {
        userPort.saveAll(dirtyUsers.values());
      }
      return new RolloverSummary(0, 0, 0, 0);
    }

    List<Task> changedTasks = new ArrayList<>();
    List<Task> failedRecurringHardcoreTasks = new ArrayList<>();
    List<UUID> cleanNegativeHabitUsers = new ArrayList<>();

    List<Task> recurringTasks = port.findRecurringTasksByUserIds(dueTodayById.keySet());
    for (Task task : recurringTasks) {
      LocalDate userToday = dueTodayById.get(task.getUserId());
      if (userToday == null) {
        continue;
      }
      LocalDate previousResetDate = previousResetById.get(task.getUserId());
      RolloverOutcome outcome = switch (task) {
        case Habit h -> processHabitRollover(h, userToday, previousResetDate, cleanNegativeHabitUsers);
        case Daily d -> processDailyRollover(d, userToday);
        default -> new RolloverOutcome(false, false);
      };

      if (outcome.changed()) {
        changedTasks.add(task);
      }
      if (outcome.hasFailed() && task.isHardcoreModeEnabled()) {
        failedRecurringHardcoreTasks.add(task);
      }
    }

    List<Task> overdueTodos = collectOverdueHardcoreTodos(dueTodayById);
    changedTasks.addAll(overdueTodos);

    applyHardcorePenalties(failedRecurringHardcoreTasks, "Falhou: ", usersById, dirtyUsers, dueTodayById);
    applyHardcorePenalties(overdueTodos, "Falhou no prazo: ", usersById, dirtyUsers, dueTodayById);
    rewardCleanNegativeHabits(cleanNegativeHabitUsers, usersById, dirtyUsers);

    int expiredStreaks = expireInactiveUserStreaks(dueTodayById, dueZonesById, usersById, dirtyUsers);

    for (Map.Entry<UUID, LocalDate> entry : dueTodayById.entrySet()) {
      UUID userId = entry.getKey();
      User user = usersById.get(userId);
      user.markDailyResetExecuted(entry.getValue(), dueZonesById.get(userId));
      dirtyUsers.put(userId, user);
    }

    if (!changedTasks.isEmpty()) {
      port.saveAll(changedTasks);
    }
    if (!dirtyUsers.isEmpty()) {
      userPort.saveAll(dirtyUsers.values());
    }

    return new RolloverSummary(dueTodayById.size(), changedTasks.size(), overdueTodos.size(), expiredStreaks);
  }

  private List<Task> collectOverdueHardcoreTodos(Map<UUID, LocalDate> dueTodayById) {
    LocalDate maxUserToday = dueTodayById.values().stream()
        .max(LocalDate::compareTo)
        .orElse(LocalDate.now(clock));

    List<Task> candidateTodos = port.findOverdueHardcoreTodosByUserIds(dueTodayById.keySet(), maxUserToday);
    List<Task> overdueTodos = new ArrayList<>();
    for (Task task : candidateTodos) {
      if (!(task instanceof Todo todo) || todo.isPenaltyApplied()) {
        continue;
      }
      LocalDate ownerToday = dueTodayById.get(todo.getUserId());
      if (ownerToday != null && todo.isOverdue(ownerToday)) {
        todo.markPenaltyApplied();
        overdueTodos.add(todo);
      }
    }
    return overdueTodos;
  }

  private RolloverOutcome processHabitRollover(
      Habit habit, LocalDate userToday, LocalDate previousResetDate, List<UUID> cleanNegativeHabitUsers) {
    if (habit.getLastCompletedAt() != null && habit.isInSameCycle(userToday)) {
      return new RolloverOutcome(false, false);
    }

    boolean isResetBoundary = switch (habit.getResetCounter()) {
      case DAILY -> true;
      case WEEKLY -> didCrossWeeklyBoundary(previousResetDate, userToday);
      case MONTHLY -> didCrossMonthlyBoundary(previousResetDate, userToday);
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
        breakExpiredHabitStreakIfNeeded(habit, userToday);
        habit.resetCycleCounts();
        habit.changeStatus(TaskStatus.PENDING);
        return new RolloverOutcome(true, false);
      }
      if (habit.getStatus() == TaskStatus.PENDING) {
        habit.breakStreak();
        habit.resetCycleCounts();
        return new RolloverOutcome(true, true);
      }
    } else if (breakExpiredHabitStreakIfNeeded(habit, userToday)) {
      return new RolloverOutcome(true, false);
    }

    return new RolloverOutcome(false, false);
  }

  private boolean didCrossWeeklyBoundary(LocalDate previousResetDate, LocalDate userToday) {
    if (previousResetDate == null) {
      return userToday.getDayOfWeek() == DayOfWeek.MONDAY;
    }
    LocalDate lowerBound = userToday.minusDays(7);
    for (LocalDate d = userToday; d.isAfter(previousResetDate) && d.isAfter(lowerBound); d = d.minusDays(1)) {
      if (d.getDayOfWeek() == DayOfWeek.MONDAY) {
        return true;
      }
    }
    return false;
  }

  private boolean didCrossMonthlyBoundary(LocalDate previousResetDate, LocalDate userToday) {
    if (previousResetDate == null) {
      return userToday.getDayOfMonth() == 1;
    }
    return previousResetDate.getYear() != userToday.getYear()
        || previousResetDate.getMonth() != userToday.getMonth();
  }

  private boolean breakExpiredHabitStreakIfNeeded(Habit habit, LocalDate userToday) {
    if (habit.getHabitType() != HabitType.NEGATIVE
        && habit.getCurrentStreak() > 0
        && habit.getLastCompletedAt() != null
        && !habit.isStreakStillActive(userToday)) {
      habit.breakStreak();
      return true;
    }
    return false;
  }

  private RolloverOutcome processDailyRollover(Daily daily, LocalDate userToday) {
    boolean canResetCompleted = daily.getLastCompletedAt() == null
        || daily.getLastCompletedAt().toLocalDate().isBefore(userToday);

    if (daily.getStatus() == TaskStatus.COMPLETED && canResetCompleted) {
      if (daily.getLastCompletedAt() != null && !daily.isStreakStillActive(userToday)) {
        daily.breakStreak();
      }
      daily.changeStatus(TaskStatus.PENDING);
      if (daily.getDueDate().isPresent()) {
        LocalDate currentDue = daily.getDueDate().get();
        LocalDate completedDate = daily.getLastCompletedAt() != null
            ? daily.getLastCompletedAt().toLocalDate()
            : userToday.minusDays(1);
        if (currentDue.isBefore(userToday)) {
          daily.advanceDueDateToAtLeast(userToday);
        } else if (!completedDate.isBefore(currentDue.minusDays(Math.max(1, daily.getRepeatEvery())))) {
          daily.shiftToNextOccurrence(currentDue);
          daily.advanceDueDateToAtLeast(userToday);
        }
      }
      return new RolloverOutcome(true, false);
    }

    if (daily.getStatus() == TaskStatus.PENDING
        && daily.getDueDate().isPresent()
        && daily.getDueDate().get().isBefore(userToday)) {
      daily.breakStreak();
      daily.advanceDueDateToAtLeast(userToday);
      return new RolloverOutcome(true, true);
    }

    return new RolloverOutcome(false, false);
  }

  private int expireInactiveUserStreaks(
      Map<UUID, LocalDate> dueTodayById,
      Map<UUID, ZoneId> dueZonesById,
      Map<UUID, User> usersById,
      Map<UUID, User> dirtyUsers) {
    Map<UUID, LocalDateTime> yesterdayCutoffByUser = new LinkedHashMap<>();
    LocalDateTime earliestCutoff = null;

    for (Map.Entry<UUID, LocalDate> entry : dueTodayById.entrySet()) {
      UUID userId = entry.getKey();
      User user = usersById.get(userId);
      if (user == null || user.getStats() == null || user.getStats().getCurrentStreak() <= 0) {
        continue;
      }

      LocalDateTime userYesterdayStart = entry.getValue().minusDays(1)
          .atStartOfDay(dueZonesById.get(userId))
          .withZoneSameInstant(ZoneId.systemDefault())
          .toLocalDateTime();
      yesterdayCutoffByUser.put(userId, userYesterdayStart);
      if (earliestCutoff == null || userYesterdayStart.isBefore(earliestCutoff)) {
        earliestCutoff = userYesterdayStart;
      }
    }

    if (yesterdayCutoffByUser.isEmpty()) {
      return 0;
    }

    Map<UUID, LocalDateTime> lastCompletedByUser = transactionPort.findLastCompletedTaskAtByUserIds(
        yesterdayCutoffByUser.keySet(), earliestCutoff);
    if (lastCompletedByUser == null) {
      lastCompletedByUser = Map.of();
    }

    int expiredCount = 0;
    for (Map.Entry<UUID, LocalDateTime> entry : yesterdayCutoffByUser.entrySet()) {
      UUID userId = entry.getKey();
      LocalDateTime lastCompletedAt = lastCompletedByUser.get(userId);
      if (lastCompletedAt == null || lastCompletedAt.isBefore(entry.getValue())) {
        User user = usersById.get(userId);
        user.resetStreak();
        dirtyUsers.put(userId, user);
        expiredCount++;
      }
    }
    return expiredCount;
  }

  private void applyHardcorePenalties(
      List<Task> failedTasks,
      String namePrefix,
      Map<UUID, User> usersById,
      Map<UUID, User> dirtyUsers,
      Map<UUID, LocalDate> dueTodayById) {
    if (failedTasks.isEmpty()) {
      return;
    }

    Map<UUID, String> columnNamesById = new HashMap<>();
    for (Task task : failedTasks) {
      User user = usersById.get(task.getUserId());
      if (user == null) {
        throw new ResourceNotFoundException("Usuário não encontrado para penalidade.");
      }

      LocalDate ownerToday = dueTodayById.get(task.getUserId());
      Task.TaskReward penalty = task.calculatePenalty(ownerToday);
      user.applyPenalty(penalty.coins(), penalty.xp());
      dirtyUsers.put(user.getId(), user);

      String columnName = task.getBoardColumnId() == null ? null
          : columnNamesById.computeIfAbsent(task.getBoardColumnId(),
              id -> TaskGamificationHelper.resolveColumnName(boardColumnPort, task));
      transactionPort.save(TaskGamificationHelper.buildPenaltyTransaction(
          task.getUserId(), task, penalty, TransactionType.TASK_FAILED, namePrefix, columnName));
    }
  }

  private void rewardCleanNegativeHabits(
      List<UUID> cleanUserIds,
      Map<UUID, User> usersById,
      Map<UUID, User> dirtyUsers) {
    if (cleanUserIds.isEmpty()) {
      return;
    }

    Set<UUID> seenUsers = cleanUserIds.stream().collect(Collectors.toSet());
    for (UUID userId : seenUsers) {
      User user = usersById.get(userId);
      if (user != null && user.getStats() != null) {
        long cleanCount = cleanUserIds.stream().filter(userId::equals).count();
        for (long i = 0; i < cleanCount; i++) {
          user.getStats().recordCleanHabitCycle();
        }
        dirtyUsers.put(user.getId(), user);
      }
    }
  }
}
