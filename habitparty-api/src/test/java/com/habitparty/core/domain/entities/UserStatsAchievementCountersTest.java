package com.habitparty.core.domain.entities;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class UserStatsAchievementCountersTest {

  private final UserStats stats = UserStats.createInitial(UUID.randomUUID());

  @Test
  void deveContarSessaoNoturnaQuandoTerminaEntre23hE5h() {
    stats.recordFocusTimeOfDay(
        LocalDateTime.of(2026, 11, 8, 22, 40),
        LocalDateTime.of(2026, 11, 8, 23, 20),
        40);
    stats.recordFocusTimeOfDay(
        LocalDateTime.of(2026, 11, 9, 3, 0),
        LocalDateTime.of(2026, 11, 9, 4, 59),
        119);

    assertEquals(2, stats.getTotalNightFocusSessions());
    assertEquals(0, stats.getTotalEarlyFocusSessions());
  }

  @Test
  void deveContarSessaoMatinalQuandoComecaEntre5hE7h() {
    stats.recordFocusTimeOfDay(
        LocalDateTime.of(2026, 11, 8, 5, 30),
        LocalDateTime.of(2026, 11, 8, 6, 10),
        40);
    stats.recordFocusTimeOfDay(
        LocalDateTime.of(2026, 11, 8, 7, 0),
        LocalDateTime.of(2026, 11, 8, 7, 30),
        30);

    assertEquals(1, stats.getTotalEarlyFocusSessions());
    assertEquals(0, stats.getTotalNightFocusSessions());
  }

  @Test
  void deveIgnorarSessoesCurtasNosContadoresDeHorario() {
    stats.recordFocusTimeOfDay(
        LocalDateTime.of(2026, 11, 8, 23, 50),
        LocalDateTime.of(2026, 11, 8, 23, 59),
        9);

    assertEquals(0, stats.getTotalNightFocusSessions());
  }

  @Test
  void deveIncrementarContadoresComportamentais() {
    stats.recordCouponDepleted();
    stats.recordWorkspaceCreated();
    stats.recordWorkspaceCreated();
    stats.recordChecklistTaskCompleted();
    stats.recordOnTimeTodoCompleted();
    stats.recordCleanHabitCycle();
    stats.recordActivityGoalMet();

    assertEquals(1, stats.getTotalCouponsDepleted());
    assertEquals(2, stats.getTotalWorkspacesCreated());
    assertEquals(1, stats.getTotalChecklistTasksCompleted());
    assertEquals(1, stats.getTotalOnTimeTodosCompleted());
    assertEquals(1, stats.getTotalCleanHabitCycles());
    assertEquals(1, stats.getTotalActivityGoalsMet());
  }

  @Test
  void deveEscalarEEstornarContadoresDeTarefasPorUnidadesDeEntrega() {
    stats.addXp(500);
    stats.addCoins(new java.math.BigDecimal("50.00"));

    stats.recordTaskCompleted(true, true, 4);
    stats.recordChecklistTaskCompleted();
    stats.recordOnTimeTodoCompleted();

    assertEquals(4, stats.getTotalTasksCompleted());
    assertEquals(4, stats.getTotalHardTasksCompleted());
    assertEquals(4, stats.getTotalHardcoreTasksCompleted());
    assertEquals(1, stats.getTotalChecklistTasksCompleted());
    assertEquals(1, stats.getTotalOnTimeTodosCompleted());

    stats.revertTaskCompletion(120, new java.math.BigDecimal("20.00"), true, true, true, true, 4);

    assertEquals(0, stats.getTotalTasksCompleted());
    assertEquals(0, stats.getTotalHardTasksCompleted());
    assertEquals(0, stats.getTotalHardcoreTasksCompleted());
    assertEquals(0, stats.getTotalChecklistTasksCompleted());
    assertEquals(0, stats.getTotalOnTimeTodosCompleted());
  }
}
