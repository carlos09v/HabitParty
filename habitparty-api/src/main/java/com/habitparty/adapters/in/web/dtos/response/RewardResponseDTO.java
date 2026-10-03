package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

@JsonInclude(JsonInclude.Include.NON_NULL) // <-- Esconde do JSON tudo que for 'null'
public record RewardResponseDTO(
    UUID id,
    UUID userId,
    String name,
    int orderIndex,
    String icon,
    BigDecimal price,
    List<String> tags,
    RewardType type,
    String description,
    RewardCategory category,
    RewardPackageLevel packageLevel,
    Integer baseDurationMinutes
) {
  public static RewardResponseDTO fromDomain(Reward reward) {
    return new RewardResponseDTO(
      reward.getId(),
        reward.getUserId(),
        reward.getName(),
        reward.getOrder_index(),
        reward.getIcon().orElse(null),
        reward.getPrice(),
        reward.getTags(),
        reward.getType(),
        reward.getDescription().orElse(null),
        reward.getCategory().orElse(null),
        reward.getPackageLevel().orElse(null),
        reward.getBaseDurationMinutes().orElse(null)
    );
  }
}
