package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.time.Duration;
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
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.focus.FocusRecord;

/**
 * Helper compartilhado para estornar impactos econômicos, estatísticos e de metas
 * antes de excluir registros de foco (individualmente ou em lote por atividade/tarefa).
 */
public final class FocusRecordReversalSupport {

  private record TaskDelta(int minutes, int pomos) {
    TaskDelta add(int addMinutes, int addPomos) {
      return new TaskDelta(this.minutes + addMinutes, this.pomos + addPomos);
    }
  }

  private FocusRecordReversalSupport() {}

  /**
   * Estorna tempo de cupons, XP/moedas/estatísticas em {@link UserStats} (incluindo recorde de duração e
   * sessões por período do dia) e métricas acumuladas nas tarefas vinculadas.
   */
  public static void revertDeletedRecords(
      UUID userId,
      List<FocusRecord> recordsToDelete,
      FocusRecordRepository focusRecordPort,
      UserRepository userPort,
      InventoryItemRepository inventoryItemPort,
      TaskRepository taskPort) {
    if (recordsToDelete == null || recordsToDelete.isEmpty()) {
      return;
    }

    revertInventoryCoupons(recordsToDelete, inventoryItemPort);
    revertProductiveUserStats(userId, recordsToDelete, focusRecordPort, userPort);
    revertTaskFocusMetrics(recordsToDelete, taskPort);
  }

  private static void revertInventoryCoupons(
      List<FocusRecord> records,
      InventoryItemRepository inventoryItemPort) {
    if (inventoryItemPort == null) {
      return;
    }
    Map<UUID, Integer> secondsByItemId = new LinkedHashMap<>();
    for (FocusRecord record : records) {
      if (record.getInventoryItemId().isEmpty()) {
        continue;
      }
      UUID itemId = record.getInventoryItemId().get();
      int secondsToRefund = resolveRefundSeconds(record);
      if (secondsToRefund > 0) {
        secondsByItemId.merge(itemId, secondsToRefund, Integer::sum);
      }
    }

    secondsByItemId.forEach((itemId, totalSeconds) ->
        inventoryItemPort.findById(itemId).ifPresent(item -> {
          item.refundSeconds(totalSeconds);
          inventoryItemPort.save(item);
        }));
  }

  private static int resolveRefundSeconds(FocusRecord record) {
    long durationSeconds = Duration.between(record.getStartTime(), record.getEndTime()).toSeconds();
    if (durationSeconds > 0) {
      return (int) Math.min(Integer.MAX_VALUE, durationSeconds);
    }
    return Math.max(0, record.getDurationMinutes() * 60);
  }

  private static void revertProductiveUserStats(
      UUID userId,
      List<FocusRecord> records,
      FocusRecordRepository focusRecordPort,
      UserRepository userPort) {
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
          || record.getDurationMinutes() >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS
          || record.getCompletedPomos().orElse(0) > 0;
      if (hasImpact) {
        qualifyingRecords.add(record);
      }
    }

    if (qualifyingRecords.isEmpty()) {
      return;
    }

    userPort.findById(userId).ifPresent(user -> {
      UserStats stats = user.getStats();
      if (stats == null) {
        return;
      }

      ZoneId userZone = user.resolveZoneId(ZoneId.systemDefault());
      int maxDurationReverted = 0;
      List<UUID> productiveRecordIds = new ArrayList<>(qualifyingRecords.size());

      for (FocusRecord record : qualifyingRecords) {
        int xpToRevert = record.getXpEarned().orElse(0);
        BigDecimal coinsToRevert = record.getCoinsEarned().orElse(BigDecimal.ZERO);
        int minsToRevert = record.getDurationMinutes();
        int pomosToRevert = record.getCompletedPomos().orElse(0);

        stats.revertFocusSession(xpToRevert, coinsToRevert, minsToRevert, pomosToRevert);

        if (minsToRevert >= UserStats.MIN_FOCUS_MINUTES_FOR_STATS) {
          LocalDateTime userStartTime = record.getStartTime()
              .atZone(ZoneId.systemDefault())
              .withZoneSameInstant(userZone)
              .toLocalDateTime();
          LocalDateTime userEndTime = record.getEndTime()
              .atZone(ZoneId.systemDefault())
              .withZoneSameInstant(userZone)
              .toLocalDateTime();
          stats.revertFocusTimeOfDay(userStartTime, userEndTime, minsToRevert);
          maxDurationReverted = Math.max(maxDurationReverted, minsToRevert);
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
