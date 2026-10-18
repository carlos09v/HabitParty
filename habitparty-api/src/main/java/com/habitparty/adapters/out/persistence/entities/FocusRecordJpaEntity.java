package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
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
@Table(name = "focus_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FocusRecordJpaEntity {
  @Id
  @Column(name = "focus_record_id", updatable = false, nullable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "focus_activity_id")
  private UUID focusActivityId;

  @Column(name = "inventory_item_id")
  private UUID inventoryItemId;

  @Column(name = "notes", length = 500)
  private String notes;

  @Column(name = "start_time", nullable = false)
  private LocalDateTime startTime;

  @Column(name = "end_time", nullable = false)
  private LocalDateTime endTime;

  @Enumerated(EnumType.STRING)
  @Column(name = "record_type")
  private FocusRecordType recordType;

  @Column(name = "completed_pomos")
  private Integer completedPomos;

  @Column(name = "duration_minutes", nullable = false)
  private int durationMinutes;

  @Column(name = "xp_earned")
  private Integer xpEarned;

  @Column(name = "coins_earned")
  private BigDecimal coinsEarned;
}
