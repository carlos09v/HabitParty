package com.habitparty.core.domain.entities.task;

import java.util.UUID;

import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class ChecklistItem {
  public static final int MAX_REWARDED_ITEMS_PER_TASK = 4;

  private UUID id;
  private UUID taskId;
  private UUID userId;
  private String name;
  private boolean isCompleted;
  private boolean isRewarded;
  private int orderIndex;
  private boolean autoCompleted;

  public ChecklistItem(UUID id, UUID taskId, UUID userId, String name, boolean isCompleted) {
    this(id, taskId, userId, name, isCompleted, false, 0, false);
  }

  public ChecklistItem(UUID id, UUID taskId, UUID userId, String name, boolean isCompleted, boolean isRewarded) {
    this(id, taskId, userId, name, isCompleted, isRewarded, 0, false);
  }

  public ChecklistItem(
      UUID id,
      UUID taskId,
      UUID userId,
      String name,
      boolean isCompleted,
      boolean isRewarded,
      int orderIndex,
      boolean autoCompleted) {
    this.id = id;
    this.taskId = taskId;
    this.userId = userId;
    this.name = name;
    this.isCompleted = isCompleted;
    this.isRewarded = isRewarded;
    this.orderIndex = Math.max(0, orderIndex);
    this.autoCompleted = isCompleted && autoCompleted;
  }

  public void toggle() {
    this.isCompleted = !this.isCompleted;
    this.autoCompleted = false;
  }

  public void setCompleted(boolean completed) {
    this.isCompleted = completed;
    if (!completed) {
      this.autoCompleted = false;
    }
  }

  public void markAutoCompleted() {
    this.isCompleted = true;
    this.autoCompleted = true;
  }

  public void revertAutoCompleted() {
    if (this.autoCompleted) {
      this.isCompleted = false;
      this.autoCompleted = false;
    }
  }

  public void toggleRewarded() {
    this.isRewarded = !this.isRewarded;
  }

  public void setRewarded(boolean rewarded) {
    this.isRewarded = rewarded;
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

  public boolean isRewarded() {
    return isRewarded;
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public void setOrderIndex(int orderIndex) {
    this.orderIndex = Math.max(0, orderIndex);
  }

  public boolean isAutoCompleted() {
    return autoCompleted;
  }
}
