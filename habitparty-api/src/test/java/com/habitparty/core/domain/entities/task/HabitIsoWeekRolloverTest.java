package com.habitparty.core.domain.entities.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;

class HabitIsoWeekRolloverTest {

  private Habit weeklyHabitWithLastCompletion(int streak, LocalDateTime lastCompletedAt) {
    return new Habit(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Treino Semanal",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.HABIT,
        false,
        null,
        LocalDateTime.of(2024, 1, 1, 9, 0),
        List.of(),
        streak,
        HabitType.POSITIVE,
        HabitResetCounter.WEEKLY,
        HabitImportanceType.NORMAL,
        lastCompletedAt,
        streak,
        0);
  }

  @Test
  @DisplayName("Quebra ofensiva entre W52 e W01 quando o ano ISO possui 53 semanas (ex: 2026-W52 -> 2027-W01)")
  void breaksStreakWhen53WeekYearHasGapWeekBeforeW01() {
    // 2026 possui 53 semanas ISO: W52 = 2026-12-21..27, W53 = 2026-12-28..2027-01-03, 2027-W01 = 2027-01-04..10
    Habit habit = weeklyHabitWithLastCompletion(5, LocalDateTime.of(2026, 12, 22, 18, 0));

    assertFalse(habit.isStreakStillActive(LocalDate.of(2027, 1, 5)));
    habit.registerCompletion(LocalDateTime.of(2027, 1, 5, 10, 0));
    assertEquals(1, habit.getCurrentStreak());
  }

  @Test
  @DisplayName("Mantém e incrementa ofensiva entre 2026-W53 e 2027-W01")
  void preservesStreakFromIsoWeek53ToWeek01() {
    Habit habit = weeklyHabitWithLastCompletion(5, LocalDateTime.of(2026, 12, 29, 18, 0));

    assertTrue(habit.isStreakStillActive(LocalDate.of(2027, 1, 5)));
    habit.registerCompletion(LocalDateTime.of(2027, 1, 5, 10, 0));
    assertEquals(6, habit.getCurrentStreak());
  }

  @Test
  @DisplayName("Mantém e incrementa ofensiva entre 2024-W52 e 2025-W01 em ano ISO de 52 semanas")
  void preservesStreakFromIsoWeek52ToWeek01In52WeekYear() {
    // 2024 possui 52 semanas ISO: W52 = 2024-12-23..29, 2025-W01 começa em 2024-12-30
    Habit habit = weeklyHabitWithLastCompletion(3, LocalDateTime.of(2024, 12, 24, 12, 0));

    assertTrue(habit.isStreakStillActive(LocalDate.of(2025, 1, 2)));
    habit.registerCompletion(LocalDateTime.of(2025, 1, 2, 12, 0));
    assertEquals(4, habit.getCurrentStreak());
  }
}
