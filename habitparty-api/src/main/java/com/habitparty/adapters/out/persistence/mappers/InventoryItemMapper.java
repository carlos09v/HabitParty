package com.habitparty.adapters.out.persistence.mappers;

import java.util.ArrayList;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.core.domain.entities.InventoryItem;

@Component
public class InventoryItemMapper {

  public InventoryItemJpaEntity toEntity(InventoryItem domain) {
    return InventoryItemJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .rewardId(domain.getRewardId())
        .nameSnapshot(domain.getNameSnapshot())
        .iconSnapshot(domain.getIconSnapshot().orElse(null))
        .priceSnapshot(domain.getPriceSnapshot())
        .packageLevelSnapshot(domain.getPackageLevelSnapshot().orElse(null))
        .rewardTypeSnapshot(domain.getRewardTypeSnapshot())
        .status(domain.getStatus())
        .orderIndex(domain.getOrderIndex())
        .remainingSeconds(domain.getRemainingSeconds().orElse(null))
        .acquiredAt(domain.getAcquiredAt())
        .lootItemsSnapshot(domain.getLootItemsSnapshot() != null
            ? new ArrayList<>(domain.getLootItemsSnapshot())
            : null)
        .build();
  }

  public void updateEntityFromDomain(InventoryItemJpaEntity entity, InventoryItem domain) {
    entity.setNameSnapshot(domain.getNameSnapshot());
    entity.setIconSnapshot(domain.getIconSnapshot().orElse(null));
    entity.setPriceSnapshot(domain.getPriceSnapshot());
    entity.setPackageLevelSnapshot(domain.getPackageLevelSnapshot().orElse(null));
    entity.setRewardTypeSnapshot(domain.getRewardTypeSnapshot());
    entity.setStatus(domain.getStatus());
    entity.setOrderIndex(domain.getOrderIndex());
    entity.setRemainingSeconds(domain.getRemainingSeconds().orElse(null));
    entity.setLootItemsSnapshot(domain.getLootItemsSnapshot() != null
        ? new ArrayList<>(domain.getLootItemsSnapshot())
        : null);
  }

  public InventoryItem toDomain(InventoryItemJpaEntity entity) {
    return new InventoryItem(
        entity.getId(),
        entity.getUserId(),
        entity.getRewardId(),
        entity.getNameSnapshot(),
        entity.getPriceSnapshot(),
        entity.getRewardTypeSnapshot(),
        entity.getStatus(),
        entity.getOrderIndex(),
        entity.getIconSnapshot(),
        entity.getPackageLevelSnapshot(),
        entity.getRemainingSeconds(),
        entity.getAcquiredAt(),
        entity.getLootItemsSnapshot());
  }
}
