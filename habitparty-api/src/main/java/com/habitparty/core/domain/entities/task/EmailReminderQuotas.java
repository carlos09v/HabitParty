package com.habitparty.core.domain.entities.task;

import com.habitparty.core.exceptions.DomainValidationException;

public final class EmailReminderQuotas {

  private EmailReminderQuotas() {}

  // Free Tier
  public static final int FREE_MAX_ACTIVE_REMINDERS = 5;
  public static final int FREE_MAX_MONTHLY_DISPATCHES = 20;

  // Premium Tier (Política de Uso Justo / Fair Use)
  public static final int PREMIUM_MAX_ACTIVE_REMINDERS = 30;
  public static final int PREMIUM_MAX_MONTHLY_DISPATCHES = 100;

  public static int getMaxActiveReminders(boolean isPremium) {
    return isPremium ? PREMIUM_MAX_ACTIVE_REMINDERS : FREE_MAX_ACTIVE_REMINDERS;
  }

  public static int getMaxMonthlyDispatches(boolean isPremium) {
    return isPremium ? PREMIUM_MAX_MONTHLY_DISPATCHES : FREE_MAX_MONTHLY_DISPATCHES;
  }

  public static void validateActiveRemindersQuota(boolean isPremium, long activeReminders) {
    int maxActive = getMaxActiveReminders(isPremium);
    if (activeReminders >= maxActive) {
      String msg = isPremium
          ? "Limite de lembretes ativos atingido! Usuários Premium podem ter no máximo " + maxActive + " lembretes por e-mail ativos simultaneamente (Política de Uso Justo)."
          : "Limite de lembretes atingido! Usuários do plano gratuito podem ter no máximo " + maxActive + " lembretes por e-mail ativos simultaneamente. Assine o plano Premium para ter até " + PREMIUM_MAX_ACTIVE_REMINDERS + " lembretes ativos.";
      throw new DomainValidationException(msg);
    }
  }

  public static void validateMonthlyDispatchesQuota(boolean isPremium, long sentThisMonth) {
    int maxMonthly = getMaxMonthlyDispatches(isPremium);
    if (sentThisMonth >= maxMonthly) {
      String msg = isPremium
          ? "Cota mensal atingida! Usuários Premium podem receber no máximo " + maxMonthly + " lembretes por e-mail por mês (Política de Uso Justo)."
          : "Limite mensal atingido! Usuários do plano gratuito podem receber no máximo " + maxMonthly + " lembretes por e-mail por mês. Faça upgrade para o plano Premium para ter até " + PREMIUM_MAX_MONTHLY_DISPATCHES + " disparos mensais.";
      throw new DomainValidationException(msg);
    }
  }
}
