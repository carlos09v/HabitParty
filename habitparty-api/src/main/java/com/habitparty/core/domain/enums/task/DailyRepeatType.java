package com.habitparty.core.domain.enums.task;

public enum DailyRepeatType {
  DAILY("Diariamente"),
  WEEKLY("Semanalmente"),
  MONTHLY("Mensalmente"),
  YEARLY("Anualmente");

  private final String description;

  DailyRepeatType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
