package com.habitparty.application.usecases.reward;

import java.math.BigDecimal;
import java.util.List;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

public record UpdateRewardCommand(
    String name,
    String icon,
    String description,
    BigDecimal price,
    RewardCategory category,
    List<String> tags,
    RewardType type,
    RewardPackageLevel packageLevel,
    Integer baseDurationMinutes
) {}
