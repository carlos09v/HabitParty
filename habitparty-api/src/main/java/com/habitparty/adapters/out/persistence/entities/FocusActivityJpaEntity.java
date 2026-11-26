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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "focus_activity")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class FocusActivityJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "focus_activity_id", updatable = false, nullable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
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
