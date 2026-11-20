package com.habitparty.core.domain.entities.focus;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.habitparty.core.domain.enums.FocusRecordType;

public final class FocusRewardCalculator {

  public static final int MIN_SESSION_MINUTES = 10;
  public static final int MAX_SESSION_MINUTES = 90;
  public static final int DAILY_TIER1_MINUTES = 240; // Primeiras 4 horas: 100% de rendimento
  public static final int DAILY_TIER2_MINUTES = 360; // 4h a 6h: 50% de rendimento
  public static final int DAILY_TIER3_MINUTES = 480; // 6h a 8h: 25% de rendimento. Acima de 8h: 0%

  private static final BigDecimal HALF_MULTIPLIER = new BigDecimal("0.5");
  private static final BigDecimal QUARTER_MULTIPLIER = new BigDecimal("0.25");

  private FocusRewardCalculator() {}

  /**
   * Retorna os minutos efetivamente elegíveis a recompensa em uma sessão única:
   * sessões abaixo de {@link #MIN_SESSION_MINUTES} (10m) não pontuam e o máximo por sessão
   * é travado em {@link #MAX_SESSION_MINUTES} (90m), evitando dupla penalização na cota diária.
   */
  public static int calculateRewardableMinutes(int durationMinutes) {
    if (durationMinutes < MIN_SESSION_MINUTES) {
      return 0;
    }
    return Math.min(durationMinutes, MAX_SESSION_MINUTES);
  }

  private record BaseReward(double xp, BigDecimal coins) {}

  private static BaseReward calculateStopwatchBase(int minutes) {
    double xp = (minutes / 30.0) * 7.0;
    BigDecimal coins = BigDecimal.valueOf(minutes)
        .multiply(new BigDecimal("0.45"))
        .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
    return new BaseReward(xp, coins);
  }

  private static BaseReward calculatePomoCycleBase(int minutesPerPomo, int completedPomos, int totalPomoMinutes) {
    if (minutesPerPomo < 15) {
      // Anti-exploit: muitos pomos declarados para pouco tempo decorrido
      double xp = (totalPomoMinutes / 30.0) * 6.0;
      BigDecimal coins = BigDecimal.valueOf(totalPomoMinutes)
          .multiply(new BigDecimal("0.30"))
          .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
      return new BaseReward(xp, coins);
    }
    if (minutesPerPomo < 25) {
      // Pomodoro curto (15 a 24 min)
      return new BaseReward(
          completedPomos * 4.0,
          new BigDecimal("0.25").multiply(BigDecimal.valueOf(completedPomos)));
    }
    if (minutesPerPomo < 50) {
      // Pomodoro padrão (25 a 49 min)
      return new BaseReward(
          completedPomos * 8.0,
          new BigDecimal("0.50").multiply(BigDecimal.valueOf(completedPomos)));
    }
    // Pomodoro longo / Deep work (>= 50 min)
    return new BaseReward(
        completedPomos * 15.0,
        new BigDecimal("1.00").multiply(BigDecimal.valueOf(completedPomos)));
  }

  public static FocusReward calculate(FocusRecord record, int priorFocusMinutesToday) {
    if (record == null) {
      return FocusReward.ZERO;
    }

    // Trava 1: Se for uso de item de inventário (mochila/recompensa de lazer), NUNCA gera XP ou Moedas
    if (record.getInventoryItemId().isPresent()) {
      return FocusReward.ZERO;
    }

    int durationMinutes = record.getDurationMinutes();

    // Travas 2 e 3: Tempo mínimo de 10 minutos e teto único de 90 minutos (AFK)
    int effectiveMinutes = calculateRewardableMinutes(durationMinutes);
    if (effectiveMinutes <= 0) {
      return FocusReward.ZERO;
    }

    double baseXp;
    BigDecimal baseCoins;

    FocusRecordType type = record.getRecordType().orElse(FocusRecordType.STOPWATCH);
    Integer completedPomos = record.getCompletedPomos().orElse(0);
    Integer pomoTargetMinutes = record.getPomoTargetMinutes().orElse(null);

    if (type == FocusRecordType.POMO && completedPomos != null && completedPomos > 0) {
      if (pomoTargetMinutes != null && pomoTargetMinutes > 0 && effectiveMinutes > completedPomos * pomoTargetMinutes) {
        // Mantém os ciclos Pomodoros travados na duração configurada e recompensa o excedente como Cronômetro Livre
        int configuredPomoMinutes = completedPomos * pomoTargetMinutes;
        int overtimeMinutes = effectiveMinutes - configuredPomoMinutes;
        BaseReward pomoPart = calculatePomoCycleBase(pomoTargetMinutes, completedPomos, configuredPomoMinutes);
        BaseReward overtimePart = calculateStopwatchBase(overtimeMinutes);
        baseXp = pomoPart.xp() + overtimePart.xp();
        baseCoins = pomoPart.coins().add(overtimePart.coins());
      } else {
        int minutesPerPomo = effectiveMinutes / completedPomos;
        BaseReward pomoBase = calculatePomoCycleBase(minutesPerPomo, completedPomos, effectiveMinutes);
        baseXp = pomoBase.xp();
        baseCoins = pomoBase.coins();
      }
    } else if (type == FocusRecordType.POMO) {
      // Pomodoro com tempo válido >= 10m mas sem ciclo concluído formalmente
      baseXp = (effectiveMinutes / 30.0) * 6.0;
      baseCoins = BigDecimal.valueOf(effectiveMinutes)
          .multiply(new BigDecimal("0.30"))
          .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
    } else {
      // STOPWATCH (Cronômetro Livre): ~7 XP e 0,45 moedas a cada bloco de 30 minutos
      BaseReward stopwatchBase = calculateStopwatchBase(effectiveMinutes);
      baseXp = stopwatchBase.xp();
      baseCoins = stopwatchBase.coins();
    }

    // Trava 4: Rendimento Decrescente Diário em Escada (0-4h: 100%, 4h-6h: 50%, 6h-8h: 25%, >8h: 0%)
    BigDecimal multiplier = calculateDailyMultiplierDecimal(priorFocusMinutesToday, effectiveMinutes);

    if (multiplier.compareTo(BigDecimal.ZERO) <= 0) {
      return FocusReward.ZERO;
    }

    int finalXp = BigDecimal.valueOf(baseXp)
        .multiply(multiplier)
        .setScale(0, RoundingMode.HALF_UP)
        .intValue();
    BigDecimal finalCoins = baseCoins.multiply(multiplier)
        .setScale(2, RoundingMode.HALF_UP);

    return new FocusReward(finalXp, finalCoins);
  }

  public static BigDecimal calculateDailyMultiplierDecimal(int priorMinutes, int sessionMinutes) {
    if (sessionMinutes <= 0) {
      return BigDecimal.ZERO;
    }
    int safePrior = Math.max(0, priorMinutes);
    if (safePrior >= DAILY_TIER3_MINUTES) {
      return BigDecimal.ZERO; // Teto diário de 8h excedido
    }

    int sessionEnd = safePrior + sessionMinutes;
    if (sessionEnd <= DAILY_TIER1_MINUTES) {
      return BigDecimal.ONE;
    }

    int tier1Minutes = Math.max(0, Math.min(sessionEnd, DAILY_TIER1_MINUTES) - safePrior);
    int tier2Minutes = Math.max(
        0,
        Math.min(sessionEnd, DAILY_TIER2_MINUTES) - Math.max(safePrior, DAILY_TIER1_MINUTES));
    int tier3Minutes = Math.max(
        0,
        Math.min(sessionEnd, DAILY_TIER3_MINUTES) - Math.max(safePrior, DAILY_TIER2_MINUTES));

    BigDecimal weightedSum = BigDecimal.valueOf(tier1Minutes)
        .add(BigDecimal.valueOf(tier2Minutes).multiply(HALF_MULTIPLIER))
        .add(BigDecimal.valueOf(tier3Minutes).multiply(QUARTER_MULTIPLIER));
    return weightedSum.divide(BigDecimal.valueOf(sessionMinutes), 6, RoundingMode.HALF_UP);
  }

  public static double calculateDailyMultiplier(int priorMinutes, int sessionMinutes) {
    return calculateDailyMultiplierDecimal(priorMinutes, sessionMinutes).doubleValue();
  }
}
