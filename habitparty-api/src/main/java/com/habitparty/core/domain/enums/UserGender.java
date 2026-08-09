package com.habitparty.core.domain.enums;

public enum UserGender {
  MALE("Masculino"),
  FEMALE("Feminino"),
  NON_BINARY("Não-binário"),
  PREFER_NOT_TO_SAY("Prefiro não informar");

  private final String description;

  UserGender(String description) {
    this.description = description;
  }

  // Método para acessar a descrição amigável (útil para o Frontend)
  public String getDescription() {
    return description;
  }
}
