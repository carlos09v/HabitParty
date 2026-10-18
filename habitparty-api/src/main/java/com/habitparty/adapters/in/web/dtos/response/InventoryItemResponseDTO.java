package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InventoryItemResponseDTO(
    UUID inventoryItemId,
    UUID rewardId,
    String rewardName,
    String rewardIcon,
    BigDecimal rewardPrice,
    RewardType rewardType,
    RewardPackageLevel rewardPackageLevel,
    InventoryItemStatus status,
    int orderIndex,
    Integer remainingMinutes,
    Integer remainingSeconds
) {
    public static InventoryItemResponseDTO fromDomain(InventoryItem domain) {
    return new InventoryItemResponseDTO(
        domain.getId(),
        domain.getRewardId(),
        domain.getNameSnapshot(),
        domain.getIconSnapshot().orElse(null),
        domain.getPriceSnapshot(),
        domain.getRewardTypeSnapshot(),
        domain.getPackageLevelSnapshot().orElse(null),
        domain.getStatus(),
        domain.getOrderIndex(),
        domain.getRemainingMinutes().orElse(null),
        domain.getRemainingSeconds().orElse(null)
    );
}

}