package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.UnauthorizedException;

public class Reward {
  private UUID id;
  private UUID userId; // Chave estrangeira
  private String name;
  private BigDecimal price;
  private List<String> tags;
  private RewardType type;
  private int orderIndex;


  // Atributos opcionais (nullable)
  private String icon;
  private String description;
  private RewardCategory category;
  private RewardPackageLevel packageLevel; // Básico, Premium, Premium Plus
  private Integer baseDurationMinutes; // Duração do Cupom (caso seja o RewardType definido)

  public Reward(UUID id, UUID userId, String name, BigDecimal price, List<String> tags, RewardType type,
      int orderIndex, String icon, String description, RewardCategory category, Integer baseDurationMinutes,
      RewardPackageLevel packageLevel) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.price = price;
    this.tags = tags;
    this.type = type;
    this.orderIndex = orderIndex;
    this.icon = icon;
    this.description = description;
    this.category = category;
    this.baseDurationMinutes = baseDurationMinutes;
    this.packageLevel = packageLevel;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public void setPrice(BigDecimal price) {
    this.price = price;
  }

  public List<String> getTags() {
    return tags;
  }

  public void setTags(List<String> tags) {
    this.tags = tags;
  }

  public RewardType getType() {
    return type;
  }

  public void setType(RewardType type) {
    this.type = type;
  }

  public Integer getOrder_index() {
    return orderIndex;
  }

  public void setOrder_index(Integer order_index) {
    this.orderIndex = order_index;
  }

  public Optional<String> getIcon() {
    return Optional.ofNullable(icon);
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }

  public Optional<String> getDescription() {
    return Optional.ofNullable(description);
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Optional<RewardCategory> getCategory() {
    return Optional.ofNullable(category);
  }

  public void setCategory(RewardCategory category) {
    this.category = category;
  }

  public Optional<Integer> getBaseDurationMinutes() {
    return Optional.ofNullable(baseDurationMinutes);
  }

  public void setBaseDurationMinutes(Integer base_duration_minutes) {
    this.baseDurationMinutes = base_duration_minutes;
  }

  public Optional<RewardPackageLevel> getPackageLevel() {
    return Optional.ofNullable(packageLevel);
  }

  public void setPackageLevel(RewardPackageLevel packageLevel) {
    this.packageLevel = packageLevel;
  }

}
