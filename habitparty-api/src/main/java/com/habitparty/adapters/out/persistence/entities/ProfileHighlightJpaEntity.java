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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "profile_highlights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileHighlightJpaEntity {

  @Id
  @Column(name = "highlight_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "display_order", nullable = false)
  private int displayOrder;

  @Enumerated(EnumType.STRING)
  @Column(name = "highlight_type", nullable = false, length = 40)
  private HighlightType highlightType;

  @Column(name = "reference_id")
  private UUID referenceId;

  @Column(name = "highlight_key", length = 60)
  private String highlightKey;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();
}
