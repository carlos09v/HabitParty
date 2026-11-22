package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.time.Clock;

import com.habitparty.application.usecases.task.DailyResetUseCase;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.user.GlobalStreakSupport;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusReward;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateFocusRecordUseCase {
  private final FocusRecordRepository port;
  private final InventoryItemRepository inventoryItemPort;
  private final FocusActivityRepository focusActivityPort;
  private final TransactionHistoryRepository transactionHistoryPort;
  private final UserRepository userPort;
  private TaskRepository taskPort;
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;
  private Clock clock = Clock.systemUTC();
  private DailyResetUseCase dailyResetUseCase;

  public CreateFocusRecordUseCase(
      FocusRecordRepository port,
      InventoryItemRepository inventoryItemPort,
      FocusActivityRepository focusActivityPort,
      TransactionHistoryRepository transactionHistoryPort,
      UserRepository userPort) {
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
  public void setEvaluateUserAchievementsUseCase(EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase) {
    this.evaluateUserAchievementsUseCase = evaluateUserAchievementsUseCase;
  }

  @Transactional
  public FocusRecord execute(UUID userIdLogado, CreateFocusRecordCommand command) {
    if (dailyResetUseCase != null) {
      dailyResetUseCase.resetUserIfDue(userIdLogado);
    }

    Task loadedTask = null;
    String taskNameSnapshot = null;

    if (command.taskId() != null && taskPort != null) {
      loadedTask = FocusRecordSupport.loadAndValidateLinkedTask(
          userIdLogado,
          command.taskId(),
          taskPort,
          "Repositório de tarefas não disponível para vincular tarefa.");
      taskNameSnapshot = loadedTask.getName();
    }

    // 1. Instancia o registro preliminar para validações de domínio (datas, ownership, exclusividade)
    FocusRecord record = new FocusRecord(
        null,
        userIdLogado,
        command.focusActivityId(),
        command.inventoryItemId(),
        command.taskId(),
        taskNameSnapshot,
        command.notes(),
        command.startTime(),
        command.endTime(),
        command.recordType(),
        command.completedPomos(),
        command.pomoTargetMinutes(),
        0,
        BigDecimal.ZERO);

    FocusActivity loadedActivity = null;
    User loadedUser = null;

    // Se for uma atividade personalizada, valida posse e se a atividade está ativa no plano (máx. 4 ativas no Free)
    if (command.focusActivityId() != null) {
      loadedActivity = focusActivityPort.findById(command.focusActivityId())
          .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
      loadedActivity.validateOwnership(userIdLogado);

      loadedUser = userPort.findById(userIdLogado)
          .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

      FocusRecordSupport.validateFreePlanActivityAccess(
          userIdLogado, command.focusActivityId(), loadedUser, focusActivityPort);
    }

    // 2. Se for o uso de uma recompensa (mochila), aplica a lógica de inventário (NUNCA gera XP ou Gold)
    if (record.getInventoryItemId().isPresent()) {
      UUID itemId = record.getInventoryItemId().get();

      InventoryItem item = inventoryItemPort.findById(itemId)
          .orElseThrow(() -> new ResourceNotFoundException("Item de inventário não encontrado."));
      item.validateOwnership(userIdLogado);

      if (loadedUser == null && userPort != null) {
        loadedUser = userPort.findById(userIdLogado).orElse(null);
      }
      ZoneId itemUserZone = FocusRecordSupport.resolveUserZone(loadedUser);
      LocalDateTime serverStartTime = FocusRecordSupport.toServerTime(record.getStartTime(), itemUserZone);
      LocalDateTime serverEndTime = FocusRecordSupport.toServerTime(record.getEndTime(), itemUserZone);

      long secondsSpent = java.time.Duration.between(
          record.getStartTime().atZone(itemUserZone),
          record.getEndTime().atZone(itemUserZone)).toSeconds();
      int secondsBefore = item.getRemainingSeconds().orElse(0);
      if (secondsSpent > 0) {
        item.deductSeconds((int) secondsSpent);
      }
      int secondsAfter = item.getRemainingSeconds().orElse(0);

      inventoryItemPort.save(item);
      FocusRecord serverInventoryRecord = new FocusRecord(
          record.getId(),
          record.getUserId(),
          null,
          itemId,
          command.taskId(),
          taskNameSnapshot,
          record.getNotes().orElse(null),
          serverStartTime,
          serverEndTime,
          record.getRecordType().orElse(null),
          record.getCompletedPomos().orElse(null),
          0,
          BigDecimal.ZERO);
      FocusRecord savedInventoryRecord = port.save(serverInventoryRecord);

      // Cupom de tempo esgotado nesta sessão (saldo cruzou para <= 1s): conta para a conquista "Alquimista do Tempo"
      FocusRecordSupport.evaluateCouponDepletionAchievement(
          userIdLogado,
          item,
          secondsBefore,
          secondsAfter,
          loadedUser,
          userPort,
          evaluateUserAchievementsUseCase);

      return savedInventoryRecord;
    }

    // 3. Atividade produtiva ou foco livre: calcula recompensas matemáticas calibradas
    if (loadedUser == null && userPort != null) {
      loadedUser = userPort.findById(userIdLogado).orElse(null);
    }
    ZoneId userZone = FocusRecordSupport.resolveUserZone(loadedUser);
    LocalDateTime userStartTime = record.getStartTime();
    LocalDateTime userEndTime = record.getEndTime();
    LocalDate targetDate = userEndTime.toLocalDate();
    int priorMinutesOnTargetDate = port.sumFocusMinutesOnDate(userIdLogado, targetDate, userZone);
    FocusReward reward = FocusRewardCalculator.calculate(record, priorMinutesOnTargetDate);

    LocalDate userToday = LocalDate.now(clock.withZone(userZone));
    boolean isTodayFocus = targetDate.equals(userToday);
    int priorProductiveMinutesToday = isTodayFocus
        ? port.sumProductiveFocusMinutesOnDate(userIdLogado, userToday, userZone)
        : 0;
    LocalDateTime serverStartTime = FocusRecordSupport.toServerTime(userStartTime, userZone);
    LocalDateTime serverEndTime = FocusRecordSupport.toServerTime(userEndTime, userZone);

    // Cria o registro definitivo com os ganhos de XP e moedas persistidos em referência canônica do servidor
    FocusRecord recordWithRewards = new FocusRecord(
        record.getId(),
        record.getUserId(),
        command.focusActivityId(),
        null,
        command.taskId(),
        taskNameSnapshot,
        record.getNotes().orElse(null),
        serverStartTime,
        serverEndTime,
        record.getRecordType().orElse(null),
        record.getCompletedPomos().orElse(null),
        record.getPomoTargetMinutes().orElse(null),
        reward.xp(),
        reward.coins());

    FocusRecord savedRecord = port.save(recordWithRewards);

    // 3.1. Se houver Tarefa vinculada, acumula os minutos e ciclos de foco na Task
    if (loadedTask != null && taskPort != null) {
      int durationMins = Math.max(1, savedRecord.getDurationMinutes());
      int pomos = savedRecord.getCompletedPomos().orElse(0);
      loadedTask.addFocusSession(durationMins, pomos);
      taskPort.save(loadedTask);
    }

    // 4. Credita XP, moedas, estatísticas de foco e ofensiva global (reutilizando loadedUser se já carregado).
    // Sessões >= MIN_FOCUS_MINUTES_FOR_STATS mantêm estatísticas e conquistas mesmo após o soft cap diário de XP/moedas.
    long focusDurationMinutes = Math.max(
        0,
        java.time.Duration.between(userStartTime.atZone(userZone), userEndTime.atZone(userZone)).toMinutes());
    boolean hasCurrencyRewards = reward.xp() > 0 || reward.coins().compareTo(BigDecimal.ZERO) > 0;
    boolean qualifiesForFocusStats = focusDurationMinutes >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS;
    boolean alreadyEarnedStreakToday = userToday.equals(loadedUser.getLastStreakDate());
    boolean justReachedStreakFocusTarget = isTodayFocus
        && !alreadyEarnedStreakToday
        && focusDurationMinutes > 0
        && priorProductiveMinutesToday < FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES
        && priorProductiveMinutesToday + (int) focusDurationMinutes
            >= FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES
        && (transactionHistoryPort == null
            || transactionHistoryPort.countCompletedTasksToday(userIdLogado, userZone) == 0);

    if (hasCurrencyRewards || qualifiesForFocusStats || justReachedStreakFocusTarget) {
      User user = loadedUser != null
          ? loadedUser
          : userPort.findById(userIdLogado)
              .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
      UserLevel levelBefore = user.getCurrentLevel();
      if (reward.xp() > 0) {
        user.addXp(reward.xp());
      }
      if (reward.coins().compareTo(BigDecimal.ZERO) > 0) {
        user.addCoins(reward.coins());
      }
      UserLevel levelAfter = user.getCurrentLevel();
      UserLevel reachedLevel = levelAfter.ordinal() > levelBefore.ordinal() ? levelAfter : null;
      int completedPomos = savedRecord.getCompletedPomos().orElse(0);
      if (user.getStats() != null && qualifiesForFocusStats) {
        user.getStats().recordFocusCompleted((int) focusDurationMinutes, completedPomos);
        user.getStats().recordFocusTimeOfDay(
            userStartTime, userEndTime, (int) focusDurationMinutes);
        if (savedRecord.getFocusActivityId().isPresent()) {
          FocusActivity targetActivity = loadedActivity != null
              ? loadedActivity
              : focusActivityPort.findById(savedRecord.getFocusActivityId().get()).orElse(null);
          int activityTargetMinutes = targetActivity != null
              ? targetActivity.getPomoDurationMinutes().orElse(25)
              : 25;
          if (completedPomos >= 1 || focusDurationMinutes >= activityTargetMinutes) {
            user.getStats().recordActivityGoalMet();
          }
        }
      }
      if (justReachedStreakFocusTarget) {
        GlobalStreakSupport.incrementTodayStreakIfYesterdayVerified(
            user, userZone, userToday, transactionHistoryPort, port);
      }
      userPort.save(user);
      if (evaluateUserAchievementsUseCase != null) {
        evaluateUserAchievementsUseCase.execute(user);
        if (reachedLevel != null) {
          evaluateUserAchievementsUseCase.notifyLevelMilestoneIfReached(user.getId(), reachedLevel);
        }
      }
    }

    // 5. Registra a transação no extrato financeiro (reutilizando loadedActivity e loadedTask sem query extra)
    FocusActivity transactionActivity = loadedActivity;
    if (transactionActivity == null && savedRecord.getFocusActivityId().isPresent()) {
      transactionActivity = focusActivityPort.findById(savedRecord.getFocusActivityId().get())
          .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
      transactionActivity.validateOwnership(userIdLogado);
    }

    FocusRecordTransactionSupport.FocusTransactionSnapshot snapshot =
        FocusRecordTransactionSupport.buildSnapshot(savedRecord, transactionActivity, loadedTask);

    TransactionHistory transaction = new TransactionHistory(
        null,
        userIdLogado,
        savedRecord.getId(),
        reward.coins(),
        reward.xp(),
        null,
        TransactionType.FOCUS_COMPLETED,
        snapshot.nameSnapshot(),
        snapshot.iconSnapshot(),
        null,
        null,
        java.util.List.of(snapshot.durationLabel()),
        null,
        snapshot.descriptionSnapshot(),
        savedRecord.getEndTime());

    transactionHistoryPort.save(transaction);

    return savedRecord;
  }
}