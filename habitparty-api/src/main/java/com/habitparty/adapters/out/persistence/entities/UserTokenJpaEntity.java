package com.habitparty.adapters.out.persistence.entities;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.habitparty.core.domain.enums.UserTokenType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_tokens")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class UserTokenJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "token_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(name = "token_type", nullable = false, length = 40)
  private UserTokenType tokenType;

  @Column(name = "token", nullable = false, unique = true)
  private String token;

  @Column(name = "expiration_date", nullable = false)
  private Instant expirationDate;

  @ToString.Include
  @Column(name = "used", nullable = false)
  private boolean used;

  @Column(name = "used_at")
  private Instant usedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;
}
