package com.habitparty.core.domain.enums;

public enum TransactionType {
  REWARD_BOUGHT("Gasto da loja"), // Reward
  TASK_COMPLETED("Ganho na task"), // Tasks
  TASK_FAILED("Falha na task"),
  BAD_HABIT_PENALTY("Penalidade de Hábito Negativo"),
  ITEM_CONSUMED("Item Consumido"), // Filtro de Mochila
  ITEM_DISCARDED("Item Descartado"), // Filtro de Mochila
  MANUAL_ADJUSTMENT("Ajuste Manual"); // Filtro de Admin

  private final String description;

  TransactionType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
