package com.habitparty.core.domain.entities.focus;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.habitparty.core.domain.enums.FocusRecordType;

public final class FocusRewardCalculator {

  public static final int MIN_SESSION_MINUTES = 10;
  public static final int MAX_SESSION_MINUTES = 90;
  public static final int MIN_DAILY_STREAK_FOCUS_MINUTES = 30;
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

  private static final BigDecimal THIRTY = BigDecimal.valueOf(30);
  private static final BigDecimal SEVEN = BigDecimal.valueOf(7);
  private static final BigDecimal SIX = BigDecimal.valueOf(6);
  private static final BigDecimal STOPWATCH_COINS_PER_30 = new BigDecimal("0.45");
  private static final BigDecimal FALLBACK_POMO_COINS_PER_30 = new BigDecimal("0.30");
  private static final BigDecimal SHORT_POMO_XP = BigDecimal.valueOf(4);
  private static final BigDecimal SHORT_POMO_COINS = new BigDecimal("0.25");
  private static final BigDecimal STANDARD_POMO_XP = BigDecimal.valueOf(8);
  private static final BigDecimal STANDARD_POMO_COINS = new BigDecimal("0.50");
  private static final BigDecimal DEEP_POMO_XP = BigDecimal.valueOf(15);
  private static final BigDecimal DEEP_POMO_COINS = new BigDecimal("1.00");

  private record BaseReward(BigDecimal xpTimes30, BigDecimal coinsTimes30) {
    BaseReward add(BaseReward other) {
      return new BaseReward(this.xpTimes30.add(other.xpTimes30), this.coinsTimes30.add(other.coinsTimes30));
    }
  }

  private static BaseReward calculateStopwatchBase(int minutes) {
    BigDecimal mins = BigDecimal.valueOf(minutes);
    return new BaseReward(mins.multiply(SEVEN), mins.multiply(STOPWATCH_COINS_PER_30));
  }

  private static BaseReward calculatePomoCycleBase(int minutesPerPomo, int completedPomos, int totalPomoMinutes) {
    if (minutesPerPomo < 15) {
      // Anti-exploit: muitos pomos declarados para pouco tempo decorrido
      BigDecimal mins = BigDecimal.valueOf(totalPomoMinutes);
      return new BaseReward(mins.multiply(SIX), mins.multiply(FALLBACK_POMO_COINS_PER_30));
    }
    BigDecimal pomos = BigDecimal.valueOf(completedPomos);
    if (minutesPerPomo < 25) {
      // Pomodoro curto (15 a 24 min)
      return new BaseReward(
          pomos.multiply(SHORT_POMO_XP).multiply(THIRTY),
          pomos.multiply(SHORT_POMO_COINS).multiply(THIRTY));
    }
    if (minutesPerPomo < 50) {
      // Pomodoro padrão (25 a 49 min)
      return new BaseReward(
          pomos.multiply(STANDARD_POMO_XP).multiply(THIRTY),
          pomos.multiply(STANDARD_POMO_COINS).multiply(THIRTY));
    }
    // Pomodoro longo / Deep work (>= 50 min)
    return new BaseReward(
        pomos.multiply(DEEP_POMO_XP).multiply(THIRTY),
        pomos.multiply(DEEP_POMO_COINS).multiply(THIRTY));
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

    BaseReward baseReward;

    FocusRecordType type = record.getRecordType().orElse(FocusRecordType.STOPWATCH);
    Integer completedPomos = record.getCompletedPomos().orElse(0);
    Integer pomoTargetMinutes = record.getPomoTargetMinutes().orElse(null);

    if (type == FocusRecordType.POMO && completedPomos != null && completedPomos > 0) {
      long configuredPomoMinutesLong = pomoTargetMinutes != null && pomoTargetMinutes > 0
          ? (long) completedPomos * pomoTargetMinutes
          : -1L;
      if (configuredPomoMinutesLong > 0 && effectiveMinutes > configuredPomoMinutesLong) {
        // Mantém os ciclos Pomodoros travados na duração configurada e recompensa o excedente como Cronômetro Livre
        int configuredPomoMinutes = (int) configuredPomoMinutesLong;
        int overtimeMinutes = effectiveMinutes - configuredPomoMinutes;
        BaseReward pomoPart = calculatePomoCycleBase(pomoTargetMinutes, completedPomos, configuredPomoMinutes);
        BaseReward overtimePart = calculateStopwatchBase(overtimeMinutes);
        baseReward = pomoPart.add(overtimePart);
      } else {
        int minutesPerPomo = effectiveMinutes / completedPomos;
        baseReward = calculatePomoCycleBase(minutesPerPomo, completedPomos, effectiveMinutes);
      }
    } else if (type == FocusRecordType.POMO) {
      // Pomodoro com tempo válido >= 10m mas sem ciclo concluído formalmente
      BigDecimal mins = BigDecimal.valueOf(effectiveMinutes);
      baseReward = new BaseReward(mins.multiply(SIX), mins.multiply(FALLBACK_POMO_COINS_PER_30));
    } else {
      // STOPWATCH (Cronômetro Livre): ~7 XP e 0,45 moedas a cada bloco de 30 minutos
      baseReward = calculateStopwatchBase(effectiveMinutes);
    }

    // Trava 4: Rendimento Decrescente Diário em Escada (0-4h: 100%, 4h-6h: 50%, 6h-8h: 25%, >8h: 0%)
    // Cálculo racional exato em BigDecimal: (baseTimes30 * weightedMinutes) / (30 * effectiveMinutes)
    BigDecimal weightedMinutes = calculateWeightedSessionMinutes(priorFocusMinutesToday, effectiveMinutes);
    if (weightedMinutes.compareTo(BigDecimal.ZERO) <= 0) {
      return FocusReward.ZERO;
    }

    BigDecimal denominator = THIRTY.multiply(BigDecimal.valueOf(effectiveMinutes));
    int finalXp = baseReward.xpTimes30()
        .multiply(weightedMinutes)
        .divide(denominator, 0, RoundingMode.HALF_UP)
        .intValue();
    BigDecimal finalCoins = baseReward.coinsTimes30()
        .multiply(weightedMinutes)
        .divide(denominator, 2, RoundingMode.HALF_UP);

    return new FocusReward(finalXp, finalCoins);
  }

  private static BigDecimal calculateWeightedSessionMinutes(int priorMinutes, int sessionMinutes) {
    if (sessionMinutes <= 0) {
      return BigDecimal.ZERO;
    }
    int safePrior = Math.max(0, priorMinutes);
    if (safePrior >= DAILY_TIER3_MINUTES) {
      return BigDecimal.ZERO;
    }
    int sessionEnd = safePrior + sessionMinutes;
    if (sessionEnd <= DAILY_TIER1_MINUTES) {
      return BigDecimal.valueOf(sessionMinutes);
    }
    int tier1Minutes = Math.max(0, Math.min(sessionEnd, DAILY_TIER1_MINUTES) - safePrior);
    int tier2Minutes = Math.max(
        0,
        Math.min(sessionEnd, DAILY_TIER2_MINUTES) - Math.max(safePrior, DAILY_TIER1_MINUTES));
    int tier3Minutes = Math.max(
        0,
        Math.min(sessionEnd, DAILY_TIER3_MINUTES) - Math.max(safePrior, DAILY_TIER2_MINUTES));

    return BigDecimal.valueOf(tier1Minutes)
        .add(BigDecimal.valueOf(tier2Minutes).multiply(HALF_MULTIPLIER))
        .add(BigDecimal.valueOf(tier3Minutes).multiply(QUARTER_MULTIPLIER));
  }

  public static BigDecimal calculateDailyMultiplierDecimal(int priorMinutes, int sessionMinutes) {
    BigDecimal weightedSum = calculateWeightedSessionMinutes(priorMinutes, sessionMinutes);
    if (weightedSum.compareTo(BigDecimal.ZERO) <= 0) {
      return BigDecimal.ZERO;
    }
    if (weightedSum.compareTo(BigDecimal.valueOf(sessionMinutes)) == 0) {
      return BigDecimal.ONE;
    }
    return weightedSum.divide(BigDecimal.valueOf(sessionMinutes), 6, RoundingMode.HALF_UP);
  }

  public static double calculateDailyMultiplier(int priorMinutes, int sessionMinutes) {
    return calculateDailyMultiplierDecimal(priorMinutes, sessionMinutes).doubleValue();
  }
}
