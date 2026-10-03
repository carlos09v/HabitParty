package com.habitparty.core.domain.enums.task;

public enum HabitResetCounter {
  DAILY("Diariamente"),
  WEEKLY("Semanalmente"),
  MONTHLY("Mensalmente");

  private final String description;

  HabitResetCounter(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
