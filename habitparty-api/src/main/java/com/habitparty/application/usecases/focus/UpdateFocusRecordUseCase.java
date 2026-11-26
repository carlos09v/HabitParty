package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.task.DailyResetUseCase;
import com.habitparty.application.usecases.user.GlobalStreakSupport;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusReward;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateFocusRecordUseCase {
  private final FocusRecordRepository port;
  private final InventoryItemRepository inventoryItemPort;
  private final FocusActivityRepository focusActivityPort;
  private final TransactionHistoryRepository transactionHistoryPort;
  private final UserRepository userPort;
  private TaskRepository taskPort;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private DailyResetUseCase dailyResetUseCase;
  private WorkspaceWriteGuard workspaceWriteGuard;
  private Clock clock = Clock.systemUTC();

  public UpdateFocusRecordUseCase(FocusRecordRepository port) {
    this(port, null, null, null, null);
  }

  public UpdateFocusRecordUseCase(
      FocusRecordRepository port,
      @Nullable TransactionHistoryRepository transactionHistoryPort) {
    this(port, null, null, transactionHistoryPort, null);
  }

  @Autowired
  public UpdateFocusRecordUseCase(
      FocusRecordRepository port,
      @Nullable InventoryItemRepository inventoryItemPort,
      @Nullable FocusActivityRepository focusActivityPort,
      @Nullable TransactionHistoryRepository transactionHistoryPort,
      @Nullable UserRepository userPort) {
    this.port = port;
    this.inventoryItemPort = inventoryItemPort;
    this.focusActivityPort = focusActivityPort;
    this.transactionHistoryPort = transactionHistoryPort;
    this.userPort = userPort;
  }

  @Autowired(required = false)
  public void setClock(Clock clock) {
    if (clock != null) {
      this.clock = clock;
    }
  }

  @Autowired(required = false)
  public void setDailyResetUseCase(DailyResetUseCase dailyResetUseCase) {
    this.dailyResetUseCase = dailyResetUseCase;
  }

  @Autowired(required = false)
  public void setTaskPort(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  @Autowired(required = false)
  public void setEvaluateUserAchievementsUseCase(
      EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public FocusRecord execute(UUID userIdLogado, UUID recordId, String notes) {
    return execute(userIdLogado, recordId, UpdateFocusRecordCommand.notesOnly(notes));
  }

  public FocusRecord execute(UUID userIdLogado, UUID recordId, UpdateFocusRecordCommand command) {
    FocusRecord existing = port.findById(recordId)
        .orElseThrow(() -> new ResourceNotFoundException("Registro de foco não encontrado."));
    existing.validateOwnership(userIdLogado);

    if (command == null || command.isNotesOnlyUpdate()) {
      String notes = command != null ? command.notes() : null;
      existing.updateNotes(notes);
      FocusRecord saved = port.save(existing);
      syncNotesDescriptionSnapshot(recordId, userIdLogado, saved);
      return saved;
    }

    if (command.startTime() == null || command.endTime() == null) {
      throw new DomainValidationException("Os horários de início e fim são obrigatórios.");
    }
    if (command.endTime().isBefore(command.startTime())) {
      throw new DomainValidationException("O horário de fim não pode ser anterior ao horário de início.");
    }
    if (command.pomoTargetMinutes() != null
        && (command.pomoTargetMinutes() < 1
            || command.pomoTargetMinutes() > FocusRecord.MAX_POMO_TARGET_MINUTES)) {
      throw new DomainValidationException(
          "A duração alvo do Pomodoro deve estar entre 1 e "
              + FocusRecord.MAX_POMO_TARGET_MINUTES
              + " minutos.");
    }

    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userIdLogado);
    }

    boolean wasInventory = existing.getInventoryItemId().isPresent();
    boolean incomingInventory = command.inventoryItemId() != null;
    if (wasInventory != incomingInventory) {
      throw new DomainValidationException(
          wasInventory
              ? "Não é possível converter um registro de item de inventário em sessão produtiva."
              : "Não é possível converter uma sessão produtiva em uso de item de inventário.");
    }

    if (wasInventory) {
      return updateInventoryRecord(userIdLogado, existing, command);
    }

    return updateProductiveRecord(userIdLogado, existing, command);
  }

  private void syncNotesDescriptionSnapshot(UUID recordId, UUID userIdLogado, FocusRecord saved) {
    if (transactionHistoryPort != null) {
      String descriptionSnapshot = saved.getNotes()
          .map(String::trim)
          .filter(n -> !n.isEmpty())
          .orElse(null);
      transactionHistoryPort.updateFocusDescriptionSnapshot(recordId, userIdLogado, descriptionSnapshot);
    }
  }

  private FocusRecord updateInventoryRecord(
      UUID userIdLogado,
      FocusRecord existing,
      UpdateFocusRecordCommand command) {
    if (command.focusActivityId() != null || command.taskId() != null) {
      throw new DomainValidationException(
          "Um registro de item de inventário não pode estar vinculado a uma Atividade ou Tarefa.");
    }
    if (inventoryItemPort == null) {
      throw new IllegalStateException("Repositório de inventário não disponível para atualizar o registro.");
    }

    User loadedUser = userPort != null ? userPort.findById(userIdLogado).orElse(null) : null;
    ZoneId userZone = FocusRecordSupport.resolveUserZone(loadedUser);

    LocalDateTime serverStartTime = FocusRecordSupport.toServerTime(command.startTime(), userZone);
    LocalDateTime serverEndTime = FocusRecordSupport.toServerTime(command.endTime(), userZone);

    long newSecondsLong = Duration.between(
        command.startTime().atZone(userZone),
        command.endTime().atZone(userZone)).toSeconds();
    if (newSecondsLong <= 0) {
      throw new DomainValidationException("A duração do registro deve ser maior que zero.");
    }
    int newSeconds = (int) Math.min(Integer.MAX_VALUE, newSecondsLong);
    int oldSeconds = existing.getDurationSeconds();

    UUID oldItemId = existing.getInventoryItemId().get();
    UUID newItemId = command.inventoryItemId();
    InventoryItem targetItem;
    int targetSecondsBefore;
    int targetSecondsAfter;

    if (oldItemId.equals(newItemId)) {
      targetItem = inventoryItemPort.findById(oldItemId)
          .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));
      targetItem.validateOwnership(userIdLogado);
      targetSecondsBefore = targetItem.getRemainingSeconds().orElse(0);
      targetItem.adjustFocusSeconds(oldSeconds, newSeconds);
      targetSecondsAfter = targetItem.getRemainingSeconds().orElse(0);
      inventoryItemPort.save(targetItem);
    } else {
      InventoryItem oldItem = inventoryItemPort.findById(oldItemId)
          .orElseThrow(() -> new ResourceNotFoundException("Item de inventário anterior não encontrado."));
      oldItem.validateOwnership(userIdLogado);

      InventoryItem newItem = inventoryItemPort.findById(newItemId)
          .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));
      newItem.validateOwnership(userIdLogado);
      if (newItem.getStatus() != InventoryItemStatus.IN_FOCUS) {
        throw new DomainValidationException("O item precisa estar no modo Foco para receber este registro.");
      }
      targetSecondsBefore = newItem.getRemainingSeconds().orElse(0);
      if (newItem.getRemainingSeconds().isPresent() && newSeconds > targetSecondsBefore) {
        throw new DomainValidationException(
            "A duração da sessão excede o tempo disponível do item (" + (targetSecondsBefore / 60) + "m).");
      }

      oldItem.refundSeconds(oldSeconds);
      inventoryItemPort.save(oldItem);

      newItem.deductSeconds(newSeconds);
      targetSecondsAfter = newItem.getRemainingSeconds().orElse(0);
      inventoryItemPort.save(newItem);
      targetItem = newItem;
    }

    FocusRecordType resolvedType = command.recordType() != null
        ? command.recordType()
        : existing.getRecordType().orElse(FocusRecordType.STOPWATCH);
    Integer resolvedPomos = resolvedType == FocusRecordType.POMO
        ? (command.completedPomos() != null ? command.completedPomos() : existing.getCompletedPomos().orElse(0))
        : null;

    FocusRecord updatedRecord = new FocusRecord(
        existing.getId(),
        userIdLogado,
        null,
        newItemId,
        null,
        null,
        command.notes(),
        serverStartTime,
        serverEndTime,
        resolvedType,
        resolvedPomos,
        null,
        0,
        BigDecimal.ZERO);

    FocusRecord saved = port.save(updatedRecord);

    FocusRecordSupport.evaluateCouponDepletionAchievement(
        userIdLogado,
        targetItem,
        targetSecondsBefore,
        targetSecondsAfter,
        loadedUser,
        userPort,
        evaluateUserAchievementsUseCase);

    return saved;
  }

  private FocusRecord updateProductiveRecord(
      UUID userIdLogado,
      FocusRecord existing,
      UpdateFocusRecordCommand command) {
    boolean wasOrphaned = existing.getFocusActivityId().isEmpty() && existing.getTaskId().isEmpty();
    if (!wasOrphaned && command.focusActivityId() == null && command.taskId() == null) {
      throw new DomainValidationException(
          "O registro deve estar vinculado a uma Atividade ou a uma Tarefa.");
    }

    Task loadedTask = null;
    String taskNameSnapshot;
    if (command.taskId() != null) {
      loadedTask = FocusRecordSupport.loadAndValidateLinkedTask(
          userIdLogado,
          command.taskId(),
          taskPort,
          workspaceWriteGuard,
          "Repositório de tarefas não disponível para vincular tarefa.");
      taskNameSnapshot = loadedTask.getName();
    } else if (existing.getTaskId().isEmpty()) {
      taskNameSnapshot = existing.getTaskNameSnapshot().orElse(null);
    } else {
      taskNameSnapshot = null;
    }

    User loadedUser = userPort != null
        ? userPort.findById(userIdLogado)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."))
        : null;

    FocusActivity loadedActivity = null;
    if (command.focusActivityId() != null && focusActivityPort != null) {
      loadedActivity = focusActivityPort.findById(command.focusActivityId())
          .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
      loadedActivity.validateOwnership(userIdLogado);

      boolean changedToDifferentActivity = !Objects.equals(
          existing.getFocusActivityId().orElse(null),
          command.focusActivityId());
      if (changedToDifferentActivity) {
        FocusRecordSupport.validateFreePlanActivityAccess(
            userIdLogado, command.focusActivityId(), loadedUser, focusActivityPort);
      }
    }

    FocusRecordType effectiveType = command.recordType() != null
        ? command.recordType()
        : existing.getRecordType().orElse(FocusRecordType.STOPWATCH);
    Integer resolvedPomos = null;
    Integer resolvedPomoTargetMinutes = null;
    if (effectiveType == FocusRecordType.POMO) {
      resolvedPomos = command.completedPomos() != null
          ? command.completedPomos()
          : existing.getCompletedPomos().orElse(0);
      if (command.pomoTargetMinutes() != null) {
        resolvedPomoTargetMinutes = command.pomoTargetMinutes();
      } else if (loadedActivity != null && loadedActivity.getRecordType() == FocusRecordType.POMO) {
        resolvedPomoTargetMinutes = loadedActivity.getPomoDurationMinutes().orElse(null);
      } else if (Objects.equals(existing.getFocusActivityId().orElse(null), command.focusActivityId())) {
        resolvedPomoTargetMinutes = existing.getPomoTargetMinutes().orElse(null);
      }
    }

    ZoneId userZone = FocusRecordSupport.resolveUserZone(loadedUser);
    LocalDateTime userStartTime = command.startTime();
    LocalDateTime userEndTime = command.endTime();

    FocusRecord preliminaryUserRecord = new FocusRecord(
        existing.getId(),
        userIdLogado,
        command.focusActivityId(),
        null,
        command.taskId(),
        taskNameSnapshot,
        command.notes(),
        userStartTime,
        userEndTime,
        effectiveType,
        resolvedPomos,
        resolvedPomoTargetMinutes,
        0,
        BigDecimal.ZERO);

    LocalDate targetDate = userEndTime.toLocalDate();
    int priorMinutesExcludingSelf = port.sumFocusMinutesOnDateExcludingRecord(
        userIdLogado, targetDate, userZone, existing.getId());
    FocusReward computedReward = FocusRewardCalculator.calculate(preliminaryUserRecord, priorMinutesExcludingSelf);

    int oldXp = existing.getXpEarned().orElse(0);
    BigDecimal oldCoins = existing.getCoinsEarned().orElse(BigDecimal.ZERO);

    // Antifraude: se este registro já sofreu estorno parcial anterior (moedas gastas ou piso de nível),
    // bloqueia ganho líquido adicional ao expandir novamente (evita farm infinito shrink/expand).
    FocusReward effectiveReward = existing.isRewardLocked()
        ? new FocusReward(
            Math.min(oldXp, computedReward.xp()),
            oldCoins.min(computedReward.coins()))
        : computedReward;

    boolean nextRewardLocked = existing.isRewardLocked();
    if (!nextRewardLocked && loadedUser != null && loadedUser.getStats() != null) {
      UserStats stats = loadedUser.getStats();
      int xpDeltaPreview = effectiveReward.xp() - oldXp;
      BigDecimal coinsDeltaPreview = effectiveReward.coins().subtract(oldCoins);
      boolean xpFullyReverted = true;
      if (xpDeltaPreview < 0) {
        int minXpForCurrentLevel = stats.getCurrentLevel().getMinXpRequired();
        xpFullyReverted = (stats.getTotalXp() - (-xpDeltaPreview)) >= minXpForCurrentLevel;
      }
      boolean coinsFullyReverted = true;
      if (coinsDeltaPreview.compareTo(BigDecimal.ZERO) < 0) {
        coinsFullyReverted = stats.getCurrentCoins().compareTo(coinsDeltaPreview.negate()) >= 0;
      }
      if (!xpFullyReverted || !coinsFullyReverted) {
        nextRewardLocked = true;
      }
    }

    LocalDate userToday = LocalDate.now(clock.withZone(userZone));
    int priorProductiveMinutesTodayExcludingSelf = port.sumProductiveFocusMinutesOnDateExcludingRecord(
        userIdLogado, userToday, userZone, existing.getId());

    LocalDateTime serverStartTime = FocusRecordSupport.toServerTime(userStartTime, userZone);
    LocalDateTime serverEndTime = FocusRecordSupport.toServerTime(userEndTime, userZone);

    FocusRecord updatedRecord = new FocusRecord(
        existing.getId(),
        userIdLogado,
        command.focusActivityId(),
        null,
        command.taskId(),
        taskNameSnapshot,
        command.notes(),
        serverStartTime,
        serverEndTime,
        effectiveType,
        resolvedPomos,
        resolvedPomoTargetMinutes,
        effectiveReward.xp(),
        effectiveReward.coins(),
        nextRewardLocked);

    FocusRecord savedRecord = port.save(updatedRecord);

    updateTaskMetrics(existing, savedRecord, loadedTask);
    if (loadedUser != null) {
      updateUserStatsAndStreak(
          userIdLogado,
          loadedUser,
          existing,
          savedRecord,
          effectiveReward,
          loadedActivity,
          userZone,
          userToday,
          userStartTime,
          userEndTime,
          targetDate,
          priorProductiveMinutesTodayExcludingSelf);
    }

    if (transactionHistoryPort != null) {
      FocusRecordTransactionSupport.FocusTransactionSnapshot snapshot =
          FocusRecordTransactionSupport.buildSnapshot(savedRecord, loadedActivity, loadedTask);
      transactionHistoryPort.updateFocusCompletedSnapshot(
          existing.getId(),
          userIdLogado,
          snapshot.nameSnapshot(),
          snapshot.iconSnapshot(),
          effectiveReward.coins(),
          effectiveReward.xp(),
          List.of(snapshot.durationLabel()),
          snapshot.descriptionSnapshot(),
          savedRecord.getEndTime());
    }

    return savedRecord;
  }

  private void updateTaskMetrics(FocusRecord existing, FocusRecord savedRecord, @Nullable Task newTask) {
    if (taskPort == null) {
      return;
    }
    UUID oldTaskId = existing.getTaskId().orElse(null);
    UUID newTaskId = savedRecord.getTaskId().orElse(null);
    int oldMins = Math.max(1, existing.getDurationMinutes());
    int oldPomos = existing.getCompletedPomos().orElse(0);
    int newMins = Math.max(1, savedRecord.getDurationMinutes());
    int newPomos = savedRecord.getCompletedPomos().orElse(0);

    if (Objects.equals(oldTaskId, newTaskId)) {
      if (newTask != null && (oldMins != newMins || oldPomos != newPomos)) {
        newTask.removeFocusSession(oldMins, oldPomos);
        newTask.addFocusSession(newMins, newPomos);
        taskPort.save(newTask);
      }
      return;
    }

    if (oldTaskId != null) {
      taskPort.findById(oldTaskId).ifPresent(oldTask -> {
        oldTask.removeFocusSession(oldMins, oldPomos);
        taskPort.save(oldTask);
      });
    }
    if (newTask != null) {
      newTask.addFocusSession(newMins, newPomos);
      taskPort.save(newTask);
    }
  }

  private void updateUserStatsAndStreak(
      UUID userId,
      User user,
      FocusRecord existing,
      FocusRecord savedRecord,
      FocusReward newReward,
      @Nullable FocusActivity newActivity,
      ZoneId userZone,
      LocalDate userToday,
      LocalDateTime newUserStartTime,
      LocalDateTime newUserEndTime,
      LocalDate newTargetDate,
      int priorProductiveMinutesTodayExcludingSelf) {
    UserStats stats = user.getStats();
    if (stats == null) {
      return;
    }

    int oldXp = existing.getXpEarned().orElse(0);
    BigDecimal oldCoins = existing.getCoinsEarned().orElse(BigDecimal.ZERO);
    int xpDelta = newReward.xp() - oldXp;
    BigDecimal coinsDelta = newReward.coins().subtract(oldCoins);

    UserLevel levelBefore = user.getCurrentLevel();
    if (xpDelta > 0) {
      user.addXp(xpDelta);
    } else if (xpDelta < 0) {
      stats.revertFocusXpOnly(-xpDelta);
    }

    if (coinsDelta.compareTo(BigDecimal.ZERO) > 0) {
      user.addCoins(coinsDelta);
    } else if (coinsDelta.compareTo(BigDecimal.ZERO) < 0) {
      stats.revertFocusCoinsOnly(coinsDelta.negate());
    }
    UserLevel levelAfter = user.getCurrentLevel();
    UserLevel reachedLevel = levelAfter.ordinal() > levelBefore.ordinal() ? levelAfter : null;

    int oldDuration = existing.getDurationMinutes();
    int oldPomos = existing.getCompletedPomos().orElse(0);
    int newDuration = (int) Math.max(
        0L,
        Duration.between(newUserStartTime.atZone(userZone), newUserEndTime.atZone(userZone)).toMinutes());
    int newPomos = savedRecord.getCompletedPomos().orElse(0);

    boolean oldQualifiedStats = oldDuration >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS;
    boolean newQualifiedStats = newDuration >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS;

    stats.revertFocusActivityCounters(oldDuration, oldQualifiedStats ? oldPomos : 0);
    if (newQualifiedStats) {
      stats.recordFocusCompleted(newDuration, newPomos);
    }

    if (oldDuration >= stats.getLongestFocusSessionMinutes() && newDuration < oldDuration) {
      int remainingMax = port.findMaxProductiveDurationMinutesExcludingRecord(userId, existing.getId());
      int candidateNew = newQualifiedStats ? newDuration : 0;
      stats.setLongestFocusSessionMinutes(Math.max(remainingMax, candidateNew));
    } else if (newQualifiedStats && newDuration > stats.getLongestFocusSessionMinutes()) {
      stats.setLongestFocusSessionMinutes(newDuration);
    }

    if (oldQualifiedStats) {
      LocalDateTime oldUserStart = existing.getStartTime()
          .atZone(ZoneId.systemDefault())
          .withZoneSameInstant(userZone)
          .toLocalDateTime();
      LocalDateTime oldUserEnd = existing.getEndTime()
          .atZone(ZoneId.systemDefault())
          .withZoneSameInstant(userZone)
          .toLocalDateTime();
      stats.revertFocusTimeOfDay(oldUserStart, oldUserEnd, oldDuration);
    }
    if (newQualifiedStats) {
      stats.recordFocusTimeOfDay(newUserStartTime, newUserEndTime, newDuration);
    }

    boolean oldMetGoal = didMeetActivityGoal(existing, oldDuration, oldPomos, newActivity);
    boolean newMetGoal = didMeetActivityGoal(savedRecord, newDuration, newPomos, newActivity);
    if (!oldMetGoal && newMetGoal) {
      stats.recordActivityGoalMet();
    } else if (oldMetGoal && !newMetGoal) {
      stats.revertActivityGoalMet();
    }

    boolean isNewOnToday = newTargetDate.equals(userToday);
    int totalProductiveMinutesToday = priorProductiveMinutesTodayExcludingSelf + (isNewOnToday ? newDuration : 0);
    boolean alreadyEarnedStreakToday = userToday.equals(user.getLastStreakDate());
    boolean hasCompletedTaskToday = transactionHistoryPort != null
        && transactionHistoryPort.countCompletedTasksToday(userId, userZone) > 0;

    if (!alreadyEarnedStreakToday
        && totalProductiveMinutesToday >= FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES
        && !hasCompletedTaskToday) {
      GlobalStreakSupport.incrementTodayStreakIfYesterdayVerified(
          user, userZone, userToday, transactionHistoryPort, port);
    } else if (alreadyEarnedStreakToday
        && totalProductiveMinutesToday < FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES
        && !hasCompletedTaskToday) {
      stats.revertTodayStreakIncrement(userToday);
    }

    userPort.save(user);

    if (evaluateUserAchievementsUseCase != null) {
      evaluateUserAchievementsUseCase.execute(user);
      if (reachedLevel != null) {
        evaluateUserAchievementsUseCase.notifyLevelMilestoneIfReached(user.getId(), reachedLevel);
      }
    }
  }

  private boolean didMeetActivityGoal(
      FocusRecord record,
      int durationMinutes,
      int completedPomos,
      @Nullable FocusActivity loadedNewActivity) {
    if (record.getFocusActivityId().isEmpty() || durationMinutes < UserStats.MIN_FOCUS_MINUTES_FOR_STATS) {
      return false;
    }
    UUID activityId = record.getFocusActivityId().get();
    FocusActivity activity = loadedNewActivity != null && activityId.equals(loadedNewActivity.getId())
        ? loadedNewActivity
        : (focusActivityPort != null ? focusActivityPort.findById(activityId).orElse(null) : null);
    int targetMinutes = activity != null ? activity.getPomoDurationMinutes().orElse(25) : 25;
    return completedPomos >= 1 || durationMinutes >= targetMinutes;
  }
}
