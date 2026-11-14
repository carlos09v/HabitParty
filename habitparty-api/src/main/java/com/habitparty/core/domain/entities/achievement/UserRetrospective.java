package com.habitparty.core.domain.entities.achievement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.habitparty.core.domain.enums.RetrospectiveArchetype;

/**
 * Agregado de leitura da Retrospectiva Anual do usuário, com regras puras de elegibilidade
 * e janela sazonal (20/dez do ano Y até 31/jan do ano Y+1).
 */
public record UserRetrospective(
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

  public static final int MIN_ACTIVE_DAYS = 5;
  public static final int MIN_TASKS_COMPLETED = 10;
  public static final int MIN_FOCUS_MINUTES = 120;
  public static final int MIN_CRITERIA_REQUIRED = 2;

  public static int countCriteriaMet(int activeDays, int tasksCompleted, int focusMinutes) {
    int count = 0;
    if (activeDays >= MIN_ACTIVE_DAYS) {
      count++;
    }
    if (tasksCompleted >= MIN_TASKS_COMPLETED) {
      count++;
    }
    if (focusMinutes >= MIN_FOCUS_MINUTES) {
      count++;
    }
    return count;
  }

  public static boolean isEligibleForMetrics(int activeDays, int tasksCompleted, int focusMinutes) {
    return countCriteriaMet(activeDays, tasksCompleted, focusMinutes) >= MIN_CRITERIA_REQUIRED;
  }

  /**
   * Janela de destaque sazonal para o ano Y: 20 de dezembro de Y até 31 de janeiro de Y+1.
   */
  public static boolean isInSeasonalWindow(LocalDate userToday, int targetYear) {
    if (userToday == null) {
      return false;
    }
    LocalDate start = LocalDate.of(targetYear, 12, 20);
    LocalDate end = LocalDate.of(targetYear + 1, 1, 31);
    return !userToday.isBefore(start) && !userToday.isAfter(end);
  }

  /**
   * A partir de 20/dez, a retrospectiva padrão em destaque já é a do ano corrente;
   * no restante do ano, aponta para o último ano concluído.
   */
  public static int resolveDefaultTargetYear(LocalDate userToday) {
    if (userToday == null) {
      return LocalDate.now().getYear() - 1;
    }
    if (userToday.getMonthValue() == 12 && userToday.getDayOfMonth() >= 20) {
      return userToday.getYear();
    }
    return userToday.getYear() - 1;
  }
}
