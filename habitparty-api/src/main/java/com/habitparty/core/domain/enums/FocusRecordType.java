package com.habitparty.core.domain.enums;

public enum FocusRecordType {
  POMO("Pomodoro"),
  STOPWATCH("Cronômetro");

  private final String description;

  FocusRecordType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
