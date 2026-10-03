package com.habitparty.core.domain.enums.task;

public enum HabitImportanceType {
  LOW("Baixo"),
  NORMAL("Padrão"),
  HIGH("Muito");

  private final String description;

  HabitImportanceType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
