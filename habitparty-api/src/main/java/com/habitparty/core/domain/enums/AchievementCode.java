package com.habitparty.core.domain.enums;

import java.util.Optional;

import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;

public enum AchievementCode {
  // Categoria 1: TASKS
  TASK_FIRST,
  TASK_10,
  TASK_50,
  TASK_100,
  TASK_250,
  TASK_500,
  TASK_1000,
  TASK_HARD_5,
  TASK_HARD_25,
  TASK_HARD_100,
  CHECKLIST_PERFECTIONIST,
  PUNCTUAL_EXECUTOR_20,

  // Categoria 2: STREAKS
  STREAK_3,
  STREAK_7,
  STREAK_14,
  STREAK_21,
  STREAK_30,
  STREAK_60,
  STREAK_90,
  STREAK_180,
  STREAK_365,
  IMPULSE_CONTROL_7,

  // Categoria 3: FOCUS
  FOCUS_FIRST,
  FOCUS_SESSIONS_10,
  FOCUS_DEEP_WORK,
  FOCUS_POMO_25,
  FOCUS_MARATHON_90,
  FOCUS_HOURS_10,
  FOCUS_ACTIVITY_GOAL_10,
  FOCUS_HOURS_50,
  FOCUS_POMO_100,
  FOCUS_HOURS_100,
  FOCUS_HOURS_200,

  // Categoria 4: ECONOMY
  GOLD_100,
  REWARD_FIRST,
  GOLD_500,
  REWARD_25,
  GOLD_1000,
  WALLET_SAVER_500,
  COUPON_MASTER,
  GOLD_5000,
  REWARD_100,
  GOLD_15000,

  // Categoria 5: PROGRESSION
  LEVEL_APPRENTICE,
  LEVEL_ADVENTURER,
  LEVEL_CHALLENGER,
  LEVEL_PROFESSIONAL,
  LEVEL_EXPERT,
  LEVEL_VETERAN,
  LEVEL_MASTER,
  LEVEL_LEGEND,

  // Categoria 6: SPECIAL
  SHOWCASE_CURATOR,
  SHOWCASE_FULL_SLOTS,
  WORKSPACE_ARCHITECT,
  TROPHY_HUNTER_1000,
  HARDCORE_FIRST,
  HARDCORE_SURVIVOR,
  HARDCORE_MASTER_50,
  MYSTERY_BOX_FIRST,
  MYSTERY_BOX_LUCK,
  MYSTERY_BOX_25,
  NIGHT_OWL,
  EARLY_BIRD;

  public static Optional<AchievementCode> fromString(String code) {
    if (code == null || code.isBlank()) {
      return Optional.empty();
    }
    try {
      return Optional.of(AchievementCode.valueOf(code.trim().toUpperCase()));
    } catch (IllegalArgumentException e) {
      return Optional.empty();
    }
  }

  /**
   * Conquistas "meta" dependem da pontuação de conquistas acumulada, que só é conhecida
   * ao final de uma rodada de avaliação. São reavaliadas em uma segunda passada.
   */
  public boolean dependsOnAchievementPoints() {
    return this == TROPHY_HUNTER_1000;
  }

  public int extractCurrentProgress(User user, boolean hasHighlights) {
    return extractCurrentProgress(user, hasHighlights ? 1 : 0);
  }

  public int extractCurrentProgress(User user, int highlightsCount) {
    if (user == null || user.getStats() == null) {
      return 0;
    }
    UserStats stats = user.getStats();
    int bestStreak = Math.max(stats.getCurrentStreak(), stats.getHighestStreak());
    int totalGoldInt = stats.getTotalGoldEarned() != null ? stats.getTotalGoldEarned().intValue() : 0;
    int walletInt = stats.getCurrentCoins() != null ? stats.getCurrentCoins().intValue() : 0;
    boolean hasHighlights = highlightsCount > 0;

    return switch (this) {
      case TASK_FIRST, TASK_10, TASK_50, TASK_100, TASK_250, TASK_500, TASK_1000 -> stats.getTotalTasksCompleted();
      case TASK_HARD_5, TASK_HARD_25, TASK_HARD_100 -> stats.getTotalHardTasksCompleted();
      case CHECKLIST_PERFECTIONIST -> stats.getTotalChecklistTasksCompleted();
      case PUNCTUAL_EXECUTOR_20 -> stats.getTotalOnTimeTodosCompleted();

      case STREAK_3, STREAK_7, STREAK_14, STREAK_21, STREAK_30, STREAK_60, STREAK_90, STREAK_180, STREAK_365 ->
          bestStreak;
      case IMPULSE_CONTROL_7 -> stats.getTotalCleanHabitCycles();

      case FOCUS_FIRST, FOCUS_SESSIONS_10 -> stats.getTotalFocusSessions();
      case FOCUS_DEEP_WORK, FOCUS_MARATHON_90 -> stats.getLongestFocusSessionMinutes();
      case FOCUS_POMO_25, FOCUS_POMO_100 -> stats.getTotalPomodorosCompleted();
      case FOCUS_HOURS_10, FOCUS_HOURS_50, FOCUS_HOURS_100, FOCUS_HOURS_200 -> stats.getTotalFocusMinutes();
      case FOCUS_ACTIVITY_GOAL_10 -> stats.getTotalActivityGoalsMet();

      case GOLD_100, GOLD_500, GOLD_1000, GOLD_5000, GOLD_15000 -> totalGoldInt;
      case WALLET_SAVER_500 -> walletInt;
      case REWARD_FIRST, REWARD_25, REWARD_100 -> stats.getTotalRewardsRedeemed();
      case COUPON_MASTER -> stats.getTotalCouponsDepleted();

      case LEVEL_APPRENTICE, LEVEL_ADVENTURER, LEVEL_CHALLENGER, LEVEL_PROFESSIONAL,
          LEVEL_EXPERT, LEVEL_VETERAN, LEVEL_MASTER, LEVEL_LEGEND -> stats.getTotalXp();

      case SHOWCASE_CURATOR -> (user.isFounder()
          || hasHighlights
          || user.getBio().isPresent()
          || !"none".equalsIgnoreCase(user.getAvatarFrame())) ? 1 : 0;
      case SHOWCASE_FULL_SLOTS -> highlightsCount;
      case WORKSPACE_ARCHITECT -> stats.getTotalWorkspacesCreated();
      case TROPHY_HUNTER_1000 -> stats.getAchievementPoints();
      case HARDCORE_FIRST, HARDCORE_SURVIVOR, HARDCORE_MASTER_50 -> stats.getTotalHardcoreTasksCompleted();
      case MYSTERY_BOX_FIRST, MYSTERY_BOX_LUCK, MYSTERY_BOX_25 -> stats.getTotalMysteryBoxesOpened();
      case NIGHT_OWL -> stats.getTotalNightFocusSessions();
      case EARLY_BIRD -> stats.getTotalEarlyFocusSessions();
    };
  }
}
