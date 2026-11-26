package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.EmailDispatchLogJpaEntity;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

public interface EmailDispatchLogJpaRepository extends JpaRepository<EmailDispatchLogJpaEntity, UUID> {

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM EmailDispatchLogJpaEntity l WHERE l.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  long countBySentAtAfter(LocalDateTime date);

  long countByStatusAndSentAtAfter(EmailDispatchStatus status, LocalDateTime date);

  long countByUserIdAndStatusAndSentAtAfter(UUID userId, EmailDispatchStatus status, LocalDateTime date);

  @Query("""
      SELECT l.userId, COUNT(l)
      FROM EmailDispatchLogJpaEntity l
      WHERE l.userId IN :userIds AND l.status = :status AND l.sentAt > :date
      GROUP BY l.userId
      """)
  List<Object[]> countByUserIdsAndStatusAndSentAtAfter(
      @Param("userIds") Collection<UUID> userIds,
      @Param("status") EmailDispatchStatus status,
      @Param("date") LocalDateTime date);

  long countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
      UUID userId,
      EmailType emailType,
      EmailDispatchStatus status,
      LocalDateTime date);

  @Query("SELECT l FROM EmailDispatchLogJpaEntity l WHERE l.userId = :userId ORDER BY l.sentAt DESC")
  List<EmailDispatchLogJpaEntity> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);
}
