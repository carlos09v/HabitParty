package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "rewards")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class RewardJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "reward_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
  @Column(nullable = false, length = 30)
  private String name;

  @Column(length = 20)
  private String icon;

  @Column(length = 140)
  private String description;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal price;

  @Builder.Default
  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags", columnDefinition = "text[]")
  private List<String> tags = new ArrayList<>();

  @Enumerated(EnumType.STRING)
  @Column(name = "reward_type", nullable = false)
  private RewardType type;

  @Enumerated(EnumType.STRING)
  @Column(name = "category")
  private RewardCategory category;

  @Enumerated(EnumType.STRING)
  @Column(name = "package_level")
  private RewardPackageLevel packageLevel;

  @Column(name = "base_duration_minutes")
  private Integer baseDurationMinutes;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "loot_items")
  private List<MysteryBoxLootItem> lootItems;

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;
}
