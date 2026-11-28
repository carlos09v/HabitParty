package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.TransactionType;

/**
 * Helper compartilhado para estornar impactos econômicos, estatísticos e de metas
 * antes de excluir registros de foco (individualmente ou em lote por atividade/tarefa).
 */
public final class FocusRecordReversalSupport {

  private static final int DEFAULT_ACTIVITY_TARGET_MINUTES = 25;

  private record TaskDelta(int minutes, int pomos) {
    TaskDelta add(int addMinutes, int addPomos) {
      return new TaskDelta(this.minutes + addMinutes, this.pomos + addPomos);
    }
  }

  private FocusRecordReversalSupport() {}

  /**
   * Estorna tempo de cupons, XP/moedas/estatísticas em {@link UserStats} (incluindo recorde de duração,
   * metas de atividade e sessões por período do dia) e métricas acumuladas nas tarefas vinculadas.
   */
  public static void revertDeletedRecords(
      UUID userId,
      List<FocusRecord> recordsToDelete,
      FocusRecordRepository focusRecordPort,
      UserRepository userPort,
      InventoryItemRepository inventoryItemPort,
      TaskRepository taskPort,
      TransactionHistoryRepository transactionPort,
      Clock clock) {
    if (recordsToDelete == null || recordsToDelete.isEmpty()) {
      return;
    }

    revertInventoryCoupons(userId, recordsToDelete, inventoryItemPort, transactionPort);
    revertProductiveUserStats(userId, recordsToDelete, focusRecordPort, userPort, transactionPort, clock);
    revertTaskFocusMetrics(recordsToDelete, taskPort);
  }

  private static void revertInventoryCoupons(
      UUID userId,
      List<FocusRecord> records,
      InventoryItemRepository inventoryItemPort,
      TransactionHistoryRepository transactionPort) {
    if (inventoryItemPort == null) {
      return;
    }
    Map<UUID, Integer> secondsByItemId = new LinkedHashMap<>();
    for (FocusRecord record : records) {
      if (record.getInventoryItemId().isEmpty()) {
        continue;
      }
      UUID itemId = record.getInventoryItemId().get();
      int secondsToRefund = record.getDurationSeconds();
      if (secondsToRefund > 0) {
        secondsByItemId.merge(itemId, secondsToRefund, Integer::sum);
      }
    }

    secondsByItemId.forEach((itemId, totalSeconds) ->
        inventoryItemPort.findById(itemId).ifPresent(item -> {
          boolean wasConsumed = item.getStatus() == InventoryItemStatus.CONSUMED;
          item.refundSeconds(totalSeconds);
          inventoryItemPort.save(item);
          if (wasConsumed && item.getStatus() != InventoryItemStatus.CONSUMED && transactionPort != null) {
            transactionPort.deleteAllByReferenceIdAndUserIdAndType(itemId, userId, TransactionType.ITEM_CONSUMED);
          }
        }));
  }

  private static void revertProductiveUserStats(
      UUID userId,
      List<FocusRecord> records,
      FocusRecordRepository focusRecordPort,
      UserRepository userPort,
      TransactionHistoryRepository transactionPort,
      Clock clock) {
    if (userPort == null) {
      return;
    }

    List<FocusRecord> qualifyingRecords = new ArrayList<>();
    for (FocusRecord record : records) {
      if (record.getInventoryItemId().isPresent()) {
        continue;
      }
      boolean hasImpact = record.getXpEarned().orElse(0) > 0
          || record.getCoinsEarned().orElse(BigDecimal.ZERO).compareTo(BigDecimal.ZERO) > 0
          || record.getDurationMinutes() >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS;
      if (hasImpact) {
        qualifyingRecords.add(record);
      }
    }

    if (qualifyingRecords.isEmpty()) {
      return;
    }

    Clock effectiveClock = clock != null ? clock : Clock.systemUTC();
    ZoneId storageZone = effectiveClock.getZone();

    userPort.findById(userId).ifPresent(user -> {
      UserStats stats = user.getStats();
      if (stats == null) {
        return;
      }

      ZoneId userZone = user.resolveZoneId(ZoneId.of(User.DEFAULT_TIMEZONE));
      LocalDate userToday = LocalDate.now(effectiveClock.withZone(userZone));
      int maxDurationReverted = 0;
      int deletedMinutesOnToday = 0;
      List<UUID> productiveRecordIds = new ArrayList<>(qualifyingRecords.size());

      for (FocusRecord record : qualifyingRecords) {
        int xpToRevert = record.getXpEarned().orElse(0);
        BigDecimal coinsToRevert = record.getCoinsEarned().orElse(BigDecimal.ZERO);
        int minsToRevert = record.getDurationMinutes();
        int pomosToRevert = record.getCompletedPomos().orElse(0);
        boolean qualifiedForStats = minsToRevert >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS;

        // Alinha pomodoros estornados à mesma regra de CreateFocusRecordUseCase (>= 10 min)
        stats.revertFocusSession(xpToRevert, coinsToRevert, minsToRevert, qualifiedForStats ? pomosToRevert : 0);

        LocalDateTime userEndTime = record.getEndTime()
            .atZone(storageZone)
            .withZoneSameInstant(userZone)
            .toLocalDateTime();
        if (userEndTime.toLocalDate().equals(userToday) && minsToRevert > 0) {
          deletedMinutesOnToday += minsToRevert;
        }

        if (qualifiedForStats) {
          LocalDateTime userStartTime = record.getStartTime()
              .atZone(storageZone)
              .withZoneSameInstant(userZone)
              .toLocalDateTime();
          stats.revertFocusTimeOfDay(userStartTime, userEndTime, minsToRevert);
          maxDurationReverted = Math.max(maxDurationReverted, minsToRevert);

          if (record.getFocusActivityId().isPresent()) {
            int targetMinutes = record.getPomoTargetMinutes().orElse(DEFAULT_ACTIVITY_TARGET_MINUTES);
            if (pomosToRevert >= 1 || minsToRevert >= targetMinutes) {
              stats.revertActivityGoalMet();
            }
          }
        }
        if (record.getId() != null) {
          productiveRecordIds.add(record.getId());
        }
      }

      if (maxDurationReverted >= stats.getLongestFocusSessionMinutes()
          && focusRecordPort != null
          && !productiveRecordIds.isEmpty()) {
        int remainingMax = productiveRecordIds.size() == 1
            ? focusRecordPort.findMaxProductiveDurationMinutesExcludingRecord(
                userId, productiveRecordIds.get(0))
            : focusRecordPort.findMaxProductiveDurationMinutesExcludingRecords(
                userId, productiveRecordIds);
        stats.setLongestFocusSessionMinutes(remainingMax);
      }

      if (deletedMinutesOnToday > 0 && userToday.equals(stats.getLastStreakDate())) {
        int currentMinutesToday = focusRecordPort != null
            ? focusRecordPort.sumProductiveFocusMinutesOnDate(userId, userToday, userZone)
            : 0;
        int remainingMinutesToday = Math.max(0, currentMinutesToday - deletedMinutesOnToday);
        boolean stillHasTaskToday = transactionPort != null
            && transactionPort.countCompletedTasksToday(userId, userZone) > 0;
        if (!stillHasTaskToday
            && remainingMinutesToday < FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES) {
          stats.revertTodayStreakIncrement(userToday);
        }
      }

      userPort.save(user);
    });
  }

  private static void revertTaskFocusMetrics(
      List<FocusRecord> records,
      TaskRepository taskPort) {
    if (taskPort == null) {
      return;
    }

    Map<UUID, TaskDelta> deltaByTaskId = new LinkedHashMap<>();
    for (FocusRecord record : records) {
      if (record.getTaskId().isEmpty()) {
        continue;
      }
      UUID taskId = record.getTaskId().get();
      int mins = Math.max(1, record.getDurationMinutes());
      int pomos = record.getCompletedPomos().orElse(0);
      deltaByTaskId.merge(taskId, new TaskDelta(mins, pomos), (a, b) -> a.add(b.minutes(), b.pomos()));
    }

    deltaByTaskId.forEach((taskId, delta) ->
        taskPort.findById(taskId).ifPresent(task -> {
          task.removeFocusSession(delta.minutes(), delta.pomos());
          taskPort.save(task);
        }));
  }
}
