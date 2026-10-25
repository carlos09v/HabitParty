package com.habitparty.adapters.out.persistence.repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.RefreshTokenJpaEntity;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshTokenJpaEntity, UUID> {
  Optional<RefreshTokenJpaEntity> findByToken(String token);

  @Query("SELECT COUNT(r) FROM RefreshTokenJpaEntity r WHERE r.user.id = :userId AND r.revoked = false AND r.expirationDate > CURRENT_TIMESTAMP")
  int countActiveTokensByUserId(@Param("userId") UUID userId);

  // Encontra a sessão ativa (não revogada e ainda não expirada) mais antiga do usuário
  Optional<RefreshTokenJpaEntity> findFirstByUser_IdAndRevokedFalseAndExpirationDateAfterOrderByCreatedAtAsc(
      UUID userId,
      Instant now);

  @Modifying
  @Transactional
  @Query("DELETE FROM RefreshTokenJpaEntity r WHERE r.expirationDate < :now OR (r.revoked = true AND r.createdAt < :revokedCutoff)")
  void deleteObsoleteTokens(
      @Param("now") Instant now,
      @Param("revokedCutoff") LocalDateTime revokedCutoff);

  @Modifying
  @Query("DELETE FROM RefreshTokenJpaEntity r WHERE r.user.id = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
