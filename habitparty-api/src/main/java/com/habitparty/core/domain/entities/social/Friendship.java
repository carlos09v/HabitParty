package com.habitparty.core.domain.entities.social;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import com.habitparty.core.domain.enums.FriendshipStatus;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

/**
 * Representa um vínculo social entre dois usuários (convite pendente, amizade aceita ou bloqueio).
 */
public class Friendship {
  private UUID id;
  private UUID requesterId;
  private UUID addresseeId;
  private FriendshipStatus status;
  private Instant createdAt;
  private Instant respondedAt;

  public Friendship() {
  }

  public Friendship(
      UUID id,
      UUID requesterId,
      UUID addresseeId,
      FriendshipStatus status,
      Instant createdAt,
      Instant respondedAt) {
    this.id = id;
    this.requesterId = requesterId;
    this.addresseeId = addresseeId;
    this.status = status;
    this.createdAt = createdAt;
    this.respondedAt = respondedAt;
  }

  public static Friendship createPending(UUID requesterId, UUID addresseeId, Instant now) {
    validateDistinctParticipants(requesterId, addresseeId);
    Instant timestamp = now != null ? now : Instant.now();
    return new Friendship(
        UUID.randomUUID(),
        requesterId,
        addresseeId,
        FriendshipStatus.PENDING,
        timestamp,
        null);
  }

  public static Friendship createAccepted(UUID requesterId, UUID addresseeId, Instant now) {
    validateDistinctParticipants(requesterId, addresseeId);
    Instant timestamp = now != null ? now : Instant.now();
    return new Friendship(
        UUID.randomUUID(),
        requesterId,
        addresseeId,
        FriendshipStatus.ACCEPTED,
        timestamp,
        timestamp);
  }

  public static Friendship createBlocked(UUID blockerId, UUID blockedId, Instant now) {
    validateDistinctParticipants(blockerId, blockedId);
    Instant timestamp = now != null ? now : Instant.now();
    return new Friendship(
        UUID.randomUUID(),
        blockerId,
        blockedId,
        FriendshipStatus.BLOCKED,
        timestamp,
        timestamp);
  }

  private static void validateDistinctParticipants(UUID requesterId, UUID addresseeId) {
    if (requesterId == null || addresseeId == null) {
      throw new DomainValidationException("Participantes da amizade são obrigatórios.");
    }
    if (requesterId.equals(addresseeId)) {
      throw new DomainValidationException("Não é possível adicionar a si mesmo como amigo.");
    }
  }

  public boolean involves(UUID userId) {
    return userId != null && (Objects.equals(requesterId, userId) || Objects.equals(addresseeId, userId));
  }

  public UUID otherUserId(UUID userId) {
    if (Objects.equals(requesterId, userId)) {
      return addresseeId;
    }
    if (Objects.equals(addresseeId, userId)) {
      return requesterId;
    }
    throw new UnauthorizedException("Usuário não pertence a este vínculo de amizade.");
  }

  public boolean isAccepted() {
    return status == FriendshipStatus.ACCEPTED;
  }

  public boolean isPending() {
    return status == FriendshipStatus.PENDING;
  }

  public boolean isBlocked() {
    return status == FriendshipStatus.BLOCKED;
  }

  public void accept(UUID actorId, Instant now) {
    if (!Objects.equals(addresseeId, actorId)) {
      throw new UnauthorizedException("Apenas o destinatário pode aceitar a solicitação de amizade.");
    }
    if (status == FriendshipStatus.BLOCKED) {
      throw new DomainValidationException("Não é possível aceitar um vínculo bloqueado.");
    }
    if (status == FriendshipStatus.ACCEPTED) {
      throw new DomainValidationException("Esta amizade já foi aceita.");
    }
    this.status = FriendshipStatus.ACCEPTED;
    this.respondedAt = now != null ? now : Instant.now();
  }

  public void ensureCanDelete(UUID actorId) {
    if (!involves(actorId)) {
      throw new UnauthorizedException("Você não tem permissão para alterar este vínculo social.");
    }
    if (status == FriendshipStatus.BLOCKED && !Objects.equals(requesterId, actorId)) {
      throw new UnauthorizedException("Apenas quem aplicou o bloqueio pode removê-lo.");
    }
  }

  public void blockBy(UUID blockerId, Instant now) {
    if (!involves(blockerId)) {
      throw new UnauthorizedException("Usuário não pertence a este vínculo.");
    }
    UUID otherId = otherUserId(blockerId);
    this.requesterId = blockerId;
    this.addresseeId = otherId;
    this.status = FriendshipStatus.BLOCKED;
    this.respondedAt = now != null ? now : Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getRequesterId() {
    return requesterId;
  }

  public void setRequesterId(UUID requesterId) {
    this.requesterId = requesterId;
  }

  public UUID getAddresseeId() {
    return addresseeId;
  }

  public void setAddresseeId(UUID addresseeId) {
    this.addresseeId = addresseeId;
  }

  public FriendshipStatus getStatus() {
    return status;
  }

  public void setStatus(FriendshipStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getRespondedAt() {
    return respondedAt;
  }

  public void setRespondedAt(Instant respondedAt) {
    this.respondedAt = respondedAt;
  }
}
