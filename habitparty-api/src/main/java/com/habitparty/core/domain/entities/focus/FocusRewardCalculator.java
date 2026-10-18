package com.habitparty.core.domain.entities.focus;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.habitparty.core.domain.enums.FocusRecordType;

public final class FocusRewardCalculator {

  public static final int MIN_SESSION_MINUTES = 10;
  public static final int MAX_SESSION_MINUTES = 90;
  public static final int DAILY_TIER1_MINUTES = 240; // Primeiras 4 horas: 100% de rendimento
  public static final int DAILY_TIER2_MINUTES = 360; // 4h a 6h: 50% de rendimento (fadiga). Acima de 6h: 0%

  private FocusRewardCalculator() {}

  public static FocusReward calculate(FocusRecord record, int priorFocusMinutesToday) {
    if (record == null) {
      return FocusReward.ZERO;
    }

    // Trava 1: Se for uso de item de inventário (mochila/recompensa de lazer), NUNCA gera XP ou Moedas
    if (record.getInventoryItemId().isPresent()) {
      return FocusReward.ZERO;
    }

    int durationMinutes = record.getDurationMinutes();

    // Trava 2: Tempo mínimo de 10 minutos para qualificar para recompensa
    if (durationMinutes < MIN_SESSION_MINUTES) {
      return FocusReward.ZERO;
    }

    // Trava 3: Teto por sessão única (máximo 90 minutos para conter esquecimento / AFK)
    int effectiveMinutes = Math.min(durationMinutes, MAX_SESSION_MINUTES);

    double baseXp;
    BigDecimal baseCoins;

    FocusRecordType type = record.getRecordType().orElse(FocusRecordType.STOPWATCH);
    Integer completedPomos = record.getCompletedPomos().orElse(0);

    if (type == FocusRecordType.POMO && completedPomos != null && completedPomos > 0) {
      int minutesPerPomo = effectiveMinutes / completedPomos;

      if (minutesPerPomo < 15) {
        // Anti-exploit: muitos pomos declarados para pouco tempo decorrido
        baseXp = (effectiveMinutes / 30.0) * 6.0;
        baseCoins = BigDecimal.valueOf(effectiveMinutes)
            .multiply(new BigDecimal("0.15"))
            .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
      } else if (minutesPerPomo < 25) {
        // Pomodoro curto (15 a 24 min)
        baseXp = completedPomos * 4.0;
        baseCoins = new BigDecimal("0.10").multiply(BigDecimal.valueOf(completedPomos));
      } else if (minutesPerPomo <= 40) {
        // Pomodoro padrão (25 a 40 min)
        baseXp = completedPomos * 8.0;
        baseCoins = new BigDecimal("0.25").multiply(BigDecimal.valueOf(completedPomos));
      } else {
        // Pomodoro longo / Deep work (> 40 min)
        baseXp = completedPomos * 15.0;
        baseCoins = new BigDecimal("0.50").multiply(BigDecimal.valueOf(completedPomos));
      }
    } else if (type == FocusRecordType.POMO) {
      // Pomodoro com tempo válido >= 10m mas sem ciclo concluído formalmente
      baseXp = (effectiveMinutes / 30.0) * 6.0;
      baseCoins = BigDecimal.valueOf(effectiveMinutes)
          .multiply(new BigDecimal("0.15"))
          .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
    } else {
      // STOPWATCH (Cronômetro Livre): ~7 XP e 0,20 moedas a cada bloco de 30 minutos
      baseXp = (effectiveMinutes / 30.0) * 7.0;
      baseCoins = BigDecimal.valueOf(effectiveMinutes)
          .multiply(new BigDecimal("0.20"))
          .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
    }

    // Trava 4: Rendimento Decrescente Diário (Daily Soft Cap)
    double multiplier = calculateDailyMultiplier(priorFocusMinutesToday, effectiveMinutes);

    if (multiplier <= 0.0) {
      return FocusReward.ZERO;
    }

    int finalXp = (int) Math.round(baseXp * multiplier);
    BigDecimal finalCoins = baseCoins.multiply(BigDecimal.valueOf(multiplier))
        .setScale(2, RoundingMode.HALF_UP);

    return new FocusReward(finalXp, finalCoins);
  }

  public static double calculateDailyMultiplier(int priorMinutes, int sessionMinutes) {
    if (sessionMinutes <= 0) {
      return 0.0;
    }
    int safePrior = Math.max(0, priorMinutes);
    if (safePrior >= DAILY_TIER2_MINUTES) {
      return 0.0; // Teto diário de 6h excedido
    }

    int endMinutes = safePrior + sessionMinutes;

    // Caso 1: Sessão inteira dentro da Faixa 1 (até 240 min)
    if (endMinutes <= DAILY_TIER1_MINUTES) {
      return 1.0;
    }

    // Caso 2: Sessão começou após a Faixa 1 (>= 240 min)
    if (safePrior >= DAILY_TIER1_MINUTES) {
      if (endMinutes <= DAILY_TIER2_MINUTES) {
        return 0.5;
      }
      int tier2Minutes = DAILY_TIER2_MINUTES - safePrior;
      return (tier2Minutes * 0.5) / sessionMinutes;
    }

    // Caso 3: Sessão cruza a fronteira de 240 min
    int tier1Minutes = DAILY_TIER1_MINUTES - safePrior;
    int remaining = sessionMinutes - tier1Minutes;
    int tier2Minutes = Math.min(remaining, DAILY_TIER2_MINUTES - DAILY_TIER1_MINUTES);

    double weightedSum = (tier1Minutes * 1.0) + (tier2Minutes * 0.5);
    return weightedSum / sessionMinutes;
  }
}
