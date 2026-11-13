package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.math.BigDecimal;

import com.habitparty.core.domain.entities.UserStats;

public record ShowcaseStatsResponseDTO(
    int currentStreak,
    int highestStreak,
    int totalTasksCompleted,
    int totalHardTasksCompleted,
    int totalHardcoreTasksCompleted,
    int totalFocusMinutes,
    int totalFocusSessions,
    int longestFocusSessionMinutes,
    int totalPomodorosCompleted,
    int totalRewardsRedeemed,
    int totalMysteryBoxesOpened,
    int totalXp,
    BigDecimal totalGoldEarned,
    int achievementPoints,
    int maxAchievementPoints,
    int unlockedAchievementsCount,
    int totalAchievementsCount) {

  public static ShowcaseStatsResponseDTO fromDomain(
      UserStats stats,
      int unlockedCount,
      int totalAchievements,
      int achievementPoints,
      int maxPoints) {
    return fromDomain(
        stats,
        stats != null ? stats.getCurrentStreak() : 0,
        unlockedCount,
        totalAchievements,
        achievementPoints,
        maxPoints);
  }

  public static ShowcaseStatsResponseDTO fromDomain(
      UserStats stats,
      int effectiveStreak,
      int unlockedCount,
      int totalAchievements,
      int achievementPoints,
      int maxPoints) {
    return new ShowcaseStatsResponseDTO(
        effectiveStreak,
        stats != null ? stats.getHighestStreak() : 0,
        stats != null ? stats.getTotalTasksCompleted() : 0,
        stats != null ? stats.getTotalHardTasksCompleted() : 0,
        stats != null ? stats.getTotalHardcoreTasksCompleted() : 0,
        stats != null ? stats.getTotalFocusMinutes() : 0,
        stats != null ? stats.getTotalFocusSessions() : 0,
        stats != null ? stats.getLongestFocusSessionMinutes() : 0,
        stats != null ? stats.getTotalPomodorosCompleted() : 0,
        stats != null ? stats.getTotalRewardsRedeemed() : 0,
        stats != null ? stats.getTotalMysteryBoxesOpened() : 0,
        stats != null ? stats.getTotalXp() : 0,
        stats != null && stats.getTotalGoldEarned() != null ? stats.getTotalGoldEarned() : BigDecimal.ZERO,
        achievementPoints,
        maxPoints,
        unlockedCount,
        totalAchievements);
  }
}
