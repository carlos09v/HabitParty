package com.habitparty.adapters.out.persistence.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.UserTokenJpaEntity;
import com.habitparty.core.domain.enums.UserTokenType;

public interface UserTokenJpaRepository extends JpaRepository<UserTokenJpaEntity, UUID> {
  Optional<UserTokenJpaEntity> findByTokenAndTokenType(String token, UserTokenType tokenType);

  @Modifying
  @Transactional
  @Query("UPDATE UserTokenJpaEntity t SET t.used = true, t.usedAt = :now WHERE t.user.id = :userId AND t.tokenType = :tokenType AND t.used = false")
  void invalidateActiveTokensByUserIdAndType(
      @Param("userId") UUID userId,
      @Param("tokenType") UserTokenType tokenType,
      @Param("now") Instant now
  );

  @Modifying
  @Transactional
  @Query("DELETE FROM UserTokenJpaEntity t WHERE t.expirationDate < :threshold OR t.used = true")
  void deleteObsoleteTokens(@Param("threshold") Instant threshold);

  @Modifying
  @Query("DELETE FROM UserTokenJpaEntity t WHERE t.user.id = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
