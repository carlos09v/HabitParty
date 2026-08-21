package com.habitparty.adapters.in.web.dtos.response;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardType;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InventoryItemResponseDTO(
    UUID inventoryItemId,
    UUID rewardId,
    String rewardName,
    String rewardIcon,
    RewardType rewardType,
    InventoryItemStatus status,
    int orderIndex,
    Integer remainingMinutes
) {}