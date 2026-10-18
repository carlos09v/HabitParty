package com.habitparty.core.domain.entities.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;

class HabitDomainTest {

  private Habit habit;

  @BeforeEach
  void setUp() {
    habit = new Habit(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Beber Água",
        "Meta diária de 2L",
        1,
        TaskPriority.HIGH,
        List.of("Saúde"),
        TaskDifficulty.EASY,
        TaskStatus.PENDING,
        TaskType.HABIT,
        false,
        null,
        LocalDateTime.now(),
        List.of(),
        0, // currentStreak
        HabitType.POSITIVE,
        HabitResetCounter.DAILY,
        HabitImportanceType.NORMAL,
        null // lastCompletedAt
    );
  }

  @Test
  @DisplayName("Primeira conclusão deve iniciar streak com 1 e positiveCount com 1")
  void testFirstCompletionStartsStreak() {
    assertEquals(0, habit.getCurrentStreak());
    assertEquals(0, habit.getPositiveCount());
    assertNull(habit.getLastCompletedAt());

    LocalDateTime now = LocalDateTime.of(2026, 10, 17, 10, 0);
    habit.registerCompletion(now);

    assertEquals(1, habit.getCurrentStreak());
    assertEquals(1, habit.getPositiveCount());
    assertEquals(now, habit.getLastCompletedAt());
  }

  @Test
  @DisplayName("Múltiplas conclusões no mesmo dia devem incrementar repetições mas NÃO duplicar streak")
  void testMultipleCompletionsSameDayDoNotIncrementStreakMultipleTimes() {
    LocalDateTime firstClick = LocalDateTime.of(2026, 10, 17, 9, 0);
    LocalDateTime secondClick = LocalDateTime.of(2026, 10, 17, 13, 0);
    LocalDateTime thirdClick = LocalDateTime.of(2026, 10, 17, 18, 0);

    habit.registerCompletion(firstClick);
    assertEquals(1, habit.getCurrentStreak());
    assertEquals(1, habit.getPositiveCount());

    habit.registerCompletion(secondClick);
    assertEquals(1, habit.getCurrentStreak(), "Streak deve permanecer 1 no mesmo dia");
    assertEquals(2, habit.getPositiveCount(), "Positive count deve subir para 2");

    habit.registerCompletion(thirdClick);
    assertEquals(1, habit.getCurrentStreak(), "Streak deve continuar 1 no mesmo dia");
    assertEquals(3, habit.getPositiveCount(), "Positive count deve subir para 3");
  }

  @Test
  @DisplayName("Conclusão no dia consecutivo deve incrementar streak")
  void testConsecutiveDayIncrementsStreak() {
    LocalDateTime day1 = LocalDateTime.of(2026, 10, 17, 10, 0);
    LocalDateTime day2 = LocalDateTime.of(2026, 10, 18, 11, 0);

    habit.registerCompletion(day1);
    assertEquals(1, habit.getCurrentStreak());

    habit.registerCompletion(day2);
    assertEquals(2, habit.getCurrentStreak());
    assertEquals(2, habit.getPositiveCount());
  }

  @Test
  @DisplayName("Conclusão com quebra de mais de um dia deve reiniciar streak em 1")
  void testMissedDayResetsStreakToOne() {
    LocalDateTime day1 = LocalDateTime.of(2026, 10, 10, 10, 0);
    LocalDateTime day4 = LocalDateTime.of(2026, 10, 14, 10, 0); // 4 dias depois

    habit.registerCompletion(day1);
    assertEquals(1, habit.getCurrentStreak());

    habit.registerCompletion(day4);
    assertEquals(1, habit.getCurrentStreak(), "Pulou dias, streak deve recomeçar em 1");
  }

  @Test
  @DisplayName("breakStreak deve zerar o streak")
  void testBreakStreak() {
    habit.registerCompletion(LocalDateTime.of(2026, 10, 17, 10, 0));
    assertEquals(1, habit.getCurrentStreak());

    habit.breakStreak();
    assertEquals(0, habit.getCurrentStreak());
  }

  @Test
  @DisplayName("resetCycleCounts deve zerar repetições mantendo streak")
  void testResetCycleCounts() {
    LocalDateTime now = LocalDateTime.of(2026, 10, 17, 10, 0);
    habit.registerCompletion(now);
    habit.registerCompletion(now.plusHours(2));

    assertEquals(1, habit.getCurrentStreak());
    assertEquals(2, habit.getPositiveCount());

    habit.resetCycleCounts();
    assertEquals(1, habit.getCurrentStreak(), "Streak deve ser preservado ao virar o dia");
    assertEquals(0, habit.getPositiveCount(), "Repetições devem zerar para o novo dia");
  }

  @Test
  @DisplayName("Calcula decaimento de recompensa com base no streak")
  void testRewardDecayBasedOnStreak() {
    // NORMAL importance: baseXp = 10, baseCoins = 1.75
    // DAILY thresholds: adaptation >= 7 (75%), formed >= 21 (50%)

    // 1. Streak 0
    Task.TaskReward initialReward = habit.calculateReward();
    assertEquals(10, initialReward.xp());
    assertEquals(new BigDecimal("1.75"), initialReward.coins());

    // 2. Simulando streak de 7 dias
    for (int day = 1; day <= 7; day++) {
      habit.registerCompletion(LocalDateTime.of(2026, 10, day, 10, 0));
    }
    assertEquals(7, habit.getCurrentStreak());

    Task.TaskReward adaptationReward = habit.calculateReward();
    // 10 * 0.75 = 7 XP
    assertEquals(7, adaptationReward.xp());
    // 1.75 * 0.75 = 1.31 coins
    assertEquals(new BigDecimal("1.31"), adaptationReward.coins());
  }
}
