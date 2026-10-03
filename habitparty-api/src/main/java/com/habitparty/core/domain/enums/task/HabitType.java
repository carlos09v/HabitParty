package com.habitparty.core.domain.enums.task;

public enum HabitType {
  POSITIVE("Positivo"),
  NEGATIVE("Negativo"),
  BOTH("Ambos");

  private final String description;

  HabitType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
