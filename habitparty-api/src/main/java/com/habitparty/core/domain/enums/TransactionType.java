package com.habitparty.core.domain.enums;

public enum TransactionType {
  REWARD_BOUGHT("Gasto da loja"), // Reward
  HABIT_COMPLETED("Hábito Praticado"), // Hábito
  DAILY_COMPLETED("Diária Concluída"), // Diária
  TODO_COMPLETED("Afazer Concluído"), // Afazer
  TASK_COMPLETED("Ganho na task"), // Compatibilidade legada
  TASK_FAILED("Falha na task"),
  BAD_HABIT_PENALTY("Penalidade de Hábito Negativo"),
  ITEM_CONSUMED("Item Consumido"), // Filtro de Mochila
  ITEM_DISCARDED("Item Descartado"), // Filtro de Mochila
  FOCUS_COMPLETED("Sessão de Foco"), // Foco / Pomodoro
  MANUAL_ADJUSTMENT("Ajuste Manual"); // Filtro de Admin

  private final String description;

  TransactionType(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
