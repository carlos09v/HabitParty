package com.habitparty.core.domain.entities.reward;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.OwnedByUser;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;

public class Reward implements OwnedByUser {
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
  private List<MysteryBoxLootItem> lootItems;

  public Reward(UUID id, UUID userId, String name, BigDecimal price, List<String> tags, RewardType type,
      int orderIndex, String icon, String description, RewardCategory category, Integer baseDurationMinutes,
      RewardPackageLevel packageLevel) {
    this(id, userId, name, price, tags, type, orderIndex, icon, description, category, baseDurationMinutes,
        packageLevel, null);
  }

  public Reward(UUID id, UUID userId, String name, BigDecimal price, List<String> tags, RewardType type,
      int orderIndex, String icon, String description, RewardCategory category, Integer baseDurationMinutes,
      RewardPackageLevel packageLevel, List<MysteryBoxLootItem> lootItems) {
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
    this.lootItems = type == RewardType.MISTERY_BOX ? lootItems : null;
  }

  public static void validateCategoryAndType(RewardCategory category, RewardType type) {
    if (category == RewardCategory.DEBT && type != RewardType.SINGLE_USE) {
      throw new DomainValidationException(
          "Recompensas na categoria Dívida devem ser do tipo Uso Único.");
    }
  }

  public static void validatePrice(BigDecimal price) {
    if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
      throw new DomainValidationException("O preço deve ser maior que zero.");
    }
  }

  public void updateDetails(String newName, String newDescription, BigDecimal newPrice, String newIcon,
      RewardCategory newCategory, List<String> newTags, RewardType newType,
      RewardPackageLevel newPackageLevel, Integer newBaseDurationMinutes) {
    updateDetails(newName, newDescription, newPrice, newIcon, newCategory, newTags, newType,
        newPackageLevel, newBaseDurationMinutes, null);
  }

  public void updateDetails(String newName, String newDescription, BigDecimal newPrice, String newIcon,
      RewardCategory newCategory, List<String> newTags, RewardType newType,
      RewardPackageLevel newPackageLevel, Integer newBaseDurationMinutes,
      List<MysteryBoxLootItem> newLootItems) {
    String nextName = (newName != null && !newName.trim().isEmpty()) ? newName : this.name;
    // Podem querer apagar a descrição mandando "", mas se mandar nulo, ignoramos
    String nextDescription = newDescription != null ? newDescription : this.description;

    BigDecimal nextPrice = this.price;
    if (newPrice != null) {
      validatePrice(newPrice);
      nextPrice = newPrice;
    }

    String nextIcon = (newIcon != null && !newIcon.trim().isEmpty()) ? newIcon : this.icon;
    RewardCategory nextCategory = newCategory != null ? newCategory : this.category;
    List<String> nextTags = newTags != null ? newTags : this.tags;
    RewardType nextType = newType != null ? newType : this.type;
    RewardPackageLevel nextPackageLevel = this.packageLevel;
    Integer nextBaseDurationMinutes = this.baseDurationMinutes;
    List<MysteryBoxLootItem> nextLootItems = this.lootItems;

    if (nextType == RewardType.SINGLE_USE) {
      nextBaseDurationMinutes = null;
      nextLootItems = null;
      if (newPackageLevel != null) {
        nextPackageLevel = newPackageLevel;
      }
    } else if (nextType == RewardType.TIME_BASED) {
      nextLootItems = null;
      if (newPackageLevel != null) {
        nextPackageLevel = newPackageLevel;
      }
      if (newBaseDurationMinutes != null) {
        nextBaseDurationMinutes = newBaseDurationMinutes;
      }
    } else if (nextType == RewardType.MISTERY_BOX) {
      nextBaseDurationMinutes = null;
      if (newPackageLevel != null) {
        if (newPackageLevel == RewardPackageLevel.NONE) {
          throw new DomainValidationException("Precisa ter um nível de pacote selecionado!");
        }
        nextPackageLevel = newPackageLevel;
      }
      if (newLootItems != null) {
        nextLootItems = MysteryBoxLootTable.validateAndNormalizeLootItems(nextPackageLevel, newLootItems);
      } else if (nextLootItems != null && newPackageLevel != null) {
        nextLootItems = MysteryBoxLootTable.validateAndNormalizeLootItems(nextPackageLevel, nextLootItems);
      }
    }

    validateCategoryAndType(nextCategory, nextType);
    if (nextCategory == RewardCategory.DEBT) {
      nextPackageLevel = RewardPackageLevel.NONE;
    }

    // Mutação atômica somente após todas as validações passarem
    this.name = nextName;
    this.description = nextDescription;
    this.price = nextPrice;
    this.icon = nextIcon;
    this.category = nextCategory;
    this.tags = nextTags;
    this.type = nextType;
    this.packageLevel = nextPackageLevel;
    this.baseDurationMinutes = nextBaseDurationMinutes;
    this.lootItems = nextLootItems;
  }

  public void updateOrderIndex(int newOrderIndex) {
      if (newOrderIndex < 0) {
          throw new DomainValidationException("O índice de ordem não pode ser negativo.");
      }
      this.orderIndex = newOrderIndex;
  }

  // --- Getters  ---

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getName() {
    return name;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public List<String> getTags() {
    return tags;
  }

  public RewardType getType() {
    return type;
  }

  public int getOrder_index() {
    return orderIndex;
  }

  public Optional<String> getIcon() {
    return Optional.ofNullable(icon);
  }

  public Optional<String> getDescription() {
    return Optional.ofNullable(description);
  }

  public Optional<RewardCategory> getCategory() {
    return Optional.ofNullable(category);
  }

  public Optional<Integer> getBaseDurationMinutes() {
    return Optional.ofNullable(baseDurationMinutes);
  }

  public Optional<RewardPackageLevel> getPackageLevel() {
    return Optional.ofNullable(packageLevel);
  }

  public List<MysteryBoxLootItem> getLootItems() {
    return lootItems;
  }
}
