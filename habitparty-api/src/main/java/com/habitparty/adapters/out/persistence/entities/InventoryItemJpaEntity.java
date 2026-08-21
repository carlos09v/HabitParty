package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.habitparty.core.domain.enums.InventoryItemStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemJpaEntity {
  @Id
  // @GeneratedValue(strategy = GenerationType.UUID) => O usecase que irá gerar
  @Column(name = "inventory_item_id")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserJpaEntity user;

  @Column(name = "reward_id", nullable = false)
  private UUID rewardId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InventoryItemStatus status;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Column(name = "remaining_minutes")
  private Integer remainingMinutes;

  @CreationTimestamp
  @Column(name = "acquired_at", nullable = false, updatable = false)
  private LocalDateTime acquiredAt;
}
