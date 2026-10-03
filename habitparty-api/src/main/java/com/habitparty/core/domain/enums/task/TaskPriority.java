package com.habitparty.core.domain.enums.task;

public enum TaskPriority {
  NONE("Nenhum"),
  Low("Baixa"),
  MEDIUM("Media"),
  HIGH("Alta");

  private final String description;

  TaskPriority(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
