package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.user.GlobalStreakSupport;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DailyResetUseCase {
  private static final Logger log = LoggerFactory.getLogger(DailyResetUseCase.class);

  // Tamanho do lote de usuários processados por transação curta
  static final int BATCH_SIZE = 500;

  private final TaskRepository port;
  private final UserRepository userPort;
  private final TransactionHistoryRepository transactionPort;
  private final Clock clock;
  private final TransactionOperations transactionOperations;
  private final BoardColumnRepository boardColumnPort;
  private TransactionOperations requiresNewTransactionOperations;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private FocusRecordRepository focusRecordPort;

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

  @Autowired(required = false)
  public void setTransactionManager(PlatformTransactionManager transactionManager) {
    if (transactionManager != null) {
      TransactionTemplate template = new TransactionTemplate(transactionManager);
      template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
      this.requiresNewTransactionOperations = template;
    }
  }

  @Autowired(required = false)
  public void setEvaluateUserAchievementsUseCase(
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  @Autowired(required = false)
  public void setFocusRecordPort(FocusRecordRepository focusRecordPort) {
    this.focusRecordPort = focusRecordPort;
  }

  public record RolloverSummary(int processedUsers, int updatedTasks, int overdueHardcoreTodos, int expiredStreaks) {}

  private record RolloverOutcome(boolean changed, boolean hasFailed) {}

  private record BatchResult(RolloverSummary summary, List<User> cleanHabitUsers) {
    static BatchResult empty() {
      return new BatchResult(new RolloverSummary(0, 0, 0, 0), List.of());
    }
  }

  public void executeDailyRollover() {
    executeDailyRolloverSummary();
  }

  /**
   * Garante virada preguiçosa e atômica em transação independente ({@code REQUIRES_NEW}) para um único
   * usuário caso ele interaja entre 00:00 locais e o próximo ciclo do cron, evitando rollback da virada
   * se a operação chamadora falhar posteriormente.
   */
  public boolean resetUserIfDue(UUID userId) {
    if (userId == null) {
      return false;
    }
    Instant nowUtc = Instant.now(clock);
    if (!userPort.isUserDueForDailyReset(userId, nowUtc)) {
      return false;
    }

    TransactionOperations txOps = resolveRequiresNewOperations();
    BatchResult result = txOps != null
        ? txOps.execute(status -> executeSingleUserRolloverUnderLock(userId, nowUtc))
        : executeSingleUserRolloverUnderLock(userId, nowUtc);
    if (result == null) {
      return false;
    }
    evaluateCleanCycleAchievementsPostCommit(result.cleanHabitUsers());
    return result.summary().processedUsers() > 0;
  }

  private TransactionOperations resolveRequiresNewOperations() {
    return requiresNewTransactionOperations != null ? requiresNewTransactionOperations : transactionOperations;
  }

  private BatchResult executeSingleUserRolloverUnderLock(UUID userId, Instant nowUtc) {
    Optional<User> lockedUser = userPort.findByIdForUpdate(userId);
    if (lockedUser.isEmpty()) {
      return BatchResult.empty();
    }
    User user = lockedUser.get();
    ZoneId userZone = user.resolveZoneId(clock.getZone());
    LocalDate userToday = LocalDate.now(clock.withZone(userZone));
    if (!user.shouldRunDailyReset(userToday)
        && user.getNextDailyResetAt() != null
        && user.getNextDailyResetAt().isAfter(nowUtc)) {
      return BatchResult.empty();
    }
    return processLoadedUsersBatch(List.of(user), nowUtc);
  }

  /**
   * Executa a virada diária por fuso horário de cada usuário devido (cron UTC a cada 15 min ou startup).
   * Isola falhas por lote e, em caso de erro inesperado num lote, reprocessa cada usuário em transação
   * independente para que 1 conta corrompida nunca derrube as demais.
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
      try {
        BatchResult batchResult = transactionOperations.execute(status -> processUsersBatch(slice, nowUtc));
        if (batchResult != null) {
          RolloverSummary batch = batchResult.summary();
          processedUsers += batch.processedUsers();
          updatedTasks += batch.updatedTasks();
          overdueHardcoreTodos += batch.overdueHardcoreTodos();
          expiredStreaks += batch.expiredStreaks();
          // Avalia conquistas pós-commit, fora do lock FOR UPDATE de 500 linhas
          evaluateCleanCycleAchievementsPostCommit(batchResult.cleanHabitUsers());
        }
      } catch (Exception batchError) {
        log.error(
            "[DailyResetUseCase] Erro no lote de {} usuário(s); aplicando fallback isolado por usuário: {}",
            slice.size(),
            batchError.getMessage(),
            batchError);
        TransactionOperations isolatedTx = resolveRequiresNewOperations();
        for (UUID singleUserId : slice) {
          try {
            BatchResult singleResult = isolatedTx != null
                ? isolatedTx.execute(status -> processUsersBatch(List.of(singleUserId), nowUtc))
                : processUsersBatch(List.of(singleUserId), nowUtc);
            if (singleResult != null) {
              RolloverSummary single = singleResult.summary();
              processedUsers += single.processedUsers();
              updatedTasks += single.updatedTasks();
              overdueHardcoreTodos += single.overdueHardcoreTodos();
              expiredStreaks += single.expiredStreaks();
              evaluateCleanCycleAchievementsPostCommit(singleResult.cleanHabitUsers());
            }
          } catch (Exception userError) {
            log.error(
                "[DailyResetUseCase] Falha isolada no reset diário do usuário {}: {}",
                singleUserId,
                userError.getMessage(),
                userError);
          }
        }
      }
    }

    return new RolloverSummary(processedUsers, updatedTasks, overdueHardcoreTodos, expiredStreaks);
  }

  private void evaluateCleanCycleAchievementsPostCommit(List<User> cleanHabitUsers) {
    if (evaluateUserAchievementsUseCase == null || cleanHabitUsers == null || cleanHabitUsers.isEmpty()) {
      return;
    }
    for (User user : cleanHabitUsers) {
      try {
        evaluateUserAchievementsUseCase.execute(user);
      } catch (Exception e) {
        log.warn(
            "[DailyResetUseCase] Falha não-bloqueante ao avaliar conquistas pós-rollover do usuário {}: {}",
            user.getId(),
            e.getMessage());
      }
    }
  }

  private BatchResult processUsersBatch(List<UUID> batchUserIds, Instant nowUtc) {
    List<User> lockedUsers = userPort.findAllByIdsForUpdate(batchUserIds);
    List<User> loadedUsers = (lockedUsers != null && !lockedUsers.isEmpty())
        ? lockedUsers
        : userPort.findAllByIds(batchUserIds);
    if (loadedUsers == null || loadedUsers.isEmpty()) {
      return BatchResult.empty();
    }
    return processLoadedUsersBatch(loadedUsers, nowUtc);
  }

  private BatchResult processLoadedUsersBatch(List<User> loadedUsers, Instant nowUtc) {
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
      } else if (user.getNextDailyResetAt() == null || !user.getNextDailyResetAt().isAfter(nowUtc)) {
        // Repara nextDailyResetAt vencido/nulo mesmo quando lastDailyResetDate >= userToday (evita hot-loop de FOR UPDATE)
        LocalDate anchor = (previousResetDate != null && !previousResetDate.isBefore(userToday))
            ? previousResetDate
            : userToday;
        user.markDailyResetExecuted(anchor, userZone);
        dirtyUsers.put(user.getId(), user);
      }
    }

    if (dueTodayById.isEmpty()) {
      if (!dirtyUsers.isEmpty()) {
        userPort.saveAll(dirtyUsers.values());
      }
      return BatchResult.empty();
    }

    List<Task> changedTasks = new ArrayList<>();
    List<Daily> rolledOverDailies = new ArrayList<>();
    List<Task> failedRecurringHardcoreTasks = new ArrayList<>();
    List<UUID> cleanHabitCycleUsers = new ArrayList<>();

    List<Task> recurringTasks = port.findRecurringTasksByUserIds(dueTodayById.keySet());
    for (Task task : recurringTasks) {
      LocalDate userToday = dueTodayById.get(task.getUserId());
      if (userToday == null) {
        continue;
      }
      LocalDate previousResetDate = previousResetById.get(task.getUserId());
      RolloverOutcome outcome = switch (task) {
        case Habit h -> processHabitRollover(h, userToday, previousResetDate, cleanHabitCycleUsers);
        case Daily d -> processDailyRollover(d, userToday);
        default -> new RolloverOutcome(false, false);
      };

      if (outcome.changed()) {
        changedTasks.add(task);
        if (task instanceof Daily d) {
          rolledOverDailies.add(d);
        }
      }
      if (outcome.hasFailed() && task.isHardcoreModeEnabled()) {
        failedRecurringHardcoreTasks.add(task);
      }
    }

    List<Task> overdueTodos = collectOverdueHardcoreTodos(dueTodayById);
    changedTasks.addAll(overdueTodos);

    applyHardcorePenalties(failedRecurringHardcoreTasks, "Falhou: ", usersById, dirtyUsers, dueTodayById);
    applyHardcorePenalties(overdueTodos, "Falhou no prazo: ", usersById, dirtyUsers, dueTodayById);
    rewardCleanHabitCycles(cleanHabitCycleUsers, usersById, dirtyUsers);

    // Só reseta os checkboxes das Diárias após calcular eventuais penalidades do ciclo encerrado,
    // preservando etapas recompensadas que já haviam sido concluídas antes da virada do dia.
    List<UUID> resetChecklistTaskIds = new ArrayList<>();
    for (Daily d : rolledOverDailies) {
      if (!d.resetAllChecklistItems().isEmpty()) {
        resetChecklistTaskIds.add(d.getId());
      }
    }

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
    if (!resetChecklistTaskIds.isEmpty()) {
      port.resetChecklistCompletionByTaskIds(resetChecklistTaskIds);
    }
    if (!dirtyUsers.isEmpty()) {
      userPort.saveAll(dirtyUsers.values());
    }

    List<User> cleanUsersForPostCommit = cleanHabitCycleUsers.stream()
        .distinct()
        .map(usersById::get)
        .filter(java.util.Objects::nonNull)
        .toList();

    return new BatchResult(
        new RolloverSummary(dueTodayById.size(), changedTasks.size(), overdueTodos.size(), expiredStreaks),
        cleanUsersForPostCommit);
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
      Habit habit, LocalDate userToday, LocalDate previousResetDate, List<UUID> cleanHabitCycleUsers) {
    if (habit.getLastCompletedAt() != null && habit.isInSameCycle(userToday)) {
      return new RolloverOutcome(false, false);
    }

    boolean isResetBoundary = switch (habit.getResetCounter()) {
      case DAILY -> true;
      case WEEKLY -> didCrossWeeklyBoundary(previousResetDate, userToday);
      case MONTHLY -> didCrossMonthlyBoundary(previousResetDate, userToday);
    };

    if (isResetBoundary) {
      boolean eligibleCleanCycle = isHabitEligibleForCleanCycle(habit, userToday);
      if (habit.getHabitType() == HabitType.NEGATIVE) {
        if (habit.getNegativeCount() == 0 && eligibleCleanCycle) {
          cleanHabitCycleUsers.add(habit.getUserId());
        }
        habit.resetCycleCounts();
        return new RolloverOutcome(true, false);
      }
      if (habit.getStatus() == TaskStatus.COMPLETED) {
        // Se houve rollover atrasado pulando pelo menos 1 ciclo completo após a última conclusão, aplica falha
        boolean missedCycle = habit.getLastCompletedAt() != null && !habit.isStreakStillActive(userToday);
        if (missedCycle) {
          habit.breakStreak();
        } else if (habit.getHabitType() == HabitType.BOTH && habit.getNegativeCount() == 0 && eligibleCleanCycle) {
          cleanHabitCycleUsers.add(habit.getUserId());
        }
        habit.resetCycleCounts();
        habit.changeStatus(TaskStatus.PENDING);
        return new RolloverOutcome(true, missedCycle);
      }
      if (habit.getStatus() == TaskStatus.PENDING) {
        // Hábito POSITIVE ou BOTH não concluído falhou no ciclo: quebra ofensiva e aplica penalidade Hardcore
        // (não concede clean-cycle para BOTH quando a meta positiva do ciclo falhou).
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

  private boolean isHabitEligibleForCleanCycle(Habit habit, LocalDate userToday) {
    if (habit == null || habit.getCreatedAt() == null || userToday == null) {
      return true;
    }
    HabitResetCounter resetCounter = habit.getResetCounter() != null
        ? habit.getResetCounter()
        : HabitResetCounter.DAILY;
    LocalDate cycleStart = switch (resetCounter) {
      case DAILY -> userToday.minusDays(1);
      case WEEKLY -> userToday.minusWeeks(1);
      case MONTHLY -> userToday.minusMonths(1);
    };
    return habit.getCreatedAt().toLocalDate().isBefore(cycleStart);
  }

  private RolloverOutcome processDailyRollover(Daily daily, LocalDate userToday) {
    boolean canResetCompleted = daily.getLastCompletedAt() == null
        || daily.getLastCompletedAt().toLocalDate().isBefore(userToday);

    if (daily.getStatus() == TaskStatus.COMPLETED && canResetCompleted) {
      boolean missedDueCycle = false;
      if (daily.getLastCompletedAt() != null) {
        LocalDate nextExpectedAfterLast = daily.calculateNextOccurrence(
            daily.getLastCompletedAt().toLocalDate(), false);
        if (nextExpectedAfterLast.isBefore(userToday)) {
          missedDueCycle = true;
          daily.breakStreak();
        }
      }
      daily.changeStatus(TaskStatus.PENDING);
      if (daily.getDueDate().isPresent() && daily.getDueDate().get().isBefore(userToday)) {
        daily.advanceDueDateToAtLeast(userToday);
      }
      return new RolloverOutcome(true, missedDueCycle);
    }

    if (daily.getStatus() == TaskStatus.PENDING
        && daily.getDueDate().isPresent()
        && daily.getDueDate().get().isBefore(userToday)) {
      LocalDate currentDue = daily.getDueDate().get();
      boolean completedInClosingCycle = daily.getLastCompletedAt() != null
          && !daily.getLastCompletedAt().toLocalDate().isBefore(currentDue);
      if (completedInClosingCycle) {
        daily.advanceDueDateToAtLeast(userToday);
        return new RolloverOutcome(true, false);
      }
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
    Map<UUID, LocalDate> minDateByUser = new LinkedHashMap<>();
    int expiredCount = 0;

    for (Map.Entry<UUID, LocalDate> entry : dueTodayById.entrySet()) {
      UUID userId = entry.getKey();
      User user = usersById.get(userId);
      if (user == null || user.getStats() == null || user.getStats().getCurrentStreak() <= 0) {
        continue;
      }
      LocalDate lastStreakDate = user.getStats().getLastStreakDate();
      LocalDate yesterday = entry.getValue().minusDays(1);
      if (lastStreakDate != null) {
        if (lastStreakDate.isBefore(yesterday)) {
          user.resetStreak();
          dirtyUsers.put(userId, user);
          expiredCount++;
        }
        continue;
      }
      minDateByUser.put(userId, yesterday);
    }

    if (minDateByUser.isEmpty()) {
      return expiredCount;
    }

    Set<UUID> qualifiedUsers = GlobalStreakSupport.findQualifiedUsersSinceDates(
        minDateByUser, dueZonesById, transactionPort, focusRecordPort, clock);

    for (UUID userId : minDateByUser.keySet()) {
      if (!qualifiedUsers.contains(userId)) {
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
    List<TransactionHistory> penaltyTransactions = new ArrayList<>(failedTasks.size());
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
      penaltyTransactions.add(TaskGamificationHelper.buildPenaltyTransaction(
          task.getUserId(), task, penalty, TransactionType.TASK_FAILED, namePrefix, columnName));
    }
    if (penaltyTransactions.size() == 1) {
      transactionPort.save(penaltyTransactions.get(0));
    } else {
      transactionPort.saveAll(penaltyTransactions);
    }
  }

  private void rewardCleanHabitCycles(
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
