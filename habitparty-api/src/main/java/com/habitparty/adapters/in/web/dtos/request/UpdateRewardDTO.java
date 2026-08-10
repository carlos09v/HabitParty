package com.habitparty.adapters.in.web.dtos.request;

import java.math.BigDecimal;
import java.util.List;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateRewardDTO(
  @Size(min = 1, max = 30, message = "O nome deve ter até 30 caracteres")
  String name,

  @Size(max = 20, message = "O icone deve ter até 20 caracteres")
  String icon,

  @Size(max = 140, message = "A descrição deve ter até 140 caracteres")
  String description,

  @PositiveOrZero(message = "O preço não pode ser negativo")
  BigDecimal price,

  RewardCategory category,

  List<String> tags,

  RewardType type,

  RewardPackageLevel packageLevel,

  Integer baseDurationMinutes
) {
  
}
