package com.habitparty.core.domain.entities.task;

import java.util.UUID;

import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class ChecklistItem {
  private UUID id;
  private UUID taskId;
  private UUID userId;
  private String name;
  private boolean isCompleted;

  public ChecklistItem(UUID id, UUID taskId, UUID userId, String name, boolean isCompleted) {
    this.id = id;
    this.taskId = taskId;
    this.userId = userId;
    this.name = name;
    this.isCompleted = isCompleted;
  }

  public void toggle() {
    this.isCompleted = !this.isCompleted;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  public void updateName(String newName) {
    if (newName == null || newName.trim().isEmpty()) {
      throw new DomainValidationException("O nome do item não pode ser vazio.");
    }
    this.name = newName;
  }

  public UUID getId() {
    return id;
  }

  public UUID getTaskId() {
    return taskId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getName() {
    return name;
  }

  public boolean isCompleted() {
    return isCompleted;
  }
}
