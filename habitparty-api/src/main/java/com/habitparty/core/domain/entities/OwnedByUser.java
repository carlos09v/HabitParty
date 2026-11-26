package com.habitparty.core.domain.entities;

import java.util.UUID;

import com.habitparty.core.exceptions.UnauthorizedException;

/**
 * Contrato comum para entidades de domínio pertencentes a um único usuário.
 * Centraliza a verificação nula-segura de posse ({@link #validateOwnership(UUID)}).
 */
public interface OwnedByUser {
  UUID getUserId();

  default void validateOwnership(UUID actorUserId) {
    UUID ownerId = getUserId();
    if (ownerId == null || !ownerId.equals(actorUserId)) {
      throw new UnauthorizedException(ownershipDeniedMessage());
    }
  }

  default String ownershipDeniedMessage() {
    return "Você não tem permissão!";
  }
}
