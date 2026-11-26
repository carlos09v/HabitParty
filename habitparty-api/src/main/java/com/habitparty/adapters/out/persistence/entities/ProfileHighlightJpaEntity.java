package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.HighlightType;

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
@Table(name = "profile_highlights")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class ProfileHighlightJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "highlight_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "display_order", nullable = false)
  private int displayOrder;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(name = "highlight_type", nullable = false, length = 40)
  private HighlightType highlightType;

  @Column(name = "reference_id")
  private UUID referenceId;

  @Column(name = "highlight_key", length = 60)
  private String highlightKey;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
