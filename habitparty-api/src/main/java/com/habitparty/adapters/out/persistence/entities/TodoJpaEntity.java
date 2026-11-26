package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.habitparty.core.domain.enums.task.TodoReminderType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "todo")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, onlyExplicitlyIncluded = true)
public class TodoJpaEntity extends TaskJpaEntity {

  @Column(name = "due_time")
  private LocalTime dueTime;

  @Column(name = "start_time")
  private LocalTime startTime;

  @Column(name = "due_end_time")
  private LocalTime dueEndTime;

  @Builder.Default
  @Column(name = "is_all_day", nullable = false, columnDefinition = "boolean default false")
  private boolean isAllDay = false;

  @Enumerated(EnumType.STRING)
  @Column(name = "reminder_type", nullable = false)
  private TodoReminderType reminderType;

  @Column(name = "reminder_at")
  private LocalDateTime reminderAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  @Builder.Default
  @Column(name = "is_penalty_applied", nullable = false, columnDefinition = "boolean default false")
  private boolean isPenaltyApplied = false;

  @Builder.Default
  @Column(name = "send_email_reminder", nullable = false, columnDefinition = "boolean default false")
  private boolean sendEmailReminder = false;

  @Builder.Default
  @Column(name = "email_reminder_sent", nullable = false, columnDefinition = "boolean default false")
  private boolean emailReminderSent = false;

  @Builder.Default
  @Column(name = "reminder_attempts", nullable = false, columnDefinition = "int default 0")
  private int reminderAttempts = 0;
}
