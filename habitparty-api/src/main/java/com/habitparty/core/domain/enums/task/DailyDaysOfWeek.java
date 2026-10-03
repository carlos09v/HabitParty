package com.habitparty.core.domain.enums.task;

public enum DailyDaysOfWeek {
  MONDAY("Segunda"),
  TUESDAY("Terça"),
  WEDNESDAY("Quarta"),
  THURSDAY("Quinta"),
  FRIDAY("Sexta"),
  SATURDAY("Sábado"),
  SUNDAY("Domingo");

  private final String description;

  DailyDaysOfWeek(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
