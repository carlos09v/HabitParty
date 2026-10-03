package com.habitparty.core.domain.enums.task;

public enum DailyRepeatMonthlyOption {
  DAY_OF_THE_WEEK("Dia da semana"),
  DAY_OF_THE_MONTH("Dia do mês");

  private final String description;

  DailyRepeatMonthlyOption(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
