package com.habitparty.core.domain.enums;

public enum RewardType {
  SINGLE_USE("Uso único"),
  TIME_BASED("Cupom");

  private final String description;

  RewardType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
