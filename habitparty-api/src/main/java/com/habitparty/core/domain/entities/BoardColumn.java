package com.habitparty.core.domain.entities;

import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class BoardColumn {
  private UUID id;
  private UUID userId; // Chave estrangeira
  private UUID workspaceId; // Chave estrangeira
  private String name;
  private int orderIndex;
  private String icon;

  public BoardColumn(UUID id, UUID userId, UUID workspaceId, String name, int orderIndex, String icon) {
    this.id = id;
    this.userId = userId;
    this.workspaceId = workspaceId;
    this.name = name;
    this.orderIndex = orderIndex;
    this.icon = icon;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  // Métodos update
  public void updateName(String newName) {
    if (newName == null || newName.trim().isEmpty()) {
      throw new DomainValidationException("O nome da coluna não pode estar vazio.");
    }
    this.name = newName;
  }
  public void updateIcon(String newIcon) {
    // Regras...
    this.icon = newIcon;
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

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Optional<String> getIcon() {
    return Optional.ofNullable(icon);
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public void setOrderIndex(int order_index) {
    this.orderIndex = order_index;
  }
}
