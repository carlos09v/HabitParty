package com.habitparty.core.domain.entities.focus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Planejador puro de domínio para recalcular recompensas históricas de sessões de foco
 * em ordem cronológica por dia no fuso do usuário, aplicando apenas acréscimos positivos
 * para nunca reduzir XP ou moedas já conquistados sob regras anteriores.
 */
public final class FocusRewardRecalculationPlanner {

  public record RecordAdjustment(
      UUID recordId,
      int oldXp,
      int newXp,
      BigDecimal oldCoins,
      BigDecimal newCoins,
      int xpDelta,
      BigDecimal coinsDelta) {}

  public record UserRecalculationPlan(
      List<RecordAdjustment> adjustments,
      int totalXpDelta,
      BigDecimal totalCoinsDelta) {
    public boolean hasChanges() {
      return !adjustments.isEmpty();
    }
  }

  private FocusRewardRecalculationPlanner() {}

  public static UserRecalculationPlan planForUser(
      List<FocusRecord> records,
      ZoneId userZone,
      ZoneId storageZone) {
    if (records == null || records.isEmpty()) {
      return new UserRecalculationPlan(List.of(), 0, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    }

    ZoneId effectiveUserZone = userZone != null ? userZone : ZoneId.systemDefault();
    ZoneId effectiveStorageZone = storageZone != null ? storageZone : ZoneId.systemDefault();

    List<FocusRecord> sorted = records.stream()
        .filter(Objects::nonNull)
        .filter(r -> r.getInventoryItemId().isEmpty())
        .sorted(Comparator
            .comparing(FocusRecord::getStartTime)
            .thenComparing(FocusRecord::getEndTime)
            .thenComparing(r -> r.getId() != null ? r.getId().toString() : ""))
        .toList();

    Map<LocalDate, Integer> priorMinutesByDate = new HashMap<>();
    List<RecordAdjustment> adjustments = new ArrayList<>();
    int totalXpDelta = 0;
    BigDecimal totalCoinsDelta = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    for (FocusRecord record : sorted) {
      LocalDate sessionDate = record.getStartTime()
          .atZone(effectiveStorageZone)
          .withZoneSameInstant(effectiveUserZone)
          .toLocalDate();
      int priorMinutes = priorMinutesByDate.getOrDefault(sessionDate, 0);
      priorMinutesByDate.put(
          sessionDate,
          priorMinutes + FocusRewardCalculator.calculateRewardableMinutes(record.getDurationMinutes()));

      FocusReward recalculated = FocusRewardCalculator.calculate(record, priorMinutes);

      int oldXp = Math.max(0, record.getXpEarned().orElse(0));
      BigDecimal oldCoins = record.getCoinsEarned()
          .orElse(BigDecimal.ZERO)
          .setScale(2, RoundingMode.HALF_UP);

      int xpDelta = Math.max(0, recalculated.xp() - oldXp);
      BigDecimal coinsDelta = recalculated.coins()
          .subtract(oldCoins)
          .max(BigDecimal.ZERO)
          .setScale(2, RoundingMode.HALF_UP);

      if (xpDelta > 0 || coinsDelta.compareTo(BigDecimal.ZERO) > 0) {
        int newXp = oldXp + xpDelta;
        BigDecimal newCoins = oldCoins.add(coinsDelta).setScale(2, RoundingMode.HALF_UP);
        adjustments.add(new RecordAdjustment(
            record.getId(),
            oldXp,
            newXp,
            oldCoins,
            newCoins,
            xpDelta,
            coinsDelta));
        totalXpDelta += xpDelta;
        totalCoinsDelta = totalCoinsDelta.add(coinsDelta).setScale(2, RoundingMode.HALF_UP);
      }
    }

    return new UserRecalculationPlan(adjustments, totalXpDelta, totalCoinsDelta);
  }
}
