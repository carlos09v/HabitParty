package com.habitparty.application.usecases.social;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.social.SocialNotification;
import com.habitparty.core.domain.enums.SocialNotificationType;

@Service
public class ListSocialNotificationsUseCase {

  private final SocialNotificationRepository notificationRepository;
  private final UserRepository userRepository;

  public ListSocialNotificationsUseCase(
      SocialNotificationRepository notificationRepository,
      UserRepository userRepository) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
  }

  public record SocialNotificationItem(
      UUID id,
      SocialNotificationType type,
      UUID referenceId,
      String payload,
      boolean seen,
      Instant createdAt,
      UUID actorId,
      String actorUsername,
      String actorFullName,
      String actorAvatarUrl,
      String actorAvatarFrame,
      boolean actorIsPremium) {
  }

  public record SocialNotificationsResult(
      long unseenCount,
      List<SocialNotificationItem> notifications) {
  }

  @Transactional(readOnly = true)
  public SocialNotificationsResult execute(UUID recipientId, int limit) {
    return execute(recipientId, limit, false);
  }

  @Transactional(readOnly = true)
  public SocialNotificationsResult execute(UUID recipientId, int limit, boolean unseenOnly) {
    List<SocialNotification> raw = unseenOnly
        ? notificationRepository.findUnseenRecentByRecipientId(recipientId, limit)
        : notificationRepository.findRecentByRecipientId(recipientId, limit);
    long unseenCount = notificationRepository.countUnseenByRecipientId(recipientId);

    Set<UUID> actorIds = raw.stream()
        .map(SocialNotification::getActorId)
        .filter(id -> id != null)
        .collect(Collectors.toSet());

    Map<UUID, User> actorsById = new HashMap<>();
    if (!actorIds.isEmpty()) {
      userRepository.findAllByIds(actorIds).forEach(u -> actorsById.put(u.getId(), u));
    }

    List<SocialNotificationItem> items = new ArrayList<>(raw.size());
    for (SocialNotification n : raw) {
      User actor = n.getActorId() != null ? actorsById.get(n.getActorId()) : null;
      items.add(new SocialNotificationItem(
          n.getId(),
          n.getType(),
          n.getReferenceId(),
          n.getPayload(),
          n.isSeen(),
          n.getCreatedAt(),
          actor != null ? actor.getId() : n.getActorId(),
          actor != null ? actor.getUsername() : null,
          actor != null ? actor.getFullName() : null,
          actor != null ? actor.getProfilePhotoUrl().orElse(null) : null,
          actor != null ? actor.getAvatarFrame() : null,
          actor != null && actor.isPremium()));
    }

    return new SocialNotificationsResult(unseenCount, items);
  }
}
