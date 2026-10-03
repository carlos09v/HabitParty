package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;

import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "habit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HabitJpaEntity extends TaskJpaEntity {
  @Column(name = "current_streak", nullable = false)
  private int currentStreak;

  @Enumerated(EnumType.STRING)
  @Column(name = "habit_type", nullable = false)
  private HabitType habitType;

  @Enumerated(EnumType.STRING)
  @Column(name = "reset_counter", nullable = false)
  private HabitResetCounter resetCounter;

  @Enumerated(EnumType.STRING)
  @Column(name = "importance_type", nullable = false)
  private HabitImportanceType importanceType;

  @Column(name = "last_completed_at")
  private LocalDateTime lastCompletedAt;
}
