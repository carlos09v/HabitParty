package com.habitparty.application.ports;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.social.SocialNotification;

public interface SocialNotificationRepository {
  List<SocialNotification> findRecentByRecipientId(UUID recipientId, int limit);

  long countUnseenByRecipientId(UUID recipientId);

  SocialNotification save(SocialNotification notification);

  List<SocialNotification> saveAll(List<SocialNotification> notifications);

  void markAllSeenByRecipientId(UUID recipientId);

  void markSeenByIdAndRecipientId(UUID notificationId, UUID recipientId);

  void deleteAllByUserId(UUID userId);
}
