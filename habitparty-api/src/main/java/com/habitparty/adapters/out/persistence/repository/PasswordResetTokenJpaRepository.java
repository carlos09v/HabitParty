package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.PasswordResetTokenJpaEntity;

public interface PasswordResetTokenJpaRepository extends JpaRepository<PasswordResetTokenJpaEntity, UUID> {
  Optional<PasswordResetTokenJpaEntity> findByToken(String token);

  @Modifying
  @Transactional
  @Query("UPDATE PasswordResetTokenJpaEntity t SET t.used = true WHERE t.user.id = :userId AND t.used = false")
  void invalidateActiveTokensByUserId(@Param("userId") UUID userId);

  @Modifying
  @Transactional
  @Query("DELETE FROM PasswordResetTokenJpaEntity t WHERE t.expirationDate < :threshold OR t.used = true")
  void deleteObsoleteTokens(@Param("threshold") java.time.Instant threshold);

  @Modifying
  @Query("DELETE FROM PasswordResetTokenJpaEntity t WHERE t.user.id = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
