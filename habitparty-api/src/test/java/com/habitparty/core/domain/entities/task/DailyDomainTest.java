package com.habitparty.core.domain.entities.task;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.UnauthorizedException;

class DailyDomainTest {

  private UUID userId;
  private UUID columnId;
  private Daily daily;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    columnId = UUID.randomUUID();
    daily = new Daily(
        UUID.randomUUID(),
        columnId,
        userId,
        "Beber 2L de água",
        "Manter-se hidratado",
        1,
        TaskPriority.HIGH,
        List.of("saude"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        true, // isHardcoreModeEnabled
        LocalDate.now(),
        LocalDateTime.now(),
        List.of(),
        0, // currentStreak
        LocalDate.now(),
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );
  }

  @Test
  @DisplayName("Calcula recompensa padrão para Daily MEDIUM com streak 0")
  void testCalculateRewardInitial() {
    Task.TaskReward reward = daily.calculateReward();
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("2.50"), reward.coins());
  }

  @Test
  @DisplayName("Registra conclusão e incrementa streak")
  void testRegisterCompletion() {
    assertEquals(0, daily.getCurrentStreak());
    assertNull(daily.getLastCompletedAt());

    daily.registerCompletion();

    assertEquals(1, daily.getCurrentStreak());
    assertNotNull(daily.getLastCompletedAt());
  }

  @Test
  @DisplayName("Calcula recompensa com decaimento quando atinge rotina (streak >= 21)")
  void testCalculateRewardWithStreakDecay() {
    // 21 repetições para DAILY é a rotina formada (multiplicador 0.5)
    for (int i = 0; i < 21; i++) {
      daily.registerCompletion();
    }
    assertEquals(21, daily.getCurrentStreak());

    Task.TaskReward reward = daily.calculateReward();
    // 15 * 0.5 = 7 XP
    assertEquals(7, reward.xp());
    // 2.50 * 0.5 = 1.25 coins
    assertEquals(new BigDecimal("1.25"), reward.coins());
  }

  @Test
  @DisplayName("Quebra de sequência (breakStreak) reseta o streak para zero")
  void testBreakStreak() {
    daily.registerCompletion();
    daily.registerCompletion();
    assertEquals(2, daily.getCurrentStreak());

    daily.breakStreak();
    assertEquals(0, daily.getCurrentStreak());
  }

  @Test
  @DisplayName("Calcula penalidade no modo hardcore (50% da recompensa)")
  void testCalculatePenalty() {
    Task.TaskReward penalty = daily.calculatePenalty();
    // 15 XP * 0.5 = 7
    assertEquals(7, penalty.xp());
    // 2.50 * 0.5 = 1.25 coins
    assertEquals(new BigDecimal("1.25"), penalty.coins());
  }

  @Test
  @DisplayName("Validação de posse lança UnauthorizedException se usuário não for o dono")
  void testValidateOwnership() {
    UUID otherUserId = UUID.randomUUID();
    assertThrows(UnauthorizedException.class, () -> daily.validateOwnership(otherUserId));
    assertDoesNotThrow(() -> daily.validateOwnership(userId));
  }
}
