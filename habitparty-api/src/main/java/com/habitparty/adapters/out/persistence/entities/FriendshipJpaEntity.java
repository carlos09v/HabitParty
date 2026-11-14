package com.habitparty.adapters.out.persistence.entities;

import java.time.Instant;
import java.util.UUID;

import com.habitparty.core.domain.enums.FriendshipStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "friendships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipJpaEntity {

  @Id
  @Column(name = "friendship_id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "requester_id", nullable = false)
  private UUID requesterId;

  @Column(name = "addressee_id", nullable = false)
  private UUID addresseeId;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private FriendshipStatus status;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "responded_at")
  private Instant respondedAt;
}
