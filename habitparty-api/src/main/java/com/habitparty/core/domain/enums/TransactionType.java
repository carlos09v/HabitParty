package com.habitparty.core.domain.enums;

public enum TransactionType {
  EARNED("Ganho"), // Tasks
  SPENT("Gasto"), // Rewards
  MANUAL_ADJUSTMENT("Ajuste Manual"),
  ITEM_CONSUMED("Item usado"); // Inventory_Item

  private final String description;

  TransactionType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
