package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsJpaEntity {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "user_id")
  private UserJpaEntity user;

  @Column(nullable = false, name = "current_coins", precision = 10, scale = 2)
  private BigDecimal currentCoins = BigDecimal.ZERO;

  @Column(nullable = false, name = "total_gold_earned", precision = 10, scale = 2)
  private BigDecimal totalGoldEarned = BigDecimal.ZERO;

  @Column(name = "total_xp", nullable = false, columnDefinition = "int default 0")
  private int totalXp = 0;

  @Column(name = "current_streak", nullable = false, columnDefinition = "int default 0")
  private int currentStreak = 0;

  @Column(name = "highest_streak", nullable = false, columnDefinition = "int default 0")
  private int highestStreak = 0;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt = LocalDateTime.now();
}
