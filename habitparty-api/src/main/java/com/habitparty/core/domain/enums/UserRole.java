package com.habitparty.core.domain.enums;

public enum UserRole {
  USER("Usuário Padrão"),
  ADMIN("Administrador");

  private final String description;

  UserRole(String description) {
    this.description = description;
  }

  public String getDescription() {
    return description;
  }
}
