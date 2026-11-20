package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.math.BigDecimal;

import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.enums.task.TaskType;

public record ShowcaseStatsResponseDTO(
    int currentStreak,
    int highestStreak,
    int highestTaskStreak,
    String highestTaskStreakTitle,
    TaskType highestTaskStreakType,
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
    int totalAchievementsCount,
    int unlockedArtifactsCount,
    int totalArtifactsCount) {

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
        maxPoints,
        0,
        0,
        0,
        null,
        null);
  }

  public static ShowcaseStatsResponseDTO fromDomain(
      UserStats stats,
      int effectiveStreak,
      int unlockedCount,
      int totalAchievements,
      int achievementPoints,
      int maxPoints) {
    return fromDomain(
        stats,
        effectiveStreak,
        unlockedCount,
        totalAchievements,
        achievementPoints,
        maxPoints,
        0,
        0,
        0,
        null,
        null);
  }

  public static ShowcaseStatsResponseDTO fromDomain(
      UserStats stats,
      int effectiveStreak,
      int unlockedCount,
      int totalAchievements,
      int achievementPoints,
      int maxPoints,
      int unlockedArtifactsCount,
      int totalArtifactsCount) {
    return fromDomain(
        stats,
        effectiveStreak,
        unlockedCount,
        totalAchievements,
        achievementPoints,
        maxPoints,
        unlockedArtifactsCount,
        totalArtifactsCount,
        0,
        null,
        null);
  }

  public static ShowcaseStatsResponseDTO fromDomain(
      UserStats stats,
      int effectiveStreak,
      int unlockedCount,
      int totalAchievements,
      int achievementPoints,
      int maxPoints,
      int unlockedArtifactsCount,
      int totalArtifactsCount,
      int highestTaskStreak,
      String highestTaskStreakTitle,
      TaskType highestTaskStreakType) {
    return new ShowcaseStatsResponseDTO(
        effectiveStreak,
        stats != null ? stats.getHighestStreak() : 0,
        Math.max(0, highestTaskStreak),
        highestTaskStreakTitle,
        highestTaskStreakType,
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
        totalAchievements,
        unlockedArtifactsCount,
        totalArtifactsCount);
  }
}
