package com.habitparty.application.usecases.social;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.SocialNotificationRepository;

@Service
public class MarkSocialNotificationsSeenUseCase {

  private final SocialNotificationRepository notificationRepository;

  public MarkSocialNotificationsSeenUseCase(SocialNotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  @Transactional
  public void markAllSeen(UUID userId) {
    notificationRepository.markAllSeenByRecipientId(userId);
  }

  @Transactional
  public void markOneSeen(UUID userId, UUID notificationId) {
    if (notificationId != null) {
      notificationRepository.markSeenByIdAndRecipientId(notificationId, userId);
    }
  }
}
