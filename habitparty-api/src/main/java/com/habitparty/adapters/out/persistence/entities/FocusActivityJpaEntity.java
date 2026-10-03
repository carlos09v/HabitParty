package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.FocusRecordType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "focus_activity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FocusActivityJpaEntity {
  @Id
  @Column(name = "focus_activity_id", updatable = false, nullable = false)
  private UUID id;

  // Deixar sem o relacionamento @ManyToOne para desempenho
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "name", nullable = false, length = 50)
  private String name;

  @Column(name = "icon", nullable = false)
  private String icon;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Enumerated(EnumType.STRING)
  @Column(name = "record_type", nullable = false)
  private FocusRecordType recordType;

  @Column(name = "pomo_time_minutes")
  private Integer pomoTimeMinutes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
