package com.habitparty.core.domain.entities;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.habitparty.core.exceptions.UnauthorizedException;

public class Workspace {
  private UUID id;
  private UUID userId; // Chave estrangeira
  private String name;

  // Novo campo para o Eager Loading!
  private List<BoardColumn> columns = new ArrayList<>();

  public Workspace(UUID id, UUID userId, String name) {
    this.id = id;
    this.userId = userId;
    this.name = name;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  public List<BoardColumn> getColumns() {
    return columns;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }
}
