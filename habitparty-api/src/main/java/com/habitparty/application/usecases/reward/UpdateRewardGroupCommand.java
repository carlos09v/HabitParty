package com.habitparty.application.usecases.reward;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;

public record UpdateRewardGroupCommand(
    List<UUID> sourceRewardIds,
    String baseName,
    String icon,
    String description,
    RewardCategory category,
    List<String> tags,
    List<VariantItem> variants,
    boolean deleteRemovedHistory
) {
  public record VariantItem(
      UUID id,
      String name,
      BigDecimal price,
      RewardPackageLevel packageLevel,
      Integer baseDurationMinutes
  ) {}
}
