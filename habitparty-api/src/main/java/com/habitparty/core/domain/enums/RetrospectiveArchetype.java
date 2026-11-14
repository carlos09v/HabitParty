package com.habitparty.core.domain.enums;

public enum RetrospectiveArchetype {
  DEEP_FOCUS_SAGE,
  STREAK_GUARDIAN,
  CHALLENGE_SEEKER,
  ARCHITECT,
  RISING_SPARK;

  /**
   * Calcula o arquétipo dominante do usuário na retrospectiva do ano com base no padrão real de métricas.
   */
  public static RetrospectiveArchetype resolve(
      int activeDays,
      int tasksCompleted,
      int hardTasksCompleted,
      int focusMinutes) {
    if (focusMinutes >= 1500 && focusMinutes >= tasksCompleted * 10) {
      return DEEP_FOCUS_SAGE;
    }
    if (tasksCompleted >= 20 && hardTasksCompleted * 3 >= tasksCompleted) {
      return CHALLENGE_SEEKER;
    }
    if (activeDays >= 60) {
      return STREAK_GUARDIAN;
    }
    if (tasksCompleted >= 40 && focusMinutes >= 480) {
      return ARCHITECT;
    }
    return RISING_SPARK;
  }
}
