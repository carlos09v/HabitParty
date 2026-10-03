package com.habitparty.core.domain.enums.task;

public enum TaskDifficulty {
  TRIVIAL("Muito Fácil"),
  EASY("Facil"),
  MEDIUM("Medio"),
  HARD("Difícil");

  private final String description;

  TaskDifficulty(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
