package com.habitparty.adapters.in.web.dtos.request;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
  @Positive(message = "O preço deve ser maior que zero")
  BigDecimal price,

  @JsonSetter(nulls = Nulls.SKIP) // Isso diz: se vier nulo ou vazio de forma estranha, ignore
  RewardCategory category,

  @Size(max = 5, message = "A recompensa pode ter no máximo 5 tags")
  List<@Size(max = 80, message = "Cada tag deve ter até 80 caracteres") String> tags,

  @NotNull(message = "O tipo é obrigatório")
  RewardType type,

  RewardPackageLevel packageLevel,

  Integer baseDurationMinutes,

  @Valid
  @Size(max = 10, message = "A caixa misteriosa pode ter no máximo 10 itens")
  List<MysteryBoxLootItem> lootItems
) {
  public CreateRewardDTO(
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
