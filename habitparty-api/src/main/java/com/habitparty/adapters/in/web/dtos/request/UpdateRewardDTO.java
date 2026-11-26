package com.habitparty.adapters.in.web.dtos.request;

import java.math.BigDecimal;
import java.util.List;

import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateRewardDTO(
  @Size(min = 1, max = 30, message = "O nome deve ter até 30 caracteres")
  String name,

  @Size(max = 20, message = "O icone deve ter até 20 caracteres")
  String icon,

  @Size(max = 140, message = "A descrição deve ter até 140 caracteres")
  String description,

  @Positive(message = "O preço deve ser maior que zero")
  BigDecimal price,

  RewardCategory category,

  @Size(max = 5, message = "A recompensa pode ter no máximo 5 tags")
  List<@Size(max = 80, message = "Cada tag deve ter até 80 caracteres") String> tags,

  RewardType type,

  RewardPackageLevel packageLevel,

  Integer baseDurationMinutes,

  @Valid
  @Size(max = 10, message = "A caixa misteriosa pode ter no máximo 10 itens")
  List<MysteryBoxLootItem> lootItems
) {
  public UpdateRewardDTO(
      String name,
      String icon,
      String description,
      BigDecimal price,
      RewardCategory category,
      List<String> tags,
      RewardType type,
      RewardPackageLevel packageLevel,
      Integer baseDurationMinutes) {
    this(name, icon, description, price, category, tags, type, packageLevel, baseDurationMinutes, null);
  }
}
