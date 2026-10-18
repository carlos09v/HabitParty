package com.habitparty.core.domain.entities.task;

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
}
