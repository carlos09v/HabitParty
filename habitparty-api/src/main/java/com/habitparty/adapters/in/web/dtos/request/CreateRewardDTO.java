package com.habitparty.adapters.in.web.dtos.request;

import java.math.BigDecimal;
import java.util.List;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CreateRewardDTO(
  @NotBlank(message = "O nome é obrigatório")
  @Size(max = 30, message = "O nome deve ter até 30 caracteres")
  String name,

  @Size(max = 20, message = "O icone deve ter até 20 caracteres")
  String icon,

  @Size(max = 140, message = "A descrição deve ter até 140 caracteres")
  String description,

  @NotNull(message = "O preço é obrigatório")
  @PositiveOrZero(message = "O preço não pode ser negativo")
  BigDecimal price,

  RewardCategory category,

  List<String> tags,

  @NotNull(message = "O tipo é obrigatório")
  RewardType type,

  RewardPackageLevel packageLevel,

  Integer baseDurationMinutes
) {
  
}
