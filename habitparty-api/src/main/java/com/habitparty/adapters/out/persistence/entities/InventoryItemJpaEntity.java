package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class InventoryItemJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "inventory_item_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "reward_id", nullable = false)
  private UUID rewardId;

  @ToString.Include
  @Column(name = "name_snapshot", nullable = false)
  private String nameSnapshot;

  @Column(name = "icon_snapshot")
  private String iconSnapshot;

  @Column(name = "price_snapshot", nullable = false, precision = 10, scale = 2)
  private BigDecimal priceSnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "package_level_snapshot")
  private RewardPackageLevel packageLevelSnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "reward_type_snapshot", nullable = false)
  private RewardType rewardTypeSnapshot;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InventoryItemStatus status;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Column(name = "remaining_seconds")
  private Integer remainingSeconds;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "loot_items_snapshot")
  private List<MysteryBoxLootItem> lootItemsSnapshot;

  @Column(name = "acquired_at", nullable = false, updatable = false)
  private LocalDateTime acquiredAt;

  @Version
  @Setter(AccessLevel.NONE)
  @Column(name = "version", nullable = false, columnDefinition = "bigint default 0")
  private Long version;
}
