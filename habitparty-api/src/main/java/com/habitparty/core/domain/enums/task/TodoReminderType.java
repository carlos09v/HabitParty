package com.habitparty.core.domain.enums.task;

public enum TodoReminderType {
  NONE("Nenhum"),
  ONE_DAY_EARLY("Um dia antes"),
  TWO_DAYS_EARLY("Dois dias antes"),
  THREE_DAYS_EARLY("Três dias antes"),
  ONE_WEEK_EARLY("Uma semana antes"),
  CUSTOM("Personalizado");

  private final String description;

  TodoReminderType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
