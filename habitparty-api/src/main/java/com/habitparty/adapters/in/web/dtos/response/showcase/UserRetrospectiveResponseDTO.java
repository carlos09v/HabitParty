package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.math.BigDecimal;
import java.util.List;

import com.habitparty.core.domain.entities.achievement.UserRetrospective;
import com.habitparty.core.domain.enums.RetrospectiveArchetype;

public record UserRetrospectiveResponseDTO(
    int year,
    String timezone,
    boolean eligible,
    boolean inSeasonalWindow,
    int criteriaMet,
    int criteriaRequired,
    int minActiveDaysRequired,
    int minTasksRequired,
    int minFocusMinutesRequired,
    int activeDays,
    int tasksCompleted,
    int hardTasksCompleted,
    int focusMinutes,
    int focusSessionsCount,
    int pomodorosCompleted,
    int xpEarned,
    BigDecimal coinsEarned,
    int achievementsUnlockedCount,
    Integer bestMonth,
    int bestMonthTasksCount,
    String rarestAchievementCode,
    String rarestAchievementTitle,
    String rarestAchievementRarity,
    RetrospectiveArchetype archetype,
    List<Integer> availableYears) {

  public static UserRetrospectiveResponseDTO fromDomain(UserRetrospective r) {
    return new UserRetrospectiveResponseDTO(
        r.year(),
        r.timezone(),
        r.eligible(),
        r.inSeasonalWindow(),
        r.criteriaMet(),
        r.criteriaRequired(),
        r.minActiveDaysRequired(),
        r.minTasksRequired(),
        r.minFocusMinutesRequired(),
        r.activeDays(),
        r.tasksCompleted(),
        r.hardTasksCompleted(),
        r.focusMinutes(),
        r.focusSessionsCount(),
        r.pomodorosCompleted(),
        r.xpEarned(),
        r.coinsEarned(),
        r.achievementsUnlockedCount(),
        r.bestMonth(),
        r.bestMonthTasksCount(),
        r.rarestAchievementCode(),
        r.rarestAchievementTitle(),
        r.rarestAchievementRarity(),
        r.archetype(),
        r.availableYears());
  }
}
