package com.habitparty.application.usecases.focus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FocusRecordRepository.FocusAnalyticsEntry;
import com.habitparty.application.usecases.common.UtcDateTimeMapper;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;

/**
 * Calcula métricas agregadas completas de Foco (Hoje, Total, Ofensiva, Rendimento Diário e mapa diário
 * para o gráfico semanal) em uma única consulta enxuta, eliminando o limite de janela parcial no cliente.
 */
@Service
@Transactional(readOnly = true)
public class GetFocusSummaryUseCase {

  public record FocusSummaryResult(
      int todayRecordsCount,
      int totalRecordsCount,
      int activeStreakDays,
      int totalActiveDays,
      int todayXp,
      int totalXp,
      BigDecimal todayGold,
      BigDecimal totalGold,
      int todayFocusMinutes,
      int totalFocusMinutes,
      int todayPomosCount,
      int totalPomosCount,
      int todayAverageMinutes,
      int totalAverageMinutes,
      int globalTodayProductiveMinutes,
      int globalTodayRewardableMinutes,
      Map<UUID, Integer> todayDurationByActivityId,
      Map<String, Integer> dailyMinutes) {}

  private final FocusRecordRepository focusRecordPort;
  private final UserTimeResolver userTimeResolver;

  public GetFocusSummaryUseCase(
      FocusRecordRepository focusRecordPort,
      UserTimeResolver userTimeResolver) {
    this.focusRecordPort = focusRecordPort;
    this.userTimeResolver = userTimeResolver;
  }

  public FocusSummaryResult execute(UUID userIdLogado, UUID activityIdFilter) {
    ZoneId userZone = userTimeResolver.resolveZone(userIdLogado);
    ZoneId serverZone = userTimeResolver.clock().getZone();
    LocalDate today = LocalDate.now(userTimeResolver.clock().withZone(userZone));
    LocalDate yesterday = today.minusDays(1);

    List<FocusAnalyticsEntry> entries =
        focusRecordPort.findProductiveAnalyticsEntriesByUserId(userIdLogado);

    int todayCount = 0;
    int totalCount = 0;
    int todayMinutes = 0;
    int totalMinutes = 0;
    int todayPomos = 0;
    int totalPomos = 0;
    int todayXp = 0;
    int totalXp = 0;
    BigDecimal todayGold = BigDecimal.ZERO;
    BigDecimal totalGold = BigDecimal.ZERO;

    int globalTodayProductiveMinutes = 0;
    int globalTodayRewardableMinutes = 0;
    Map<UUID, Integer> todayDurationByActivityId = new HashMap<>();
    Map<String, Integer> dailyMinutes = new TreeMap<>();
    Set<LocalDate> activeDates = new HashSet<>();

    for (FocusAnalyticsEntry entry : entries) {
      if (entry.endTime() == null || entry.durationMinutes() <= 0) {
        continue;
      }

      LocalDate recordDate = UtcDateTimeMapper.toUserOffsetDateTime(
          entry.endTime(), userZone, serverZone).toLocalDate();
      int mins = entry.durationMinutes();
      boolean isToday = recordDate.equals(today);

      if (isToday) {
        globalTodayProductiveMinutes += mins;
        globalTodayRewardableMinutes += FocusRewardCalculator.calculateRewardableMinutes(mins);
        if (entry.focusActivityId() != null) {
          todayDurationByActivityId.merge(entry.focusActivityId(), mins, Integer::sum);
        }
      }

      if (activityIdFilter != null && !activityIdFilter.equals(entry.focusActivityId())) {
        continue;
      }

      int pomos = Math.max(0, entry.completedPomos());
      int xp = Math.max(0, entry.xpEarned());
      BigDecimal coins = entry.coinsEarned() != null ? entry.coinsEarned() : BigDecimal.ZERO;

      totalCount++;
      totalMinutes += mins;
      totalPomos += pomos;
      totalXp += xp;
      totalGold = totalGold.add(coins);
      activeDates.add(recordDate);
      dailyMinutes.merge(recordDate.toString(), mins, Integer::sum);

      if (isToday) {
        todayCount++;
        todayMinutes += mins;
        todayPomos += pomos;
        todayXp += xp;
        todayGold = todayGold.add(coins);
      }
    }

    int activeStreakDays = calculateConsecutiveStreak(activeDates, today, yesterday);
    int todayAverageMinutes = todayCount > 0 ? (int) Math.round((double) todayMinutes / todayCount) : 0;
    int totalAverageMinutes = totalCount > 0 ? (int) Math.round((double) totalMinutes / totalCount) : 0;

    return new FocusSummaryResult(
        todayCount,
        totalCount,
        activeStreakDays,
        activeDates.size(),
        todayXp,
        totalXp,
        todayGold.setScale(2, RoundingMode.HALF_UP),
        totalGold.setScale(2, RoundingMode.HALF_UP),
        todayMinutes,
        totalMinutes,
        todayPomos,
        totalPomos,
        todayAverageMinutes,
        totalAverageMinutes,
        globalTodayProductiveMinutes,
        globalTodayRewardableMinutes,
        Map.copyOf(todayDurationByActivityId),
        Map.copyOf(dailyMinutes));
  }

  private static int calculateConsecutiveStreak(
      Set<LocalDate> activeDates,
      LocalDate today,
      LocalDate yesterday) {
    if (activeDates.isEmpty()) {
      return 0;
    }
    LocalDate cursor = activeDates.contains(today)
        ? today
        : activeDates.contains(yesterday) ? yesterday : null;
    if (cursor == null) {
      return 0;
    }

    int streak = 0;
    while (activeDates.contains(cursor)) {
      streak++;
      cursor = cursor.minusDays(1);
    }
    return streak;
  }
}
