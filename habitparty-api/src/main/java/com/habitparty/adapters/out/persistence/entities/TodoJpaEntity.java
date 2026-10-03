package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;

import com.habitparty.core.domain.enums.task.TodoReminderType;

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
@Table(name = "todo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TodoJpaEntity extends TaskJpaEntity {
  @Enumerated(EnumType.STRING)
  @Column(name = "reminder_type", nullable = false)
  private TodoReminderType reminderType;

  @Column(name = "reminder_at")
  private LocalDateTime reminderAt;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;
}
