package com.habitparty.core.domain.entities.reward;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;
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

  public void updateDetails(String newName, String newDescription, BigDecimal newPrice, String newIcon,
      RewardCategory newCategory, List<String> newTags, RewardType newType,
      RewardPackageLevel newPackageLevel, Integer newBaseDurationMinutes) {
    if (newName != null && !newName.trim().isEmpty()) {
      this.name = newName;
    }

    if (newDescription != null) {
      // Podem querer apagar a descrição mandando "", mas se mandar nulo, ignoramos
      this.description = newDescription;
    }

    if (newPrice != null && newPrice.compareTo(BigDecimal.ZERO) < 0) {
      // Regra de negócio extra: não pode custar negativo
      this.price = newPrice;
    }

    if (newIcon != null && !newIcon.trim().isEmpty()) {
      this.icon = newIcon;
    }

    if (newCategory != null) {
      this.category = newCategory;
    }
    if (newTags != null) {
      this.tags = newTags;
    }

    // Atualiza o Tipo (se enviado)
    if (newType != null) {
      this.type = newType;
    }

    if (this.type != RewardType.TIME_BASED) {
      // Se mudou para qualquer coisa que NÃO seja CUPOM (ou se já não era), apaga os dados exclusivos, ignorando o que veio no payload.
      this.packageLevel = null;
      this.baseDurationMinutes = null;
    } else {
      // Se for CUPOM, aceita a atualização dos dados específicos
      if (newPackageLevel != null) {
        this.packageLevel = newPackageLevel;
      }
      if (newBaseDurationMinutes != null) {
        this.baseDurationMinutes = newBaseDurationMinutes;
      }
    }
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
}
