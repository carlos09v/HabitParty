package com.habitparty.application.usecases.user;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;

/**
 * Regra unificada da Ofensiva Global:
 * um dia garante/mantém o streak quando o usuário conclui ao menos 1 tarefa
 * OU acumula pelo menos 30 minutos de foco produtivo no mesmo dia local.
 */
public final class GlobalStreakSupport {

  private GlobalStreakSupport() {}

  /**
   * Verifica se o usuário atingiu o mínimo de foco produtivo (>= 30m) em uma data local.
   */
  public static boolean hasQualifiedFocusOnDate(
      UUID userId,
      LocalDate targetDate,
      ZoneId userZone,
      FocusRecordRepository focusRecordPort) {
    if (focusRecordPort == null || userId == null) {
      return false;
    }
    int focusMinutes = focusRecordPort.sumProductiveFocusMinutesOnDate(userId, targetDate, userZone);
    return focusMinutes >= FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES;
  }

  /**
   * Verifica se o dia anterior cumpriu tarefa OU 30m de foco no fuso do usuário.
   */
  public static boolean hasQualifiedYesterday(
      UUID userId,
      ZoneId userZone,
      LocalDate today,
      TransactionHistoryRepository transactionPort,
      FocusRecordRepository focusRecordPort) {
    if (transactionPort != null && transactionPort.hasCompletedTasksYesterday(userId, userZone)) {
      return true;
    }
    LocalDate yesterday = (today != null ? today : LocalDate.now(userZone)).minusDays(1);
    return hasQualifiedFocusOnDate(userId, yesterday, userZone, focusRecordPort);
  }

  /**
   * Incrementa a ofensiva global hoje, zerando antes caso o usuário possuísse streak > 0
   * e não tenha cumprido os critérios completos ontem.
   */
  public static void incrementTodayStreakIfYesterdayVerified(
      User user,
      ZoneId userZone,
      LocalDate today,
      TransactionHistoryRepository transactionPort,
      FocusRecordRepository focusRecordPort) {
    if (user == null || today == null) {
      return;
    }
    LocalDate lastStreakDate = user.getLastStreakDate();
    if (lastStreakDate != null) {
      if (!today.isAfter(lastStreakDate)) {
        return;
      }
      if (lastStreakDate.isBefore(today.minusDays(1))) {
        user.resetStreak();
      }
      user.incrementStreakForDate(today);
      return;
    }

    if (user.getCurrentStreak() > 0
        && !hasQualifiedYesterday(user.getId(), userZone, today, transactionPort, focusRecordPort)) {
      user.resetStreak();
    }
    user.incrementStreakForDate(today);
  }

  /**
   * Verifica em lote quais usuários cumpriram (tarefa OU >= 30m de foco no mesmo dia local)
   * em algum dia a partir de `minLocalDateByUserId`.
   */
  public static Set<UUID> findQualifiedUsersSinceDates(
      Map<UUID, LocalDate> minLocalDateByUserId,
      Map<UUID, ZoneId> zoneByUserId,
      TransactionHistoryRepository transactionPort,
      FocusRecordRepository focusRecordPort,
      Clock clock) {
    if (minLocalDateByUserId == null || minLocalDateByUserId.isEmpty() || transactionPort == null) {
      return Set.of();
    }

    ZoneId fallbackZone = clock != null ? clock.getZone() : ZoneId.systemDefault();
    Map<UUID, LocalDateTime> cutoffByUserId = new HashMap<>(minLocalDateByUserId.size());
    LocalDateTime earliestCutoff = null;

    for (Map.Entry<UUID, LocalDate> entry : minLocalDateByUserId.entrySet()) {
      UUID userId = entry.getKey();
      LocalDate minLocalDate = entry.getValue();
      ZoneId userZone = zoneByUserId.getOrDefault(userId, fallbackZone);
      LocalDateTime userCutoff = minLocalDate.atTime(LocalTime.MIN)
          .atZone(userZone)
          .withZoneSameInstant(ZoneId.systemDefault())
          .toLocalDateTime();
      cutoffByUserId.put(userId, userCutoff);
      if (earliestCutoff == null || userCutoff.isBefore(earliestCutoff)) {
        earliestCutoff = userCutoff;
      }
    }

    List<UUID> userIds = List.copyOf(cutoffByUserId.keySet());
    if (focusRecordPort == null) {
      Map<UUID, LocalDateTime> lastCompletedByUser =
          transactionPort.findLastCompletedTaskAtByUserIds(userIds, earliestCutoff);
      if (lastCompletedByUser == null) {
        return Set.of();
      }
      Set<UUID> fallbackQualified = new HashSet<>();
      for (Map.Entry<UUID, LocalDateTime> entry : cutoffByUserId.entrySet()) {
        LocalDateTime lastCompleted = lastCompletedByUser.get(entry.getKey());
        if (lastCompleted != null && !lastCompleted.isBefore(entry.getValue())) {
          fallbackQualified.add(entry.getKey());
        }
      }
      return fallbackQualified;
    }

    Set<UUID> qualifiedUsers = new HashSet<>();

    List<TransactionHistoryRepository.TaskCompletionTimestamp> taskCompletions =
        transactionPort.findTaskCompletionsByUserIdsSince(userIds, earliestCutoff);
    if (taskCompletions != null) {
      for (TransactionHistoryRepository.TaskCompletionTimestamp tx : taskCompletions) {
        if (tx == null || tx.userId() == null || tx.createdAt() == null) {
          continue;
        }
        LocalDate minDate = minLocalDateByUserId.get(tx.userId());
        if (minDate == null) {
          continue;
        }
        ZoneId userZone = zoneByUserId.getOrDefault(tx.userId(), fallbackZone);
        LocalDate localDate = tx.createdAt()
            .atZone(ZoneId.systemDefault())
            .withZoneSameInstant(userZone)
            .toLocalDate();
        if (!localDate.isBefore(minDate)) {
          qualifiedUsers.add(tx.userId());
        }
      }
    }

    Map<UUID, Map<LocalDate, Integer>> focusMinutesByUserAndDate = new HashMap<>();
    List<FocusRecordRepository.FocusSessionSummary> focusSessions =
        focusRecordPort.findProductiveFocusSessionsByUserIdsSince(userIds, earliestCutoff);
    if (focusSessions != null) {
      for (FocusRecordRepository.FocusSessionSummary session : focusSessions) {
        if (session == null || session.userId() == null || session.endTime() == null
            || qualifiedUsers.contains(session.userId())) {
          continue;
        }
        LocalDate minDate = minLocalDateByUserId.get(session.userId());
        if (minDate == null) {
          continue;
        }
        ZoneId userZone = zoneByUserId.getOrDefault(session.userId(), fallbackZone);
        LocalDate localDate = session.endTime()
            .atZone(ZoneId.systemDefault())
            .withZoneSameInstant(userZone)
            .toLocalDate();
        if (!localDate.isBefore(minDate)) {
          int total = focusMinutesByUserAndDate
              .computeIfAbsent(session.userId(), unused -> new HashMap<>())
              .merge(localDate, Math.max(0, session.durationMinutes()), Integer::sum);
          if (total >= FocusRewardCalculator.MIN_DAILY_STREAK_FOCUS_MINUTES) {
            qualifiedUsers.add(session.userId());
          }
        }
      }
    }

    return qualifiedUsers;
  }
}
