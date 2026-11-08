package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsJpaEntity {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "user_id")
  private UserJpaEntity user;

  @Column(nullable = false, name = "current_coins", precision = 10, scale = 2)
  private BigDecimal currentCoins = BigDecimal.ZERO;

  @Column(nullable = false, name = "total_gold_earned", precision = 10, scale = 2)
  private BigDecimal totalGoldEarned = BigDecimal.ZERO;

  @Column(name = "total_xp", nullable = false, columnDefinition = "int default 0")
  private int totalXp = 0;

  @Column(name = "current_streak", nullable = false, columnDefinition = "int default 0")
  private int currentStreak = 0;

  @Column(name = "highest_streak", nullable = false, columnDefinition = "int default 0")
  private int highestStreak = 0;

  @Column(name = "total_tasks_completed", nullable = false, columnDefinition = "int default 0")
  private int totalTasksCompleted = 0;

  @Column(name = "total_hard_tasks_completed", nullable = false, columnDefinition = "int default 0")
  private int totalHardTasksCompleted = 0;

  @Column(name = "total_hardcore_tasks_completed", nullable = false, columnDefinition = "int default 0")
  private int totalHardcoreTasksCompleted = 0;

  @Column(name = "total_focus_minutes", nullable = false, columnDefinition = "int default 0")
  private int totalFocusMinutes = 0;

  @Column(name = "total_focus_sessions", nullable = false, columnDefinition = "int default 0")
  private int totalFocusSessions = 0;

  @Column(name = "longest_focus_session_minutes", nullable = false, columnDefinition = "int default 0")
  private int longestFocusSessionMinutes = 0;

  @Column(name = "total_pomodoros_completed", nullable = false, columnDefinition = "int default 0")
  private int totalPomodorosCompleted = 0;

  @Column(name = "total_rewards_redeemed", nullable = false, columnDefinition = "int default 0")
  private int totalRewardsRedeemed = 0;

  @Column(name = "total_mystery_boxes_opened", nullable = false, columnDefinition = "int default 0")
  private int totalMysteryBoxesOpened = 0;

  @Column(name = "achievement_points", nullable = false, columnDefinition = "int default 0")
  private int achievementPoints = 0;

  @Column(name = "total_night_focus_sessions", nullable = false, columnDefinition = "int default 0")
  private int totalNightFocusSessions = 0;

  @Column(name = "total_early_focus_sessions", nullable = false, columnDefinition = "int default 0")
  private int totalEarlyFocusSessions = 0;

  @Column(name = "total_coupons_depleted", nullable = false, columnDefinition = "int default 0")
  private int totalCouponsDepleted = 0;

  @Column(name = "total_workspaces_created", nullable = false, columnDefinition = "int default 0")
  private int totalWorkspacesCreated = 0;

  @Column(name = "total_checklist_tasks_completed", nullable = false, columnDefinition = "int default 0")
  private int totalChecklistTasksCompleted = 0;

  @Column(name = "total_on_time_todos_completed", nullable = false, columnDefinition = "int default 0")
  private int totalOnTimeTodosCompleted = 0;

  @Column(name = "total_clean_habit_cycles", nullable = false, columnDefinition = "int default 0")
  private int totalCleanHabitCycles = 0;

  @Column(name = "total_activity_goals_met", nullable = false, columnDefinition = "int default 0")
  private int totalActivityGoalsMet = 0;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt = LocalDateTime.now();
}
