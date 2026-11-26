package com.habitparty.core.domain.entities.user;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.habitparty.core.exceptions.DomainValidationException;

/**
 * Value Object imutável com as preferências coletadas no onboarding FirstStep.
 */
public record OnboardingPreferences(
    String usageMode,
    List<String> primaryGoals,
    String mainObstacle,
    Integer dailyFocusGoalMinutes,
    String peakPeriod,
    String disciplineStyle) {

  public static final OnboardingPreferences EMPTY =
      new OnboardingPreferences(null, null, null, null, null, null);

  private static final Set<String> VALID_USAGE_MODES = Set.of("personal", "studies", "work", "all");
  private static final Set<String> VALID_PEAK_PERIODS = Set.of("morning", "afternoon", "night");
  private static final Set<String> VALID_DISCIPLINE_STYLES = Set.of("flexible", "strict");

  public OnboardingPreferences {
    primaryGoals = primaryGoals != null ? List.copyOf(primaryGoals) : null;
  }

  public OnboardingPreferences update(
      String newUsageMode,
      List<String> newPrimaryGoals,
      String newMainObstacle,
      Integer newDailyFocusGoalMinutes,
      String newPeakPeriod,
      String newDisciplineStyle) {
    String resolvedUsageMode = this.usageMode;
    if (newUsageMode != null && !newUsageMode.isBlank()) {
      String normalized = newUsageMode.trim().toLowerCase(Locale.ROOT);
      if (!VALID_USAGE_MODES.contains(normalized)) {
        throw new DomainValidationException("Modo de uso inválido: " + newUsageMode);
      }
      resolvedUsageMode = normalized;
    }

    List<String> resolvedPrimaryGoals = this.primaryGoals;
    if (newPrimaryGoals != null) {
      resolvedPrimaryGoals = newPrimaryGoals.stream()
          .filter(goal -> goal != null && !goal.isBlank())
          .map(goal -> goal.trim().toLowerCase(Locale.ROOT))
          .map(goal -> goal.length() > 40 ? goal.substring(0, 40) : goal)
          .distinct()
          .limit(3)
          .toList();
    }

    String resolvedMainObstacle = this.mainObstacle;
    if (newMainObstacle != null && !newMainObstacle.isBlank()) {
      String cleaned = newMainObstacle.trim().toLowerCase(Locale.ROOT);
      if (cleaned.length() > 30) {
        throw new DomainValidationException("Obstáculo principal deve ter até 30 caracteres.");
      }
      resolvedMainObstacle = cleaned;
    }

    Integer resolvedDailyFocusGoalMinutes = this.dailyFocusGoalMinutes;
    if (newDailyFocusGoalMinutes != null) {
      if (newDailyFocusGoalMinutes < 15 || newDailyFocusGoalMinutes > 720) {
        throw new DomainValidationException("Meta diária de foco deve ficar entre 15 e 720 minutos.");
      }
      resolvedDailyFocusGoalMinutes = newDailyFocusGoalMinutes;
    }

    String resolvedPeakPeriod = this.peakPeriod;
    if (newPeakPeriod != null && !newPeakPeriod.isBlank()) {
      String normalized = newPeakPeriod.trim().toLowerCase(Locale.ROOT);
      if (!VALID_PEAK_PERIODS.contains(normalized)) {
        throw new DomainValidationException("Período de pico inválido: " + newPeakPeriod);
      }
      resolvedPeakPeriod = normalized;
    }

    String resolvedDisciplineStyle = this.disciplineStyle;
    if (newDisciplineStyle != null && !newDisciplineStyle.isBlank()) {
      String normalized = newDisciplineStyle.trim().toLowerCase(Locale.ROOT);
      if (!VALID_DISCIPLINE_STYLES.contains(normalized)) {
        throw new DomainValidationException("Estilo de disciplina inválido: " + newDisciplineStyle);
      }
      resolvedDisciplineStyle = normalized;
    }

    return new OnboardingPreferences(
        resolvedUsageMode,
        resolvedPrimaryGoals,
        resolvedMainObstacle,
        resolvedDailyFocusGoalMinutes,
        resolvedPeakPeriod,
        resolvedDisciplineStyle);
  }

  public OnboardingPreferences withUsageMode(String value) {
    return new OnboardingPreferences(value, primaryGoals, mainObstacle, dailyFocusGoalMinutes, peakPeriod, disciplineStyle);
  }

  public OnboardingPreferences withPrimaryGoals(List<String> value) {
    return new OnboardingPreferences(usageMode, value, mainObstacle, dailyFocusGoalMinutes, peakPeriod, disciplineStyle);
  }

  public OnboardingPreferences withMainObstacle(String value) {
    return new OnboardingPreferences(usageMode, primaryGoals, value, dailyFocusGoalMinutes, peakPeriod, disciplineStyle);
  }

  public OnboardingPreferences withDailyFocusGoalMinutes(Integer value) {
    return new OnboardingPreferences(usageMode, primaryGoals, mainObstacle, value, peakPeriod, disciplineStyle);
  }

  public OnboardingPreferences withPeakPeriod(String value) {
    return new OnboardingPreferences(usageMode, primaryGoals, mainObstacle, dailyFocusGoalMinutes, value, disciplineStyle);
  }

  public OnboardingPreferences withDisciplineStyle(String value) {
    return new OnboardingPreferences(usageMode, primaryGoals, mainObstacle, dailyFocusGoalMinutes, peakPeriod, value);
  }
}
