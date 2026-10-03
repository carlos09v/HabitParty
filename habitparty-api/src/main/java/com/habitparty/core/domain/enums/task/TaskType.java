package com.habitparty.core.domain.enums.task;

public enum TaskType {
  HABIT("Hábito"),
  DAILY("Diária"),
  TODO("Afazer");

  private final String description;

  TaskType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
