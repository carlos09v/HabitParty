package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.EmailDispatchLogJpaEntity;

public interface EmailDispatchLogJpaRepository extends JpaRepository<EmailDispatchLogJpaEntity, UUID> {

  @Modifying
  @Query("DELETE FROM EmailDispatchLogJpaEntity l WHERE l.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  long countBySentAtAfter(LocalDateTime date);

  long countByUserIdAndSentAtAfter(UUID userId, LocalDateTime date);

  long countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
      UUID userId,
      com.habitparty.core.domain.enums.EmailType emailType,
      com.habitparty.core.domain.enums.EmailDispatchStatus status,
      LocalDateTime date
  );

  @Query("SELECT l FROM EmailDispatchLogJpaEntity l WHERE l.userId = :userId ORDER BY l.sentAt DESC")
  List<EmailDispatchLogJpaEntity> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);
}
