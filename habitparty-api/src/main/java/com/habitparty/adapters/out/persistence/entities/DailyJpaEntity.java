package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.habitparty.core.domain.enums.task.DailyDaysOfWeek;
import com.habitparty.core.domain.enums.task.DailyRepeatMonthlyOption;
import com.habitparty.core.domain.enums.task.DailyRepeatType;

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
@Table(name = "daily")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyJpaEntity extends TaskJpaEntity {
  @Column(name = "current_streak", nullable = false)
  private int currentStreak;

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "repeat_type", nullable = false)
  private DailyRepeatType repeatType;

  @Column(name = "repeat_every", nullable = false)
  private int repeatEvery;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "days_of_week", columnDefinition = "text[]")
  private List<DailyDaysOfWeek> daysOfWeek;

  @Enumerated(EnumType.STRING)
  @Column(name = "repeat_monthly_option")
  private DailyRepeatMonthlyOption monthlyOption;

  @Column(name = "last_completed_at")
  private LocalDateTime lastCompletedAt;
}
