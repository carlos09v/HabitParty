package com.habitparty.core.domain.entities;

import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.exceptions.UnauthorizedException;

public class BoardColumn {
  private UUID id;
  private UUID userId; // FK
  private UUID workspaceId; // FK
  private String name;
  private int orderIndex;
  private String icon;
  private boolean isVisible; // Mochila de Columns

  public BoardColumn(UUID id, UUID userId, UUID workspaceId, String name, int orderIndex, String icon,
      boolean isVisible) {
    this.id = id;
    this.userId = userId;
    this.workspaceId = workspaceId;
    this.name = name;
    this.orderIndex = orderIndex;
    this.icon = icon;
    this.isVisible = isVisible;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  // Quando o usuário quiser guardar a lista na mochila, você chama esse método:
  public void hide() {
    this.isVisible = false;
  }

  // Quando quiser trazer de volta pra tela:
  public void show() {
    this.isVisible = true;
  }

  public void updateDetails(String newName, String newIcon) {
      if (newName != null && !newName.trim().isEmpty()) {
          this.name = newName;
      }
      if (newIcon != null && !newIcon.trim().isEmpty()) {
          this.icon = newIcon;
      }
  }

  // --- Getters and Setters ---
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

  public boolean isVisible() {
    return isVisible;
  }

  public void setVisible(boolean isVisible) {
    this.isVisible = isVisible;
  }
}
