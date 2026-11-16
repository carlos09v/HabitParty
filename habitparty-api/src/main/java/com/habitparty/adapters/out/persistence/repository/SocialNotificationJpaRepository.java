package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.habitparty.adapters.out.persistence.entities.SocialNotificationJpaEntity;
import com.habitparty.core.domain.enums.SocialNotificationType;

@Repository
public interface SocialNotificationJpaRepository extends JpaRepository<SocialNotificationJpaEntity, UUID> {

  List<SocialNotificationJpaEntity> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

  List<SocialNotificationJpaEntity> findByRecipientIdAndSeenFalseOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

  long countByRecipientIdAndSeenFalse(UUID recipientId);

  @Modifying
  @Query("""
      UPDATE SocialNotificationJpaEntity n
      SET n.seen = TRUE
      WHERE n.recipientId = :recipientId AND n.seen = FALSE
      """)
  void markAllSeenByRecipientId(@Param("recipientId") UUID recipientId);

  @Modifying
  @Query("""
      UPDATE SocialNotificationJpaEntity n
      SET n.seen = TRUE
      WHERE n.id = :notificationId AND n.recipientId = :recipientId AND n.seen = FALSE
      """)
  void markSeenByIdAndRecipientId(
      @Param("notificationId") UUID notificationId,
      @Param("recipientId") UUID recipientId);

  @Modifying
  @Query("""
      UPDATE SocialNotificationJpaEntity n
      SET n.seen = TRUE
      WHERE n.referenceId = :referenceId AND n.notificationType = :type AND n.seen = FALSE
      """)
  void markSeenByReferenceIdAndType(
      @Param("referenceId") UUID referenceId,
      @Param("type") SocialNotificationType type);

  @Modifying
  @Query("""
      UPDATE SocialNotificationJpaEntity n
      SET n.seen = TRUE
      WHERE ((n.recipientId = :userId AND n.actorId = :otherUserId)
          OR (n.recipientId = :otherUserId AND n.actorId = :userId))
        AND n.seen = FALSE
      """)
  void markSeenBetweenUsers(
      @Param("userId") UUID userId,
      @Param("otherUserId") UUID otherUserId);

  @Modifying
  @Query("DELETE FROM SocialNotificationJpaEntity n WHERE n.recipientId = :userId OR n.actorId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
