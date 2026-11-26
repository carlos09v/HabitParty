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

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Transactional
  @Query("UPDATE UserTokenJpaEntity t SET t.used = true, t.usedAt = :now WHERE t.userId = :userId AND t.tokenType = :tokenType AND t.used = false")
  void invalidateActiveTokensByUserIdAndType(
      @Param("userId") UUID userId,
      @Param("tokenType") UserTokenType tokenType,
      @Param("now") Instant now);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Transactional
  @Query("DELETE FROM UserTokenJpaEntity t WHERE t.expirationDate < :threshold OR t.used = true")
  void deleteObsoleteTokens(@Param("threshold") Instant threshold);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM UserTokenJpaEntity t WHERE t.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
