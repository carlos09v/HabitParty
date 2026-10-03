package com.habitparty.core.domain.enums;

public enum RewardPackageLevel {
  NONE("Nenhum"),
  BASIC("Básico"),
  PREMIUM("Premium"),
  EPIC("Épico"),
  LEGENDARY("Lendário");

  private final String description;

  RewardPackageLevel(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
